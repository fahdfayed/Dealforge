// Ranking repository candidates against a requirement.
//
// This is a transparent rules engine, not a model. Every score decomposes into
// named weights and every result carries the reasons behind it, because a
// recruiter has to defend a shortlist to a practice head and "the system
// suggested them" is not a defence. It also means a bad ranking is debuggable:
// the dimension that misfired is visible in the output.
//
// Missing data scores neutral rather than zero. Penalising a candidate for a
// blank rate field would rank the well-documented below the well-suited, and
// would quietly push recruiters into guessing values to game the order. The
// gap is reported instead, which is the useful thing to act on.
//
// Pure domain logic: no database import.
import type { Candidate } from "@/lib/candidate-repo";
import type { Requisition } from "@/lib/requisitions";
import type { DealTwin } from "@/types/deal-twin";
import { ORACLE_SKILL_GROUPS } from "@/lib/oracle-skills";

export type Requirement = {
  // Where this came from, so the UI can say what it is matching against.
  source: "requisition" | "deal";
  sourceId: string;
  label: string;
  primarySkill: string;
  skills: string[];
  minYears: number | null;
  // Latest acceptable start. Drives the availability score with notice period.
  startBy: string | null;
  durationMonths: number | null;
  budgetRate: number | null;
  budgetCurrency: string;
  budgetRateUnit: string;
  country: string;
  location: string;
};

// Weights sum to 100 so a score reads as a percentage. Tunable in one place:
// if rate matters more than location for a given practice, this is the line to
// change, and the change is visible rather than buried in an expression.
export const MATCH_WEIGHTS = {
  skill: 40,
  experience: 20,
  availability: 15,
  rate: 15,
  location: 5,
  communication: 5,
} as const;

export type MatchDimension = keyof typeof MATCH_WEIGHTS;

// Working-time conversions, needed because a candidate quotes per month and a
// requirement budgets per day. Approximations, stated here rather than assumed
// silently at each comparison — a Gulf month is often 22 working days, so
// treat rate comparisons as indicative rather than contractual.
export const HOURS_PER_DAY = 8;
export const WORKING_DAYS_PER_MONTH = 21;
export const MONTHS_PER_YEAR = 12;

export function toDailyRate(amount: number, unit: string): number | null {
  switch (unit) {
    case "Per hour":
      return amount * HOURS_PER_DAY;
    case "Per day":
      return amount;
    case "Per month":
      return amount / WORKING_DAYS_PER_MONTH;
    case "Per year":
      return amount / (WORKING_DAYS_PER_MONTH * MONTHS_PER_YEAR);
    default:
      return null;
  }
}

export type DimensionScore = {
  dimension: MatchDimension;
  // 0..1 before weighting.
  score: number;
  weighted: number;
  reason: string;
  // True when the candidate record simply does not say. Scored neutral.
  unknown: boolean;
};

export type CandidateMatch = {
  candidate: Candidate;
  score: number;
  band: "Strong" | "Possible" | "Weak";
  dimensions: DimensionScore[];
  reasons: string[];
  gaps: string[];
};

export type ExcludedCandidate = {
  candidate: Candidate;
  reason: string;
};

const NEUTRAL = 0.5;

// Skills the candidate holds that the requirement asked for, and those it did
// not. Comparison is on the controlled catalogue, so this is exact rather than
// fuzzy string work.
function skillOverlap(candidate: Candidate, requirement: Requirement) {
  const wanted = new Set(
    [requirement.primarySkill, ...requirement.skills].filter(Boolean).map((s) => s.toLowerCase())
  );
  const held = new Set(
    [candidate.primarySkill, ...candidate.oracleSkills].filter(Boolean).map((s) => s.toLowerCase())
  );
  const matched = [...wanted].filter((s) => held.has(s));
  const missing = [...wanted].filter((s) => !held.has(s));
  return { wanted, held, matched, missing };
}

function scoreSkill(candidate: Candidate, requirement: Requirement): DimensionScore {
  const { wanted, held, matched, missing } = skillOverlap(candidate, requirement);

  if (wanted.size === 0) {
    return {
      dimension: "skill",
      score: NEUTRAL,
      weighted: NEUTRAL * MATCH_WEIGHTS.skill,
      reason: "The requirement does not name a skill",
      unknown: true,
    };
  }
  if (held.size === 0) {
    return {
      dimension: "skill",
      score: 0,
      weighted: 0,
      reason: "No skills recorded on this candidate",
      unknown: true,
    };
  }

  const primaryHeld =
    requirement.primarySkill && held.has(requirement.primarySkill.toLowerCase());
  const coverage = matched.length / wanted.size;
  // The primary skill carries most of the weight: someone with four of five
  // secondary skills but not the main one is not the right person.
  const score = primaryHeld ? 0.6 + coverage * 0.4 : coverage * 0.6;

  const reason = primaryHeld
    ? `Has ${requirement.primarySkill}${matched.length > 1 ? ` and ${matched.length - 1} other required ${matched.length - 1 === 1 ? "skill" : "skills"}` : ""}`
    : matched.length > 0
      ? `Matches ${matched.length} of ${wanted.size} skills but not ${requirement.primarySkill || "the main skill"}`
      : "None of the required skills recorded";

  return {
    dimension: "skill",
    score,
    weighted: score * MATCH_WEIGHTS.skill,
    reason,
    unknown: false,
  };
}

