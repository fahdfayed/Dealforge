"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { computeEstimate, type EstimateInputs, type MultiplierSelection } from "@/lib/estimate";

export async function saveEstimate(
  opportunityId: string,
  inputs: EstimateInputs,
  multipliers: MultiplierSelection,
  dayRate: number,
  internalCostPerDay: number,
  contingencyPct: number
) {
  const result = computeEstimate(inputs, multipliers, dayRate, internalCostPerDay, contingencyPct);

  await prisma.estimate.upsert({
    where: { opportunityId },
    create: {
      opportunityId,
      inputs: JSON.stringify(inputs),
      multipliers: JSON.stringify(multipliers),
      dayRate,
      internalCostPerDay,
      contingencyPct,
      ...result,
    },
    update: {
      inputs: JSON.stringify(inputs),
      multipliers: JSON.stringify(multipliers),
      dayRate,
      internalCostPerDay,
      contingencyPct,
      ...result,
    },
  });

  revalidatePath(`/opportunities/${opportunityId}/estimate`);
  revalidatePath(`/opportunities/${opportunityId}/promises`);
  revalidatePath(`/opportunities/${opportunityId}/proposals`);
  revalidatePath("/");

  return result;
}
