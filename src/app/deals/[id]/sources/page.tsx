import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { listSources, SOURCE_CLASSES } from "@/lib/sources-repo";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          Files, transcripts and correspondence are stored as governed source records. DealForge does not currently
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
                  <button type="submit" className="text-xs text-slate-400 hover:text-rose-600">
                    Remove
                  </button>
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
              <select name="sourceClass" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {SOURCE_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input type="file" name="file" className="w-full text-sm" />
              <p className="text-xs text-slate-400">Max 10 MB. Text-like files retain up to 120,000 characters.</p>
              <textarea
                name="note"
                rows={3}
                placeholder="Or paste a note / transcript to store as text (no file)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button type="submit" className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                Store source
              </button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
