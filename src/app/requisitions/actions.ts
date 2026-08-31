"use server";

import { require } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/identity";
import { knownSkills } from "@/lib/oracle-skills";
import {
  createRequisition,
  acknowledgeRequisition,
  recordCalibration,
  recordResourcingCheck,
  recordDecision,
  openSourcing,
  setRequisitionStatus,
  recordFirstProfile,
} from "@/lib/requisition-repo";
import type {
  GoDecision,
  RequisitionPriority,
  RequisitionStatus,
  ResourcingOutcome,
} from "@/lib/requisitions";

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const str = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function createRequisitionAction(formData: FormData) {
  const user = await requireUser();
  require(user, "requisition.raise");
  const roleTitle = str(formData, "roleTitle");
  if (!roleTitle) throw new Error("A requisition needs a role title.");

  const created = await createRequisition({
    accountId: str(formData, "accountId") || null,
    accountName: str(formData, "accountName"),
    roleTitle,
    primarySkill: str(formData, "primarySkill"),
    requiredSkills: knownSkills(formData.getAll("requiredSkills").map(String)),
    positions: numberOrNull(formData.get("positions")) ?? 1,
    location: str(formData, "location"),
    country: str(formData, "country"),
    durationMonths: numberOrNull(formData.get("durationMonths")),
    budgetRate: numberOrNull(formData.get("budgetRate")),
    budgetCurrency: str(formData, "budgetCurrency") || "AED",
    budgetRateUnit: str(formData, "budgetRateUnit") || "Per day",
    minYears: numberOrNull(formData.get("minYears")),
    startBy: str(formData, "startBy") || null,
    priority: (str(formData, "priority") || "Normal") as RequisitionPriority,
    jobDescription: str(formData, "jobDescription"),
    // Sales raises it; whoever is signed in is recorded as having done so.
    raisedBy: user.name,
    salesOwner: str(formData, "salesOwner") || user.name,
    taOwner: str(formData, "taOwner"),
    practiceHead: str(formData, "practiceHead"),
  });

  revalidatePath("/requisitions");
  redirect(`/requisitions/${created.id}`);
}

function done(id: string) {
  revalidatePath("/requisitions");
  revalidatePath(`/requisitions/${id}`);
}

export async function acknowledgeAction(id: string) {
  const user = await requireUser();
  require(user, "requisition.acknowledge");
  await acknowledgeRequisition(id, user.name);
  done(id);
}

export async function calibrationAction(id: string, formData: FormData) {
  const user = await requireUser();
  require(user, "requisition.acknowledge");
  const participants = str(formData, "participants")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  await recordCalibration(id, user.name, participants, str(formData, "notes"));
  done(id);
}

export async function resourcingCheckAction(id: string, formData: FormData) {
  const user = await requireUser();
  require(user, "requisition.decide");
  const outcome = str(formData, "outcome") as ResourcingOutcome;
  await recordResourcingCheck(id, user.name, outcome, str(formData, "notes"));
  done(id);
}

export async function decisionAction(id: string, formData: FormData) {
  const user = await requireUser();
  require(user, "requisition.decide");
  const decision = str(formData, "decision") as GoDecision;
  const reason = str(formData, "reason");
  // A no-go without a reason is how the same unfillable requirement comes back
  // next week, so the reason is required rather than encouraged.
  if (decision === "No-go" && !reason) {
    throw new Error("A no-go needs a reason so sales can renegotiate.");
  }
  await recordDecision(id, user.name, decision, reason);
  done(id);
}

export async function openSourcingAction(id: string) {
  const user = await requireUser();
  require(user, "requisition.decide");
  await openSourcing(id, user.name);
  done(id);
}

export async function firstProfileAction(id: string, formData: FormData) {
  const user = await requireUser();
  require(user, "submission.create");
  await recordFirstProfile(id, user.name, str(formData, "note"));
  done(id);
}

export async function statusAction(id: string, formData: FormData) {
  const user = await requireUser();
  require(user, "requisition.acknowledge");
  await setRequisitionStatus(
    id,
    user.name,
    str(formData, "status") as RequisitionStatus,
    str(formData, "note")
  );
  done(id);
}
