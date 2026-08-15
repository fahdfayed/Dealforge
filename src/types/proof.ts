export const PROOF_ASSET_TYPES = [
  "Case study",
  "Reference",
  "Consultant CV",
  "Certification",
  "Architecture diagram",
  "SOW template",
  "Supporting evidence",
] as const;
export type ProofAssetType = (typeof PROOF_ASSET_TYPES)[number];

export const PROOF_ACCESS_LEVELS = ["Public", "Confidential", "Verbal-only", "Permission-required"] as const;
export type ProofAccessLevel = (typeof PROOF_ACCESS_LEVELS)[number];

export type ProofAsset = {
  id: string;
  type: ProofAssetType;
  title: string;
  tags: string[];
  access: ProofAccessLevel;
  summary: string;
  whatItProves: string;
  storageKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
};
