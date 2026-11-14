import { and, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { MATCH_END, MATCH_START } from "@/lib/search-excerpt";
import { getDb } from "./index";
import { documents, users } from "./schema";

/**
 * Database bookkeeping for documents and users. Liveblocks holds the live data, so every write
 * here is best-effort: a database failure is logged and never fails the user's action. Reads
 * return nothing on failure, and callers fall back to what Liveblocks provides.
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
  previewHtml: string | null;
  pageSize: string;
  pageMargins: string;
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

export interface DocumentPreview {
  previewHtml: string | null;
  pageSize: string | null;
  pageMargins: string | null;
  contentSavedAt: string | null;
}

/**
 * Thumbnails and last-saved times for the given rooms, keyed by room id. The caller passes only
 * rooms the user can open; rooms without a row are left out.
 */
export async function getDocumentPreviews(ids: string[]): Promise<Record<string, DocumentPreview>> {
  const db = getDb();
  if (!db || ids.length === 0) return {};

  try {
    const rows = await db
      .select({
        id: documents.id,
        previewHtml: documents.previewHtml,
        pageSize: documents.pageSize,
        pageMargins: documents.pageMargins,
        contentSavedAt: documents.contentSavedAt,
      })
      .from(documents)
      .where(and(inArray(documents.id, ids), isNull(documents.deletedAt)));

    return Object.fromEntries(
      rows.map(({ id, contentSavedAt, ...preview }) => [
        id,
        { ...preview, contentSavedAt: contentSavedAt?.toISOString() ?? null },
      ]),
    );
  } catch (error) {
    console.error("[db] reading document previews failed:", error);
    return {};
  }
}

const MAX_SEARCH_TERMS = 8;
const MAX_SEARCH_RESULTS = 100;
// Only the indexed part of the text is searched (see the search_vector column)
const SEARCHED_TEXT_LENGTH = 200_000;

export interface DocumentSearchResult {
  id: string;
  /** A short passage around the match, with matches between MATCH_START and MATCH_END. */
  excerpt: string;
}

/**
 * Searches the titles and text of the given rooms. Every word matches as a prefix, so results
 * update while a word is being typed; titles also match anywhere inside. Returns null when the
 * database is unavailable, so the caller can fall back to filtering titles.
 */
export async function searchDocumentRows(
  ids: string[],
  query: string,
): Promise<DocumentSearchResult[] | null> {
  const db = getDb();
  if (!db) return null;

  const terms =
    query
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.slice(0, MAX_SEARCH_TERMS) ?? [];
  if (ids.length === 0 || terms.length === 0) return [];

  const tsQuery = sql`to_tsquery('english', ${terms.map((term) => `${term}:*`).join(" & ")})`;
  const titlePattern = `%${query.trim().replace(/[\\%_]/g, "\\$&")}%`;
  const headlineOptions = `StartSel="${MATCH_START}", StopSel="${MATCH_END}", MaxWords=24, MinWords=12, MaxFragments=1`;

  try {
    const rows = await db
      .select({
        id: documents.id,
        excerpt: sql<string>`ts_headline('english', left(coalesce(${documents.contentText}, ''), ${SEARCHED_TEXT_LENGTH}), ${tsQuery}, ${headlineOptions})`,
      })
      .from(documents)
      .where(
        and(
          inArray(documents.id, ids),
          isNull(documents.deletedAt),
          or(sql`${documents.searchVector} @@ ${tsQuery}`, ilike(documents.title, titlePattern)),
        ),
      )
      .limit(MAX_SEARCH_RESULTS);
    // Excerpts are shown on one or two lines
    return rows.map(({ id, excerpt }) => ({ id, excerpt: excerpt.replace(/\s+/g, " ").trim() }));
  } catch (error) {
    console.error("[db] searching documents failed:", error);
    return null;
  }
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
