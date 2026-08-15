import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { dealStates, radarIntakes } from "@/db/schema";
import { createEmptyDealTwin, type Deal, type DealTwin } from "@/types/deal-twin";
import { deleteObject } from "@/lib/storage";

export class ConflictError extends Error {
  constructor(public dealId: string, public expected: number, public actual: number) {
    super(`Deal ${dealId} was saved from revision ${expected}, but the stored revision is ${actual}.`);
    this.name = "ConflictError";
  }
}

function rowToDeal(row: typeof dealStates.$inferSelect): Deal {
  return {
    id: row.id,
    revision: row.revision,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    twin: JSON.parse(row.payload) as DealTwin,
  };
}

export async function listDeals(): Promise<Deal[]> {
  const rows = await db.select().from(dealStates).orderBy(desc(dealStates.updatedAt));
  return rows.map(rowToDeal);
}

export async function getDeal(id: string): Promise<Deal | null> {
  const rows = await db.select().from(dealStates).where(eq(dealStates.id, id)).limit(1);
  return rows[0] ? rowToDeal(rows[0]) : null;
}

export async function createDeal(input: { company: string; owner: string }): Promise<Deal> {
  const now = Date.now();
  const id = crypto.randomUUID();
  const twin = createEmptyDealTwin(input);
  await db.insert(dealStates).values({
    id,
    company: input.company,
    payload: JSON.stringify(twin),
    revision: 1,
    createdAt: now,
    updatedAt: now,
  });
  return { id, revision: 1, createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(), twin };
}

// Optimistic concurrency: the caller must supply the revision it last read.
// If the stored revision has moved on, this throws ConflictError instead of
// silently overwriting another session's work (doc sections 3.2 / 15.3).
export async function saveDeal(id: string, twin: DealTwin, expectedRevision: number): Promise<Deal> {
  const current = await db.select().from(dealStates).where(eq(dealStates.id, id)).limit(1);
  const row = current[0];
  if (!row) throw new Error(`Deal ${id} not found.`);
  if (row.revision !== expectedRevision) {
    throw new ConflictError(id, expectedRevision, row.revision);
  }

  const now = Date.now();
  const nextRevision = row.revision + 1;
  await db
    .update(dealStates)
    .set({
      company: twin.identity.company,
      payload: JSON.stringify(twin),
      revision: nextRevision,
      updatedAt: now,
    })
    .where(eq(dealStates.id, id));

  return { id, revision: nextRevision, createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(now).toISOString(), twin };
}

export async function duplicateDeal(id: string): Promise<Deal> {
  const source = await getDeal(id);
  if (!source) throw new Error(`Deal ${id} not found.`);

  const now = Date.now();
  const newId = crypto.randomUUID();
  const twin: DealTwin = {
    ...source.twin,
    identity: { ...source.twin.identity, engagementTitle: `${source.twin.identity.engagementTitle} (copy)`.trim() },
    // Duplicating creates a controlled scenario copy with its own event history.
    coordinationEvents: [],
    coordinationSignals: [],
    clientRoom: { published: false, publishedAt: null, baselineRevision: null, meetingRequests: [] },
  };

  await db.insert(dealStates).values({
    id: newId,
    company: twin.identity.company,
    payload: JSON.stringify(twin),
    revision: 1,
    createdAt: now,
    updatedAt: now,
  });

  return { id: newId, revision: 1, createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(), twin };
}

export async function deleteDeal(id: string): Promise<void> {
  const intakes = await db.select().from(radarIntakes).where(eq(radarIntakes.dealId, id));
  for (const intake of intakes) {
    if (intake.storageKey) await deleteObject(intake.storageKey);
  }
  await db.delete(radarIntakes).where(eq(radarIntakes.dealId, id));
  await db.delete(dealStates).where(eq(dealStates.id, id));
}
