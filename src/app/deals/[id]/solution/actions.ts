"use server";

import { mutateDeal } from "@/lib/deal-mutation";
import type { Authority, DeliveryModel, Priority } from "@/types/deal-twin";

const path = (dealId: string) => `/deals/${dealId}/solution`;

export async function updateObjectiveAction(dealId: string, expectedRevision: number, formData: FormData) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      solution: {
        ...twin.solution,
        objective: String(formData.get("objective") ?? ""),
        deliveryModel: String(formData.get("deliveryModel") ?? twin.solution.deliveryModel) as DeliveryModel,
        designLevers: {
          investmentFlexibility: Number(formData.get("investmentFlexibility") ?? 3) as 1 | 2 | 3 | 4 | 5,
          speedPressure: Number(formData.get("speedPressure") ?? 3) as 1 | 2 | 3 | 4 | 5,
          changeCapacity: Number(formData.get("changeCapacity") ?? 3) as 1 | 2 | 3 | 4 | 5,
          scopeCertainty: Number(formData.get("scopeCertainty") ?? 3) as 1 | 2 | 3 | 4 | 5,
          transformationAmbition: Number(formData.get("transformationAmbition") ?? 3) as 1 | 2 | 3 | 4 | 5,
        },
        clientLanguage: {
          ...twin.solution.clientLanguage,
          solutionTitle: String(formData.get("solutionTitle") ?? ""),
          decisionAsk: String(formData.get("decisionAsk") ?? ""),
        },
      },
    }),
    path(dealId)
  );
}

export async function updateComponentAction(dealId: string, expectedRevision: number, componentId: string, formData: FormData) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      solution: {
        ...twin.solution,
        components: twin.solution.components.map((c) =>
          c.id === componentId
            ? {
                ...c,
                included: formData.get("included") === "on",
                priority: String(formData.get("priority") ?? c.priority) as Priority,
                phase: Number(formData.get("phase") ?? c.phase),
                confidence: Number(formData.get("confidence") ?? c.confidence),
                authority: String(formData.get("authority") ?? c.authority) as Authority,
                effortDays: Number(formData.get("effortDays") ?? c.effortDays),
                risk: String(formData.get("risk") ?? c.risk) as "Low" | "Medium" | "High",
              }
            : c
        ),
      },
    }),
    path(dealId)
  );
}

export async function addCustomComponentAction(dealId: string, expectedRevision: number, formData: FormData) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      solution: {
        ...twin.solution,
        components: [
          ...twin.solution.components,
          {
            id: crypto.randomUUID(),
            category: String(formData.get("category") ?? "Custom"),
            label: String(formData.get("label") ?? ""),
            included: true,
            priority: "Optional" as Priority,
            phase: 1,
            confidence: 50,
            authority: "Proposed" as Authority,
            effortDays: Number(formData.get("effortDays") ?? 5),
            outcome: String(formData.get("outcome") ?? ""),
            risk: "Medium" as const,
            dependencyIds: [],
            custom: true,
          },
        ],
      },
    }),
    path(dealId)
  );
}

export async function removeComponentAction(dealId: string, expectedRevision: number, componentId: string) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      solution: { ...twin.solution, components: twin.solution.components.filter((c) => c.id !== componentId) },
    }),
    path(dealId)
  );
}

export async function addDependencyAction(dealId: string, expectedRevision: number, formData: FormData) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      solution: {
        ...twin.solution,
        dependencies: [
          ...twin.solution.dependencies,
          {
            id: crypto.randomUUID(),
            description: String(formData.get("description") ?? ""),
            classification: String(formData.get("classification") ?? "Critical path") as "Critical path" | "Cross-workstream",
            status: "Open" as const,
          },
        ],
      },
    }),
    path(dealId)
  );
}

export async function updateDependencyStatusAction(
  dealId: string,
  expectedRevision: number,
  dependencyId: string,
  status: "Open" | "Resolved" | "Retained"
) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      solution: {
        ...twin.solution,
        dependencies: twin.solution.dependencies.map((d) => (d.id === dependencyId ? { ...d, status } : d)),
      },
    }),
    path(dealId)
  );
}

export async function addBoundaryAction(
  dealId: string,
  expectedRevision: number,
  kind: "exclusions" | "responsibilities",
  formData: FormData
) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({ ...twin, solution: { ...twin.solution, [kind]: [...twin.solution[kind], text] } }),
    path(dealId)
  );
}

export async function removeBoundaryAction(
  dealId: string,
  expectedRevision: number,
  kind: "exclusions" | "responsibilities",
  index: number
) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      solution: { ...twin.solution, [kind]: twin.solution[kind].filter((_, i) => i !== index) },
    }),
    path(dealId)
  );
}
