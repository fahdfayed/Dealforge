// Oracle coordination (doc 10.2). Alliance health blends the Oracle
// dimension score (scoring.ts) with joint-action completion. The rationale
// is templated from Deal Twin facts only — never invented.
import type { AllianceAction, DealTwin } from "@/types/deal-twin";

export function allianceHealth(oracleScore: number, actions: AllianceAction[]): { score: number; label: string } {
  const completionRatio = actions.length ? (actions.filter((a) => a.completed).length / actions.length) * 100 : 50;
  const score = Math.round((oracleScore + completionRatio) / 2);
  const label = score >= 75 ? "Strong alignment" : score >= 50 ? "Developing alignment" : score >= 25 ? "Weak alignment" : "No alignment established";
  return { score, label };
}

export function generateOracleRationale(twin: DealTwin): string {
  const lines: string[] = [];
  lines.push(`Opportunity: ${twin.identity.company} — ${twin.identity.engagementTitle || "engagement title pending"}.`);
  if (twin.dealDNA.engagementType) lines.push(`Product alignment: ${twin.dealDNA.engagementType}.`);
  if (twin.commercialHeadline.opportunityValue) {
    lines.push(`Opportunity value: ${twin.commercialHeadline.currency} ${twin.commercialHeadline.opportunityValue.toLocaleString()}.`);
  }
  const registration = twin.answers.find((a) => a.questionId === "std-19")?.values[0];
  lines.push(`Oracle registration status: ${registration ?? "not yet recorded"}.`);
  const pending = twin.allianceActions.filter((a) => !a.completed);
  if (pending.length > 0) {
    lines.push(`Unresolved Oracle dependencies: ${pending.map((a) => a.action).join("; ")}.`);
  } else if (twin.allianceActions.length > 0) {
    lines.push("All recorded Oracle actions are complete.");
  }
  return lines.join("\n");
}
