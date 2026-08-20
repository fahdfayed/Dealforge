// Local development driver: better-sqlite3 against a file database.
//
// The schema in ./schema.ts is written with drizzle-orm/sqlite-core, the
// same builder consumed by drizzle-orm/d1. In a Cloudflare Pages/Workers
// deployment, replace this file's export with:
//
//   import { drizzle } from "drizzle-orm/d1";
//   export const db = drizzle(env.DB, { schema });
//
// where `env.DB` is the D1 binding declared in wrangler.toml. No such
// binding exists in this container, so that swap is left as a deployment
// step rather than faked here.
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { runMigrations } from "./migrations";

const globalForDb = globalThis as unknown as { sqlite: Database.Database | undefined };

const dbPath = process.env.DATABASE_PATH ?? "./data/dealforge.db";
mkdirSync(dirname(dbPath), { recursive: true });
const sqlite = globalForDb.sqlite ?? new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

// Applied on module load so a dev server always starts against a current
// schema. Failures are logged rather than thrown: the app should still boot so
// the error is visible in the UI rather than as a blank page.
try {
  runMigrations(sqlite);
} catch (err) {
  console.error("[migrations] failed:", err);
}

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
