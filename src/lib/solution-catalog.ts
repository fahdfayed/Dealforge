// Starter component catalogue per engagement type, used to seed Solution
// Forge capabilities when a path is first built. Users can include/exclude,
// reprioritise, re-phase and add custom components afterward (doc 6.3).
import type { ComponentSource, EngagementType, Priority, SolutionComponent } from "@/types/deal-twin";
import { newId } from "@/lib/id";
import { localisationTemplates } from "@/lib/localisation";

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
  "APEX & VBCS": [
    { key: "custom-object-modernisation", category: "APEX", label: "Custom object modernisation", priority: "Required", effortDays: 22, outcome: "Supportable custom estate", risk: "Medium" },
    { key: "retirement-of-redundant-objects", category: "Rationalisation", label: "Retirement of redundant objects", priority: "Recommended", effortDays: 8, outcome: "Reduced technical debt", risk: "Low" },
    { key: "target-platform-build-out", category: "Platform", label: "Target platform build-out", priority: "Optional", effortDays: 12, outcome: "Modern hosting foundation", risk: "Medium" },
  ],
  ECC: [
    { key: "ecc-framework-deployment", category: "Platform", label: "ECC framework deployment and configuration", priority: "Required", effortDays: 15, outcome: "Command centers available on EBS", risk: "Medium", phase: 1 },
    { key: "ecc-dashboard-configuration", category: "Analytics", label: "Command center dashboard configuration", priority: "Required", effortDays: 12, outcome: "Operational visibility inside EBS", risk: "Low" },
    { key: "ecc-data-indexing", category: "Data", label: "Data set indexing and refresh scheduling", priority: "Required", effortDays: 10, outcome: "Dashboards backed by current data", risk: "Medium" },
    { key: "ecc-custom-extensions", category: "Analytics", label: "Custom command center extensions", priority: "Optional", effortDays: 14, outcome: "Sector-specific operational views", risk: "Medium", phase: 2 },
  ],
  Integration: [
    { key: "integration-architecture-and-design", category: "Integration", label: "Integration architecture and interface design", priority: "Required", effortDays: 18, outcome: "Agreed interface contracts before build", risk: "Medium", phase: 1 },
    { key: "oic-build-and-configuration", category: "Integration", label: "OIC integration build and configuration", priority: "Required", effortDays: 30, outcome: "Connected application estate", risk: "High" },
    { key: "integration-error-handling", category: "Integration", label: "Error handling, retry and monitoring", priority: "Required", effortDays: 12, outcome: "Failures visible and recoverable", risk: "Medium" },
    { key: "soa-bpel-retirement", category: "Migration", label: "SOA / BPEL retirement and migration", priority: "Optional", effortDays: 20, outcome: "Legacy middleware decommissioned", risk: "High", phase: 2 },
  ],
  "BI & Analytics": [
    { key: "reporting-requirements-and-kpi-design", category: "Analytics", label: "Reporting requirements and KPI definition", priority: "Required", effortDays: 14, outcome: "Agreed measures before any build", risk: "Low", phase: 1 },
    { key: "data-model-and-warehouse-build", category: "Data", label: "Data model and warehouse build", priority: "Required", effortDays: 28, outcome: "Governed reporting foundation", risk: "High" },
    { key: "etl-and-data-pipeline-build", category: "Data", label: "ETL and data pipeline build", priority: "Required", effortDays: 22, outcome: "Automated, repeatable data loads", risk: "High" },
    { key: "dashboard-and-report-build", category: "Analytics", label: "Dashboard and report build", priority: "Required", effortDays: 20, outcome: "Decision-ready reporting", risk: "Medium" },
    { key: "obiee-to-oac-migration", category: "Migration", label: "OBIEE to OAC migration", priority: "Optional", effortDays: 18, outcome: "Reporting on a supported platform", risk: "Medium", phase: 2 },
  ],
  "Database & Infrastructure": [
    { key: "environment-assessment-and-sizing", category: "Infrastructure", label: "Environment assessment and sizing", priority: "Required", effortDays: 10, outcome: "Right-sized target platform", risk: "Low", phase: 1 },
    { key: "database-provisioning-and-configuration", category: "Infrastructure", label: "Database provisioning and configuration", priority: "Required", effortDays: 15, outcome: "Running target databases", risk: "Medium" },
    { key: "backup-and-disaster-recovery-setup", category: "Resilience", label: "Backup and disaster recovery setup", priority: "Required", effortDays: 14, outcome: "Recoverable within agreed RTO and RPO", risk: "High" },
    { key: "patching-and-maintenance-runbook", category: "Operations", label: "Patching and maintenance runbook", priority: "Recommended", effortDays: 8, outcome: "Repeatable maintenance without heroics", risk: "Low" },
    { key: "database-performance-tuning", category: "Optimisation", label: "Performance tuning and monitoring", priority: "Optional", effortDays: 10, outcome: "Predictable performance under load", risk: "Low", phase: 2 },
  ],
  "Testing & QA": [
    { key: "test-strategy-and-scenario-design", category: "Testing", label: "Test strategy and scenario design", priority: "Required", effortDays: 12, outcome: "Agreed coverage before execution", risk: "Low", phase: 1 },
    { key: "automation-framework-setup", category: "Testing", label: "Automation framework setup", priority: "Required", effortDays: 18, outcome: "Repeatable regression runs", risk: "Medium" },
    { key: "regression-suite-build", category: "Testing", label: "Regression suite build", priority: "Required", effortDays: 22, outcome: "Update-ready regression pack", risk: "Medium" },
    { key: "performance-and-load-testing", category: "Testing", label: "Performance and load testing", priority: "Optional", effortDays: 12, outcome: "Validated behaviour at peak load", risk: "Medium", phase: 2 },
    { key: "risk-analysis-and-defect-reporting", category: "Quality", label: "Risk analysis and defect reporting", priority: "Recommended", effortDays: 8, outcome: "Visible quality position before go-live", risk: "Low" },
  ],
  // Deliberately short. This is a people engagement, not a build: effort is the
  // resources themselves, priced per month, not a component breakdown. Padding
  // it with implementation-shaped components would produce a misleading
  // estimate, so only genuine setup work is listed.
  "Staff augmentation / AMS": [
    { key: "resource-onboarding-and-access", category: "Onboarding", label: "Resource onboarding and system access", priority: "Required", effortDays: 5, outcome: "Team productive from week one", risk: "Low", phase: 1 },
    { key: "knowledge-transfer-and-shadowing", category: "Enablement", label: "Knowledge transfer and shadowing", priority: "Required", effortDays: 10, outcome: "Context held by the team, not one individual", risk: "Medium" },
    { key: "service-governance-and-reporting", category: "Governance", label: "Service governance and reporting cadence", priority: "Required", effortDays: 6, outcome: "Delivery visible against agreed SLA", risk: "Low" },
  ],
};

