import "dotenv/config";

// drizzle-kit only generates SQL from the schema here; the app applies it with
// its own runner (src/db/migrations.ts). Kept on the sqlite dialect because
// Turso is SQLite — the generated DDL is the same either way.
const config = {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? `file:${process.env.DATABASE_PATH ?? "./data/dealforge.db"}`,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
};

export default config;
