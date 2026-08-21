// The requisition lifecycle, its SLAs, and the gate that opens sourcing.
//
// The complaint this answers is that requirements went straight to sourcing
// before anyone had established they were fillable, so recruiters burned days
// on roles that were never going to close, and nobody could say afterwards
// where the time went. The stages below are the agreed order of work, each one
// with an owner and a clock, and sourcing is gated rather than assumed.
//
// Pure domain logic: no database import, so this stays testable and the rules
// live in one place rather than being re-implemented in each screen.

export const REQUISITION_STATUSES = [
  "Raised",
  "Acknowledged",
  "Calibrated",
  "Resourcing checked",
  "Sourcing",
  "Returned to sales",
  "Filled",
  "On hold",
  "Cancelled",
] as const;
export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number];

export const REQUISITION_PRIORITIES = ["Critical", "High", "Normal"] as const;
export type RequisitionPriority = (typeof REQUISITION_PRIORITIES)[number];

export const RESOURCING_OUTCOMES = [
  "Internal candidate available",
  "Partial internal fit",
  "No internal candidate",
  "Not yet checked",
] as const;
export type ResourcingOutcome = (typeof RESOURCING_OUTCOMES)[number];

export const GO_DECISIONS = ["Go", "No-go"] as const;
export type GoDecision = (typeof GO_DECISIONS)[number];

// Who is accountable for each step. Vishal and Ashish were explicit that the
// resourcing check belongs to the practice head, not TA, so ownership is
// recorded rather than left to convention.
export const STEP_OWNERS = {
  acknowledge: "Talent acquisition",
  calibration: "TA, sales and practice head",
  resourcingCheck: "Practice head",
  decision: "TA and practice head",
  firstProfile: "Talent acquisition",
} as const;

// Hours allowed for each step, measured from the point the clock starts.
//
// Acknowledgement, calibration and the decision all run from when the
// requirement was raised — they are the same 24 hours, not three consecutive
// days. The profile clock starts at the go decision, because that is when
// sourcing is actually permitted to begin.
export const SLA_HOURS = {
  acknowledge: 24,
  calibration: 24,
  decision: 24,
  firstProfile: 24,
} as const;

export type SlaKey = keyof typeof SLA_HOURS;

