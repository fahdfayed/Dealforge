import Link from "next/link";
import type { CandidateMatch, ExcludedCandidate, Requirement } from "@/lib/candidate-matching";
import { MATCH_WEIGHTS } from "@/lib/candidate-matching";
import { Badge } from "@/components/ui/badge";

const BAND_COLOR: Record<CandidateMatch["band"], string> = {
  Strong: "emerald",
  Possible: "sky",
  Weak: "slate",
};

// Ranked candidates with the reasoning shown.
//
// The score is deliberately not the whole story on screen: a recruiter has to
// justify a shortlist to a practice head, and a number with no argument behind
// it cannot be justified or challenged. Reasons and gaps are what get read.
export function CandidateRecommendations({
  matches,
  excluded,
  requirement,
  selectName,
}: {
  matches: CandidateMatch[];
  excluded: ExcludedCandidate[];
  requirement: Requirement;
  // When present, each row offers a radio so the list doubles as the picker
  // for a submission rather than making people choose twice.
  selectName?: string;
}) {
  if (matches.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-500">
          Nobody in the repository matches this requirement yet.
        </p>
        {excluded.length > 0 && <ExcludedSummary excluded={excluded} />}
        <Link
          href={`/candidates?for=${requirement.sourceId}`}
          className="text-xs font-medium text-indigo-600 underline underline-offset-2"
        >
          Search the repository
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Ranked on skill, experience, availability, rate, location and communication
        {" "}({Object.entries(MATCH_WEIGHTS)
          .map(([k, v]) => `${k} ${v}`)
          .join(", ")}). Scores are a guide, not a decision.
      </p>

      {matches.map((m) => (
        <div key={m.candidate.id} className="rounded-lg border border-slate-200 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2">
              {selectName && (
                <input
                  type="radio"
                  name={selectName}
                  value={m.candidate.id}
                  id={`pick-${m.candidate.id}`}
                  className="mt-1"
                />
              )}
              <div className="min-w-0">
                <label
                  htmlFor={selectName ? `pick-${m.candidate.id}` : undefined}
                  className="cursor-pointer text-sm font-medium text-slate-800"
                >
                  {m.candidate.fullName}
                </label>
                <p className="text-xs text-slate-500">
                  {[
                    m.candidate.primarySkill,
                    m.candidate.yearsExperience != null ? `${m.candidate.yearsExperience} yrs` : null,
                    [m.candidate.location, m.candidate.country].filter(Boolean).join(", "),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs tabular-nums text-slate-500">{m.score}</span>
              <Badge color={BAND_COLOR[m.band]}>{m.band}</Badge>
              <Link
                href={`/candidates/${m.candidate.id}`}
                className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700"
              >
                Open
              </Link>
            </div>
          </div>

          {m.reasons.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {m.reasons.map((r, i) => (
                <li key={i} className="text-xs text-emerald-700">
                  {r}
                </li>
              ))}
            </ul>
          )}
          {m.gaps.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {m.gaps.map((g, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-2 text-xs text-amber-700">
                  <span>{g}</span>
                  {/* A gap caused by a blank field is fixed on the candidate
                      record, so it links there rather than leaving the reader
                      to work out where the value lives. */}
                  {/not recorded|not assessed/i.test(g) && (
                    <Link
                      href={`/candidates/${m.candidate.id}`}
                      className="whitespace-nowrap font-medium text-indigo-600 underline underline-offset-2"
                    >
                      Add it →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {excluded.length > 0 && <ExcludedSummary excluded={excluded} />}
    </div>
  );
}

// Shown rather than hidden: knowing that the obvious person was left out
// because they are already placed saves someone going to look for them.
function ExcludedSummary({ excluded }: { excluded: ExcludedCandidate[] }) {
  return (
    <details className="rounded-md border border-slate-100 px-3 py-2">
      <summary className="cursor-pointer text-xs text-slate-500">
        {excluded.length} not shown
      </summary>
      <ul className="mt-2 space-y-0.5">
        {excluded.map((e) => (
          <li key={e.candidate.id} className="text-xs text-slate-500">
            {e.candidate.fullName} — {e.reason}
          </li>
        ))}
      </ul>
    </details>
  );
}
