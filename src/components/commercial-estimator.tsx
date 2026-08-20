"use client";

import { useMemo, useState, useTransition } from "react";
import { computeCommercialScenario, DEFAULT_COMMERCIAL_INPUTS } from "@/lib/commercial";
import type { CommercialScenarioInputs } from "@/types/deal-twin";
import { PAYMENT_STRUCTURES } from "@/types/deal-twin";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatTile } from "@/components/ui/meter";

export function CommercialEstimator({
  dealId,
  initialInputs,
  onSave,
}: {
  dealId: string;
  initialInputs: CommercialScenarioInputs;
  onSave: (dealId: string, name: string, inputs: CommercialScenarioInputs) => Promise<void>;
}) {
  const [inputs, setInputs] = useState<CommercialScenarioInputs>(initialInputs);
  const [name, setName] = useState(`Scenario — ${new Date().toLocaleDateString()}`);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const result = useMemo(() => computeCommercialScenario(name || "Scenario", inputs), [inputs, name]);

  function setField<K extends keyof CommercialScenarioInputs>(key: K, value: CommercialScenarioInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function addDriver() {
    setInputs((prev) => ({ ...prev, contextDrivers: [...prev.contextDrivers, { label: "", effortDays: 0 }] }));
  }

  function save() {
    startTransition(async () => {
      await onSave(dealId, name, inputs);
      setSavedAt(new Date().toLocaleTimeString());
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader title="Core inputs" />
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <NumField label="Base effort (days)" value={inputs.baseEffortDays} onChange={(v) => setField("baseEffortDays", v)} />
            <NumField label="Entities / operating units" value={inputs.entities} onChange={(v) => setField("entities", v)} />
            <NumField label="Countries" value={inputs.countries} onChange={(v) => setField("countries", v)} />
            <NumField label="Interfaces / touchpoints" value={inputs.interfaces} onChange={(v) => setField("interfaces", v)} />
            <NumField label="Formal validation cycles" value={inputs.validationCycles} onChange={(v) => setField("validationCycles", v)} />
            <NumField label="On-site %" value={inputs.onSitePct} onChange={(v) => setField("onSitePct", v)} />
            <NumField label="Contingency %" value={inputs.contingencyPct} onChange={(v) => setField("contingencyPct", v)} />
            <NumField label="Discount %" value={inputs.discountPct} onChange={(v) => setField("discountPct", v)} />
            <NumField label="Internal daily cost" value={inputs.internalDailyCost} onChange={(v) => setField("internalDailyCost", v)} />
            <NumField label="Customer daily rate" value={inputs.customerDailyRate} onChange={(v) => setField("customerDailyRate", v)} />
            <NumField label="Travel per on-site day" value={inputs.travelPerOnSiteDay} onChange={(v) => setField("travelPerOnSiteDay", v)} />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Payment structure</label>
              <select
                value={inputs.paymentStructure}
                onChange={(e) => setField("paymentStructure", e.target.value as CommercialScenarioInputs["paymentStructure"])}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              >
                {PAYMENT_STRUCTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Context-specific drivers" />
          <CardBody className="space-y-2">
            {inputs.contextDrivers.map((d, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={d.label}
                  onChange={(e) => {
                    const next = [...inputs.contextDrivers];
                    next[i] = { ...next[i], label: e.target.value };
                    setField("contextDrivers", next);
                  }}
                  placeholder="Driver label"
                  className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
                />
                <input
                  type="number"
                  value={d.effortDays}
                  onChange={(e) => {
                    const next = [...inputs.contextDrivers];
                    next[i] = { ...next[i], effortDays: Number(e.target.value) };
                    setField("contextDrivers", next);
                  }}
                  placeholder="Days"
                  className="w-24 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setField("contextDrivers", inputs.contextDrivers.filter((_, idx) => idx !== i))}
                  className="text-xs text-slate-400 hover:text-rose-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addDriver} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Add driver
            </button>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="sticky top-6">
          <CardHeader title="Result" />
          <CardBody className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Scenario name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
            </div>
            <StatTile label="Adjusted effort" value={`${result.adjustedEffortDays} days`} />
            <StatTile label="P50 / P80 days" value={`${result.p50Days} / ${result.p80Days}`} />
            <StatTile label="Internal cost" value={formatCurrency(result.internalCost)} />
            <StatTile label="Travel exposure" value={formatCurrency(result.travelExposure)} />
            <StatTile label="Customer price" value={formatCurrency(result.customerPrice)} />
            <StatTile label="Gross margin" value={`${result.grossMarginPct}%`} />
            {result.approvalExceptions.length > 0 && (
              <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {result.approvalExceptions.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            )}
            <button
              onClick={save}
              disabled={isPending}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save scenario as baseline"}
            </button>
            {savedAt && <p className="text-center text-xs text-slate-400">Saved at {savedAt}</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
    </div>
  );
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export { DEFAULT_COMMERCIAL_INPUTS };
