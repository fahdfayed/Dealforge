// Where an issue gets resolved.
//
// A blocker that names a problem but not its location makes the reader hunt
// for it, which is the same work the tool was supposed to remove. Every issue
// the app reports carries a Fix: the screen that resolves it, and a label
// naming that screen so the link reads as a destination rather than a bare
// "fix this".
//
// Segments are relative to a deal, because that is what the producers know —
// scoring and submission-check operate on a DealTwin and have no deal id. The
// rendering site holds the id and resolves the href.

export type Fix = {
  // Route segment under /deals/[id]. Empty string is the deal root.
  segment: string;
  // Where the reader is being sent, in their words: "Price", "Commitments".
  label: string;
  // Optional element to scroll to, for a screen that resolves several issues.
  anchor?: string;
};

export function dealFixHref(dealId: string, fix: Fix): string {
  const base = `/deals/${dealId}${fix.segment ? `/${fix.segment}` : ""}`;
  return fix.anchor ? `${base}#${fix.anchor}` : base;
}

// The screens, named once. Issue producers reference these rather than
// repeating route strings, so a screen that moves is renamed in one place
// instead of leaving links pointing at a 404.
export const FIX = {
  dealHome: { segment: "", label: "Deal home" },
  discover: { segment: "understand", label: "Discover" },
  solution: { segment: "solution", label: "Solution" },
  buildOffer: { segment: "build-offer", label: "Build offer" },
  price: { segment: "estimate", label: "Price" },
  negotiate: { segment: "negotiate", label: "Negotiate" },
  propose: { segment: "proposal", label: "Proposal" },
  commitments: { segment: "commitments", label: "Commitments" },
  clientShare: { segment: "client-share", label: "Team & access" },
  oracle: { segment: "oracle", label: "Oracle coordination" },
  sources: { segment: "sources", label: "Evidence & sources" },
  submissionCheck: { segment: "submission-check", label: "Submission check" },
  handover: { segment: "handover", label: "Handover" },
} as const satisfies Record<string, Fix>;
