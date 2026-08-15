// Drizzle schema written against sqlite-core so the same table definitions
// and queries work unmodified against Cloudflare D1 in production (see
// src/db/client.ts) and against better-sqlite3 in local development.
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// The Living Deal Twin is stored as one serialized, revision-controlled
// record per opportunity (doc section 3.2 / 15.2) rather than spread across
// many normalized tables. `payload` holds the full DealTwin JSON (see
// src/types/deal-twin.ts). `company` is denormalized for listing/search.
export const dealStates = sqliteTable("deal_states", {
  id: text("id").primaryKey(),
  company: text("company").notNull(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(1),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Uploaded/pasted evidence-source records (section 4.4 / 15.2). No AI
// findings are ever written here — findings/impactSnapshots stay empty
// until a real model gateway and approval policy exist.
export const radarIntakes = sqliteTable("radar_intakes", {
  id: text("id").primaryKey(),
  dealId: text("deal_id").notNull(),
  sourceClass: text("source_class").notNull(),
  storageKey: text("storage_key"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  reviewState: text("review_state").notNull().default("stored"),
  textExcerpt: text("text_excerpt"),
  findings: text("findings").notNull().default("[]"),
  impactSnapshots: text("impact_snapshots").notNull().default("[]"),
  createdAt: integer("created_at").notNull(),
});

// Reusable Proof Vault records (section 10.1 / 15.2).
export const proofAssets = sqliteTable("proof_assets", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  tags: text("tags").notNull().default("[]"),
  access: text("access").notNull().default("public"),
  summary: text("summary").notNull(),
  whatItProves: text("what_it_proves").notNull().default(""),
  storageKey: text("storage_key"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
