// Proof Vault matching (doc 10.1): matches on the current deal context and
// tags only. It never invents a project reference — an asset is either in
// the vault with real metadata, or it doesn't get suggested.
import type { DealTwin } from "@/types/deal-twin";
import type { ProofAsset } from "@/types/proof";

export function matchProofAssets(twin: DealTwin, assets: ProofAsset[], limit = 5): ProofAsset[] {
  const contextTags = new Set(
    [
      twin.dealDNA.industry,
      twin.dealDNA.engagementType,
      ...twin.dealDNA.countries,
      ...twin.solution.components.filter((c) => c.included).map((c) => c.category),
    ]
      .filter(Boolean)
      .map((t) => String(t).toLowerCase())
  );

  if (contextTags.size === 0) return [];

  const scored = assets
    .map((asset) => {
      const assetTags = new Set(asset.tags.map((t) => t.toLowerCase()));
      let score = 0;
      for (const tag of contextTags) {
        if (assetTags.has(tag)) score += 1;
      }
      return { asset, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.asset);
}
