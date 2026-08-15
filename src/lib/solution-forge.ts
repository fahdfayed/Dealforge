// Solution Forge engine (doc section 6). Inclusion rules (6.2) are taken
// verbatim; effort/confidence/risk blends (6.4) implement the documented
// input list with this codebase's transparent weights, same convention as
// scoring.ts.
import type { DealTwin, DeliveryModel, SolutionPath } from "@/types/deal-twin";
import { complexityIndex, evidenceIntegrity } from "@/lib/scoring";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

const DELIVERY_MODEL_FACTOR: Record<DeliveryModel, { effort: number; risk: number }> = {
  Standard: { effort: 1.0, risk: 1.0 },
  Accelerated: { effort: 1.15, risk: 1.2 },
  Rapid: { effort: 1.25, risk: 1.3 },
  Parallel: { effort: 1.2, risk: 1.25 },
  Phased: { effort: 0.9, risk: 0.85 },
  Wave: { effort: 0.92, risk: 0.85 },
  Pilot: { effort: 0.8, risk: 0.75 },
};

// Doc 6.2 — inclusion rule per path, applied verbatim.
export function applyPathInclusion(twin: DealTwin, path: SolutionPath): DealTwin {
  const components = twin.solution.components.map((c) => {
    const included =
      path === "Stabilise" ? c.priority === "Required" : path === "Modernise" ? c.priority !== "Optional" : true;
    return {
      ...c,
      included,
      // "Stabilise: required capabilities only; all included work moves to phase 1."
      phase: path === "Stabilise" && included ? 1 : c.phase,
    };
  });
  return { ...twin, solution: { ...twin.solution, selectedPath: path, components } };
}

function countryFactor(twin: DealTwin): number {
  return 1 + Math.max(0, twin.dealDNA.countries.length - 1) * 0.15;
}

function entityFactor(twin: DealTwin): number {
  return 1 + Math.max(0, (twin.dealDNA.entityCount ?? 1) - 1) * 0.05;
}

export function adjustedComponentEffort(twin: DealTwin, componentEffortDays: number): number {
  const modelFactor = DELIVERY_MODEL_FACTOR[twin.solution.deliveryModel].effort;
  return componentEffortDays * countryFactor(twin) * entityFactor(twin) * modelFactor;
}

export function totalAdjustedEffort(twin: DealTwin): number {
  return twin.solution.components
    .filter((c) => c.included)
    .reduce((sum, c) => sum + adjustedComponentEffort(twin, c.effortDays), 0);
}

export function scopeConfidence(twin: DealTwin): number {
  const included = twin.solution.components.filter((c) => c.included);
  const totalEffort = included.reduce((s, c) => s + c.effortDays, 0) || 1;
  const weightedConfidence = included.reduce((s, c) => s + c.confidence * c.effortDays, 0) / totalEffort;
  const scopeCertaintyScore = ((twin.solution.designLevers.scopeCertainty - 1) / 4) * 100;
  const integrity = evidenceIntegrity(twin);
  const openDeps = twin.solution.dependencies.filter((d) => d.status === "Open").length;
  const base = (weightedConfidence + scopeCertaintyScore + integrity) / 3;
  return Math.round(clamp(base - openDeps * 5));
}

export function deliveryRisk(twin: DealTwin): number {
  const complexity = complexityIndex(twin);
  const openDeps = twin.solution.dependencies.filter((d) => d.status === "Open").length;
  const depsRisk = clamp(openDeps * 10);
  const confidence = scopeConfidence(twin);
  const weakScopeRisk = 100 - confidence;
  const changeCapacityScore = ((twin.solution.designLevers.changeCapacity - 1) / 4) * 100;
  const changeRisk = 100 - changeCapacityScore;
  const speedPressureRisk = ((twin.solution.designLevers.speedPressure - 1) / 4) * 100;
  const modelRisk = DELIVERY_MODEL_FACTOR[twin.solution.deliveryModel].risk;
  const accelerationRisk = modelRisk > 1 ? (modelRisk - 1) * 100 : 0;
  return Math.round(clamp((complexity + depsRisk + weakScopeRisk + changeRisk + speedPressureRisk + accelerationRisk) / 6));
}

export type SolutionPricing = {
  adjustedEffortDays: number;
  p50: number | null;
  p80: number | null;
  contingencyPct: number;
  unpriced: boolean;
};

// "P50 uses the latest saved effective sell rate when available; without a
// saved rate it remains unpriced." (doc 6.4)
export function computeSolutionPricing(twin: DealTwin): SolutionPricing {
  const adjustedEffortDays = Math.round(totalAdjustedEffort(twin) * 10) / 10;
  const savedScenario = twin.commercialScenarios.find((s) => s.id === twin.savedCommercialScenarioId);
  const sellRate = savedScenario?.inputs.customerDailyRate ?? null;

  if (!sellRate) {
    return { adjustedEffortDays, p50: null, p80: null, contingencyPct: 0, unpriced: true };
  }

  const p50 = Math.round(adjustedEffortDays * sellRate);
  const risk = deliveryRisk(twin);
  const confidence = scopeConfidence(twin);
  const contingencyPct = Math.round(clamp(((100 - confidence) + risk) / 2, 0, 60));
  const p80 = Math.round(p50 * (1 + contingencyPct / 100));

  return { adjustedEffortDays, p50, p80, contingencyPct, unpriced: false };
}

// "Option recommendation is based on the five design levers, deal
// probability and solution metrics — not a fixed default." (doc 6.4)
export function recommendPath(twin: DealTwin, probabilityLikely: number): { path: SolutionPath; rationale: string } {
  const l = twin.solution.designLevers;
  const scores: Record<SolutionPath, number> = {
    Stabilise: l.speedPressure * 2 + (6 - l.investmentFlexibility) + (6 - l.transformationAmbition) + (probabilityLikely < 40 ? 3 : 0),
    Modernise: l.scopeCertainty * 1.5 + l.changeCapacity + (6 - Math.abs(l.transformationAmbition - 3)) + 2,
    Transform: l.transformationAmbition * 2 + l.investmentFlexibility + l.changeCapacity + (probabilityLikely >= 65 ? 3 : 0),
  };
  const [path] = (Object.entries(scores) as [SolutionPath, number][]).sort((a, b) => b[1] - a[1])[0];
  return {
    path,
    rationale: `Design levers (speed pressure ${l.speedPressure}, transformation ambition ${l.transformationAmbition}, investment flexibility ${l.investmentFlexibility}, change capacity ${l.changeCapacity}, scope certainty ${l.scopeCertainty}) and a likely win position of ${probabilityLikely}%.`,
  };
}

export function compareOptions(twin: DealTwin) {
  const paths: SolutionPath[] = ["Stabilise", "Modernise", "Transform"];
  return paths.map((path) => {
    const scenario = applyPathInclusion(twin, path);
    const included = scenario.solution.components.filter((c) => c.included);
    const effort = totalAdjustedEffort(scenario);
    const confidence = scopeConfidence(scenario);
    const risk = deliveryRisk(scenario);
    const valueCoverage = included.length
      ? Math.round((included.filter((c) => c.priority !== "Optional").length / included.length) * 100)
      : 0;
    return {
      path,
      componentCount: included.length,
      effortDays: Math.round(effort * 10) / 10,
      scopeConfidence: confidence,
      deliveryRisk: risk,
      valueCoverage,
      openDependencies: scenario.solution.dependencies.filter((d) => d.status === "Open").length,
    };
  });
}
