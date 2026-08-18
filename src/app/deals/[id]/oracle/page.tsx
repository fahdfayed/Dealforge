import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { computeDimensions } from "@/lib/scoring";
import { allianceHealth, generateOracleRationale } from "@/lib/oracle";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OracleBriefPdfButton } from "@/components/pdf-buttons";
import { ActionButton } from "@/components/button-group";
import { Input } from "@/components/form-input";
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
                  <ActionButton
                    type="submit"
                    variant={a.status === "Completed" ? "primary" : "secondary"}
                    size="sm"
                  >
                    {a.status === "Completed" ? "Done" : "Complete"}
                  </ActionButton>
                </form>
              </div>
            ))}
            <form action={addAllianceActionAction.bind(null, id, rev)} className="space-y-2">
              <Input name="action" label="Action" required placeholder="What needs to happen?" />
              <div className="grid grid-cols-2 gap-2">
                <Input name="owner" label="Owner" placeholder="Who?" />
                <Input name="dueWindow" label="Due" placeholder="YYYY-MM-DD" />
              </div>
              <ActionButton type="submit" variant="primary" className="w-full">
                Add
              </ActionButton>
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
