import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { generatePromiseCandidates, isPromiseUnresolved } from "@/lib/promises";
import { COMMERCIAL_TRACES, PROMISE_CLASSIFICATIONS } from "@/types/deal-twin";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConflictBanner } from "@/components/conflict-banner";
import { ActionButton } from "@/components/button-group";
import { Input, Textarea, Select } from "@/components/form-input";
import { addPromiseAction, addCandidatePromiseAction, updatePromiseTraceAction, removePromiseAction } from "./actions";

const TRACE_COLOR: Record<string, string> = { Priced: "emerald", "Not priced": "rose", Pending: "amber", "Not applicable": "slate" };

export default async function CommitmentsPage({
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

  const unresolved = twin.promises.filter(isPromiseUnresolved);
  const candidates = generatePromiseCandidates(twin);
  const rev = deal.revision;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <ConflictBanner show={conflict === "1"} />

        {unresolved.length > 0 && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p className="font-semibold">Submission firewall</p>
            <p className="mt-1">{unresolved.length} promise(s) are not priced or explicitly not applicable — this is a visible commercial exposure.</p>
          </div>
        )}

        <Card>
          <CardHeader title="Promise Ledger" subtitle="Every statement traced into source, owner, scope and price." />
          <CardBody className="space-y-3">
            {twin.promises.length === 0 && <p className="text-sm text-slate-500">No promises recorded yet. Add them from your Deal Twin or record them manually.</p>}
            {twin.promises.map((p) => (
              <div key={p.id} className="rounded-md border border-slate-100 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800">{p.statement}</p>
                  <Badge color="sky">{p.classification}</Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  {p.source && <span>Source: {p.source}</span>}
                  {p.owner && <span>Owner: {p.owner}</span>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {COMMERCIAL_TRACES.map((t) => (
                    <form key={t} action={updatePromiseTraceAction.bind(null, id, rev, p.id, t)}>
                      <ActionButton
                        type="submit"
                        variant={p.commercialTrace === t ? "primary" : "secondary"}
                        size="sm"
                      >
                        {t}
                      </ActionButton>
                    </form>
                  ))}
                  <Badge color={TRACE_COLOR[p.commercialTrace]}>{p.commercialTrace}</Badge>
                </div>
                <form action={removePromiseAction.bind(null, id, rev, p.id)} className="mt-1.5">
                  <ActionButton type="submit" variant="ghost" size="sm">
                    Remove
                  </ActionButton>
                </form>
              </div>
            ))}
          </CardBody>
        </Card>

        {candidates.length > 0 && (
          <Card>
            <CardHeader title="Suggested from the Deal Twin" subtitle="Selected from solution scope and boundaries — not invented." />
            <CardBody className="space-y-2">
              {candidates.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2 text-sm">
                  <span>{c.statement} <span className="text-xs text-slate-400">({c.classification})</span></span>
                  <form action={addCandidatePromiseAction.bind(null, id, rev, c.statement, c.classification, c.source)}>
                    <ActionButton type="submit" variant="secondary" size="sm">
                      Add
                    </ActionButton>
                  </form>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>

      <div>
        <Card>
          <CardHeader title="Record a promise" />
          <CardBody>
            <form action={addPromiseAction.bind(null, id, rev)} className="space-y-3">
              <Textarea name="statement" label="Statement" required rows={3} placeholder="What was said or promised?" />
              <Select name="classification" label="Classification" required defaultValue={PROMISE_CLASSIFICATIONS[0]}>
                {PROMISE_CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Input name="source" label="Source" placeholder="e.g., proposal, RFP" />
              <Input name="owner" label="Delivery owner" placeholder="Who is accountable?" />
              <Select name="commercialTrace" label="Commercial trace" defaultValue={COMMERCIAL_TRACES[0]}>
                {COMMERCIAL_TRACES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <ActionButton type="submit" variant="primary" className="w-full">
                Add promise
              </ActionButton>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
