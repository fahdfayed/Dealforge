// Backfills accounts for deals created before clients existed.
//
// Every deal carried a free-text company name and a free-text industry. This
// creates one account per distinct company, attaches its deals, and maps the
// old industry string onto an authored industry where the names match
// case-insensitively. Unmatched industries are left unset for manual
// assignment rather than guessed at — a wrong industry would activate the
// wrong questions.
//
// Re-running is safe: deals that already have an account are skipped.
import "dotenv/config";
import { db } from "@/db/client";
import { dealStates } from "@/db/schema";
import { createAccount, listAccounts, updateAccount } from "@/lib/account-repo";
import { listIndustries } from "@/lib/industry-pack-repo";
import { eq, isNull } from "drizzle-orm";
import type { DealTwin } from "@/types/deal-twin";

const industries = await listIndustries();
const byName = new Map(industries.map((i) => [i.name.toLowerCase().trim(), i]));

const existing = await listAccounts();
const accountByName = new Map(existing.map((a) => [a.name.toLowerCase().trim(), a]));

const rows = await db.select().from(dealStates).where(isNull(dealStates.accountId));
console.log(`Deals without an account: ${rows.length}`);

let created = 0, attached = 0, industryMapped = 0, unmatched: string[] = [];

for (const row of rows) {
  let twin: DealTwin;
  try {
    twin = JSON.parse(row.payload) as DealTwin;
  } catch {
    console.warn(`  ! ${row.id}: unreadable payload, skipped`);
    continue;
  }

  const company = (twin.identity.company || row.company || "Unknown client").trim();
  const key = company.toLowerCase();

  // Resolve the deal's free-text industry first, independently of whether the
  // account already exists. Doing this only on account creation meant a client
  // with several deals inherited the industry of whichever was processed first,
  // and a re-run mapped nothing at all.
  const rawIndustry = (twin.dealDNA.industry ?? "").toLowerCase().trim();
  const matched = rawIndustry ? byName.get(rawIndustry) : undefined;
  if (rawIndustry && !matched && !unmatched.includes(twin.dealDNA.industry)) {
    unmatched.push(twin.dealDNA.industry);
  }

  let account = accountByName.get(key);
  if (!account) {
    account = await createAccount({
      name: company,
      industryId: matched?.id ?? null,
      countries: twin.dealDNA.countries ?? [],
      clientType: twin.dealDNA.clientType ?? null,
    });
    accountByName.set(key, account);
    created++;
    if (matched) industryMapped++;
  } else if (!account.industryId && matched) {
    // The account exists but nobody has set its industry; this deal knows it.
    await updateAccount(account.id, { industryId: matched.id });
    account = { ...account, industryId: matched.id };
    accountByName.set(key, account);
    industryMapped++;
  }

  // Point the deal at the account, and adopt the resolved industry id. The
  // payload keeps its display name either way, so nothing is lost.
  const nextTwin: DealTwin = {
    ...twin,
    dealDNA: {
      ...twin.dealDNA,
      industryId: twin.dealDNA.industryId ?? account.industryId ?? matched?.id ?? null,
    },
  };

  await db
    .update(dealStates)
    .set({
      accountId: account.id,
      industryId: nextTwin.dealDNA.industryId,
      payload: JSON.stringify(nextTwin),
    })
    .where(eq(dealStates.id, row.id));
  attached++;
}

const remaining = await db.select().from(dealStates).where(isNull(dealStates.accountId));
const total = await db.select().from(dealStates);

console.log(`Accounts created:      ${created}`);
console.log(`Deals attached:        ${attached}`);
console.log(`Industries mapped:     ${industryMapped}`);
console.log(`Deals total:           ${total.length}`);
console.log(`Deals still unlinked:  ${remaining.length}`);
if (unmatched.length) {
  console.log(`Unmatched industry strings (set these by hand): ${unmatched.join(", ")}`);
}
