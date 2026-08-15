import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { getActiveQuestions, type Question } from "@/lib/questions";
import { discoveryCoverage } from "@/lib/scoring";
import { AUTHORITIES, type StructuredAnswer } from "@/types/deal-twin";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Badge } from "@/components/ui/badge";
import { ConflictBanner } from "@/components/conflict-banner";
import { AnswerGraphPdfButton } from "@/components/pdf-buttons";
import { answerQuestionAction, clearAnswerAction } from "./actions";

export default async function UnderstandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ all?: string; conflict?: string }>;
}) {
  const { id } = await params;
  const { all, conflict } = await searchParams;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const questions = getActiveQuestions(deal.twin.dealDNA);
  const coverage = discoveryCoverage(deal.twin);
  const showAll = all === "1";

  const nextFive = pickNextFive(questions, deal.twin.answers);
  const visibleQuestions = showAll ? questions : nextFive;

  const byModule = new Map<string, Question[]>();
  for (const q of visibleQuestions) byModule.set(q.module, [...(byModule.get(q.module) ?? []), q]);

  const answerAction = answerQuestionAction.bind(null, deal.id, deal.revision);
  const clearAction = clearAnswerAction.bind(null, deal.id, deal.revision);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <ConflictBanner show={conflict === "1"} />

        <Card>
          <CardHeader
            title={showAll ? "All active questions" : "Next five questions"}
            subtitle={`${coverage.answered} of ${coverage.total} answered (${coverage.pct}%)`}
            action={
              <Link
                href={`/deals/${deal.id}/understand${showAll ? "" : "?all=1"}`}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                {showAll ? "Show next five" : "Show all"}
              </Link>
            }
          />
        </Card>

        {[...byModule.entries()].map(([module, moduleQuestions]) => (
          <Card key={module}>
            <CardHeader title={module} />
            <CardBody className="divide-y divide-slate-100">
              {moduleQuestions.map((q) => {
                const existing = deal.twin.answers.find((a) => a.questionId === q.id);
                return (
                  <QuestionForm
                    key={q.id}
                    question={q}
                    existing={existing}
                    onSubmit={answerAction.bind(null, q.id)}
                    onClear={existing ? clearAction.bind(null, q.id) : undefined}
                  />
                );
              })}
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Coverage by module" />
          <CardBody className="space-y-3">
            {[...new Set(questions.map((q) => q.module))].map((module) => {
              const moduleQuestions = questions.filter((q) => q.module === module);
              const answered = moduleQuestions.filter((q) => {
                const a = deal.twin.answers.find((a) => a.questionId === q.id);
                return a && a.authority !== "Unknown" && (a.values.length > 0 || a.numberValue != null);
              }).length;
              const pct = Math.round((answered / moduleQuestions.length) * 100);
              return (
                <div key={module}>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{module}</span>
                    <span className="font-medium text-slate-700">{pct}%</span>
                  </div>
                  <div className="mt-1">
                    <Meter pct={pct} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <AnswerGraphPdfButton deal={deal} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function pickNextFive(questions: Question[], answers: StructuredAnswer[]): Question[] {
  const isAnswered = (q: Question) => {
    const a = answers.find((a) => a.questionId === q.id);
    return a && a.authority !== "Unknown" && (a.values.length > 0 || a.numberValue != null);
  };
  const unanswered = questions.filter((q) => !isAnswered(q));
  const critical = unanswered.filter((q) => q.critical);
  const rest = unanswered.filter((q) => !q.critical);
  return [...critical, ...rest].slice(0, 5);
}

function QuestionForm({
  question,
  existing,
  onSubmit,
  onClear,
}: {
  question: Question;
  existing?: StructuredAnswer;
  onSubmit: (formData: FormData) => Promise<void>;
  onClear?: () => Promise<void>;
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{question.text}</p>
        <div className="flex shrink-0 gap-1.5">
          {question.critical && <Badge color="rose">Critical</Badge>}
          {existing && <Badge color={existing.authority === "Contradictory" ? "rose" : "emerald"}>{existing.authority}</Badge>}
        </div>
      </div>

      <form action={onSubmit} className="mt-2 space-y-2">
        {question.inputType === "single" && (
          <select name="values" defaultValue={existing?.values[0] ?? ""} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm">
            <option value="">Select…</option>
            {question.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )}
        {question.inputType === "multiple" && (
          <div className="flex flex-wrap gap-2">
            {question.options?.map((o) => (
              <label key={o} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
                <input type="checkbox" name="values" value={o} defaultChecked={existing?.values.includes(o)} className="rounded border-slate-300" />
                {o}
              </label>
            ))}
          </div>
        )}
        {question.inputType === "number" && (
          <input
            type="number"
            name="numberValue"
            defaultValue={existing?.numberValue ?? ""}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        )}

        <div className="grid grid-cols-3 gap-2">
          <select name="authority" defaultValue={existing?.authority ?? "Unknown"} className="rounded-md border border-slate-300 px-2 py-1.5 text-xs">
            {AUTHORITIES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            name="source"
            placeholder="Source"
            defaultValue={existing?.source ?? ""}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
          />
          <input
            type="number"
            name="confidence"
            placeholder="Confidence %"
            defaultValue={existing?.confidence ?? ""}
            min={0}
            max={100}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
          />
        </div>

        {existing?.impacts.length ? (
          <p className="text-[11px] text-slate-400">Affects: {existing.impacts.join(", ")}</p>
        ) : null}

        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500">
            Save answer
          </button>
        </div>
      </form>
      {onClear && (
        <form action={onClear} className="mt-1">
          <button type="submit" className="text-[11px] text-slate-400 hover:text-rose-600">
            Clear answer
          </button>
        </form>
      )}
    </div>
  );
}
