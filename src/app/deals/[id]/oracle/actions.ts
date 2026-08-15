"use server";

import { mutateDeal } from "@/lib/deal-mutation";

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
          completed: false,
          completedAt: null,
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
      allianceActions: twin.allianceActions.map((a) =>
        a.id === actionId ? { ...a, completed: !a.completed, completedAt: !a.completed ? new Date().toISOString() : null } : a
      ),
    }),
    path(dealId)
  );
}
