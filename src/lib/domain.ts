// Shared vocabulary for the Living Deal Twin: deal types, modules, discovery
// question templates, status labels and colours, and estimator constants.

export const DEAL_TYPES = [
  "EBS Upgrade",
  "Fusion Implementation",
  "Managed Services",
  "EPM / Consolidation",
  "HCM & Payroll",
  "Security & SOD Review",
  "OCI Migration",
  "APEX / ECC Modernisation",
] as const;

export type DealType = (typeof DEAL_TYPES)[number];

export const MODULE_OPTIONS = [
  "Finance",
  "HCM & Payroll",
  "Integrations",
  "Data Migration",
  "Security & SOD",
  "EPM & Consolidation",
  "OCI & Technical Architecture",
  "APEX / Custom Apps",
  "Change Management",
] as const;

export type ModuleOption = (typeof MODULE_OPTIONS)[number];

// Every opportunity gets these questions regardless of module selection.
export const COMMERCIAL_MODULE = "Commercial & Governance";

type QuestionTemplate = { text: string; criticalForPricing?: boolean };

export const DISCOVERY_TEMPLATES: Record<string, QuestionTemplate[]> = {
  Finance: [
    { text: "Which legal entities and ledgers are in scope?", criticalForPricing: true },
    { text: "How many business units and cost centres exist today?" },
    { text: "What is the chart-of-accounts structure and does it need redesign?", criticalForPricing: true },
    { text: "Which sub-ledgers (AP, AR, FA, CM) are in scope?" },
    { text: "Are there statutory or tax localisation requirements per country?", criticalForPricing: true },
    { text: "What is the monthly/quarterly close process and pain points?" },
    { text: "Are there existing consolidation or intercompany elimination rules?" },
  ],
  "HCM & Payroll": [
    { text: "What are the employee populations by country?", criticalForPricing: true },
    { text: "Which countries require payroll localisation?", criticalForPricing: true },
    { text: "Are multiple assignments per worker required?" },
    { text: "Is time and attendance in scope, and which devices/rules apply?" },
    { text: "What is the existing payroll engine(s) and is parallel run required?", criticalForPricing: true },
    { text: "How many years of historical data must be migrated?" },
    { text: "What are the approval structures for HR transactions?" },
    { text: "Which interfaces touch payroll (banking, GL, benefits providers)?" },
    { text: "What statutory/Arabic reporting is required?" },
  ],
  Integrations: [
    { text: "How many integrations are required and with which systems?", criticalForPricing: true },
    { text: "Which integrations are real-time vs batch?" },
    { text: "Is there an existing integration platform (OIC, middleware)?" },
    { text: "Are any third-party vendors involved who must be coordinated with?", criticalForPricing: true },
    { text: "What data volumes and frequency are expected per interface?" },
  ],
  "Data Migration": [
    { text: "Which data objects must be migrated (masters, transactions, balances)?", criticalForPricing: true },
    { text: "How many years of historical data are required?", criticalForPricing: true },
    { text: "What is the current data quality and is cleansing needed?" },
    { text: "Who owns data cleansing — client or Intelloger?" },
    { text: "How many mock/trial loads and reconciliation cycles are expected?" },
  ],
  "Security & SOD": [
    { text: "Is a full segregation-of-duties redesign required or a review only?" },
    { text: "How many roles/responsibilities exist today?" },
    { text: "Are there regulatory or audit drivers for this work?", criticalForPricing: true },
    { text: "Is single sign-on / identity federation in scope?" },
  ],
  "EPM & Consolidation": [
    { text: "How many entities and currencies are consolidated?", criticalForPricing: true },
    { text: "What are the current close and consolidation pain points?" },
    { text: "Is planning/budgeting in scope in addition to consolidation?" },
    { text: "Are intercompany eliminations automated today?" },
  ],
  "OCI & Technical Architecture": [
    { text: "What is the current infrastructure and hosting model?", criticalForPricing: true },
    { text: "Is this a lift-and-shift or a re-architecture?" },
    { text: "What are the network, security and compliance constraints?" },
    { text: "Is a weekend or phased cutover required?", criticalForPricing: true },
  ],
  "APEX / Custom Apps": [
    { text: "How many custom APEX/forms/reports exist and must be modernised?", criticalForPricing: true },
    { text: "What is the current technical debt / documentation quality?" },
    { text: "Are any of the customisations candidates for retirement instead of migration?" },
  ],
  "Change Management": [
    { text: "What training populations and delivery languages are required?" },
    { text: "Is train-the-trainer acceptable or is direct end-user training required?" },
    { text: "What is the client's change-readiness and communication capacity?" },
  ],
  [COMMERCIAL_MODULE]: [
    { text: "What is the budget range and funding status?", criticalForPricing: true },
    { text: "What is the desired go-live / decision timeline?", criticalForPricing: true },
    { text: "Who are the economic buyer and key decision-makers?" },
    { text: "Are there competitors or an incumbent provider involved?" },
    { text: "Is this opportunity registered with Oracle?" },
    { text: "What commercial constraints exist (payment terms, currency, procurement process)?" },
  ],
};

