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
import type { DealTwin, EngagementType } from "@/types/deal-twin";
import { FIX, type Fix } from "@/lib/fix-links";
import { getPackSync } from "@/lib/industry-packs";
import { evaluateSubmissionCheck } from "@/lib/submission-check";

export type StageId = "home" | "discover" | "shape" | "price" | "propose" | "handover";
export type LensId =
  | "evidence"
  | "health"
  | "staffing"
  | "commitments"
  | "actions"
  | "comments"
  | "history"
  | "team"
  | "alliance";

// A screen that belongs inside a stage rather than beside it. Solution and
// Build offer both edit twin.solution, and Estimate and Negotiate both work on
// the commercial position, so presenting them as peers of Discover and Propose
// overstated how many decisions the flow actually has.
export type Substep = {
  id: string;
  label: string;
  segment: string;
  available: boolean;
  blockedReason: string | null;
  blockedFix: Fix | null;
};

export type Stage = {
  id: StageId;
  label: string;
  // Route segment under /deals/[id]. Empty string is the deal root. Where a
  // stage has substeps this is the first of them, so clicking the stage lands
  // on its opening screen.
  segment: string;
  available: boolean;
  // Why it is not available yet, shown rather than hiding the reason from the
  // user. Null when available.
  blockedReason: string | null;
  // Where to go to unblock it. Null when the stage is available, or when the
  // condition is not something a screen resolves.
  blockedFix: Fix | null;
  // Empty for stages that are a single screen.
  substeps: Substep[];
};

export type Lens = {
  id: LensId;
  label: string;
  segment: string;
  available: boolean;
};

type SubstepRule = {
  id: string;
  label: string;
  segment: string;
  requires: ((twin: DealTwin) => boolean) | null;
  blockedReason: string;
  blockedFix?: Fix;
};

type StageRule = {
  id: StageId;
  label: string;
  segment: string;
  // Null means always available.
  requires: ((twin: DealTwin) => boolean) | null;
  blockedReason: string;
  blockedFix?: Fix;
  substeps?: SubstepRule[];
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
    blockedFix: FIX.dealHome,
    substeps: [
      { id: "solution", label: "Solution", segment: "solution", requires: null, blockedReason: "" },
      {
        id: "build-offer",
        label: "Build offer",
        segment: "build-offer",
        requires: (t) => Boolean(t.dealDNA.engagementType),
        blockedReason: "Set an engagement type on the deal first",
        blockedFix: FIX.dealHome,
      },
    ],
  },
  {
    id: "price",
    label: "Price",
    segment: "estimate",
    // Requiring components would leave Price permanently blocked for an
    // engagement whose Shape stage is switched off, so the prerequisite only
    // applies where there is a Shape stage to satisfy it.
    requires: (t) => stageIsOff(t, "shape") || t.solution.components.length > 0,
    blockedReason: "Add solution components before pricing",
    blockedFix: FIX.solution,
    substeps: [
      { id: "estimate", label: "Estimate", segment: "estimate", requires: null, blockedReason: "" },
      {
        id: "negotiate",
        label: "Negotiate",
        segment: "negotiate",
        requires: (t) => Boolean(t.savedCommercialScenarioId),
        blockedReason: "Save a commercial scenario before negotiating",
        blockedFix: FIX.price,
      },
    ],
  },
  {
    id: "propose",
    label: "Propose",
    segment: "proposal",
    requires: (t) => Boolean(t.savedCommercialScenarioId) || t.proposals.length > 0,
    blockedReason: "Save a commercial scenario before proposing",
    blockedFix: FIX.price,
  },
  {
    id: "handover",
    label: "Handover",
    segment: "handover",
    requires: (t) => t.identity.stage === "Won",
    blockedReason: "Available once the deal is Won",
    blockedFix: FIX.dealHome,
  },
];

const LENS_RULES: Array<{ id: LensId; label: string; segment: string }> = [
  { id: "evidence", label: "Evidence & sources", segment: "sources" },
  { id: "staffing", label: "Staffing", segment: "staffing" },
  // Health is a read-only view of scoring output, so it applies at every stage
  // rather than being a step in the flow.
  { id: "health", label: "Health", segment: "health" },
  { id: "commitments", label: "Commitments", segment: "commitments" },
  { id: "actions", label: "Actions", segment: "actions" },
  { id: "comments", label: "Comments", segment: "comments" },
  { id: "history", label: "History", segment: "history" },
  { id: "team", label: "Team & access", segment: "client-share" },
  { id: "alliance", label: "Oracle coordination", segment: "oracle" },
];

