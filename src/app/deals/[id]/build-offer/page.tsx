import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { computeProbability } from "@/lib/scoring";
import { compareOptions, computeSolutionPricing, recommendPath } from "@/lib/solution-forge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConflictBanner } from "@/components/conflict-banner";
import { loadCatalogAction, choosePathAction, updateScopeAction, saveCommercialBaseAction } from "./actions";
import type { SolutionPath } from "@/types/deal-twin";

export default async function BuildOfferPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ conflict?: string }>;
}) {
  const { id } = await params;
  const { conflict } = await searchParams;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const { twin } = deal;

  if (!twin.dealDNA.engagementType) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        Set an engagement type on the Deal Twin screen first — it determines which starter capabilities are
        available to build the offer.
      </Card>
    );
  }

  const probability = computeProbability(twin);
  const recommendation = recommendPath(twin, probability.likely);
  const options = compareOptions(twin);
  const pricing = computeSolutionPricing(twin);

  return (
    <div className="space-y-6">
      <ConflictBanner show={conflict === "1"} />

      {twin.solution.components.length === 0 ? (
        <Card>
          <CardBody className="flex items-center justify-between">
            <p className="text-sm text-slate-600">No starter capabilities loaded yet for {twin.dealDNA.engagementType}.</p>
            <form action={loadCatalogAction.bind(null, deal.id, deal.revision)}>
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                Load starter capabilities
              </button>
            </form>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader title="Choose approach" subtitle={`Recommended: ${recommendation.path} — ${recommendation.rationale}`} />
            <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {options.map((opt) => (
                <div key={opt.path} className={`rounded-lg border p-4 ${twin.solution.selectedPath === opt.path ? "border-indigo-400 bg-indigo-50/40" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{opt.path}</p>
                    {recommendation.path === opt.path && <Badge color="violet">Recommended</Badge>}
                  </div>
                  <dl className="mt-2 space-y-1 text-xs text-slate-500">
                    <div className="flex justify-between"><dt>Capabilities</dt><dd>{opt.componentCount}</dd></div>
                    <div className="flex justify-between"><dt>Effort</dt><dd>{opt.effortDays} days</dd></div>
                    <div className="flex justify-between"><dt>Scope confidence</dt><dd>{opt.scopeConfidence}</dd></div>
                    <div className="flex justify-between"><dt>Delivery risk</dt><dd>{opt.deliveryRisk}</dd></div>
                    <div className="flex justify-between"><dt>Value coverage</dt><dd>{opt.valueCoverage}%</dd></div>
                  </dl>
                  <form action={choosePathAction.bind(null, deal.id, deal.revision, opt.path as SolutionPath)} className="mt-3">
                    <button type="submit" className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      {twin.solution.selectedPath === opt.path ? "Selected" : "Select"}
                    </button>
                  </form>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Adjust scope" subtitle="Included capabilities." />
            <CardBody>
              <form action={updateScopeAction.bind(null, deal.id, deal.revision)} className="space-y-2">
                {twin.solution.components.map((c) => (
                  <label key={c.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" name="included" value={c.id} defaultChecked={c.included} className="rounded border-slate-300" />
                      {c.label} <span className="text-xs text-slate-400">({c.category}, {c.effortDays}d)</span>
                    </span>
                    <Badge color={c.priority === "Required" ? "rose" : c.priority === "Recommended" ? "amber" : "slate"}>{c.priority}</Badge>
                  </label>
                ))}
                <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                  Update scope
                </button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Set effort and sell rate" subtitle="Creates the commercial base." />
            <CardBody>
              <p className="mb-3 text-xs text-slate-500">
                Adjusted effort from included capabilities: <strong>{pricing.adjustedEffortDays} days</strong>
                {pricing.unpriced ? " (unpriced — save a commercial base to price it)" : ` — P50 ${pricing.p50} / P80 ${pricing.p80}`}
              </p>
              <form action={saveCommercialBaseAction.bind(null, deal.id, deal.revision)} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <NumField label="On-site %" name="onSitePct" defaultValue={30} />
                <NumField label="Contingency %" name="contingencyPct" defaultValue={15} />
                <NumField label="Discount %" name="discountPct" defaultValue={0} />
                <NumField label="Internal cost/day" name="internalDailyCost" defaultValue={650} />
                <NumField label="Customer rate/day" name="customerDailyRate" defaultValue={1200} />
                <div className="col-span-2 flex items-end">
                  <button type="submit" className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                    Save working offer
                  </button>
                </div>
              </form>
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Link href={`/deals/${deal.id}/proposal`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Continue to Proposal →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function NumField({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input type="number" name={name} defaultValue={defaultValue} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
    </div>
  );
}
