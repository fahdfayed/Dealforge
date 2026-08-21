import { requireUser } from "@/lib/identity";
import Link from "next/link";
import { listDeals } from "@/lib/deal-repo";
import { computeProbability, computeDimensions, discoveryCoverage, getSafetyMode, stageOptions } from "@/lib/scoring";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/meter";

export const dynamic = "force-dynamic";

const SAFETY_COLOR: Record<string, string> = {
  Unassessed: "slate",
  "Probability capped": "amber",
  "Commercially hot — operationally unsafe": "rose",
  "Qualify out or nurture": "slate",
  "Strategic pursuit — controlled investment": "violet",
  "Close-ready — protect the baseline": "emerald",
  "Building pursuit position": "sky",
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Every authenticated screen goes through the gate. The middleware only
  // redirects when the cookie is absent; it cannot tell a forged one from a
  // real one, so this is where a session is actually verified.
  await requireUser();
  const params = await searchParams;
  const deals = await listDeals();

  const filterStage = String(params.stage ?? "");
  const filterMinProb = params.minProb ? parseInt(String(params.minProb)) : 0;
  const filterMaxProb = params.maxProb ? parseInt(String(params.maxProb)) : 100;
  const filterMinMargin = params.minMargin ? parseInt(String(params.minMargin)) : -100;
  const filterMaxMargin = params.maxMargin ? parseInt(String(params.maxMargin)) : 100;
  const filterCountry = String(params.country ?? "");

  const filtered = deals.filter((deal) => {
    if (filterStage && deal.twin.identity.stage !== filterStage) return false;

    const prob = computeProbability(deal.twin);
    if (prob.likely < filterMinProb || prob.likely > filterMaxProb) return false;

    const margin = deal.twin.commercialHeadline.currentMargin ?? 0;
    if (margin < filterMinMargin || margin > filterMaxMargin) return false;

    if (filterCountry) {
      const countryLower = filterCountry.toLowerCase();
      if (!deal.twin.dealDNA.countries.some((c) => c.toLowerCase().includes(countryLower))) return false;
    }

    return true;
  });

  const clearFiltersApplied = filterStage || filterMinProb > 0 || filterMaxProb < 100 || filterMinMargin > -100 || filterMaxMargin < 100 || filterCountry;

  return (
    <div>
      <PageHeader
        title="Deals"
        action={
          <Link href="/deals/new" className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            New deal
          </Link>
        }
      />

      <Card className="mb-6 p-4">
        <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Stage</label>
            <select name="stage" defaultValue={filterStage} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm">
              <option value="">All stages</option>
              {stageOptions().map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Min probability %</label>
            <input type="number" name="minProb" min="0" max="100" defaultValue={filterMinProb === 0 ? "" : filterMinProb} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Max probability %</label>
            <input type="number" name="maxProb" min="0" max="100" defaultValue={filterMaxProb === 100 ? "" : filterMaxProb} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Min margin %</label>
            <input type="number" name="minMargin" min="-100" max="100" defaultValue={filterMinMargin === -100 ? "" : filterMinMargin} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Max margin %</label>
            <input type="number" name="maxMargin" min="-100" max="100" defaultValue={filterMaxMargin === 100 ? "" : filterMaxMargin} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Country</label>
            <input type="text" name="country" placeholder="e.g. UAE" defaultValue={filterCountry} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
            <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
              Apply filters
            </button>
            {clearFiltersApplied && (
              <Link href="/deals" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Clear filters
              </Link>
            )}
          </div>
        </form>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          {deals.length === 0 ? "No deals yet. Create the first one — it starts empty by design." : "No deals match your filters."}
        </Card>
      ) : (
        <div>
          <p className="mb-3 text-xs text-slate-600">{filtered.length} of {deals.length} deals</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((deal) => {
              const probability = computeProbability(deal.twin);
              const dims = computeDimensions(deal.twin);
              const coverage = discoveryCoverage(deal.twin);
              const safety = getSafetyMode(deal.twin, probability, dims);
              return (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <Card className="h-full p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{deal.twin.identity.company}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{deal.twin.identity.engagementTitle || "Untitled engagement"}</p>
                      </div>
                      <Badge color={SAFETY_COLOR[safety.label] ?? "slate"}>{safety.label}</Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">{deal.twin.identity.stage}</span>
                      {deal.twin.dealDNA.engagementType && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">{deal.twin.dealDNA.engagementType}</span>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Win position (low / likely / high)</span>
                        <span className="font-medium text-slate-700">
                          {probability.low}% / {probability.likely}% / {probability.high}%
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <Meter pct={probability.likely} />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>Discovery coverage</span>
                      <span className="font-medium text-slate-700">{coverage.pct}%</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
