import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { listProofAssets } from "@/lib/proof-repo";
import { matchProofAssets } from "@/lib/proof-matching";
import { evaluateSubmissionCheck } from "@/lib/submission-check";
import { PROPOSAL_FORMATS, PROPOSAL_PERSONAS, PROPOSAL_STATUSES } from "@/types/deal-twin";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConflictBanner } from "@/components/conflict-banner";
import { ProposalPdfButtons } from "@/components/pdf-buttons";
import { ApprovalWorkflowWrapper } from "@/components/approval-workflow-wrapper";
import { EmptyState } from "@/components/empty-state";
import { ActionButton } from "@/components/button-group";
import { Select } from "@/components/form-input";
import { generateProposalAction, updateProposalStatusAction, deleteProposalAction, submitProposalApprovalAction } from "./actions";
import type { ProposalStatus } from "@/types/deal-twin";

const STATUS_COLOR: Record<string, string> = { Draft: "slate", "Pending approval": "amber", Approved: "emerald", Sent: "sky" };

export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ conflict?: string }>;
}) {
  const { id } = await params;
  const { conflict } = await searchParams;
  const deal = await getDeal(id);
  if (!deal) notFound();
  const { twin } = deal;
  const rev = deal.revision;

  const allProof = await listProofAssets();
  const matchedProof = matchProofAssets(twin, allProof);
  const { blockingIssues } = evaluateSubmissionCheck(twin);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <ConflictBanner show={conflict === "1"} />

        <Card>
          <CardHeader
            title="Submission readiness"
            action={<Badge color={blockingIssues.length === 0 ? "emerald" : "rose"}>{blockingIssues.length === 0 ? "Ready" : `${blockingIssues.length} blocking`}</Badge>}
          />
          {blockingIssues.length > 0 && (
            <CardBody className="space-y-1">
              {blockingIssues.map((i) => (
                <p key={i.id} className="text-xs text-rose-700">{i.label}</p>
              ))}
            </CardBody>
          )}
        </Card>

        {twin.proposals.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No proposals yet"
            description="Generate a proposal from your Deal Twin and commercial position."
          />
        ) : (
          twin.proposals
            .slice()
            .reverse()
            .map((p) => (
              <Card key={p.id}>
                <CardHeader
                  title={p.title}
                  subtitle={`${p.format} · for ${p.persona} · ref ${p.reference} · v${p.version}`}
                  action={<Badge color={STATUS_COLOR[p.status]}>{p.status}</Badge>}
                />
                <CardBody className="space-y-3">
                  <ProposalPdfButtons deal={deal} proposal={p} proof={matchedProof} />
                  <ApprovalWorkflowWrapper
                    approvals={p.approvals}
                    status={p.status}
                    dealId={id}
                    entityId={p.id}
                    revision={rev}
                    onSubmitAction={submitProposalApprovalAction}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PROPOSAL_STATUSES.map((s) => (
                      <form key={s} action={updateProposalStatusAction.bind(null, id, rev, p.id, s as ProposalStatus)}>
                        <ActionButton
                          type="submit"
                          variant={p.status === s ? "primary" : "secondary"}
                          size="sm"
                        >
                          {s}
                        </ActionButton>
                      </form>
                    ))}
                  </div>
                  <form action={deleteProposalAction.bind(null, id, rev, p.id)}>
                    <ActionButton type="submit" variant="ghost" size="sm">
                      Delete
                    </ActionButton>
                  </form>
                </CardBody>
              </Card>
            ))
        )}

        {matchedProof.length > 0 && (
          <Card>
            <CardHeader title="Matched proof" subtitle="Tag-matched from the Proof Vault — nothing invented." />
            <CardBody className="space-y-2">
              {matchedProof.map((p) => (
                <p key={p.id} className="text-sm text-slate-700">
                  <strong>{p.title}</strong> ({p.type}) — {p.whatItProves || p.summary}
                </p>
              ))}
            </CardBody>
          </Card>
        )}
      </div>

      <div>
        <Card>
          <CardHeader title="Generate a proposal" subtitle="Assembled from the Deal Twin, saved solution and saved commercial position." />
          <CardBody>
            <form action={generateProposalAction.bind(null, id, rev)} className="space-y-3">
              <Select name="format" label="Format" required defaultValue={PROPOSAL_FORMATS[0]}>
                {PROPOSAL_FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
              <Select name="persona" label="Persona" required defaultValue={PROPOSAL_PERSONAS[0]}>
                {PROPOSAL_PERSONAS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
              <ActionButton type="submit" variant="primary" className="w-full">
                Generate
              </ActionButton>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
