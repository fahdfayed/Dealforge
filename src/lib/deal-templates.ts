// Pre-built templates for common deal scenarios
import { createEmptyDealTwin, type DealTwin, type EngagementType } from "@/types/deal-twin";

export type DealTemplate = {
  id: string;
  name: string;
  description: string;
  industryFocus: string[];
  engagementType: EngagementType | null;
};

export const DEAL_TEMPLATES: DealTemplate[] = [
  {
    id: "startup-cloud",
    name: "Startup → Cloud",
    description: "Fast-track cloud migration for early-stage SaaS startup",
    industryFocus: ["SaaS", "Tech"],
    engagementType: "OCI",
  },
  {
    id: "enterprise-ebs",
    name: "Enterprise EBS Upgrade",
    description: "Oracle EBS modernisation for large multinational",
    industryFocus: ["Manufacturing", "Retail", "Distribution"],
    engagementType: "EBS modernisation",
  },
  {
    id: "payroll-mena",
    name: "Multi-country Payroll",
    description: "Payroll localisation across MENA region",
    industryFocus: ["Manufacturing", "Retail", "Professional services"],
    engagementType: "HCM/payroll",
  },
  {
    id: "security-transform",
    name: "Security & Compliance",
    description: "End-to-end security architecture and compliance review",
    industryFocus: ["Finance", "Healthcare", "Government"],
    engagementType: "Security/SOD",
  },
];

export function createDealFromTemplate(template: DealTemplate, company: string, owner: string): DealTwin {
  const base = createEmptyDealTwin({ company, owner });

  // Pre-fill DNA based on template
  const updated: DealTwin = {
    ...base,
    dealDNA: {
      ...base.dealDNA,
      engagementType: template.engagementType,
      industry: template.industryFocus[0] || "",
    },
    identity: {
      ...base.identity,
      engagementTitle: `${template.name} — ${company}`,
    },
  };

  return updated;
}
