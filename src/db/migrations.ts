// Applies the SQL files in ./drizzle, tracking what has run by content hash.
//
// This is deliberately not drizzle-kit's own migrator. Both write to a table
// called __drizzle_migrations but with different shapes, so a database
// migrated by one is unreadable to the other.
//
// Runs against a libSQL client, which serves both a local file in development
// and Turso in production, so the same migration path is exercised in both
// rather than one being a guess about the other.
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import type { Client } from "@libsql/client";

export async function runMigrations(db: Client, log: (...args: unknown[]) => void = console.log): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY,
      hash TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    )
  `);

  const migrationsDir = join(process.cwd(), "drizzle");
  const migrationFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const content = readFileSync(join(migrationsDir, file), "utf-8");
    const hash = createHash("sha256").update(content).digest("hex");

    const existing = await db.execute({
      sql: "SELECT id FROM __drizzle_migrations WHERE hash = ?",
      args: [hash],
    });
    if (existing.rows.length > 0) continue;

    log("[migrations] running", file);

    // Statements are applied as one batch so a partially-applied migration
    // cannot be recorded as neither done nor pending. `batch` wraps them in a
    // transaction on the server, which is also how it works against Turso —
    // BEGIN/COMMIT issued as separate statements would not.
    const statements = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    await db.batch(
      [
        ...statements,
        {
          sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
          args: [hash, Math.floor(Date.now() / 1000)],
        },
      ],
      "write"
    );

    log("[migrations] applied", file);
  }
}
