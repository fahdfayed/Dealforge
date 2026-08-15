export type CoverageQuestion = {
  module: string;
  answered: boolean;
  criticalForPricing: boolean;
};

export type ModuleCoverage = {
  module: string;
  total: number;
  answered: number;
  pct: number;
  missingCritical: number;
};

export function computeCoverage(questions: CoverageQuestion[]): {
  byModule: ModuleCoverage[];
  overallPct: number;
  missingCriticalCount: number;
} {
  const modules = Array.from(new Set(questions.map((q) => q.module)));
  const byModule: ModuleCoverage[] = modules.map((module) => {
    const inModule = questions.filter((q) => q.module === module);
    const answered = inModule.filter((q) => q.answered).length;
    const missingCritical = inModule.filter(
      (q) => q.criticalForPricing && !q.answered
    ).length;
    return {
      module,
      total: inModule.length,
      answered,
      pct: inModule.length ? Math.round((answered / inModule.length) * 100) : 0,
      missingCritical,
    };
  });

  const totalAnswered = questions.filter((q) => q.answered).length;
  const overallPct = questions.length
    ? Math.round((totalAnswered / questions.length) * 100)
    : 0;
  const missingCriticalCount = questions.filter(
    (q) => q.criticalForPricing && !q.answered
  ).length;

  return { byModule, overallPct, missingCriticalCount };
}
