// Promise Ledger (doc 9.4): statements are selected from Deal Twin facts
// and controlled templates — never freely invented by the system.
import type { DealTwin, PromiseClassification, PromiseRecord } from "@/types/deal-twin";

export type PromiseCandidate = { statement: string; classification: PromiseClassification; source: string };

export function generatePromiseCandidates(twin: DealTwin): PromiseCandidate[] {
  const existing = new Set(twin.promises.map((p) => p.statement));
  const candidates: PromiseCandidate[] = [];

  for (const c of twin.solution.components.filter((c) => c.included)) {
    candidates.push({
      statement: `Deliver: ${c.label} (${c.outcome})`,
      classification: "Proposed deliverable",
      source: `Solution Forge — ${c.category}`,
    });
  }
  for (const exclusion of twin.solution.exclusions) {
    candidates.push({ statement: `Excluded: ${exclusion}`, classification: "Exclusion", source: "Solution Forge boundaries" });
  }
  for (const responsibility of twin.solution.responsibilities) {
    candidates.push({
      statement: `Client responsibility: ${responsibility}`,
      classification: "Client responsibility",
      source: "Solution Forge boundaries",
    });
  }

  return candidates.filter((c) => !existing.has(c.statement));
}

export function isPromiseUnresolved(p: PromiseRecord): boolean {
  return p.commercialTrace === "Not priced" || p.commercialTrace === "Pending";
}
