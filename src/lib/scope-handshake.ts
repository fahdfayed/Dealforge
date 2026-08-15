// Scope Handshake (doc 9.2): confirmation statements generated from the
// current scope, boundaries and responsibilities. The gate is complete
// only when every item is Confirmed.
import type { DealTwin, ScopeHandshakeItem } from "@/types/deal-twin";

export function generateHandshakeCandidates(twin: DealTwin): string[] {
  const existing = new Set(twin.scopeHandshake.map((h) => h.statement));
  const statements: string[] = [];

  for (const c of twin.solution.components.filter((c) => c.included)) {
    statements.push(`${c.label} is included in scope.`);
  }
  for (const exclusion of twin.solution.exclusions) {
    statements.push(`Excluded: ${exclusion}`);
  }
  for (const responsibility of twin.solution.responsibilities) {
    statements.push(`Client responsibility: ${responsibility}`);
  }

  return statements.filter((s) => !existing.has(s));
}

export function isHandshakeComplete(items: ScopeHandshakeItem[]): boolean {
  return items.length > 0 && items.every((i) => i.response === "Confirmed");
}
