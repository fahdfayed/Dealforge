"use server";

import { mutateDeal } from "@/lib/deal-mutation";
import type { ActionStatus } from "@/types/deal-twin";

const path = (dealId: string) => `/deals/${dealId}/actions`;

export async function createActionAction(dealId: string, expectedRevision: number, formData: FormData) {
  const action = String(formData.get("action") ?? "");
  const owner = String(formData.get("owner") ?? "");
  const dueWindow = String(formData.get("dueWindow") ?? "");

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
          owner,
          dueWindow,
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

export async function updateActionStatusAction(dealId: string, expectedRevision: number, actionId: string, status: ActionStatus) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      allianceActions: twin.allianceActions.map((a) =>
        a.id === actionId
          ? {
              ...a,
              status,
              completedAt: status === "Completed" || status === "Cancelled" ? new Date().toISOString() : a.completedAt,
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    }),
    path(dealId)
  );
}

export async function deleteActionAction(dealId: string, expectedRevision: number, actionId: string) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      allianceActions: twin.allianceActions.filter((a) => a.id !== actionId),
    }),
    path(dealId)
  );
}