export const DEAL_ITEM_STATUS_META = {
  CONFIRMED_BY_CLIENT: { label: "Confirmed by client", color: "emerald" },
  FOUND_IN_DOCUMENTS: { label: "Found in submitted documents", color: "sky" },
  ASSUMED_BY_INTELLOGER: { label: "Assumed by Intelloger", color: "amber" },
  INTERNALLY_PROPOSED: { label: "Internally proposed", color: "violet" },
  STILL_UNKNOWN: { label: "Still unknown", color: "slate" },
  CONTRADICTORY: { label: "Contradictory information", color: "rose" },
} as const;

export type DealItemStatusKey = keyof typeof DEAL_ITEM_STATUS_META;

export const DEAL_ITEM_CATEGORIES = [
  "Company",
  "Oracle Environment",
  "Stakeholders",
  "Budget & Timeline",
  "Competitors",
  "Risks & Assumptions",
  "Oracle Account Team",
  "Commitments",
] as const;

export const PROMISE_CLASSIFICATION_META = {
  CONTRACTUAL_COMMITMENT: { label: "Contractual commitment", color: "rose" },
  PROPOSED_DELIVERABLE: { label: "Proposed deliverable", color: "sky" },
  ASSUMPTION: { label: "Assumption", color: "amber" },
  EXCLUSION: { label: "Exclusion", color: "slate" },
  TARGET: { label: "Target", color: "violet" },
  INFORMAL_DISCUSSION: { label: "Informal discussion", color: "slate" },
  CLIENT_RESPONSIBILITY: { label: "Client responsibility", color: "emerald" },
  PENDING_CONFIRMATION: { label: "Pending confirmation", color: "amber" },
} as const;

export type PromiseClassificationKey = keyof typeof PROMISE_CLASSIFICATION_META;

// Statements that carry a delivery obligation and therefore must be backed
// by commercial effort in the estimate before a proposal can go out.
export const PROMISE_KINDS_REQUIRING_EFFORT: PromiseClassificationKey[] = [
  "CONTRACTUAL_COMMITMENT",
  "PROPOSED_DELIVERABLE",
];

export const PROPOSAL_STATUS_META = {
  DRAFT: { label: "Draft", color: "slate" },
  PENDING_APPROVAL: { label: "Pending approval", color: "amber" },
  APPROVED: { label: "Approved", color: "emerald" },
  SENT: { label: "Sent", color: "sky" },
} as const;

export const PROPOSAL_DOC_TYPES = [
  "Executive Proposal",
  "Full Technical & Commercial Proposal",
  "Statement of Work",
  "Budgetary Estimate",
  "Executive One-Pager",
] as const;

export const PROPOSAL_PERSONAS = [
  "CFO",
  "CIO",
  "HR Director",
  "Procurement",
  "CEO",
  "Oracle Representative",
] as const;

export const COMPLEXITY_MULTIPLIERS = [
  { key: "multiCountryPayroll", label: "Multi-country payroll", factor: 0.2 },
  { key: "regulatedClient", label: "Government or regulated client", factor: 0.15 },
  { key: "aggressiveDeadline", label: "Aggressive deadline", factor: 0.15 },
  { key: "poorDocumentation", label: "Poor legacy documentation", factor: 0.12 },
  { key: "multipleThirdParties", label: "Multiple third parties", factor: 0.1 },
  { key: "weekendCutover", label: "Weekend cutover", factor: 0.08 },
  { key: "largeHistoricalMigration", label: "Large historical data migration", factor: 0.15 },
  { key: "highCustomisation", label: "High customisation", factor: 0.18 },
  { key: "arabicRequirements", label: "Arabic requirements", factor: 0.08 },
  { key: "clientResourceConstraints", label: "Client-side resource constraints", factor: 0.12 },
] as const;

export const PROOF_ITEM_TYPES = [
  "Reference",
  "Case Study",
  "Consultant CV",
  "Certification",
  "Architecture Diagram",
  "SOW Template",
] as const;

export const PROOF_CONFIDENTIALITY_LEVELS = [
  "Publicly usable",
  "Name-confidential",
  "Verbal only",
  "Requires permission",
  "Expired",
] as const;

export function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
