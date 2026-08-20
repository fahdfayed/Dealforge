// Starter component catalogue per engagement type, used to seed Solution
// Forge capabilities when a path is first built. Users can include/exclude,
// reprioritise, re-phase and add custom components afterward (doc 6.3).
import type { ComponentSource, EngagementType, Priority, SolutionComponent } from "@/types/deal-twin";
import { newId } from "@/lib/id";

export type ComponentTemplate = {
  // Stable identifier for the template. Component ids are minted fresh on every
  // build, so without this there is no way to tell whether a component already
  // came from a given template — which is what makes layering catalogues
  // (engagement plus industry) dedupable rather than duplicative.
  key: string;
  category: string;
  label: string;
  priority: Priority;
  effortDays: number;
  outcome: string;
  risk: "Low" | "Medium" | "High";
  // Explicit rather than derived from array position. Phase used to be
  // `i < 3 ? 1 : 2`, so appending a catalogue silently pushed everything after
  // the third entry into phase 2 regardless of what the work actually was.
  phase?: number;
};

const COMMON_TEMPLATES: ComponentTemplate[] = [
  { key: "project-governance-and-reporting", category: "Project Management", label: "Project governance and reporting", priority: "Required", effortDays: 15, outcome: "Controlled delivery cadence", risk: "Low" },
  { key: "formal-test-cycles-and-acceptance", category: "Testing", label: "Formal test cycles and acceptance", priority: "Required", effortDays: 12, outcome: "Validated solution before go-live", risk: "Medium" },
  { key: "end-user-training-and-adoption", category: "Change Management", label: "End-user training and adoption", priority: "Recommended", effortDays: 8, outcome: "Faster user adoption", risk: "Low" },
];

const ENGAGEMENT_TEMPLATES: Record<EngagementType, ComponentTemplate[]> = {
  "Fusion implementation": [
    { key: "fusion-financials-configuration", category: "Finance", label: "Fusion Financials configuration", priority: "Required", effortDays: 30, outcome: "Governed financial close", risk: "Medium" },
    { key: "fusion-hcm-core-configuration", category: "HCM", label: "Fusion HCM core configuration", priority: "Recommended", effortDays: 25, outcome: "Unified workforce data", risk: "Medium" },
    { key: "integration-design-and-build", category: "Integrations", label: "Integration design and build", priority: "Required", effortDays: 20, outcome: "Connected estate", risk: "High" },
    { key: "legacy-data-migration", category: "Data Migration", label: "Legacy data migration", priority: "Required", effortDays: 18, outcome: "Clean starting balances", risk: "High" },
    { key: "reporting-and-analytics-build", category: "Reporting", label: "Reporting and analytics build", priority: "Optional", effortDays: 10, outcome: "Management visibility", risk: "Low" },
  ],
  "EBS modernisation": [
    { key: "ebs-upgrade-patching", category: "Technical", label: "EBS upgrade / patching", priority: "Required", effortDays: 25, outcome: "Supported, current platform", risk: "Medium" },
    { key: "customisation-rationalisation", category: "Customisations", label: "Customisation rationalisation", priority: "Required", effortDays: 20, outcome: "Lower support burden", risk: "High" },
    { key: "environment-data-validation", category: "Data Migration", label: "Environment data validation", priority: "Recommended", effortDays: 10, outcome: "Trusted post-upgrade data", risk: "Medium" },
    { key: "apex-modernisation-of-custom-forms", category: "APEX", label: "APEX modernisation of custom forms", priority: "Optional", effortDays: 15, outcome: "Modern, supportable UI", risk: "Medium" },
  ],
  "Managed services": [
    { key: "support-model-and-sla-design", category: "Service Design", label: "Support model and SLA design", priority: "Required", effortDays: 10, outcome: "Clear ownership and SLAs", risk: "Low" },
    { key: "knowledge-transfer-and-transition", category: "Transition", label: "Knowledge transfer and transition", priority: "Required", effortDays: 12, outcome: "Clean handover to AMS team", risk: "Medium" },
    { key: "ticketing-and-monitoring-setup", category: "Tooling", label: "Ticketing and monitoring setup", priority: "Recommended", effortDays: 8, outcome: "Operational visibility", risk: "Low" },
  ],
  EPM: [
    { key: "consolidation-and-elimination-rules", category: "Consolidation", label: "Consolidation and elimination rules", priority: "Required", effortDays: 22, outcome: "Faster, governed close", risk: "Medium" },
    { key: "planning-and-budgeting-build", category: "Planning", label: "Planning and budgeting build", priority: "Recommended", effortDays: 18, outcome: "Integrated planning cycle", risk: "Medium" },
    { key: "narrative-and-statutory-reporting", category: "Reporting", label: "Narrative and statutory reporting", priority: "Optional", effortDays: 10, outcome: "Board-ready reporting", risk: "Low" },
  ],
  "HCM/payroll": [
    { key: "payroll-localisation-build", category: "Payroll", label: "Payroll localisation build", priority: "Required", effortDays: 28, outcome: "Compliant, accurate payroll", risk: "High" },
    { key: "core-hr-configuration", category: "HCM", label: "Core HR configuration", priority: "Required", effortDays: 20, outcome: "Single workforce record", risk: "Medium" },
    { key: "historical-payroll-data-migration", category: "Data Migration", label: "Historical payroll data migration", priority: "Required", effortDays: 15, outcome: "Continuity of employee history", risk: "High" },
    { key: "parallel-payroll-runs", category: "Testing", label: "Parallel payroll runs", priority: "Recommended", effortDays: 12, outcome: "Verified payroll accuracy", risk: "Medium" },
  ],
  "Security/SOD": [
    { key: "role-and-responsibility-redesign", category: "Security", label: "Role and responsibility redesign", priority: "Required", effortDays: 20, outcome: "Reduced SOD conflicts", risk: "Medium" },
    { key: "sod-ruleset-build-and-testing", category: "Security", label: "SOD ruleset build and testing", priority: "Required", effortDays: 15, outcome: "Auditable control set", risk: "Medium" },
    { key: "sso-identity-federation", category: "Identity", label: "SSO / identity federation", priority: "Optional", effortDays: 10, outcome: "Simplified access management", risk: "Low" },
  ],
  OCI: [
    { key: "landing-zone-and-network-design", category: "Infrastructure", label: "Landing zone and network design", priority: "Required", effortDays: 15, outcome: "Secure, compliant foundation", risk: "Medium" },
    { key: "workload-migration-and-cutover", category: "Migration", label: "Workload migration and cutover", priority: "Required", effortDays: 25, outcome: "Migrated production estate", risk: "High" },
    { key: "post-migration-performance-tuning", category: "Optimisation", label: "Post-migration performance tuning", priority: "Optional", effortDays: 8, outcome: "Right-sized cost and performance", risk: "Low" },
  ],
  "APEX/ECC": [
    { key: "custom-object-modernisation", category: "APEX", label: "Custom object modernisation", priority: "Required", effortDays: 22, outcome: "Supportable custom estate", risk: "Medium" },
    { key: "retirement-of-redundant-objects", category: "Rationalisation", label: "Retirement of redundant objects", priority: "Recommended", effortDays: 8, outcome: "Reduced technical debt", risk: "Low" },
    { key: "target-platform-build-out", category: "Platform", label: "Target platform build-out", priority: "Optional", effortDays: 12, outcome: "Modern hosting foundation", risk: "Medium" },
  ],
};

