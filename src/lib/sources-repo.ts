// Source register (doc 4.4 / 15.2 / 15.4). Files are stored as governed
// records; no automatic extraction or findings are ever written — the
// source API returns no findings until a real model gateway, retrieval
// policy and human approval gate exist (doc "Currently intentional").
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { radarIntakes } from "@/db/schema";
import {
  putObject,
  deleteObject,
  makeStorageKey,
  sanitizeFilename,
  isTextLike,
  extractTextExcerpt,
  SOURCE_FILE_MAX_BYTES,
} from "@/lib/storage";

export const SOURCE_CLASSES = ["Meeting transcript", "Email", "Document", "Correspondence", "Working assumption", "Other"] as const;
export type SourceClass = (typeof SOURCE_CLASSES)[number];

export type RadarIntake = {
  id: string;
  dealId: string;
  sourceClass: string;
  storageKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  reviewState: string;
  textExcerpt: string | null;
  findings: unknown[];
  impactSnapshots: unknown[];
  createdAt: string;
};

function rowToIntake(row: typeof radarIntakes.$inferSelect): RadarIntake {
  return {
    id: row.id,
    dealId: row.dealId,
    sourceClass: row.sourceClass,
    storageKey: row.storageKey,
    fileName: row.fileName,
    fileSize: row.fileSize,
    reviewState: row.reviewState,
    textExcerpt: row.textExcerpt,
    findings: JSON.parse(row.findings),
    impactSnapshots: JSON.parse(row.impactSnapshots),
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export async function listSources(dealId: string): Promise<RadarIntake[]> {
  const rows = await db.select().from(radarIntakes).where(eq(radarIntakes.dealId, dealId)).orderBy(desc(radarIntakes.createdAt));
  return rows.map(rowToIntake);
}

export async function addSource(
  dealId: string,
  sourceClass: string,
  file: { name: string; bytes: Buffer } | null,
  note?: string
): Promise<RadarIntake> {
  if (file && file.bytes.length > SOURCE_FILE_MAX_BYTES) {
    throw new Error("Source file exceeds the 10 MB limit.");
  }

  const id = crypto.randomUUID();
  let storageKey: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let textExcerpt: string | null = note?.slice(0, 120_000) ?? null;

  if (file) {
    fileName = sanitizeFilename(file.name);
    storageKey = makeStorageKey("sources", id, fileName);
    await putObject(storageKey, file.bytes);
    fileSize = file.bytes.length;
    if (isTextLike(fileName)) textExcerpt = extractTextExcerpt(file.bytes);
  }

  const now = Date.now();
  await db.insert(radarIntakes).values({
    id,
    dealId,
    sourceClass,
    storageKey,
    fileName,
    fileSize,
    reviewState: "stored",
    textExcerpt,
    findings: "[]",
    impactSnapshots: "[]",
    createdAt: now,
  });

  return {
    id,
    dealId,
    sourceClass,
    storageKey,
    fileName,
    fileSize,
    reviewState: "stored",
    textExcerpt,
    findings: [],
    impactSnapshots: [],
    createdAt: new Date(now).toISOString(),
  };
}

export async function deleteSource(id: string): Promise<void> {
  const rows = await db.select().from(radarIntakes).where(eq(radarIntakes.id, id)).limit(1);
  const row = rows[0];
  if (row?.storageKey) await deleteObject(row.storageKey);
  await db.delete(radarIntakes).where(eq(radarIntakes.id, id));
}
