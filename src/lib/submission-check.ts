// Deterministic Submission Check (doc 8.3 / 9.4 "submission firewall").
// Proposal Studio's readiness view and the standalone Submission Check
// share this evaluation. Lenses beyond the core checks are non-blocking —
// they surface concerns a CFO/CIO/procurement/delivery/Oracle reviewer
// would raise, without pretending to be their sign-off.
import type { DealTwin } from "@/types/deal-twin";

export type CheckLens = "Core" | "CFO" | "CIO" | "Procurement" | "Delivery" | "Oracle";

export type CheckIssue = { id: string; label: string; lens: CheckLens; blocking: boolean };

export function evaluateSubmissionCheck(twin: DealTwin): { issues: CheckIssue[]; blockingIssues: CheckIssue[] } {
  const issues: CheckIssue[] = [];

  if (!twin.savedCommercialScenarioId) {
    issues.push({ id: "core-commercial", label: "No saved commercial position", lens: "Core", blocking: true });
  }
  if (twin.proofLinks.length === 0) {
    issues.push({ id: "core-proof", label: "No matched proof linked to this deal", lens: "Core", blocking: true });
  }
  const unresolvedPromises = twin.promises.filter((p) => p.commercialTrace === "Not priced" || p.commercialTrace === "Pending");
  if (unresolvedPromises.length > 0) {
    issues.push({
      id: "core-promises",
      label: `${unresolvedPromises.length} promise(s) not priced or pending`,
      lens: "Core",
      blocking: true,
    });
  }
  const openDependencies = twin.solution.dependencies.filter((d) => d.status === "Open");
  if (openDependencies.length > 0) {
    issues.push({
      id: "core-dependencies",
      label: `${openDependencies.length} open solution dependenc${openDependencies.length === 1 ? "y" : "ies"}`,
      lens: "Core",
      blocking: true,
    });
  }

  const savedScenario = twin.commercialScenarios.find((s) => s.id === twin.savedCommercialScenarioId);
  if (savedScenario && savedScenario.approvalExceptions.length > 0) {
    issues.push({ id: "cfo-exceptions", label: savedScenario.approvalExceptions.join("; "), lens: "CFO", blocking: false });
  }
  if (twin.commercialHeadline.currentMargin != null && twin.commercialHeadline.currentMargin < 15) {
    issues.push({ id: "cfo-margin", label: "Current margin is below a defensible floor", lens: "CFO", blocking: false });
  }

  if (twin.solution.components.some((c) => c.included) && twin.solution.exclusions.length === 0) {
    issues.push({ id: "cio-exclusions", label: "No exclusions defined for the included scope", lens: "CIO", blocking: false });
  }

  const handshakeOutstanding = twin.scopeHandshake.filter((h) => h.response !== "Confirmed");
  if (twin.scopeHandshake.length > 0 && handshakeOutstanding.length > 0) {
    issues.push({
      id: "proc-handshake",
      label: `${handshakeOutstanding.length} Scope Handshake item(s) not yet confirmed`,
      lens: "Procurement",
      blocking: false,
    });
  }

  const missingEffort = twin.solution.components.filter((c) => c.included && c.effortDays <= 0);
  if (missingEffort.length > 0) {
    issues.push({
      id: "delivery-effort",
      label: `${missingEffort.length} included component(s) with no estimated effort`,
      lens: "Delivery",
      blocking: false,
    });
  }

  const pendingAlliance = twin.allianceActions.filter((a) => !a.completed);
  if (pendingAlliance.length > 0) {
    issues.push({ id: "oracle-actions", label: `${pendingAlliance.length} unresolved Oracle action(s)`, lens: "Oracle", blocking: false });
  }

  return { issues, blockingIssues: issues.filter((i) => i.blocking) };
}
