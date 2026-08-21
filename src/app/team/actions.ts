"use server";

import type { UserRole } from "@/types/team";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/identity";
import { addTeamMember, updateTeamMember, getTeamMember } from "@/lib/team-repo";

export async function addTeamMemberAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const roleInput = String(formData.get("role") ?? "viewer").trim();

  if (!email || !name) throw new Error("Email and name are required.");

  const user = await requireUser();
  await addTeamMember(email, name, roleInput);

  revalidatePath("/team");
}

export async function updateTeamMemberAction(memberId: string, role: string) {
  const user = await requireUser();
  await updateTeamMember(memberId, { role: role as UserRole });
  revalidatePath("/team");
}

export async function removeTeamMemberAction(memberId: string) {
  const user = await requireUser();
  const member = await getTeamMember(memberId);
  if (!member) throw new Error("Team member not found.");

  // Mark as inactive instead of deleting
  await updateTeamMember(memberId, { status: "inactive" });
  revalidatePath("/team");
}
