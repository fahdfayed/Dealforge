"use server";

import { mutateDeal } from "@/lib/deal-mutation";
import { recalculateActiveQuestions } from "@/lib/answer-graph";
import type {
  ClientType,
  CommercialModelType,
  EngagementType,
  Factor,
  Momentum,
  Stage,
} from "@/types/deal-twin";

function factorOf(formData: FormData, name: string): Factor | null {
  const v = formData.get(name);
  return v ? (Number(v) as Factor) : null;
}

function numOf(formData: FormData, name: string): number | null {
  const v = formData.get(name);
  return v != null && v !== "" ? Number(v) : null;
}

export async function updateDealCore(dealId: string, expectedRevision: number, formData: FormData) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => {
      const countries = String(formData.get("countries") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const next = {
        ...twin,
        identity: {
          ...twin.identity,
          engagementTitle: String(formData.get("engagementTitle") ?? ""),
          stage: (String(formData.get("stage") ?? twin.identity.stage) as Stage),
          owner: String(formData.get("owner") ?? twin.identity.owner),
          dueDate: String(formData.get("dueDate") ?? "") || null,
        },
        commercialHeadline: {
          ...twin.commercialHeadline,
          opportunityValue: numOf(formData, "opportunityValue"),
          currency: String(formData.get("currency") ?? twin.commercialHeadline.currency) || "USD",
          crmProbability: numOf(formData, "crmProbability"),
          momentum: (String(formData.get("momentum") ?? twin.commercialHeadline.momentum) as Momentum),
          currentMargin: numOf(formData, "currentMargin"),
          nextMove: String(formData.get("nextMove") ?? ""),
        },
        dealDNA: {
          ...twin.dealDNA,
          engagementType: (String(formData.get("engagementType") ?? "") || null) as EngagementType | null,
          industry: String(formData.get("industry") ?? ""),
          countries,
          clientType: (String(formData.get("clientType") ?? "") || null) as ClientType | null,
          commercialModel: (String(formData.get("commercialModel") ?? "") || null) as CommercialModelType | null,
          entityCount: numOf(formData, "entityCount"),
          userCount: numOf(formData, "userCount"),
          relationshipFactor: factorOf(formData, "relationshipFactor"),
          budgetFactor: factorOf(formData, "budgetFactor"),
          scopeFactor: factorOf(formData, "scopeFactor"),
          evidenceQualityFactor: factorOf(formData, "evidenceQualityFactor"),
          stakeholderFactor: factorOf(formData, "stakeholderFactor"),
          oracleFactor: factorOf(formData, "oracleFactor"),
          deliveryFactor: factorOf(formData, "deliveryFactor"),
          strategicFitFactor: factorOf(formData, "strategicFitFactor"),
          paymentFactor: factorOf(formData, "paymentFactor"),
          urgencyFactor: factorOf(formData, "urgencyFactor"),
        },
      };

      return recalculateActiveQuestions(next);
    },
    `/deals/${dealId}`
  );
}
