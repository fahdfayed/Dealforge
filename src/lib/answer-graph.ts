import type { Authority, DealTwin, StructuredAnswer } from "@/types/deal-twin";
import { getActiveQuestions, getQuestionById } from "@/lib/questions";

// Recalculates the active question set from the current Deal DNA and drops
// any stored answers that no longer fit — "answers that no longer fit the
// new context are invalidated rather than quietly retained" (doc 4.1).
export function recalculateActiveQuestions(twin: DealTwin): DealTwin {
  const active = getActiveQuestions(twin.dealDNA);
  const activeIds = new Set(active.map((q) => q.id));

  return {
    ...twin,
    activeQuestionIds: active.map((q) => q.id),
    answers: twin.answers.filter((a) => activeIds.has(a.questionId)),
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
