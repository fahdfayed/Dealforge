"use server";

import { require } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/identity";
import {
  createSubmission,
  markSubmitted,
  recordClientFeedback,
  addFeedback,
  getSubmission,
} from "@/lib/submission-repo";
import { FEEDBACK_DIMENSIONS, type FeedbackRatings, type InterviewStage, type Recommendation, type RejectionReason, type SubmissionStatus } from "@/lib/submissions";
import { makeStorageKey, putObject, SOURCE_FILE_MAX_BYTES } from "@/lib/storage";
import { newId } from "@/lib/id";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => {
  const raw = str(f, k);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

// One observation per line. Pointer format is the requirement, so the input is
// split on newlines rather than accepting a paragraph.
const lines = (f: FormData, k: string) =>
  str(f, k)
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

export async function createSubmissionAction(requisitionId: string, formData: FormData) {
  const user = await requireUser();
  require(user, "submission.create");
  const candidateId = str(formData, "candidateId");
  if (!candidateId) {
    redirect(
      `/requisitions/${requisitionId}?error=${encodeURIComponent("Choose a candidate from the repository.")}`
    );
  }

  const submissionId = newId();
  let resumeStorageKey: string | null = null;
  let resumeFilename: string | null = null;

  const file = formData.get("resume");
  if (file instanceof File && file.size > 0) {
    if (file.size > SOURCE_FILE_MAX_BYTES) throw new Error("Resume is too large.");
    const bytes = Buffer.from(await file.arrayBuffer());
    resumeStorageKey = makeStorageKey("resumes", submissionId, file.name);
    await putObject(resumeStorageKey, bytes);
    resumeFilename = file.name;
  }

  const created = await createSubmission({
    requisitionId,
    candidateId,
    submittedBy: user.name,
    tailoringNotes: str(formData, "tailoringNotes"),
    rateOffered: num(formData, "rateOffered"),
    rateCurrency: str(formData, "rateCurrency") || "AED",
    rateUnit: str(formData, "rateUnit") || "Per day",
    emailThreadRef: str(formData, "emailThreadRef"),
    resumeStorageKey,
    resumeFilename,
    submitNow: str(formData, "submitNow") === "yes",
  });

  revalidatePath(`/requisitions/${requisitionId}`);
  redirect(`/submissions/${created.id}`);
}

function done(id: string, requisitionId?: string) {
  revalidatePath(`/submissions/${id}`);
  if (requisitionId) revalidatePath(`/requisitions/${requisitionId}`);
}

export async function markSubmittedAction(id: string) {
  const user = await requireUser();
  require(user, "submission.create");
  await markSubmitted(id, user.name);
  const sub = await getSubmission(id);
  done(id, sub?.requisitionId);
}

export async function clientFeedbackAction(id: string, formData: FormData) {
  // This action had no identity check at all — it never needed the actor's
  // name, so nothing forced one. A server action is a POST endpoint like any
  // other, so "it is only reachable from a page behind the login" is not a
  // control.
  const user = await requireUser();
  require(user, "submission.recordFeedback");

  const status = str(formData, "status") as SubmissionStatus;
  const reason = (str(formData, "rejectionReason") || null) as RejectionReason | null;
  // A rejection without a reason is the vague feedback the review complained
  // about, reproduced inside the tool. Surfaced back on the page rather than
  // thrown: a routine mistake should not produce an error screen, and the app
  // already passes problems back through the query string elsewhere.
  if (status === "Rejected" && !reason) {
    redirect(
      `/submissions/${id}?error=${encodeURIComponent("Record why the client rejected them, even if the answer is 'No reason given'.")}`
    );
  }
  await recordClientFeedback({ id, status, notes: str(formData, "notes"), rejectionReason: reason });
  const sub = await getSubmission(id);
  done(id, sub?.requisitionId);
}

export async function addFeedbackAction(id: string, formData: FormData) {
  const user = await requireUser();
  require(user, "submission.recordFeedback");
  const ratings: FeedbackRatings = {};
  for (const d of FEEDBACK_DIMENSIONS) {
    const v = num(formData, `rating_${d.key}`);
    if (v != null) ratings[d.key] = v;
  }

  const strengths = lines(formData, "strengths");
  const concerns = lines(formData, "concerns");
  if (strengths.length === 0 && concerns.length === 0) {
    redirect(
      `/submissions/${id}?error=${encodeURIComponent("Record at least one strength or concern — a recommendation on its own is not feedback.")}`
    );
  }

  await addFeedback({
    submissionId: id,
    stage: str(formData, "stage") as InterviewStage,
    interviewer: str(formData, "interviewer") || user.name,
    recommendation: str(formData, "recommendation") as Recommendation,
    ratings,
    strengths,
    concerns,
    notes: str(formData, "notes"),
    recordedBy: user.name,
  });

  const sub = await getSubmission(id);
  done(id, sub?.requisitionId);
}
