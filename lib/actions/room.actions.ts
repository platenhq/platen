"use server";

import { nanoid } from "nanoid";
import { LiveblocksError, type RoomData } from "@liveblocks/node";
import { liveblocks, withTimeout } from "@/lib/liveblocks";
import { requireRoomAccess } from "@/lib/auth/room-access";
import {
  recordDocumentCreated,
  recordDocumentDeleted,
  recordDocumentTitle,
  saveDocumentSnapshotRow,
  searchDocumentRows,
} from "@/lib/db/documents";
import { sanitizeDocumentHtml, sanitizePreviewHtml } from "@/lib/html/sanitize";
import { getSessionUser } from "@/lib/auth/session";
import { DEFAULT_PAGE_SETUP, isMarginPreset, isPaperSize } from "@/lib/page-setup";
import { revalidatePath } from "next/cache";
import { getAccessType } from "@/lib/utils";
import { redirect } from "next/navigation";

export const createDoc = async ({ userId, email }: CreateDocumentParams) => {
  const roomId = nanoid();

  try {
    const metadata: RoomMetadata = {
      creatorId: userId,
      email: email,
      title: "Untitled",
    };

    const userAccesses: RoomAccesses = {
      [email]: ["room:write"],
    };

    const room = await liveblocks.createRoom(roomId, {
      metadata: metadata,
      usersAccesses: userAccesses,
      defaultAccesses: [],
    });
    await recordDocumentCreated({ id: roomId, title: metadata.title, ownerEmail: email });

    revalidatePath("/");

    return JSON.parse(JSON.stringify(room));
  } catch (error) {
    console.log(`Error creating document room: ${error}`);
  }
};

/**
 * Returns the room, or null when it does not exist or the user has no access. Throws when
 * Liveblocks cannot be reached, so the page shows a retryable error instead of redirecting.
 */
export const getDocument = async ({ roomId, userId }: { roomId: string; userId: string }) => {
  let room;
  try {
    room = await withTimeout(liveblocks.getRoom(roomId));
  } catch (error) {
    if (error instanceof LiveblocksError && error.status === 404) return null;
    console.error(`Error getting document room: ${error}`);
    throw error;
  }

  const hasAccess = Object.keys(room.usersAccesses).includes(userId);
  if (!hasAccess) return null;

  return JSON.parse(JSON.stringify(room));
};

export const updateDocument = async (roomId: string, title: string) => {
  try {
    await requireRoomAccess(roomId, "write");

    const updatedRoom = await liveblocks.updateRoom(roomId, {
      metadata: { title: title },
    });
    await recordDocumentTitle(roomId, title);

    revalidatePath(`/documents/${roomId}`);

    return JSON.parse(JSON.stringify(updatedRoom));
  } catch (error) {
    console.log(`Error updating document room: ${error}`);
  }
};

/** Every room the user can open. Liveblocks returns at most 100 rooms per request. */
async function listUserRooms(email: string): Promise<RoomData[]> {
  const rooms: RoomData[] = [];
  for await (const room of liveblocks.iterRooms({ userId: email }, { pageSize: 100 })) {
    rooms.push(room);
  }
  return rooms;
}

/**
 * Throws when Liveblocks cannot be reached, so the dashboard shows a retryable error instead of
 * an empty document list that looks like the documents are gone.
 */
export const getDocuments = async (email: string): Promise<RoomData[]> => {
  try {
    const rooms = await withTimeout(listUserRooms(email));
    return JSON.parse(JSON.stringify(rooms));
  } catch (error) {
    console.error(`Error getting document rooms: ${error}`);
    throw error;
  }
};

export const updateDocumentAccess = async ({
  roomId,
  email,
  userType,
  updatedBy,
}: ShareDocumentParams) => {
  try {
    const { metadata } = await requireRoomAccess(roomId, "write");
    // The owner's own access never changes, or an editor could demote them
    if (metadata.email === email) {
      throw new Error("The document owner's access cannot be changed");
    }

    const usersAccesses: RoomAccesses = {
      [email]: getAccessType(userType) as AccessType,
    };

    const room = await liveblocks.updateRoom(roomId, {
      usersAccesses,
    });

    if (room) {
      const notificcationId = nanoid();

      await liveblocks.triggerInboxNotification({
        userId: email,
        kind: "$documentAccess",
        subjectId: notificcationId,
        activityData: {
          userType,
          title: `You have been granted ${userType} access to the document room by ${updatedBy.name}`,
          updatedBy: updatedBy.name,
          avatar: updatedBy.avatar,
          email: updatedBy.email,
        },
        roomId: roomId,
      });
    }

    revalidatePath(`/documents/${roomId}`);

    return JSON.parse(JSON.stringify(room));
  } catch (error) {
    console.log(`Error updating room access: ${error}`);
  }
};

