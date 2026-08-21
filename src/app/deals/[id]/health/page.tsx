import { DealFixLink } from "@/components/fix-link";
import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import {
  computeProbability,
  computeDimensions,
  discoveryCoverage,
  evidenceIntegrity,
  criticalAuthorityScore,
  getSafetyMode,
  complexityIndex,
} from "@/lib/scoring";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/meter";

export default async function HealthDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const probability = computeProbability(deal.twin);
  const dims = computeDimensions(deal.twin);
  const coverage = discoveryCoverage(deal.twin);
  const integrity = evidenceIntegrity(deal.twin);
  const criticalAuth = criticalAuthorityScore(deal.twin);
  const safety = getSafetyMode(deal.twin, probability, dims);
  const complexity = complexityIndex(deal.twin);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader title="Probability range" />
          <CardBody>
            <div className="flex items-baseline gap-4">
              <StatBig label="Low" value={probability.low} />
              <StatBig label="Likely" value={probability.likely} emphasis />
              <StatBig label="High" value={probability.high} />
              <StatBig label="Cap" value={probability.cap} />
            </div>
            <div className="mt-4">
              <Meter pct={probability.likely} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pursuit gates" />
          <CardBody className="space-y-3">
            {probability.gates.map((g) => (
              <div key={g.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{g.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{g.reason}</p>
                  {!g.complete && <DealFixLink dealId={id} fix={g.fix} />}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-slate-400">cap {g.cap}%</span>
                  <Badge color={g.complete ? "emerald" : "amber"}>{g.complete ? "Complete" : "Incomplete"}</Badge>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Dimensions" />
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DimTile label="Win" value={dims.win} />
            <DimTile label="Scope" value={dims.scope} />
            <DimTile label="Delivery" value={dims.delivery} />
            <DimTile label="Estimate" value={dims.estimate} />
            <DimTile label="Margin" value={dims.margin} />
            <DimTile label="Payment" value={dims.payment} />
            <DimTile label="Stakeholder" value={dims.stakeholder} />
            <DimTile label="Oracle" value={dims.oracle} />
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Safety mode" />
          <CardBody>
            <p className="text-sm font-semibold text-slate-800">{safety.label}</p>
            <p className="mt-1 text-xs text-slate-500">{safety.detail}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Underlying factors" />
          <CardBody className="space-y-3 text-xs">
            <Row label="Discovery coverage" value={`${coverage.pct}% (${coverage.answered}/${coverage.total})`} />
            <Row label="Evidence integrity" value={`${integrity}/100`} />
            <Row label="Critical-answer authority" value={`${criticalAuth}/100`} />
            <Row label="Complexity index" value={`${complexity}/100`} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function StatBig({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={emphasis ? "text-3xl font-semibold text-indigo-600" : "text-2xl font-semibold text-slate-700"}>{value}%</p>
    </div>
  );
}

function DimTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-800">{value}</p>
      <div className="mt-1.5">
        <Meter pct={value} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-50 py-1 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
