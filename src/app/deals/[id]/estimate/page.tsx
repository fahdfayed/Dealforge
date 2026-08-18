import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { DEFAULT_COMMERCIAL_INPUTS } from "@/lib/commercial";
import { CommercialEstimator } from "@/components/commercial-estimator";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApprovalWorkflow } from "@/components/approval-workflow";
import { ConflictBanner } from "@/components/conflict-banner";
import { saveScenarioAction, setBaselineAction, deleteScenarioAction, submitScenarioApprovalAction } from "./actions";

export default async function DetailedEstimatePage({
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

  const latest = twin.commercialScenarios[twin.commercialScenarios.length - 1];
  const initialInputs = latest?.inputs ?? DEFAULT_COMMERCIAL_INPUTS;

  const save = async (dealId: string, name: string, inputs: typeof initialInputs) => {
    "use server";
    await saveScenarioAction(dealId, deal.revision, name, inputs);
  };

  return (
    <div className="space-y-6">
      <ConflictBanner show={conflict === "1"} />

      <CommercialEstimator dealId={id} initialInputs={initialInputs} onSave={save} />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Scenario comparison and saved baselines</h3>
        {twin.commercialScenarios.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500">No scenarios saved yet.</Card>
        ) : (
          twin.commercialScenarios
            .slice()
            .reverse()
            .map((s) => (
              <Card key={s.id}>
                <CardHeader
                  title={`${s.name}`}
                  subtitle={`${s.adjustedEffortDays}d · ${new Intl.NumberFormat("en-US", { style: "currency", currency: twin.commercialHeadline.currency, maximumFractionDigits: 0 }).format(s.customerPrice)} · margin ${s.grossMarginPct}%`}
                  action={
                    <div className="flex gap-2">
                      {twin.savedCommercialScenarioId === s.id && <Badge color="emerald">Baseline</Badge>}
                      <Badge color="slate">{s.status}</Badge>
                    </div>
                  }
                />
                <CardBody className="space-y-3">
                  <ApprovalWorkflow
                    approvals={s.approvals}
                    status={s.status as any}
                    onSubmit={async (decision, comment, approver) => {
                      await submitScenarioApprovalAction(id, deal.revision, s.id, decision, comment, approver);
                    }}
                  />
                  {s.approvalExceptions.length > 0 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                      <p className="mb-2 text-xs font-semibold text-amber-900">⚠️ Approval exceptions</p>
                      <ul className="space-y-1">
                        {s.approvalExceptions.map((e, i) => (
                          <li key={i} className="text-xs text-amber-800">• {e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                    {twin.savedCommercialScenarioId !== s.id && (
                      <form action={setBaselineAction.bind(null, id, deal.revision, s.id)}>
                        <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          Set as baseline
                        </button>
                      </form>
                    )}
                    <form action={deleteScenarioAction.bind(null, id, deal.revision, s.id)}>
                      <button type="submit" className="text-xs text-slate-400 hover:text-rose-600">Delete</button>
                    </form>
                  </div>
                </CardBody>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
