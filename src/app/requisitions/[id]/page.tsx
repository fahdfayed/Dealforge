import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRequisition,
  requisitionHistory,
  hasLoggedSearch,
} from "@/lib/requisition-repo";
import {
  slaStates,
  gateRequirements,
  canOpenSourcing,
  nextStep,
  RESOURCING_OUTCOMES,
  REQUISITION_STATUSES,
  STEP_OWNERS,
} from "@/lib/requisitions";
import {
  acknowledgeAction,
  calibrationAction,
  resourcingCheckAction,
  decisionAction,
  openSourcingAction,
  firstProfileAction,
  statusAction,
} from "../actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function hours(n: number | null): string {
  if (n == null) return "";
  if (n < 1) return `${Math.round(n * 60)}m`;
  return `${Math.round(n)}h`;
}

export default async function RequisitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const req = await getRequisition(id);
  if (!req) notFound();

  const [searched, history] = await Promise.all([hasLoggedSearch(id), requisitionHistory(id)]);
  const gate = gateRequirements(req, searched);
  const open = canOpenSourcing(req, searched);
  const slas = slaStates(req);
  const step = nextStep(req, searched);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`${req.reference} · ${req.roleTitle}`}
        action={
          <Link href="/requisitions" className="text-sm text-slate-600 hover:text-slate-900">
            Back to requisitions
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge color="violet">{req.status}</Badge>
        {req.priority !== "Normal" && <Badge color="rose">{req.priority}</Badge>}
        <span>
          {req.accountName || "No client recorded"} · {req.positions}{" "}
          {req.positions === 1 ? "position" : "positions"}
        </span>
        <span>Raised by {req.raisedBy || "unknown"} on {req.raisedAt.slice(0, 10)}</span>
      </div>

      {step && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-700">
            Next: <span className="font-medium">{step}</span>
          </p>
        </div>
      )}

      {/* ---- SLA clocks ---- */}
      <Card className="mb-6">
        <CardHeader title="Turnaround" subtitle="Measured from when the requirement was raised" />
        <CardBody className="space-y-2">
          {slas.map((s) => (
            <div key={s.key} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="text-slate-700">
                {s.label}
                <span className="ml-2 text-xs text-slate-400">{s.owner}</span>
              </span>
              <span
                className={
                  s.status === "breached"
                    ? "text-xs font-medium text-rose-600"
                    : s.status === "met"
                      ? "text-xs font-medium text-emerald-600"
                      : s.status === "due"
                        ? "text-xs font-medium text-amber-600"
                        : "text-xs text-slate-400"
                }
              >
                {s.status === "met" && `Met${s.metAt ? ` on ${s.metAt.slice(0, 10)}` : ""}`}
                {s.status === "due" && `${hours(s.hoursRemaining)} left`}
                {s.status === "breached" &&
                  (s.metAt ? `Late by ${hours(s.hoursLate)}` : `Overdue by ${hours(s.hoursLate)}`)}
                {s.status === "not started" && "Not started"}
              </span>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* ---- the gate ---- */}
      <Card className={`mb-6 ${open ? "border-emerald-200" : "border-amber-200"}`}>
        <CardHeader
          title="Sourcing gate"
          subtitle={open ? "Every requirement met" : `${gate.filter((g) => !g.met).length} outstanding`}
        />
        <CardBody className="space-y-3">
          {gate.map((g) => (
            <div key={g.id} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  g.met ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                }`}
              >
                {g.met ? "✓" : ""}
              </span>
              <div className="min-w-0">
                <p className={`text-sm ${g.met ? "text-slate-700" : "font-medium text-slate-900"}`}>
                  {g.label}
                </p>
                <p className="text-xs text-slate-500">{g.detail}</p>
                {g.id === "searched" && !g.met && (
                  <Link
                    href={`/candidates?for=${req.id}&skill=${encodeURIComponent(req.primarySkill)}`}
                    className="text-xs font-medium text-indigo-600 underline underline-offset-2"
                  >
                    Search the repository for this role
                  </Link>
                )}
              </div>
            </div>
          ))}

          {req.status !== "Sourcing" && (
            <form action={openSourcingAction.bind(null, req.id)} className="border-t border-slate-100 pt-3">
              <button
                type="submit"
                disabled={!open}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                Open sourcing
              </button>
              {!open && (
                <span className="ml-3 text-xs text-slate-500">
                  Blocked until every requirement above is met.
                </span>
              )}
            </form>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---- acknowledge ---- */}
        <Card>
          <CardHeader title="Acknowledge" subtitle={STEP_OWNERS.acknowledge} />
          <CardBody>
            {req.acknowledgedAt ? (
              <p className="text-sm text-slate-600">
                Acknowledged by {req.acknowledgedBy} on {req.acknowledgedAt.slice(0, 10)}.
              </p>
            ) : (
              <form action={acknowledgeAction.bind(null, req.id)}>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Acknowledge requirement
                </button>
              </form>
            )}
          </CardBody>
        </Card>

        {/* ---- calibration ---- */}
        <Card>
          <CardHeader title="Calibration call" subtitle={STEP_OWNERS.calibration} />
          <CardBody>
            {req.calibratedAt ? (
              <div className="space-y-1 text-sm text-slate-600">
                <p>Held on {req.calibratedAt.slice(0, 10)}.</p>
                {req.calibrationParticipants.length > 0 && (
                  <p className="text-xs text-slate-500">
                    With {req.calibrationParticipants.join(", ")}
                  </p>
                )}
                {req.calibrationNotes && <p className="text-xs text-slate-500">{req.calibrationNotes}</p>}
              </div>
            ) : (
              <form action={calibrationAction.bind(null, req.id)} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Participants (comma separated)
                  </label>
                  <input
                    name="participants"
                    placeholder="Recruiter, sales owner, practice head"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    What was agreed
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Refinements to the JD, budget or expectations."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Record calibration
                </button>
              </form>
            )}
          </CardBody>
        </Card>

        {/* ---- resourcing check ---- */}
        <Card>
          <CardHeader title="Resourcing check" subtitle={STEP_OWNERS.resourcingCheck} />
          <CardBody>
            {req.resourcingCheckedAt ? (
              <div className="space-y-1 text-sm text-slate-600">
                <p>
                  {req.resourcingOutcome} — checked by {req.resourcingCheckedBy} on{" "}
                  {req.resourcingCheckedAt.slice(0, 10)}.
                </p>
                {req.resourcingNotes && <p className="text-xs text-slate-500">{req.resourcingNotes}</p>}
              </div>
            ) : (
              <form action={resourcingCheckAction.bind(null, req.id)} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Can anyone already on the bench cover this before we go outside?
                </p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Outcome</label>
                  <select
                    name="outcome"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    {RESOURCING_OUTCOMES.filter((o) => o !== "Not yet checked").map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Notes</label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Record resourcing check
                </button>
              </form>
            )}
          </CardBody>
        </Card>

        {/* ---- go / no-go ---- */}
        <Card>
          <CardHeader title="Go / no-go" subtitle={STEP_OWNERS.decision} />
          <CardBody>
            {req.decision ? (
              <div className="space-y-1 text-sm text-slate-600">
                <p>
                  <span
                    className={
                      req.decision === "Go" ? "font-medium text-emerald-700" : "font-medium text-rose-700"
                    }
                  >
                    {req.decision}
                  </span>{" "}
                  by {req.decisionBy} on {req.decisionAt?.slice(0, 10)}.
                </p>
                {req.decisionReason && <p className="text-xs text-slate-500">{req.decisionReason}</p>}
                {req.decision === "No-go" && (
                  <p className="text-xs text-rose-600">Returned to sales for renegotiation.</p>
                )}
              </div>
            ) : (
              <form action={decisionAction.bind(null, req.id)} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Is this realistically fillable on the budget and timeline agreed?
                </p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Decision</label>
                  <select
                    name="decision"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="Go">Go</option>
                    <option value="No-go">No-go</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Reason (required for a no-go)
                  </label>
                  <textarea
                    name="reason"
                    rows={2}
                    placeholder="Budget below market, timeline unachievable, skill unavailable…"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Record decision
                </button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ---- first profile + status ---- */}
      {req.status === "Sourcing" && (
        <Card className="mt-6">
          <CardHeader title="First profile to client" subtitle={STEP_OWNERS.firstProfile} />
          <CardBody>
            {req.firstProfileAt ? (
              <p className="text-sm text-slate-600">Shared on {req.firstProfileAt.slice(0, 10)}.</p>
            ) : (
              <form action={firstProfileAction.bind(null, req.id)} className="space-y-3">
                <input
                  name="note"
                  placeholder="Who was shared"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Record first profile shared
                </button>
              </form>
            )}
          </CardBody>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader title="History" subtitle={`${history.length} recorded`} />
        <CardBody className="space-y-2">
          {history.length === 0 && <p className="text-sm text-slate-500">Nothing recorded yet.</p>}
          {history.map((e) => (
            <div key={e.id} className="flex flex-wrap items-baseline gap-x-3 text-xs">
              <span className="tabular-nums text-slate-400">{e.createdAt.slice(0, 16).replace("T", " ")}</span>
              <span className="font-medium text-slate-700">{e.kind}</span>
              <span className="text-slate-500">{e.actor}</span>
              {e.note && <span className="text-slate-500">— {e.note}</span>}
            </div>
          ))}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Change status" />
        <CardBody>
          <form action={statusAction.bind(null, req.id)} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
              <select
                name="status"
                defaultValue={req.status}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {REQUISITION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">Note</label>
              <input name="note" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Update
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