function scoreExperience(candidate: Candidate, requirement: Requirement): DimensionScore {
  const w = MATCH_WEIGHTS.experience;
  if (requirement.minYears == null) {
    return { dimension: "experience", score: NEUTRAL, weighted: NEUTRAL * w, reason: "No experience level required", unknown: true };
  }
  if (candidate.yearsExperience == null) {
    return { dimension: "experience", score: NEUTRAL, weighted: NEUTRAL * w, reason: "Years of experience not recorded", unknown: true };
  }

  const years = candidate.yearsExperience;
  const min = requirement.minYears;
  if (years >= min) {
    // Comfortably over is good, far over is not better — it usually means the
    // rate will not fit and the work will bore them.
    const over = years - min;
    const score = over <= 5 ? 1 : 0.85;
    return {
      dimension: "experience",
      score,
      weighted: score * w,
      reason: `${years} years against a minimum of ${min}`,
      unknown: false,
    };
  }

  // Below the bar, degrading sharply. Two years short of a five-year role is a
  // stretch; five years short is a different person.
  const shortfall = min - years;
  const score = Math.max(0, 1 - shortfall / Math.max(min, 1));
  return {
    dimension: "experience",
    score,
    weighted: score * w,
    reason: `${years} years, ${shortfall} short of the ${min} required`,
    unknown: false,
  };
}

function scoreAvailability(
  candidate: Candidate,
  requirement: Requirement,
  now: number
): DimensionScore {
  const w = MATCH_WEIGHTS.availability;

  // The earliest the candidate could realistically start: whichever is later
  // of their stated availability date and the end of their notice period.
  const noticeEnd =
    candidate.noticePeriodDays != null
      ? now + candidate.noticePeriodDays * 24 * 60 * 60 * 1000
      : null;
  const statedStart = candidate.availableFrom ? Date.parse(candidate.availableFrom) : null;
  const readyAt =
    noticeEnd != null && statedStart != null
      ? Math.max(noticeEnd, statedStart)
      : (noticeEnd ?? statedStart);

  if (readyAt == null) {
    return { dimension: "availability", score: NEUTRAL, weighted: NEUTRAL * w, reason: "Notice period and availability not recorded", unknown: true };
  }
  if (!requirement.startBy) {
    // Sooner is better even with no deadline, so this still discriminates.
    const days = (readyAt - now) / (24 * 60 * 60 * 1000);
    const score = days <= 30 ? 1 : days <= 60 ? 0.7 : 0.4;
    return {
      dimension: "availability",
      score,
      weighted: score * w,
      reason: `Available in about ${Math.max(0, Math.round(days))} days; no required start date`,
      unknown: false,
    };
  }

  const startBy = Date.parse(requirement.startBy);
  const slackDays = (startBy - readyAt) / (24 * 60 * 60 * 1000);
  if (slackDays >= 0) {
    return {
      dimension: "availability",
      score: 1,
      weighted: w,
      reason: `Free ${Math.round(slackDays)} days before the required start`,
      unknown: false,
    };
  }

  // Late. A week late is often negotiable, a month late usually is not.
  const lateDays = -slackDays;
  const score = Math.max(0, 1 - lateDays / 30);
  return {
    dimension: "availability",
    score,
    weighted: score * w,
    reason: `Available about ${Math.round(lateDays)} days after the required start`,
    unknown: false,
  };
}

