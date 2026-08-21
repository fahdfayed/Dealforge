"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAccount, updateAccount } from "@/lib/account-repo";
import type { ClientType } from "@/types/deal-twin";

function parseCountries(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export async function createAccountAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Client name is required.");

  const account = await createAccount({
    name,
    industryId: String(formData.get("industryId") ?? "") || null,
    countries: parseCountries(formData.get("countries")),
    clientType: (String(formData.get("clientType") ?? "") || null) as ClientType | null,
    notes: String(formData.get("notes") ?? ""),
  });

  revalidatePath("/accounts");
  redirect(`/accounts/${account.id}`);
}

export async function updateAccountAction(accountId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Client name is required.");

  await updateAccount(accountId, {
    name,
    industryId: String(formData.get("industryId") ?? "") || null,
    countries: parseCountries(formData.get("countries")),
    clientType: (String(formData.get("clientType") ?? "") || null) as ClientType | null,
    notes: String(formData.get("notes") ?? ""),
  });

  revalidatePath(`/accounts/${accountId}`);
  revalidatePath("/accounts");
}
