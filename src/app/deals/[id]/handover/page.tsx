import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { evaluateHandoverReadiness, isHandoverUnlocked } from "@/lib/handover";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HandoverPdfButton } from "@/components/pdf-buttons";

export default async function HandoverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  if (!isHandoverUnlocked(deal.twin)) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        Handover unlocks only once this deal reaches the <strong>Won</strong> stage.{" "}
        <Link href={`/deals/${id}`} className="text-indigo-600 hover:text-indigo-700">
          Update the stage on the Deal Twin screen
        </Link>
        .
      </Card>
    );
  }

  const readiness = evaluateHandoverReadiness(deal.twin);
  const allReady = readiness.every((r) => r.ready);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Delivery handover readiness"
          subtitle="Generated from the same Answer Graph, solution, price, boundaries and commitments that shaped the proposal."
          action={<Badge color={allReady ? "emerald" : "amber"}>{allReady ? "Ready" : "Incomplete"}</Badge>}
        />
        <CardBody className="space-y-2">
          {readiness.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2 text-sm">
              <div>
                <p className="text-slate-800">{r.label}</p>
                <p className="text-xs text-slate-400">{r.reason}</p>
              </div>
              <Badge color={r.ready ? "emerald" : "slate"}>{r.ready ? "Ready" : "Not ready"}</Badge>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <HandoverPdfButton deal={deal} />
        </CardBody>
      </Card>
    </div>
  );
}
