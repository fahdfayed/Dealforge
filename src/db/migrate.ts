import "dotenv/config";
import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { runMigrations } from "./migrations";

const dbPath = process.env.DATABASE_PATH ?? "./data/dealforge.db";
mkdirSync(dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);

runMigrations(sqlite);
console.log(`Migrated ${dbPath}`);
sqlite.close();
