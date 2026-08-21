import Link from "next/link";
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
import { toggleProofLinkAction, generateProposalAction, updateProposalStatusAction, deleteProposalAction, submitProposalApprovalAction } from "./actions";
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
  // Suggestions float to the top; everything else stays reachable beneath them.
  // Tag matching is a convenience, not a permission.
  const orderedProof = [
    ...matchedProof,
    ...allProof.filter((a) => !matchedProof.some((m) => m.id === a.id)),
  ];
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

        {/* Always rendered.
            This card used to appear only when tag matching returned something,
            which made "No matched proof linked to this deal" unclearable on any
            deal whose DNA had not been filled in yet — the blocker pointed here
            and there was nothing here. Matching now orders the list rather than
            deciding whether a list exists. */}
        <Card>
          <CardHeader
            title="Supporting proof"
            subtitle={
              deal.twin.proofLinks.length > 0
                ? `${deal.twin.proofLinks.length} linked to this deal`
                : "Nothing linked yet"
            }
          />
          <CardBody className="space-y-2">
            {allProof.length === 0 ? (
              <p className="text-sm text-slate-500">
                The vault is empty, so there is nothing to link.{" "}
                <Link href="/proof" className="font-medium text-indigo-600 underline underline-offset-2">
                  Add proof to the vault
                </Link>
                .
              </p>
            ) : (
              <>
                {matchedProof.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Suggested first, based on this deal&apos;s industry, engagement type and
                    countries.
                  </p>
                )}
                {orderedProof.map((pa) => {
                  const linked = deal.twin.proofLinks.includes(pa.id);
                  const suggested = matchedProof.some((m) => m.id === pa.id);
                  return (
                    <div
                      key={pa.id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-slate-100 px-3 py-2"
                    >
                      <p className="min-w-0 text-sm text-slate-700">
                        <strong>{pa.title}</strong> ({pa.type})
                        {suggested && (
                          <span className="ml-2 rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700">
                            Suggested
                          </span>
                        )}
                        <span className="block text-xs text-slate-500">
                          {pa.whatItProves || pa.summary}
                        </span>
                      </p>
                      <form action={toggleProofLinkAction.bind(null, id, rev, pa.id)}>
                        <button
                          type="submit"
                          className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium ${
                            linked
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {linked ? "Linked ✓" : "Link to deal"}
                        </button>
                      </form>
                    </div>
                  );
                })}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader title="Generate a proposal" />
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
