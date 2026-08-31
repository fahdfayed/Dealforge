"use server";

import { require } from "@/lib/authz";
import { requireUser } from "@/lib/identity";
import { assertCanEditDeal } from "@/lib/deal-authz";
import { revalidatePath } from "next/cache";
import { addSource, deleteSource } from "@/lib/sources-repo";

export async function addSourceAction(dealId: string, formData: FormData) {
  const actor = await requireUser();
  require(actor, "deal.edit");
  await assertCanEditDeal(actor, dealId);
  const sourceClass = String(formData.get("sourceClass") ?? "Other");
  const note = String(formData.get("note") ?? "");
  const file = formData.get("file");

  let fileInput: { name: string; bytes: Buffer } | null = null;
  if (file instanceof File && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    fileInput = { name: file.name, bytes };
  }

  if (!fileInput && !note.trim()) {
    throw new Error("Provide a file or a note to store as a source.");
  }

  await addSource(dealId, sourceClass, fileInput, note);
  revalidatePath(`/deals/${dealId}/sources`);
}

export async function deleteSourceAction(dealId: string, sourceId: string) {
  const actor = await requireUser();
  require(actor, "deal.edit");
  await assertCanEditDeal(actor, dealId);
  await deleteSource(sourceId);
  revalidatePath(`/deals/${dealId}/sources`);
}
