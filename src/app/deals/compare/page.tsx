import Link from "next/link";
import { getDeal, listDeals } from "@/lib/deal-repo";
import { computeProbability, computeDimensions, discoveryCoverage } from "@/lib/scoring";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { DealSelector } from "./deal-selector";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const idsParam = String(params.ids ?? "");
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : [];

  if (ids.length < 2) {
    return (
      <div>
        <PageHeader title="Compare deals" subtitle="Select at least 2 deals to compare side-by-side." />
        <Card>
          <CardBody>
            <p className="mb-4 text-sm text-slate-600">
              Navigate to the <Link href="/deals" className="font-medium" style={{ color: "var(--intelloger-navy)" }}>Deals list</Link>, select deals, and come back here to compare them.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const deals = await Promise.all(ids.map((id) => getDeal(id))).then((res) => res.filter(Boolean));

  if (deals.length === 0) {
    return (
      <div>
        <PageHeader title="Compare deals" subtitle="Deals not found." />
      </div>
    );
  }

  const allDeals = await listDeals();
  const selectedIds = new Set(deals.filter((d) => d !== null).map((d) => d.id));

  return (
    <div>
      <PageHeader
        title="Compare deals"
        subtitle={`Comparing ${deals.length} deal${deals.length !== 1 ? "s" : ""}`}
      />

      {/* Deal selector */}
      <DealSelector allDeals={allDeals} selectedIds={selectedIds} />

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs text-slate-500">
              <th className="border border-slate-200 px-3 py-2 font-medium">Metric</th>
              {deals.map((deal) => (
                deal && (
                  <th key={deal.id} className="border border-slate-200 px-3 py-2 font-medium">
                    <Link href={`/deals/${deal.id}`} style={{ color: "var(--intelloger-navy)" }} className="hover:underline">
                      {deal.twin.identity.company}
                    </Link>
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Engagement", key: "engagement" },
              { label: "Stage", key: "stage" },
              { label: "Engagement type", key: "engagementType" },
              { label: "Industry", key: "industry" },
              { label: "Countries", key: "countries" },
              { label: "Win position (likely %)", key: "winLikely" },
              { label: "Win position (range)", key: "winRange" },
              { label: "Discovery coverage", key: "coverage" },
              { label: "Win score", key: "win" },
              { label: "Scope score", key: "scope" },
              { label: "Delivery score", key: "delivery" },
              { label: "Estimate score", key: "estimate" },
              { label: "Margin score", key: "margin" },
              { label: "Margin %", key: "marginPct" },
              { label: "Opportunity value", key: "opportunityValue" },
            ].map((metric) => (
              <tr key={metric.key} className="border-t border-slate-200">
                <td className="border border-slate-200 px-3 py-2 font-medium text-slate-700">{metric.label}</td>
                {deals.map((deal) => (
                  deal && (
                    <td key={deal.id} className="border border-slate-200 px-3 py-2 text-slate-600">
                      {renderMetricValue(deal, metric.key)}
                    </td>
                  )
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderMetricValue(deal: Awaited<ReturnType<typeof getDeal>>, key: string): React.ReactNode {
  if (!deal) return "—";

  const twin = deal.twin;
  const prob = computeProbability(twin);
  const dims = computeDimensions(twin);
  const coverage = discoveryCoverage(twin);

  const metrics: Record<string, React.ReactNode> = {
    engagement: twin.identity.engagementTitle || "—",
    stage: twin.identity.stage,
    engagementType: twin.dealDNA.engagementType || "—",
    industry: twin.dealDNA.industry || "—",
    countries: twin.dealDNA.countries.join(", ") || "—",
    winLikely: `${prob.likely}%`,
    winRange: `${prob.low}% – ${prob.high}%`,
    coverage: `${coverage.pct}%`,
    win: `${Math.round(dims.win)}/100`,
    scope: `${Math.round(dims.scope)}/100`,
    delivery: `${Math.round(dims.delivery)}/100`,
    estimate: `${Math.round(dims.estimate)}/100`,
    margin: `${Math.round(dims.margin)}/100`,
    marginPct: twin.commercialHeadline.currentMargin ? `${twin.commercialHeadline.currentMargin}%` : "—",
    opportunityValue: twin.commercialHeadline.opportunityValue ? `${twin.commercialHeadline.currency} ${twin.commercialHeadline.opportunityValue.toLocaleString()}` : "—",
  };

  return metrics[key] ?? "—";
}
