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
import { ApprovalWorkflow } from "@/components/approval-workflow";
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
          <Card className="p-8 text-center text-sm text-slate-500">No proposals generated yet.</Card>
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
                  <ApprovalWorkflow
                    approvals={p.approvals}
                    status={p.status}
                    onSubmit={async (decision, comment, approver) => {
                      await submitProposalApprovalAction(id, rev, p.id, decision, comment, approver);
                    }}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PROPOSAL_STATUSES.map((s) => (
                      <form key={s} action={updateProposalStatusAction.bind(null, id, rev, p.id, s as ProposalStatus)}>
                        <button
                          type="submit"
                          className={`rounded-md px-2 py-1 text-xs font-medium ${p.status === s ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                        >
                          {s}
                        </button>
                      </form>
                    ))}
                  </div>
                  <form action={deleteProposalAction.bind(null, id, rev, p.id)}>
                    <button type="submit" className="text-xs text-slate-400 hover:text-rose-600">Delete</button>
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
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Format</label>
                <select name="format" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {PROPOSAL_FORMATS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Persona</label>
                <select name="persona" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {PROPOSAL_PERSONAS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                Generate
              </button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
