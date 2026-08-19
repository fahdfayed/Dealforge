import { db } from "@/db/client";
import { teamMembers, dealAccess, responsibilities, sodRules, sodViolations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { TeamMember, DealAccess, Responsibility, DealResponsibility, SODViolation } from "@/types/team";

// Team Members
export async function addTeamMember(email: string, name: string, role: string = "viewer"): Promise<TeamMember> {
  const id = crypto.randomUUID();
  const now = Date.now();

  await db.insert(teamMembers).values({
    id,
    email,
    name,
    role,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  return { id, email, name, role: role as any, status: "active", createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString() };
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const members = await db.select().from(teamMembers);
  return members.map(m => ({
    id: m.id,
    email: m.email,
    name: m.name,
    role: m.role as any,
    status: m.status as any,
    createdAt: new Date(m.createdAt).toISOString(),
    updatedAt: new Date(m.updatedAt).toISOString(),
  }));
}

export async function getTeamMember(id: string): Promise<TeamMember | null> {
  const member = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
  if (member.length === 0) return null;
  const m = member[0];
  return {
    id: m.id,
    email: m.email,
    name: m.name,
    role: m.role as any,
    status: m.status as any,
    createdAt: new Date(m.createdAt).toISOString(),
    updatedAt: new Date(m.updatedAt).toISOString(),
  };
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
  const updateObj: any = {};
  if (updates.role) updateObj.role = updates.role;
  if (updates.status) updateObj.status = updates.status;
  if (updates.name) updateObj.name = updates.name;
  updateObj.updatedAt = Date.now();

  await db.update(teamMembers).set(updateObj).where(eq(teamMembers.id, id));
}

// Deal Access
export async function shareDealWithUser(dealId: string, userId: string, accessLevel: string, sharedBy: string): Promise<void> {
  const id = crypto.randomUUID();
  const now = Date.now();

  await db.insert(dealAccess).values({
    id,
    dealId,
    userId,
    accessLevel,
    sharedAt: now,
    sharedBy,
  });
}

export async function getDealAccess(dealId: string): Promise<DealAccess[]> {
  const access = await db.select().from(dealAccess).where(eq(dealAccess.dealId, dealId));
  return access.map(a => ({
    id: a.id,
    dealId: a.dealId,
    userId: a.userId,
    accessLevel: a.accessLevel as any,
    sharedAt: new Date(a.sharedAt).toISOString(),
    sharedBy: a.sharedBy,
  }));
}

export async function getUserAccessToDeal(dealId: string, userId: string): Promise<DealAccess | null> {
  const access = await db.select().from(dealAccess).where(
    and(eq(dealAccess.dealId, dealId), eq(dealAccess.userId, userId))
  );
  if (access.length === 0) return null;
  const a = access[0];
  return {
    id: a.id,
    dealId: a.dealId,
    userId: a.userId,
    accessLevel: a.accessLevel as any,
    sharedAt: new Date(a.sharedAt).toISOString(),
    sharedBy: a.sharedBy,
  };
}

export async function revokeAccessToDeal(dealId: string, userId: string): Promise<void> {
  await db.delete(dealAccess).where(
    and(eq(dealAccess.dealId, dealId), eq(dealAccess.userId, userId))
  );
}

// Responsibilities
export async function assignResponsibility(
  dealId: string,
  userId: string,
  role: DealResponsibility,
  assignedBy: string
): Promise<void> {
  const id = crypto.randomUUID();
  const now = Date.now();

  await db.insert(responsibilities).values({
    id,
    dealId,
    userId,
    role,
    assignedAt: now,
    assignedBy,
    status: "active",
  });
}

export async function getDealResponsibilities(dealId: string): Promise<Responsibility[]> {
  const resp = await db.select().from(responsibilities).where(eq(responsibilities.dealId, dealId));
  return resp.map(r => ({
    id: r.id,
    dealId: r.dealId,
    userId: r.userId,
    role: r.role as any,
    assignedAt: new Date(r.assignedAt).toISOString(),
    assignedBy: r.assignedBy,
    status: r.status as any,
  }));
}

export async function getUserResponsibilities(userId: string): Promise<Responsibility[]> {
  const resp = await db.select().from(responsibilities).where(eq(responsibilities.userId, userId));
  return resp.map(r => ({
    id: r.id,
    dealId: r.dealId,
    userId: r.userId,
    role: r.role as any,
    assignedAt: new Date(r.assignedAt).toISOString(),
    assignedBy: r.assignedBy,
    status: r.status as any,
  }));
}

export async function completeResponsibility(id: string): Promise<void> {
  await db.update(responsibilities).set({ status: "completed" }).where(eq(responsibilities.id, id));
}

// SOD Violations
export async function recordSODViolation(
  dealId: string,
  ruleId: string,
  severity: "error" | "warning",
  details: string
): Promise<void> {
  const id = crypto.randomUUID();
  const now = Date.now();

  await db.insert(sodViolations).values({
    id,
    dealId,
    ruleId,
    severity,
    details,
    detectedAt: now,
  });
}

export async function getDealSODViolations(dealId: string): Promise<SODViolation[]> {
  const violations = await db.select().from(sodViolations).where(eq(sodViolations.dealId, dealId));
  return violations.map(v => ({
    id: v.id,
    dealId: v.dealId,
    ruleId: v.ruleId,
    severity: v.severity as any,
    details: v.details,
    detectedAt: new Date(v.detectedAt).toISOString(),
    resolvedAt: v.resolvedAt ? new Date(v.resolvedAt).toISOString() : undefined,
  }));
}

export async function resolveSODViolation(id: string): Promise<void> {
  await db.update(sodViolations).set({ resolvedAt: Date.now() }).where(eq(sodViolations.id, id));
}

// SOD Rules
export async function getSODRules(): Promise<Array<{ id: string; rule: string; description: string; enabled: boolean }>> {
  const rules = await db.select().from(sodRules);
  return rules.map(r => ({
    id: r.id,
    rule: r.rule,
    description: r.description,
    enabled: r.enabled === 1,
  }));
}
