"use server";

import { mutateDeal } from "@/lib/deal-mutation";
import type { CommercialTrace, PromiseClassification } from "@/types/deal-twin";

const path = (dealId: string) => `/deals/${dealId}/commitments`;

export async function addPromiseAction(dealId: string, expectedRevision: number, formData: FormData) {
  const statement = String(formData.get("statement") ?? "").trim();
  if (!statement) return;
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      promises: [
        ...twin.promises,
        {
          id: crypto.randomUUID(),
          statement,
          classification: String(formData.get("classification") ?? "Informal discussion") as PromiseClassification,
          source: String(formData.get("source") ?? ""),
          owner: String(formData.get("owner") ?? ""),
          commercialTrace: String(formData.get("commercialTrace") ?? "Pending") as CommercialTrace,
          createdAt: new Date().toISOString(),
        },
      ],
    }),
    path(dealId)
  );
}

export async function addCandidatePromiseAction(
  dealId: string,
  expectedRevision: number,
  statement: string,
  classification: PromiseClassification,
  source: string
) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      promises: [
        ...twin.promises,
        {
          id: crypto.randomUUID(),
          statement,
          classification,
          source,
          owner: "",
          commercialTrace: "Pending" as CommercialTrace,
          createdAt: new Date().toISOString(),
        },
      ],
    }),
    path(dealId)
  );
}

export async function updatePromiseTraceAction(dealId: string, expectedRevision: number, promiseId: string, trace: CommercialTrace) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      promises: twin.promises.map((p) => (p.id === promiseId ? { ...p, commercialTrace: trace } : p)),
    }),
    path(dealId)
  );
}

export async function removePromiseAction(dealId: string, expectedRevision: number, promiseId: string) {
  await mutateDeal(dealId, expectedRevision, (twin) => ({ ...twin, promises: twin.promises.filter((p) => p.id !== promiseId) }), path(dealId));
}
