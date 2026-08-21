// Submitting a candidate to a client, and what came back.
//
// Two complaints from the review sit here. Resume quality was inconsistent,
// because what actually went to the client was whatever the recruiter had on
// their desktop — so the submitted document is stored on the submission rather
// than assumed to be the candidate's file on record. And client feedback was
// slow and vague, so feedback is a controlled shape that can be counted rather
// than free text in an inbox.
//
// Pure domain logic, no database import.

export const SUBMISSION_STATUSES = [
  "Prepared",
  "Submitted",
  "Shortlisted",
  "Interviewing",
  "Offered",
  "Placed",
  "Rejected",
  "Withdrawn",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

// Statuses where the client still owes us an answer. Used to age the ones that
// have gone quiet, which is the "delayed client feedback" problem made visible.
export const AWAITING_CLIENT: ReadonlySet<SubmissionStatus> = new Set<SubmissionStatus>([
  "Submitted",
  "Shortlisted",
  "Interviewing",
]);

export const CLOSED_STATUSES: ReadonlySet<SubmissionStatus> = new Set<SubmissionStatus>([
  "Placed",
  "Rejected",
  "Withdrawn",
]);

// A placeholder until a target is agreed. Named here so the number is in one
// place and changing it is a one-line decision rather than a hunt through the
// UI. The meeting recorded the problem but not the threshold.
export const CLIENT_FEEDBACK_CHASE_DAYS = 3;

// Why a submission failed, as a controlled list.
//
// "Client didn't like them" is not a reportable reason. These are, and they
// are the ones that change what we do next: a run of rate rejections is a
// pricing conversation, a run of skill mismatches is a calibration failure.
export const REJECTION_REASONS = [
  "Skills mismatch",
  "Experience level",
  "Rate too high",
  "Communication",
  "Availability or notice period",
  "Client cancelled the role",
  "Filled by another candidate",
  "No reason given",
  "Other",
] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

export const INTERVIEW_STAGES = [
  "Internal screening",
  "Internal technical",
  "Client screening",
  "Client technical",
  "Client final",
] as const;
export type InterviewStage = (typeof INTERVIEW_STAGES)[number];

export const RECOMMENDATIONS = ["Strong yes", "Yes", "No", "Strong no"] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

// The standardised template Ashish asked for. Every stage scores the same
// dimensions, so a client-final score means the same thing as an internal
// screening score and the two can be compared.
export const FEEDBACK_DIMENSIONS = [
  { key: "technical", label: "Technical depth" },
  { key: "domain", label: "Domain and process knowledge" },
  { key: "communication", label: "Communication" },
  { key: "problemSolving", label: "Problem solving" },
  { key: "fit", label: "Fit for the engagement" },
] as const;
export type FeedbackDimension = (typeof FEEDBACK_DIMENSIONS)[number]["key"];

export type FeedbackRatings = Partial<Record<FeedbackDimension, number>>;

export type InterviewFeedback = {
  id: string;
  submissionId: string;
  stage: InterviewStage;
  interviewer: string;
  interviewedAt: string;
  recommendation: Recommendation;
  ratings: FeedbackRatings;
  // Pointer format, as required: one observation per line, not a paragraph.
  strengths: string[];
  concerns: string[];
  notes: string;
  recordedBy: string;
  createdAt: string;
};

export type Submission = {
  id: string;
  requisitionId: string;
  candidateId: string;
  candidateName: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  submittedBy: string;
  // The document that actually went to the client.
  resumeStorageKey: string | null;
  resumeFilename: string | null;
  // What was emphasised, and on what evidence. Ashish was explicit that
  // tailoring highlights genuine experience; recording the basis is what keeps
  // that honest and reviewable.
  tailoringNotes: string;
  rateOffered: number | null;
  rateCurrency: string;
  rateUnit: string;
  clientFeedbackAt: string | null;
  clientFeedbackNotes: string;
  rejectionReason: RejectionReason | null;
  emailThreadRef: string;
  createdAt: string;
  updatedAt: string;
};

// Days a submission has been waiting on the client, or null when it is not
// their turn.
export function daysAwaitingClient(sub: Submission, now: number = Date.now()): number | null {
  if (!AWAITING_CLIENT.has(sub.status)) return null;
  const since = sub.clientFeedbackAt ?? sub.submittedAt;
  if (!since) return null;
  return (now - Date.parse(since)) / (1000 * 60 * 60 * 24);
}

export function isChaseOverdue(sub: Submission, now: number = Date.now()): boolean {
  const days = daysAwaitingClient(sub, now);
  return days != null && days > CLIENT_FEEDBACK_CHASE_DAYS;
}

// Average of whatever was scored. Returns null rather than zero when nothing
// was, so an unscored interview does not read as a bad one.
export function averageRating(ratings: FeedbackRatings): number | null {
  const values = FEEDBACK_DIMENSIONS.map((d) => ratings[d.key]).filter(
    (v): v is number => typeof v === "number"
  );
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// A submission cannot be made against a requisition whose gate has not opened.
// The whole point of the gate is that sourcing has not started yet.
export function canSubmit(requisitionStatus: string): boolean {
  return requisitionStatus === "Sourcing";
}
