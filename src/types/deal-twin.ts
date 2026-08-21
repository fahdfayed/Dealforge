// The Living Deal Twin payload shape (doc sections 3.1 and 16). This is what
// gets JSON-serialized into deal_states.payload. Every field starts empty —
// "Empty by default: no opportunity is populated with fake customer facts."

export const STAGES = [
  "New",
  "Qualifying",
  "Discovery",
  "Solution shaping",
  "Commercial review",
  "Proposal",
  "Negotiation",
  "Preferred",
  "Won",
  "Nurture",
] as const;
export type Stage = (typeof STAGES)[number];

export const AUTHORITIES = [
  "Confirmed",
  "Document",
  "Proposed",
  "Assumed",
  "Unknown",
  "Contradictory",
] as const;
export type Authority = (typeof AUTHORITIES)[number];

// The service lines we sell. Oracle is the core, so this is a closed catalogue
// in code rather than authored data — unlike client industry, which is
// open-ended (see lib/industry-packs.ts).
export const ENGAGEMENT_TYPES = [
  "Fusion implementation",
  "EBS modernisation",
  "Managed services",
  "EPM",
  "HCM/payroll",
  "Security/SOD",
  "OCI",
  "APEX & VBCS",
  "ECC",
  "Integration",
  "BI & Analytics",
  "Database & Infrastructure",
  "Testing & QA",
  "Staff augmentation / AMS",
] as const;
export type EngagementType = (typeof ENGAGEMENT_TYPES)[number];

// Engagement types that have been renamed or split. A stored deal keeps
// whatever string was written when it was saved, and an unrecognised value
// reaches Record<EngagementType, …> lookups as undefined, which throws when
// spread. Mapping on read keeps old deals loadable.
//
// "APEX/ECC" conflated a low-code platform with Enterprise Command Center;
// deals carrying it are read as the APEX side, which is the far more common
// sale of the two.
const LEGACY_ENGAGEMENT_TYPES: Record<string, EngagementType> = {
  "APEX/ECC": "APEX & VBCS",
};

export function normaliseEngagementType(value: string | null): EngagementType | null {
  if (!value) return null;
  if ((ENGAGEMENT_TYPES as readonly string[]).includes(value)) return value as EngagementType;
  return LEGACY_ENGAGEMENT_TYPES[value] ?? null;
}

export const COMMERCIAL_MODELS = [
  "Fixed price",
  "Time & materials",
  "Managed service",
  "Subscription",
] as const;
export type CommercialModelType = (typeof COMMERCIAL_MODELS)[number];