// The templates that apply to a deal: the engagement catalogue, the industry
// pack's add-ons, and the common set that applies to everything. Exported so
// the UI can show what an industry would contribute before committing to it.
export function templatesFor(
  engagementType: EngagementType,
  industryAddOns: ComponentTemplate[] = []
): Array<ComponentTemplate & { source: ComponentSource }> {
  const layered: Array<ComponentTemplate & { source: ComponentSource }> = [
    ...ENGAGEMENT_TEMPLATES[engagementType].map((t) => ({ ...t, source: "engagement" as const })),
    ...industryAddOns.map((t) => ({ ...t, source: "industry" as const })),
    ...COMMON_TEMPLATES.map((t) => ({ ...t, source: "common" as const })),
  ];

  // First occurrence wins, so an industry pack can override a common template
  // by reusing its key rather than producing a near-duplicate beside it.
  const seen = new Set<string>();
  return layered.filter((t) => (seen.has(t.key) ? false : (seen.add(t.key), true)));
}

export function buildComponentsForEngagement(
  engagementType: EngagementType,
  industryAddOns: ComponentTemplate[] = []
): SolutionComponent[] {
  return templatesFor(engagementType, industryAddOns).map((t) => ({
    id: newId(),
    templateKey: t.key,
    source: t.source,
    category: t.category,
    label: t.label,
    included: false,
    priority: t.priority,
    // Default to phase 1 for required work and phase 2 otherwise, rather than
    // by position in the array.
    phase: t.phase ?? (t.priority === "Required" ? 1 : 2),
    confidence: 60,
    authority: "Proposed",
    effortDays: t.effortDays,
    outcome: t.outcome,
    risk: t.risk,
    dependencyIds: [],
    custom: false,
  }));
}
