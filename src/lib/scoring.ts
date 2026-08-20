// Deal Intelligence engine (doc section 5). Formulas marked "per doc" are
// taken verbatim from the documentation. Formulas marked "interpretation"
// implement a documented *input list* with weights/blends this codebase
// chooses transparently — the doc gives the inputs, not the exact weights,
// for every dimension except evidence scoring, coverage/authority and stage
// gate caps.
import type { Authority, DealTwin, Factor, Momentum, Stage } from "@/types/deal-twin";
import { getActiveQuestions } from "@/lib/questions";
import { evaluateSubmissionCheck } from "@/lib/submission-check";
import { getPackSync } from "@/lib/industry-packs";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function factorScore(factor: Factor | null): number {
  // interpretation: unset factors score 0, not a neutral midpoint — an
  // unrated factor should not quietly inflate the deal's health.
  if (factor == null) return 0;
  return ((factor - 1) / 4) * 100;
}

const AUTHORITY_SCORE: Record<Authority, number> = {
  // per doc 5.3 — critical-answer authority scoring
  Confirmed: 100,
  Document: 90,
  Proposed: 65,
  Assumed: 45,
  Contradictory: 10,
  Unknown: 0,
};

const EVIDENCE_STATUS_PENALTY: Record<Authority, number> = {
  // per doc 5.2
  Contradictory: 45,
  Unknown: 55,
  Assumed: 20,
  Confirmed: 0,
  Document: 0,
  Proposed: 0,
};

export function evidenceScore(item: { confidence: number; authority: Authority; expiresAt: string | null }): number {
  const daysBeyondExpiry = item.expiresAt
    ? Math.max(0, Math.floor((Date.now() - new Date(item.expiresAt).getTime()) / 86_400_000))
    : 0;
  const penalty = EVIDENCE_STATUS_PENALTY[item.authority];
  return clamp(item.confidence - 0.8 * daysBeyondExpiry - penalty, 0, 100);
}

export function evidenceIntegrity(twin: DealTwin): number {
  const scores = twin.evidence.map(evidenceScore);
  const evidenceAvg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const dnaQuality = factorScore(twin.dealDNA.evidenceQualityFactor);
  const contradictions =
    twin.evidence.filter((e) => e.authority === "Contradictory").length +
    twin.answers.filter((a) => a.authority === "Contradictory").length;
  const w = weightsFor(twin);
  return clamp(
    evidenceAvg * w.integrityEvidenceShare +
      dnaQuality * w.integrityDnaShare -
      w.integrityContradictionPenalty * contradictions,
    0,
    100
  );
}

export function discoveryCoverage(twin: DealTwin): { pct: number; answered: number; total: number } {
  const active = getActiveQuestions(twin.dealDNA);
  const answeredCount = active.filter((q) => {
    const answer = twin.answers.find((a) => a.questionId === q.id);
    return answer && answer.authority !== "Unknown" && (answer.values.length > 0 || answer.numberValue != null);
  }).length;
  return { pct: active.length ? Math.round((answeredCount / active.length) * 100) : 0, answered: answeredCount, total: active.length };
}

export function criticalAuthorityScore(twin: DealTwin): number {
  const active = getActiveQuestions(twin.dealDNA);
  const critical = active.filter((q) => q.critical);
  if (critical.length === 0) return 0;
  const total = critical.reduce((sum, q) => {
    const answer = twin.answers.find((a) => a.questionId === q.id);
    return sum + AUTHORITY_SCORE[answer?.authority ?? "Unknown"];
  }, 0);
  return Math.round(total / critical.length);
}

// --- Pursuit gates (doc 5.4) ---------------------------------------------

export type Gate = { id: string; label: string; cap: number; complete: boolean; reason: string };

