import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EstimatorLab } from "@/components/estimator-lab";
import { DEFAULT_ESTIMATE_INPUTS, type EstimateInputs } from "@/lib/estimate";
import { saveEstimate } from "./actions";

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { estimate: true },
  });
  if (!opportunity) notFound();

  const moduleCount = opportunity.modules.split(",").filter(Boolean).length || 1;
  const countryCount = opportunity.countries.split(",").filter(Boolean).length || 1;

  const initialInputs: EstimateInputs = opportunity.estimate
    ? JSON.parse(opportunity.estimate.inputs)
    : { ...DEFAULT_ESTIMATE_INPUTS, modules: moduleCount, countries: countryCount };

  const initialMultipliers = opportunity.estimate
    ? JSON.parse(opportunity.estimate.multipliers)
    : {};

  return (
    <EstimatorLab
      opportunityId={opportunity.id}
      initialInputs={initialInputs}
      initialMultipliers={initialMultipliers}
      initialDayRate={opportunity.estimate?.dayRate ?? 1200}
      initialInternalCostPerDay={opportunity.estimate?.internalCostPerDay ?? 650}
      initialContingencyPct={opportunity.estimate?.contingencyPct ?? 10}
      onSave={saveEstimate}
    />
  );
}
