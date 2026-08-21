import { desc, eq, sql, and, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { requisitions, requisitionEvents, candidateSearches } from "@/db/schema";
import { newId } from "@/lib/id";
import { knownSkills } from "@/lib/oracle-skills";
import {
  canOpenSourcing,
  type GoDecision,
  type Requisition,
  type RequisitionPriority,
  type RequisitionStatus,
  type ResourcingOutcome,
} from "@/lib/requisitions";

function parseArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

const iso = (ms: number | null) => (ms == null ? null : new Date(ms).toISOString());

function rowToRequisition(row: typeof requisitions.$inferSelect): Requisition {
  return {
    id: row.id,
    reference: row.reference,
    accountId: row.accountId,
    accountName: row.accountName,
    dealId: row.dealId,
    roleTitle: row.roleTitle,
    primarySkill: row.primarySkill,
    requiredSkills: parseArray(row.requiredSkills),
    positions: row.positions,
    location: row.location,
    country: row.country,
    durationMonths: row.durationMonths,
    budgetRate: row.budgetRate,
    budgetCurrency: row.budgetCurrency,
    budgetRateUnit: row.budgetRateUnit,
    minYears: row.minYears,
    startBy: iso(row.startBy),
    priority: row.priority as RequisitionPriority,
    jobDescription: row.jobDescription,
    raisedBy: row.raisedBy,
    salesOwner: row.salesOwner,
    taOwner: row.taOwner,
    practiceHead: row.practiceHead,
    status: row.status as RequisitionStatus,
    raisedAt: new Date(row.raisedAt).toISOString(),
    acknowledgedAt: iso(row.acknowledgedAt),
    acknowledgedBy: row.acknowledgedBy,
    calibratedAt: iso(row.calibratedAt),
    calibrationNotes: row.calibrationNotes,
    calibrationParticipants: parseArray(row.calibrationParticipants),
    resourcingCheckedAt: iso(row.resourcingCheckedAt),
    resourcingCheckedBy: row.resourcingCheckedBy,
    resourcingOutcome: row.resourcingOutcome as ResourcingOutcome,
    resourcingNotes: row.resourcingNotes,
    decision: (row.decision as GoDecision | null) ?? null,
    decisionAt: iso(row.decisionAt),
    decisionBy: row.decisionBy,
    decisionReason: row.decisionReason,
    firstProfileAt: iso(row.firstProfileAt),
    closedAt: iso(row.closedAt),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

// MRF-0001, MRF-0002 … derived from the highest existing number rather than a
// row count, so deleting one does not cause the next to reuse its reference.
async function nextReference(): Promise<string> {
  const rows = await db.select({ reference: requisitions.reference }).from(requisitions);
  const highest = rows.reduce((max, r) => {
    const n = Number(r.reference.replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `MRF-${String(highest + 1).padStart(4, "0")}`;
}

async function recordEvent(input: {
  requisitionId: string;
  kind: string;
  fromStatus?: string;
  toStatus?: string;
  actor: string;
  note?: string;
}): Promise<void> {
  await db.insert(requisitionEvents).values({
    id: newId(),
    requisitionId: input.requisitionId,
    kind: input.kind,
    fromStatus: input.fromStatus ?? "",
    toStatus: input.toStatus ?? "",
    actor: input.actor,
    note: input.note ?? "",
    createdAt: Date.now(),
  });
}

export async function listRequisitions(): Promise<Requisition[]> {
  const rows = await db.select().from(requisitions).orderBy(desc(requisitions.raisedAt));
  return rows.map(rowToRequisition);
}

export async function getRequisition(id: string): Promise<Requisition | null> {
  const rows = await db.select().from(requisitions).where(eq(requisitions.id, id)).limit(1);
  return rows[0] ? rowToRequisition(rows[0]) : null;
}

export type RequisitionInput = {
  accountId: string | null;
  accountName: string;
  dealId?: string | null;
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
};

export async function createRequisition(input: RequisitionInput): Promise<Requisition> {
  const now = Date.now();
  const id = newId();
  const reference = await nextReference();

  await db.insert(requisitions).values({
    id,
    reference,
    accountId: input.accountId,
    accountName: input.accountName,
    dealId: input.dealId ?? null,
    roleTitle: input.roleTitle,
    primarySkill: input.primarySkill,
    requiredSkills: JSON.stringify(knownSkills(input.requiredSkills)),
    positions: input.positions,
    location: input.location,
    country: input.country,
    durationMonths: input.durationMonths,
    budgetRate: input.budgetRate,
    budgetCurrency: input.budgetCurrency,
    budgetRateUnit: input.budgetRateUnit,
    minYears: input.minYears,
    startBy: input.startBy ? Date.parse(input.startBy) || null : null,
    priority: input.priority,
    jobDescription: input.jobDescription,
    raisedBy: input.raisedBy,
    salesOwner: input.salesOwner,
    taOwner: input.taOwner,
    practiceHead: input.practiceHead,
    status: "Raised",
    // The SLA clock starts here, not at first edit.
    raisedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await recordEvent({
    requisitionId: id,
    kind: "raised",
    toStatus: "Raised",
    actor: input.raisedBy,
    note: `${input.roleTitle} for ${input.accountName || "an unnamed client"}`,
  });

  const created = await getRequisition(id);
  if (!created) throw new Error("Requisition was not created");
  return created;
}

async function patch(
  id: string,
  values: Record<string, unknown>,
  event: { kind: string; toStatus?: string; actor: string; note?: string }
): Promise<void> {
  const current = await getRequisition(id);
  if (!current) throw new Error(`Requisition ${id} not found`);

  await db
    .update(requisitions)
    .set({ ...values, updatedAt: Date.now() })
    .where(eq(requisitions.id, id));

  await recordEvent({
    requisitionId: id,
    kind: event.kind,
    fromStatus: current.status,
    toStatus: event.toStatus ?? current.status,
    actor: event.actor,
    note: event.note,
  });
}

export async function acknowledgeRequisition(id: string, actor: string): Promise<void> {
  const current = await getRequisition(id);
  if (!current) throw new Error(`Requisition ${id} not found`);
  // Acknowledging twice would move the timestamp and hide an original breach.
  if (current.acknowledgedAt) return;

  await patch(
    id,
    { acknowledgedAt: Date.now(), acknowledgedBy: actor, status: "Acknowledged" },
    { kind: "acknowledged", toStatus: "Acknowledged", actor }
  );
}

export async function recordCalibration(
  id: string,
  actor: string,
  participants: string[],
  notes: string
): Promise<void> {
  await patch(
    id,
    {
      calibratedAt: Date.now(),
      calibrationParticipants: JSON.stringify(participants),
      calibrationNotes: notes,
      status: "Calibrated",
    },
    {
      kind: "calibrated",
      toStatus: "Calibrated",
      actor,
      note: participants.length ? `With ${participants.join(", ")}` : "",
    }
  );
}

export async function recordResourcingCheck(
  id: string,
  actor: string,
  outcome: ResourcingOutcome,
  notes: string
): Promise<void> {
  await patch(
    id,
    {
      resourcingCheckedAt: Date.now(),
      resourcingCheckedBy: actor,
      resourcingOutcome: outcome,
      resourcingNotes: notes,
      status: "Resourcing checked",
    },
    { kind: "resourcing-check", toStatus: "Resourcing checked", actor, note: outcome }
  );
}

export async function recordDecision(
  id: string,
  actor: string,
  decision: GoDecision,
  reason: string
): Promise<void> {
  // A no-go goes back to sales for renegotiation rather than sitting in the TA
  // queue, and the reason is required — "no-go, no reason" is the thing that
  // makes the same unfillable requirement come back next week.
  const status: RequisitionStatus = decision === "Go" ? "Resourcing checked" : "Returned to sales";
  await patch(
    id,
    {
      decision,
      decisionAt: Date.now(),
      decisionBy: actor,
      decisionReason: reason,
      status,
      closedAt: decision === "No-go" ? Date.now() : null,
    },
    { kind: "decision", toStatus: status, actor, note: `${decision}: ${reason}` }
  );
}

export async function openSourcing(id: string, actor: string): Promise<void> {
  const current = await getRequisition(id);
  if (!current) throw new Error(`Requisition ${id} not found`);

  const searched = await hasLoggedSearch(id);
  // Checked here, not only in the UI. A gate that only exists on a screen is
  // bypassed by the first person who bookmarks the next screen.
  if (!canOpenSourcing(current, searched)) {
    throw new Error("Sourcing cannot open until every gate requirement is met.");
  }

  await patch(id, { status: "Sourcing" }, { kind: "sourcing-opened", toStatus: "Sourcing", actor });
}

export async function setRequisitionStatus(
  id: string,
  actor: string,
  status: RequisitionStatus,
  note: string
): Promise<void> {
  const closing = status === "Filled" || status === "Cancelled" || status === "Returned to sales";
  await patch(
    id,
    { status, closedAt: closing ? Date.now() : null },
    { kind: "status-change", toStatus: status, actor, note }
  );
}

export async function recordFirstProfile(id: string, actor: string, note: string): Promise<void> {
  const current = await getRequisition(id);
  if (!current) throw new Error(`Requisition ${id} not found`);
  if (current.firstProfileAt) return;

  await patch(
    id,
    { firstProfileAt: Date.now() },
    { kind: "first-profile", actor, note }
  );
}

// Has the candidate repository been searched for this requirement?
//
// This is what ties the two halves together: the gate reads the search log
// written by the repository screens.
export async function hasLoggedSearch(requisitionId: string): Promise<boolean> {
  const rows = await db
    .select({ id: candidateSearches.id })
    .from(candidateSearches)
    .where(and(eq(candidateSearches.requisitionId, requisitionId), isNotNull(candidateSearches.id)))
    .limit(1);
  return rows.length > 0;
}

export type RequisitionEvent = {
  id: string;
  kind: string;
  fromStatus: string;
  toStatus: string;
  actor: string;
  note: string;
  createdAt: string;
};

export async function requisitionHistory(id: string): Promise<RequisitionEvent[]> {
  const rows = await db
    .select()
    .from(requisitionEvents)
    .where(eq(requisitionEvents.requisitionId, id))
    .orderBy(desc(requisitionEvents.createdAt));
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    fromStatus: r.fromStatus,
    toStatus: r.toStatus,
    actor: r.actor,
    note: r.note,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

// Which requisitions have had a repository search, in one query, so a list of
// twenty does not become twenty-one round trips.
export async function searchedRequisitionIds(): Promise<Set<string>> {
  const rows = await db
    .select({ requisitionId: candidateSearches.requisitionId })
    .from(candidateSearches)
    .where(isNotNull(candidateSearches.requisitionId))
    .groupBy(candidateSearches.requisitionId);
  return new Set(rows.map((r) => r.requisitionId).filter((v): v is string => Boolean(v)));
}

export async function requisitionMetrics(sinceDays = 7): Promise<{
  raised: number;
  acknowledged: number;
  decided: number;
  goRate: number | null;
  openSourcing: number;
  returnedToSales: number;
}> {
  const since = Date.now() - sinceDays * 24 * 60 * 60 * 1000;
  const rows = await db.select().from(requisitions);
  const recent = rows.filter((r) => r.raisedAt >= since);
  const decided = recent.filter((r) => r.decision);
  return {
    raised: recent.length,
    acknowledged: recent.filter((r) => r.acknowledgedAt).length,
    decided: decided.length,
    goRate: decided.length ? decided.filter((r) => r.decision === "Go").length / decided.length : null,
    openSourcing: rows.filter((r) => r.status === "Sourcing").length,
    returnedToSales: recent.filter((r) => r.status === "Returned to sales").length,
  };
}
