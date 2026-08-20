import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { computeProbability, getSafetyMode, computeDimensions } from "@/lib/scoring";
import { Badge } from "@/components/ui/badge";
import { DealStageNav } from "@/components/deal-stage-nav";
import { lensesFor, stagesFor } from "@/lib/relevance";

export default async function DealLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const probability = computeProbability(deal.twin);
  const dims = computeDimensions(deal.twin);
  const safety = getSafetyMode(deal.twin, probability, dims);
  const stages = stagesFor(deal.twin);
  const lenses = lensesFor(deal.twin);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{deal.twin.identity.company}</p>
            <h1 className="mt-0.5 text-xl font-semibold text-slate-900">
              {deal.twin.identity.engagementTitle || "Untitled engagement"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge color="violet">{deal.twin.identity.stage}</Badge>
            <Badge color="sky">{safety.label}</Badge>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          <span>
            Win position: <strong className="text-slate-700">{probability.low}% / {probability.likely}% / {probability.high}%</strong>
          </span>
          <span>
            Cap: <strong className="text-slate-700">{probability.cap}%</strong>
          </span>
          <span>
            Revision: <strong className="text-slate-700">{deal.revision}</strong>
          </span>
          {deal.twin.dealDNA.countries.length > 0 && (
            <span>
              Countries: <strong className="text-slate-700">{deal.twin.dealDNA.countries.join(", ")}</strong>
            </span>
          )}
        </div>
      </div>

      <DealStageNav dealId={deal.id} stages={stages} lenses={lenses} />

      {children}
    </div>
  );
}
