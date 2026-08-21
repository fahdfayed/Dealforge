import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { submissions, interviewFeedback, candidates } from "@/db/schema";
import { newId } from "@/lib/id";
import { getRequisition, recordFirstProfile } from "@/lib/requisition-repo";
import {
  canSubmit,
  CLOSED_STATUSES,
  type FeedbackRatings,
  type InterviewFeedback,
  type InterviewStage,
  type Recommendation,
  type RejectionReason,
  type Submission,
  type SubmissionStatus,
} from "@/lib/submissions";

function parseArray(raw: string): string[] {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

function parseRatings(raw: string): FeedbackRatings {
  try {
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? (p as FeedbackRatings) : {};
  } catch {
    return {};
  }
}

const iso = (ms: number | null) => (ms == null ? null : new Date(ms).toISOString());

function rowToSubmission(row: typeof submissions.$inferSelect): Submission {
  return {
    id: row.id,
    requisitionId: row.requisitionId,
    candidateId: row.candidateId,
    candidateName: row.candidateName,
    status: row.status as SubmissionStatus,
    submittedAt: iso(row.submittedAt),
    submittedBy: row.submittedBy,
    resumeStorageKey: row.resumeStorageKey,
    resumeFilename: row.resumeFilename,
    tailoringNotes: row.tailoringNotes,
    rateOffered: row.rateOffered,
    rateCurrency: row.rateCurrency,
    rateUnit: row.rateUnit,
    clientFeedbackAt: iso(row.clientFeedbackAt),
    clientFeedbackNotes: row.clientFeedbackNotes,
    rejectionReason: (row.rejectionReason as RejectionReason | null) ?? null,
    emailThreadRef: row.emailThreadRef,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export async function listSubmissionsForRequisition(requisitionId: string): Promise<Submission[]> {
  const rows = await db
    .select()
    .from(submissions)
    .where(eq(submissions.requisitionId, requisitionId))
    .orderBy(desc(submissions.createdAt));
  return rows.map(rowToSubmission);
}

export async function listSubmissionsForCandidate(candidateId: string): Promise<Submission[]> {
  const rows = await db
    .select()
    .from(submissions)
    .where(eq(submissions.candidateId, candidateId))
    .orderBy(desc(submissions.createdAt));
  return rows.map(rowToSubmission);
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const rows = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
  return rows[0] ? rowToSubmission(rows[0]) : null;
}

export async function createSubmission(input: {
  requisitionId: string;
  candidateId: string;
  submittedBy: string;
  tailoringNotes: string;
  rateOffered: number | null;
  rateCurrency: string;
  rateUnit: string;
  emailThreadRef: string;
  resumeStorageKey?: string | null;
  resumeFilename?: string | null;
  submitNow: boolean;
}): Promise<Submission> {
  const requisition = await getRequisition(input.requisitionId);
  if (!requisition) throw new Error("Requisition not found");
  // Enforced here rather than only by hiding the form: submitting before the
  // gate opens is exactly what the gate exists to prevent.
  if (!canSubmit(requisition.status)) {
    throw new Error(
      `Sourcing has not opened for ${requisition.reference}. Complete the gate before submitting anyone.`
    );
  }

  const already = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(eq(submissions.requisitionId, input.requisitionId), eq(submissions.candidateId, input.candidateId))
    )
    .limit(1);
  if (already.length > 0) {
    throw new Error("That candidate has already been put forward for this requirement.");
  }

  const candidateRows = await db
    .select({ fullName: candidates.fullName })
    .from(candidates)
    .where(eq(candidates.id, input.candidateId))
    .limit(1);
  if (!candidateRows[0]) throw new Error("Candidate not found");

  const now = Date.now();
  const id = newId();
  await db.insert(submissions).values({
    id,
    requisitionId: input.requisitionId,
    candidateId: input.candidateId,
    candidateName: candidateRows[0].fullName,
    status: input.submitNow ? "Submitted" : "Prepared",
    submittedAt: input.submitNow ? now : null,
    submittedBy: input.submittedBy,
    resumeStorageKey: input.resumeStorageKey ?? null,
    resumeFilename: input.resumeFilename ?? null,
    tailoringNotes: input.tailoringNotes,
    rateOffered: input.rateOffered,
    rateCurrency: input.rateCurrency,
    rateUnit: input.rateUnit,
    emailThreadRef: input.emailThreadRef,
    createdAt: now,
    updatedAt: now,
  });

  if (input.submitNow) await afterSubmit(input.requisitionId, input.candidateId, input.submittedBy);

  const created = await getSubmission(id);
  if (!created) throw new Error("Submission was not created");
  return created;
}

// Stamps the requisition's first-profile SLA and moves the candidate out of
// the available pool. Both follow from a submission, so neither is left to
// someone remembering to do it.
async function afterSubmit(requisitionId: string, candidateId: string, actor: string): Promise<void> {
  await recordFirstProfile(requisitionId, actor, "First profile shared with the client");
  await db
    .update(candidates)
    .set({ status: "In process", updatedAt: Date.now() })
    .where(eq(candidates.id, candidateId));
}

export async function markSubmitted(id: string, actor: string): Promise<void> {
  const sub = await getSubmission(id);
  if (!sub) throw new Error("Submission not found");
  if (sub.submittedAt) return;

  const now = Date.now();
  await db
    .update(submissions)
    .set({ status: "Submitted", submittedAt: now, submittedBy: actor, updatedAt: now })
    .where(eq(submissions.id, id));
  await afterSubmit(sub.requisitionId, sub.candidateId, actor);
}

export async function recordClientFeedback(input: {
  id: string;
  status: SubmissionStatus;
  notes: string;
  rejectionReason: RejectionReason | null;
}): Promise<void> {
  const sub = await getSubmission(input.id);
  if (!sub) throw new Error("Submission not found");

  const now = Date.now();
  await db
    .update(submissions)
    .set({
      status: input.status,
      clientFeedbackAt: now,
      clientFeedbackNotes: input.notes,
      // Only meaningful on a rejection; clearing it otherwise stops a stale
      // reason surviving a status correction.
      rejectionReason: input.status === "Rejected" ? input.rejectionReason : null,
      updatedAt: now,
    })
    .where(eq(submissions.id, input.id));

  // The candidate's availability follows the outcome. Someone placed is not
  // available; someone rejected goes back into the pool rather than being
  // stranded in "In process" forever.
  const candidateStatus =
    input.status === "Placed" ? "Placed" : CLOSED_STATUSES.has(input.status) ? "Active" : "In process";
  await db
    .update(candidates)
    .set({ status: candidateStatus, updatedAt: now })
    .where(eq(candidates.id, sub.candidateId));
}

export async function addFeedback(input: {
  submissionId: string;
  stage: InterviewStage;
  interviewer: string;
  recommendation: Recommendation;
  ratings: FeedbackRatings;
  strengths: string[];
  concerns: string[];
  notes: string;
  recordedBy: string;
}): Promise<void> {
  const now = Date.now();
  await db.insert(interviewFeedback).values({
    id: newId(),
    submissionId: input.submissionId,
    stage: input.stage,
    interviewer: input.interviewer,
    interviewedAt: now,
    recommendation: input.recommendation,
    ratings: JSON.stringify(input.ratings),
    strengths: JSON.stringify(input.strengths),
    concerns: JSON.stringify(input.concerns),
    notes: input.notes,
    recordedBy: input.recordedBy,
    createdAt: now,
  });

  // Interviewing is where it now is, unless the client has already closed it.
  const sub = await getSubmission(input.submissionId);
  if (sub && !CLOSED_STATUSES.has(sub.status)) {
    await db
      .update(submissions)
      .set({ status: "Interviewing", updatedAt: now })
      .where(eq(submissions.id, input.submissionId));
  }
}

export async function listFeedback(submissionId: string): Promise<InterviewFeedback[]> {
  const rows = await db
    .select()
    .from(interviewFeedback)
    .where(eq(interviewFeedback.submissionId, submissionId))
    .orderBy(desc(interviewFeedback.interviewedAt));
  return rows.map((r) => ({
    id: r.id,
    submissionId: r.submissionId,
    stage: r.stage as InterviewStage,
    interviewer: r.interviewer,
    interviewedAt: new Date(r.interviewedAt).toISOString(),
    recommendation: r.recommendation as Recommendation,
    ratings: parseRatings(r.ratings),
    strengths: parseArray(r.strengths),
    concerns: parseArray(r.concerns),
    notes: r.notes,
    recordedBy: r.recordedBy,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

// How many feedback entries each submission has, for a list view that would
// otherwise need one query per row.
export async function feedbackCounts(submissionIds: string[]): Promise<Map<string, number>> {
  if (submissionIds.length === 0) return new Map();
  const rows = await db
    .select({ submissionId: interviewFeedback.submissionId })
    .from(interviewFeedback)
    .where(inArray(interviewFeedback.submissionId, submissionIds));
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.submissionId, (counts.get(r.submissionId) ?? 0) + 1);
  return counts;
}

export async function submissionMetrics(sinceDays = 7): Promise<{
  submitted: number;
  awaitingFeedback: number;
  placed: number;
  rejected: number;
  topRejectionReason: string | null;
}> {
  const since = Date.now() - sinceDays * 24 * 60 * 60 * 1000;
  const rows = await db.select().from(submissions);
  const recent = rows.filter((r) => (r.submittedAt ?? r.createdAt) >= since);

  const reasons = new Map<string, number>();
  for (const r of rows) {
    if (r.status === "Rejected" && r.rejectionReason) {
      reasons.set(r.rejectionReason, (reasons.get(r.rejectionReason) ?? 0) + 1);
    }
  }
  const top = [...reasons.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    submitted: recent.filter((r) => r.submittedAt).length,
    awaitingFeedback: rows.filter((r) => ["Submitted", "Shortlisted", "Interviewing"].includes(r.status))
      .length,
    placed: rows.filter((r) => r.status === "Placed").length,
    rejected: rows.filter((r) => r.status === "Rejected").length,
    topRejectionReason: top ? `${top[0]} (${top[1]})` : null,
  };
}
