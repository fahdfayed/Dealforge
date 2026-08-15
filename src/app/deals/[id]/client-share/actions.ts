"use server";

import { mutateDeal } from "@/lib/deal-mutation";
import { generateHandshakeCandidates } from "@/lib/scope-handshake";
import type { HandshakeResponse } from "@/types/deal-twin";

const path = (dealId: string) => `/deals/${dealId}/client-share`;

export async function generateHandshakeItemsAction(dealId: string, expectedRevision: number) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => {
      const candidates = generateHandshakeCandidates(twin);
      if (candidates.length === 0) return twin;
      return {
        ...twin,
        scopeHandshake: [
          ...twin.scopeHandshake,
          ...candidates.map((statement) => ({
            id: crypto.randomUUID(),
            statement,
            response: "Not decided" as HandshakeResponse,
            updatedAt: new Date().toISOString(),
          })),
        ],
      };
    },
    path(dealId)
  );
}

export async function updateHandshakeResponseAction(
  dealId: string,
  expectedRevision: number,
  itemId: string,
  response: HandshakeResponse
) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      scopeHandshake: twin.scopeHandshake.map((h) =>
        h.id === itemId ? { ...h, response, updatedAt: new Date().toISOString() } : h
      ),
    }),
    path(dealId)
  );
}

export async function publishClientRoomAction(dealId: string, expectedRevision: number) {
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      clientRoom: { ...twin.clientRoom, published: true, publishedAt: new Date().toISOString(), baselineRevision: expectedRevision },
    }),
    path(dealId)
  );
}

export async function addMeetingRequestAction(dealId: string, expectedRevision: number, formData: FormData) {
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;
  await mutateDeal(
    dealId,
    expectedRevision,
    (twin) => ({
      ...twin,
      clientRoom: {
        ...twin.clientRoom,
        meetingRequests: [...twin.clientRoom.meetingRequests, { id: crypto.randomUUID(), note, requestedAt: new Date().toISOString() }],
      },
    }),
    path(dealId)
  );
}
