import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function OpportunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({ where: { id } });
  if (!opportunity) notFound();

  return (
    <div>
      <div className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {opportunity.client}
            </p>
            <h1 className="mt-0.5 text-xl font-semibold text-slate-900">
              {opportunity.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge color="violet">{opportunity.stage}</Badge>
            <Badge color="sky">{opportunity.dealType}</Badge>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          <span>Probability: <strong className="text-slate-700">{opportunity.probability}%</strong></span>
          <span>Momentum: <strong className="text-slate-700">{opportunity.momentum}</strong></span>
          {opportunity.countries && <span>Countries: <strong className="text-slate-700">{opportunity.countries}</strong></span>}
          <span>Oracle registration: <strong className="text-slate-700">{opportunity.oracleRegistrationStatus}</strong></span>
        </div>
      </div>
      {children}
    </div>
  );
}
