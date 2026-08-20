import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { listDeals } from "@/lib/deal-repo";
import { decisionQueue, answerGraphHealth } from "@/lib/today";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatTile } from "@/components/ui/meter";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const SEVERITY_COLOR: Record<string, string> = { critical: "rose", high: "amber", medium: "sky" };

export default async function TodayPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const deals = await listDeals();
  const queue = decisionQueue(deals, 8);
  const health = answerGraphHealth(deals);
  const oneMove = queue[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Today" />

      {oneMove ? (
        <Card>
          <CardHeader title="One clear move" action={<Badge color={SEVERITY_COLOR[oneMove.action.severity]}>{oneMove.action.severity}</Badge>} />
          <CardBody>
            <p className="text-sm font-medium text-slate-800">{oneMove.action.label}</p>
            <p className="mt-1 text-xs text-slate-500">{oneMove.deal.twin.identity.company}</p>
            <Link href={`/deals/${oneMove.deal.id}`} className="mt-3 inline-block text-sm text-indigo-600 hover:text-indigo-700">
              Go to deal →
            </Link>
          </CardBody>
        </Card>
      ) : (
        <Card className="p-8 text-center text-sm text-slate-500">No open deals need attention right now.</Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Open deals" value={String(deals.filter((d) => !["Won", "Nurture"].includes(d.twin.identity.stage)).length)} />
        <StatTile label="Answer Graph avg coverage" value={`${health.avgCoveragePct}%`} />
        <StatTile label="Deals below 50% coverage" value={String(health.dealsBelow50)} />
        <StatTile label="Active deals" value={String(health.activeDeals)} />
      </div>

      <Card>
        <CardHeader title="Decision queue" />
        <CardBody className="space-y-2">
          {queue.length === 0 && <p className="text-sm text-slate-500">Nothing queued.</p>}
          {queue.map(({ deal, action }, i) => (
            <Link key={`${deal.id}-${action.id}-${i}`} href={`/deals/${deal.id}`} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2.5 text-sm hover:bg-slate-50">
              <span>
                <span className="font-medium text-slate-800">{deal.twin.identity.company}</span>{" "}
                <span className="text-slate-500">— {action.label}</span>
              </span>
              <Badge color={SEVERITY_COLOR[action.severity]}>{action.severity}</Badge>
            </Link>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
