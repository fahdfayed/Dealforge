import Link from "next/link";
import { listDeals } from "@/lib/deal-repo";
import {
  weightedPipelineValue,
  weakDiscoveryDeals,
  unpricedPromiseDeals,
  commerciallyUnsafeDeals,
  playbookMix,
  leadershipExceptions,
} from "@/lib/portfolio";
import { discoveryCoverage } from "@/lib/scoring";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatTile } from "@/components/ui/meter";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const deals = await listDeals();
  const weighted = weightedPipelineValue(deals);
  const weakDiscovery = weakDiscoveryDeals(deals);
  const unpriced = unpricedPromiseDeals(deals);
  const unsafe = commerciallyUnsafeDeals(deals);
  const mix = playbookMix(deals);
  const exceptions = leadershipExceptions(deals);

  return (
    <div>
      <PageHeader title="Portfolio" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Deals" value={String(deals.length)} />
        <StatTile label="Weighted value" value={formatCurrency(weighted)} />
        <StatTile label="Weak discovery" value={String(weakDiscovery.length)} />
        <StatTile label="Leadership exceptions" value={String(exceptions.length)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Weak discovery" />
          <CardBody className="space-y-2">
            {weakDiscovery.length === 0 && <p className="text-sm text-slate-500">None.</p>}
            {weakDiscovery.map((d) => (
              <Link key={d.id} href={`/deals/${d.id}/understand`} className="block rounded-md border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50">
                {d.twin.identity.company} — {discoveryCoverage(d.twin).pct}%
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Unpriced promises" />
          <CardBody className="space-y-2">
            {unpriced.length === 0 && <p className="text-sm text-slate-500">None.</p>}
            {unpriced.map(({ deal, count }) => (
              <Link key={deal.id} href={`/deals/${deal.id}/commitments`} className="block rounded-md border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50">
                {deal.twin.identity.company} — {count} unresolved
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Commercially unsafe deals" />
          <CardBody className="space-y-2">
            {unsafe.length === 0 && <p className="text-sm text-slate-500">None.</p>}
            {unsafe.map((d) => (
              <Link key={d.id} href={`/deals/${d.id}/health`} className="block rounded-md border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50">
                {d.twin.identity.company}
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Active playbook mix" />
          <CardBody className="space-y-2">
            {mix.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
            {mix.map((m) => (
              <div key={m.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{m.label}</span>
                <Badge color="slate">{m.count}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Leadership exceptions" />
          <CardBody className="space-y-2">
            {exceptions.length === 0 && <p className="text-sm text-slate-500">None.</p>}
            {exceptions.map((e, i) => (
              <Link key={i} href={`/deals/${e.deal.id}/estimate`} className="block rounded-md border border-rose-100 bg-rose-50/40 px-3 py-2 text-sm hover:bg-rose-50">
                {e.deal.twin.identity.company} — {e.label}
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, notation: n >= 1_000_000 ? "compact" : "standard" }).format(n);
}
