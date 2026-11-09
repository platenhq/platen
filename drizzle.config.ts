import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so load .env.local the same way Next does
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
