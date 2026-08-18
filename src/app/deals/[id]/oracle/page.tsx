import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { computeDimensions } from "@/lib/scoring";
import { allianceHealth, generateOracleRationale } from "@/lib/oracle";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OracleBriefPdfButton } from "@/components/pdf-buttons";
import { addAllianceActionAction, toggleAllianceActionAction } from "./actions";

export default async function OracleCoordinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();
  const { twin } = deal;
  const rev = deal.revision;

  const dims = computeDimensions(twin);
  const health = allianceHealth(dims.oracle, twin.allianceActions);
  const rationale = generateOracleRationale(twin);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader title="Alliance health" action={<Badge color={health.score >= 50 ? "emerald" : "amber"}>{health.label}</Badge>} />
          <CardBody>
            <p className="text-2xl font-semibold text-slate-800">{health.score}/100</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Joint actions" />
          <CardBody className="space-y-2">
            {twin.allianceActions.length === 0 && <p className="text-sm text-slate-500">No joint actions recorded.</p>}
            {twin.allianceActions.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2">
                <div>
                  <p className="text-sm text-slate-800">{a.action}</p>
                  <p className="text-xs text-slate-400">Owner: {a.owner || "unassigned"} · Due: {a.dueWindow || "—"}</p>
                </div>
                <form action={toggleAllianceActionAction.bind(null, id, rev, a.id)}>
                  <button
                    type="submit"
                    className={`rounded-md px-2 py-1 text-xs font-medium ${a.status === "Completed" ? "bg-emerald-600 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {a.status === "Completed" ? "Complete" : "Mark complete"}
                  </button>
                </form>
              </div>
            ))}
            <form action={addAllianceActionAction.bind(null, id, rev)} className="grid grid-cols-3 gap-2">
              <input name="action" placeholder="Action" required className="col-span-3 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm sm:col-span-1" />
              <input name="owner" placeholder="Owner" className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
              <input name="dueWindow" placeholder="Due window" className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
              <button type="submit" className="col-span-3 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 sm:col-span-1">
                Add
              </button>
            </form>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Internal rationale for Oracle support" />
          <CardBody>
            {rationale.split("\n").map((line, i) => (
              <p key={i} className="text-xs text-slate-600">{line}</p>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <OracleBriefPdfButton deal={deal} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
