"use server";

import { mutateDeal } from "@/lib/deal-mutation";
import type { ActionStatus } from "@/types/deal-twin";

const path = (dealId: string) => `/deals/${dealId}/oracle`;

export async function addAllianceActionAction(dealId: string, expectedRevision: number, formData: FormData) {
  const action = String(formData.get("action") ?? "").trim();
  if (!action) return;
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      allianceActions: [
        ...twin.allianceActions,
        {
          id: crypto.randomUUID(),
          action,
          owner: String(formData.get("owner") ?? ""),
          dueWindow: String(formData.get("dueWindow") ?? ""),
          status: "Open" as ActionStatus,
          completedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }),
    path(dealId)
  );
}

export async function toggleAllianceActionAction(dealId: string, expectedRevision: number, actionId: string) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      allianceActions: twin.allianceActions.map((a) => {
        if (a.id === actionId) {
          const newStatus: ActionStatus = a.status === "Completed" ? "Open" : "Completed";
          return { ...a, status: newStatus, completedAt: newStatus === "Completed" ? new Date().toISOString() : null, updatedAt: new Date().toISOString() };
        }
        return a;
      }),
    }),
    path(dealId)
  );
}