function scoreRate(candidate: Candidate, requirement: Requirement): DimensionScore {
  const w = MATCH_WEIGHTS.rate;
  if (requirement.budgetRate == null) {
    return { dimension: "rate", score: NEUTRAL, weighted: NEUTRAL * w, reason: "No budget recorded on the requirement", unknown: true };
  }
  if (candidate.expectedRate == null) {
    return { dimension: "rate", score: NEUTRAL, weighted: NEUTRAL * w, reason: "Expected rate not recorded", unknown: true };
  }

  const wantDaily = toDailyRate(requirement.budgetRate, requirement.budgetRateUnit);
  const haveDaily = toDailyRate(candidate.expectedRate, candidate.rateUnit);
  if (wantDaily == null || haveDaily == null || wantDaily <= 0) {
    return { dimension: "rate", score: NEUTRAL, weighted: NEUTRAL * w, reason: "Rate units could not be compared", unknown: true };
  }

  // Currencies are not converted. Comparing AED to INR as though they were the
  // same number would be worse than declining to score it.
  if (
    candidate.rateCurrency &&
    requirement.budgetCurrency &&
    candidate.rateCurrency.toUpperCase() !== requirement.budgetCurrency.toUpperCase()
  ) {
    return {
      dimension: "rate",
      score: NEUTRAL,
      weighted: NEUTRAL * w,
      reason: `Quoted in ${candidate.rateCurrency}, budget in ${requirement.budgetCurrency} — not compared`,
      unknown: true,
    };
  }

  const ratio = haveDaily / wantDaily;
  if (ratio <= 1) {
    // Well under budget is good but not a reason to rank someone top: an
    // unusually cheap rate for the level is usually a level problem.
    const score = ratio >= 0.6 ? 1 : 0.9;
    return {
      dimension: "rate",
      score,
      weighted: score * w,
      reason: `Within budget at ${requirement.budgetCurrency} ${Math.round(haveDaily)}/day against ${Math.round(wantDaily)}`,
      unknown: false,
    };
  }

  const over = ratio - 1;
  const score = Math.max(0, 1 - over / 0.5); // 50% over budget scores zero
  return {
    dimension: "rate",
    score,
    weighted: score * w,
    reason: `${Math.round(over * 100)}% over budget at ${requirement.budgetCurrency} ${Math.round(haveDaily)}/day`,
    unknown: false,
  };
}

function scoreLocation(candidate: Candidate, requirement: Requirement): DimensionScore {
  const w = MATCH_WEIGHTS.location;
  if (!requirement.country) {
    return { dimension: "location", score: NEUTRAL, weighted: NEUTRAL * w, reason: "No country on the requirement", unknown: true };
  }
  if (!candidate.country) {
    return { dimension: "location", score: NEUTRAL, weighted: NEUTRAL * w, reason: "Candidate country not recorded", unknown: true };
  }

  const sameCountry = candidate.country.trim().toLowerCase() === requirement.country.trim().toLowerCase();
  if (!sameCountry) {
    return {
      dimension: "location",
      score: 0.3,
      weighted: 0.3 * w,
      reason: `In ${candidate.country}, requirement is in ${requirement.country} — relocation or remote working needed`,
      unknown: false,
    };
  }

  const sameCity =
    requirement.location &&
    candidate.location &&
    candidate.location.trim().toLowerCase() === requirement.location.trim().toLowerCase();
  return {
    dimension: "location",
    score: 1,
    weighted: w,
    reason: sameCity
      ? `Already in ${candidate.location}`
      : `Already in ${candidate.country}${candidate.workAuthorisation ? ` — ${candidate.workAuthorisation}` : ""}`,
    unknown: false,
  };
}

function scoreCommunication(candidate: Candidate): DimensionScore {
  const w = MATCH_WEIGHTS.communication;
  const map: Record<string, number> = {
    Excellent: 1,
    Good: 0.8,
    Adequate: 0.55,
    "Needs support": 0.2,
  };
  const score = map[candidate.communicationRating];
  if (score == null) {
    return { dimension: "communication", score: NEUTRAL, weighted: NEUTRAL * w, reason: "Communication not assessed", unknown: true };
  }
  return {
    dimension: "communication",
    score,
    weighted: score * w,
    reason: `Communication rated ${candidate.communicationRating.toLowerCase()}`,
    unknown: false,
  };
}

// Statuses that take someone out of consideration entirely rather than
// scoring them low. Ranking a placed contractor fifth is worse than not
// showing them: it wastes the time of whoever works down the list.
function disqualify(candidate: Candidate, alreadySubmitted: Set<string>): string | null {
  if (alreadySubmitted.has(candidate.id)) return "Already put forward for this requirement";
  if (candidate.status === "Do not contact") return "Marked do not contact";
  if (candidate.status === "Placed") return "Currently placed";
  if (candidate.status === "Archived") return "Archived";
  return null;
}

