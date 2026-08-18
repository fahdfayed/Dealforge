import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { isHandshakeComplete, generateHandshakeCandidates } from "@/lib/scope-handshake";
import { HANDSHAKE_RESPONSES } from "@/types/deal-twin";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConflictBanner } from "@/components/conflict-banner";
import { ActionButton } from "@/components/button-group";
import { Input } from "@/components/form-input";
import {
  generateHandshakeItemsAction,
  updateHandshakeResponseAction,
  publishClientRoomAction,
  addMeetingRequestAction,
} from "./actions";

const RESPONSE_COLOR: Record<string, string> = { Confirmed: "emerald", "Needs discussion": "amber", Incorrect: "rose", "Not decided": "slate" };

export default async function ClientSharePage({
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
  const rev = deal.revision;

  const complete = isHandshakeComplete(twin.scopeHandshake);
  const candidateCount = generateHandshakeCandidates(twin).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <ConflictBanner show={conflict === "1"} />

        <Card>
          <CardHeader
            title="Scope Handshake"
            subtitle={complete ? "Every item confirmed — gate complete." : "Gate completes only once every item is Confirmed."}
            action={<Badge color={complete ? "emerald" : "amber"}>{complete ? "Complete" : "Incomplete"}</Badge>}
          />
          <CardBody className="space-y-3">
            {twin.scopeHandshake.length === 0 && <p className="text-sm text-slate-500">No handshake items generated yet.</p>}
            {twin.scopeHandshake.map((h) => (
              <div key={h.id} className="rounded-md border border-slate-100 px-3 py-2.5">
                <p className="text-sm text-slate-800">{h.statement}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {HANDSHAKE_RESPONSES.map((r) => (
                    <form key={r} action={updateHandshakeResponseAction.bind(null, id, rev, h.id, r)}>
                      <ActionButton
                        type="submit"
                        variant={h.response === r ? "primary" : "secondary"}
                        size="sm"
                      >
                        {r}
                      </ActionButton>
                    </form>
                  ))}
                  <Badge color={RESPONSE_COLOR[h.response]}>{h.response}</Badge>
                </div>
              </div>
            ))}
            {candidateCount > 0 && (
              <form action={generateHandshakeItemsAction.bind(null, id, rev)}>
                <ActionButton type="submit" variant="secondary" size="sm">
                  Generate {candidateCount} item(s)
                </ActionButton>
              </form>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Meeting requests" />
          <CardBody className="space-y-2">
            {twin.clientRoom.meetingRequests.length === 0 && <p className="text-sm text-slate-500">No meeting requests recorded.</p>}
            {twin.clientRoom.meetingRequests.map((m) => (
              <div key={m.id} className="rounded-md border border-slate-100 px-3 py-2 text-sm text-slate-700">
                {m.note} <span className="text-xs text-slate-400">({new Date(m.requestedAt).toLocaleDateString()})</span>
              </div>
            ))}
            <form action={addMeetingRequestAction.bind(null, id, rev)} className="flex gap-2">
              <Input name="note" placeholder="Record a meeting request" className="flex-1" />
              <ActionButton type="submit" variant="primary" size="sm">
                Add
              </ActionButton>
            </form>
          </CardBody>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader title="Client Conviction Room" />
          <CardBody className="space-y-3 text-sm">
            <p className="text-slate-600">
              {twin.clientRoom.published
                ? `Published at revision ${twin.clientRoom.baselineRevision} on ${new Date(twin.clientRoom.publishedAt ?? "").toLocaleString()}.`
                : "Not yet published. Publishing records the current Deal Twin revision as the client-facing baseline."}
            </p>
            <form action={publishClientRoomAction.bind(null, id, rev)}>
              <ActionButton type="submit" variant="primary" className="w-full">
                Publish baseline
              </ActionButton>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