export function evaluateGates(twin: DealTwin): Gate[] {
  const coverage = discoveryCoverage(twin);
  const buyerAnswer = twin.answers.find((a) => a.questionId === "std-3");
  const techAnswer = twin.answers.find((a) => a.questionId === "std-4");
  const buyingAligned = ["Confirmed", "Document"].includes(buyerAnswer?.authority ?? "") && ["Confirmed", "Document"].includes(techAnswer?.authority ?? "");
  const submission = evaluateSubmissionCheck(twin);

  return [
    {
      id: "qualification",
      label: "Qualification",
      cap: 45,
      complete: Boolean(
        twin.dealDNA.engagementType && twin.dealDNA.industry && twin.dealDNA.countries.length > 0 && coverage.pct >= 30
      ),
      reason: "Engagement type, industry, at least one country, and 30%+ discovery coverage.",
    },
    {
      id: "buying-alignment",
      label: "Buying alignment",
      cap: 60,
      complete: buyingAligned,
      reason: "Economic buyer and technical decision-maker confirmed or document-backed.",
    },
    {
      id: "solution-shaping",
      label: "Solution shaping",
      cap: 68,
      complete: Boolean(twin.solution.selectedPath && twin.solution.components.some((c) => c.included)),
      reason: "A solution path is selected with at least one included component.",
    },
    {
      id: "commercial",
      label: "Commercial",
      cap: 78,
      complete: Boolean(twin.savedCommercialScenarioId),
      reason: "A commercial scenario has been saved as the baseline.",
    },
    {
      id: "submission",
      label: "Submission",
      cap: 88,
      complete: submission.blockingIssues.length === 0,
      reason: "The Submission Check has no blocking issues.",
    },
  ];
}

export function effectiveCap(twin: DealTwin, gates: Gate[]): number {
  if (twin.identity.stage === "Won") return 100;
  const incomplete = gates.filter((g) => !g.complete);
  if (incomplete.length === 0) return 100;
  return Math.min(...incomplete.map((g) => g.cap));
}

// --- Dimension scores (doc 5.1 — inputs are documented, weights are this
// codebase's transparent interpretation) -----------------------------------

const MOMENTUM_SCORE: Record<Momentum, number> = {
  Accelerating: 100,
  Steady: 65,
  Stalling: 35,
  "At risk": 10,
};

// Scoring weights, named so an industry pack can override them.
//
// These were inline numeric literals scattered through the functions below,
// which meant "healthcare should weight compliance more heavily" had nowhere to
// attach. Extracting them changes no behaviour on its own: with no override the
// values are exactly what was hardcoded.
//
// Keys are stable identifiers referenced by industry pack scoringModifiers, so
// renaming one silently drops any pack override that used the old name.
export const DEFAULT_SCORING_WEIGHTS = {
  // Win probability contribution, ten terms summing to 1.0.
  winCoverage: 0.15,
  winIntegrity: 0.15,
  winMomentum: 0.1,
  winUrgency: 0.08,
  winRelationship: 0.1,
  winBudget: 0.1,
  winStakeholder: 0.12,
  winOracle: 0.08,
  winStrategicFit: 0.07,
  winCrmProbability: 0.05,

  // Complexity drivers. Complexity is subtracted from scope, delivery,
  // estimate and margin, so these are the highest-leverage numbers here.
  complexityPerEntity: 3,
  complexityPerCountry: 8,
  // Users per complexity point, expressed as a divisor so the arithmetic
  // stays exact — a reciprocal weight would introduce floating-point drift.
  complexityUsersPerPoint: 50,
  complexityPerIntegration: 4,
  complexityPerTestCycle: 3,

  // The margin percentage treated as a full score.
  marginAnchorPct: 35,

  // Evidence integrity blend.
  integrityEvidenceShare: 0.72,
  integrityDnaShare: 0.28,
  integrityContradictionPenalty: 4,
} as const;

export type ScoringWeightKey = keyof typeof DEFAULT_SCORING_WEIGHTS;
export type ScoringWeights = Record<ScoringWeightKey, number>;

// Resolves the weights for a deal: defaults, with any override its industry
// pack supplies. Unknown keys in a pack are ignored rather than merged, so a
// typo in authored content cannot introduce a phantom weight.
export function weightsFor(twin: DealTwin): ScoringWeights {
  const overrides = getPackSync(twin.dealDNA.industryId)?.scoringModifiers ?? {};
  const resolved = { ...DEFAULT_SCORING_WEIGHTS } as ScoringWeights;
  for (const key of Object.keys(DEFAULT_SCORING_WEIGHTS) as ScoringWeightKey[]) {
    const value = overrides[key];
    if (typeof value === "number" && Number.isFinite(value)) resolved[key] = value;
  }
  return resolved;
}

export function complexityIndex(twin: DealTwin): number {
  const dna = twin.dealDNA;
  const w = weightsFor(twin);
  const integrations = numberAnswer(twin, "std-15") ?? 0;
  const testingCycles = numberAnswer(twin, "std-16") ?? 0;
  const raw =
    (dna.entityCount ?? 0) * w.complexityPerEntity +
    dna.countries.length * w.complexityPerCountry +
    (dna.userCount ?? 0) / w.complexityUsersPerPoint +
    integrations * w.complexityPerIntegration +
    testingCycles * w.complexityPerTestCycle;
  return clamp(raw);
}

