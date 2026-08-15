"use client";

import { useState } from "react";
import type { Deal, ProposalDraft } from "@/types/deal-twin";
import type { ProofAsset } from "@/types/proof";
import { downloadPdf } from "@/lib/pdf/writer";

function baseFilename(company: string, suffix: string): string {
  return `${company.replace(/[^a-z0-9]+/gi, "-")}-${suffix}.pdf`;
}

function PdfButton({ label, onClick }: { label: string; onClick: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onClick();
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
    >
      {busy ? "Generating…" : label}
    </button>
  );
}

export function DealTwinPdfButton({ deal }: { deal: Deal }) {
  return (
    <PdfButton
      label="Download Deal Twin PDF"
      onClick={async () => {
        const { generateDealTwinPdf } = await import("@/lib/pdf/deal-twin-pdf");
        const bytes = await generateDealTwinPdf(deal);
        downloadPdf(bytes, baseFilename(deal.twin.identity.company, "deal-twin"));
      }}
    />
  );
}

export function AnswerGraphPdfButton({ deal }: { deal: Deal }) {
  return (
    <PdfButton
      label="Download Answer Graph PDF"
      onClick={async () => {
        const { generateAnswerGraphPdf } = await import("@/lib/pdf/answer-graph-pdf");
        const bytes = await generateAnswerGraphPdf(deal);
        downloadPdf(bytes, baseFilename(deal.twin.identity.company, "answer-graph"));
      }}
    />
  );
}

export function OracleBriefPdfButton({ deal }: { deal: Deal }) {
  return (
    <PdfButton
      label="Download Oracle brief PDF"
      onClick={async () => {
        const { generateOracleBriefPdf } = await import("@/lib/pdf/oracle-brief-pdf");
        const bytes = await generateOracleBriefPdf(deal);
        downloadPdf(bytes, baseFilename(deal.twin.identity.company, "oracle-brief"));
      }}
    />
  );
}

export function HandoverPdfButton({ deal }: { deal: Deal }) {
  return (
    <PdfButton
      label="Download handover pack PDF"
      onClick={async () => {
        const { generateHandoverPdf } = await import("@/lib/pdf/handover-pdf");
        const bytes = await generateHandoverPdf(deal);
        downloadPdf(bytes, baseFilename(deal.twin.identity.company, "handover"));
      }}
    />
  );
}

export function ProposalPdfButtons({ deal, proposal, proof }: { deal: Deal; proposal: ProposalDraft; proof: ProofAsset[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {proposal.format === "Formal document" ? (
        <PdfButton
          label="Download formal proposal PDF"
          onClick={async () => {
            const { generateFormalProposalPdf } = await import("@/lib/pdf/proposal-pdf");
            const bytes = await generateFormalProposalPdf(deal, proposal, proof);
            downloadPdf(bytes, baseFilename(deal.twin.identity.company, `proposal-v${proposal.version}`));
          }}
        />
      ) : (
        <PdfButton
          label="Download executive presentation PDF"
          onClick={async () => {
            const { generateExecutiveProposalPdf } = await import("@/lib/pdf/proposal-pdf");
            const bytes = await generateExecutiveProposalPdf(deal, proposal);
            downloadPdf(bytes, baseFilename(deal.twin.identity.company, `executive-v${proposal.version}`));
          }}
        />
      )}
    </div>
  );
}
