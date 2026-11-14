import { sql, type SQL } from "drizzle-orm";
import { customType, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/**
 * Signed-in users, upserted from the Liveblocks auth route on each connect. Access is still keyed
 * by email, matching Liveblocks `usersAccesses`.
 */
export const users = pgTable("users", {
  /** Clerk user id. */
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  color: text("color"),
  ...timestamps,
});

/**
 * One row per Liveblocks room. Liveblocks holds the live document; these columns hold the latest
 * snapshot saved by an editor, for previews, search, exports and history. Access is decided by
 * the room, never by this table.
 */
export const documents = pgTable(
  "documents",
  {
    /** The Liveblocks room id. */
    id: text("id").primaryKey(),
    title: text("title").notNull().default("Untitled"),
    ownerEmail: text("owner_email").notNull(),
    /** Serialized Lexical editor state. */
    contentJson: jsonb("content_json"),
    contentText: text("content_text"),
    contentHtml: text("content_html"),
    /** HTML of the document's opening blocks, for the dashboard thumbnail. */
    previewHtml: text("preview_html"),
    /** Paper size and margins when the snapshot was saved, so the thumbnail matches the page. */
    pageSize: text("page_size"),
    pageMargins: text("page_margins"),
    contentSavedAt: timestamp("content_saved_at", { withTimezone: true }),
    /**
     * Full-text search over the title (ranked higher) and the text. Only the first 200,000
     * characters of text are indexed, which keeps very long documents under Postgres' limit.
     */
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      (): SQL =>
        sql`setweight(to_tsvector('english', coalesce(${documents.title}, '')), 'A') || setweight(to_tsvector('english', left(coalesce(${documents.contentText}, ''), 200000)), 'B')`,
    ),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("documents_owner_email_idx").on(table.ownerEmail),
    index("documents_search_vector_idx").using("gin", table.searchVector),
  ],
);

export type DocumentRow = typeof documents.$inferSelect;
export type UserRow = typeof users.$inferSelect;
