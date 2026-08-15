"use client";

import { useMemo, useState, useTransition } from "react";
import {
  computeEstimate,
  WORKSTREAM_SPLIT,
  ROLE_SPLIT,
  type EstimateInputs,
  type MultiplierSelection,
} from "@/lib/estimate";
import { COMPLEXITY_MULTIPLIERS } from "@/lib/domain";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatTile } from "@/components/ui/meter";

const NUMERIC_FIELDS: { key: keyof EstimateInputs; label: string }[] = [
  { key: "entities", label: "Legal entities" },
  { key: "countries", label: "Countries" },
  { key: "modules", label: "Modules in scope" },
  { key: "businessUnits", label: "Business units" },
  { key: "users", label: "Users" },
  { key: "integrations", label: "Integrations" },
  { key: "reports", label: "Reports" },
  { key: "dataObjects", label: "Data objects" },
  { key: "workflows", label: "Workflows" },
  { key: "testingCycles", label: "Testing cycles" },
  { key: "trainingPopulations", label: "Training populations" },
];

export function EstimatorLab({
  opportunityId,
  initialInputs,
  initialMultipliers,
  initialDayRate,
  initialInternalCostPerDay,
  initialContingencyPct,
  onSave,
}: {
  opportunityId: string;
  initialInputs: EstimateInputs;
  initialMultipliers: MultiplierSelection;
  initialDayRate: number;
  initialInternalCostPerDay: number;
  initialContingencyPct: number;
  onSave: (
    opportunityId: string,
    inputs: EstimateInputs,
    multipliers: MultiplierSelection,
    dayRate: number,
    internalCostPerDay: number,
    contingencyPct: number
  ) => Promise<unknown>;
}) {
  const [inputs, setInputs] = useState(initialInputs);
  const [multipliers, setMultipliers] = useState(initialMultipliers);
  const [dayRate, setDayRate] = useState(initialDayRate);
  const [internalCostPerDay, setInternalCostPerDay] = useState(initialInternalCostPerDay);
  const [contingencyPct, setContingencyPct] = useState(initialContingencyPct);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const result = useMemo(
    () => computeEstimate(inputs, multipliers, dayRate, internalCostPerDay, contingencyPct),
    [inputs, multipliers, dayRate, internalCostPerDay, contingencyPct]
  );

  function setField(key: keyof EstimateInputs, value: number) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      await onSave(opportunityId, inputs, multipliers, dayRate, internalCostPerDay, contingencyPct);
      setSavedAt(new Date().toLocaleTimeString());
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader title="Estimation inputs" subtitle="Adjust and watch the impact live." />
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {NUMERIC_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-slate-500">{f.label}</label>
                <input
                  type="number"
                  min={0}
                  value={inputs[f.key] as number}
                  onChange={(e) => setField(f.key, Number(e.target.value))}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">On-site share (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={inputs.onSitePct}
                onChange={(e) => setField("onSitePct", Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Documentation quality</label>
              <select
                value={inputs.documentationQuality}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    documentationQuality: e.target.value as EstimateInputs["documentationQuality"],
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              >
                <option>Good</option>
                <option>Average</option>
                <option>Poor</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Governance complexity</label>
              <select
                value={inputs.governanceComplexity}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    governanceComplexity: e.target.value as EstimateInputs["governanceComplexity"],
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Complexity multipliers" subtitle="What breaks the budget?" />
          <CardBody className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {COMPLEXITY_MULTIPLIERS.map((m) => (
              <label
                key={m.key}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!multipliers[m.key]}
                    onChange={(e) =>
                      setMultipliers((prev) => ({ ...prev, [m.key]: e.target.checked }))
                    }
                    className="rounded border-slate-300"
                  />
                  {m.label}
                </span>
                <span className="text-xs text-slate-400">+{Math.round(m.factor * 100)}%</span>
              </label>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Commercial parameters" />
          <CardBody className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Day rate (customer)</label>
              <input
                type="number"
                value={dayRate}
                onChange={(e) => setDayRate(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Internal cost/day</label>
              <input
                type="number"
                value={internalCostPerDay}
                onChange={(e) => setInternalCostPerDay(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Contingency (%)</label>
              <input
                type="number"
                value={contingencyPct}
                onChange={(e) => setContingencyPct(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader title="Effort by workstream" />
            <CardBody className="space-y-2">
              {WORKSTREAM_SPLIT.map((w) => (
                <div key={w.name} className="flex justify-between text-sm text-slate-600">
                  <span>{w.name}</span>
                  <span className="font-medium text-slate-800">
                    {Math.round(result.p50Days * w.share)} days
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Effort by role" />
            <CardBody className="space-y-2">
              {ROLE_SPLIT.map((r) => (
                <div key={r.name} className="flex justify-between text-sm text-slate-600">
                  <span>{r.name}</span>
                  <span className="font-medium text-slate-800">
                    {Math.round(result.p50Days * r.share)} days
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="sticky top-6">
          <CardHeader title="Result" subtitle="Updates live as you change inputs." />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <StatTile label="P50 — most likely" value={`${result.p50Days} days`} />
              <StatTile label="P80 — safer commercial position" value={`${result.p80Days} days`} />
              <StatTile label="Maximum exposure" value={`${result.maxDays} days`} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <StatTile label="Internal cost" value={formatCurrency(result.internalCost)} />
              <StatTile label="Customer price" value={formatCurrency(result.customerPrice)} />
              <StatTile
                label="Gross margin"
                value={`${result.grossMargin}%`}
                hint={result.grossMargin < 20 ? "Below typical 20% floor" : undefined}
              />
            </div>
            <button
              onClick={save}
              disabled={isPending}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save estimate"}
            </button>
            {savedAt && <p className="text-center text-xs text-slate-400">Saved at {savedAt}</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
