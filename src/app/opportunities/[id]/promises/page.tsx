import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PROMISE_CLASSIFICATION_META,
  PROMISE_KINDS_REQUIRING_EFFORT,
  type PromiseClassificationKey,
} from "@/lib/domain";
import { addPromise, deletePromise } from "./actions";

export default async function PromisesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { promises: { orderBy: { createdAt: "desc" } } },
  });
  if (!opportunity) notFound();

  const unbacked = opportunity.promises.filter(
    (p) =>
      PROMISE_KINDS_REQUIRING_EFFORT.includes(p.classification as PromiseClassificationKey) &&
      !p.commercialEffortIncluded
  );

  const addPromiseWithId = addPromise.bind(null, opportunity.id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {unbacked.length > 0 && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p className="font-semibold">Scope firewall warning</p>
            <p className="mt-1">
              {unbacked.length} commitment{unbacked.length === 1 ? "" : "s"} or proposed
              deliverable{unbacked.length === 1 ? "" : "s"} have no backing effort in the
              Commercial Lab estimate:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {unbacked.map((p) => (
                <li key={p.id}>{p.statement}</li>
              ))}
            </ul>
          </div>
        )}

        <Card>
          <CardHeader
            title="Promise Ledger"
            subtitle="Every statement made during the sale, traced into scope and price."
          />
          <CardBody className="space-y-3">
            {opportunity.promises.length === 0 && (
              <p className="text-sm text-slate-500">No promises recorded yet.</p>
            )}
            {opportunity.promises.map((p) => {
              const meta = PROMISE_CLASSIFICATION_META[p.classification as PromiseClassificationKey];
              const risky =
                PROMISE_KINDS_REQUIRING_EFFORT.includes(
                  p.classification as PromiseClassificationKey
                ) && !p.commercialEffortIncluded;
              return (
                <div
                  key={p.id}
                  className={`rounded-md border px-3 py-2.5 ${
                    risky ? "border-rose-200 bg-rose-50/40" : "border-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800">{p.statement}</p>
                    <Badge color={meta?.color}>{meta?.label ?? p.classification}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {p.saidBy && <span>Said by: {p.saidBy}</span>}
                    {p.source && <span>Source: {p.source}</span>}
                    {p.owner && <span>Owner: {p.owner}</span>}
                    <span>{p.inSOW ? "In SOW" : "Not in SOW"}</span>
                    <span>
                      {p.commercialEffortIncluded
                        ? "Commercial effort included"
                        : "No commercial effort included"}
                    </span>
                  </div>
                  <form action={deletePromise.bind(null, opportunity.id, p.id)} className="mt-1.5">
                    <button type="submit" className="text-xs text-slate-400 hover:text-rose-600">
                      Remove
                    </button>
                  </form>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader title="Record a promise" />
          <CardBody>
            <form action={addPromiseWithId} className="space-y-3">
              <textarea
                name="statement"
                required
                rows={3}
                placeholder="What was said or promised?"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                name="classification"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {Object.entries(PROMISE_CLASSIFICATION_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
              <input
                name="saidBy"
                placeholder="Said by"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="source"
                placeholder="Source (meeting, email, proposal section)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="owner"
                placeholder="Delivery owner"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="inSOW" className="rounded border-slate-300" />
                Reached the final SOW
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="commercialEffortIncluded"
                  className="rounded border-slate-300"
                />
                Commercial effort included in estimate
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Add promise
              </button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
