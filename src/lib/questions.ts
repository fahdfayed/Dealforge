// The Answer Graph question bank (doc section 4). A 19-question standard
// pack applies to every deal; engagement-type packs and context add-ons
// (multi-country, regulated industry, managed-service commercial model)
// extend it. Response controls are limited to single/multiple/number per
// section 4.2 — "controlled input first."
import type { DealDNA, EngagementType } from "@/types/deal-twin";
import { getAllCachedPacks, getPackSync } from "@/lib/industry-packs";

export type QuestionInputType = "single" | "multiple" | "number";

export type Question = {
  id: string;
  module: string;
  text: string;
  inputType: QuestionInputType;
  options?: string[];
  critical: boolean;
};

export const STANDARD_QUESTIONS: Question[] = [
  { id: "std-1", module: "Foundational", text: "Primary business outcome sought", inputType: "single", options: ["Cost reduction", "Risk & compliance", "Growth enablement", "Operational efficiency", "Technology modernisation", "Other"], critical: true },
  { id: "std-2", module: "Foundational", text: "Trigger for acting now", inputType: "single", options: ["Contract/support expiry", "Regulatory deadline", "M&A / restructuring", "Leadership change", "Competitive pressure", "Other"], critical: false },
  { id: "std-3", module: "Foundational", text: "Economic buyer identified?", inputType: "single", options: ["Confirmed and engaged", "Identified, not yet engaged", "Not yet identified"], critical: true },
  { id: "std-4", module: "Foundational", text: "Technical decision-maker identified?", inputType: "single", options: ["Confirmed and engaged", "Identified, not yet engaged", "Not yet identified"], critical: false },
  { id: "std-5", module: "Foundational", text: "Procurement process type", inputType: "single", options: ["Direct award", "Competitive RFP", "Panel / framework", "Not yet defined"], critical: false },
  { id: "std-6", module: "Foundational", text: "Number of competing vendors in this pursuit", inputType: "number", critical: false },
  { id: "std-7", module: "Foundational", text: "Is there an incumbent provider?", inputType: "single", options: ["Yes — Oracle partner", "Yes — other SI", "No incumbent", "Unknown"], critical: false },
  { id: "std-8", module: "Foundational", text: "Budget funding status", inputType: "single", options: ["Approved and allocated", "Approved, pending sign-off", "Estimated, not approved", "Unfunded"], critical: true },
  { id: "std-9", module: "Foundational", text: "Target decision date known?", inputType: "single", options: ["Confirmed date", "Estimated quarter", "Unknown"], critical: true },
  { id: "std-10", module: "Foundational", text: "Number of internal stakeholders who must approve", inputType: "number", critical: false },
  { id: "std-11", module: "Foundational", text: "Current Oracle footprint", inputType: "single", options: ["Live Oracle estate", "Legacy on-prem only", "Non-Oracle incumbent", "Greenfield / no ERP"], critical: true },
  { id: "std-12", module: "Foundational", text: "Number of legal entities in scope", inputType: "number", critical: false },
  { id: "std-13", module: "Foundational", text: "Number of users in scope", inputType: "number", critical: false },
  { id: "std-14", module: "Foundational", text: "Data migration required?", inputType: "single", options: ["Yes — multi-year history", "Yes — limited history", "No migration required", "Undecided"], critical: false },
  { id: "std-15", module: "Foundational", text: "Number of system integrations expected", inputType: "number", critical: false },
  { id: "std-16", module: "Foundational", text: "Formal user-acceptance testing cycles expected", inputType: "number", critical: false },
  { id: "std-17", module: "Foundational", text: "Training approach expected", inputType: "single", options: ["Full end-user training", "Train-the-trainer", "Not yet discussed"], critical: false },
  { id: "std-18", module: "Foundational", text: "Client-side project resourcing", inputType: "single", options: ["Dedicated team assigned", "Partial availability", "Not yet assigned"], critical: false },
  { id: "std-19", module: "Foundational", text: "Oracle opportunity registration status", inputType: "single", options: ["Registered", "In progress", "Not registered"], critical: false },
];

