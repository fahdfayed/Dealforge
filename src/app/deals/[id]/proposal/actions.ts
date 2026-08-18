"use server";

import { mutateDeal } from "@/lib/deal-mutation";
import type { ProposalFormat, ProposalPersona, ProposalStatus, ApprovalRecord } from "@/types/deal-twin";

const path = (dealId: string) => `/deals/${dealId}/proposal`;

export async function generateProposalAction(dealId: string, expectedRevision: number, formData: FormData) {
  const persona = String(formData.get("persona") ?? "CFO") as ProposalPersona;
  const format = String(formData.get("format") ?? "Formal document") as ProposalFormat;

  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => {
      const version = twin.proposals.length + 1;
      const validUntil = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
      return {
        ...twin,
        proposals: [
          ...twin.proposals,
          {
            id: crypto.randomUUID(),
            persona,
            title: `${format} — ${twin.identity.company} v${version}`,
            format,
            reference: `DF-${twin.identity.initials || "DEAL"}-${version}`,
            version,
            validUntil,
            terms: "Standard Intelloger commercial terms apply.",
            createdAt: new Date().toISOString(),
            status: "Draft" as ProposalStatus,
            commercialScenarioId: twin.savedCommercialScenarioId,
            approvals: [],
          },
        ],
      };
    },
    path(dealId)
  );
}

export async function updateProposalStatusAction(dealId: string, expectedRevision: number, proposalId: string, status: ProposalStatus) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({ ...twin, proposals: twin.proposals.map((p) => (p.id === proposalId ? { ...p, status } : p)) }),
    path(dealId)
  );
}

export async function deleteProposalAction(dealId: string, expectedRevision: number, proposalId: string) {
  await mutateDeal(dealId, expectedRevision, (twin) => ({ ...twin, proposals: twin.proposals.filter((p) => p.id !== proposalId) }), path(dealId));
}

export async function submitProposalApprovalAction(
  dealId: string,
  expectedRevision: number,
  proposalId: string,
  decision: "approved" | "rejected",
  comment: string,
  approvedBy: string
) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      proposals: twin.proposals.map((p) => {
        if (p.id === proposalId) {
          const approval: ApprovalRecord = {
            id: crypto.randomUUID(),
            approvedBy,
            decision,
            comment,
            decidedAt: new Date().toISOString(),
          };
          return {
            ...p,
            approvals: [...p.approvals, approval],
            status: decision === "approved" ? ("Approved" as ProposalStatus) : ("Pending approval" as ProposalStatus),
          };
        }
        return p;
      }),
    }),
    path(dealId)
  );
}
