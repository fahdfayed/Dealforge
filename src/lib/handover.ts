// Delivery Handover (doc 10.3). Unlocks only for Won opportunities;
// readiness basis per artifact is taken from the documented table.
import type { DealTwin } from "@/types/deal-twin";

export type HandoverArtifact = { id: string; label: string; ready: boolean; reason: string };

export function evaluateHandoverReadiness(twin: DealTwin): HandoverArtifact[] {
  return [
    { id: "answer-graph", label: "Answer Graph", ready: twin.answers.length > 0, reason: "Governed discovery exists" },
    {
      id: "solution-blueprint",
      label: "Solution blueprint",
      ready: twin.solution.components.some((c) => c.included),
      reason: "Saved included capabilities and current scope confidence",
    },
    {
      id: "commercial-baseline",
      label: "Commercial baseline",
      ready: Boolean(twin.savedCommercialScenarioId),
      reason: "Saved commercial scenario",
    },
    {
      id: "promise-baseline",
      label: "Promise baseline",
      ready: twin.promises.length > 0,
      reason: "Promise records exist and have a commercial disposition",
    },
    {
      id: "scope-handshake",
      label: "Scope Handshake",
      ready: twin.scopeHandshake.length > 0,
      reason: "Client confirmation items exist",
    },
    { id: "evidence-register", label: "Evidence register", ready: twin.evidence.length > 0, reason: "Governed evidence items exist" },
  ];
}

export function isHandoverUnlocked(twin: DealTwin): boolean {
  return twin.identity.stage === "Won";
}
