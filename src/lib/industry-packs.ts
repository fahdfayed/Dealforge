// Industry packs: what being in a sector changes about a deal.
//
// We are an Oracle partner, so the engagement types we sell are a fixed
// catalogue (ENGAGEMENT_TYPES) and stay in code. The industries we sell into —
// construction, healthcare, retail — are open-ended and differ per client, so
// they are authored data rather than a TypeScript union.
//
// This module holds types and the synchronous cache only, with no database
// import: it is reached from lib/questions.ts, which client components pull in
// transitively, and importing better-sqlite3 here drags `fs` into the browser
// bundle. Database access lives in lib/industry-pack-repo.ts.
//
// Resolution is deliberately split into an async load and a sync read. The
// scoring engine calls getActiveQuestions three times inside synchronous
// functions, so making question resolution async would cascade through every
// engine and every caller. Instead the pack table is read once per process into
// a cache, warmed from the deal repository — which every screen already awaits
// before it can render anything.
// Type-only imports: erased at compile time, so the cycle with lib/questions.ts
// (which imports getPackSync from here) exists only in the type graph.
import type { Question } from "@/lib/questions";
import type { ComponentTemplate } from "@/lib/solution-catalog";

export type Industry = {
  id: string;
  name: string;
  active: boolean;
};

// Which parts of the app a deal in this industry actually needs. Absent or
// empty means "everything applies" — a pack must opt out, never opt in, so a
// half-authored pack cannot silently hide screens.
export type ModuleFlags = {
  disabledStages?: string[];
  disabledLenses?: string[];
};

// Named overrides for the scoring weights. Only the keys a pack sets are
// overridden; everything else keeps the default. Consumed by lib/scoring.ts.
export type ScoringModifiers = Record<string, number>;

export type IndustryPack = {
  questions: Question[];
  componentAddOns: ComponentTemplate[];
  scoringModifiers: ScoringModifiers;
  requiredGates: string[];
  proofTags: string[];
  modules: ModuleFlags;
};

export const EMPTY_PACK: IndustryPack = {
  questions: [],
  componentAddOns: [],
  scoringModifiers: {},
  requiredGates: [],
  proofTags: [],
  modules: {},
};

// A stored payload may predate any field, or be mid-edit in the admin UI, so
// every facet is defaulted rather than trusted.
export function normalizePack(raw: unknown): IndustryPack {
  const p = (raw ?? {}) as Partial<IndustryPack>;
  return {
    questions: Array.isArray(p.questions) ? p.questions : [],
    componentAddOns: Array.isArray(p.componentAddOns) ? p.componentAddOns : [],
    scoringModifiers: p.scoringModifiers && typeof p.scoringModifiers === "object" ? p.scoringModifiers : {},
    requiredGates: Array.isArray(p.requiredGates) ? p.requiredGates : [],
    proofTags: Array.isArray(p.proofTags) ? p.proofTags : [],
    modules: p.modules && typeof p.modules === "object" ? p.modules : {},
  };
}

export type PackCache = {
  packsByIndustryId: Map<string, IndustryPack>;
  industriesById: Map<string, Industry>;
};

// Module-level so it survives across requests within a server process.
const globalForPacks = globalThis as unknown as { __industryPackCache?: PackCache };

export function setPackCache(cache: PackCache): void {
  globalForPacks.__industryPackCache = cache;
}

export function isPackCacheWarm(): boolean {
  return globalForPacks.__industryPackCache !== undefined;
}

export function invalidatePackCache(): void {
  globalForPacks.__industryPackCache = undefined;
}

// Industries that have been merged away, mapped to the survivor.
//
// migrate-industry-merges repoints stored rows, but it cannot reach a database
// nobody has migrated yet, and a deal payload can carry an id the accounts
// table no longer uses. Resolving through the alias here means a stale id
// yields the right pack rather than silently contributing nothing — which
// would look like an industry that simply asks no questions.
export const INDUSTRY_ALIASES: Record<string, string> = {
  // A strictly weaker duplicate of Government.
  "public-sector": "government",
  // Merged into Banking & Financial Services, which kept the id.
  banking: "financial-services",
};

export function resolveIndustryId(industryId: string | null | undefined): string | null {
  if (!industryId) return null;
  return INDUSTRY_ALIASES[industryId] ?? industryId;
}

// Synchronous reads for the engines. Return null when the cache is cold or the
// industry has no pack, which callers treat as "no industry contribution".
export function getPackSync(industryId: string | null | undefined): IndustryPack | null {
  const id = resolveIndustryId(industryId);
  if (!id) return null;
  return globalForPacks.__industryPackCache?.packsByIndustryId.get(id) ?? null;
}

export function getIndustrySync(industryId: string | null | undefined): Industry | null {
  const id = resolveIndustryId(industryId);
  if (!id) return null;
  return globalForPacks.__industryPackCache?.industriesById.get(id) ?? null;
}

// Every pack currently cached. Used to resolve a question id back to its
// definition when it came from a pack rather than the built-in bank.
export function getAllCachedPacks(): IndustryPack[] {
  const cache = globalForPacks.__industryPackCache;
  return cache ? [...cache.packsByIndustryId.values()] : [];
}
