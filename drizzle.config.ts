import "dotenv/config";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? "./data/dealforge.db",
  },
};