export type Requisition = {
  id: string;
  reference: string;
  accountId: string | null;
  accountName: string;
  dealId: string | null;
  roleTitle: string;
  primarySkill: string;
  requiredSkills: string[];
  positions: number;
  location: string;
  country: string;
  durationMonths: number | null;
  budgetRate: number | null;
  budgetCurrency: string;
  budgetRateUnit: string;
  minYears: number | null;
  startBy: string | null;
  priority: RequisitionPriority;
  jobDescription: string;
  raisedBy: string;
  salesOwner: string;
  taOwner: string;
  practiceHead: string;
  status: RequisitionStatus;
  raisedAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string;
  calibratedAt: string | null;
  calibrationNotes: string;
  calibrationParticipants: string[];
  resourcingCheckedAt: string | null;
  resourcingCheckedBy: string;
  resourcingOutcome: ResourcingOutcome;
  resourcingNotes: string;
  decision: GoDecision | null;
  decisionAt: string | null;
  decisionBy: string;
  decisionReason: string;
  firstProfileAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SlaState = {
  key: SlaKey;
  label: string;
  owner: string;
  startedAt: string | null;
  // Null when the step has not started, so nothing is owed yet.
  dueAt: string | null;
  metAt: string | null;
  status: "not started" | "met" | "due" | "breached";
  hoursRemaining: number | null;
  hoursLate: number | null;
};

const SLA_LABELS: Record<SlaKey, string> = {
  acknowledge: "Acknowledge requirement",
  calibration: "Hold calibration call",
  decision: "Go / no-go decision",
  firstProfile: "First profile to client",
};

function hoursBetween(fromIso: string, toMs: number): number {
  return (toMs - Date.parse(fromIso)) / (1000 * 60 * 60);
}

function evaluate(
  key: SlaKey,
  startedAt: string | null,
  metAt: string | null,
  now: number
): SlaState {
  const owner =
    key === "acknowledge" || key === "firstProfile"
      ? STEP_OWNERS.acknowledge
      : key === "calibration"
        ? STEP_OWNERS.calibration
        : STEP_OWNERS.decision;

  const base: SlaState = {
    key,
    label: SLA_LABELS[key],
    owner,
    startedAt,
    dueAt: null,
    metAt,
    status: "not started",
    hoursRemaining: null,
    hoursLate: null,
  };

  if (!startedAt) return base;

  const dueMs = Date.parse(startedAt) + SLA_HOURS[key] * 60 * 60 * 1000;
  base.dueAt = new Date(dueMs).toISOString();

  if (metAt) {
    // A step completed after its deadline is still a breach. Recording it as
    // met would make the weekly numbers flatter than reality.
    const lateBy = hoursBetween(base.dueAt, Date.parse(metAt));
    base.status = lateBy > 0 ? "breached" : "met";
    base.hoursLate = lateBy > 0 ? lateBy : null;
    return base;
  }

  const remaining = hoursBetween(new Date(now).toISOString(), dueMs);
  if (remaining >= 0) {
    base.status = "due";
    base.hoursRemaining = remaining;
  } else {
    base.status = "breached";
    base.hoursLate = -remaining;
  }
  return base;
}

// A requisition that was closed without ever reaching a step does not owe that
// step: a cancelled requirement has no outstanding profile obligation.
const TERMINAL: ReadonlySet<RequisitionStatus> = new Set<RequisitionStatus>([
  "Returned to sales",
  "Filled",
  "Cancelled",
]);

export function slaStates(req: Requisition, now: number = Date.now()): SlaState[] {
  const stopped = TERMINAL.has(req.status);
  const stopAt = stopped ? (req.closedAt ?? req.updatedAt) : null;

  const withStop = (state: SlaState): SlaState => {
    if (!stopped || state.metAt) return state;
    // Clock stopped without the step happening: report it as not started
    // rather than accruing lateness against a requirement nobody is working.
    return { ...state, status: "not started", hoursRemaining: null, hoursLate: null, dueAt: null };
  };

  return [
    evaluate("acknowledge", req.raisedAt, req.acknowledgedAt, now),
    evaluate("calibration", req.raisedAt, req.calibratedAt, now),
    evaluate("decision", req.raisedAt, req.decisionAt, now),
    // Only runs once a Go has been given. A no-go owes no profile.
    evaluate(
      "firstProfile",
      req.decision === "Go" ? req.decisionAt : null,
      req.firstProfileAt,
      now
    ),
  ].map(withStop).map((s) => (stopAt && !s.metAt ? { ...s, dueAt: null } : s));
}

export type GateRequirement = {
  id: string;
  label: string;
  met: boolean;
  detail: string;
};

// What must be true before external sourcing can start.
//
// searchLogged comes from the candidate repository: the process says recruiters
// search the existing pool before sourcing new people, and a rule with no
// evidence behind it is a suggestion. It is checked here so the two halves of
// the platform actually depend on each other.
export function gateRequirements(req: Requisition, searchLogged: boolean): GateRequirement[] {
  return [
    {
      id: "acknowledged",
      label: "Requirement acknowledged by TA",
      met: Boolean(req.acknowledgedAt),
      detail: req.acknowledgedAt
        ? `Acknowledged by ${req.acknowledgedBy || "TA"}`
        : "TA has not picked this up yet",
    },
    {
      id: "calibrated",
      label: "Calibration call held",
      met: Boolean(req.calibratedAt),
      detail: req.calibratedAt
        ? `With ${req.calibrationParticipants.join(", ") || "participants not recorded"}`
        : "Sales, TA and the practice head have not aligned on the requirement",
    },
    {
      id: "resourcing",
      label: "Resourcing check by practice head",
      met: Boolean(req.resourcingCheckedAt),
      detail: req.resourcingCheckedAt
        ? `${req.resourcingOutcome} — checked by ${req.resourcingCheckedBy || "practice head"}`
        : "Internal mobility has not been considered",
    },
    {
      id: "searched",
      label: "Candidate repository searched",
      met: searchLogged,
      detail: searchLogged
        ? "A search was run against this requirement"
        : "Search the repository before sourcing externally",
    },
    {
      id: "decision",
      label: "Go decision recorded",
      met: req.decision === "Go",
      detail:
        req.decision === "Go"
          ? `Go, by ${req.decisionBy || "TA and practice head"}`
          : req.decision === "No-go"
            ? "Marked no-go and returned to sales"
            : "No decision recorded",
    },
  ];
}

export function canOpenSourcing(req: Requisition, searchLogged: boolean): boolean {
  return gateRequirements(req, searchLogged).every((r) => r.met);
}

// The single next thing to do, so a screen can say what is expected rather
// than presenting every possible action at once.
export function nextStep(req: Requisition, searchLogged: boolean): string | null {
  if (TERMINAL.has(req.status)) return null;
  if (req.status === "Sourcing") return "Source and submit the first profile";
  const outstanding = gateRequirements(req, searchLogged).find((r) => !r.met);
  return outstanding ? outstanding.label : "Open sourcing";
}