function numberAnswer(twin: DealTwin, questionId: string): number | null {
  return twin.answers.find((a) => a.questionId === questionId)?.numberValue ?? null;
}

export type DimensionScores = {
  win: number;
  scope: number;
  delivery: number;
  estimate: number;
  margin: number;
  payment: number;
  stakeholder: number;
  oracle: number;
};

export function computeDimensions(twin: DealTwin): DimensionScores {
  const dna = twin.dealDNA;
  const w = weightsFor(twin);
  const coverage = discoveryCoverage(twin).pct;
  const integrity = evidenceIntegrity(twin);
  const complexity = complexityIndex(twin);
  const gates = evaluateGates(twin);
  const buyingAligned = gates.find((g) => g.id === "buying-alignment")?.complete ?? false;

  const scope = Math.round(
    (factorScore(dna.scopeFactor) + integrity + coverage + (100 - complexity)) / 4
  );

  const delivery = Math.round((factorScore(dna.deliveryFactor) + scope + integrity + (100 - complexity)) / 4);

  const estimate = Math.round((scope + integrity + delivery + (100 - complexity)) / 4);

  const marginRaw = twin.commercialHeadline.currentMargin;
  const marginNormalized = marginRaw == null ? 0 : clamp((marginRaw / w.marginAnchorPct) * 100);
  const fixedPriceExposure = dna.commercialModel === "Fixed price" ? 0 : 60;
  const margin = Math.round(
    (marginNormalized + scope + delivery + integrity + factorScore(dna.paymentFactor) + (100 - complexity) + fixedPriceExposure) / 7
  );

  const payment = Math.round(factorScore(dna.paymentFactor));

  const stakeholder = Math.round((factorScore(dna.stakeholderFactor) + (buyingAligned ? 100 : 40) + factorScore(dna.relationshipFactor)) / 3);

  const registrationAnswer = twin.answers.find((a) => a.questionId === "std-19")?.values[0];
  const registrationScore = registrationAnswer === "Registered" ? 100 : registrationAnswer === "In progress" ? 55 : registrationAnswer === "Not registered" ? 15 : 0;
  const oracle = Math.round((factorScore(dna.oracleFactor) + registrationScore) / 2);

  const win = Math.round(
    coverage * w.winCoverage +
      integrity * w.winIntegrity +
      MOMENTUM_SCORE[twin.commercialHeadline.momentum] * w.winMomentum +
      factorScore(dna.urgencyFactor) * w.winUrgency +
      factorScore(dna.relationshipFactor) * w.winRelationship +
      factorScore(dna.budgetFactor) * w.winBudget +
      stakeholder * w.winStakeholder +
      oracle * w.winOracle +
      factorScore(dna.strategicFitFactor) * w.winStrategicFit +
      (twin.commercialHeadline.crmProbability ?? 0) * w.winCrmProbability
  );

  return { win, scope, delivery, estimate, margin, payment, stakeholder, oracle };
}

// --- Probability range (doc 5.5) ------------------------------------------

export type ProbabilityRange = { low: number; likely: number; high: number; cap: number; gates: Gate[] };

export function computeProbability(twin: DealTwin): ProbabilityRange {
  const gates = evaluateGates(twin);
  const cap = effectiveCap(twin, gates);
  const dims = computeDimensions(twin);
  const likely = Math.min(dims.win, cap);

  const coverage = discoveryCoverage(twin).pct;
  const integrity = evidenceIntegrity(twin);
  const criticalAuth = criticalAuthorityScore(twin);
  const budgetAnswer = twin.answers.find((a) => a.questionId === "std-8")?.values[0];
  const budgetMaturity = budgetAnswer === "Approved and allocated" ? 100 : budgetAnswer === "Approved, pending sign-off" ? 65 : budgetAnswer === "Estimated, not approved" ? 30 : 0;

  const maturity = clamp((integrity + coverage + criticalAuth + budgetMaturity) / 4);
  const bandWidth = 20 * (1 - maturity / 100);

  return {
    low: Math.round(clamp(likely - bandWidth, 0, likely)),
    likely: Math.round(likely),
    high: Math.round(clamp(likely + bandWidth, likely, cap)),
    cap,
    gates,
  };
}

// --- Safety modes (doc 5.6) -------------------------------------------------

export type SafetyMode = { label: string; detail: string };