export const ENGAGEMENT_PACKS: Record<EngagementType, Question[]> = {
  "Fusion implementation": [
    { id: "fus-1", module: "Fusion implementation", text: "Fusion pillars in scope", inputType: "multiple", options: ["Financials", "HCM", "SCM", "Procurement", "Projects", "Risk Management"], critical: true },
    { id: "fus-2", module: "Fusion implementation", text: "Net-new implementation or re-implementation?", inputType: "single", options: ["Net new", "Re-implementation", "Phase 2 expansion"], critical: false },
    { id: "fus-3", module: "Fusion implementation", text: "Number of business units to configure", inputType: "number", critical: false },
    { id: "fus-4", module: "Fusion implementation", text: "Legacy system(s) being replaced", inputType: "multiple", options: ["EBS", "PeopleSoft", "JD Edwards", "Third-party", "Spreadsheets / manual", "Other"], critical: false },
    { id: "fus-5", module: "Fusion implementation", text: "Parallel run required before cutover?", inputType: "single", options: ["Yes", "No", "Undecided"], critical: true },
  ],
  "EBS modernisation": [
    { id: "ebs-1", module: "EBS modernisation", text: "Current EBS version", inputType: "single", options: ["12.1", "12.2 (early CU)", "12.2 (current CU)", "Pre-12.1"], critical: false },
    { id: "ebs-2", module: "EBS modernisation", text: "Modernisation driver", inputType: "single", options: ["Support expiry", "Performance / scale", "Customisation burden", "Compliance"], critical: false },
    { id: "ebs-3", module: "EBS modernisation", text: "Number of custom forms / reports / extensions", inputType: "number", critical: true },
    { id: "ebs-4", module: "EBS modernisation", text: "Customisation documentation quality", inputType: "single", options: ["Well documented", "Partially documented", "Undocumented"], critical: false },
    { id: "ebs-5", module: "EBS modernisation", text: "Cutover window constraint", inputType: "single", options: ["Weekend cutover required", "Extended downtime acceptable", "Zero-downtime required"], critical: false },
  ],
  "Managed services": [
    { id: "mgs-1", module: "Managed services", text: "Current support model", inputType: "single", options: ["In-house team", "Existing AMS provider", "No formal support", "Vendor break/fix only"], critical: false },
    { id: "mgs-2", module: "Managed services", text: "Required coverage window", inputType: "single", options: ["Business hours", "Extended hours", "24x7"], critical: false },
    { id: "mgs-3", module: "Managed services", text: "SLA requirements defined?", inputType: "single", options: ["Yes — documented", "Informal expectations only", "Not yet defined"], critical: true },
    { id: "mgs-4", module: "Managed services", text: "Number of applications / modules to be supported", inputType: "number", critical: false },
    { id: "mgs-5", module: "Managed services", text: "Ticket volume estimate per month", inputType: "number", critical: false },
  ],
  EPM: [
    { id: "epm-1", module: "EPM", text: "EPM scope", inputType: "multiple", options: ["Consolidation", "Planning / Budgeting", "Account Reconciliation", "Tax Reporting", "Narrative Reporting"], critical: false },
    { id: "epm-2", module: "EPM", text: "Number of entities being consolidated", inputType: "number", critical: true },
    { id: "epm-3", module: "EPM", text: "Currencies involved", inputType: "number", critical: false },
    { id: "epm-4", module: "EPM", text: "Current consolidation method", inputType: "single", options: ["Manual / spreadsheet", "Legacy EPM tool", "Partial automation"], critical: false },
    { id: "epm-5", module: "EPM", text: "Intercompany eliminations automated today?", inputType: "single", options: ["Yes", "No", "Partially"], critical: false },
  ],
  "HCM/payroll": [
    { id: "hcm-1", module: "HCM/payroll", text: "Countries requiring payroll localisation", inputType: "number", critical: true },
    { id: "hcm-2", module: "HCM/payroll", text: "Employee population in scope", inputType: "number", critical: true },
    { id: "hcm-3", module: "HCM/payroll", text: "Multiple assignments per worker required?", inputType: "single", options: ["Yes", "No", "Unknown"], critical: false },
    { id: "hcm-4", module: "HCM/payroll", text: "Existing payroll engine(s)", inputType: "single", options: ["Oracle payroll", "Third-party in-country vendor", "Manual / spreadsheet", "Mixed"], critical: false },
    { id: "hcm-5", module: "HCM/payroll", text: "Parallel payroll cycles expected", inputType: "number", critical: false },
  ],
  "Security/SOD": [
    { id: "sod-1", module: "Security/SOD", text: "Engagement type", inputType: "single", options: ["Full SOD redesign", "SOD review / assessment", "Remediation only"], critical: false },
    { id: "sod-2", module: "Security/SOD", text: "Regulatory or audit driver present?", inputType: "single", options: ["Yes", "No", "Unknown"], critical: true },
    { id: "sod-3", module: "Security/SOD", text: "Number of roles / responsibilities in scope", inputType: "number", critical: false },
    { id: "sod-4", module: "Security/SOD", text: "SSO / identity federation in scope?", inputType: "single", options: ["Yes", "No", "Undecided"], critical: false },
    { id: "sod-5", module: "Security/SOD", text: "Prior SOD ruleset exists?", inputType: "single", options: ["Yes — governed", "Yes — informal", "No ruleset"], critical: false },
  ],
  OCI: [
    { id: "oci-1", module: "OCI", text: "Migration type", inputType: "single", options: ["Lift-and-shift", "Re-architecture", "Hybrid"], critical: false },
    { id: "oci-2", module: "OCI", text: "Current hosting model", inputType: "single", options: ["On-prem", "Other cloud", "Oracle Cloud (legacy tier)", "Mixed"], critical: false },
    { id: "oci-3", module: "OCI", text: "Weekend / phased cutover required?", inputType: "single", options: ["Weekend cutover", "Phased migration", "Undecided"], critical: true },
    { id: "oci-4", module: "OCI", text: "Network / compliance constraints identified?", inputType: "single", options: ["Yes — documented", "Some known", "Not yet assessed"], critical: false },
    { id: "oci-5", module: "OCI", text: "Number of environments to migrate", inputType: "number", critical: false },
  ],
  "APEX/ECC": [
    { id: "apx-1", module: "APEX/ECC", text: "Number of custom APEX / forms / ECC objects", inputType: "number", critical: true },
    { id: "apx-2", module: "APEX/ECC", text: "Modernisation driver", inputType: "single", options: ["Technical debt", "Oracle roadmap alignment", "Performance", "User experience"], critical: false },
    { id: "apx-3", module: "APEX/ECC", text: "Retirement candidates identified?", inputType: "single", options: ["Yes", "No", "Not yet assessed"], critical: false },
    { id: "apx-4", module: "APEX/ECC", text: "Technical documentation quality", inputType: "single", options: ["Well documented", "Partially documented", "Undocumented"], critical: false },
    { id: "apx-5", module: "APEX/ECC", text: "Target platform", inputType: "single", options: ["OCI", "On-prem", "Undecided"], critical: false },
  ],
};

