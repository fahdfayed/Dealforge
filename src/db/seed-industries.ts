// Authored industry packs.
//
// We sell one catalogue of Oracle services; what changes between clients is the
// sector they operate in. Each pack says what that sector adds to a pursuit:
// discovery questions worth asking, solution components worth pricing, scoring
// weights worth shifting, and tags for matching past proof.
//
// This seeds the starting set. Packs are data, so they are edited in the admin
// UI afterwards rather than here.
import { db } from "@/db/client";
import { industries, industryPacks } from "@/db/schema";
import type { IndustryPack } from "@/lib/industry-packs";
import { EMPTY_PACK } from "@/lib/industry-packs";
import type { Question } from "@/lib/questions";
import type { ComponentTemplate } from "@/lib/solution-catalog";

type Seed = {
  id: string;
  name: string;
  // Retired industries stay seeded but inactive. Their packs must remain in the
  // table because a question id is resolved back to its definition by scanning
  // every cached pack (getAllCachedPacks), so deleting a retired pack would
  // orphan answers already captured against it on live deals.
  active?: boolean;
  pack: Partial<IndustryPack>;
};

const q = (
  id: string,
  module: string,
  text: string,
  inputType: Question["inputType"],
  options: string[] | undefined,
  critical = false
): Question => ({ id, module, text, inputType, options, critical });

const c = (
  key: string,
  category: string,
  label: string,
  priority: ComponentTemplate["priority"],
  effortDays: number,
  outcome: string,
  risk: ComponentTemplate["risk"],
  phase?: number
): ComponentTemplate => ({ key, category, label, priority, effortDays, outcome, risk, phase });

