import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROOF_ITEM_TYPES, PROOF_CONFIDENTIALITY_LEVELS } from "@/lib/domain";
import { addProofItem, deleteProofItem } from "./actions";

const CONFIDENTIALITY_COLOR: Record<string, string> = {
  "Publicly usable": "emerald",
  "Name-confidential": "sky",
  "Verbal only": "amber",
  "Requires permission": "violet",
  Expired: "rose",
};

export const dynamic = "force-dynamic";

export default async function ProofVaultPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;

  const items = await prisma.proofItem.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { summary: { contains: q } },
              { industry: { contains: q } },
              { country: { contains: q } },
              { oracleProduct: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Proof and Reference Vault"
        subtitle="Searchable library of references, case studies, CVs and reusable proposal content."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardBody>
              <form className="flex flex-wrap gap-3">
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search by industry, country, product, keyword…"
                  className="min-w-64 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                  name="type"
                  defaultValue={type ?? ""}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">All types</option>
                  {PROOF_ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Search
                </button>
              </form>
            </CardBody>
          </Card>

          {items.length === 0 ? (
            <Card className="p-10 text-center text-sm text-slate-500">No matching proof found.</Card>
          ) : (
            items.map((item) => (
              <Card key={item.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[item.type, item.industry, item.country, item.oracleProduct]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <Badge color={CONFIDENTIALITY_COLOR[item.confidentiality] ?? "slate"}>
                      {item.confidentiality}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
                  <form action={deleteProofItem.bind(null, item.id)} className="mt-2">
                    <button type="submit" className="text-xs text-slate-400 hover:text-rose-600">
                      Remove
                    </button>
                  </form>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <div>
          <Card>
            <CardHeader title="Add proof" />
            <CardBody>
              <form action={addProofItem} className="space-y-3">
                <input
                  name="title"
                  required
                  placeholder="Title"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <select name="type" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {PROOF_ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  name="industry"
                  placeholder="Industry"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  name="country"
                  placeholder="Country"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  name="oracleProduct"
                  placeholder="Oracle product"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <textarea
                  name="summary"
                  required
                  rows={3}
                  placeholder="Summary"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                  name="confidentiality"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {PROOF_CONFIDENTIALITY_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Add
                </button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
