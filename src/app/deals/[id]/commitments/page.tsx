import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { generatePromiseCandidates, isPromiseUnresolved } from "@/lib/promises";
import { COMMERCIAL_TRACES, PROMISE_CLASSIFICATIONS } from "@/types/deal-twin";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConflictBanner } from "@/components/conflict-banner";
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
            {twin.promises.length === 0 && <p className="text-sm text-slate-500">No promises recorded yet.</p>}
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
                      <button
                        type="submit"
                        className={`rounded-md px-2 py-1 text-xs font-medium ${p.commercialTrace === t ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {t}
                      </button>
                    </form>
                  ))}
                  <Badge color={TRACE_COLOR[p.commercialTrace]}>{p.commercialTrace}</Badge>
                </div>
                <form action={removePromiseAction.bind(null, id, rev, p.id)} className="mt-1.5">
                  <button type="submit" className="text-xs text-slate-400 hover:text-rose-600">Remove</button>
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
                    <button type="submit" className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Add
                    </button>
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
              <textarea name="statement" required rows={3} placeholder="What was said or promised?" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <select name="classification" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {PROMISE_CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input name="source" placeholder="Source" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="owner" placeholder="Delivery owner" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <select name="commercialTrace" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {COMMERCIAL_TRACES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button type="submit" className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                Add promise
              </button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
