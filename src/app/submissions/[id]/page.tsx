import { requireUser } from "@/lib/identity";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubmission, listFeedback } from "@/lib/submission-repo";
import { getRequisition } from "@/lib/requisition-repo";
import { getCandidate } from "@/lib/candidate-repo";
import {
  markSubmittedAction,
  clientFeedbackAction,
  addFeedbackAction,
} from "../actions";
import {
  FEEDBACK_DIMENSIONS,
  INTERVIEW_STAGES,
  RECOMMENDATIONS,
  REJECTION_REASONS,
  SUBMISSION_STATUSES,
  averageRating,
  daysAwaitingClient,
  isChaseOverdue,
  CLIENT_FEEDBACK_CHASE_DAYS,
} from "@/lib/submissions";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  Prepared: "slate",
  Submitted: "sky",
  Shortlisted: "violet",
  Interviewing: "amber",
  Offered: "emerald",
  Placed: "emerald",
  Rejected: "rose",
  Withdrawn: "slate",
};

const REC_COLOR: Record<string, string> = {
  "Strong yes": "emerald",
  Yes: "sky",
  No: "amber",
  "Strong no": "rose",
};

export default async function SubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  // Every authenticated screen goes through the gate. The middleware only
  // redirects when the cookie is absent; it cannot tell a forged one from a
  // real one, so this is where a session is actually verified.
  await requireUser();
  const { id } = await params;
  const { error } = await searchParams;
  const sub = await getSubmission(id);
  if (!sub) notFound();

  const [requisition, candidate, feedback] = await Promise.all([
    getRequisition(sub.requisitionId),
    getCandidate(sub.candidateId),
    listFeedback(sub.id),
  ]);

  const waiting = daysAwaitingClient(sub);
  const overdue = isChaseOverdue(sub);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={sub.candidateName}
        action={
          <Link
            href={`/requisitions/${sub.requisitionId}`}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Back to {requisition?.reference ?? "requisition"}
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge color={STATUS_COLOR[sub.status] ?? "slate"}>{sub.status}</Badge>
        {requisition && (
          <span>
            {requisition.reference} · {requisition.roleTitle} · {requisition.accountName}
          </span>
        )}
        {candidate && <Link href={`/candidates/${candidate.id}`} className="underline underline-offset-2">Candidate record</Link>}
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      {waiting != null && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            overdue ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          Waiting on the client for {Math.floor(waiting)} {Math.floor(waiting) === 1 ? "day" : "days"}
          {overdue && ` — past the ${CLIENT_FEEDBACK_CHASE_DAYS}-day chase point.`}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="What was sent" />
          <CardBody className="space-y-2 text-sm">
            <p className="text-slate-600">
              {sub.resumeFilename ? (
                <>
                  Resume sent: <span className="font-medium text-slate-800">{sub.resumeFilename}</span>
                </>
              ) : (
                <span className="text-slate-400">No tailored resume attached to this submission.</span>
              )}
            </p>
            {sub.tailoringNotes && (
              <div>
                <p className="text-xs font-medium text-slate-500">What was emphasised</p>
                <p className="text-sm text-slate-700">{sub.tailoringNotes}</p>
              </div>
            )}
            {sub.rateOffered != null && (
              <p className="text-slate-600">
                Rate offered: {sub.rateCurrency} {sub.rateOffered.toLocaleString()}{" "}
                {sub.rateUnit.toLowerCase()}
              </p>
            )}
            {sub.emailThreadRef && (
              <p className="text-xs text-slate-500">Thread: {sub.emailThreadRef}</p>
            )}
            {sub.submittedAt ? (
              <p className="text-xs text-slate-400">
                Submitted by {sub.submittedBy} on {sub.submittedAt.slice(0, 10)}
              </p>
            ) : (
              <form action={markSubmittedAction.bind(null, sub.id)} className="pt-2">
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Mark as submitted to client
                </button>
              </form>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Client response" />
          <CardBody>
            {sub.clientFeedbackAt && (
              <div className="mb-3 space-y-1 border-b border-slate-100 pb-3 text-sm">
                <p className="text-slate-700">
                  {sub.status}
                  {sub.rejectionReason && ` — ${sub.rejectionReason}`}
                </p>
                {sub.clientFeedbackNotes && (
                  <p className="text-xs text-slate-500">{sub.clientFeedbackNotes}</p>
                )}
                <p className="text-xs text-slate-400">Recorded {sub.clientFeedbackAt.slice(0, 10)}</p>
              </div>
            )}
            <form action={clientFeedbackAction.bind(null, sub.id)} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Outcome</label>
                  <select
                    name="status"
                    defaultValue={sub.status}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    {SUBMISSION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Reason (if rejected)
                  </label>
                  <select
                    name="rejectionReason"
                    defaultValue={sub.rejectionReason ?? ""}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">—</option>
                    {REJECTION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  What the client actually said
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={sub.clientFeedbackNotes}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Record client response
              </button>
            </form>
          </CardBody>
        </Card>
      </div>

      {/* ---- interview feedback ---- */}
      <Card className="mt-6">
        <CardHeader
          title="Interview feedback"
          subtitle={`${feedback.length} recorded`}
        />
        <CardBody className="space-y-4">
          {feedback.length === 0 && (
            <p className="text-sm text-slate-500">
              No feedback recorded yet. Every stage uses the same template so scores can be compared.
            </p>
          )}

          {feedback.map((f) => {
            const avg = averageRating(f.ratings);
            return (
              <div key={f.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{f.stage}</p>
                  <div className="flex items-center gap-2">
                    {avg != null && (
                      <span className="text-xs tabular-nums text-slate-500">{avg.toFixed(1)} / 5</span>
                    )}
                    <Badge color={REC_COLOR[f.recommendation] ?? "slate"}>{f.recommendation}</Badge>
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {f.interviewer} · {f.interviewedAt.slice(0, 10)}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {FEEDBACK_DIMENSIONS.map((d) => (
                    <span key={d.key} className="text-xs text-slate-500 tabular-nums">
                      {d.label}: <strong className="text-slate-700">{f.ratings[d.key] ?? "—"}</strong>
                    </span>
                  ))}
                </div>

                {f.strengths.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-emerald-700">Strengths</p>
                    <ul className="mt-0.5 list-disc pl-5 text-xs text-slate-600">
                      {f.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {f.concerns.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-amber-700">Concerns</p>
                    <ul className="mt-0.5 list-disc pl-5 text-xs text-slate-600">
                      {f.concerns.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {f.notes && <p className="mt-2 text-xs text-slate-500">{f.notes}</p>}
              </div>
            );
          })}

          <form action={addFeedbackAction.bind(null, sub.id)} className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-500">Add feedback</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Stage</label>
                <select name="stage" className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                  {INTERVIEW_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Interviewer</label>
                <input name="interviewer" className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Recommendation</label>
                <select
                  name="recommendation"
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {RECOMMENDATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {FEEDBACK_DIMENSIONS.map((d) => (
                <div key={d.key}>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{d.label}</label>
                  <select
                    name={`rating_${d.key}`}
                    defaultValue=""
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Strengths — one per line
                </label>
                <textarea
                  name="strengths"
                  rows={3}
                  placeholder={"Deep AP and AR configuration\nHandled the migration question well"}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Concerns — one per line
                </label>
                <textarea
                  name="concerns"
                  rows={3}
                  placeholder={"No recent OIC exposure\nNotice period may not suit"}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Anything else</label>
              <input name="notes" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>

            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Record feedback
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
