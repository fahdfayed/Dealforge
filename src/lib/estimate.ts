import { COMPLEXITY_MULTIPLIERS } from "@/lib/domain";

export type EstimateInputs = {
  entities: number;
  countries: number;
  modules: number;
  businessUnits: number;
  users: number;
  integrations: number;
  reports: number;
  dataObjects: number;
  workflows: number;
  testingCycles: number;
  trainingPopulations: number;
  onSitePct: number;
  documentationQuality: "Good" | "Average" | "Poor";
  governanceComplexity: "Low" | "Medium" | "High";
};

export const DEFAULT_ESTIMATE_INPUTS: EstimateInputs = {
  entities: 1,
  countries: 1,
  modules: 2,
  businessUnits: 1,
  users: 50,
  integrations: 2,
  reports: 5,
  dataObjects: 4,
  workflows: 3,
  testingCycles: 2,
  trainingPopulations: 1,
  onSitePct: 30,
  documentationQuality: "Average",
  governanceComplexity: "Medium",
};

export type MultiplierSelection = Record<string, boolean>;

export type EstimateResult = {
  baseEffortDays: number;
  adjustedEffortDays: number;
  p50Days: number;
  p80Days: number;
  maxDays: number;
  internalCost: number;
  customerPrice: number;
  grossMargin: number;
};

const QUALITY_FACTOR: Record<EstimateInputs["documentationQuality"], number> = {
  Good: 0,
  Average: 0.05,
  Poor: 0.15,
};

const GOVERNANCE_FACTOR: Record<EstimateInputs["governanceComplexity"], number> = {
  Low: 0,
  Medium: 0.05,
  High: 0.15,
};

export function computeBaseEffortDays(inputs: EstimateInputs): number {
  const raw =
    inputs.entities * 8 +
    inputs.countries * 15 +
    inputs.modules * 20 +
    inputs.businessUnits * 4 +
    (inputs.users / 50) * 2 +
    inputs.integrations * 12 +
    inputs.reports * 3 +
    inputs.dataObjects * 6 +
    inputs.workflows * 5 +
    inputs.testingCycles * 10 +
    inputs.trainingPopulations * 4;

  const qualityUplift = QUALITY_FACTOR[inputs.documentationQuality];
  const governanceUplift = GOVERNANCE_FACTOR[inputs.governanceComplexity];

  return raw * (1 + qualityUplift + governanceUplift);
}

export function computeMultiplierFactor(selection: MultiplierSelection): number {
  return COMPLEXITY_MULTIPLIERS.reduce(
    (sum, m) => sum + (selection[m.key] ? m.factor : 0),
    0
  );
}

export function computeEstimate(
  inputs: EstimateInputs,
  multipliers: MultiplierSelection,
  dayRate: number,
  internalCostPerDay: number,
  contingencyPct: number
): EstimateResult {
  const baseEffortDays = computeBaseEffortDays(inputs);
  const multiplierFactor = computeMultiplierFactor(multipliers);
  const adjustedEffortDays = baseEffortDays * (1 + multiplierFactor);

  const p50Days = adjustedEffortDays;
  const p80Days = adjustedEffortDays * (1 + contingencyPct / 100);
  const maxDays = adjustedEffortDays * 1.6;

  const internalCost = p50Days * internalCostPerDay;
  const customerPrice = p50Days * dayRate;
  const grossMargin =
    customerPrice > 0 ? ((customerPrice - internalCost) / customerPrice) * 100 : 0;

  return {
    baseEffortDays: round(baseEffortDays),
    adjustedEffortDays: round(adjustedEffortDays),
    p50Days: round(p50Days),
    p80Days: round(p80Days),
    maxDays: round(maxDays),
    internalCost: round(internalCost),
    customerPrice: round(customerPrice),
    grossMargin: round(grossMargin),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// Effort split by workstream and role, derived proportionally from total
// adjusted effort. Kept simple and transparent rather than independently
// estimated per workstream.
export const WORKSTREAM_SPLIT = [
  { name: "Discovery & Design", share: 0.15 },
  { name: "Configuration & Build", share: 0.3 },
  { name: "Integrations", share: 0.15 },
  { name: "Data Migration", share: 0.12 },
  { name: "Testing", share: 0.15 },
  { name: "Training & Change Management", share: 0.08 },
  { name: "Project Management", share: 0.05 },
];

export const ROLE_SPLIT = [
  { name: "Functional Consultant", share: 0.35 },
  { name: "Technical Consultant", share: 0.25 },
  { name: "Integration Specialist", share: 0.15 },
  { name: "Data Migration Specialist", share: 0.1 },
  { name: "Project Manager", share: 0.08 },
  { name: "Change Manager", share: 0.07 },
];
