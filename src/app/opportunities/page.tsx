import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/meter";
import { computeCoverage } from "@/lib/coverage";

export const dynamic = "force-dynamic";

const MOMENTUM_COLOR: Record<string, string> = {
  Accelerating: "emerald",
  Steady: "sky",
  Stalling: "amber",
  "At risk": "rose",
};

export default async function OpportunitiesPage() {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { updatedAt: "desc" },
    include: { discoveryQuestions: true },
  });

  return (
    <div>
      <PageHeader
        title="Opportunities"
        subtitle="Every Living Deal Twin currently open."
        action={
          <Link
            href="/opportunities/new"
            className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            New opportunity
          </Link>
        }
      />

      {opportunities.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          No opportunities yet. Create the first one to start building its Deal Twin.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {opportunities.map((opp) => {
            const coverage = computeCoverage(opp.discoveryQuestions);
            const budget =
              opp.budgetMin && opp.budgetMax
                ? `${opp.currency} ${Math.round(opp.budgetMin / 1000)}k–${Math.round(opp.budgetMax / 1000)}k`
                : "Budget TBC";
            return (
              <Link key={opp.id} href={`/opportunities/${opp.id}`}>
                <Card className="h-full p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{opp.client}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{opp.name}</p>
                    </div>
                    <Badge color={MOMENTUM_COLOR[opp.momentum] ?? "slate"}>
                      {opp.momentum}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-slate-500">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{opp.dealType}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{opp.stage}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{budget}</span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Discovery coverage</span>
                      <span className="font-medium text-slate-700">{coverage.overallPct}%</span>
                    </div>
                    <div className="mt-1.5">
                      <Meter pct={coverage.overallPct} />
                    </div>
                    {coverage.missingCriticalCount > 0 && (
                      <p className="mt-1.5 text-xs text-rose-600">
                        {coverage.missingCriticalCount} critical question
                        {coverage.missingCriticalCount === 1 ? "" : "s"} unanswered
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Probability</span>
                    <span className="font-medium text-slate-700">{opp.probability}%</span>
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
