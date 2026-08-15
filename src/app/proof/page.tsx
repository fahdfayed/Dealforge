import { listProofAssets } from "@/lib/proof-repo";
import { PROOF_ASSET_TYPES, PROOF_ACCESS_LEVELS } from "@/types/proof";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addProofAssetAction, deleteProofAssetAction } from "./actions";

const ACCESS_COLOR: Record<string, string> = { Public: "emerald", Confidential: "sky", "Verbal-only": "amber", "Permission-required": "violet" };

export const dynamic = "force-dynamic";

export default async function ProofVaultPage() {
  const assets = await listProofAssets();

  return (
    <div>
      <PageHeader title="Proof Vault" subtitle="Reusable evidence with controlled metadata. Matching uses deal context and tags — nothing is invented." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {assets.length === 0 ? (
            <Card className="p-10 text-center text-sm text-slate-500">No proof assets yet.</Card>
          ) : (
            assets.map((asset) => (
              <Card key={asset.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{asset.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{asset.type} · {asset.tags.join(", ") || "no tags"}</p>
                    </div>
                    <Badge color={ACCESS_COLOR[asset.access] ?? "slate"}>{asset.access}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{asset.summary}</p>
                  {asset.whatItProves && <p className="mt-1 text-xs text-slate-500">Proves: {asset.whatItProves}</p>}
                  {asset.fileName && <p className="mt-1 text-xs text-slate-400">Attached: {asset.fileName}</p>}
                  <form action={deleteProofAssetAction.bind(null, asset.id)} className="mt-2">
                    <button type="submit" className="text-xs text-slate-400 hover:text-rose-600">Remove</button>
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
              <form action={addProofAssetAction} className="space-y-3">
                <input name="title" required placeholder="Title" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <select name="type" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {PROOF_ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input name="tags" placeholder="Tags (industry, country, product…)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <textarea name="summary" required rows={3} placeholder="Summary" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="whatItProves" placeholder="What it proves" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <select name="access" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {PROOF_ACCESS_LEVELS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <input type="file" name="file" className="w-full text-sm" />
                <p className="text-xs text-slate-400">Max 15 MB.</p>
                <button type="submit" className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
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