export function getSafetyMode(twin: DealTwin, probability: ProbabilityRange, dims: DimensionScores): SafetyMode {
  const hasAnyInput =
    twin.answers.length > 0 ||
    Object.values(twin.dealDNA).some((v) => (Array.isArray(v) ? v.length > 0 : v != null && v !== ""));

  if (!hasAnyInput) {
    return { label: "Unassessed", detail: "Enter real inputs to activate the Deal Intelligence engine." };
  }

  const bindingGate = probability.gates.find((g) => !g.complete && g.cap === probability.cap);
  if (bindingGate && dims.win > probability.cap) {
    return { label: "Probability capped", detail: `Capped until the ${bindingGate.label} gate is complete — ${bindingGate.reason}` };
  }

  const strategicFit = factorScoreForDisplay(twin.dealDNA.strategicFitFactor);

  if (probability.likely >= 65 && (dims.scope < 50 || dims.margin < 50 || dims.delivery < 50)) {
    return { label: "Commercially hot — operationally unsafe", detail: "Win position is strong but scope, margin or delivery health is weak." };
  }
  if (probability.likely < 40 && strategicFit < 50) {
    return { label: "Qualify out or nurture", detail: "Low win position and weak strategic fit." };
  }
  if (probability.likely < 65 && strategicFit >= 65) {
    return { label: "Strategic pursuit — controlled investment", detail: "Lower win position but strong strategic fit." };
  }
  if (probability.likely >= 65 && dims.scope >= 65 && dims.margin >= 65 && dims.delivery >= 65) {
    return { label: "Close-ready — protect the baseline", detail: "High win position with strong safety dimensions." };
  }
  return { label: "Building pursuit position", detail: "No safety-mode condition is currently triggered." };
}

function factorScoreForDisplay(factor: Factor | null): number {
  return factorScore(factor);
}

// --- Recommended actions (doc 5.7) -----------------------------------------

export type RecommendedAction = { id: string; label: string; severity: "critical" | "high" | "medium" };

export function getRecommendedActions(twin: DealTwin): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const active = getActiveQuestions(twin.dealDNA);
  const dims = computeDimensions(twin);
  const gates = evaluateGates(twin);

  for (const q of active.filter((q) => q.critical)) {
    const answer = twin.answers.find((a) => a.questionId === q.id);
    if (!answer || answer.authority === "Unknown") {
      actions.push({ id: `q-${q.id}`, label: `Resolve: ${q.text}`, severity: "critical" });
    } else if (answer.authority === "Contradictory") {
      actions.push({ id: `q-${q.id}-contra`, label: `Resolve contradiction: ${q.text}`, severity: "critical" });
    }
  }

  for (const gate of gates.filter((g) => !g.complete)) {
    actions.push({ id: `gate-${gate.id}`, label: `Complete gate: ${gate.label}`, severity: "high" });
  }

  const pendingAlliance = twin.allianceActions.filter((a) => a.status !== "Completed");
  for (const a of pendingAlliance.slice(0, 2)) {
    actions.push({ id: `oracle-${a.id}`, label: `Resolve Oracle dependency: ${a.action}`, severity: "medium" });
  }

  if (dims.stakeholder < 50) actions.push({ id: "dim-stakeholder", label: "Improve stakeholder access", severity: "medium" });
  if (dims.scope < 50) actions.push({ id: "dim-scope", label: "Clarify scope", severity: "medium" });
  if (dims.estimate < 50) actions.push({ id: "dim-estimate", label: "Strengthen estimate confidence", severity: "medium" });
  if (dims.margin < 50) actions.push({ id: "dim-margin", label: "Review margin exposure", severity: "medium" });
  if (dims.delivery < 50) actions.push({ id: "dim-delivery", label: "Validate delivery capacity", severity: "medium" });
  if (dims.payment < 50) actions.push({ id: "dim-payment", label: "Confirm payment terms", severity: "medium" });
  if (evidenceIntegrity(twin) < 50) actions.push({ id: "dim-evidence", label: "Strengthen evidence", severity: "medium" });

  if (actions.length === 0) {
    actions.push({ id: "basics-handshake", label: "Run the Scope Handshake", severity: "medium" });
    actions.push({ id: "basics-promises", label: "Reconcile the Promise Ledger", severity: "medium" });
  }

  return actions.slice(0, 6);
}

export function stageOptions(): Stage[] {
  return ["New", "Qualifying", "Discovery", "Solution shaping", "Commercial review", "Proposal", "Negotiation", "Preferred", "Won", "Nurture"];
}
