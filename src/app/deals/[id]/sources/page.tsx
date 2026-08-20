import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { listSources, SOURCE_CLASSES } from "@/lib/sources-repo";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/button-group";
import { Select, Textarea } from "@/components/form-input";
import { addSourceAction, deleteSourceAction } from "./actions";

export default async function SourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const sources = await listSources(id);
  const addAction = addSourceAction.bind(null, id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          Files, transcripts and correspondence are stored as governed source records. Intelloger does not currently
          analyse them — no automatic findings are produced until a model gateway, retrieval policy and human
          approval gate are connected.
        </div>

        <Card>
          <CardHeader title="Source register" subtitle={`${sources.length} stored`} />
          <CardBody className="space-y-3">
            {sources.length === 0 && <p className="text-sm text-slate-500">No sources stored yet.</p>}
            {sources.map((s) => (
              <div key={s.id} className="rounded-md border border-slate-100 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.fileName ?? "Note"}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {s.sourceClass} · {new Date(s.createdAt).toLocaleDateString()}
                      {s.fileSize ? ` · ${Math.round(s.fileSize / 1024)} KB` : ""}
                    </p>
                  </div>
                  <Badge color="slate">{s.reviewState}</Badge>
                </div>
                {s.textExcerpt && !s.fileName && <p className="mt-2 text-xs text-slate-600">{s.textExcerpt}</p>}
                <form action={deleteSourceAction.bind(null, id, s.id)} className="mt-2">
                  <ActionButton type="submit" variant="ghost" size="sm">
                    Remove
                  </ActionButton>
                </form>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader title="Add a source" />
          <CardBody>
            <form action={addAction} className="space-y-3">
              <Select name="sourceClass" label="Type" defaultValue={SOURCE_CLASSES[0]}>
                {SOURCE_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">File</label>
                <input type="file" name="file" className="w-full text-sm" />
                <p className="mt-1 text-xs text-slate-400">Max 10 MB. Text files retain up to 120k chars.</p>
              </div>
              <Textarea
                name="note"
                label="Or transcript/note"
                rows={3}
                placeholder="Paste content to store as text"
              />
              <ActionButton type="submit" variant="primary" className="w-full">
                Store source
              </ActionButton>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
