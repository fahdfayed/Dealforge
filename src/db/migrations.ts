// Applies the SQL files in ./drizzle, tracking what has run by content hash.
//
// This is deliberately not drizzle-kit's own migrator. Both write to a table
// called __drizzle_migrations but with different shapes, so a database
// migrated by one is unreadable to the other — running drizzle-kit's migrator
// against a database this has touched fails with "table deal_states already
// exists". This is the one runner; src/db/client.ts calls it on module load
// and src/db/migrate.ts calls it for the `npm run db:migrate` script.
import Database from "better-sqlite3";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

export function runMigrations(db: Database.Database, log = console.log): void {
  db.exec(`
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

  const findByHash = db.prepare("SELECT id FROM __drizzle_migrations WHERE hash = ?");
  const record = db.prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)");

  for (const file of migrationFiles) {
    const content = readFileSync(join(migrationsDir, file), "utf-8");
    const hash = createHash("sha256").update(content).digest("hex");
    if (findByHash.get(hash)) continue;

    log("[migrations] running", file);
    // Each file is applied atomically: a partially-applied migration would be
    // recorded as neither done nor pending and would need manual repair.
    db.exec("BEGIN");
    try {
      db.exec(content);
      record.run(hash, Math.floor(Date.now() / 1000));
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
    log("[migrations] applied", file);
  }
}
