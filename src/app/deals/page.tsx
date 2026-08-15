import Link from "next/link";
import { listDeals } from "@/lib/deal-repo";
import { computeProbability, computeDimensions, discoveryCoverage, getSafetyMode } from "@/lib/scoring";
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

export default async function DealsPage() {
  const deals = await listDeals();

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle="What opportunity are we governing? Every Living Deal Twin currently open."
        action={
          <Link href="/deals/new" className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            New deal
          </Link>
        }
      />

      {deals.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          No deals yet. Create the first one — it starts empty by design.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {deals.map((deal) => {
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
      )}
    </div>
  );
}
