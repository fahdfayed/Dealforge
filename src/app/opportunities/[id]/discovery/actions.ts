"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function answerDiscoveryQuestion(
  opportunityId: string,
  questionId: string,
  answer: string
) {
  await prisma.discoveryQuestion.update({
    where: { id: questionId },
    data: { answer, answered: answer.trim().length > 0 },
  });
  revalidatePath(`/opportunities/${opportunityId}/discovery`);
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/opportunities");
  revalidatePath("/");
}

export async function addDiscoveryQuestion(
  opportunityId: string,
  formData: FormData
) {
  const questionModule = String(formData.get("module") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const criticalForPricing = formData.get("criticalForPricing") === "on";

  if (!questionModule || !text) throw new Error("Module and question text are required.");

  await prisma.discoveryQuestion.create({
    data: { opportunityId, module: questionModule, text, criticalForPricing },
  });

  revalidatePath(`/opportunities/${opportunityId}/discovery`);
}

export async function importFromNotes(opportunityId: string, formData: FormData) {
  const notes = String(formData.get("notes") ?? "");
  if (!notes.trim()) return;

  // Lightweight heuristic pass over meeting notes/transcript: any line that
  // ends with a question mark and matches an unanswered question's keywords
  // is treated as addressing that question. This keeps the "paste a
  // transcript" workflow honest without pretending to run a real NLP model.
  const openQuestions = await prisma.discoveryQuestion.findMany({
    where: { opportunityId, answered: false },
  });

  const lines = notes
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const question of openQuestions) {
    const keywords = question.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4);

    const matchingLine = lines.find((line) => {
      const lower = line.toLowerCase();
      const hits = keywords.filter((k) => lower.includes(k)).length;
      return hits >= Math.max(1, Math.floor(keywords.length * 0.3));
    });

    if (matchingLine) {
      await prisma.discoveryQuestion.update({
        where: { id: question.id },
        data: { answered: true, answer: matchingLine },
      });
    }
  }

  revalidatePath(`/opportunities/${opportunityId}/discovery`);
  revalidatePath(`/opportunities/${opportunityId}`);
}
