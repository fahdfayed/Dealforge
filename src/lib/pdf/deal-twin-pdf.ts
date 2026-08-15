import type { Deal } from "@/types/deal-twin";
import { computeProbability, computeDimensions, discoveryCoverage, getSafetyMode } from "@/lib/scoring";
import { PdfWriter } from "./writer";

export async function generateDealTwinPdf(deal: Deal): Promise<Uint8Array> {
  const { twin } = deal;
  const probability = computeProbability(twin);
  const dims = computeDimensions(twin);
  const coverage = discoveryCoverage(twin);
  const safety = getSafetyMode(twin, probability, dims);

  const writer = await PdfWriter.create(`${twin.identity.company} — Deal Twin`, "portrait");
  writer.coverTitle(`Deal Twin: ${twin.identity.company}`, twin.identity.engagementTitle || "Engagement title not yet set");
  writer.badge(safety.label);
  writer.paragraph(safety.detail);

  writer.heading("Identity");
  writer.keyValueRow("Company", twin.identity.company);
  writer.keyValueRow("Engagement", twin.identity.engagementTitle || "—");
  writer.keyValueRow("Stage", twin.identity.stage);
  writer.keyValueRow("Owner", twin.identity.owner);
  writer.keyValueRow("Due date", twin.identity.dueDate ?? "—");

  writer.heading("Commercial headline");
  writer.keyValueRow(
    "Opportunity value",
    twin.commercialHeadline.opportunityValue != null
      ? `${twin.commercialHeadline.currency} ${twin.commercialHeadline.opportunityValue.toLocaleString()}`
      : "—"
  );
  writer.keyValueRow("Momentum", twin.commercialHeadline.momentum);
  writer.keyValueRow("Current margin", twin.commercialHeadline.currentMargin != null ? `${twin.commercialHeadline.currentMargin}%` : "—");
  writer.keyValueRow("Next move", twin.commercialHeadline.nextMove || "—");

  writer.heading("Deal intelligence");
  writer.keyValueRow("Probability (low / likely / high)", `${probability.low}% / ${probability.likely}% / ${probability.high}%`);
  writer.keyValueRow("Capped at", `${probability.cap}%`);
  writer.keyValueRow("Win", `${dims.win}`);
  writer.keyValueRow("Scope", `${dims.scope}`);
  writer.keyValueRow("Delivery", `${dims.delivery}`);
  writer.keyValueRow("Estimate", `${dims.estimate}`);
  writer.keyValueRow("Margin", `${dims.margin}`);
  writer.keyValueRow("Payment", `${dims.payment}`);
  writer.keyValueRow("Stakeholder", `${dims.stakeholder}`);
  writer.keyValueRow("Oracle", `${dims.oracle}`);

  writer.heading("Deal DNA");
  writer.keyValueRow("Engagement type", twin.dealDNA.engagementType ?? "—");
  writer.keyValueRow("Industry", twin.dealDNA.industry || "—");
  writer.keyValueRow("Countries", twin.dealDNA.countries.join(", ") || "—");
  writer.keyValueRow("Client type", twin.dealDNA.clientType ?? "—");
  writer.keyValueRow("Commercial model", twin.dealDNA.commercialModel ?? "—");
  writer.keyValueRow("Entities", twin.dealDNA.entityCount != null ? String(twin.dealDNA.entityCount) : "—");
  writer.keyValueRow("Users", twin.dealDNA.userCount != null ? String(twin.dealDNA.userCount) : "—");

  writer.heading("Discovery");
  writer.keyValueRow("Coverage", `${coverage.pct}% (${coverage.answered}/${coverage.total} active questions)`);

  writer.heading("Evidence register");
  if (twin.evidence.length === 0) {
    writer.paragraph("No evidence items recorded.");
  } else {
    for (const e of twin.evidence) {
      writer.bullet(`${e.label} — ${e.authority}, confidence ${e.confidence}, source: ${e.source}`);
    }
  }

  writer.heading("Solution");
  writer.keyValueRow("Selected path", twin.solution.selectedPath ?? "—");
  const included = twin.solution.components.filter((c) => c.included);
  if (included.length === 0) {
    writer.paragraph("No included capabilities yet.");
  } else {
    for (const c of included) {
      writer.bullet(`${c.label} (${c.category}, phase ${c.phase}, ${c.effortDays} days, ${c.priority})`);
    }
  }

  writer.heading("Promise Ledger");
  if (twin.promises.length === 0) {
    writer.paragraph("No promises recorded.");
  } else {
    for (const p of twin.promises) {
      writer.bullet(`${p.statement} — ${p.classification}, ${p.commercialTrace}`);
    }
  }

  writer.heading("Scope Handshake");
  if (twin.scopeHandshake.length === 0) {
    writer.paragraph("Not yet published.");
  } else {
    for (const h of twin.scopeHandshake) {
      writer.bullet(`${h.statement} — ${h.response}`);
    }
  }

  writer.heading("Revision");
  writer.keyValueRow("Revision", String(deal.revision));
  writer.keyValueRow("Created", deal.createdAt.slice(0, 10));
  writer.keyValueRow("Updated", deal.updatedAt.slice(0, 10));

  return writer.finish();
}
