import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { DEFAULT_COMMERCIAL_INPUTS } from "@/lib/commercial";
import { CommercialEstimator } from "@/components/commercial-estimator";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConflictBanner } from "@/components/conflict-banner";
import { saveScenarioAction, setBaselineAction, deleteScenarioAction } from "./actions";

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

      <Card>
        <CardHeader title="Scenario comparison and saved baselines" />
        <CardBody className="space-y-2">
          {twin.commercialScenarios.length === 0 ? (
            <p className="text-sm text-slate-500">No scenarios saved yet.</p>
          ) : (
            twin.commercialScenarios
              .slice()
              .reverse()
              .map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {s.name} {twin.savedCommercialScenarioId === s.id && <Badge color="emerald">Baseline</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {s.adjustedEffortDays}d · {new Intl.NumberFormat("en-US", { style: "currency", currency: twin.commercialHeadline.currency, maximumFractionDigits: 0 }).format(s.customerPrice)} · margin {s.grossMarginPct}%
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                </div>
              ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
