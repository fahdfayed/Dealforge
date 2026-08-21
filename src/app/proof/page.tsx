import { requireUser } from "@/lib/identity";
import { listProofAssets } from "@/lib/proof-repo";
import { PROOF_ASSET_TYPES, PROOF_ACCESS_LEVELS } from "@/types/proof";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { Input, Textarea, Select } from "@/components/form-input";
import { ActionButton } from "@/components/button-group";
import { addProofAssetAction, deleteProofAssetAction } from "./actions";

const ACCESS_COLOR: Record<string, string> = { Public: "emerald", Confidential: "sky", "Verbal-only": "amber", "Permission-required": "violet" };

export const dynamic = "force-dynamic";

export default async function ProofVaultPage() {
  // Every authenticated screen goes through the gate. The middleware only
  // redirects when the cookie is absent; it cannot tell a forged one from a
  // real one, so this is where a session is actually verified.
  await requireUser();
  const assets = await listProofAssets();

  return (
    <div>
      <PageHeader title="Docs" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {assets.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No documents yet"
            />
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
                    <ActionButton type="submit" variant="ghost" size="sm">
                      Remove
                    </ActionButton>
                  </form>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <div>
          <Card>
            <CardHeader title="Add document" />
            <CardBody>
              <form action={addProofAssetAction} className="space-y-3">
                <Input name="title" label="Title" required placeholder="Evidence title" />
                <Select name="type" label="Type" required defaultValue={PROOF_ASSET_TYPES[0]}>
                  {PROOF_ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
                <Input name="tags" label="Tags" placeholder="industry, country, product…" hint="Comma-separated values for filtering" />
                <Textarea name="summary" label="Summary" required placeholder="Brief description of the evidence" rows={3} />
                <Input name="whatItProves" label="What it proves" placeholder="e.g., Market demand, financial viability…" />
                <Select name="access" label="Access Level" required defaultValue={PROOF_ACCESS_LEVELS[0]}>
                  {PROOF_ACCESS_LEVELS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Attachment</label>
                  <input type="file" name="file" className="w-full text-sm" />
                  <p className="mt-1 text-xs text-slate-400">Max 15 MB.</p>
                </div>
                <ActionButton type="submit" variant="primary" className="w-full">
                  Add document
                </ActionButton>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
