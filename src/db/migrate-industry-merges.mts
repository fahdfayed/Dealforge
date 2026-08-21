// Repoints accounts and deals away from industries that have been merged.
//
// Two industries were retired because they duplicated a sibling: Public Sector
// (a weaker Government) and Banking (folded into Banking & Financial Services,
// which kept the id `financial-services`). Both remain in the industries table
// marked inactive, because a question id is resolved back to its definition by
// scanning every cached pack — deleting a retired pack would orphan answers
// already captured against it.
//
// Three places hold an industry id and all three must move together, or a
// filter by industry disagrees with what the deal screen shows:
//   - accounts.industry_id
//   - deal_states.industry_id
//   - the industryId inside deal_states.payload
//
// Re-running is safe: rows already on the survivor are skipped.
import "dotenv/config";
import { db } from "@/db/client";
import { accounts, dealStates } from "@/db/schema";
import { INDUSTRY_ALIASES } from "@/lib/industry-packs";
import type { DealTwin } from "@/types/deal-twin";
import { eq } from "drizzle-orm";

let accountsMoved = 0;
let dealRowsMoved = 0;
let payloadsMoved = 0;

for (const [retired, survivor] of Object.entries(INDUSTRY_ALIASES)) {
  const staleAccounts = await db.select().from(accounts).where(eq(accounts.industryId, retired));
  for (const account of staleAccounts) {
    await db
      .update(accounts)
      .set({ industryId: survivor, updatedAt: Date.now() })
      .where(eq(accounts.id, account.id));
    accountsMoved++;
  }

  const staleDeals = await db.select().from(dealStates).where(eq(dealStates.industryId, retired));
  for (const deal of staleDeals) {
    await db
      .update(dealStates)
      .set({ industryId: survivor, updatedAt: Date.now() })
      .where(eq(dealStates.id, deal.id));
    dealRowsMoved++;
  }
}

// The payload is scanned separately: a deal can carry a retired id inside its
// twin while its column was already correct, or vice versa.
const allDeals = await db.select().from(dealStates);
for (const deal of allDeals) {
  let twin: DealTwin;
  try {
    twin = JSON.parse(deal.payload) as DealTwin;
  } catch {
    console.warn(`  skipped ${deal.id}: payload is not valid JSON`);
    continue;
  }

  const current = twin.dealDNA?.industryId;
  const survivor = current ? INDUSTRY_ALIASES[current] : undefined;
  if (!survivor) continue;

  const updated: DealTwin = {
    ...twin,
    dealDNA: { ...twin.dealDNA, industryId: survivor },
  };
  await db
    .update(dealStates)
    .set({ payload: JSON.stringify(updated), industryId: survivor, updatedAt: Date.now() })
    .where(eq(dealStates.id, deal.id));
  payloadsMoved++;
}

console.log(`Merges applied:       ${Object.keys(INDUSTRY_ALIASES).length}`);
console.log(`Accounts repointed:   ${accountsMoved}`);
console.log(`Deal rows repointed:  ${dealRowsMoved}`);
console.log(`Deal payloads fixed:  ${payloadsMoved}`);

const remaining = (await db.select().from(dealStates)).filter((d) => {
  const id = d.industryId;
  return id ? Boolean(INDUSTRY_ALIASES[id]) : false;
}).length;
console.log(`Deals still on a retired industry: ${remaining}`);
