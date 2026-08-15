// Portfolio aggregation (doc 11.2) — leadership decision views over every
// persisted Deal Twin.
import type { Deal } from "@/types/deal-twin";
import { computeDimensions, computeProbability, discoveryCoverage } from "@/lib/scoring";
import { isPromiseUnresolved } from "@/lib/promises";

const CLOSED_STAGES = new Set(["Won", "Nurture"]);

export function weightedPipelineValue(deals: Deal[]): number {
  return deals
    .filter((d) => !CLOSED_STAGES.has(d.twin.identity.stage))
    .reduce((sum, d) => {
      const likely = computeProbability(d.twin).likely;
      const value = d.twin.commercialHeadline.opportunityValue ?? 0;
      return sum + value * (likely / 100);
    }, 0);
}

export function weakDiscoveryDeals(deals: Deal[]): Deal[] {
  return deals.filter((d) => !CLOSED_STAGES.has(d.twin.identity.stage) && discoveryCoverage(d.twin).pct < 50);
}

export function unpricedPromiseDeals(deals: Deal[]): { deal: Deal; count: number }[] {
  return deals
    .map((deal) => ({ deal, count: deal.twin.promises.filter(isPromiseUnresolved).length }))
    .filter((x) => x.count > 0);
}

export function commerciallyUnsafeDeals(deals: Deal[]): Deal[] {
  return deals.filter((d) => {
    const probability = computeProbability(d.twin);
    const dims = computeDimensions(d.twin);
    return probability.likely >= 65 && (dims.scope < 50 || dims.margin < 50 || dims.delivery < 50);
  });
}

export function playbookMix(deals: Deal[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const d of deals) {
    const key = d.twin.dealDNA.engagementType ?? "Unclassified";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
}

export function leadershipExceptions(deals: Deal[]): { deal: Deal; label: string }[] {
  const exceptions: { deal: Deal; label: string }[] = [];
  for (const deal of deals) {
    const scenario = deal.twin.commercialScenarios.find((s) => s.id === deal.twin.savedCommercialScenarioId);
    for (const e of scenario?.approvalExceptions ?? []) {
      exceptions.push({ deal, label: e });
    }
  }
  return exceptions;
}
