import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

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
    contentSavedAt: timestamp("content_saved_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("documents_owner_email_idx").on(table.ownerEmail)],
);

export type DocumentRow = typeof documents.$inferSelect;
export type UserRow = typeof users.$inferSelect;
