import Link from "next/link";
import { listAccounts } from "@/lib/account-repo";
import { listIndustries } from "@/lib/industry-pack-repo";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ActionButton } from "@/components/button-group";
import { Input, Select, Textarea } from "@/components/form-input";
import { createAccountAction } from "./actions";
import { CLIENT_TYPES } from "@/types/deal-twin";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [accounts, industries] = await Promise.all([listAccounts(), listIndustries()]);
  const industryName = new Map(industries.map((i) => [i.id, i.name]));

  return (
    <div>
      <PageHeader title="Clients" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {accounts.length === 0 ? (
            <EmptyState icon="🏢" title="No clients yet" />
          ) : (
            accounts.map((account) => (
              <Card key={account.id}>
                <CardBody className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/accounts/${account.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
                    >
                      {account.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {account.countries.join(", ") || "No countries recorded"}
                    </p>
                  </div>
                  {account.industryId ? (
                    <Badge color="indigo">{industryName.get(account.industryId) ?? account.industryId}</Badge>
                  ) : (
                    <Badge color="amber">No industry set</Badge>
                  )}
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <div>
          <Card>
            <CardHeader title="Add client" />
            <CardBody>
              <form action={createAccountAction} className="space-y-3">
                <Input name="name" label="Client name" required placeholder="Acme Construction" />
                <Select name="industryId" label="Industry" defaultValue="">
                  <option value="">Not set</option>
                  {industries
                    .filter((i) => i.active)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                </Select>
                <Input
                  name="countries"
                  label="Countries"
                  placeholder="UAE, Saudi Arabia"
                  hint="Comma-separated. Inherited by new deals."
                />
                <Select name="clientType" label="Client type" defaultValue="">
                  <option value="">Not set</option>
                  {CLIENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <Textarea name="notes" label="Notes" rows={3} placeholder="Relationship context" />
                <ActionButton type="submit" variant="primary" className="w-full">
                  Add client
                </ActionButton>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