// Custom APEX and VBCS extension patterns.
//
// These are a differentiator we sell alongside implementation work, and they
// recur across sectors — an approval engine on AME/PCS is the same build for a
// contractor as for an insurer. Holding them once here rather than repeating
// them in every industry pack means a change to how we scope an extension is a
// change in one place.
//
// Every template starts excluded (buildComponentsForEngagement sets
// included: false), so offering these does not inflate an estimate. They are
// options a consultant can turn on, not assumptions.
export const APEX_EXTENSION_TEMPLATES: ComponentTemplate[] = [
  { key: "apex-ext-approval-workflow", category: "Workflow", label: "Approval workflow on Oracle AME / PCS", priority: "Optional", effortDays: 14, outcome: "Approvals routed and audited in-system", risk: "Medium", phase: 2 },
  { key: "apex-ext-core-integration", category: "Integrations", label: "APEX integration to EBS / Fusion (ISG, OIC, REST)", priority: "Optional", effortDays: 12, outcome: "Extension reads and writes core data safely", risk: "Medium", phase: 2 },
  { key: "apex-ext-dashboards", category: "Analytics", label: "Interactive dashboards and reporting", priority: "Optional", effortDays: 10, outcome: "Operational reporting without a BI programme", risk: "Low", phase: 2 },
  { key: "apex-ext-data-security", category: "Security", label: "Document and data encryption", priority: "Optional", effortDays: 8, outcome: "Sensitive records protected at rest", risk: "Medium", phase: 2 },
  { key: "apex-ext-ocr-capture", category: "Automation", label: "OCR document capture", priority: "Optional", effortDays: 12, outcome: "Paper and PDF input captured without rekeying", risk: "Medium", phase: 2 },
  { key: "apex-ext-rpa", category: "Automation", label: "RPA process automation", priority: "Optional", effortDays: 14, outcome: "Repetitive steps run unattended", risk: "Medium", phase: 2 },
  { key: "apex-ext-genai", category: "Automation", label: "GenAI assistance inside the process", priority: "Optional", effortDays: 12, outcome: "Drafting and summarisation where the work happens", risk: "High", phase: 2 },
  { key: "apex-ext-self-service-portal", category: "APEX", label: "External self-service portal", priority: "Optional", effortDays: 20, outcome: "Third parties transact without back-office rekeying", risk: "Medium", phase: 2 },
];

