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

// Team members and workspace users.
export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("viewer"), // admin, editor, reviewer, viewer, finance, delivery
  status: text("status").notNull().default("active"), // active, inactive, pending
  passwordHash: text("password_hash"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// User sessions for authentication
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

// Deal-level access control and sharing.
export const dealAccess = sqliteTable("deal_access", {
  id: text("id").primaryKey(),
  dealId: text("deal_id").notNull(),
  userId: text("user_id").notNull(),
  accessLevel: text("access_level").notNull().default("view"), // owner, edit, review, view
  sharedAt: integer("shared_at").notNull(),
  sharedBy: text("shared_by").notNull(),
});

// Assigned responsibilities and roles on deals.
export const responsibilities = sqliteTable("responsibilities", {
  id: text("id").primaryKey(),
  dealId: text("deal_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(), // opportunity_owner, delivery_owner, finance_approver, compliance_reviewer
  assignedAt: integer("assigned_at").notNull(),
  assignedBy: text("assigned_by").notNull(),
  status: text("status").notNull().default("active"), // active, completed, transferred
});

// Segregation of Duties (SOD) rules and violations.
export const sodRules = sqliteTable("sod_rules", {
  id: text("id").primaryKey(),
  rule: text("rule").notNull().unique(), // e.g., "owner_cannot_be_approver", "single_reviewer_max_value"
  description: text("description").notNull(),
  enabled: integer("enabled").notNull().default(1),
  createdAt: integer("created_at").notNull(),
});

// SOD rule violations (audit trail).
export const sodViolations = sqliteTable("sod_violations", {
  id: text("id").primaryKey(),
  dealId: text("deal_id").notNull(),
  ruleId: text("rule_id").notNull(),
  severity: text("severity").notNull(), // error, warning
  details: text("details").notNull(),
  resolvedAt: integer("resolved_at"),
  detectedAt: integer("detected_at").notNull(),
});
