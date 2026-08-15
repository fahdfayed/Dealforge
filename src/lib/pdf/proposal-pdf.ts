import type { Deal, ProposalDraft } from "@/types/deal-twin";
import type { ProofAsset } from "@/types/proof";
import { computeProbability } from "@/lib/scoring";
import { PdfWriter } from "./writer";

const PERSONA_FRAMING: Record<ProposalDraft["persona"], string> = {
  CFO: "Framed around financial control, return on investment, cash flow and commercial risk.",
  CIO: "Framed around architecture, integration, security and long-term scalability.",
  "HR Director": "Framed around employee experience, payroll accuracy and operational ownership.",
  Procurement: "Framed around scope clarity, pricing logic and contractual protection.",
  CEO: "Framed around the strategic outcome, transformation roadmap and confidence in delivery.",
  "Oracle representative": "Framed around opportunity value, product alignment and the Oracle support required to win it.",
};

// Formal document manifest per doc 8.2: Cover, Cover letter, Offer overview,
// Scope basis, Delivery roadmap, Commercial position, Commercial terms,
// Assumptions/exclusions/responsibilities, Acceptance.
export async function generateFormalProposalPdf(deal: Deal, proposal: ProposalDraft, proof: ProofAsset[]): Promise<Uint8Array> {
  const { twin } = deal;
  const scenario = twin.commercialScenarios.find((s) => s.id === proposal.commercialScenarioId);
  const probability = computeProbability(twin);

  const writer = await PdfWriter.create(proposal.title, "portrait");

  // Cover
  writer.coverTitle(twin.solution.clientLanguage.solutionTitle || proposal.title, `Prepared for ${twin.identity.company}`);
  writer.keyValueRow("Reference", proposal.reference);
  writer.keyValueRow("Version", String(proposal.version));
  writer.keyValueRow("Date", proposal.createdAt.slice(0, 10));
  writer.keyValueRow("Valid until", proposal.validUntil ?? "—");
  writer.keyValueRow("Prepared for", proposal.persona);

  // Cover letter
  writer.heading("Cover letter");
  writer.paragraph(`Dear ${twin.identity.company} team,`);
  writer.paragraph(
    `This proposal sets out our recommended approach for ${twin.identity.engagementTitle || "this engagement"}. ${PERSONA_FRAMING[proposal.persona]}`
  );
  writer.paragraph(twin.commercialHeadline.nextMove || "We look forward to discussing the recommended path with you.");

  // Offer overview
  writer.heading("Offer overview");
  writer.keyValueRow("Recommended path", twin.solution.selectedPath ?? "Not yet selected");
  writer.keyValueRow("Objective", twin.solution.objective || "—");
  writer.keyValueRow("Likely win position", `${probability.likely}%`);
  writer.paragraph(twin.solution.clientLanguage.decisionAsk || "Decision ask not yet defined.");

  // Scope basis
  writer.heading("Scope basis");
  const included = twin.solution.components.filter((c) => c.included);
  if (included.length === 0) {
    writer.paragraph("No included capabilities recorded yet.");
  } else {
    for (const c of included) {
      writer.bullet(`${c.label} — ${c.outcome} (${c.authority})`);
    }
  }

  // Delivery roadmap
  writer.heading("Delivery roadmap");
  const phases = [...new Set(included.map((c) => c.phase))].sort((a, b) => a - b);
  if (phases.length === 0) {
    writer.paragraph("Delivery roadmap not yet phased.");
  } else {
    for (const phase of phases) {
      const label = twin.solution.clientLanguage.phaseNames[phase] ?? `Phase ${phase}`;
      const purpose = twin.solution.clientLanguage.phasePurposes[phase] ?? "";
      writer.subheading(label);
      if (purpose) writer.paragraph(purpose);
      for (const c of included.filter((c) => c.phase === phase)) writer.bullet(c.label);
    }
  }

  // Commercial position
  writer.heading("Commercial position");
  if (scenario) {
    writer.keyValueRow("Adjusted effort", `${scenario.adjustedEffortDays} days`);
    writer.keyValueRow("Customer price", formatCurrency(scenario.customerPrice, twin.commercialHeadline.currency));
    writer.keyValueRow("P50 / P80 days", `${scenario.p50Days} / ${scenario.p80Days}`);
    writer.keyValueRow("Gross margin", `${scenario.grossMarginPct}%`);
  } else {
    writer.paragraph("No saved commercial position is linked to this proposal.");
  }

  // Commercial terms
  writer.heading("Commercial terms");
  writer.keyValueRow("Currency", twin.commercialHeadline.currency);
  writer.keyValueRow("Payment structure", scenario?.inputs.paymentStructure ?? "—");
  writer.keyValueRow("Validity", proposal.validUntil ?? "—");
  writer.paragraph(proposal.terms || "Standard Intelloger commercial terms apply.");

  // Assumptions / exclusions / responsibilities + Promise Ledger control
  writer.heading("Assumptions, exclusions and responsibilities");
  writer.subheading("Exclusions");
  if (twin.solution.exclusions.length === 0) writer.paragraph("None recorded.");
  else twin.solution.exclusions.forEach((e) => writer.bullet(e));
  writer.subheading("Client responsibilities");
  if (twin.solution.responsibilities.length === 0) writer.paragraph("None recorded.");
  else twin.solution.responsibilities.forEach((r) => writer.bullet(r));
  writer.subheading("Promise Ledger");
  if (twin.promises.length === 0) writer.paragraph("No promises recorded.");
  else
    twin.promises.forEach((p) =>
      writer.bullet(`${p.statement} — ${p.classification}, ${p.commercialTrace}`)
    );

  if (proof.length > 0) {
    writer.heading("Relevant proof");
    for (const p of proof) writer.bullet(`${p.title} (${p.type}) — ${p.whatItProves || p.summary}`);
  }

  // Acceptance
  writer.heading("Acceptance");
  writer.paragraph("Signed acceptance of this proposal confirms agreement to the scope, commercial position and terms above.");
  writer.spacer(30);
  writer.keyValueRow("Client signature", "________________________");
  writer.keyValueRow("Date", "________________________");

  return writer.finish();
}

// Executive presentation: concise boardroom narrative, 16:9 landscape.
export async function generateExecutiveProposalPdf(deal: Deal, proposal: ProposalDraft): Promise<Uint8Array> {
  const { twin } = deal;
  const scenario = twin.commercialScenarios.find((s) => s.id === proposal.commercialScenarioId);
  const probability = computeProbability(twin);

  const writer = await PdfWriter.create(proposal.title, "landscape");
  writer.coverTitle(twin.solution.clientLanguage.solutionTitle || proposal.title, `Executive summary for ${twin.identity.company}`);

  writer.heading("Why now");
  writer.paragraph(twin.commercialHeadline.nextMove || "Business case not yet articulated.");

  writer.heading("What we recommend");
  writer.keyValueRow("Path", twin.solution.selectedPath ?? "Not yet selected");
  writer.paragraph(twin.solution.objective || "");

  writer.heading("What it costs");
  if (scenario) {
    writer.keyValueRow("Customer price", formatCurrency(scenario.customerPrice, twin.commercialHeadline.currency));
    writer.keyValueRow("P50 / P80", `${scenario.p50Days} / ${scenario.p80Days} days`);
  } else {
    writer.paragraph("Commercial position not yet saved.");
  }

  writer.heading("Confidence");
  writer.keyValueRow("Likely win position", `${probability.likely}%`);

  writer.heading("Decision needed");
  writer.paragraph(twin.solution.clientLanguage.decisionAsk || "Decision ask not yet defined.");

  return writer.finish();
}

function formatCurrency(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

