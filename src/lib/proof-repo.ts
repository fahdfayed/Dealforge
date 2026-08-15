import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { proofAssets } from "@/db/schema";
import type { ProofAsset, ProofAccessLevel, ProofAssetType } from "@/types/proof";
import { putObject, deleteObject, makeStorageKey, sanitizeFilename, PROOF_FILE_MAX_BYTES } from "@/lib/storage";

function rowToAsset(row: typeof proofAssets.$inferSelect): ProofAsset {
  return {
    id: row.id,
    type: row.type as ProofAssetType,
    title: row.title,
    tags: JSON.parse(row.tags),
    access: row.access as ProofAccessLevel,
    summary: row.summary,
    whatItProves: row.whatItProves,
    storageKey: row.storageKey,
    fileName: row.fileName,
    fileSize: row.fileSize,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export async function listProofAssets(): Promise<ProofAsset[]> {
  const rows = await db.select().from(proofAssets).orderBy(desc(proofAssets.updatedAt));
  return rows.map(rowToAsset);
}

export async function createProofAsset(input: {
  type: ProofAssetType;
  title: string;
  tags: string[];
  access: ProofAccessLevel;
  summary: string;
  whatItProves: string;
  file: { name: string; bytes: Buffer } | null;
}): Promise<ProofAsset> {
  if (input.file && input.file.bytes.length > PROOF_FILE_MAX_BYTES) {
    throw new Error("Proof file exceeds the 15 MB limit.");
  }

  const id = crypto.randomUUID();
  let storageKey: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;

  if (input.file) {
    fileName = sanitizeFilename(input.file.name);
    storageKey = makeStorageKey("proof", id, fileName);
    await putObject(storageKey, input.file.bytes);
    fileSize = input.file.bytes.length;
  }

  const now = Date.now();
  await db.insert(proofAssets).values({
    id,
    type: input.type,
    title: input.title,
    tags: JSON.stringify(input.tags),
    access: input.access,
    summary: input.summary,
    whatItProves: input.whatItProves,
    storageKey,
    fileName,
    fileSize,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    type: input.type,
    title: input.title,
    tags: input.tags,
    access: input.access,
    summary: input.summary,
    whatItProves: input.whatItProves,
    storageKey,
    fileName,
    fileSize,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };
}

export async function deleteProofAsset(id: string): Promise<void> {
  const rows = await db.select().from(proofAssets).where(eq(proofAssets.id, id)).limit(1);
  const row = rows[0];
  if (row?.storageKey) await deleteObject(row.storageKey);
  await db.delete(proofAssets).where(eq(proofAssets.id, id));
}