export function scoreCandidate(
  candidate: Candidate,
  requirement: Requirement,
  now: number = Date.now()
): CandidateMatch {
  const dimensions = [
    scoreSkill(candidate, requirement),
    scoreExperience(candidate, requirement),
    scoreAvailability(candidate, requirement, now),
    scoreRate(candidate, requirement),
    scoreLocation(candidate, requirement),
    scoreCommunication(candidate),
  ];

  const score = Math.round(dimensions.reduce((sum, d) => sum + d.weighted, 0));
  const band: CandidateMatch["band"] = score >= 70 ? "Strong" : score >= 45 ? "Possible" : "Weak";

  // A reason is something that argues for them; a gap is something to resolve
  // before submitting. An unknown is always a gap — it is work to do, not a
  // fault of the candidate.
  const reasons = dimensions.filter((d) => !d.unknown && d.score >= 0.7).map((d) => d.reason);
  const gaps = dimensions.filter((d) => d.unknown || d.score < 0.5).map((d) => d.reason);

  return { candidate, score, band, dimensions, reasons, gaps };
}

export function recommendFrom(
  candidates: Candidate[],
  requirement: Requirement,
  options: { alreadySubmitted?: Set<string>; limit?: number; now?: number } = {}
): { matches: CandidateMatch[]; excluded: ExcludedCandidate[] } {
  const alreadySubmitted = options.alreadySubmitted ?? new Set<string>();
  const now = options.now ?? Date.now();

  const matches: CandidateMatch[] = [];
  const excluded: ExcludedCandidate[] = [];

  for (const candidate of candidates) {
    const reason = disqualify(candidate, alreadySubmitted);
    if (reason) {
      excluded.push({ candidate, reason });
      continue;
    }
    matches.push(scoreCandidate(candidate, requirement, now));
  }

  matches.sort((a, b) => b.score - a.score || a.candidate.fullName.localeCompare(b.candidate.fullName));
  return { matches: matches.slice(0, options.limit ?? 20), excluded };
}

export function requirementFromRequisition(req: Requisition): Requirement {
  return {
    source: "requisition",
    sourceId: req.id,
    label: `${req.reference} · ${req.roleTitle}`,
    primarySkill: req.primarySkill,
    skills: req.requiredSkills,
    minYears: req.minYears,
    startBy: req.startBy,
    durationMonths: req.durationMonths,
    budgetRate: req.budgetRate,
    budgetCurrency: req.budgetCurrency,
    budgetRateUnit: req.budgetRateUnit,
    country: req.country,
    location: req.location,
  };
}

// The staff augmentation question pack asks for skills as role families
// ("Fusion functional") while candidates carry catalogue skills ("Fusion
// Financials"). This maps one onto the other so a deal can be matched without
// re-asking the question in a second vocabulary.
const SKILL_FAMILY_TO_GROUP: Record<string, string> = {
  "Fusion functional": "Oracle Fusion",
  "Fusion technical": "Oracle Fusion",
  "EBS functional": "Oracle EBS",
  "EBS technical": "Oracle EBS",
  "Integration / OIC": "Integration",
  "APEX / VBCS": "Development & low-code",
  "DBA / infrastructure": "Database & infrastructure",
  Testing: "Governance & quality",
  "HCM / payroll": "Oracle Fusion",
};

function skillsForFamilies(families: string[]): string[] {
  const groups = new Set(families.map((f) => SKILL_FAMILY_TO_GROUP[f]).filter(Boolean));
  return ORACLE_SKILL_GROUPS.filter((g) => groups.has(g.group)).flatMap((g) => g.skills);
}

// Derives a requirement from a staff augmentation deal's own answers, so the
// deal screen can recommend without anyone re-keying the requirement.
export function requirementFromDeal(twin: DealTwin, dealId: string): Requirement | null {
  if (twin.dealDNA.engagementType !== "Staff augmentation / AMS") return null;

  const answer = (id: string) => twin.answers.find((a) => a.questionId === id);
  const families = answer("sta-3")?.values ?? [];
  const durationMonths = answer("sta-4")?.numberValue ?? null;

  // The saved commercial position sets what a resource may cost us. The
  // customer rate is what we charge and would be the wrong ceiling to filter a
  // contractor against.
  const scenario = twin.commercialScenarios.find((s) => s.id === twin.savedCommercialScenarioId);
  const budgetRate = scenario?.inputs.internalDailyCost ?? null;

  return {
    source: "deal",
    sourceId: dealId,
    label: twin.identity.engagementTitle || twin.identity.company || "Staff augmentation deal",
    primarySkill: "",
    skills: skillsForFamilies(families),
    minYears: null,
    startBy: twin.identity.dueDate,
    durationMonths,
    budgetRate,
    budgetCurrency: twin.commercialHeadline.currency || "AED",
    budgetRateUnit: "Per day",
    country: twin.dealDNA.countries[0] ?? "",
    location: "",
  };
}
