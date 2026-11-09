import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { documents, users } from "./schema";

/**
 * Database bookkeeping for documents and users. Liveblocks holds the live data, so every write
 * here is best-effort: a database failure is logged and never fails the user's action.
 */
async function bestEffort(label: string, write: () => Promise<unknown>): Promise<void> {
  try {
    await write();
  } catch (error) {
    console.error(`[db] ${label} failed:`, error);
  }
}

export async function recordDocumentCreated(input: {
  id: string;
  title: string;
  ownerEmail: string;
}): Promise<void> {
  const db = getDb();
  if (!db) return;
  await bestEffort("recording a new document", () =>
    db.insert(documents).values(input).onConflictDoNothing(),
  );
}

export async function recordDocumentTitle(id: string, title: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await bestEffort("renaming a document", () =>
    db.update(documents).set({ title }).where(eq(documents.id, id)),
  );
}

export async function recordDocumentDeleted(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await bestEffort("marking a document deleted", () =>
    db.update(documents).set({ deletedAt: new Date() }).where(eq(documents.id, id)),
  );
}

export interface DocumentSnapshot {
  contentJson: unknown;
  contentText: string;
  contentHtml: string;
}

/**
 * Stores the latest snapshot of a document, creating its row if the backfill has not run yet.
 * An empty snapshot never replaces a non-empty one: a document saved before it finished loading
 * looks empty, and overwriting would lose the stored copy. A document emptied on purpose keeps
 * its last non-empty snapshot until it gets content again.
 */
export async function saveDocumentSnapshotRow(
  room: { id: string; title: string; ownerEmail: string },
  snapshot: DocumentSnapshot,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  await bestEffort("saving a document snapshot", async () => {
    if (!snapshot.contentText.trim()) {
      const [existing] = await db
        .select({ contentText: documents.contentText })
        .from(documents)
        .where(eq(documents.id, room.id));
      if (existing?.contentText?.trim()) return;
    }

    const content = { ...snapshot, contentSavedAt: new Date() };
    await db
      .insert(documents)
      .values({ ...room, ...content })
      .onConflictDoUpdate({ target: documents.id, set: { ...content, title: room.title } });
  });
}

export async function upsertUser(user: {
  id: string;
  email: string;
  name: string;
  avatar: string;
  color: string;
}): Promise<void> {
  const db = getDb();
  if (!db) return;
  await bestEffort("saving the signed-in user", () =>
    db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: { email: user.email, name: user.name, avatar: user.avatar, color: user.color },
      }),
  );
}