// Engagements that have a Fusion or EBS estate worth extending. Offering APEX
// options on a staff augmentation or database engagement would be noise on a
// screen whose whole problem was having too much on it.
// Engagements that configure the application, and therefore carry statutory
// scope. A testing cycle or a database migration in the UAE does not build VAT
// returns, so offering those components there would be noise.
const CONFIGURES_STATUTORY_SCOPE: ReadonlySet<EngagementType> = new Set<EngagementType>([
  "Fusion implementation",
  "EBS modernisation",
  "HCM/payroll",
]);

const APEX_EXTENSIBLE: ReadonlySet<EngagementType> = new Set<EngagementType>([
  "Fusion implementation",
  "EBS modernisation",
  "APEX & VBCS",
  "ECC",
  "Integration",
  "HCM/payroll",
]);

// The templates that apply to a deal: the engagement catalogue, the industry
// pack's add-ons, and the common set that applies to everything. Exported so
// the UI can show what an industry would contribute before committing to it.
export function templatesFor(
  engagementType: EngagementType,
  industryAddOns: ComponentTemplate[] = [],
  countries: string[] = []
): Array<ComponentTemplate & { source: ComponentSource }> {
  const layered: Array<ComponentTemplate & { source: ComponentSource }> = [
    ...ENGAGEMENT_TEMPLATES[engagementType].map((t) => ({ ...t, source: "engagement" as const })),
    ...industryAddOns.map((t) => ({ ...t, source: "industry" as const })),
    ...(CONFIGURES_STATUTORY_SCOPE.has(engagementType)
      ? localisationTemplates(countries).map((t) => ({ ...t, source: "localisation" as const }))
      : []),
    ...(APEX_EXTENSIBLE.has(engagementType)
      ? APEX_EXTENSION_TEMPLATES.map((t) => ({ ...t, source: "apex" as const }))
      : []),
    ...COMMON_TEMPLATES.map((t) => ({ ...t, source: "common" as const })),
  ];

  // First occurrence wins, so an industry pack can override a common template
  // by reusing its key rather than producing a near-duplicate beside it.
  const seen = new Set<string>();
  return layered.filter((t) => (seen.has(t.key) ? false : (seen.add(t.key), true)));
}

export function buildComponentsForEngagement(
  engagementType: EngagementType,
  industryAddOns: ComponentTemplate[] = [],
  countries: string[] = []
): SolutionComponent[] {
  return templatesFor(engagementType, industryAddOns, countries).map((t) => ({
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
