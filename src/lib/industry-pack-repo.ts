// Database access for industry packs. Kept apart from lib/industry-packs.ts so
// that module stays free of any server-only import — see the note there.
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { industries, industryPacks } from "@/db/schema";
import {
  EMPTY_PACK,
  isPackCacheWarm,
  normalizePack,
  setPackCache,
  type Industry,
  type IndustryPack,
} from "@/lib/industry-packs";

export async function ensurePacksLoaded(): Promise<void> {
  if (isPackCacheWarm()) return;

  const [industryRows, packRows] = await Promise.all([
    db.select().from(industries),
    db.select().from(industryPacks),
  ]);

  const packsByIndustryId = new Map<string, IndustryPack>();
  for (const row of packRows) {
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(row.payload);
    } catch {
      // A corrupt payload must not take the whole app down; that industry
      // simply contributes nothing until it is re-saved.
      parsed = {};
    }
    packsByIndustryId.set(row.industryId, normalizePack(parsed));
  }

  setPackCache({
    packsByIndustryId,
    industriesById: new Map(
      industryRows.map((r) => [r.id, { id: r.id, name: r.name, active: r.active === 1 } as Industry])
    ),
  });
}

export async function listIndustries(): Promise<Industry[]> {
  const rows = await db.select().from(industries);
  return rows
    .map((r) => ({ id: r.id, name: r.name, active: r.active === 1 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPack(industryId: string): Promise<IndustryPack> {
  const rows = await db.select().from(industryPacks).where(eq(industryPacks.industryId, industryId)).limit(1);
  if (!rows[0]) return { ...EMPTY_PACK };
  try {
    return normalizePack(JSON.parse(rows[0].payload));
  } catch {
    return { ...EMPTY_PACK };
  }
}
