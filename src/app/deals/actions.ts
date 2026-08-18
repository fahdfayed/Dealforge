"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createDeal, deleteDeal, duplicateDeal, saveDeal } from "@/lib/deal-repo";
import { getCurrentUser } from "@/lib/identity";
import { createDealFromTemplate, DEAL_TEMPLATES } from "@/lib/deal-templates";

export async function createDealAction(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  if (!company) throw new Error("Company is required.");
  const user = await getCurrentUser();
  const deal = await createDeal({ company, owner: user.name });
  revalidatePath("/deals");
  redirect(`/deals/${deal.id}`);
}

export async function createDealFromTemplateAction(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  const templateId = String(formData.get("template") ?? "").trim();
  if (!company) throw new Error("Company is required.");
  if (!templateId) throw new Error("Template is required.");

  const template = DEAL_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error("Template not found.");

  const user = await getCurrentUser();
  const twin = createDealFromTemplate(template, company, user.name);

  // Create the base deal first, then save the template-filled twin
  const base = await createDeal({ company, owner: user.name });
  const filled = await saveDeal(base.id, twin, base.revision);

  revalidatePath("/deals");
  redirect(`/deals/${filled.id}`);
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
