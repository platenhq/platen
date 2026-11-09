// Creates a `documents` row for every existing Liveblocks room. Safe to run more than once:
// rooms that already have a row are left untouched. Content snapshots fill in as editors work.
//
// Usage: npm run db:backfill
import { neon } from "@neondatabase/serverless";
import { Liveblocks } from "@liveblocks/node";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const { DATABASE_URL, LIVEBLOCKS_SECRET_KEY } = process.env;
if (!DATABASE_URL || !LIVEBLOCKS_SECRET_KEY) {
  console.error("DATABASE_URL and LIVEBLOCKS_SECRET_KEY must be set (in .env.local)");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const liveblocks = new Liveblocks({ secret: LIVEBLOCKS_SECRET_KEY });

let created = 0;
let skipped = 0;
for await (const room of liveblocks.iterRooms({})) {
  const title = [room.metadata.title].flat()[0] || "Untitled";
  const ownerEmail = [room.metadata.email].flat()[0];
  if (!ownerEmail) {
    console.warn(`Skipping room ${room.id}: no owner email in its metadata`);
    skipped++;
    continue;
  }

  const rows = await sql`
    insert into documents (id, title, owner_email, created_at)
    values (${room.id}, ${title}, ${ownerEmail}, ${room.createdAt})
    on conflict (id) do nothing
    returning id`;
  rows.length ? created++ : skipped++;
}

console.log(`Backfill done: ${created} created, ${skipped} already present or skipped`);
