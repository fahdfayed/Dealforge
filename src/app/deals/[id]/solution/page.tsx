import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { compareOptions, scopeConfidence, deliveryRisk, totalAdjustedEffort } from "@/lib/solution-forge";
import { AUTHORITIES, DELIVERY_MODELS, PRIORITIES } from "@/types/deal-twin";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConflictBanner } from "@/components/conflict-banner";
import { ActionButton } from "@/components/button-group";
import { Input, Textarea, Select } from "@/components/form-input";
import {
  updateObjectiveAction,
  updateComponentAction,
  addCustomComponentAction,
  removeComponentAction,
  addDependencyAction,
  updateDependencyStatusAction,
  addBoundaryAction,
  removeBoundaryAction,
} from "./actions";

const LEVER_FIELDS = [
  { name: "investmentFlexibility", label: "Investment flexibility" },
  { name: "speedPressure", label: "Speed pressure" },
  { name: "changeCapacity", label: "Change capacity" },
  { name: "scopeCertainty", label: "Scope certainty" },
  { name: "transformationAmbition", label: "Transformation ambition" },
];

export default async function DetailedSolutionPage({
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

  const options = compareOptions(twin);
  const confidence = scopeConfidence(twin);
  const risk = deliveryRisk(twin);
  const totalEffort = Math.round(totalAdjustedEffort(twin) * 10) / 10;

  const rev = deal.revision;

  return (
    <div className="space-y-6">
      <ConflictBanner show={conflict === "1"} />

      <Card>
        <CardHeader title="Objective and design levers" />
        <CardBody>
          <form action={updateObjectiveAction.bind(null, id, rev)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input name="solutionTitle" label="Solution title (client-facing)" defaultValue={twin.solution.clientLanguage.solutionTitle} />
              <Select name="deliveryModel" label="Delivery model" defaultValue={twin.solution.deliveryModel}>
                {DELIVERY_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </div>
            <Textarea name="objective" label="Objective" defaultValue={twin.solution.objective} rows={2} />
            <Textarea name="decisionAsk" label="Decision ask" defaultValue={twin.solution.clientLanguage.decisionAsk} rows={2} />
            <div className="grid grid-cols-5 gap-3">
              {LEVER_FIELDS.map((f) => (
                <Select key={f.name} name={f.name} label={f.label} defaultValue={(twin.solution.designLevers as unknown as Record<string, number>)[f.name]} className="text-xs">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </Select>
              ))}
            </div>
            <ActionButton type="submit" variant="primary">
              Save
            </ActionButton>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Solution metrics" subtitle={`Adjusted effort: ${totalEffort} days`} />
        <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Scope confidence" value={confidence} />
          <Metric label="Delivery risk" value={risk} />
          <Metric label="Open dependencies" value={twin.solution.dependencies.filter((d) => d.status === "Open").length} raw />
          <Metric label="Included capabilities" value={twin.solution.components.filter((c) => c.included).length} raw />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Capabilities" />
        <CardBody className="space-y-3">
          {twin.solution.components.map((c) => (
            <form key={c.id} action={updateComponentAction.bind(null, id, rev, c.id)} className="rounded-md border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input type="checkbox" name="included" defaultChecked={c.included} className="rounded border-slate-300" />
                  {c.label} <span className="text-xs font-normal text-slate-400">({c.category})</span>
                </label>
                {c.custom && <Badge color="violet">Custom</Badge>}
              </div>
              <p className="mt-1 text-xs text-slate-500">{c.outcome}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
                <MiniSelect name="priority" defaultValue={c.priority} options={[...PRIORITIES]} />
                <MiniNum name="phase" defaultValue={c.phase} label="Phase" />
                <MiniNum name="effortDays" defaultValue={c.effortDays} label="Days" />
                <MiniNum name="confidence" defaultValue={c.confidence} label="Confidence" />
                <MiniSelect name="authority" defaultValue={c.authority} options={[...AUTHORITIES]} />
                <MiniSelect name="risk" defaultValue={c.risk} options={["Low", "Medium", "High"]} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <ActionButton type="submit" variant="primary" size="sm">
                  Save
                </ActionButton>
                {c.custom && (
                  <ActionButton
                    formAction={removeComponentAction.bind(null, id, rev, c.id)}
                    variant="danger"
                    size="sm"
                  >
                    Remove
                  </ActionButton>
                )}
              </div>
            </form>
          ))}

          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Add custom capability</p>
            <form action={addCustomComponentAction.bind(null, id, rev)} className="space-y-2">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Input name="category" placeholder="Category" />
                <Input name="label" placeholder="Label" required />
                <Input name="outcome" placeholder="Outcome" />
                <Input name="effortDays" type="number" placeholder="Days" defaultValue={5} />
              </div>
              <ActionButton type="submit" variant="primary" className="w-full">
                Add capability
              </ActionButton>
            </form>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Dependencies" />
        <CardBody className="space-y-3">
          {twin.solution.dependencies.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2">
              <div>
                <p className="text-sm text-slate-800">{d.description}</p>
                <p className="text-xs text-slate-400">{d.classification}</p>
              </div>
              <div className="flex gap-1">
                {(["Open", "Resolved", "Retained"] as const).map((s) => (
                  <form key={s} action={updateDependencyStatusAction.bind(null, id, rev, d.id, s)}>
                    <ActionButton
                      type="submit"
                      variant={d.status === s ? "primary" : "secondary"}
                      size="sm"
                    >
                      {s}
                    </ActionButton>
                  </form>
                ))}
              </div>
            </div>
          ))}
          <form action={addDependencyAction.bind(null, id, rev)} className="flex gap-2">
            <Input name="description" placeholder="Dependency description" required className="flex-1" />
            <Select name="classification">
              <option>Critical path</option>
              <option>Cross-workstream</option>
            </Select>
            <ActionButton type="submit" variant="primary" size="sm">
              Add
            </ActionButton>
          </form>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <BoundaryCard title="Exclusions" kind="exclusions" items={twin.solution.exclusions} dealId={id} revision={rev} />
        <BoundaryCard title="Client responsibilities" kind="responsibilities" items={twin.solution.responsibilities} dealId={id} revision={rev} />
      </div>

      <Card>
        <CardHeader title="Options comparison" />
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="py-1">Path</th>
                <th>Capabilities</th>
                <th>Effort</th>
                <th>Confidence</th>
                <th>Risk</th>
                <th>Value coverage</th>
              </tr>
            </thead>
            <tbody>
              {options.map((o) => (
                <tr key={o.path} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-800">{o.path}</td>
                  <td>{o.componentCount}</td>
                  <td>{o.effortDays}d</td>
                  <td>{o.scopeConfidence}</td>
                  <td>{o.deliveryRisk}</td>
                  <td>{o.valueCoverage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function Metric({ label, value, raw }: { label: string; value: number; raw?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-800">{raw ? value : `${value}/100`}</p>
    </div>
  );
}

function MiniSelect({ name, defaultValue, options }: { name: string; defaultValue: string; options: string[] }) {
  return (
    <select name={name} defaultValue={defaultValue} className="rounded-md border border-slate-300 px-1.5 py-1 text-xs">
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function MiniNum({ name, defaultValue, label }: { name: string; defaultValue: number; label: string }) {
  return (
    <input type="number" name={name} defaultValue={defaultValue} title={label} placeholder={label} className="rounded-md border border-slate-300 px-1.5 py-1 text-xs" />
  );
}

function BoundaryCard({
  title,
  kind,
  items,
  dealId,
  revision,
}: {
  title: string;
  kind: "exclusions" | "responsibilities";
  items: string[];
  dealId: string;
  revision: number;
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2 text-sm">
            <span>{item}</span>
            <form action={removeBoundaryAction.bind(null, dealId, revision, kind, i)}>
              <ActionButton type="submit" variant="ghost" size="sm">
                Remove
              </ActionButton>
            </form>
          </div>
        ))}
        <form action={addBoundaryAction.bind(null, dealId, revision, kind)} className="flex gap-2">
          <Input name="text" required placeholder={`Add ${title.toLowerCase()}`} className="flex-1" />
          <ActionButton type="submit" variant="primary" size="sm">
            Add
          </ActionButton>
        </form>
      </CardBody>
    </Card>
  );
}
