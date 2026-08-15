"use client";

import { useMemo, useState, useTransition } from "react";
import type { CommercialScenario } from "@/types/deal-twin";
import { computeNegotiationImpact, VALUE_EXCHANGES } from "@/lib/negotiation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatTile } from "@/components/ui/meter";

export function NegotiationPanel({
  dealId,
  baseline,
  currency,
  onApply,
}: {
  dealId: string;
  baseline: CommercialScenario;
  currency: string;
  onApply: (dealId: string, reductionPct: number, exchanges: string[]) => Promise<void>;
}) {
  const [reductionPct, setReductionPct] = useState(10);
  const [exchanges, setExchanges] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const impact = useMemo(() => computeNegotiationImpact(baseline, reductionPct), [baseline, reductionPct]);

  function toggleExchange(x: string) {
    setExchanges((prev) => (prev.includes(x) ? prev.filter((e) => e !== x) : [...prev, x]));
  }

  function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader title="Requested reduction" />
          <CardBody>
            <input
              type="range"
              min={0}
              max={50}
              value={reductionPct}
              onChange={(e) => setReductionPct(Number(e.target.value))}
              className="w-full"
            />
            <p className="mt-1 text-sm font-medium text-slate-700">{reductionPct}% reduction requested</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Reciprocal value exchanges" subtitle="Select what you'd trade for the reduction, rather than discounting without change." />
          <CardBody className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {VALUE_EXCHANGES.map((x) => (
              <label key={x} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <input type="checkbox" checked={exchanges.includes(x)} onChange={() => toggleExchange(x)} className="rounded border-slate-300" />
                {x}
              </label>
            ))}
          </CardBody>
        </Card>
      </div>

      <div>
        <Card className="sticky top-6">
          <CardHeader title="Cash and margin impact" />
          <CardBody className="space-y-3">
            <StatTile label="Current price" value={fmt(impact.currentPrice)} />
            <StatTile label="New price" value={fmt(impact.newPrice)} />
            <StatTile label="Cash impact" value={fmt(-impact.cashImpact)} />
            <StatTile label="Current margin" value={`${impact.currentMarginPct}%`} />
            <StatTile label="New margin" value={`${impact.newMarginPct}%`} hint={impact.newMarginPct < 20 ? "Below 20% floor" : undefined} />
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await onApply(dealId, reductionPct, exchanges);
                })
              }
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {isPending ? "Applying…" : "Apply as new baseline scenario"}
            </button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
