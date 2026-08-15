import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PROPOSAL_STATUS_META,
  PROPOSAL_DOC_TYPES,
  PROPOSAL_PERSONAS,
  PROMISE_KINDS_REQUIRING_EFFORT,
  type PromiseClassificationKey,
} from "@/lib/domain";
import { computeCoverage } from "@/lib/coverage";
import { generateProposal, updateProposalStatus, deleteProposal } from "./actions";
import type { ProposalStatus } from "@/generated/prisma/enums";

export default async function ProposalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      proposals: { orderBy: { createdAt: "desc" } },
      dealItems: true,
      promises: true,
      estimate: true,
      discoveryQuestions: true,
    },
  });
  if (!opportunity) notFound();

  const contradictory = opportunity.dealItems.filter((i) => i.status === "CONTRADICTORY").length;
  const unbacked = opportunity.promises.filter(
    (p) =>
      PROMISE_KINDS_REQUIRING_EFFORT.includes(p.classification as PromiseClassificationKey) &&
      !p.commercialEffortIncluded
  ).length;
  const coverage = computeCoverage(opportunity.discoveryQuestions);
  const hasEstimate = !!opportunity.estimate;

  const readinessBlockers = [
    contradictory > 0 && `${contradictory} contradictory Deal Twin item(s) unresolved`,
    unbacked > 0 && `${unbacked} promise(s) not backed by commercial effort`,
    !hasEstimate && "No saved Commercial Lab estimate",
    coverage.missingCriticalCount > 0 && `${coverage.missingCriticalCount} critical discovery question(s) unanswered`,
  ].filter(Boolean) as string[];

  const readinessScore = Math.max(0, 100 - readinessBlockers.length * 20);

  const genProposal = generateProposal.bind(null, opportunity.id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader
            title="Submission Readiness"
            subtitle={`${readinessScore}/100 — derived from the Deal Twin, Discovery and Promise Ledger`}
          />
          <CardBody>
            {readinessBlockers.length === 0 ? (
              <p className="text-sm text-emerald-700">No blocking issues found. Ready to submit.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-rose-700">
                {readinessBlockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {opportunity.proposals.length === 0 ? (
          <Card className="p-10 text-center text-sm text-slate-500">
            No proposals generated yet.
          </Card>
        ) : (
          opportunity.proposals.map((p) => {
            const meta = PROPOSAL_STATUS_META[p.status as keyof typeof PROPOSAL_STATUS_META];
            return (
              <Card key={p.id}>
                <CardHeader
                  title={p.title}
                  subtitle={`${p.docType} · for ${p.persona} · created ${p.createdAt.toLocaleDateString()}`}
                  action={<Badge color={meta.color}>{meta.label}</Badge>}
                />
                <CardBody>
                  <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                    {p.content}
                  </pre>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={`/opportunities/${opportunity.id}/proposals/${p.id}/export`}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                    >
                      Download .docx
                    </a>
                    <StatusForm
                      opportunityId={opportunity.id}
                      proposalId={p.id}
                      status="PENDING_APPROVAL"
                      label="Submit for approval"
                    />
                    <StatusForm
                      opportunityId={opportunity.id}
                      proposalId={p.id}
                      status="APPROVED"
                      label="Approve"
                    />
                    <StatusForm opportunityId={opportunity.id} proposalId={p.id} status="SENT" label="Mark sent" />
                    <form action={deleteProposal.bind(null, opportunity.id, p.id)}>
                      <button type="submit" className="text-xs text-slate-400 hover:text-rose-600">
                        Delete
                      </button>
                    </form>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>

      <div>
        <Card>
          <CardHeader title="Generate a proposal" subtitle="Assembled from the Deal Twin — nothing invented." />
          <CardBody>
            <form action={genProposal} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Document type</label>
                <select name="docType" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {PROPOSAL_DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Audience persona</label>
                <select name="persona" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {PROPOSAL_PERSONAS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Generate
              </button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function StatusForm({
  opportunityId,
  proposalId,
  status,
  label,
}: {
  opportunityId: string;
  proposalId: string;
  status: ProposalStatus;
  label: string;
}) {
  const action = async () => {
    "use server";
    await updateProposalStatus(opportunityId, proposalId, status);
  };
  return (
    <form action={action}>
      <button
        type="submit"
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        {label}
      </button>
    </form>
  );
}
