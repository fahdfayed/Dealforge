"use client";

import { listDeals } from "@/lib/deal-repo";
import { Card, CardBody } from "@/components/ui/card";

export function DealSelector({
  allDeals,
  selectedIds,
}: {
  allDeals: Awaited<ReturnType<typeof listDeals>>;
  selectedIds: Set<string>;
}) {
  return (
    <Card className="mb-6">
      <CardBody>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Add or remove deals</p>
        <div className="flex flex-wrap gap-2">
          {allDeals.map((deal) => (
            <label key={deal.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
              <input
                type="checkbox"
                defaultChecked={selectedIds.has(deal.id)}
                onChange={(e) => {
                  const newIds = new Set(selectedIds);
                  if (e.target.checked) {
                    newIds.add(deal.id);
                  } else {
                    newIds.delete(deal.id);
                  }
                  const url = new URL(window.location.href);
                  url.searchParams.set("ids", Array.from(newIds).join(","));
                  window.location.href = url.toString();
                }}
                className="rounded"
              />
              {deal.twin.identity.company}
            </label>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