export const INDUSTRY_SEEDS: Seed[] = [
  {
    id: "construction",
    name: "Construction",
    pack: {
      questions: [
        q("ind-construction-1", "Construction", "Project accounting model", "single",
          ["Oracle Projects", "Job costing in GL", "External system of record", "Not yet decided"], true),
        q("ind-construction-2", "Construction", "Retention handling required on customer or subcontract terms?", "single",
          ["Both customer and subcontract", "Customer only", "Subcontract only", "Not required"]),
        q("ind-construction-3", "Construction", "Subcontractor applications for payment and certificates in scope?", "single",
          ["Yes — full certification workflow", "Yes — simple approval only", "No"]),
        q("ind-construction-4", "Construction", "Plant and equipment register in scope?", "single",
          ["Yes — with utilisation costing", "Yes — register only", "No"]),
        q("ind-construction-5", "Construction", "Customer billing model", "multiple",
          ["Progress / milestone", "Cost plus", "Remeasurement", "Fixed lump sum"]),
        q("ind-construction-6", "Construction", "Joint venture or consortium accounting required?", "single",
          ["Yes", "No", "Unknown"]),
        q("ind-construction-7", "Construction", "Concurrent active projects at go-live", "number", undefined),
      ],
      componentAddOns: [
        c("construction-projects", "Finance", "Oracle Projects costing and billing configuration", "Required", 28, "Project-level cost and revenue control", "High", 1),
        c("construction-subcontract", "Procurement", "Subcontract and payment certificate handling", "Recommended", 15, "Controlled subcontractor spend", "Medium"),
        c("construction-retention", "Finance", "Retention and WIP configuration", "Recommended", 10, "Retention tracked to contract terms", "Medium"),
        c("construction-plant", "Assets", "Plant and equipment register", "Optional", 12, "Equipment utilisation visible", "Low"),
      ],
      // Project-heavy clients carry more structural complexity per operating
      // entity than the default assumes: each site behaves like its own book.
      scoringModifiers: { complexityPerEntity: 5 },
      proofTags: ["construction", "engineering", "projects"],
    },
  },
  {
    id: "healthcare",
    name: "Healthcare",
    pack: {
      questions: [
        q("ind-healthcare-1", "Healthcare", "Patient-identifiable data in scope for this engagement?", "single",
          ["Yes — in scope", "No — de-identified only", "No — no patient data"], true),
        q("ind-healthcare-2", "Healthcare", "Clinical systems requiring integration", "multiple",
          ["EHR / EMR", "PACS", "Laboratory (LIS)", "Pharmacy", "None"]),
        q("ind-healthcare-3", "Healthcare", "Applicable regulatory frameworks", "multiple",
          ["HIPAA", "GDPR", "Local health authority", "Accreditation body", "None identified"], true),
        q("ind-healthcare-4", "Healthcare", "Workforce rostering and credentialing in scope?", "single",
          ["Yes — rostering and credentialing", "Yes — credentialing only", "No"]),
        q("ind-healthcare-5", "Healthcare", "Lot and expiry tracking required for medical supplies?", "single",
          ["Yes", "No", "Unknown"]),
        q("ind-healthcare-6", "Healthcare", "Grant or restricted-fund accounting required?", "single",
          ["Yes", "No", "Unknown"]),
      ],
      componentAddOns: [
        c("healthcare-phi", "Compliance", "Patient data handling, masking and access control", "Required", 18, "Patient data protected and auditable", "High", 1),
        c("healthcare-clinical-integration", "Integrations", "Clinical system integration (EHR/EMR)", "Required", 25, "Clinical and administrative data aligned", "High", 1),
        c("healthcare-lot-expiry", "Supply Chain", "Lot and expiry enabled inventory", "Recommended", 12, "Traceable medical supply handling", "Medium"),
        c("healthcare-rostering", "HCM", "Rostering and credentialing configuration", "Recommended", 16, "Qualified staff scheduled safely", "Medium"),
      ],
      // Evidence quality carries more weight where a wrong assumption is a
      // compliance failure, and clinical integrations are harder than average.
      scoringModifiers: { winIntegrity: 0.2, winCoverage: 0.18, complexityPerIntegration: 6 },
      requiredGates: ["submission"],
      proofTags: ["healthcare", "clinical", "patient-data"],
    },
  },
  {
    id: "government",
    name: "Government",
    pack: {
      questions: [
        q("ind-government-1", "Government", "Budgetary control and encumbrance accounting required?", "single",
          ["Yes — full encumbrance", "Yes — budget checking only", "No"], true),
        q("ind-government-2", "Government", "Fund accounting required?", "single", ["Yes", "No", "Unknown"]),
        q("ind-government-3", "Government", "Procurement regulation regime", "single",
          ["National public procurement", "Multilateral / donor funded", "Sector-specific", "Not yet confirmed"]),
        q("ind-government-4", "Government", "Security clearance required for delivery staff?", "single",
          ["Yes — national clearance", "Yes — basic vetting", "No"], true),
        q("ind-government-5", "Government", "Data residency constraint", "single",
          ["In-country only", "Regional", "None stated", "Unknown"], true),
        q("ind-government-6", "Government", "Public transparency or audit publication obligations?", "single",
          ["Yes", "No", "Unknown"]),
        q("ind-government-7", "Government", "Grant or subsidy disbursement in scope?", "single",
          ["Yes — with eligibility rules", "Yes — payment only", "No"]),
        q("ind-government-8", "Government", "Citizen or vendor self-service portal required?", "single",
          ["Yes", "No", "Unknown"]),
        q("ind-government-9", "Government", "Government e-procurement platform to integrate", "single",
          ["Yes — national platform", "Yes — sector platform", "No", "Unknown"], true),
      ],
      componentAddOns: [
        c("government-encumbrance", "Finance", "Budgetary control and encumbrance setup", "Required", 22, "Spend controlled against appropriation", "High", 1),
        c("government-fund-accounting", "Finance", "Fund accounting configuration", "Recommended", 15, "Funds reported separately", "Medium"),
        c("government-audit", "Compliance", "Procurement compliance and audit reporting", "Recommended", 12, "Audit-ready procurement trail", "Medium"),
        c("government-eprocurement-integration", "Integrations", "Government e-procurement platform integration", "Recommended", 18, "Tenders and awards flow into finance", "High"),
        c("government-self-service-portal", "APEX", "Citizen or vendor self-service portal", "Optional", 20, "Requests handled without back-office rekeying", "Medium", 2),
      ],
      scoringModifiers: { winCoverage: 0.18, complexityPerCountry: 10 },
      requiredGates: ["submission"],
      proofTags: ["government", "public-sector"],
    },
  },
  {
    id: "public-sector",
    name: "Public Sector",
    // Retired: a strictly weaker duplicate of Government — three questions
    // against six, the same proof tags, and no deal is sensibly one and not the
    // other. Deals are repointed by migrate-industry-merges; the pack stays so
    // answers already captured against these ids still resolve.
    active: false,
    pack: {
      questions: [
        q("ind-public-sector-1", "Public Sector", "Budgetary control required?", "single", ["Yes", "No", "Unknown"], true),
        q("ind-public-sector-2", "Public Sector", "Procurement regulation regime", "single",
          ["National public procurement", "Framework / panel", "Sector-specific", "Not yet confirmed"]),
        q("ind-public-sector-3", "Public Sector", "Data residency constraint", "single",
          ["In-country only", "Regional", "None stated", "Unknown"], true),
      ],
      componentAddOns: [
        c("public-sector-budget-control", "Finance", "Budgetary control setup", "Recommended", 18, "Spend controlled against budget", "Medium"),
        c("public-sector-audit", "Compliance", "Compliance and audit reporting", "Recommended", 10, "Audit-ready reporting", "Medium"),
      ],
      proofTags: ["public-sector", "government"],
    },
  },
  {
    id: "financial-services",
    name: "Banking & Financial Services",
    pack: {
      questions: [
        q("ind-financial-services-1", "Financial Services", "Regulatory reporting regimes in scope", "multiple",
          ["Central bank", "IFRS", "Local GAAP", "Basel-related", "None identified"], true),
        q("ind-financial-services-2", "Financial Services", "Dual GAAP or multi-ledger reporting required?", "single",
          ["Yes", "No", "Unknown"]),
        q("ind-financial-services-3", "Financial Services", "Sub-ledger transactions per month", "number", undefined),
        q("ind-financial-services-4", "Financial Services", "Regulator approval required before system change?", "single",
          ["Yes", "No", "Unknown"], true),
        q("ind-financial-services-5", "Financial Services", "Data residency constraint", "single",
          ["In-country only", "Regional", "None stated", "Unknown"]),
        // Absorbed from the retired Banking pack. Ids are unchanged so answers
        // captured before the merge still resolve. Banking's regulator-approval
        // question is not carried over — ind-financial-services-4 already asks it.
        q("ind-banking-1", "Banking & Financial Services", "Core banking system to integrate", "single",
          ["Flexcube", "Temenos", "Finacle", "Other", "None"]),
        q("ind-banking-3", "Banking & Financial Services", "Daily transaction volume", "number", undefined),
      ],
      componentAddOns: [
        c("fs-regulatory-reporting", "Finance", "Regulatory reporting configuration", "Required", 20, "Reporting obligations met", "High", 1),
        c("fs-multi-ledger", "Finance", "Dual GAAP / multi-ledger setup", "Recommended", 16, "Parallel reporting bases", "Medium"),
        c("fs-volume-tuning", "Technical", "High-volume sub-ledger tuning", "Recommended", 12, "Period close within window", "Medium"),
        c("banking-core-integration", "Integrations", "Core banking integration", "Recommended", 25, "Banking and finance aligned", "High"),
      ],
      scoringModifiers: { winIntegrity: 0.2 },
      proofTags: ["financial-services", "banking", "regulated"],
    },
  },
  {
    id: "banking",
    name: "Banking",
    // Retired: merged into Banking & Financial Services, which now carries its
    // core-banking and volume questions under their original ids.
    active: false,
    pack: {
      questions: [
        q("ind-banking-1", "Banking", "Core banking system to integrate", "single",
          ["Flexcube", "Temenos", "Finacle", "Other", "None"]),
        q("ind-banking-2", "Banking", "Regulator approval required before system change?", "single",
          ["Yes", "No", "Unknown"], true),
        q("ind-banking-3", "Banking", "Daily transaction volume", "number", undefined),
      ],
      componentAddOns: [
        c("banking-core-integration", "Integrations", "Core banking integration", "Required", 25, "Banking and finance aligned", "High", 1),
        c("banking-reg-reporting", "Finance", "Regulatory reporting configuration", "Required", 18, "Reporting obligations met", "High"),
      ],
      scoringModifiers: { winIntegrity: 0.2, complexityPerIntegration: 6 },
      proofTags: ["banking", "financial-services", "regulated"],
    },
  },
  {
    id: "insurance",
    name: "Insurance",
    pack: {
      questions: [
        q("ind-insurance-1", "Insurance", "Policy administration system to integrate", "single",
          ["Yes — single system", "Yes — multiple systems", "No"]),
        q("ind-insurance-2", "Insurance", "Claims handling in scope?", "single", ["Yes", "No", "Unknown"]),
        q("ind-insurance-3", "Insurance", "Reinsurance accounting required?", "single", ["Yes", "No", "Unknown"]),
        q("ind-insurance-4", "Insurance", "Actuarial reserve reporting in scope?", "single", ["Yes", "No", "Unknown"]),
        q("ind-insurance-5", "Insurance", "Lines of business in scope", "multiple",
          ["Motor", "Medical / health", "Property & casualty", "Life", "Marine", "Takaful"], true),
        q("ind-insurance-6", "Insurance", "IFRS 17 reporting in scope?", "single",
          ["Yes — part of this programme", "Already implemented", "No", "Unknown"], true),
        q("ind-insurance-7", "Insurance", "Takaful or Sharia-compliant fund accounting required?", "single",
          ["Yes", "No", "Unknown"]),
        q("ind-insurance-8", "Insurance", "Broker commission and settlement in scope?", "single", ["Yes", "No", "Unknown"]),
        q("ind-insurance-9", "Insurance", "Premium receivables and collections in scope?", "single", ["Yes", "No", "Unknown"]),
      ],
      componentAddOns: [
        c("insurance-policy-integration", "Integrations", "Policy administration integration", "Required", 22, "Policy and finance aligned", "High", 1),
        c("insurance-claims", "Finance", "Claims settlement accounting", "Recommended", 15, "Claims tracked to ledger", "Medium"),
        c("insurance-reinsurance", "Finance", "Reinsurance accounting configuration", "Optional", 14, "Ceded risk accounted", "Medium"),
        c("insurance-ifrs17", "Finance", "IFRS 17 reporting configuration", "Recommended", 24, "Insurance contract reporting compliant", "High", 1),
        c("insurance-takaful", "Finance", "Takaful fund accounting", "Optional", 14, "Participant and shareholder funds separated", "Medium"),
        c("insurance-broker-settlement", "Finance", "Broker commission and settlement", "Optional", 12, "Intermediary balances reconciled", "Medium"),
      ],
      scoringModifiers: { winIntegrity: 0.18 },
      proofTags: ["insurance", "financial-services", "regulated"],
    },
  },
  {
    id: "defence",
    name: "Defence",
    pack: {
      questions: [
        q("ind-defence-1", "Defence", "Security clearance level required for delivery staff", "single",
          ["National top-level", "Mid-level", "Basic vetting", "None"], true),
        q("ind-defence-2", "Defence", "Export control or ITAR constraints apply?", "single",
          ["Yes", "No", "Unknown"], true),
        q("ind-defence-3", "Defence", "Deployment model constraint", "single",
          ["Air-gapped on-premise", "Sovereign cloud", "Standard cloud", "Unknown"], true),
        q("ind-defence-4", "Defence", "Programme cost accounting standard required?", "single",
          ["Yes", "No", "Unknown"]),
      ],
      componentAddOns: [
        c("defence-sovereign-deploy", "Technical", "Sovereign or air-gapped deployment", "Required", 30, "Deployment meets security constraint", "High", 1),
        c("defence-programme-accounting", "Finance", "Programme cost accounting", "Recommended", 18, "Contract costs traceable", "Medium"),
        c("defence-cleared-staffing", "Project Management", "Cleared-staff resourcing and vetting management", "Required", 10, "Only cleared staff assigned", "High", 1),
      ],
      scoringModifiers: { winCoverage: 0.18, winIntegrity: 0.18 },
      requiredGates: ["submission"],
      proofTags: ["defence", "government", "regulated"],
    },
  },
  {
    id: "retail",
    name: "Retail",
    pack: {
      questions: [
        q("ind-retail-1", "Retail", "Stores or outlets in scope", "number", undefined),
        q("ind-retail-2", "Retail", "Point of sale system to integrate", "single",
          ["Yes — single platform", "Yes — multiple platforms", "No"]),
        q("ind-retail-3", "Retail", "Active SKUs", "number", undefined),
        q("ind-retail-4", "Retail", "Omnichannel order management in scope?", "single", ["Yes", "No", "Unknown"]),
        q("ind-retail-5", "Retail", "Seasonal peak handling requirements?", "single",
          ["Significant peak", "Moderate", "None"]),
      ],
      componentAddOns: [
        c("retail-pos-integration", "Integrations", "Point of sale integration", "Required", 20, "Store sales flow to finance", "High", 1),
        c("retail-inventory", "Supply Chain", "High-volume inventory configuration", "Recommended", 16, "Stock accurate across outlets", "Medium"),
        c("retail-omnichannel", "Supply Chain", "Omnichannel order management", "Optional", 18, "Single view of the order", "High"),
      ],
      proofTags: ["retail", "consumer"],
    },
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    pack: {
      questions: [
        q("ind-manufacturing-1", "Manufacturing", "Manufacturing mode", "single",
          ["Discrete", "Process", "Mixed mode", "Not yet confirmed"], true),
        q("ind-manufacturing-2", "Manufacturing", "Bill of material levels", "number", undefined),
        q("ind-manufacturing-3", "Manufacturing", "Shop floor or MES integration in scope?", "single",
          ["Yes", "No", "Unknown"]),
        q("ind-manufacturing-4", "Manufacturing", "Costing method", "single",
          ["Standard", "Actual", "Average", "Not yet confirmed"]),
        q("ind-manufacturing-5", "Manufacturing", "Quality management in scope?", "single", ["Yes", "No", "Unknown"]),
        q("ind-manufacturing-6", "Manufacturing", "Fulfilment strategy", "single",
          ["Make to stock", "Make to order", "Engineer to order", "Mixed"], true),
        q("ind-manufacturing-7", "Manufacturing", "Subcontract or outside processing in scope?", "single", ["Yes", "No", "Unknown"]),
        q("ind-manufacturing-8", "Manufacturing", "Warehouse management in scope?", "single",
          ["Yes — full WMS", "Inventory management only", "No"]),
        q("ind-manufacturing-9", "Manufacturing", "Plants or production sites in scope", "number", undefined),
      ],
      componentAddOns: [
        c("manufacturing-bom", "Supply Chain", "BOM and routing configuration", "Required", 24, "Production structures modelled", "High", 1),
        c("manufacturing-mes", "Integrations", "Shop floor / MES integration", "Recommended", 20, "Production data flows to ERP", "High"),
        c("manufacturing-costing", "Finance", "Manufacturing costing configuration", "Required", 16, "Product cost visible", "Medium"),
        c("manufacturing-quality", "Quality", "Quality management configuration", "Optional", 12, "Inspection and non-conformance tracked", "Medium"),
        c("manufacturing-wms", "Supply Chain", "Warehouse management configuration", "Optional", 18, "Stock accurate to bin level", "Medium"),
        c("manufacturing-subcontract", "Procurement", "Subcontract and outside processing", "Optional", 12, "Outsourced operations costed", "Medium"),
      ],
      proofTags: ["manufacturing", "supply-chain"],
    },
  },
  {
    id: "energy-utilities",
    name: "Energy & Utilities",
    pack: {
      questions: [
        q("ind-energy-utilities-1", "Energy & Utilities", "Asset-intensive work management in scope?", "single",
          ["Yes", "No", "Unknown"], true),
        q("ind-energy-utilities-2", "Energy & Utilities", "Joint venture accounting required?", "single", ["Yes", "No", "Unknown"]),
        q("ind-energy-utilities-3", "Energy & Utilities", "Regulatory rate or tariff reporting required?", "single", ["Yes", "No", "Unknown"]),
        q("ind-energy-utilities-4", "Energy & Utilities", "Metering or customer billing system to integrate?", "single",
          ["Yes — single system", "Yes — multiple systems", "No"]),
        q("ind-energy-utilities-5", "Energy & Utilities", "Capital project accounting for network assets required?", "single",
          ["Yes", "No", "Unknown"], true),
        q("ind-energy-utilities-6", "Energy & Utilities", "Outage or work order management in scope?", "single", ["Yes", "No", "Unknown"]),
      ],
      componentAddOns: [
        c("energy-eam", "Assets", "Enterprise asset management configuration", "Required", 26, "Asset maintenance controlled", "High", 1),
        c("energy-jv", "Finance", "Joint venture accounting", "Optional", 16, "Partner shares accounted", "Medium"),
        c("energy-capital-projects", "Finance", "Capital project and network asset accounting", "Recommended", 20, "Capital spend traced to asset", "Medium", 1),
        c("energy-billing-integration", "Integrations", "Metering and billing system integration", "Optional", 20, "Consumption billed and reconciled", "High"),
      ],
      scoringModifiers: { complexityPerEntity: 4 },
      proofTags: ["energy", "utilities", "asset-intensive"],
    },
  },
  {
    // Split out from Energy & Utilities rather than merged into it: a producer
    // or oilfield services client is governed by entitlement and partner
    // accounting, a utility by tariff regulation and metering. One pack asking
    // both sets of questions asks every client the wrong half.
    id: "oil-gas",
    name: "Oil & Gas",
    pack: {
      questions: [
        q("ind-oil-gas-1", "Oil & Gas", "Segment", "single",
          ["Upstream", "Midstream", "Downstream", "Oilfield services"], true),
        q("ind-oil-gas-2", "Oil & Gas", "Production sharing or concession accounting required?", "single",
          ["Yes — production sharing contract", "Yes — concession", "No", "Unknown"], true),
        q("ind-oil-gas-3", "Oil & Gas", "Joint venture partner billing required?", "single",
          ["Yes — as operator", "Yes — as non-operator", "No"], true),
        q("ind-oil-gas-4", "Oil & Gas", "Authorisation for expenditure (AFE) tracking in scope?", "single",
          ["Yes", "No", "Unknown"]),
        q("ind-oil-gas-5", "Oil & Gas", "Asset maintenance and turnaround planning in scope?", "single",
          ["Yes", "No", "Unknown"]),
        q("ind-oil-gas-6", "Oil & Gas", "HSE incident and compliance reporting in scope?", "single",
          ["Yes", "No", "Unknown"]),
        q("ind-oil-gas-7", "Oil & Gas", "Operating entities, fields or sites in scope", "number", undefined),
      ],
      componentAddOns: [
        c("oil-gas-jv-billing", "Finance", "Joint venture accounting and partner billing", "Required", 26, "Partner shares billed and recovered", "High", 1),
        c("oil-gas-afe", "Finance", "AFE and capital authorisation tracking", "Required", 18, "Spend controlled against authorisation", "Medium", 1),
        c("oil-gas-psc", "Finance", "Production sharing or concession accounting", "Recommended", 22, "Entitlement calculated to contract terms", "High"),
        c("oil-gas-eam", "Assets", "Asset maintenance and turnaround planning", "Recommended", 24, "Maintenance controlled across the estate", "High"),
        c("oil-gas-hse", "Compliance", "HSE incident and compliance reporting", "Optional", 10, "Incidents traceable and reportable", "Medium"),
      ],
      // Each field or operating entity behaves like its own book, the same
      // reason construction carries a per-entity uplift.
      scoringModifiers: { complexityPerEntity: 5 },
      proofTags: ["oil-gas", "energy", "asset-intensive"],
    },
  },
  {
    id: "education",
    name: "Education",
    pack: {
      questions: [
        q("ind-education-1", "Education", "Student information system integration in scope?", "single", ["Yes", "No", "Unknown"]),
        q("ind-education-2", "Education", "Research grant and restricted fund accounting required?", "single", ["Yes", "No", "Unknown"], true),
        q("ind-education-3", "Education", "Academic contract types in HR scope?", "single",
          ["Yes — academic and professional", "Professional only", "Unknown"]),
      ],
      componentAddOns: [
        c("education-sis", "Integrations", "Student information system integration", "Recommended", 18, "Student and finance data aligned", "High"),
        c("education-grants", "Finance", "Research grant and fund accounting", "Required", 20, "Grant spend tracked to award", "Medium", 1),
      ],
      proofTags: ["education", "research"],
    },
  },
  {
    id: "professional-services",
    name: "Professional Services",
    pack: {
      questions: [
        q("ind-professional-services-1", "Professional Services", "Time capture model", "single",
          ["Daily timesheet", "Weekly timesheet", "Milestone only", "Not yet confirmed"], true),
        q("ind-professional-services-2", "Professional Services", "Utilisation reporting required?", "single", ["Yes", "No", "Unknown"]),
        q("ind-professional-services-3", "Professional Services", "Multi-currency client billing required?", "single", ["Yes", "No", "Unknown"]),
      ],
      componentAddOns: [
        c("ps-project-billing", "Finance", "Project billing and revenue recognition", "Required", 20, "Client billing tied to delivery", "Medium", 1),
        c("ps-utilisation", "Reporting", "Utilisation and resourcing reporting", "Recommended", 10, "Bench and utilisation visible", "Low"),
      ],
      proofTags: ["professional-services", "projects"],
    },
  },
];

export async function seedIndustries(): Promise<{ industries: number; packs: number }> {
  const now = Date.now();
  let industryCount = 0;
  let packCount = 0;

  for (const seed of INDUSTRY_SEEDS) {
    await db
      .insert(industries)
      .values({ id: seed.id, name: seed.name, active: seed.active === false ? 0 : 1, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: industries.id,
        set: { name: seed.name, active: seed.active === false ? 0 : 1, updatedAt: now },
      });
    industryCount++;

    const pack: IndustryPack = { ...EMPTY_PACK, ...seed.pack };
    await db
      .insert(industryPacks)
      .values({ industryId: seed.id, payload: JSON.stringify(pack), revision: 1, updatedAt: now })
      .onConflictDoUpdate({
        target: industryPacks.industryId,
        set: { payload: JSON.stringify(pack), updatedAt: now },
      });
    packCount++;
  }

  return { industries: industryCount, packs: packCount };
}
