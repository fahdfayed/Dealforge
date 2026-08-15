"use server";

import { mutateDeal } from "@/lib/deal-mutation";
import { computeCommercialScenario } from "@/lib/commercial";

export async function applyNegotiatedScenarioAction(
  dealId: string,
  expectedRevision: number,
  reductionPct: number,
  exchanges: string[]
) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => {
      const baseline = twin.commercialScenarios.find((s) => s.id === twin.savedCommercialScenarioId);
      if (!baseline) return twin;

      const nextDiscount = Math.min(100, baseline.inputs.discountPct + reductionPct);
      const name = `Negotiated — ${exchanges.length ? exchanges.join(", ") : "no recorded exchange"}`;
      const scenario = computeCommercialScenario(name, { ...baseline.inputs, discountPct: nextDiscount });

      return {
        ...twin,
        commercialScenarios: [...twin.commercialScenarios, scenario],
        savedCommercialScenarioId: scenario.id,
      };
    },
    `/deals/${dealId}/negotiate`
  );
}
