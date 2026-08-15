import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Badge } from "@/components/ui/badge";
import { computeCoverage } from "@/lib/coverage";
import { DiscoveryAnswerField } from "@/components/discovery-answer-field";
import { MODULE_OPTIONS, COMMERCIAL_MODULE } from "@/lib/domain";
import {
  answerDiscoveryQuestion,
  addDiscoveryQuestion,
  importFromNotes,
} from "./actions";

export default async function DiscoveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { discoveryQuestions: { orderBy: { createdAt: "asc" } } },
  });
  if (!opportunity) notFound();

  const coverage = computeCoverage(opportunity.discoveryQuestions);
  const byModule = new Map(
    opportunity.discoveryQuestions.reduce((acc, q) => {
      const list = acc.get(q.module) ?? [];
      list.push(q);
      acc.set(q.module, list);
      return acc;
    }, new Map<string, typeof opportunity.discoveryQuestions>())
  );

  const addQuestion = addDiscoveryQuestion.bind(null, opportunity.id);
  const importNotes = importFromNotes.bind(null, opportunity.id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader
            title="Discovery Coverage Meter"
            subtitle={`${coverage.overallPct}% of ${opportunity.discoveryQuestions.length} questions answered overall`}
          />
          <CardBody className="space-y-3">
            {coverage.byModule.map((m) => (
              <div key={m.module}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{m.module}</span>
                  <span className="text-slate-500">
                    {m.answered}/{m.total} · {m.pct}%
                    {m.missingCritical > 0 && (
                      <span className="ml-2 text-rose-600">
                        {m.missingCritical} critical missing
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-1">
                  <Meter pct={m.pct} />
                </div>
              </div>
            ))}
            {coverage.missingCriticalCount > 0 && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {coverage.missingCriticalCount} question(s) marked critical for pricing are
                still unanswered — resolve these before running the Commercial Lab estimate.
              </p>
            )}
          </CardBody>
        </Card>

        {Array.from(byModule.entries()).map(([module, questions]) => (
          <Card key={module}>
            <CardHeader title={module} subtitle={`${questions.length} question(s)`} />
            <CardBody className="divide-y divide-slate-100">
              {questions.map((q) => (
                <div key={q.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">{q.text}</p>
                    <div className="flex shrink-0 gap-1.5">
                      {q.criticalForPricing && <Badge color="rose">Critical</Badge>}
                      <Badge color={q.answered ? "emerald" : "slate"}>
                        {q.answered ? "Answered" : "Open"}
                      </Badge>
                    </div>
                  </div>
                  <DiscoveryAnswerField
                    opportunityId={opportunity.id}
                    questionId={q.id}
                    initialAnswer={q.answer}
                    onSave={answerDiscoveryQuestion}
                  />
                </div>
              ))}
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Import from meeting notes"
            subtitle="Paste notes or a transcript — matching open questions will be marked answered."
          />
          <CardBody>
            <form action={importNotes} className="space-y-3">
              <textarea
                name="notes"
                rows={8}
                placeholder="Paste meeting notes or transcript…"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Extract answers
              </button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Add a question" />
          <CardBody>
            <form action={addQuestion} className="space-y-3">
              <select
                name="module"
                defaultValue={opportunity.modules.split(",")[0] || COMMERCIAL_MODULE}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {[...MODULE_OPTIONS, COMMERCIAL_MODULE].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <textarea
                name="text"
                required
                rows={2}
                placeholder="Question text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="criticalForPricing" className="rounded border-slate-300" />
                Critical for pricing
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Add question
              </button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
