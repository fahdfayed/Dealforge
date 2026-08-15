"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createDeal, deleteDeal, duplicateDeal } from "@/lib/deal-repo";
import { getCurrentUser } from "@/lib/identity";

export async function createDealAction(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  if (!company) throw new Error("Company is required.");
  const user = await getCurrentUser();
  const deal = await createDeal({ company, owner: user.name });
  revalidatePath("/deals");
  redirect(`/deals/${deal.id}`);
}

export async function duplicateDealAction(dealId: string) {
  const deal = await duplicateDeal(dealId);
  revalidatePath("/deals");
  redirect(`/deals/${deal.id}`);
}

export async function deleteDealAction(dealId: string) {
  await deleteDeal(dealId);
  revalidatePath("/deals");
  redirect("/deals");
}