export const MULTI_COUNTRY_PACK: Question[] = [
  { id: "ctx-mc-1", module: "Multi-country", text: "Are statutory / tax requirements confirmed for each country?", inputType: "single", options: ["Yes — all countries", "Partially", "Not yet"], critical: true },
  { id: "ctx-mc-2", module: "Multi-country", text: "Local-language reporting required?", inputType: "single", options: ["Yes", "No", "Some countries"], critical: false },
  { id: "ctx-mc-3", module: "Multi-country", text: "Number of local entities / legal registrations", inputType: "number", critical: false },
];

// Superseded by authored industry packs. Retained in the lookup index only so
// answers captured against these ids before the migration still resolve.
export const REGULATED_INDUSTRY_PACK: Question[] = [
  { id: "ctx-reg-1", module: "Regulated industry", text: "Regulatory framework applicable", inputType: "multiple", options: ["Data residency", "Sector-specific compliance", "Government security clearance", "None identified"], critical: false },
  { id: "ctx-reg-2", module: "Regulated industry", text: "Government approval / procurement gate required?", inputType: "single", options: ["Yes", "No", "Unknown"], critical: true },
];

export const COMMERCIAL_MODEL_PACK: Question[] = [
  { id: "ctx-cm-1", module: "Commercial model", text: "Contract term requested", inputType: "single", options: ["12 months", "24–36 months", "36+ months", "Undecided"], critical: false },
  { id: "ctx-cm-2", module: "Commercial model", text: "Renewal / exit terms discussed?", inputType: "single", options: ["Yes", "No", "Not yet"], critical: false },
];

// Collapses layered packs to one question per id, first occurrence winning.
// Without this a question contributed by two packs would be counted twice in
// the coverage denominator (scoring.ts), permanently capping coverage below
// 100%, and would render twice with duplicate React keys.
function dedupeById(questions: Question[]): Question[] {
  const seen = new Set<string>();
  return questions.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)));
}

export function getActiveQuestions(dna: DealDNA): Question[] {
  const active: Question[] = [...STANDARD_QUESTIONS];

  if (dna.engagementType) {
    active.push(...ENGAGEMENT_PACKS[dna.engagementType]);
  }
  if (dna.countries.length > 1) {
    active.push(...MULTI_COUNTRY_PACK);
  }
  // The industry's authored pack. Read synchronously from the pack cache; see
  // lib/industry-packs.ts for why resolution is split async-load/sync-read.
  // This replaced a case-sensitive `REGULATED_INDUSTRIES.includes(industry)`
  // check against a free-text field, where "healthcare" silently matched
  // nothing and all seven regulated industries got the same two questions.
  const pack = getPackSync(dna.industryId);
  if (pack) {
    active.push(...pack.questions);
  }
  if (dna.commercialModel === "Managed service" || dna.commercialModel === "Subscription") {
    active.push(...COMMERCIAL_MODEL_PACK);
  }

  return dedupeById(active);
}

// Every question this module can produce, indexed for lookup. Derived from the
// same pack constants getActiveQuestions layers, so a pack cannot be added to
// one and forgotten in the other — that omission used to surface as a thrown
// "Unknown question id" on answer submission (answer-graph.ts).
const QUESTION_SOURCES: Question[][] = [
  STANDARD_QUESTIONS,
  ...Object.values(ENGAGEMENT_PACKS),
  MULTI_COUNTRY_PACK,
  REGULATED_INDUSTRY_PACK,
  COMMERCIAL_MODEL_PACK,
];

const QUESTION_INDEX: Map<string, Question> = new Map(
  QUESTION_SOURCES.flat().map((q) => [q.id, q])
);

export function getQuestionById(id: string): Question | undefined {
  const builtIn = QUESTION_INDEX.get(id);
  if (builtIn) return builtIn;

  // Pack-authored questions are not in the built-in index. Without this an
  // answer to an industry question throws "Unknown question id" on submit.
  for (const pack of getAllCachedPacks()) {
    const found = pack.questions.find((q) => q.id === id);
    if (found) return found;
  }
  return undefined;
}

export const STANDARD_QUESTION_COUNT = STANDARD_QUESTIONS.length; // 19
