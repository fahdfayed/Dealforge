"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateProposalMarkdown } from "@/lib/proposal-generator";
import type { ProposalStatus } from "@/generated/prisma/enums";

export async function generateProposal(opportunityId: string, formData: FormData) {
  const docType = String(formData.get("docType") ?? "");
  const persona = String(formData.get("persona") ?? "");

  const opportunity = await prisma.opportunity.findUniqueOrThrow({
    where: { id: opportunityId },
    include: { dealItems: true, promises: true, estimate: true },
  });

  const matchingProof = opportunity.industry
    ? await prisma.proofItem.findMany({
        where: {
          industry: { contains: opportunity.industry },
        },
        take: 5,
      })
    : [];

  const content = generateProposalMarkdown({
    opportunity,
    dealItems: opportunity.dealItems,
    promises: opportunity.promises,
    estimate: opportunity.estimate,
    matchingProof,
    docType,
    persona,
  });

  await prisma.proposal.create({
    data: {
      opportunityId,
      title: `${docType} — ${opportunity.client}`,
      docType,
      persona,
      content,
      status: "DRAFT",
    },
  });

  revalidatePath(`/opportunities/${opportunityId}/proposals`);
}

export async function updateProposalStatus(
  opportunityId: string,
  proposalId: string,
  status: ProposalStatus,
  approverNote?: string
) {
  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status, ...(approverNote !== undefined ? { approverNote } : {}) },
  });
  revalidatePath(`/opportunities/${opportunityId}/proposals`);
}

export async function deleteProposal(opportunityId: string, proposalId: string) {
  await prisma.proposal.delete({ where: { id: proposalId } });
  revalidatePath(`/opportunities/${opportunityId}/proposals`);
}
