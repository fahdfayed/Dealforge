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
import { mkdirSync, readFileSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { createHash } from "crypto";

const globalForDb = globalThis as unknown as { sqlite: Database.Database | undefined };

const dbPath = process.env.DATABASE_PATH ?? "./data/dealforge.db";
mkdirSync(dirname(dbPath), { recursive: true });
const sqlite = globalForDb.sqlite ?? new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

// Run migrations automatically
function runMigrations(db: Database.Database) {
  try {
    // Ensure migrations table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INTEGER PRIMARY KEY,
        hash TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      )
    `);

    // Get list of migration files
    const migrationsDir = join(process.cwd(), "drizzle");
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    console.log("[migrations] Found migration files:", migrationFiles);

    // Run each migration
    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      const content = readFileSync(filePath, "utf-8");
      const hash = createHash("sha256").update(content).digest("hex");

      const existing = db
        .prepare("SELECT id FROM __drizzle_migrations WHERE hash = ?")
        .get(hash);

      if (!existing) {
        console.log("[migrations] Running migration:", file);
        db.exec(content);
        db.prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)").run(
          hash,
          Math.floor(Date.now() / 1000)
        );
        console.log("[migrations] ✓ Completed:", file);
      } else {
        console.log("[migrations] ✓ Already run:", file);
      }
    }
  } catch (error) {
    console.error("[migrations] Error running migrations:", error);
    throw error;
  }
}

// Run migrations immediately on module load
try {
  runMigrations(sqlite);
  console.log("[migrations] All migrations completed successfully");
} catch (err) {
  console.error("[migrations] Failed to run migrations:", err);
  // Don't throw - allow app to start even if migrations fail,
  // the error logs will help debug
}

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
