"use server";

import { nanoid } from "nanoid";
import { liveblocks } from "@/lib/liveblocks";
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

    revalidatePath("/");

    return JSON.parse(JSON.stringify(room));
  } catch (error) {
    console.log(`Error creating document room: ${error}`);
  }
};

export const getDocument = async ({ roomId, userId }: { roomId: string; userId: string }) => {
  try {
    const room = await liveblocks.getRoom(roomId);

    const hasAccess = Object.keys(room.usersAccesses).includes(userId);
    if (!hasAccess) {
      throw new Error("You do not have access to this document");
    }

    return JSON.parse(JSON.stringify(room));
  } catch (error) {
    console.log(`Error getting document room: ${error}`);
  }
};

export const updateDocument = async (roomId: string, title: string) => {
  try {
    const updatedRoom = await liveblocks.updateRoom(roomId, {
      metadata: { title: title },
    });

    revalidatePath(`/documents/${roomId}`);

    return JSON.parse(JSON.stringify(updatedRoom));
  } catch (error) {
    console.log(`Error updating document room: ${error}`);
  }
};

export const getDocuments = async (email: string) => {
  try {
    const rooms = await liveblocks.getRooms({ userId: email });
    return JSON.parse(JSON.stringify(rooms));
  } catch (error) {
    console.log(`Error getting document rooms: ${error}`);
    return { data: [] };
  }
};

export const updateDocumentAccess = async ({
  roomId,
  email,
  userType,
  updatedBy,
}: ShareDocumentParams) => {
  try {
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
    const room = await liveblocks.getRoom(roomId);

    if (room.metadata.email === email) {
      throw new Error("You cannot remove yourself as a collaborator");
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

export const deleteDocument = async (roomId: string) => {
  try {
    await liveblocks.deleteRoom(roomId);
    revalidatePath("/");
    redirect("/");
  } catch (error) {
    console.log(`Error deleting room ${error}`);
  }
};
