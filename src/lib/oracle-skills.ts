// The skills we actually staff for.
//
// Taken from the Oracle stack in the corporate profile rather than a generic
// IT skill list, because the repository is only useful if a recruiter can
// filter to "Fusion PPM, five years, available inside a month" and get a
// truthful answer. A free-text skill box produces "Oracle", "oracle fusion"
// and "Fusion ERP" as three different skills and the filter stops working.
//
// Grouped so the picker stays navigable at forty-odd entries.

export type SkillGroup = {
  group: string;
  skills: string[];
};

export const ORACLE_SKILL_GROUPS: SkillGroup[] = [
  {
    group: "Oracle Fusion",
    skills: [
      "Fusion Financials",
      "Fusion Procurement",
      "Fusion SCM",
      "Fusion Manufacturing",
      "Fusion PPM",
      "Fusion PLM",
      "Fusion HCM",
      "Fusion Payroll",
      "Fusion Redwood / UX",
    ],
  },
  {
    group: "Oracle EBS",
    skills: [
      "EBS Financials",
      "EBS Procurement",
      "EBS Projects",
      "EBS Order Management",
      "EBS Manufacturing",
      "EBS HCM",
      "EBS Payroll",
      "EBS Service",
      "EBS Logistics / WMS",
      "EBS Asset Lifecycle",
      "EBS Transportation",
      "EBS PLM",
      "Oracle Forms / Reports",
      "OAF",
    ],
  },
  {
    group: "Integration",
    skills: ["OIC", "BPEL / SOA Suite", "REST / SOAP services", "ISG", "Data migration (FBDI / ADFdi)"],
  },
  {
    group: "Development & low-code",
    skills: ["Oracle APEX", "VBCS", "PL/SQL", "Java", "Groovy / Fast Formula"],
  },
  {
    group: "Analytics & EPM",
    skills: ["OAC", "OBIEE", "ODI / ODICS", "Hyperion", "BI Publisher", "EPM Planning", "EPM Consolidation"],
  },
  {
    group: "Database & infrastructure",
    skills: ["Oracle DBA", "OCI", "DBCS / ATP / ADW", "Disaster recovery", "Linux / OS administration"],
  },
  {
    group: "Governance & quality",
    skills: ["Security / SOD", "Functional testing", "Test automation (Selenium)", "Project management", "Business analysis"],
  },
];

export const ORACLE_SKILLS: string[] = ORACLE_SKILL_GROUPS.flatMap((g) => g.skills);

const SKILL_SET = new Set(ORACLE_SKILLS.map((s) => s.toLowerCase()));

// Imported or pasted skills are checked against the catalogue rather than
// trusted. An unrecognised skill is dropped rather than stored, so a typo
// cannot create a near-duplicate that splits search results.
export function knownSkills(values: string[]): string[] {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const value of values) {
    const match = ORACLE_SKILLS.find((s) => s.toLowerCase() === value.trim().toLowerCase());
    if (match && !seen.has(match)) {
      seen.add(match);
      kept.push(match);
    }
  }
  return kept;
}

export function isKnownSkill(value: string): boolean {
  return SKILL_SET.has(value.trim().toLowerCase());
}

// Candidate lifecycle. "Do not contact" is deliberately a status rather than a
// deletion: the reason someone must not be approached is exactly the thing a
// recruiter needs to see before approaching them again.
export const CANDIDATE_STATUSES = [
  "Active",
  "In process",
  "Placed",
  "On hold",
  "Do not contact",
  "Archived",
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const CANDIDATE_SOURCES = [
  "Referral",
  "Vendor",
  "Job board",
  "LinkedIn",
  "Inbound application",
  "Internal / bench",
  "Previous applicant",
] as const;
export type CandidateSource = (typeof CANDIDATE_SOURCES)[number];

// Ali asked for soft skills and communication to be captured at first contact
// rather than discovered at client interview. A controlled rating makes it
// reportable; the free-text note beside it carries what the rating cannot.
export const COMMUNICATION_RATINGS = [
  "Excellent",
  "Good",
  "Adequate",
  "Needs support",
  "Not assessed",
] as const;
export type CommunicationRating = (typeof COMMUNICATION_RATINGS)[number];

export const RATE_UNITS = ["Per hour", "Per day", "Per month", "Per year"] as const;
export type RateUnit = (typeof RATE_UNITS)[number];
