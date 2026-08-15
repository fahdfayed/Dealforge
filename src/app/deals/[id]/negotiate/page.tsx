import { notFound } from "next/navigation";
import Link from "next/link";
import { getDeal } from "@/lib/deal-repo";
import { NegotiationPanel } from "@/components/negotiation-panel";
import { Card } from "@/components/ui/card";
import { applyNegotiatedScenarioAction } from "./actions";

export default async function NegotiatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();
  const { twin } = deal;

  const baseline = twin.commercialScenarios.find((s) => s.id === twin.savedCommercialScenarioId);
  if (!baseline) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        No saved commercial baseline yet.{" "}
        <Link href={`/deals/${id}/estimate`} className="text-indigo-600 hover:text-indigo-700">
          Save one in Detailed estimate
        </Link>{" "}
        first.
      </Card>
    );
  }

  const applyAction = async (dealId: string, reductionPct: number, exchanges: string[]) => {
    "use server";
    await applyNegotiatedScenarioAction(dealId, deal.revision, reductionPct, exchanges);
  };

  return <NegotiationPanel dealId={id} baseline={baseline} currency={twin.commercialHeadline.currency} onApply={applyAction} />;
}
