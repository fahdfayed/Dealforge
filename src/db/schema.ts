// Drizzle schema written against sqlite-core so the same table definitions
// and queries work unmodified against Cloudflare D1 in production (see
// src/db/client.ts) and against a local libSQL file in development.
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// The Living Deal Twin is stored as one serialized, revision-controlled
// record per opportunity (doc section 3.2 / 15.2) rather than spread across
// many normalized tables. `payload` holds the full DealTwin JSON (see
// src/types/deal-twin.ts). `company` is denormalized for listing/search.
export const dealStates = sqliteTable("deal_states", {
  id: text("id").primaryKey(),
  company: text("company").notNull(),
  // Nullable while existing deals are migrated onto accounts, and because a
  // deal can be created before its client is known.
  accountId: text("account_id"),
  // Denormalized from the account (or overridden per deal). Kept as a column
  // rather than read from `payload` so deals can be filtered and rolled up by
  // industry in SQL — the payload is an opaque blob to the database.
  industryId: text("industry_id"),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(1),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// A client organisation. Deals hang off an account so client-level facts —
// above all which industry they are in — are recorded once and inherited by
// every pursuit, instead of being retyped as free text on each deal.
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  industryId: text("industry_id"),
  countries: text("countries").notNull().default("[]"),
  clientType: text("client_type"),
  notes: text("notes").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// The client's sector. Authored rather than hardcoded: the engagement types we
// sell are fixed (we are an Oracle partner), but the industries we sell into
// are open-ended, so this is data.
export const industries = sqliteTable("industries", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  active: integer("active").notNull().default(1),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// What being in an industry changes about a deal: extra discovery questions,
// extra solution components, scoring weight overrides, forced gates, proof
// match tags, and which parts of the app are relevant. Stored as one JSON
// payload per industry for the same reason deal_states.payload is JSON — the
// shape is authored content, not something to query field-by-field.
export const industryPacks = sqliteTable("industry_packs", {
  industryId: text("industry_id").primaryKey(),
  payload: text("payload").notNull().default("{}"),
  revision: integer("revision").notNull().default(1),
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

// Central candidate repository (staff augmentation).
//
// Recruiters must search this before sourcing externally, so it has to be
// filterable on the things that actually decide a submission — skill, years,
// notice period, availability and rate — not just searchable as prose. Those
// live as columns; the prose lives in the FTS5 mirror created in the migration
// alongside this table.
export const candidates = sqliteTable("candidates", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  // Used to spot a duplicate before one is created. Not unique at the database
  // level: the same person legitimately reappears from a different source, and
  // a hard constraint would push recruiters into inventing addresses.
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  location: text("location").notNull().default(""),
  country: text("country").notNull().default(""),
  primarySkill: text("primary_skill").notNull().default(""),
  // JSON array, validated against the catalogue in lib/oracle-skills.ts.
  oracleSkills: text("oracle_skills").notNull().default("[]"),
  yearsExperience: integer("years_experience"),
  currentEmployer: text("current_employer").notNull().default(""),
  noticePeriodDays: integer("notice_period_days"),
  availableFrom: integer("available_from"),
  expectedRate: real("expected_rate"),
  rateCurrency: text("rate_currency").notNull().default("AED"),
  rateUnit: text("rate_unit").notNull().default("Per day"),
  workAuthorisation: text("work_authorisation").notNull().default(""),
  source: text("source").notNull().default("Inbound application"),
  vendorName: text("vendor_name").notNull().default(""),
  status: text("status").notNull().default("Active"),
  ownerId: text("owner_id"),
  communicationRating: text("communication_rating").notNull().default("Not assessed"),
  softSkillNotes: text("soft_skill_notes").notNull().default(""),
  summary: text("summary").notNull().default(""),
  tags: text("tags").notNull().default("[]"),
  resumeStorageKey: text("resume_storage_key"),
  resumeFilename: text("resume_filename"),
  // Extracted text, used for full-text search. Never shown as the candidate's
  // resume — the original file is.
  resumeText: text("resume_text").notNull().default(""),
  createdBy: text("created_by").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Every search, logged.
//
// Two reasons. The process requires the repository to be searched before
// external sourcing begins, and a rule nobody can evidence is not a rule. And
// TA governance wants weekly numbers, which have to come from something
// recorded as it happens rather than reconstructed afterwards.
export const candidateSearches = sqliteTable("candidate_searches", {
  id: text("id").primaryKey(),
  searchedBy: text("searched_by").notNull().default(""),
  query: text("query").notNull().default(""),
  filters: text("filters").notNull().default("{}"),
  resultCount: integer("result_count").notNull().default(0),
  // Set once requisitions exist, so a search can be tied to the requirement it
  // was run for.
  requisitionId: text("requisition_id"),
  createdAt: integer("created_at").notNull(),
});

// Manpower requisitions (MRFs).
//
// Sales raises one, TA acknowledges it, and it cannot reach external sourcing
// until the gate in lib/requisitions.ts is satisfied. Timestamps are columns
// rather than derived from the event log because every SLA is measured off
// them and a report should not have to replay history to answer "was this
// acknowledged in time".
export const requisitions = sqliteTable("requisitions", {
  id: text("id").primaryKey(),
  // Human reference used in conversation and email subjects: MRF-0001.
  reference: text("reference").notNull().unique(),
  accountId: text("account_id"),
  accountName: text("account_name").notNull().default(""),
  // Set when the requirement came out of a won staff augmentation deal.
  dealId: text("deal_id"),
  roleTitle: text("role_title").notNull(),
  primarySkill: text("primary_skill").notNull().default(""),
  requiredSkills: text("required_skills").notNull().default("[]"),
  positions: integer("positions").notNull().default(1),
  location: text("location").notNull().default(""),
  country: text("country").notNull().default(""),
  durationMonths: integer("duration_months"),
  budgetRate: real("budget_rate"),
  budgetCurrency: text("budget_currency").notNull().default("AED"),
  budgetRateUnit: text("budget_rate_unit").notNull().default("Per day"),
  minYears: integer("min_years"),
  startBy: integer("start_by"),
  priority: text("priority").notNull().default("Normal"),
  jobDescription: text("job_description").notNull().default(""),
  raisedBy: text("raised_by").notNull().default(""),
  salesOwner: text("sales_owner").notNull().default(""),
  taOwner: text("ta_owner").notNull().default(""),
  practiceHead: text("practice_head").notNull().default(""),
  status: text("status").notNull().default("Raised"),
  raisedAt: integer("raised_at").notNull(),
  acknowledgedAt: integer("acknowledged_at"),
  acknowledgedBy: text("acknowledged_by").notNull().default(""),
  calibratedAt: integer("calibrated_at"),
  calibrationNotes: text("calibration_notes").notNull().default(""),
  calibrationParticipants: text("calibration_participants").notNull().default("[]"),
  resourcingCheckedAt: integer("resourcing_checked_at"),
  resourcingCheckedBy: text("resourcing_checked_by").notNull().default(""),
  resourcingOutcome: text("resourcing_outcome").notNull().default("Not yet checked"),
  resourcingNotes: text("resourcing_notes").notNull().default(""),
  decision: text("decision"),
  decisionAt: integer("decision_at"),
  decisionBy: text("decision_by").notNull().default(""),
  decisionReason: text("decision_reason").notNull().default(""),
  firstProfileAt: integer("first_profile_at"),
  closedAt: integer("closed_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// What happened, when, and who did it.
//
// The columns above answer "where is this now"; this answers "how did it get
// here". Kept separate so a correction to a timestamp cannot quietly rewrite
// the history that the weekly governance numbers are drawn from.
export const requisitionEvents = sqliteTable("requisition_events", {
  id: text("id").primaryKey(),
  requisitionId: text("requisition_id").notNull(),
  kind: text("kind").notNull(),
  fromStatus: text("from_status").notNull().default(""),
  toStatus: text("to_status").notNull().default(""),
  actor: text("actor").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

// A candidate put forward to a client against a requisition.
//
// The resume that went out is stored here rather than read from the candidate
// record, because the submitted document is tailored to the requirement and
// differs from the file on the candidate. Storing it is what makes a later
// "what exactly did we send them" answerable.
export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  requisitionId: text("requisition_id").notNull(),
  candidateId: text("candidate_id").notNull(),
  // Denormalised so a submission list does not need a join, and so the record
  // still reads correctly if the candidate is later renamed.
  candidateName: text("candidate_name").notNull().default(""),
  status: text("status").notNull().default("Prepared"),
  submittedAt: integer("submitted_at"),
  submittedBy: text("submitted_by").notNull().default(""),
  resumeStorageKey: text("resume_storage_key"),
  resumeFilename: text("resume_filename"),
  tailoringNotes: text("tailoring_notes").notNull().default(""),
  rateOffered: real("rate_offered"),
  rateCurrency: text("rate_currency").notNull().default("AED"),
  rateUnit: text("rate_unit").notNull().default("Per day"),
  clientFeedbackAt: integer("client_feedback_at"),
  clientFeedbackNotes: text("client_feedback_notes").notNull().default(""),
  rejectionReason: text("rejection_reason"),
  // The mail thread this was sent on. The app is the record; this is the
  // pointer back to the conversation, not the source of truth.
  emailThreadRef: text("email_thread_ref").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Interview feedback, one row per stage, on the standard template.
export const interviewFeedback = sqliteTable("interview_feedback", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id").notNull(),
  stage: text("stage").notNull(),
  interviewer: text("interviewer").notNull().default(""),
  interviewedAt: integer("interviewed_at").notNull(),
  recommendation: text("recommendation").notNull(),
  // JSON object of dimension -> 1-5.
  ratings: text("ratings").notNull().default("{}"),
  // JSON arrays. Pointer format is required, so these are lists rather than
  // prose and cannot collapse into "good candidate, proceed".
  strengths: text("strengths").notNull().default("[]"),
  concerns: text("concerns").notNull().default("[]"),
  notes: text("notes").notNull().default(""),
  recordedBy: text("recorded_by").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});
