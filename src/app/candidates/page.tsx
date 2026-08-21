import Link from "next/link";
import { searchCandidates, searchMetrics, type CandidateFilters } from "@/lib/candidate-repo";
import { logSearchAction } from "./actions";
import { ORACLE_SKILL_GROUPS, CANDIDATE_STATUSES, CANDIDATE_SOURCES } from "@/lib/oracle-skills";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { StatTile } from "@/components/ui/meter";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  Active: "emerald",
  "In process": "sky",
  Placed: "violet",
  "On hold": "amber",
  "Do not contact": "rose",
  Archived: "slate",
};

function numberParam(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) as string | undefined;
  const many = (k: string) => (Array.isArray(sp[k]) ? sp[k] : sp[k] ? [sp[k]] : []) as string[];

  const filters: CandidateFilters = {
    q: one("q") ?? "",
    skills: many("skill"),
    minYears: numberParam(one("minYears")),
    maxNoticeDays: numberParam(one("maxNotice")),
    availableBy: one("availableBy") ?? null,
    maxRate: numberParam(one("maxRate")),
    country: one("country") ?? "",
    status: one("status") ?? "",
    source: one("source") ?? "",
  };

  const hasQuery = Boolean(
    filters.q ||
      filters.skills?.length ||
      filters.minYears ||
      filters.maxNoticeDays ||
      filters.availableBy ||
      filters.maxRate ||
      filters.country ||
      filters.status ||
      filters.source
  );

  const results = await searchCandidates(filters);
  const metrics = await searchMetrics(7);

  // Only a real search is recorded. Logging every page view would drown the
  // "was the repository searched before sourcing" signal in noise.
  if (hasQuery) await logSearchAction(filters, results.length);

  return (
    <div>
      <PageHeader
        title="Candidates"
        action={
          <Link
            href="/candidates/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Add candidate
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Searches this week" value={String(metrics.searches)} />
        <StatTile label="Came back empty" value={String(metrics.emptyResults)} />
        <StatTile label="Recruiters searching" value={String(metrics.distinctRecruiters)} />
        <StatTile label="Added this week" value={String(metrics.candidatesAdded)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Search" />
            <CardBody>
              {/* GET so a search is a URL: shareable, bookmarkable, and back
                  returns to the same result set. */}
              <form method="get" className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Keywords</label>
                  <input
                    type="search"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="OIC, data migration, Arabic…"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Searches name, summary, notes and extracted resume text.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Oracle skills</label>
                  <select
                    name="skill"
                    multiple
                    size={8}
                    defaultValue={filters.skills}
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    {ORACLE_SKILL_GROUPS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.skills.map((skill) => (
                          <option key={skill} value={skill}>
                            {skill}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-400">Matches anyone with any of these.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Min years</label>
                    <input
                      type="number"
                      name="minYears"
                      min={0}
                      defaultValue={filters.minYears ?? ""}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Max notice (days)</label>
                    <input
                      type="number"
                      name="maxNotice"
                      min={0}
                      defaultValue={filters.maxNoticeDays ?? ""}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Available by</label>
                    <input
                      type="date"
                      name="availableBy"
                      defaultValue={filters.availableBy?.slice(0, 10) ?? ""}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Max rate</label>
                    <input
                      type="number"
                      name="maxRate"
                      min={0}
                      defaultValue={filters.maxRate ?? ""}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Country</label>
                  <input
                    name="country"
                    defaultValue={filters.country}
                    placeholder="UAE"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                    <select
                      name="status"
                      defaultValue={filters.status}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">Any</option>
                      {CANDIDATE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Source</label>
                    <select
                      name="source"
                      defaultValue={filters.source}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">Any</option>
                      {CANDIDATE_SOURCES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Search
                  </button>
                  <Link
                    href="/candidates"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Clear
                  </Link>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-3 lg:col-span-3">
          <p className="text-sm text-slate-500">
            {hasQuery
              ? `${results.length} ${results.length === 1 ? "match" : "matches"}`
              : `${results.length} in the repository`}
            {results.length === 200 && " (showing the first 200)"}
          </p>

          {results.length === 0 ? (
            <EmptyState
              icon="🔍"
              title={hasQuery ? "Nothing matched" : "No candidates yet"}
            />
          ) : (
            results.map((c) => (
              <Card key={c.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/candidates/${c.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
                      >
                        {c.fullName}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[c.primarySkill, c.currentEmployer, [c.location, c.country].filter(Boolean).join(", ")]
                          .filter(Boolean)
                          .join(" · ") || "No details recorded"}
                      </p>
                    </div>
                    <Badge color={STATUS_COLOR[c.status] ?? "slate"}>{c.status}</Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 tabular-nums">
                    {c.yearsExperience != null && <span>{c.yearsExperience} yrs</span>}
                    {c.noticePeriodDays != null && <span>{c.noticePeriodDays}d notice</span>}
                    {c.expectedRate != null && (
                      <span>
                        {c.rateCurrency} {c.expectedRate.toLocaleString()} {c.rateUnit.toLowerCase()}
                      </span>
                    )}
                    {c.availableFrom && <span>from {c.availableFrom.slice(0, 10)}</span>}
                    {c.communicationRating !== "Not assessed" && (
                      <span>Communication: {c.communicationRating}</span>
                    )}
                    {c.hasResume && <span>Resume on file</span>}
                  </div>

                  {c.oracleSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.oracleSkills.slice(0, 6).map((s) => (
                        <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {s}
                        </span>
                      ))}
                      {c.oracleSkills.length > 6 && (
                        <span className="px-1 text-xs text-slate-400">
                          +{c.oracleSkills.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
