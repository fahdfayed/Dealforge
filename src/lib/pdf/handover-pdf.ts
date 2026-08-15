import type { Deal } from "@/types/deal-twin";
import { evaluateHandoverReadiness } from "@/lib/handover";
import { PdfWriter } from "./writer";

export async function generateHandoverPdf(deal: Deal): Promise<Uint8Array> {
  const { twin } = deal;
  const readiness = evaluateHandoverReadiness(twin);

  const writer = await PdfWriter.create(`${twin.identity.company} — Delivery Handover`, "portrait");
  writer.coverTitle(`Delivery Handover: ${twin.identity.company}`, twin.identity.engagementTitle || "");

  writer.heading("Readiness");
  for (const artifact of readiness) {
    writer.keyValueRow(artifact.label, artifact.ready ? "Ready" : `Not ready — ${artifact.reason}`);
  }

  writer.heading("Answer Graph");
  for (const a of twin.answers) {
    writer.bullet(`${a.questionId}: ${a.values.join(", ") || a.numberValue || "—"} (${a.authority})`);
  }

  writer.heading("Solution blueprint");
  writer.keyValueRow("Selected path", twin.solution.selectedPath ?? "—");
  for (const c of twin.solution.components.filter((c) => c.included)) {
    writer.bullet(`${c.label} — ${c.effortDays} days, phase ${c.phase}`);
  }

  writer.heading("Commercial baseline");
  const scenario = twin.commercialScenarios.find((s) => s.id === twin.savedCommercialScenarioId);
  if (scenario) {
    writer.keyValueRow("Customer price", `${twin.commercialHeadline.currency} ${scenario.customerPrice.toLocaleString()}`);
    writer.keyValueRow("Adjusted effort", `${scenario.adjustedEffortDays} days`);
  } else {
    writer.paragraph("No commercial baseline saved.");
  }

  writer.heading("Promise baseline");
  for (const p of twin.promises) writer.bullet(`${p.statement} — ${p.classification}, ${p.commercialTrace}`);

  writer.heading("Scope Handshake");
  for (const h of twin.scopeHandshake) writer.bullet(`${h.statement} — ${h.response}`);

  writer.heading("Evidence register");
  for (const e of twin.evidence) writer.bullet(`${e.label} — ${e.authority}, confidence ${e.confidence}`);

  writer.heading("Client responsibilities and exclusions");
  twin.solution.responsibilities.forEach((r) => writer.bullet(`Responsibility: ${r}`));
  twin.solution.exclusions.forEach((e) => writer.bullet(`Exclusion: ${e}`));

  return writer.finish();
}