export const CLIENT_TYPES = ["New logo", "Existing client", "Re-engagement"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const MOMENTUM_STATES = ["Accelerating", "Steady", "Stalling", "At risk"] as const;
export type Momentum = (typeof MOMENTUM_STATES)[number];

export type Factor = 1 | 2 | 3 | 4 | 5;

export type Identity = {
  company: string;
  initials: string;
  engagementTitle: string;
  stage: Stage;
  owner: string;
  dueDate: string | null;
};

export type CommercialHeadline = {
  opportunityValue: number | null;
  currency: string;
  crmProbability: number | null;
  momentum: Momentum;
  currentMargin: number | null;
  nextMove: string;
};

// Deal DNA "factors" are controlled 1-5 selections, not free text, per the
// "controlled input first" design principle.
export type DealDNA = {
  engagementType: EngagementType | null;
  // The authored industry this deal belongs to, normally inherited from the
  // account. `industry` is the denormalized display name kept alongside it so
  // existing deals, PDFs and the compare view keep working while deals are
  // migrated onto accounts.
  industryId: string | null;
  industry: string;
  countries: string[];
  clientType: ClientType | null;
  commercialModel: CommercialModelType | null;
  entityCount: number | null;
  userCount: number | null;
  relationshipFactor: Factor | null;
  budgetFactor: Factor | null;
  scopeFactor: Factor | null;
  evidenceQualityFactor: Factor | null;
  stakeholderFactor: Factor | null;
  oracleFactor: Factor | null;
  deliveryFactor: Factor | null;
  strategicFitFactor: Factor | null;
  paymentFactor: Factor | null;
  urgencyFactor: Factor | null;
};

export type StructuredAnswer = {
  questionId: string;
  values: string[];
  numberValue: number | null;
  authority: Authority;
  source: string;
  confidence: number | null;
  answeredAt: string;
  impacts: string[];
};

export type EvidenceItem = {
  id: string;
  label: string;
  source: string;
  authority: Authority;
  confidence: number;
  capturedAt: string;
  expiresAt: string | null;
  impacts: string[];
};

export const SOLUTION_PATHS = ["Stabilise", "Modernise", "Transform"] as const;
export type SolutionPath = (typeof SOLUTION_PATHS)[number];

export const DELIVERY_MODELS = [
  "Standard",
  "Accelerated",
  "Rapid",
  "Parallel",
  "Phased",
  "Wave",
  "Pilot",
] as const;
export type DeliveryModel = (typeof DELIVERY_MODELS)[number];

export type DesignLevers = {
  investmentFlexibility: Factor;
  speedPressure: Factor;
  changeCapacity: Factor;
  scopeCertainty: Factor;
  transformationAmbition: Factor;
};

export const PRIORITIES = ["Required", "Recommended", "Optional"] as const;
export type Priority = (typeof PRIORITIES)[number];

// Where a component came from. `custom` on SolutionComponent already marks
// user-added ones; this distinguishes the catalogue layers from each other so
// the UI can show why a component is proposed.
export type ComponentSource = "engagement" | "industry" | "common" | "apex" | "custom";

export type SolutionComponent = {
  id: string;
  // The catalogue template this came from, absent for user-added components.
  templateKey?: string;
  source?: ComponentSource;
  category: string;
  label: string;
  included: boolean;
  priority: Priority;
  phase: number;
  confidence: number;
  authority: Authority;
  effortDays: number;
  outcome: string;
  risk: "Low" | "Medium" | "High";
  dependencyIds: string[];
  custom: boolean;
};

export type SolutionDependency = {
  id: string;
  description: string;
  classification: "Critical path" | "Cross-workstream";
  status: "Open" | "Resolved" | "Retained";
};

export type SolutionBlueprint = {
  selectedPath: SolutionPath | null;
  objective: string;
  deliveryModel: DeliveryModel;
  designLevers: DesignLevers;
  components: SolutionComponent[];
  dependencies: SolutionDependency[];
  exclusions: string[];
  responsibilities: string[];
  clientLanguage: {
    solutionTitle: string;
    pathNames: Record<SolutionPath, string>;
    phaseNames: Record<number, string>;
    phasePurposes: Record<number, string>;
    storyHeadings: string[];
    decisionAsk: string;
  };
};

export const PAYMENT_STRUCTURES = [
  "Milestone",
  "Monthly",
  "Upfront + milestones",
  "Subscription",
] as const;
export type PaymentStructure = (typeof PAYMENT_STRUCTURES)[number];

export type CommercialScenarioInputs = {
  baseEffortDays: number;
  entities: number;
  countries: number;
  interfaces: number;
  validationCycles: number;
  contextDrivers: { label: string; effortDays: number }[];
  onSitePct: number;
  contingencyPct: number;
  discountPct: number;
  paymentStructure: PaymentStructure;
  internalDailyCost: number;
  customerDailyRate: number;
  travelPerOnSiteDay: number;
};

export const SCENARIO_STATUSES = ["Draft", "Pending approval", "Approved", "Rejected"] as const;
export type ScenarioStatus = (typeof SCENARIO_STATUSES)[number];

export type CommercialScenario = {
  id: string;
  name: string;
  savedAt: string;
  status: ScenarioStatus;
  inputs: CommercialScenarioInputs;
  adjustedEffortDays: number;
  internalCost: number;
  travelExposure: number;
  customerPrice: number;
  grossMarginPct: number;
  p50Days: number;
  p80Days: number;
  approvalExceptions: string[];
  approvals: ApprovalRecord[];
};

export const PROPOSAL_FORMATS = ["Formal document", "Executive presentation"] as const;
export type ProposalFormat = (typeof PROPOSAL_FORMATS)[number];

export const PROPOSAL_PERSONAS = [
  "CFO",
  "CIO",
  "HR Director",
  "Procurement",
  "CEO",
  "Oracle representative",
] as const;
export type ProposalPersona = (typeof PROPOSAL_PERSONAS)[number];

export const PROPOSAL_STATUSES = ["Draft", "Pending approval", "Approved", "Sent"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export type ApprovalRecord = {
  id: string;
  approvedBy: string;
  decision: "approved" | "rejected";
  comment: string;
  decidedAt: string;
};

export type ProposalDraft = {
  id: string;
  persona: ProposalPersona;
  title: string;
  format: ProposalFormat;
  reference: string;
  version: number;
  validUntil: string | null;
  terms: string;
  createdAt: string;
  status: ProposalStatus;
  commercialScenarioId: string | null;
  approvals: ApprovalRecord[];
};

export const PROMISE_CLASSIFICATIONS = [
  "Contractual commitment",
  "Proposed deliverable",
  "Assumption",
  "Exclusion",
  "Client responsibility",
  "Informal discussion",
] as const;
export type PromiseClassification = (typeof PROMISE_CLASSIFICATIONS)[number];

export const COMMERCIAL_TRACES = ["Priced", "Not priced", "Pending", "Not applicable"] as const;
export type CommercialTrace = (typeof COMMERCIAL_TRACES)[number];

export type PromiseRecord = {
  id: string;
  statement: string;
  classification: PromiseClassification;
  source: string;
  owner: string;
  commercialTrace: CommercialTrace;
  createdAt: string;
};

export const HANDSHAKE_RESPONSES = ["Not decided", "Confirmed", "Needs discussion", "Incorrect"] as const;
export type HandshakeResponse = (typeof HANDSHAKE_RESPONSES)[number];

export type ScopeHandshakeItem = {
  id: string;
  statement: string;
  response: HandshakeResponse;
  updatedAt: string;
};

export type ClientRoomState = {
  published: boolean;
  publishedAt: string | null;
  baselineRevision: number | null;
  meetingRequests: { id: string; note: string; requestedAt: string }[];
};

export const ACTION_STATUSES = ["Open", "In progress", "Completed", "Cancelled"] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export type AllianceAction = {
  id: string;
  action: string;
  owner: string;
  dueWindow: string;
  status: ActionStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CoordinationEvent = { id: string; label: string; occurredAt: string };
export type CoordinationSignal = { id: string; label: string; detectedAt: string };

export type TeamComment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  replies: TeamComment[];
};

export type DealTwin = {
  identity: Identity;
  commercialHeadline: CommercialHeadline;
  dealDNA: DealDNA;
  answers: StructuredAnswer[];
  // Answers whose question left the active set after a Deal DNA change. Held
  // aside rather than deleted: doc 4.1 requires that they stop counting, not
  // that the work is lost. Restored to `answers` if the question returns.
  archivedAnswers: StructuredAnswer[];
  activeQuestionIds: string[];
  evidence: EvidenceItem[];
  solution: SolutionBlueprint;
  commercialScenarios: CommercialScenario[];
  savedCommercialScenarioId: string | null;
  proposals: ProposalDraft[];
  promises: PromiseRecord[];
  scopeHandshake: ScopeHandshakeItem[];
  proofLinks: string[];
  clientRoom: ClientRoomState;
  allianceActions: AllianceAction[];
  coordinationEvents: CoordinationEvent[];
  coordinationSignals: CoordinationSignal[];
  teamComments: TeamComment[];
};

// A Deal is the deal_states row: revision-controlled envelope around a
// DealTwin payload.
export type Deal = {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  twin: DealTwin;
};

export function createEmptyDealTwin(seed: { company: string; owner: string }): DealTwin {
  return {
    identity: {
      company: seed.company,
      initials: initialsOf(seed.company),
      engagementTitle: "",
      stage: "New",
      owner: seed.owner,
      dueDate: null,
    },
    commercialHeadline: {
      opportunityValue: null,
      currency: "USD",
      crmProbability: null,
      momentum: "Steady",
      currentMargin: null,
      nextMove: "",
    },
    dealDNA: {
      engagementType: null,
      industryId: null,
      industry: "",
      countries: [],
      clientType: null,
      commercialModel: null,
      entityCount: null,
      userCount: null,
      relationshipFactor: null,
      budgetFactor: null,
      scopeFactor: null,
      evidenceQualityFactor: null,
      stakeholderFactor: null,
      oracleFactor: null,
      deliveryFactor: null,
      strategicFitFactor: null,
      paymentFactor: null,
      urgencyFactor: null,
    },
    answers: [],
    archivedAnswers: [],
    activeQuestionIds: [],
    evidence: [],
    solution: {
      selectedPath: null,
      objective: "",
      deliveryModel: "Standard",
      designLevers: {
        investmentFlexibility: 3,
        speedPressure: 3,
        changeCapacity: 3,
        scopeCertainty: 3,
        transformationAmbition: 3,
      },
      components: [],
      dependencies: [],
      exclusions: [],
      responsibilities: [],
      clientLanguage: {
        solutionTitle: "",
        pathNames: { Stabilise: "Stabilise", Modernise: "Modernise", Transform: "Transform" },
        phaseNames: {},
        phasePurposes: {},
        storyHeadings: [],
        decisionAsk: "",
      },
    },
    commercialScenarios: [] as CommercialScenario[],
    savedCommercialScenarioId: null,
    proposals: [] as ProposalDraft[],
    promises: [],
    scopeHandshake: [],
    proofLinks: [],
    clientRoom: { published: false, publishedAt: null, baselineRevision: null, meetingRequests: [] },
    allianceActions: [],
    coordinationEvents: [],
    coordinationSignals: [],
    teamComments: [],
  };
}

function initialsOf(company: string): string {
  return company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
