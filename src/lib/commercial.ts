// Detailed commercial estimate engine (doc section 7). Core inputs and
// outputs are taken from the documented tables; the exact blend of
// multiplicative vs additive drivers is this codebase's transparent,
// commented interpretation (same convention as scoring.ts).
import type { CommercialScenario, CommercialScenarioInputs } from "@/types/deal-twin";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function computeAdjustedEffortDays(inputs: CommercialScenarioInputs): number {
  const countryFactor = 1 + Math.max(0, inputs.countries - 1) * 0.15;
  const entityFactor = 1 + Math.max(0, inputs.entities - 1) * 0.05;
  const driverDays = inputs.contextDrivers.reduce((sum, d) => sum + d.effortDays, 0);
  return inputs.baseEffortDays * countryFactor * entityFactor + inputs.interfaces * 4 + inputs.validationCycles * 6 + driverDays;
}

export function computeCommercialScenario(name: string, inputs: CommercialScenarioInputs): CommercialScenario {
  const adjustedEffortDays = Math.round(computeAdjustedEffortDays(inputs) * 10) / 10;
  const internalCost = Math.round(adjustedEffortDays * inputs.internalDailyCost);
  const travelExposure = Math.round(adjustedEffortDays * (inputs.onSitePct / 100) * inputs.travelPerOnSiteDay);
  const priceBeforeDiscount = adjustedEffortDays * inputs.customerDailyRate;
  const customerPrice = Math.round(priceBeforeDiscount * (1 - inputs.discountPct / 100));
  const grossMarginPct =
    customerPrice > 0 ? Math.round(((customerPrice - internalCost - travelExposure) / customerPrice) * 1000) / 10 : 0;

  const p50Days = adjustedEffortDays;
  const p80Days = Math.round(adjustedEffortDays * (1 + inputs.contingencyPct / 100) * 10) / 10;

  const approvalExceptions: string[] = [];
  if (grossMarginPct < 20) {
    approvalExceptions.push(`Margin of ${grossMarginPct}% is below the 20% approval floor`);
  }
  if (inputs.discountPct >= 5) {
    approvalExceptions.push(`${inputs.discountPct}% discount applied — confirm a recorded value exchange in Negotiate`);
  }
  if (travelExposure > 0.25 * (customerPrice || 1)) {
    approvalExceptions.push("Travel exposure exceeds 25% of customer price");
  }

  return {
    id: crypto.randomUUID(),
    name,
    savedAt: new Date().toISOString(),
    inputs,
    adjustedEffortDays,
    internalCost,
    travelExposure,
    customerPrice,
    grossMarginPct: clamp(grossMarginPct, -1000, 1000),
    p50Days,
    p80Days,
    approvalExceptions,
  };
}

export const DEFAULT_COMMERCIAL_INPUTS: CommercialScenarioInputs = {
  baseEffortDays: 60,
  entities: 1,
  countries: 1,
  interfaces: 2,
  validationCycles: 2,
  contextDrivers: [],
  onSitePct: 30,
  contingencyPct: 15,
  discountPct: 0,
  paymentStructure: "Milestone",
  internalDailyCost: 650,
  customerDailyRate: 1200,
  travelPerOnSiteDay: 250,
};
