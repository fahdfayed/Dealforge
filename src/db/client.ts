// Database client.
//
// libSQL speaks both a local file and a hosted Turso database, so development
// and production run the same driver and the same SQL rather than one being a
// guess about the other. That matters here because the candidate search is
// built on FTS5: a Postgres production would have needed that rewritten, and
// the rewrite would only ever be exercised in production.
//
// Configuration is a single URL:
//   file:./data/dealforge.db   local development
//   libsql://<db>.turso.io     hosted, with DATABASE_AUTH_TOKEN
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { runMigrations } from "./migrations";

function resolveUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;

  // DATABASE_PATH predates this and is still what the local .env uses.
  const path = process.env.DATABASE_PATH ?? "./data/dealforge.db";
  return `file:${path}`;
}

const url = resolveUrl();

// A local file needs its directory to exist; a remote URL has no directory.
if (url.startsWith("file:")) {
  const path = url.slice("file:".length);
  if (path && path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
}

const globalForDb = globalThis as unknown as {
  libsql: Client | undefined;
  migrated: Promise<void> | undefined;
};

const client =
  globalForDb.libsql ??
  createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.libsql = client;
}

// Migrations no longer run on module load in production.
//
// They used to, which races when a platform boots several instances at once:
// each would try to apply the same migration against the same database. In
// production they are a deploy step (`npm run db:migrate`) that runs once,
// before the new version starts serving. Locally they still run on boot, where
// there is one process and the convenience is worth more than the risk.
if (process.env.NODE_ENV !== "production" && !globalForDb.migrated) {
  globalForDb.migrated = runMigrations(client).catch((err) => {
    // Logged rather than thrown so the app still boots and the error is visible
    // in the UI rather than as a blank page.
    console.error("[migrations] failed:", err);
  });
}

export const db = drizzle(client, { schema });
export const libsql = client;
