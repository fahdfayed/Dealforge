// Starter component catalogue per engagement type, used to seed Solution
// Forge capabilities when a path is first built. Users can include/exclude,
// reprioritise, re-phase and add custom components afterward (doc 6.3).
import type { EngagementType, Priority, SolutionComponent } from "@/types/deal-twin";

export type ComponentTemplate = {
  category: string;
  label: string;
  priority: Priority;
  effortDays: number;
  outcome: string;
  risk: "Low" | "Medium" | "High";
};

const COMMON_TEMPLATES: ComponentTemplate[] = [
  { category: "Project Management", label: "Project governance and reporting", priority: "Required", effortDays: 15, outcome: "Controlled delivery cadence", risk: "Low" },
  { category: "Testing", label: "Formal test cycles and acceptance", priority: "Required", effortDays: 12, outcome: "Validated solution before go-live", risk: "Medium" },
  { category: "Change Management", label: "End-user training and adoption", priority: "Recommended", effortDays: 8, outcome: "Faster user adoption", risk: "Low" },
];

const ENGAGEMENT_TEMPLATES: Record<EngagementType, ComponentTemplate[]> = {
  "Fusion implementation": [
    { category: "Finance", label: "Fusion Financials configuration", priority: "Required", effortDays: 30, outcome: "Governed financial close", risk: "Medium" },
    { category: "HCM", label: "Fusion HCM core configuration", priority: "Recommended", effortDays: 25, outcome: "Unified workforce data", risk: "Medium" },
    { category: "Integrations", label: "Integration design and build", priority: "Required", effortDays: 20, outcome: "Connected estate", risk: "High" },
    { category: "Data Migration", label: "Legacy data migration", priority: "Required", effortDays: 18, outcome: "Clean starting balances", risk: "High" },
    { category: "Reporting", label: "Reporting and analytics build", priority: "Optional", effortDays: 10, outcome: "Management visibility", risk: "Low" },
  ],
  "EBS modernisation": [
    { category: "Technical", label: "EBS upgrade / patching", priority: "Required", effortDays: 25, outcome: "Supported, current platform", risk: "Medium" },
    { category: "Customisations", label: "Customisation rationalisation", priority: "Required", effortDays: 20, outcome: "Lower support burden", risk: "High" },
    { category: "Data Migration", label: "Environment data validation", priority: "Recommended", effortDays: 10, outcome: "Trusted post-upgrade data", risk: "Medium" },
    { category: "APEX", label: "APEX modernisation of custom forms", priority: "Optional", effortDays: 15, outcome: "Modern, supportable UI", risk: "Medium" },
  ],
  "Managed services": [
    { category: "Service Design", label: "Support model and SLA design", priority: "Required", effortDays: 10, outcome: "Clear ownership and SLAs", risk: "Low" },
    { category: "Transition", label: "Knowledge transfer and transition", priority: "Required", effortDays: 12, outcome: "Clean handover to AMS team", risk: "Medium" },
    { category: "Tooling", label: "Ticketing and monitoring setup", priority: "Recommended", effortDays: 8, outcome: "Operational visibility", risk: "Low" },
  ],
  EPM: [
    { category: "Consolidation", label: "Consolidation and elimination rules", priority: "Required", effortDays: 22, outcome: "Faster, governed close", risk: "Medium" },
    { category: "Planning", label: "Planning and budgeting build", priority: "Recommended", effortDays: 18, outcome: "Integrated planning cycle", risk: "Medium" },
    { category: "Reporting", label: "Narrative and statutory reporting", priority: "Optional", effortDays: 10, outcome: "Board-ready reporting", risk: "Low" },
  ],
  "HCM/payroll": [
    { category: "Payroll", label: "Payroll localisation build", priority: "Required", effortDays: 28, outcome: "Compliant, accurate payroll", risk: "High" },
    { category: "HCM", label: "Core HR configuration", priority: "Required", effortDays: 20, outcome: "Single workforce record", risk: "Medium" },
    { category: "Data Migration", label: "Historical payroll data migration", priority: "Required", effortDays: 15, outcome: "Continuity of employee history", risk: "High" },
    { category: "Testing", label: "Parallel payroll runs", priority: "Recommended", effortDays: 12, outcome: "Verified payroll accuracy", risk: "Medium" },
  ],
  "Security/SOD": [
    { category: "Security", label: "Role and responsibility redesign", priority: "Required", effortDays: 20, outcome: "Reduced SOD conflicts", risk: "Medium" },
    { category: "Security", label: "SOD ruleset build and testing", priority: "Required", effortDays: 15, outcome: "Auditable control set", risk: "Medium" },
    { category: "Identity", label: "SSO / identity federation", priority: "Optional", effortDays: 10, outcome: "Simplified access management", risk: "Low" },
  ],
  OCI: [
    { category: "Infrastructure", label: "Landing zone and network design", priority: "Required", effortDays: 15, outcome: "Secure, compliant foundation", risk: "Medium" },
    { category: "Migration", label: "Workload migration and cutover", priority: "Required", effortDays: 25, outcome: "Migrated production estate", risk: "High" },
    { category: "Optimisation", label: "Post-migration performance tuning", priority: "Optional", effortDays: 8, outcome: "Right-sized cost and performance", risk: "Low" },
  ],
  "APEX/ECC": [
    { category: "APEX", label: "Custom object modernisation", priority: "Required", effortDays: 22, outcome: "Supportable custom estate", risk: "Medium" },
    { category: "Rationalisation", label: "Retirement of redundant objects", priority: "Recommended", effortDays: 8, outcome: "Reduced technical debt", risk: "Low" },
    { category: "Platform", label: "Target platform build-out", priority: "Optional", effortDays: 12, outcome: "Modern hosting foundation", risk: "Medium" },
  ],
};

export function buildComponentsForEngagement(engagementType: EngagementType): SolutionComponent[] {
  const templates = [...ENGAGEMENT_TEMPLATES[engagementType], ...COMMON_TEMPLATES];
  return templates.map((t, i) => ({
    id: crypto.randomUUID(),
    category: t.category,
    label: t.label,
    included: false,
    priority: t.priority,
    phase: i < 3 ? 1 : 2,
    confidence: 60,
    authority: "Proposed",
    effortDays: t.effortDays,
    outcome: t.outcome,
    risk: t.risk,
    dependencyIds: [],
    custom: false,
  }));
}
