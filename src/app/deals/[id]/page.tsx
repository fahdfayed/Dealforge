import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { getRecommendedActions, getSafetyMode, computeProbability, computeDimensions } from "@/lib/scoring";
import { STAGES, ENGAGEMENT_TYPES, COMMERCIAL_MODELS, CLIENT_TYPES, MOMENTUM_STATES } from "@/types/deal-twin";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConflictBanner } from "@/components/conflict-banner";
import { DealTwinPdfButton } from "@/components/pdf-buttons";
import { updateDealCore } from "./actions";
import { duplicateDealAction, deleteDealAction } from "../actions";

const FACTOR_FIELDS: { name: string; label: string }[] = [
  { name: "relationshipFactor", label: "Relationship" },
  { name: "budgetFactor", label: "Budget" },
  { name: "scopeFactor", label: "Scope" },
  { name: "evidenceQualityFactor", label: "Evidence quality" },
  { name: "stakeholderFactor", label: "Stakeholder access" },
  { name: "oracleFactor", label: "Oracle alignment" },
  { name: "deliveryFactor", label: "Delivery capacity" },
  { name: "strategicFitFactor", label: "Strategic fit" },
  { name: "paymentFactor", label: "Payment confidence" },
  { name: "urgencyFactor", label: "Urgency" },
];

export default async function DealTwinPage({
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

  const probability = computeProbability(deal.twin);
  const dims = computeDimensions(deal.twin);
  const safety = getSafetyMode(deal.twin, probability, dims);
  const actions = getRecommendedActions(deal.twin);
  const save = updateDealCore.bind(null, deal.id, deal.revision);

  return (
    <div className="space-y-6">
      <ConflictBanner show={conflict === "1"} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Identity" />
            <CardBody>
              <form action={save} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Engagement title" name="engagementTitle" defaultValue={deal.twin.identity.engagementTitle} full />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <SelectField label="Stage" name="stage" defaultValue={deal.twin.identity.stage} options={[...STAGES]} />
                  <Field label="Owner" name="owner" defaultValue={deal.twin.identity.owner} />
                  <Field label="Due date" name="dueDate" type="date" defaultValue={deal.twin.identity.dueDate ?? ""} />
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Commercial headline</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Opportunity value" name="opportunityValue" type="number" defaultValue={deal.twin.commercialHeadline.opportunityValue ?? ""} />
                    <Field label="Currency" name="currency" defaultValue={deal.twin.commercialHeadline.currency} />
                    <Field label="CRM probability (%)" name="crmProbability" type="number" defaultValue={deal.twin.commercialHeadline.crmProbability ?? ""} />
                    <SelectField label="Momentum" name="momentum" defaultValue={deal.twin.commercialHeadline.momentum} options={[...MOMENTUM_STATES]} />
                    <Field label="Current margin (%)" name="currentMargin" type="number" defaultValue={deal.twin.commercialHeadline.currentMargin ?? ""} />
                  </div>
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Next move</label>
                    <textarea
                      name="nextMove"
                      defaultValue={deal.twin.commercialHeadline.nextMove}
                      rows={2}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Deal DNA</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Engagement type" name="engagementType" defaultValue={deal.twin.dealDNA.engagementType ?? ""} options={["", ...ENGAGEMENT_TYPES]} />
                    <Field label="Industry" name="industry" defaultValue={deal.twin.dealDNA.industry} />
                    <Field label="Countries (comma-separated)" name="countries" defaultValue={deal.twin.dealDNA.countries.join(", ")} full />
                    <SelectField label="Client type" name="clientType" defaultValue={deal.twin.dealDNA.clientType ?? ""} options={["", ...CLIENT_TYPES]} />
                    <SelectField label="Commercial model" name="commercialModel" defaultValue={deal.twin.dealDNA.commercialModel ?? ""} options={["", ...COMMERCIAL_MODELS]} />
                    <Field label="Entities" name="entityCount" type="number" defaultValue={deal.twin.dealDNA.entityCount ?? ""} />
                    <Field label="Users" name="userCount" type="number" defaultValue={deal.twin.dealDNA.userCount ?? ""} />
                  </div>

                  <p className="mb-2 mt-4 text-xs text-slate-500">
                    Context factors (1 = weak, 5 = strong). Left unset, a factor scores 0 rather than a neutral midpoint.
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {FACTOR_FIELDS.map((f) => (
                      <SelectField
                        key={f.name}
                        label={f.label}
                        name={f.name}
                        defaultValue={String((deal.twin.dealDNA as unknown as Record<string, unknown>)[f.name] ?? "")}
                        options={["", "1", "2", "3", "4", "5"]}
                        compact
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-200 pt-4">
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Safety mode" />
            <CardBody>
              <p className="text-sm font-semibold text-slate-800">{safety.label}</p>
              <p className="mt-1 text-xs text-slate-500">{safety.detail}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <DimStat label="Win" value={dims.win} />
                <DimStat label="Scope" value={dims.scope} />
                <DimStat label="Delivery" value={dims.delivery} />
                <DimStat label="Estimate" value={dims.estimate} />
                <DimStat label="Margin" value={dims.margin} />
                <DimStat label="Payment" value={dims.payment} />
                <DimStat label="Stakeholder" value={dims.stakeholder} />
                <DimStat label="Oracle" value={dims.oracle} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Decision queue" subtitle="Highest-impact actions for this deal." />
            <CardBody className="space-y-2">
              {actions.map((a) => (
                <p key={a.id} className="text-xs text-slate-600">
                  • {a.label}
                </p>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <DealTwinPdfButton deal={deal} />
              <Link href={`/deals/${deal.id}/comments`} className="block rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 text-center">
                Comments ({deal.twin.teamComments?.length || 0})
              </Link>
              <Link href={`/deals/${deal.id}/history`} className="block rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 text-center">
                View history
              </Link>
              <form action={duplicateDealAction.bind(null, deal.id)}>
                <Button type="submit" variant="outline" className="w-full">
                  Duplicate deal
                </Button>
              </form>
              <form action={deleteDealAction.bind(null, deal.id)}>
                <Button type="submit" variant="danger" className="w-full">
                  Delete deal
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DimStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1.5">
      <p className="text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  full,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string | number;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  compact,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
  compact?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className={`w-full rounded-md border border-slate-300 text-sm ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "Not set"}
          </option>
        ))}
      </select>
    </div>
  );
}
