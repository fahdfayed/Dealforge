"use server";

import { mutateDeal } from "@/lib/deal-mutation";
import { applyPathInclusion } from "@/lib/solution-forge";
import { buildComponentsForEngagement } from "@/lib/solution-catalog";
import { getPackSync } from "@/lib/industry-packs";
import { computeCommercialScenario, DEFAULT_COMMERCIAL_INPUTS } from "@/lib/commercial";
import type { SolutionPath } from "@/types/deal-twin";

// Seeds the catalogue, and tops it up afterwards. Seeding used to be strictly
// one-shot — `components.length > 0` meant a later Deal DNA change could never
// contribute anything — so setting the industry after building the offer left
// its components silently absent. Existing components are never modified or
// removed here; only templates not already present are appended.
export async function loadCatalogAction(dealId: string, expectedRevision: number) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => {
      const engagementType = twin.dealDNA.engagementType;
      if (!engagementType) return twin;

      const addOns = getPackSync(twin.dealDNA.industryId)?.componentAddOns ?? [];
      const candidates = buildComponentsForEngagement(engagementType, addOns);

      const existingKeys = new Set(
        twin.solution.components.map((c) => c.templateKey).filter(Boolean) as string[]
      );
      const existingLabels = new Set(twin.solution.components.map((c) => c.label));

      // Components created before templateKey existed carry no key, so fall
      // back to the label to avoid re-adding what is already there.
      const missing = candidates.filter(
        (c) => !existingKeys.has(c.templateKey ?? "") && !existingLabels.has(c.label)
      );
      if (missing.length === 0) return twin;

      return {
        ...twin,
        solution: { ...twin.solution, components: [...twin.solution.components, ...missing] },
      };
    },
    `/deals/${dealId}/build-offer`
  );
}

export async function choosePathAction(dealId: string, expectedRevision: number, path: SolutionPath) {
  await mutateDeal(dealId, expectedRevision, (twin) => applyPathInclusion(twin, path), `/deals/${dealId}/build-offer`);
}

export async function updateScopeAction(dealId: string, expectedRevision: number, formData: FormData) {
  const includedIds = new Set(formData.getAll("included").map(String));
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      solution: {
        ...twin.solution,
        components: twin.solution.components.map((c) => ({ ...c, included: includedIds.has(c.id) })),
      },
    }),
    `/deals/${dealId}/build-offer`
  );
}

export async function saveCommercialBaseAction(dealId: string, expectedRevision: number, formData: FormData) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => {
      const includedEffort = twin.solution.components.filter((c) => c.included).reduce((s, c) => s + c.effortDays, 0);
      const inputs = {
        ...DEFAULT_COMMERCIAL_INPUTS,
        baseEffortDays: includedEffort || DEFAULT_COMMERCIAL_INPUTS.baseEffortDays,
        entities: 1,
        countries: 1,
        interfaces: 0,
        validationCycles: 0,
        onSitePct: Number(formData.get("onSitePct") ?? 30),
        contingencyPct: Number(formData.get("contingencyPct") ?? 15),
        discountPct: Number(formData.get("discountPct") ?? 0),
        internalDailyCost: Number(formData.get("internalDailyCost") ?? 650),
        customerDailyRate: Number(formData.get("customerDailyRate") ?? 1200),
      };
      const scenario = computeCommercialScenario(`Working offer — ${new Date().toLocaleDateString()}`, inputs);
      return {
        ...twin,
        commercialScenarios: [...twin.commercialScenarios, scenario],
        savedCommercialScenarioId: scenario.id,
      };
    },
    `/deals/${dealId}/build-offer`
  );
}
