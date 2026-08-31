// Resolving what a person may do with a particular deal.
//
// lib/authz.ts holds the rules and is pure. This is the part that has to touch
// the database: reading the grants in deal_access and the deal's own owner, and
// turning them into the DealGrant the rules take.
//
// Kept separate so the rules stay testable without a database, and so there is
// exactly one place that decides how a grant is derived — a second derivation
// somewhere else is how "who can see this" drifts between screens.
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dealAccess, dealStates } from "@/db/schema";
import {
  requireDealEdit,
  requireDealView,
  seesAllDeals,
  type Actor,
  type DealAccessLevel,
  type DealGrant,
} from "@/lib/authz";

export async function grantFor(actor: Actor, dealId: string): Promise<DealGrant> {
  const viaRole = seesAllDeals(actor.role);

  const rows = await db
    .select({ accessLevel: dealAccess.accessLevel })
    .from(dealAccess)
    .where(and(eq(dealAccess.dealId, dealId), eq(dealAccess.userId, actor.id)))
    .limit(1);

  if (rows[0]) {
    return { level: rows[0].accessLevel as DealAccessLevel, viaRole };
  }

  // Whoever the deal names as owner has owner access without needing a row in
  // deal_access. The owner field is a name rather than an id — it predates
  // accounts — so this compares on name, which is the best the current data
  // supports. Recorded here rather than silently accepted: two people with the
  // same name would both be treated as the owner.
  const deal = await db
    .select({ payload: dealStates.payload })
    .from(dealStates)
    .where(eq(dealStates.id, dealId))
    .limit(1);

  if (deal[0]) {
    try {
      const owner = (JSON.parse(deal[0].payload) as { identity?: { owner?: string } }).identity?.owner;
      if (owner && owner.trim().toLowerCase() === actor.name.trim().toLowerCase()) {
        return { level: "owner", viaRole };
      }
    } catch {
      // A corrupt payload must not grant access.
    }
  }

  return { level: null, viaRole };
}

// The two calls screens and actions make. Both throw, so a caller cannot
// proceed by forgetting to check a returned boolean.
export async function assertCanViewDeal(actor: Actor, dealId: string): Promise<void> {
  requireDealView(actor, await grantFor(actor, dealId));
}

export async function assertCanEditDeal(actor: Actor, dealId: string): Promise<void> {
  requireDealEdit(actor, await grantFor(actor, dealId));
}

// Every deal id this person has an explicit grant on, for filtering a list
// without one query per row.
export async function grantedDealIds(actor: Actor): Promise<Set<string>> {
  const rows = await db
    .select({ dealId: dealAccess.dealId })
    .from(dealAccess)
    .where(eq(dealAccess.userId, actor.id));
  return new Set(rows.map((r) => r.dealId));
}
