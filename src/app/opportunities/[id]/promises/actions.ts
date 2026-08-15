"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PromiseClassification } from "@/generated/prisma/enums";

export async function addPromise(opportunityId: string, formData: FormData) {
  const statement = String(formData.get("statement") ?? "").trim();
  const classification = String(
    formData.get("classification") ?? "INFORMAL_DISCUSSION"
  ) as PromiseClassification;
  const saidBy = String(formData.get("saidBy") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const owner = String(formData.get("owner") ?? "").trim();
  const inSOW = formData.get("inSOW") === "on";
  const commercialEffortIncluded = formData.get("commercialEffortIncluded") === "on";

  if (!statement) throw new Error("Statement is required.");

  await prisma.promise.create({
    data: {
      opportunityId,
      statement,
      classification,
      saidBy,
      source,
      owner,
      inSOW,
      commercialEffortIncluded,
    },
  });

  revalidatePath(`/opportunities/${opportunityId}/promises`);
  revalidatePath(`/opportunities/${opportunityId}/proposals`);
}

export async function deletePromise(opportunityId: string, promiseId: string) {
  await prisma.promise.delete({ where: { id: promiseId } });
  revalidatePath(`/opportunities/${opportunityId}/promises`);
}