// Some engagements do not have the shape the flow assumes.
//
// Staff augmentation is people billed per month, not a component build: there
// is no solution to shape, and forcing one produces a component list nobody
// means and an effort total nobody believes. Opting out of Shape says that
// plainly instead of showing a stage that cannot be completed honestly.
type EngagementModules = { disabledStages?: StageId[]; disabledLenses?: LensId[] };

const ENGAGEMENT_MODULES: Partial<Record<EngagementType, EngagementModules>> = {
  "Staff augmentation / AMS": { disabledStages: ["shape"] },
};

// Staffing recommendations only make sense where we are placing people, so
// every engagement that is not staff augmentation opts out of that lens —
// including a deal whose type has not been set yet. "Not yet known" is not
// evidence that this is a staffing deal, and showing the lens by default would
// put it on every new deal ever created.
const STAFFING_ENGAGEMENT: EngagementType = "Staff augmentation / AMS";

function lensesDisabledByEngagement(engagementType: EngagementType | null): LensId[] {
  return engagementType === STAFFING_ENGAGEMENT ? [] : ["staffing"];
}

// A pack opts parts out; it never opts them in. A half-authored pack therefore
// hides nothing, which is the safe direction to fail in. Engagement-level
// opt-outs merge with the industry's — either can remove a stage, neither can
// restore one the other removed.
function disabled(twin: DealTwin): { stages: Set<string>; lenses: Set<string> } {
  const modules = getPackSync(twin.dealDNA.industryId)?.modules;
  const byEngagement = twin.dealDNA.engagementType
    ? ENGAGEMENT_MODULES[twin.dealDNA.engagementType]
    : undefined;
  return {
    stages: new Set([...(modules?.disabledStages ?? []), ...(byEngagement?.disabledStages ?? [])]),
    lenses: new Set([
      ...(modules?.disabledLenses ?? []),
      ...(byEngagement?.disabledLenses ?? []),
      ...lensesDisabledByEngagement(twin.dealDNA.engagementType),
    ]),
  };
}

function stageIsOff(twin: DealTwin, id: StageId): boolean {
  return disabled(twin).stages.has(id);
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
      blockedFix: available ? null : (rule.blockedFix ?? null),
      substeps: (rule.substeps ?? []).map((sub) => {
        const subAvailable = sub.requires ? sub.requires(twin) : true;
        return {
          id: sub.id,
          label: sub.label,
          segment: sub.segment,
          available: subAvailable,
          blockedReason: subAvailable ? null : sub.blockedReason,
          blockedFix: subAvailable ? null : (sub.blockedFix ?? null),
        };
      }),
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

// A blocking check surfaced on the stage it blocks.
export type Gate = {
  id: string;
  stage: StageId;
  label: string;
  // Carries each issue's fix through, so the gate card can link straight to
  // the screen that clears it instead of only offering "view all checks".
  blocking: Array<{ id: string; label: string; fix: Fix }>;
  // Where the full detail lives. The screen stays routable — the change is that
  // you are told about it on the stage it affects, instead of having to know to
  // go and look.
  detailSegment: string;
};

// Submission readiness used to be a lens labelled "Matched docs", which both
// mislabelled it and buried it: a proposal could be assembled without anyone
// seeing that it was blocked until they opened a screen they had no reason to
// open. It is a gate on Propose, so it is reported there.
export function gatesFor(twin: DealTwin): Gate[] {
  const { blockingIssues } = evaluateSubmissionCheck(twin);
  return [
    {
      id: "submission",
      stage: GATE_STAGE.submission,
      label: "Submission check",
      blocking: blockingIssues.map((i) => ({ id: i.id, label: i.label, fix: i.fix })),
      detailSegment: "submission-check",
    },
  ];
}

// Gates belong on the stage they gate rather than on a screen of their own.
export const GATE_STAGE: Record<string, StageId> = {
  qualification: "home",
  "buying-alignment": "home",
  "solution-shaping": "shape",
  commercial: "price",
  submission: "propose",
};
