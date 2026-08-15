"use server";

import { prisma } from "@/lib/prisma";
import { COMMERCIAL_MODULE, DISCOVERY_TEMPLATES } from "@/lib/domain";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createOpportunity(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const countries = String(formData.get("countries") ?? "").trim();
  const dealType = String(formData.get("dealType") ?? "").trim();
  const modules = formData.getAll("modules").map(String);
  const budgetMinRaw = String(formData.get("budgetMin") ?? "").trim();
  const budgetMaxRaw = String(formData.get("budgetMax") ?? "").trim();
  const timelineRaw = String(formData.get("timelineMonths") ?? "").trim();

  if (!name || !client || !dealType) {
    throw new Error("Name, client and deal type are required.");
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      name,
      client,
      industry,
      countries,
      dealType,
      modules: modules.join(","),
      budgetMin: budgetMinRaw ? Number(budgetMinRaw) : null,
      budgetMax: budgetMaxRaw ? Number(budgetMaxRaw) : null,
      timelineMonths: timelineRaw ? Number(timelineRaw) : null,
    },
  });

  const applicableModules = [...modules, COMMERCIAL_MODULE];
  for (const mod of applicableModules) {
    const questions = DISCOVERY_TEMPLATES[mod];
    if (!questions) continue;
    await prisma.discoveryQuestion.createMany({
      data: questions.map((q) => ({
        opportunityId: opportunity.id,
        module: mod,
        text: q.text,
        criticalForPricing: q.criticalForPricing ?? false,
      })),
    });
  }

  revalidatePath("/opportunities");
  redirect(`/opportunities/${opportunity.id}`);
}

export async function deleteOpportunity(id: string) {
  await prisma.opportunity.delete({ where: { id } });
  revalidatePath("/opportunities");
  redirect("/opportunities");
}
