import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

let database: Database | null | undefined;

/**
 * The database, or null when `DATABASE_URL` is not set. Liveblocks holds the live documents, so
 * everything stored here is secondary: callers skip their write instead of failing the request.
 * Created on first use so builds and environments without a database still run.
 */
export function getDb(): Database | null {
  if (database !== undefined) return database;

  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      console.error("[db] DATABASE_URL is not set; document rows and snapshots are not saved");
    }
    database = null;
    return database;
  }

  database = drizzle(neon(url), { schema });
  return database;
}

export { schema };
