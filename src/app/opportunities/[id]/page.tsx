import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { DEAL_ITEM_CATEGORIES, DEAL_ITEM_STATUS_META } from "@/lib/domain";
import { DealItemRow } from "@/components/deal-item-row";
import { addDealItem, updateDealItemStatus, updateOpportunitySummary } from "./actions";

export default async function DealTwinOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { dealItems: { orderBy: { createdAt: "asc" } } },
  });
  if (!opportunity) notFound();

  const contradictory = opportunity.dealItems.filter(
    (i) => i.status === "CONTRADICTORY"
  );

  const grouped = DEAL_ITEM_CATEGORIES.map((category) => ({
    category,
    items: opportunity.dealItems.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0);

  const uncategorised = opportunity.dealItems.filter(
    (i) => !DEAL_ITEM_CATEGORIES.includes(i.category as (typeof DEAL_ITEM_CATEGORIES)[number])
  );

  const addDealItemWithId = addDealItem.bind(null, opportunity.id);
  const updateSummaryWithId = updateOpportunitySummary.bind(null, opportunity.id);

  return (
    <div className="space-y-6">
      {contradictory.length > 0 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <strong>{contradictory.length} contradictory item{contradictory.length === 1 ? "" : "s"}</strong>{" "}
          need resolving before this Deal Twin can be trusted for pricing or proposals.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {grouped.map((group) => (
            <Card key={group.category}>
              <CardHeader title={group.category} subtitle={`${group.items.length} item${group.items.length === 1 ? "" : "s"}`} />
              <CardBody className="space-y-3">
                {group.items.map((item) => (
                  <DealItemRow
                    key={item.id}
                    item={item}
                    onUpdateStatus={updateDealItemStatus}
                    opportunityId={opportunity.id}
                  />
                ))}
              </CardBody>
            </Card>
          ))}

          {uncategorised.length > 0 && (
            <Card>
              <CardHeader title="Other" />
              <CardBody className="space-y-3">
                {uncategorised.map((item) => (
                  <DealItemRow
                    key={item.id}
                    item={item}
                    onUpdateStatus={updateDealItemStatus}
                    opportunityId={opportunity.id}
                  />
                ))}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Add to the Deal Twin" subtitle="Capture a new fact, assumption or commitment." />
            <CardBody>
              <form action={addDealItemWithId} className="grid grid-cols-2 gap-3">
                <select
                  name="category"
                  required
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {DEAL_ITEM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  name="status"
                  defaultValue="STILL_UNKNOWN"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {Object.entries(DEAL_ITEM_STATUS_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
                <input
                  name="label"
                  placeholder="Label, e.g. Decision timeline"
                  required
                  className="col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  name="value"
                  placeholder="Value / detail"
                  required
                  className="col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  name="source"
                  placeholder="Source (who said it / which document)"
                  className="col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                  >
                    Add item
                  </button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Opportunity status" />
            <CardBody>
              <form action={updateSummaryWithId} className="space-y-3">
                <LabeledSelect
                  label="Stage"
                  name="stage"
                  defaultValue={opportunity.stage}
                  options={[
                    "Qualifying",
                    "Discovery",
                    "Solutioning",
                    "Pricing",
                    "Proposal",
                    "Negotiation",
                    "Won",
                    "Lost",
                  ]}
                />
                <LabeledSelect
                  label="Momentum"
                  name="momentum"
                  defaultValue={opportunity.momentum}
                  options={["Accelerating", "Steady", "Stalling", "At risk"]}
                />
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Probability (%)
                  </label>
                  <input
                    type="number"
                    name="probability"
                    min={0}
                    max={100}
                    defaultValue={opportunity.probability}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Oracle registration status
                  </label>
                  <input
                    name="oracleRegistrationStatus"
                    defaultValue={opportunity.oracleRegistrationStatus}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Recommended next action
                  </label>
                  <textarea
                    name="nextAction"
                    defaultValue={opportunity.nextAction}
                    rows={3}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Save
                </button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Opportunity facts" />
            <CardBody className="space-y-2 text-sm text-slate-600">
              <Fact label="Industry" value={opportunity.industry || "—"} />
              <Fact label="Countries" value={opportunity.countries || "—"} />
              <Fact label="Legal entities" value={opportunity.legalEntities || "—"} />
              <Fact label="Oracle environment" value={opportunity.oracleEnvironment || "—"} />
              <Fact label="Modules" value={opportunity.modules.split(",").filter(Boolean).join(", ") || "—"} />
              <Fact
                label="Budget"
                value={
                  opportunity.budgetMin && opportunity.budgetMax
                    ? `${opportunity.currency} ${opportunity.budgetMin.toLocaleString()} – ${opportunity.budgetMax.toLocaleString()}`
                    : "TBC"
                }
              />
              <Fact label="Timeline" value={opportunity.timelineMonths ? `${opportunity.timelineMonths} months` : "TBC"} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-50 py-1 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-700">{value}</span>
    </div>
  );
}

function LabeledSelect({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
