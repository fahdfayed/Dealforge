"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { DEAL_ITEM_STATUS_META, type DealItemStatusKey } from "@/lib/domain";

export function DealItemRow({
  item,
  opportunityId,
  onUpdateStatus,
}: {
  item: {
    id: string;
    label: string;
    value: string;
    status: string;
    source: string;
  };
  opportunityId: string;
  onUpdateStatus: (
    opportunityId: string,
    itemId: string,
    status: DealItemStatusKey
  ) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const meta = DEAL_ITEM_STATUS_META[item.status as DealItemStatusKey];

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-slate-100 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{item.label}</p>
        <p className="text-sm text-slate-600">{item.value}</p>
        {item.source && <p className="mt-0.5 text-xs text-slate-400">Source: {item.source}</p>}
      </div>
      <div className="flex items-center gap-2">
        <select
          defaultValue={item.status}
          disabled={isPending}
          onChange={(e) => {
            const status = e.target.value as DealItemStatusKey;
            startTransition(() => {
              onUpdateStatus(opportunityId, item.id, status);
            });
          }}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        >
          {Object.entries(DEAL_ITEM_STATUS_META).map(([key, m]) => (
            <option key={key} value={key}>
              {m.label}
            </option>
          ))}
        </select>
        <Badge color={meta?.color}>{meta?.label ?? item.status}</Badge>
      </div>
    </div>
  );
}
