import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { dealStates, radarIntakes } from "@/db/schema";
import { createEmptyDealTwin, type Deal, type DealTwin } from "@/types/deal-twin";
import { deleteObject } from "@/lib/storage";
import { ensurePacksLoaded } from "@/lib/industry-pack-repo";
import { getIndustrySync } from "@/lib/industry-packs";
import { getAccount } from "@/lib/account-repo";
import { recalculateActiveQuestions } from "@/lib/answer-graph";
import { newId } from "@/lib/id";

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

// Loading a deal is the chokepoint every screen passes through, so it is where
// the industry pack cache gets warmed. The engines then resolve packs
// synchronously (see lib/industry-packs.ts), which is what lets the scoring
// engine stay sync end to end.
export async function listDeals(): Promise<Deal[]> {
  await ensurePacksLoaded();
  const rows = await db.select().from(dealStates).orderBy(desc(dealStates.updatedAt));
  return rows.map(rowToDeal);
}

export async function getDeal(id: string): Promise<Deal | null> {
  await ensurePacksLoaded();
  const rows = await db.select().from(dealStates).where(eq(dealStates.id, id)).limit(1);
  return rows[0] ? rowToDeal(rows[0]) : null;
}

// Creating a deal under an account inherits the account's industry and
// countries, so the industry pack is already active on the first screen rather
// than waiting for someone to remember to set it.
export async function createDeal(input: {
  company: string;
  owner: string;
  accountId?: string | null;
}): Promise<Deal> {
  await ensurePacksLoaded();
  const now = Date.now();
  const id = newId();

  const account = input.accountId ? await getAccount(input.accountId) : null;

  let twin = createEmptyDealTwin({ company: account?.name ?? input.company, owner: input.owner });
  if (account) {
    twin = recalculateActiveQuestions({
      ...twin,
      dealDNA: {
        ...twin.dealDNA,
        industryId: account.industryId,
        industry: getIndustrySync(account.industryId)?.name ?? "",
        countries: account.countries,
        clientType: account.clientType,
      },
    });
  }

  await db.insert(dealStates).values({
    id,
    company: account?.name ?? input.company,
    accountId: account?.id ?? null,
    industryId: account?.industryId ?? null,
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
      // Kept in step with the payload on every save. If this drifts, SQL
      // filters and rollups by industry silently disagree with what the deal
      // screen shows.
      industryId: twin.dealDNA.industryId,
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
