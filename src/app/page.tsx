import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/meter";
import { computeCoverage } from "@/lib/coverage";
import {
  PROMISE_KINDS_REQUIRING_EFFORT,
  PROPOSAL_STATUS_META,
  type PromiseClassificationKey,
} from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const opportunities = await prisma.opportunity.findMany({
    include: {
      dealItems: true,
      discoveryQuestions: true,
      promises: true,
      estimate: true,
      proposals: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const openOpportunities = opportunities.filter((o) => o.stage !== "Won" && o.stage !== "Lost");

  const weightedPipeline = openOpportunities.reduce((sum, o) => {
    const value = o.estimate?.customerPrice ?? (o.budgetMin && o.budgetMax ? (o.budgetMin + o.budgetMax) / 2 : 0);
    return sum + value * (o.probability / 100);
  }, 0);

  const totalPipeline = openOpportunities.reduce((sum, o) => {
    const value = o.estimate?.customerPrice ?? (o.budgetMin && o.budgetMax ? (o.budgetMin + o.budgetMax) / 2 : 0);
    return sum + value;
  }, 0);

  const pendingApprovals = opportunities.flatMap((o) =>
    o.proposals
      .filter((p) => p.status === "PENDING_APPROVAL")
      .map((p) => ({ opportunity: o, proposal: p }))
  );

  const riskyDeals = openOpportunities
    .map((o) => {
      const coverage = computeCoverage(o.discoveryQuestions);
      const contradictory = o.dealItems.filter((i) => i.status === "CONTRADICTORY").length;
      const unbacked = o.promises.filter(
        (p) =>
          PROMISE_KINDS_REQUIRING_EFFORT.includes(p.classification as PromiseClassificationKey) &&
          !p.commercialEffortIncluded
      ).length;
      const reasons = [
        coverage.overallPct < 50 && `discovery only ${coverage.overallPct}% covered`,
        contradictory > 0 && `${contradictory} contradictory item(s)`,
        unbacked > 0 && `${unbacked} unbacked promise(s)`,
        o.momentum === "At risk" && "momentum at risk",
        o.momentum === "Stalling" && "stalling",
      ].filter(Boolean) as string[];
      return { opportunity: o, coverage, reasons };
    })
    .filter((d) => d.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length);

  const allUnbackedPromises = opportunities.flatMap((o) =>
    o.promises
      .filter(
        (p) =>
          PROMISE_KINDS_REQUIRING_EFFORT.includes(p.classification as PromiseClassificationKey) &&
          !p.commercialEffortIncluded
      )
      .map((p) => ({ opportunity: o, promise: p }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today"
        subtitle="Actions, approvals and high-risk deals across the pipeline."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Open opportunities" value={String(openOpportunities.length)} />
        <StatTile label="Weighted pipeline" value={formatCurrency(weightedPipeline)} />
        <StatTile label="Total pipeline" value={formatCurrency(totalPipeline)} />
        <StatTile label="Pending approvals" value={String(pendingApprovals.length)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="High-risk deals" subtitle="Weak discovery, contradictions or unbacked promises." />
          <CardBody className="space-y-3">
            {riskyDeals.length === 0 && (
              <p className="text-sm text-slate-500">No high-risk deals right now.</p>
            )}
            {riskyDeals.map(({ opportunity, coverage, reasons }) => (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
                className="block rounded-md border border-slate-100 px-3 py-2.5 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{opportunity.client}</p>
                  <Badge color="rose">{coverage.overallPct}% covered</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">{reasons.join(" · ")}</p>
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pending approvals" subtitle="Proposals awaiting sign-off." />
          <CardBody className="space-y-3">
            {pendingApprovals.length === 0 && (
              <p className="text-sm text-slate-500">Nothing waiting on approval.</p>
            )}
            {pendingApprovals.map(({ opportunity, proposal }) => (
              <Link
                key={proposal.id}
                href={`/opportunities/${opportunity.id}/proposals`}
                className="block rounded-md border border-slate-100 px-3 py-2.5 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{proposal.title}</p>
                  <Badge color={PROPOSAL_STATUS_META.PENDING_APPROVAL.color}>
                    {PROPOSAL_STATUS_META.PENDING_APPROVAL.label}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">{opportunity.client} · {proposal.docType}</p>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Promise Ledger warnings"
          subtitle="Commitments across all deals with no backing commercial effort."
        />
        <CardBody className="space-y-2">
          {allUnbackedPromises.length === 0 && (
            <p className="text-sm text-slate-500">No unbacked commitments across the pipeline.</p>
          )}
          {allUnbackedPromises.map(({ opportunity, promise }) => (
            <Link
              key={promise.id}
              href={`/opportunities/${opportunity.id}/promises`}
              className="block rounded-md border border-rose-100 bg-rose-50/40 px-3 py-2.5 hover:bg-rose-50"
            >
              <p className="text-sm text-slate-800">{promise.statement}</p>
              <p className="mt-0.5 text-xs text-slate-500">{opportunity.client}</p>
            </Link>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: n >= 1_000_000 ? "compact" : "standard",
  }).format(n);
}
