"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addProofItem(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const oracleProduct = String(formData.get("oracleProduct") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const confidentiality = String(formData.get("confidentiality") ?? "Publicly usable");

  if (!title || !summary) throw new Error("Title and summary are required.");

  await prisma.proofItem.create({
    data: { title, type, industry, country, oracleProduct, summary, confidentiality },
  });

  revalidatePath("/proof-vault");
}

export async function deleteProofItem(id: string) {
  await prisma.proofItem.delete({ where: { id } });
  revalidatePath("/proof-vault");
}
