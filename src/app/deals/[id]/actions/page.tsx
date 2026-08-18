import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { ACTION_STATUSES } from "@/types/deal-twin";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConflictBanner } from "@/components/conflict-banner";
import { createActionAction, updateActionStatusAction, deleteActionAction } from "./actions";

const STATUS_COLOR: Record<string, string> = { Open: "amber", "In progress": "blue", Completed: "emerald", Cancelled: "slate" };

export default async function ActionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ conflict?: string }>;
}) {
  const { id } = await params;
  const { conflict } = await searchParams;
  const deal = await getDeal(id);
  if (!deal) notFound();
  const { twin } = deal;

  const openActions = twin.allianceActions.filter((a) => a.status !== "Completed" && a.status !== "Cancelled");
  const completedActions = twin.allianceActions.filter((a) => a.status === "Completed" || a.status === "Cancelled");

  return (
    <div className="space-y-6">
      <ConflictBanner show={conflict === "1"} />

      <Card>
        <CardHeader
          title="Open actions"
          subtitle="Track all deal-related tasks and follow-ups"
          action={<Badge color="slate">{openActions.length}</Badge>}
        />
        <CardBody>
          {openActions.length === 0 ? (
            <p className="text-sm text-slate-500">No open actions. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              {openActions
                .slice()
                .sort((a, b) => new Date(a.dueWindow).getTime() - new Date(b.dueWindow).getTime())
                .map((action) => (
                  <div key={action.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{action.action}</p>
                        <Badge color={STATUS_COLOR[action.status]}>{action.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Owner: <strong>{action.owner}</strong> · Due: <strong>{new Date(action.dueWindow).toLocaleDateString()}</strong>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {action.status !== "Completed" && (
                        <form action={updateActionStatusAction.bind(null, id, deal.revision, action.id, "Completed")}>
                          <button type="submit" className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                            Complete
                          </button>
                        </form>
                      )}
                      <form action={deleteActionAction.bind(null, id, deal.revision, action.id)}>
                        <button type="submit" className="text-xs text-slate-400 hover:text-rose-600">Delete</button>
                      </form>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardBody>
      </Card>

      {completedActions.length > 0 && (
        <Card>
          <CardHeader title="Completed & cancelled" action={<Badge color="slate">{completedActions.length}</Badge>} />
          <CardBody>
            <div className="space-y-1">
              {completedActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-2.5">
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      {action.action} {action.completedAt && `— completed ${new Date(action.completedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <form action={deleteActionAction.bind(null, id, deal.revision, action.id)}>
                    <button type="submit" className="text-xs text-slate-400 hover:text-rose-600">Remove</button>
                  </form>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Create new action" subtitle="Track deal tasks, follow-ups, and deliverables" />
        <CardBody>
          <form action={createActionAction.bind(null, id, deal.revision)} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Action</label>
              <input name="action" required placeholder="What needs to be done?" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Owner</label>
              <input name="owner" required placeholder="Who is responsible?" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Due date</label>
              <input name="dueWindow" type="date" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Create action
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
