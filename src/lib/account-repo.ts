// Client organisations. A deal belongs to an account, and inherits the
// account's industry — which is what makes industry tailoring automatic rather
// than something retyped on every pursuit.
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { accounts, dealStates } from "@/db/schema";
import { newId } from "@/lib/id";
import type { ClientType } from "@/types/deal-twin";

export type Account = {
  id: string;
  name: string;
  industryId: string | null;
  countries: string[];
  clientType: ClientType | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

function rowToAccount(row: typeof accounts.$inferSelect): Account {
  let countries: string[] = [];
  try {
    const parsed = JSON.parse(row.countries);
    if (Array.isArray(parsed)) countries = parsed.filter((c): c is string => typeof c === "string");
  } catch {
    // A malformed value should not stop the account loading.
  }
  return {
    id: row.id,
    name: row.name,
    industryId: row.industryId,
    countries,
    clientType: (row.clientType as ClientType | null) ?? null,
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export async function listAccounts(): Promise<Account[]> {
  const rows = await db.select().from(accounts).orderBy(asc(accounts.name));
  return rows.map(rowToAccount);
}

export async function getAccount(id: string): Promise<Account | null> {
  const rows = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return rows[0] ? rowToAccount(rows[0]) : null;
}

export async function createAccount(input: {
  name: string;
  industryId?: string | null;
  countries?: string[];
  clientType?: ClientType | null;
  notes?: string;
}): Promise<Account> {
  const now = Date.now();
  const id = newId();
  await db.insert(accounts).values({
    id,
    name: input.name,
    industryId: input.industryId ?? null,
    countries: JSON.stringify(input.countries ?? []),
    clientType: input.clientType ?? null,
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  });
  return {
    id,
    name: input.name,
    industryId: input.industryId ?? null,
    countries: input.countries ?? [],
    clientType: input.clientType ?? null,
    notes: input.notes ?? "",
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };
}

export async function updateAccount(
  id: string,
  patch: Partial<Omit<Account, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  const now = Date.now();
  await db
    .update(accounts)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.industryId !== undefined ? { industryId: patch.industryId } : {}),
      ...(patch.countries !== undefined ? { countries: JSON.stringify(patch.countries) } : {}),
      ...(patch.clientType !== undefined ? { clientType: patch.clientType } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      updatedAt: now,
    })
    .where(eq(accounts.id, id));
}

// Deals belonging to an account, newest first. Reads the denormalized columns
// rather than parsing every payload.
export async function dealSummariesForAccount(
  accountId: string
): Promise<Array<{ id: string; company: string; updatedAt: string }>> {
  const rows = await db
    .select({ id: dealStates.id, company: dealStates.company, updatedAt: dealStates.updatedAt })
    .from(dealStates)
    .where(eq(dealStates.accountId, accountId));
  return rows
    .map((r) => ({ id: r.id, company: r.company, updatedAt: new Date(r.updatedAt).toISOString() }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
