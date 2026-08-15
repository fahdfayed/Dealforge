// Today (doc 11.1) — one clear move, current health, the highest-impact
// decision queue, and Answer Graph health. No decorative metrics.
import type { Deal } from "@/types/deal-twin";
import { discoveryCoverage, getRecommendedActions, type RecommendedAction } from "@/lib/scoring";

const CLOSED_STAGES = new Set(["Won", "Nurture"]);
const SEVERITY_RANK: Record<RecommendedAction["severity"], number> = { critical: 0, high: 1, medium: 2 };

export function decisionQueue(deals: Deal[], limit = 10): { deal: Deal; action: RecommendedAction }[] {
  const candidates = deals
    .filter((d) => !CLOSED_STAGES.has(d.twin.identity.stage))
    .flatMap((deal) => getRecommendedActions(deal.twin).map((action) => ({ deal, action })));

  candidates.sort((a, b) => SEVERITY_RANK[a.action.severity] - SEVERITY_RANK[b.action.severity]);
  return candidates.slice(0, limit);
}

export function topMove(deals: Deal[]): { deal: Deal; action: RecommendedAction } | null {
  return decisionQueue(deals, 1)[0] ?? null;
}

export function answerGraphHealth(deals: Deal[]): { avgCoveragePct: number; dealsBelow50: number; activeDeals: number } {
  const active = deals.filter((d) => !CLOSED_STAGES.has(d.twin.identity.stage));
  if (active.length === 0) return { avgCoveragePct: 0, dealsBelow50: 0, activeDeals: 0 };
  const coverages = active.map((d) => discoveryCoverage(d.twin).pct);
  return {
    avgCoveragePct: Math.round(coverages.reduce((a, b) => a + b, 0) / coverages.length),
    dealsBelow50: coverages.filter((c) => c < 50).length,
    activeDeals: active.length,
  };
}
