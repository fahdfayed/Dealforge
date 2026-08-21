import { and, desc, eq, gte, lte, or, like, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { candidates, candidateSearches } from "@/db/schema";
import { newId } from "@/lib/id";
import { knownSkills } from "@/lib/oracle-skills";

export type Candidate = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  country: string;
  primarySkill: string;
  oracleSkills: string[];
  yearsExperience: number | null;
  currentEmployer: string;
  noticePeriodDays: number | null;
  availableFrom: string | null;
  expectedRate: number | null;
  rateCurrency: string;
  rateUnit: string;
  workAuthorisation: string;
  source: string;
  vendorName: string;
  status: string;
  ownerId: string | null;
  communicationRating: string;
  softSkillNotes: string;
  summary: string;
  tags: string[];
  resumeStorageKey: string | null;
  resumeFilename: string | null;
  hasResume: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CandidateFilters = {
  q?: string;
  skills?: string[];
  minYears?: number | null;
  maxNoticeDays?: number | null;
  availableBy?: string | null;
  maxRate?: number | null;
  country?: string;
  status?: string;
  source?: string;
};

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function rowToCandidate(row: typeof candidates.$inferSelect): Candidate {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    location: row.location,
    country: row.country,
    primarySkill: row.primarySkill,
    oracleSkills: parseJsonArray(row.oracleSkills),
    yearsExperience: row.yearsExperience,
    currentEmployer: row.currentEmployer,
    noticePeriodDays: row.noticePeriodDays,
    availableFrom: row.availableFrom ? new Date(row.availableFrom).toISOString() : null,
    expectedRate: row.expectedRate,
    rateCurrency: row.rateCurrency,
    rateUnit: row.rateUnit,
    workAuthorisation: row.workAuthorisation,
    source: row.source,
    vendorName: row.vendorName,
    status: row.status,
    ownerId: row.ownerId,
    communicationRating: row.communicationRating,
    softSkillNotes: row.softSkillNotes,
    summary: row.summary,
    tags: parseJsonArray(row.tags),
    resumeStorageKey: row.resumeStorageKey,
    resumeFilename: row.resumeFilename,
    // The extracted text is for searching, not for reading. Callers get a flag
    // so the UI can offer the original file without shipping the text with
    // every row of a result list.
    hasResume: Boolean(row.resumeStorageKey),
    createdBy: row.createdBy,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

// FTS5 treats punctuation as query syntax, so a recruiter typing an email
// address, "C#" or an unbalanced quote would get a SQLite syntax error rather
// than results. Each word is quoted as a literal and combined with AND, and a
// trailing prefix search is added to the last word so results appear while
// still typing.
export function toFtsQuery(raw: string): string | null {
  const words = raw
    .replace(/["*()]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  if (words.length === 0) return null;
  return words.map((w, i) => (i === words.length - 1 ? `"${w}"*` : `"${w}"`)).join(" AND ");
}

export async function searchCandidates(filters: CandidateFilters = {}): Promise<Candidate[]> {
  const clauses: SQL[] = [];

  const ftsQuery = filters.q ? toFtsQuery(filters.q) : null;
  if (ftsQuery) {
    clauses.push(
      sql`${candidates.id} IN (SELECT candidate_id FROM candidates_fts WHERE candidates_fts MATCH ${ftsQuery})`
    );
  }

  // Skills are stored as a JSON array. Matching is any-of, not all-of: a
  // recruiter filtering on three skills wants people who bring any of them,
  // and all-of would return nothing on most searches.
  const skills = knownSkills(filters.skills ?? []);
  if (skills.length > 0) {
    const anySkill = skills.map((s) => like(candidates.oracleSkills, `%"${s}"%`));
    const combined = or(...anySkill);
    if (combined) clauses.push(combined);
  }

  if (typeof filters.minYears === "number") clauses.push(gte(candidates.yearsExperience, filters.minYears));
  if (typeof filters.maxNoticeDays === "number")
    clauses.push(lte(candidates.noticePeriodDays, filters.maxNoticeDays));
  if (filters.availableBy) {
    const by = Date.parse(filters.availableBy);
    if (!Number.isNaN(by)) {
      // Someone with no recorded availability date is not excluded — an unknown
      // date is not evidence of being unavailable.
      clauses.push(
        or(lte(candidates.availableFrom, by), sql`${candidates.availableFrom} IS NULL`) as SQL
      );
    }
  }
  if (typeof filters.maxRate === "number") {
    clauses.push(or(lte(candidates.expectedRate, filters.maxRate), sql`${candidates.expectedRate} IS NULL`) as SQL);
  }
  if (filters.country) clauses.push(eq(candidates.country, filters.country));
  if (filters.status) clauses.push(eq(candidates.status, filters.status));
  if (filters.source) clauses.push(eq(candidates.source, filters.source));

  const rows = await db
    .select()
    .from(candidates)
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(desc(candidates.updatedAt))
    .limit(200);

  return rows.map(rowToCandidate);
}

export async function getCandidate(id: string): Promise<Candidate | null> {
  const rows = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
  return rows[0] ? rowToCandidate(rows[0]) : null;
}

// Reads the extracted text separately, since it is large and only the detail
// screen needs it.
export async function getResumeText(id: string): Promise<string> {
  const rows = await db
    .select({ resumeText: candidates.resumeText })
    .from(candidates)
    .where(eq(candidates.id, id))
    .limit(1);
  return rows[0]?.resumeText ?? "";
}

// Centralising the repository only works if the same person does not get added
// three times from three sources. Called before a create so the recruiter is
// shown who already exists rather than being blocked by a constraint.
export async function findPossibleDuplicates(input: {
  email?: string;
  phone?: string;
  fullName?: string;
}): Promise<Candidate[]> {
  const checks: SQL[] = [];
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.replace(/[\s()-]/g, "");
  const name = input.fullName?.trim();

  if (email) checks.push(sql`lower(${candidates.email}) = ${email}`);
  if (phone && phone.length >= 6) {
    checks.push(sql`replace(replace(replace(${candidates.phone}, ' ', ''), '-', ''), '(', '') LIKE ${"%" + phone.slice(-8) + "%"}`);
  }
  if (name) checks.push(sql`lower(${candidates.fullName}) = ${name.toLowerCase()}`);
  if (checks.length === 0) return [];

  const rows = await db
    .select()
    .from(candidates)
    .where(or(...checks))
    .limit(10);
  return rows.map(rowToCandidate);
}

export type CandidateInput = Omit<
  Candidate,
  "id" | "createdAt" | "updatedAt" | "hasResume" | "resumeStorageKey" | "resumeFilename"
> & {
  resumeStorageKey?: string | null;
  resumeFilename?: string | null;
  resumeText?: string;
};

function toRowValues(input: CandidateInput) {
  return {
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    location: input.location,
    country: input.country,
    primarySkill: input.primarySkill,
    oracleSkills: JSON.stringify(knownSkills(input.oracleSkills)),
    yearsExperience: input.yearsExperience,
    currentEmployer: input.currentEmployer,
    noticePeriodDays: input.noticePeriodDays,
    availableFrom: input.availableFrom ? Date.parse(input.availableFrom) || null : null,
    expectedRate: input.expectedRate,
    rateCurrency: input.rateCurrency,
    rateUnit: input.rateUnit,
    workAuthorisation: input.workAuthorisation,
    source: input.source,
    vendorName: input.vendorName,
    status: input.status,
    ownerId: input.ownerId,
    communicationRating: input.communicationRating,
    softSkillNotes: input.softSkillNotes,
    summary: input.summary,
    tags: JSON.stringify(input.tags),
  };
}

// Accepts an id so the caller can store the resume under the candidate's own
// key before the row exists. Minting a second id here would file the resume
// under an identifier that matches nothing.
export async function createCandidate(input: CandidateInput, id: string = newId()): Promise<Candidate> {
  const now = Date.now();
  await db.insert(candidates).values({
    id,
    ...toRowValues(input),
    resumeStorageKey: input.resumeStorageKey ?? null,
    resumeFilename: input.resumeFilename ?? null,
    resumeText: input.resumeText ?? "",
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  });
  const created = await getCandidate(id);
  if (!created) throw new Error("Candidate was not created");
  return created;
}

export async function updateCandidate(
  id: string,
  input: CandidateInput & { resumeText?: string }
): Promise<void> {
  const values: Record<string, unknown> = { ...toRowValues(input), updatedAt: Date.now() };
  // Only overwrite the resume when a new one was supplied. A plain edit of the
  // rate or notice period must not wipe the file or its extracted text.
  if (input.resumeStorageKey !== undefined) values.resumeStorageKey = input.resumeStorageKey;
  if (input.resumeFilename !== undefined) values.resumeFilename = input.resumeFilename;
  if (input.resumeText !== undefined) values.resumeText = input.resumeText;

  await db.update(candidates).set(values).where(eq(candidates.id, id));
}

export async function logCandidateSearch(input: {
  searchedBy: string;
  query: string;
  filters: CandidateFilters;
  resultCount: number;
  requisitionId?: string | null;
}): Promise<void> {
  await db.insert(candidateSearches).values({
    id: newId(),
    searchedBy: input.searchedBy,
    query: input.query,
    filters: JSON.stringify(input.filters),
    resultCount: input.resultCount,
    requisitionId: input.requisitionId ?? null,
    createdAt: Date.now(),
  });
}

export type SearchLogEntry = {
  id: string;
  searchedBy: string;
  query: string;
  resultCount: number;
  createdAt: string;
};

export async function recentSearches(limit = 20): Promise<SearchLogEntry[]> {
  const rows = await db
    .select()
    .from(candidateSearches)
    .orderBy(desc(candidateSearches.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    searchedBy: r.searchedBy,
    query: r.query,
    resultCount: r.resultCount,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

// Weekly numbers for TA governance: how much the repository is actually being
// used, and how often a search comes back empty, which is the signal that the
// repository is too thin for the roles being worked.
export async function searchMetrics(sinceDays = 7): Promise<{
  searches: number;
  emptyResults: number;
  distinctRecruiters: number;
  candidatesAdded: number;
}> {
  const since = Date.now() - sinceDays * 24 * 60 * 60 * 1000;
  const rows = await db.select().from(candidateSearches).where(gte(candidateSearches.createdAt, since));
  const added = await db.select().from(candidates).where(gte(candidates.createdAt, since));
  return {
    searches: rows.length,
    emptyResults: rows.filter((r) => r.resultCount === 0).length,
    distinctRecruiters: new Set(rows.map((r) => r.searchedBy).filter(Boolean)).size,
    candidatesAdded: added.length,
  };
}
