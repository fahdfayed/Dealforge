import type { Authority, DealTwin, StructuredAnswer } from "@/types/deal-twin";
import { getActiveQuestions, getQuestionById } from "@/lib/questions";

// Recalculates the active question set from the current Deal DNA. Answers whose
// question is no longer active stop counting — "answers that no longer fit the
// new context are invalidated rather than quietly retained" (doc 4.1) — but they
// are moved to `archivedAnswers` rather than deleted, and restored if the
// question becomes active again.
//
// This matters because Deal DNA is edited routinely: changing industry to look
// at something and changing it back used to discard the captured authority,
// source and confidence with no warning and no way to recover them. Nothing
// downstream reads `archivedAnswers`, so scoring and coverage are unaffected.
export function recalculateActiveQuestions(twin: DealTwin): DealTwin {
  const active = getActiveQuestions(twin.dealDNA);
  const activeIds = new Set(active.map((q) => q.id));

  // Merge held and archived answers into one set keyed by question, so a
  // question can never end up with two answers (which would double-count in
  // the coverage denominator). A live answer beats an archived copy.
  // Existing deals predate the field, so treat a missing archive as empty.
  const byQuestion = new Map<string, StructuredAnswer>();
  for (const a of twin.archivedAnswers ?? []) byQuestion.set(a.questionId, a);
  for (const a of twin.answers) byQuestion.set(a.questionId, a);

  const answers: StructuredAnswer[] = [];
  const archivedAnswers: StructuredAnswer[] = [];
  for (const answer of byQuestion.values()) {
    if (activeIds.has(answer.questionId)) answers.push(answer);
    else archivedAnswers.push(answer);
  }

  return {
    ...twin,
    activeQuestionIds: active.map((q) => q.id),
    answers,
    archivedAnswers,
  };
}

export function upsertAnswer(
  twin: DealTwin,
  questionId: string,
  patch: {
    values: string[];
    numberValue: number | null;
    authority: Authority;
    source: string;
    confidence: number | null;
  }
): DealTwin {
  const question = getQuestionById(questionId);
  if (!question) throw new Error(`Unknown question id: ${questionId}`);

  const answer: StructuredAnswer = {
    questionId,
    values: patch.values,
    numberValue: patch.numberValue,
    authority: patch.authority,
    source: patch.source,
    confidence: patch.confidence,
    answeredAt: new Date().toISOString(),
    impacts: describeImpacts(questionId),
  };

  const withoutExisting = twin.answers.filter((a) => a.questionId !== questionId);
  return recalculateActiveQuestions({ ...twin, answers: [...withoutExisting, answer] });
}

export function removeAnswer(twin: DealTwin, questionId: string): DealTwin {
  return { ...twin, answers: twin.answers.filter((a) => a.questionId !== questionId) };
}

// Propagation table (doc 4.3), used to show the user what an answer affects.
function describeImpacts(questionId: string): string[] {
  if (questionId.startsWith("std-8") || questionId.startsWith("std-9")) {
    return ["Pursuit gates", "Recommended path", "Pricing controls"];
  }
  if (questionId.startsWith("std-11") || questionId.startsWith("std-14") || questionId.startsWith("std-15") || questionId.startsWith("std-16")) {
    return ["Solution components", "Effort", "Confidence", "P80 exposure"];
  }
  if (questionId.startsWith("std-3") || questionId.startsWith("std-4") || questionId.startsWith("std-10")) {
    return ["Win factors", "Next actions", "Executive narrative"];
  }
  if (questionId.startsWith("std-18")) {
    return ["Delivery risk", "Option fit", "Timeline pressure"];
  }
  if (questionId.startsWith("ctx-mc") || questionId.startsWith("std-12")) {
    return ["Complexity", "Effort multipliers", "Localisation questions"];
  }
  return ["Active packs", "Questions", "Solution capabilities", "Proposal narrative"];
}
