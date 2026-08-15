"use server";

import { mutateDeal } from "@/lib/deal-mutation";
import { upsertAnswer, removeAnswer } from "@/lib/answer-graph";
import type { Authority } from "@/types/deal-twin";

export async function answerQuestionAction(
  dealId: string,
  expectedRevision: number,
  questionId: string,
  formData: FormData
) {
  const authority = String(formData.get("authority") ?? "Unknown") as Authority;
  const source = String(formData.get("source") ?? "");
  const confidenceRaw = formData.get("confidence");
  const confidence = confidenceRaw != null && confidenceRaw !== "" ? Number(confidenceRaw) : null;
  const numberRaw = formData.get("numberValue");
  const numberValue = numberRaw != null && numberRaw !== "" ? Number(numberRaw) : null;
  const values = formData.getAll("values").map(String);

  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => upsertAnswer(twin, questionId, { values, numberValue, authority, source, confidence }),
    `/deals/${dealId}/understand`
  );
}

export async function clearAnswerAction(dealId: string, expectedRevision: number, questionId: string) {
  await mutateDeal(dealId, expectedRevision, (twin) => removeAnswer(twin, questionId), `/deals/${dealId}/understand`);
}