export const removeCollaborator = async ({ roomId, email }: { roomId: string; email: string }) => {
  try {
    const { metadata } = await requireRoomAccess(roomId, "write");

    if (metadata.email === email) {
      throw new Error("The document owner cannot be removed");
    }

    const updatedRoom = await liveblocks.updateRoom(roomId, {
      usersAccesses: {
        [email]: null,
      },
    });

    revalidatePath(`/documents/${roomId}`);

    return JSON.parse(JSON.stringify(updatedRoom));
  } catch (error) {
    console.log(`Error removing collaborator: ${error}`);
  }
};

// Liveblocks caps each metadata value at 256 characters
const PREVIEW_HEADING_MAX = 80;
const PREVIEW_EXCERPT_MAX = 240;

/** Collapses whitespace and cuts at a word boundary so the value fits room metadata. */
function clampText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut}…`;
}

/**
 * Saves an editor's snapshot of a document: the dashboard preview (first heading and opening
 * text) in room metadata, and the full content (editor JSON, plain text, HTML, the HTML of the
 * opening blocks for the thumbnail, and the page setup) in the database. HTML is sanitized here,
 * since the request comes from a browser. Only the preview fields of the metadata change; title,
 * owner and access lists are untouched. `content` is null when the document was too large to
 * send.
 */
export const saveDocumentSnapshot = async ({
  roomId,
  heading,
  excerpt,
  content,
}: {
  roomId: string;
  heading: string;
  excerpt: string;
  content: {
    json: string;
    text: string;
    html: string;
    previewHtml: string;
    pageSize: string;
    margins: string;
  } | null;
}) => {
  try {
    const { metadata } = await requireRoomAccess(roomId, "write");
    await withTimeout(
      liveblocks.updateRoom(roomId, {
        metadata: {
          previewHeading: clampText(heading, PREVIEW_HEADING_MAX),
          preview: clampText(excerpt, PREVIEW_EXCERPT_MAX),
        },
      }),
    );

    if (content) {
      await saveDocumentSnapshotRow(
        { id: roomId, title: metadata.title, ownerEmail: metadata.email },
        {
          contentJson: JSON.parse(content.json),
          contentText: content.text,
          contentHtml: sanitizeDocumentHtml(content.html),
          previewHtml: sanitizePreviewHtml(content.previewHtml),
          pageSize: isPaperSize(content.pageSize) ? content.pageSize : DEFAULT_PAGE_SETUP.pageSize,
          pageMargins: isMarginPreset(content.margins)
            ? content.margins
            : DEFAULT_PAGE_SETUP.margins,
        },
      );
    }
    return true;
  } catch (error) {
    console.log(`Error saving document snapshot: ${error}`);
    return false;
  }
};

/**
 * Searches the titles and text of the documents the signed-in user can open. Returns null when
 * search is unavailable, so the dashboard keeps filtering titles itself.
 */
export const searchDocuments = async (query: string) => {
  try {
    const user = await getSessionUser();
    if (!user) return null;

    // Access comes from Liveblocks; the database only searches within the user's rooms
    const rooms = await withTimeout(listUserRooms(user.email));
    return await searchDocumentRows(
      rooms.map((room) => room.id),
      query.slice(0, 200),
    );
  } catch (error) {
    console.error(`Error searching documents: ${error}`);
    return null;
  }
};

export const deleteDocument = async (roomId: string) => {
  try {
    await requireRoomAccess(roomId, "owner");
    await liveblocks.deleteRoom(roomId);
    await recordDocumentDeleted(roomId);
    revalidatePath("/");
    redirect("/");
  } catch (error) {
    console.log(`Error deleting room ${error}`);
  }
};
