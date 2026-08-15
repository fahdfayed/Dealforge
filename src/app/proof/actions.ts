"use server";

import { revalidatePath } from "next/cache";
import { createProofAsset, deleteProofAsset } from "@/lib/proof-repo";
import type { ProofAccessLevel, ProofAssetType } from "@/types/proof";

export async function addProofAssetAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!title || !summary) throw new Error("Title and summary are required.");

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const file = formData.get("file");
  let fileInput: { name: string; bytes: Buffer } | null = null;
  if (file instanceof File && file.size > 0) {
    fileInput = { name: file.name, bytes: Buffer.from(await file.arrayBuffer()) };
  }

  await createProofAsset({
    type: String(formData.get("type") ?? "Reference") as ProofAssetType,
    title,
    tags,
    access: String(formData.get("access") ?? "Public") as ProofAccessLevel,
    summary,
    whatItProves: String(formData.get("whatItProves") ?? ""),
    file: fileInput,
  });

  revalidatePath("/proof");
}

export async function deleteProofAssetAction(id: string) {
  await deleteProofAsset(id);
  revalidatePath("/proof");
}
