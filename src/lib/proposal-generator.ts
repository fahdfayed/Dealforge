import type {
  Opportunity,
  DealItem,
  Promise as PromiseRecord,
  Estimate,
  ProofItem,
} from "@/generated/prisma/client";
import { DEAL_ITEM_STATUS_META, type DealItemStatusKey } from "@/lib/domain";

type GeneratorInput = {
  opportunity: Opportunity;
  dealItems: DealItem[];
  promises: PromiseRecord[];
  estimate: Estimate | null;
  matchingProof: ProofItem[];
  docType: string;
  persona: string;
};

const PERSONA_OPENING: Record<string, string> = {
  CFO: "This proposal is framed around financial control, return on investment, cash-flow impact and commercial risk.",
  CIO: "This proposal is framed around architecture, integration, security and long-term scalability.",
  "HR Director": "This proposal is framed around employee experience, payroll accuracy and operational ownership.",
  Procurement: "This proposal is framed around scope clarity, pricing logic and contractual protection.",
  CEO: "This proposal is framed around the strategic outcome, transformation roadmap and confidence in delivery.",
  "Oracle Representative": "This proposal is framed around opportunity value, product alignment and the Oracle support required to win it.",
};

function fmtCurrency(n: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function dealItemLine(item: DealItem): string {
  const meta = DEAL_ITEM_STATUS_META[item.status as DealItemStatusKey];
  return `- **${item.label}:** ${item.value} _(${meta?.label ?? item.status})_`;
}

export function generateProposalMarkdown(input: GeneratorInput): string {
  const { opportunity, dealItems, promises, estimate, matchingProof, docType, persona } = input;
  const sections: string[] = [];

  sections.push(`# ${docType}: ${opportunity.name}`);
  sections.push(`_Prepared for ${opportunity.client} — audience: ${persona}_`);
  sections.push(PERSONA_OPENING[persona] ?? "");

  sections.push(`## What we heard from you`);
  const confirmed = dealItems.filter((i) => i.status === "CONFIRMED_BY_CLIENT" || i.status === "FOUND_IN_DOCUMENTS");
  if (confirmed.length > 0) {
    sections.push(confirmed.map(dealItemLine).join("\n"));
  } else {
    sections.push("_No confirmed discovery items recorded yet — this section will strengthen as discovery progresses._");
  }

  if (docType !== "Executive One-Pager") {
    sections.push(`## Assumptions requiring confirmation`);
    const assumed = dealItems.filter((i) => i.status === "ASSUMED_BY_INTELLOGER" || i.status === "STILL_UNKNOWN");
    if (assumed.length > 0) {
      sections.push(assumed.map(dealItemLine).join("\n"));
    } else {
      sections.push("_No open assumptions recorded._");
    }

    const contradictory = dealItems.filter((i) => i.status === "CONTRADICTORY");
    if (contradictory.length > 0) {
      sections.push(`> **Unresolved contradictions in the Deal Twin — resolve before submission:**\n` + contradictory.map(dealItemLine).join("\n"));
    }
  }

  sections.push(`## Proposed approach`);
  sections.push(
    `We recommend evaluating this opportunity across three approaches — **Stabilise**, **Modernise** and **Transform** — so ${opportunity.client} can choose the level of change that matches its risk appetite and budget, rather than a single all-or-nothing proposal.`
  );
  sections.push(`Modules in scope: ${opportunity.modules.split(",").filter(Boolean).join(", ") || "TBC"}.`);
  if (opportunity.countries) sections.push(`Countries in scope: ${opportunity.countries}.`);

  if (docType === "Statement of Work" || docType === "Full Technical & Commercial Proposal") {
    sections.push(`## Scope inclusions and exclusions`);
    const exclusions = promises.filter((p) => p.classification === "EXCLUSION");
    const clientResp = promises.filter((p) => p.classification === "CLIENT_RESPONSIBILITY");
    sections.push(
      [
        exclusions.length ? `**Exclusions:**\n` + exclusions.map((p) => `- ${p.statement}`).join("\n") : "",
        clientResp.length ? `**Client responsibilities:**\n` + clientResp.map((p) => `- ${p.statement}`).join("\n") : "",
      ]
        .filter(Boolean)
        .join("\n\n") || "_No exclusions or client responsibilities recorded yet._"
    );
  }

  if (estimate && docType !== "Executive One-Pager") {
    sections.push(`## Commercial summary`);
    sections.push(
      [
        `- **P50 effort (most likely):** ${estimate.p50Days} days`,
        `- **P80 effort (safer commercial position):** ${estimate.p80Days} days`,
        `- **Maximum exposure:** ${estimate.maxDays} days`,
        `- **Customer price:** ${fmtCurrency(estimate.customerPrice, opportunity.currency)}`,
        `- **Contingency:** ${estimate.contingencyPct}%`,
      ].join("\n")
    );
  } else if (!estimate) {
    sections.push(`## Commercial summary`);
    sections.push("_No estimate has been saved in the Commercial Lab yet — pricing is not yet available for this proposal._");
  } else {
    sections.push(`## Budgetary range`);
    sections.push(
      opportunity.budgetMin && opportunity.budgetMax
        ? `${opportunity.currency} ${opportunity.budgetMin.toLocaleString()} – ${opportunity.budgetMax.toLocaleString()}`
        : "Budget to be confirmed."
    );
  }

  const contractual = promises.filter((p) => p.classification === "CONTRACTUAL_COMMITMENT" || p.classification === "PROPOSED_DELIVERABLE");
  if (contractual.length > 0) {
    sections.push(`## Commitments made during the sale`);
    sections.push(
      contractual
        .map(
          (p) =>
            `- ${p.statement} ${p.commercialEffortIncluded ? "(effort included in estimate)" : "**(⚠ no commercial effort currently backing this commitment)**"}`
        )
        .join("\n")
    );
  }

  if (matchingProof.length > 0 && docType !== "Executive One-Pager") {
    sections.push(`## Relevant proof`);
    sections.push(
      matchingProof
        .map((p) => `- **${p.title}** _(${p.type}, ${p.confidentiality})_ — ${p.summary}`)
        .join("\n")
    );
  }

  sections.push(`## Recommended next step`);
  sections.push(opportunity.nextAction || "Schedule a follow-up to confirm outstanding discovery items and agree next steps.");

  return sections.filter(Boolean).join("\n\n");
}
