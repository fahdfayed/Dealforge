import { notFound } from "next/navigation";
import Link from "next/link";
import { getDeal } from "@/lib/deal-repo";
import { computeProbability, computeDimensions } from "@/lib/scoring";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export default async function DealHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const { twin } = deal;
  const prob = computeProbability(twin);
  const dims = computeDimensions(twin);

  // Estimate key events based on current state
  const events: Array<{ type: string; label: string; time: Date }> = [
    { type: "created", label: "Deal created", time: new Date(deal.createdAt) },
  ];

  // Add stage-related events based on current stage
  if (twin.identity.stage !== "New") {
    events.push({
      type: "stage-changed",
      label: `Stage: ${twin.identity.stage}`,
      time: new Date(deal.updatedAt),
    });
  }

  if (twin.solution.components.length > 0) {
    events.push({
      type: "solution-started",
      label: `Solution path: ${twin.solution.selectedPath || "undecided"}`,
      time: new Date(deal.updatedAt),
    });
  }

  if (twin.savedCommercialScenarioId) {
    events.push({
      type: "commercial-saved",
      label: "Commercial scenario saved",
      time: new Date(deal.updatedAt),
    });
  }

  if (twin.proposals.length > 0) {
    events.push({
      type: "proposal-generated",
      label: `${twin.proposals.length} proposal(s) generated`,
      time: new Date(deal.updatedAt),
    });
  }

  if (twin.scopeHandshake.length > 0) {
    const completed = twin.scopeHandshake.filter((s) => s.response === "Confirmed").length;
    events.push({
      type: "handshake-started",
      label: `Scope Handshake: ${completed}/${twin.scopeHandshake.length} confirmed`,
      time: new Date(deal.updatedAt),
    });
  }

  if (twin.identity.stage === "Won") {
    events.push({
      type: "won",
      label: "Deal won",
      time: new Date(deal.updatedAt),
    });
  }

  events.push({ type: "last-updated", label: "Last updated", time: new Date(deal.updatedAt) });

  // Server component render: safe to compute current time at render
  // eslint-disable-next-line react-hooks/purity
  const dealAgeDays = Math.round((Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const eventsByType: Record<string, string> = {
    created: "✓ Created",
    "stage-changed": "→ Stage changed",
    "solution-started": "◆ Solution shaping started",
    "commercial-saved": "$ Commercial baseline saved",
    "proposal-generated": "📄 Proposal generated",
    "handshake-started": "🤝 Scope Handshake started",
    won: "🏆 Won",
    "last-updated": "⟳ Last updated",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader title="Deal history" subtitle="Revision timeline and key milestones" />
        <CardBody>
          <div className="space-y-6">
            {/* Revision info */}
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Revision</p>
                  <p className="mt-1 font-semibold text-slate-900">{deal.revision}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="mt-1 font-medium text-slate-700">{new Date(deal.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last updated</p>
                  <p className="mt-1 font-medium text-slate-700">{new Date(deal.updatedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Age</p>
                  <p className="mt-1 font-medium text-slate-700">{dealAgeDays} days</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-4">
                {events.map((event, i) => (
                  <div key={i} className="relative pl-12">
                    <div className="absolute left-0 top-1 h-9 w-9 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center text-xs text-indigo-600 font-semibold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{eventsByType[event.type] || event.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{event.time.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current state snapshot */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Current state snapshot</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Win position</p>
                  <p className="mt-1 font-semibold text-slate-800">{prob.likely}% (range: {prob.low}–{prob.high}%)</p>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Stage</p>
                  <p className="mt-1 font-semibold text-slate-800">{twin.identity.stage}</p>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Questions answered</p>
                  <p className="mt-1 font-semibold text-slate-800">{twin.answers.filter((a) => a.authority !== "Unknown").length}</p>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Scope score</p>
                  <p className="mt-1 font-semibold text-slate-800">{Math.round(dims.scope)}/100</p>
                </div>
                <div className="col-span-2 rounded bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Commercial scenario</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {twin.savedCommercialScenarioId
                      ? twin.commercialScenarios.find((s) => s.id === twin.savedCommercialScenarioId)?.name || "Unsaved"
                      : "No baseline saved"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Link href={`/deals/${id}`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Back to deal
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
