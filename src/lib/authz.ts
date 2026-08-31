// Authorization: what a signed-in person is allowed to do.
//
// Until now the app had authentication and no authorization. A role matrix
// existed in types/team.ts and was never called; deal_access existed and was
// never read. Any signed-in account could edit or delete any deal, browse every
// candidate, and manage the team. This module is the single place that decides,
// so a rule cannot be enforced on one screen and forgotten on another.
//
// Three checks, in order of cost:
//   1. Domain — does this role work with this kind of data at all?
//   2. Capability — does this role perform this kind of action?
//   3. Record — for deal-scoped work, does this person have access to it?
//
// Everything denies by default. A capability that is not listed is not granted,
// and a thrown error is a denial rather than a bug, so a new action added later
// is refused until someone grants it deliberately.
import type { UserRole } from "@/types/team";

// The kinds of data the app holds. Chosen because they map to who does the
// work, not to database tables: a recruiter and a pursuit lead touch different
// worlds and each other's data is not theirs to browse by default.
export type Domain = "pursuits" | "recruitment" | "admin";

export type Capability =
  // Pursuits
  | "deal.view"
  | "deal.edit"
  | "deal.delete"
  | "deal.share"
  | "deal.approveCommercial"
  | "deal.approveProposal"
  // Recruitment
  | "candidate.view"
  | "candidate.edit"
  | "requisition.view"
  | "requisition.raise"
  | "requisition.acknowledge"
  | "requisition.decide"
  | "submission.create"
  | "submission.recordFeedback"
  // Administration
  | "team.manage"
  | "industry.manage";

const CAPABILITY_DOMAIN: Record<Capability, Domain> = {
  "deal.view": "pursuits",
  "deal.edit": "pursuits",
  "deal.delete": "pursuits",
  "deal.share": "pursuits",
  "deal.approveCommercial": "pursuits",
  "deal.approveProposal": "pursuits",
  "candidate.view": "recruitment",
  "candidate.edit": "recruitment",
  "requisition.view": "recruitment",
  "requisition.raise": "recruitment",
  "requisition.acknowledge": "recruitment",
  "requisition.decide": "recruitment",
  "submission.create": "recruitment",
  "submission.recordFeedback": "recruitment",
  "team.manage": "admin",
  "industry.manage": "admin",
};

// Which domains a role works in.
//
// Recruitment is readable by every role by decision: the team is small enough
// that everyone is involved in staffing, and locking the repository down would
// work against the rule that recruiters search it before sourcing. Writes are
// still gated by capability below — reading a candidate and editing one are
// different things.
const ROLE_DOMAINS: Record<UserRole, Domain[]> = {
  admin: ["pursuits", "recruitment", "admin"],
  editor: ["pursuits", "recruitment"],
  reviewer: ["pursuits", "recruitment"],
  finance: ["pursuits", "recruitment"],
  delivery: ["pursuits", "recruitment"],
  viewer: ["pursuits", "recruitment"],
};

// What each role may do. Absence is denial.
const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  admin: Object.keys(CAPABILITY_DOMAIN) as Capability[],
  editor: [
    "deal.view",
    "deal.edit",
    "deal.share",
    "candidate.view",
    "candidate.edit",
    "requisition.view",
    "requisition.raise",
    "requisition.acknowledge",
    "submission.create",
    "submission.recordFeedback",
  ],
  // Reviews and challenges, but does not author. Notably cannot approve the
  // commercial position — that is finance.
  reviewer: [
    "deal.view",
    "candidate.view",
    "requisition.view",
    "submission.recordFeedback",
    "deal.approveProposal",
  ],
  finance: ["deal.view", "deal.approveCommercial", "candidate.view", "requisition.view"],
  delivery: [
    "deal.view",
    "deal.edit",
    "candidate.view",
    "requisition.view",
    "requisition.decide",
    "submission.recordFeedback",
  ],
  viewer: ["deal.view", "candidate.view", "requisition.view"],
};

// Roles that see every deal without being shared on it. Everyone else sees a
// deal only through ownership or deal_access.
const SEES_ALL_DEALS: ReadonlySet<UserRole> = new Set<UserRole>(["admin", "finance"]);

export type Actor = { id: string; name: string; role: UserRole };

export class AuthorizationError extends Error {
  constructor(
    public capability: Capability | null,
    message: string
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

// Identify a refusal by name, not by instanceof.
//
// A module can be loaded twice — through a path alias in one place and a
// relative specifier in another, or across a bundler boundary — which produces
// two distinct classes with the same name. `instanceof` then returns false for
// a genuine AuthorizationError, and a caller meaning to handle a refusal
// gracefully would instead treat it as an unexpected crash. Observed while
// testing this module, not hypothetical.
export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof Error && error.name === "AuthorizationError";
}

export function roleHasDomain(role: UserRole, domain: Domain): boolean {
  return ROLE_DOMAINS[role]?.includes(domain) ?? false;
}

export function can(role: UserRole, capability: Capability): boolean {
  const domain = CAPABILITY_DOMAIN[capability];
  if (!domain || !roleHasDomain(role, domain)) return false;
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

// Throws rather than returning false, so a caller cannot forget to check the
// result. A missed `if (!can(...))` reads as working code; a missed `require`
// does not compile into anything.
export function require(actor: Actor, capability: Capability): void {
  if (!can(actor.role, capability)) {
    throw new AuthorizationError(
      capability,
      `Your role (${actor.role}) cannot ${capability.replace(".", " ")}.`
    );
  }
}

// --- record-level access, for deals ------------------------------------------

export type DealAccessLevel = "owner" | "edit" | "review" | "view";

const LEVEL_RANK: Record<DealAccessLevel, number> = { owner: 3, edit: 2, review: 1, view: 0 };

export type DealGrant = {
  // Null when the person has no explicit grant on the deal.
  level: DealAccessLevel | null;
  // True when their role sees every deal regardless of grants.
  viaRole: boolean;
};

export function canViewDeal(actor: Actor, grant: DealGrant): boolean {
  if (!can(actor.role, "deal.view")) return false;
  return grant.viaRole || grant.level != null;
}

export function canEditDeal(actor: Actor, grant: DealGrant): boolean {
  if (!can(actor.role, "deal.edit")) return false;
  // A role-wide view does not imply edit: finance sees every deal but does not
  // author them, and an admin's blanket access is deliberate rather than
  // incidental.
  if (actor.role === "admin") return true;
  return grant.level != null && LEVEL_RANK[grant.level] >= LEVEL_RANK.edit;
}

export function requireDealView(actor: Actor, grant: DealGrant): void {
  if (!canViewDeal(actor, grant)) {
    throw new AuthorizationError("deal.view", "You do not have access to this deal.");
  }
}

export function requireDealEdit(actor: Actor, grant: DealGrant): void {
  if (!canEditDeal(actor, grant)) {
    throw new AuthorizationError("deal.edit", "You do not have edit access to this deal.");
  }
}

export function seesAllDeals(role: UserRole): boolean {
  return SEES_ALL_DEALS.has(role);
}

// Exposed so the UI can hide what it would refuse anyway. Hiding is a courtesy;
// the check above is the control.
export function capabilitiesFor(role: UserRole): Capability[] {
  return (ROLE_CAPABILITIES[role] ?? []).filter((c) => roleHasDomain(role, CAPABILITY_DOMAIN[c]));
}
