"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lens, Stage } from "@/lib/relevance";

// The deal's own navigation: a stepper for the stages, and a compact row of
// lenses that apply at every stage.
//
// Blocked stages are shown greyed with the reason rather than hidden. Hiding
// them makes the flow unlearnable — you cannot tell what the app expects next,
// or why "Price" is missing — while still keeping the list short, because it is
// six stages rather than fifteen flat links.
export function DealStageNav({
  dealId,
  stages,
  lenses,
}: {
  dealId: string;
  stages: Stage[];
  lenses: Lens[];
}) {
  const pathname = usePathname();
  const match = pathname.match(/^\/deals\/[^/]+(?:\/(.*))?$/);
  const currentSegment = match && match[1] ? match[1].split("/")[0] : "";

  const href = (segment: string) => `/deals/${dealId}${segment ? `/${segment}` : ""}`;

  return (
    <nav aria-label="Deal stages" className="mb-6">
      <ol className="flex flex-wrap items-stretch gap-1">
        {stages.map((stage, i) => {
          const active = currentSegment === stage.segment;
          const base =
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors";

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
                  active
                    ? "bg-slate-900 font-medium text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <StepNumber n={i + 1} tone={active ? "active" : "default"} />
                {stage.label}
              </Link>
            </li>
          );
        })}
      </ol>

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
