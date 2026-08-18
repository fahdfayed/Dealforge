"use server";

import { mutateDeal } from "@/lib/deal-mutation";
import { computeCommercialScenario } from "@/lib/commercial";
import type { CommercialScenarioInputs, ScenarioStatus, ApprovalRecord } from "@/types/deal-twin";

const path = (dealId: string) => `/deals/${dealId}/estimate`;

export async function saveScenarioAction(dealId: string, expectedRevision: number, name: string, inputs: CommercialScenarioInputs) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => {
      const scenario = computeCommercialScenario(name, inputs);
      return { ...twin, commercialScenarios: [...twin.commercialScenarios, scenario], savedCommercialScenarioId: scenario.id };
    },
    path(dealId)
  );
}

export async function setBaselineAction(dealId: string, expectedRevision: number, scenarioId: string) {
  await mutateDeal(dealId, expectedRevision, (twin) => ({ ...twin, savedCommercialScenarioId: scenarioId }), path(dealId));
}

export async function deleteScenarioAction(dealId: string, expectedRevision: number, scenarioId: string) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      commercialScenarios: twin.commercialScenarios.filter((s) => s.id !== scenarioId),
      savedCommercialScenarioId: twin.savedCommercialScenarioId === scenarioId ? null : twin.savedCommercialScenarioId,
    }),
    path(dealId)
  );
}

export async function updateScenarioStatusAction(dealId: string, expectedRevision: number, scenarioId: string, status: ScenarioStatus) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      commercialScenarios: twin.commercialScenarios.map((s) => (s.id === scenarioId ? { ...s, status } : s)),
    }),
    path(dealId)
  );
}

export async function submitScenarioApprovalAction(
  dealId: string,
  expectedRevision: number,
  scenarioId: string,
  decision: "approved" | "rejected",
  comment: string,
  approvedBy: string
) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      commercialScenarios: twin.commercialScenarios.map((s) => {
        if (s.id === scenarioId) {
          const approval: ApprovalRecord = {
            id: crypto.randomUUID(),
            approvedBy,
            decision,
            comment,
            decidedAt: new Date().toISOString(),
          };
          return {
            ...s,
            approvals: [...s.approvals, approval],
            status: decision === "approved" ? ("Approved" as ScenarioStatus) : ("Rejected" as ScenarioStatus),
          };
        }
        return s;
      }),
    }),
    path(dealId)
  );
}
