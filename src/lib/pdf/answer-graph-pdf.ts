import type { Deal } from "@/types/deal-twin";
import { getActiveQuestions } from "@/lib/questions";
import { discoveryCoverage } from "@/lib/scoring";
import { PdfWriter } from "./writer";

export async function generateAnswerGraphPdf(deal: Deal): Promise<Uint8Array> {
  const { twin } = deal;
  const questions = getActiveQuestions(twin.dealDNA);
  const coverage = discoveryCoverage(twin);
  const byModule = new Map<string, typeof questions>();
  for (const q of questions) {
    byModule.set(q.module, [...(byModule.get(q.module) ?? []), q]);
  }

  const writer = await PdfWriter.create(`${twin.identity.company} — Answer Graph`, "portrait");
  writer.coverTitle(`Answer Graph: ${twin.identity.company}`, `${coverage.answered} of ${coverage.total} active questions answered (${coverage.pct}%)`);

  for (const [module, moduleQuestions] of byModule) {
    writer.heading(module);
    for (const q of moduleQuestions) {
      const answer = twin.answers.find((a) => a.questionId === q.id);
      writer.subheading(q.text + (q.critical ? "  (critical)" : ""));
      if (!answer) {
        writer.paragraph("No answer recorded.");
      } else {
        const value = answer.numberValue != null ? String(answer.numberValue) : answer.values.join(", ") || "—";
        writer.keyValueRow("Answer", value);
        writer.keyValueRow("Authority", answer.authority);
        writer.keyValueRow("Source", answer.source || "—");
        if (answer.impacts.length) writer.keyValueRow("Impacts", answer.impacts.join(", "));
      }
      writer.spacer(4);
    }
  }

  return writer.finish();
}
