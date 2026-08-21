// Deploy step: apply pending migrations, then exit.
//
// Run this before the new version starts serving. It is separate from the app
// process on purpose — several instances booting at once would otherwise race
// to apply the same migration.
import "dotenv/config";
import { createClient } from "@libsql/client";
import { runMigrations } from "./migrations";

const url = process.env.DATABASE_URL ?? `file:${process.env.DATABASE_PATH ?? "./data/dealforge.db"}`;

const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });

await runMigrations(client);
console.log(`Migrated ${url.startsWith("file:") ? url : url.replace(/\/\/.*@/, "//")}`);
client.close();
