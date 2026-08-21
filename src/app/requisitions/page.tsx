import Link from "next/link";
import { listRequisitions, requisitionMetrics, searchedRequisitionIds } from "@/lib/requisition-repo";
import { slaStates, nextStep } from "@/lib/requisitions";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { StatTile } from "@/components/ui/meter";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  Raised: "amber",
  Acknowledged: "sky",
  Calibrated: "sky",
  "Resourcing checked": "violet",
  Sourcing: "emerald",
  "Returned to sales": "rose",
  Filled: "emerald",
  "On hold": "slate",
  Cancelled: "slate",
};

// Mirrors the anchors on the requisition screen, so a breach in the list lands
// on the section that clears it rather than the top of the page.
const SLA_ANCHOR: Record<string, string> = {
  acknowledge: "acknowledge",
  calibration: "calibration",
  decision: "decision",
  firstProfile: "submissions",
};

export default async function RequisitionsPage() {
  const [reqs, metrics, searched] = await Promise.all([
    listRequisitions(),
    requisitionMetrics(7),
    searchedRequisitionIds(),
  ]);

  return (
    <div>
      <PageHeader
        title="Requisitions"
        action={
          <Link
            href="/requisitions/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Raise requisition
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatTile label="Raised this week" value={String(metrics.raised)} />
        <StatTile label="Acknowledged" value={String(metrics.acknowledged)} />
        <StatTile label="Decided" value={String(metrics.decided)} />
        <StatTile
          label="Go rate"
          value={metrics.goRate == null ? "—" : `${Math.round(metrics.goRate * 100)}%`}
        />
        <StatTile label="Open sourcing" value={String(metrics.openSourcing)} />
      </div>

      {reqs.length === 0 ? (
        <EmptyState icon="📋" title="No requisitions yet" />
      ) : (
        <div className="space-y-3">
          {reqs.map((r) => {
            const slas = slaStates(r);
            const breached = slas.filter((s) => s.status === "breached");
            const step = nextStep(r, searched.has(r.id));
            return (
              <Card key={r.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/requisitions/${r.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
                      >
                        {r.reference} · {r.roleTitle}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[r.accountName, r.primarySkill, [r.location, r.country].filter(Boolean).join(", ")]
                          .filter(Boolean)
                          .join(" · ") || "No details recorded"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.priority !== "Normal" && <Badge color="rose">{r.priority}</Badge>}
                      <Badge color={STATUS_COLOR[r.status] ?? "slate"}>{r.status}</Badge>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 tabular-nums">
                    <span>{r.positions} {r.positions === 1 ? "position" : "positions"}</span>
                    {r.minYears != null && <span>{r.minYears}+ yrs</span>}
                    {r.budgetRate != null && (
                      <span>
                        {r.budgetCurrency} {r.budgetRate.toLocaleString()} {r.budgetRateUnit.toLowerCase()}
                      </span>
                    )}
                    {r.startBy && <span>start by {r.startBy.slice(0, 10)}</span>}
                  </div>

                  {step && (
                    <p className="mt-2 text-xs text-slate-600">
                      Next: <span className="font-medium">{step}</span>
                    </p>
                  )}

                  {breached.length > 0 && (
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs font-medium text-rose-600">
                      <span>
                        {breached.length} SLA {breached.length === 1 ? "breach" : "breaches"}:
                      </span>
                      {breached.map((bch) => (
                        <Link
                          key={bch.key}
                          href={`/requisitions/${r.id}#${SLA_ANCHOR[bch.key] ?? ""}`}
                          className="underline underline-offset-2 hover:text-rose-700"
                        >
                          {bch.label}
                        </Link>
                      ))}
                    </p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
