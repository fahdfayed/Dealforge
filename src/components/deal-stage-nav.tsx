"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Gate, Lens, Stage } from "@/lib/relevance";

// The deal's own navigation: a stepper for the stages, the substeps of whichever
// stage you are in, a compact row of lenses that apply at every stage, and any
// gate blocking the stage you are on.
//
// Blocked stages are shown greyed with the reason rather than hidden. Hiding
// them makes the flow unlearnable — you cannot tell what the app expects next,
// or why "Price" is missing — while still keeping the list short, because it is
// six stages rather than fifteen flat links.
//
// Substeps appear only for the stage you are in. Solution and Build offer both
// edit twin.solution, and Estimate and Negotiate both work on the commercial
// position, so they are two screens within one decision rather than four
// separate destinations competing for attention.
export function DealStageNav({
  dealId,
  stages,
  lenses,
  gates,
}: {
  dealId: string;
  stages: Stage[];
  lenses: Lens[];
  gates: Gate[];
}) {
  const pathname = usePathname();
  const match = pathname.match(/^\/deals\/[^/]+(?:\/(.*))?$/);
  const currentSegment = match && match[1] ? match[1].split("/")[0] : "";

  const href = (segment: string) => `/deals/${dealId}${segment ? `/${segment}` : ""}`;

  // A stage owns the segment you are on if it is the stage's own route or one
  // of its substeps, so opening Build offer keeps Shape highlighted.
  const stageOwns = (stage: Stage) =>
    stage.segment === currentSegment || stage.substeps.some((s) => s.segment === currentSegment);

  const currentStage = stages.find(stageOwns) ?? null;
  const substeps = currentStage?.substeps ?? [];

  const activeGates = gates.filter(
    (g) => g.blocking.length > 0 && currentStage != null && g.stage === currentStage.id
  );

  return (
    <nav aria-label="Deal stages" className="mb-6">
      <ol className="flex flex-wrap items-stretch gap-1">
        {stages.map((stage, i) => {
          const active = stageOwns(stage);
          const base = "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors";

          if (!stage.available) {
            return (
              <li key={stage.id}>
                <span
                  title={stage.blockedReason ?? undefined}
                  aria-disabled="true"
                  className={`${base} cursor-not-allowed text-slate-400`}
                >
                  <StepNumber n={i + 1} tone="muted" />
                  <span className="line-through decoration-slate-300">{stage.label}</span>
                </span>
              </li>
            );
          }

          return (
            <li key={stage.id}>
              <Link
                href={href(stage.segment)}
                aria-current={active ? "page" : undefined}
                className={`${base} ${
                  active ? "bg-slate-900 font-medium text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <StepNumber n={i + 1} tone={active ? "active" : "default"} />
                {stage.label}
              </Link>
            </li>
          );
        })}
      </ol>

      {substeps.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1 pl-1">
          {substeps.map((sub) => {
            const active = currentSegment === sub.segment;

            if (!sub.available) {
              return (
                <span
                  key={sub.id}
                  title={sub.blockedReason ?? undefined}
                  aria-disabled="true"
                  className="cursor-not-allowed rounded px-2.5 py-1 text-xs text-slate-400"
                >
                  {sub.label}
                </span>
              );
            }

            return (
              <Link
                key={sub.id}
                href={href(sub.segment)}
                aria-current={active ? "page" : undefined}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}

      {lenses.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2">
          {lenses.map((lens) => {
            const active = currentSegment === lens.segment;
            return (
              <Link
                key={lens.id}
                href={href(lens.segment)}
                aria-current={active ? "page" : undefined}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  active
                    ? "bg-slate-200 font-medium text-slate-900"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {lens.label}
              </Link>
            );
          })}
        </div>
      )}

      {activeGates.map((gate) => (
        <div
          key={gate.id}
          role="status"
          className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-amber-900">
              {gate.label}: {gate.blocking.length} blocking{" "}
              {gate.blocking.length === 1 ? "issue" : "issues"}
            </p>
            <Link
              href={href(gate.detailSegment)}
              className="text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900"
            >
              View all checks
            </Link>
          </div>
          <ul className="mt-1.5 space-y-0.5">
            {gate.blocking.map((issue) => (
              <li key={issue.id} className="text-xs text-amber-800">
                {issue.label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function StepNumber({ n, tone }: { n: number; tone: "default" | "active" | "muted" }) {
  const toneClass =
    tone === "active"
      ? "bg-white/20 text-white"
      : tone === "muted"
        ? "bg-slate-100 text-slate-400"
        : "bg-slate-100 text-slate-500";
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums ${toneClass}`}
    >
      {n}
    </span>
  );
}
