// What a given deal actually needs on screen.
//
// The deal area used to render a fixed list of fifteen menu entries, one per
// section of the DealTwin payload, so a small managed-service renewal and a
// multi-country programme presented identically and every screen was reachable
// from the moment the deal was created — including screens that cannot show
// anything useful until work has been done elsewhere.
//
// Relevance is derived from two things: what the deal has earned (you cannot
// price a solution that has no components), and what the client's industry pack
// says applies. Both answers come from here so the navigation, the stage
// headers and any "what's next" prompt cannot disagree with each other.
import type { DealTwin } from "@/types/deal-twin";
import { getPackSync } from "@/lib/industry-packs";

export type StageId = "home" | "discover" | "shape" | "price" | "propose" | "handover";
export type LensId =
  | "evidence"
  | "commitments"
  | "docs"
  | "actions"
  | "comments"
  | "history"
  | "team"
  | "alliance";

export type Stage = {
  id: StageId;
  label: string;
  // Route segment under /deals/[id]. Empty string is the deal root.
  segment: string;
  available: boolean;
  // Why it is not available yet, shown rather than hiding the reason from the
  // user. Null when available.
  blockedReason: string | null;
};

export type Lens = {
  id: LensId;
  label: string;
  segment: string;
  available: boolean;
};

type StageRule = {
  id: StageId;
  label: string;
  segment: string;
  // Null means always available.
  requires: ((twin: DealTwin) => boolean) | null;
  blockedReason: string;
};

const STAGE_RULES: StageRule[] = [
  { id: "home", label: "Deal home", segment: "", requires: null, blockedReason: "" },
  { id: "discover", label: "Discover", segment: "understand", requires: null, blockedReason: "" },
  {
    id: "shape",
    label: "Shape",
    segment: "solution",
    requires: (t) => Boolean(t.dealDNA.engagementType),
    blockedReason: "Set an engagement type on the deal first",
  },
  {
    id: "price",
    label: "Price",
    segment: "estimate",
    requires: (t) => t.solution.components.length > 0,
    blockedReason: "Add solution components before pricing",
  },
  {
    id: "propose",
    label: "Propose",
    segment: "proposal",
    requires: (t) => Boolean(t.savedCommercialScenarioId) || t.proposals.length > 0,
    blockedReason: "Save a commercial scenario before proposing",
  },
  {
    id: "handover",
    label: "Handover",
    segment: "handover",
    requires: (t) => t.identity.stage === "Won",
    blockedReason: "Available once the deal is Won",
  },
];

const LENS_RULES: Array<{ id: LensId; label: string; segment: string }> = [
  { id: "evidence", label: "Evidence & sources", segment: "sources" },
  { id: "commitments", label: "Commitments", segment: "commitments" },
  { id: "docs", label: "Matched docs", segment: "submission-check" },
  { id: "actions", label: "Actions", segment: "actions" },
  { id: "comments", label: "Comments", segment: "comments" },
  { id: "history", label: "History", segment: "history" },
  { id: "team", label: "Team & access", segment: "client-share" },
  { id: "alliance", label: "Oracle coordination", segment: "oracle" },
];

// A pack opts parts out; it never opts them in. A half-authored pack therefore
// hides nothing, which is the safe direction to fail in.
function disabled(twin: DealTwin): { stages: Set<string>; lenses: Set<string> } {
  const modules = getPackSync(twin.dealDNA.industryId)?.modules;
  return {
    stages: new Set(modules?.disabledStages ?? []),
    lenses: new Set(modules?.disabledLenses ?? []),
  };
}

export function stagesFor(twin: DealTwin): Stage[] {
  const off = disabled(twin).stages;
  return STAGE_RULES.filter((rule) => !off.has(rule.id)).map((rule) => {
    const available = rule.requires ? rule.requires(twin) : true;
    return {
      id: rule.id,
      label: rule.label,
      segment: rule.segment,
      available,
      blockedReason: available ? null : rule.blockedReason,
    };
  });
}

export function lensesFor(twin: DealTwin): Lens[] {
  const off = disabled(twin).lenses;
  return LENS_RULES.filter((rule) => !off.has(rule.id)).map((rule) => ({
    ...rule,
    available: true,
  }));
}

// The stage the user is most likely to want next: the last one they have
// earned. Used to point them somewhere concrete rather than at a wall of links.
export function currentStage(twin: DealTwin): Stage {
  const stages = stagesFor(twin);
  const earned = stages.filter((s) => s.available);
  return earned[earned.length - 1] ?? stages[0];
}

// Gates belong on the stage they gate rather than on a screen of their own.
export const GATE_STAGE: Record<string, StageId> = {
  qualification: "home",
  "buying-alignment": "home",
  "solution-shaping": "shape",
  commercial: "price",
  submission: "propose",
};
