import { liveblocks, withTimeout } from "@/lib/liveblocks";
import { getSessionUser, type SessionUser } from "./session";

/** "write": editors and the owner. "owner": the user who created the document. */
export type RoomAccessLevel = "write" | "owner";

/**
 * Throws unless the signed-in user has the given access to the room. Server actions are public
 * endpoints that can be called with any room id, so every action that changes a room calls this
 * first instead of trusting the UI to hide the control.
 */
export async function requireRoomAccess(
  roomId: string,
  level: RoomAccessLevel,
): Promise<{ user: SessionUser; metadata: RoomMetadata }> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const room = await withTimeout(liveblocks.getRoom(roomId));
  const metadata = room.metadata as RoomMetadata;
  const isOwner = metadata.email === user.email;
  const canWrite = room.usersAccesses[user.email]?.includes("room:write") ?? false;

  if (level === "owner" ? !isOwner : !(isOwner || canWrite)) {
    throw new Error(`Missing ${level} access to this document`);
  }
  return { user, metadata };
}
