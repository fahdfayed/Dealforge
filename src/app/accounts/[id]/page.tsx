import { requireUser } from "@/lib/identity";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dealSummariesForAccount, getAccount } from "@/lib/account-repo";
import { listIndustries } from "@/lib/industry-pack-repo";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/button-group";
import { Input, Select, Textarea } from "@/components/form-input";
import { updateAccountAction } from "../actions";
import { createDealForAccountAction } from "@/app/deals/actions";
import { CLIENT_TYPES } from "@/types/deal-twin";

export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  // Every authenticated screen goes through the gate. The middleware only
  // redirects when the cookie is absent; it cannot tell a forged one from a
  // real one, so this is where a session is actually verified.
  await requireUser();
  const { id } = await params;
  const [account, industries] = await Promise.all([getAccount(id), listIndustries()]);
  if (!account) notFound();

  const deals = await dealSummariesForAccount(account.id);
  const industry = industries.find((i) => i.id === account.industryId);
  const save = updateAccountAction.bind(null, account.id);
  const newDeal = createDealForAccountAction.bind(null, account.id);

  return (
    <div>
      <PageHeader
        title={account.name}
        action={
          industry ? <Badge color="indigo">{industry.name}</Badge> : <Badge color="amber">No industry set</Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title="Deals"
              subtitle={`${deals.length} for this client`}
              action={
                <form action={newDeal}>
                  <ActionButton type="submit" variant="primary" size="sm">
                    New deal
                  </ActionButton>
                </form>
              }
            />
            <CardBody className="space-y-2">
              {deals.length === 0 && (
                <p className="text-sm text-slate-500">
                  No deals yet. A new deal here starts with {industry ? `${industry.name} ` : ""}questions already
                  active.
                </p>
              )}
              {deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="block rounded-md border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  {deal.company}
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader title="Client details" />
            <CardBody>
              <form action={save} className="space-y-3">
                <Input name="name" label="Client name" required defaultValue={account.name} />
                <Select name="industryId" label="Industry" defaultValue={account.industryId ?? ""}>
                  <option value="">Not set</option>
                  {industries
                    .filter((i) => i.active || i.id === account.industryId)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                </Select>
                <Input
                  name="countries"
                  label="Countries"
                  defaultValue={account.countries.join(", ")}
                  hint="Comma-separated. Inherited by new deals."
                />
                <Select name="clientType" label="Client type" defaultValue={account.clientType ?? ""}>
                  <option value="">Not set</option>
                  {CLIENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <Textarea name="notes" label="Notes" rows={4} defaultValue={account.notes} />
                <ActionButton type="submit" variant="primary" className="w-full">
                  Save client
                </ActionButton>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
