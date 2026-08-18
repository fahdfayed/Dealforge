import type { Deal } from "@/types/deal-twin";
import { computeDimensions } from "@/lib/scoring";
import { allianceHealth, generateOracleRationale } from "@/lib/oracle";
import { PdfWriter } from "./writer";

export async function generateOracleBriefPdf(deal: Deal): Promise<Uint8Array> {
  const { twin } = deal;
  const dims = computeDimensions(twin);
  const health = allianceHealth(dims.oracle, twin.allianceActions);
  const rationale = generateOracleRationale(twin);

  const writer = await PdfWriter.create(`${twin.identity.company} — Oracle Alliance Brief`, "portrait");
  writer.coverTitle(`Oracle Alliance Brief: ${twin.identity.company}`, twin.identity.engagementTitle || "");
  writer.badge(health.label);

  writer.heading("Alliance health");
  writer.keyValueRow("Score", `${health.score}/100`);
  writer.keyValueRow("Oracle alignment dimension", `${dims.oracle}/100`);

  writer.heading("Internal rationale for Oracle support");
  rationale.split("\n").forEach((line) => writer.paragraph(line));

  writer.heading("Joint actions");
  if (twin.allianceActions.length === 0) {
    writer.paragraph("No joint actions recorded yet.");
  } else {
    for (const a of twin.allianceActions) {
      writer.bullet(`${a.action} — owner: ${a.owner || "unassigned"}, due: ${a.dueWindow || "—"}, status: ${a.status.toLowerCase()}`);
    }
  }

  return writer.finish();
}
