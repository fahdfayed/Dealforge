"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { DealItemStatus } from "@/generated/prisma/enums";

export async function addDealItem(opportunityId: string, formData: FormData) {
  const category = String(formData.get("category") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  const status = String(formData.get("status") ?? "STILL_UNKNOWN") as DealItemStatus;
  const source = String(formData.get("source") ?? "").trim();

  if (!category || !label || !value) {
    throw new Error("Category, label and value are required.");
  }

  await prisma.dealItem.create({
    data: { opportunityId, category, label, value, status, source },
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function updateDealItemStatus(
  opportunityId: string,
  itemId: string,
  status: DealItemStatus
) {
  await prisma.dealItem.update({ where: { id: itemId }, data: { status } });
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function deleteDealItem(opportunityId: string, itemId: string) {
  await prisma.dealItem.delete({ where: { id: itemId } });
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function updateOpportunitySummary(
  opportunityId: string,
  formData: FormData
) {
  const stage = String(formData.get("stage") ?? "");
  const momentum = String(formData.get("momentum") ?? "");
  const probability = Number(formData.get("probability") ?? 0);
  const nextAction = String(formData.get("nextAction") ?? "");
  const oracleRegistrationStatus = String(
    formData.get("oracleRegistrationStatus") ?? ""
  );

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { stage, momentum, probability, nextAction, oracleRegistrationStatus },
  });

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/opportunities");
  revalidatePath("/");
}
