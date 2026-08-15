import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  DEAL_ITEM_CATEGORIES,
  DISCOVERY_TEMPLATES,
  COMMERCIAL_MODULE,
} from "../src/lib/domain";
import { computeEstimate, DEFAULT_ESTIMATE_INPUTS } from "../src/lib/estimate";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.proposal.deleteMany();
  await prisma.promise.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.discoveryQuestion.deleteMany();
  await prisma.dealItem.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.proofItem.deleteMany();

  const hcmDeal = await prisma.opportunity.create({
    data: {
      name: "Al Rawabi Group — Multi-Country Payroll & HCM",
      client: "Al Rawabi Group",
      industry: "Manufacturing & Distribution",
      countries: "UAE, Oman, Morocco",
      legalEntities: "Al Rawabi UAE LLC, Al Rawabi Oman LLC, Al Rawabi Maroc SARL",
      oracleEnvironment: "Oracle EBS 12.2 HR, legacy in-country payroll vendors",
      dealType: "HCM & Payroll",
      modules: "HCM & Payroll,Integrations,Data Migration,Change Management",
      budgetMin: 380000,
      budgetMax: 520000,
      currency: "USD",
      timelineMonths: 8,
      probability: 55,
      momentum: "Accelerating",
      nextAction: "Confirm Morocco payroll localisation scope with client HR director",
      stage: "Discovery",
      oracleRegistrationStatus: "Registered — pending Oracle pricing support",
      dealItems: {
        create: [
          { category: "Company", label: "Group HQ", value: "Dubai, UAE", status: "CONFIRMED_BY_CLIENT", source: "Kickoff call, 2026-07-02" },
          { category: "Company", label: "Total headcount", value: "~2,400 employees across 3 countries", status: "CONFIRMED_BY_CLIENT", source: "HR data pack" },
          { category: "Oracle Environment", label: "Current HR system", value: "Oracle EBS 12.2 HR (UAE only), Excel + local vendors elsewhere", status: "FOUND_IN_DOCUMENTS", source: "IT questionnaire response" },
          { category: "Stakeholders", label: "Economic buyer", value: "Group CFO — Layla Haddad", status: "CONFIRMED_BY_CLIENT", source: "Discovery meeting" },
          { category: "Stakeholders", label: "HR sponsor", value: "Regional HR Director — Karim Idrissi", status: "CONFIRMED_BY_CLIENT", source: "Discovery meeting" },
          { category: "Budget & Timeline", label: "Target go-live", value: "Q2 2027 payroll cutover", status: "CONFIRMED_BY_CLIENT" },
          { category: "Competitors", label: "Other vendors in play", value: "Local SI shortlisted alongside Intelloger", status: "ASSUMED_BY_INTELLOGER", source: "Sales judgement, not confirmed" },
          { category: "Risks & Assumptions", label: "Morocco labour law complexity", value: "Requires local payroll expertise, not yet validated", status: "STILL_UNKNOWN" },
          { category: "Risks & Assumptions", label: "Historical data years", value: "3 years assumed pending confirmation", status: "ASSUMED_BY_INTELLOGER" },
          { category: "Oracle Account Team", label: "Oracle AE", value: "Sara Al Mazrouei", status: "CONFIRMED_BY_CLIENT" },
          { category: "Commitments", label: "Parallel payroll runs", value: "Client expects 2 parallel cycles; sales mentioned 3 in a meeting", status: "CONTRADICTORY", source: "Meeting notes vs proposal draft" },
        ],
      },
    },
  });

  const ebsDeal = await prisma.opportunity.create({
    data: {
      name: "Desert Star Retail — EBS 12.2 Upgrade",
      client: "Desert Star Retail",
      industry: "Retail",
      countries: "Saudi Arabia",
      legalEntities: "Desert Star Retail Co.",
      oracleEnvironment: "Oracle EBS 12.1.3, heavily customised Finance & SCM",
      dealType: "EBS Upgrade",
      modules: "Finance,APEX / Custom Apps,Data Migration",
      budgetMin: 150000,
      budgetMax: 220000,
      currency: "USD",
      timelineMonths: 5,
      probability: 30,
      momentum: "Steady",
      nextAction: "Send budgetary estimate covering three upgrade options",
      stage: "Solutioning",
      oracleRegistrationStatus: "Not registered",
      dealItems: {
        create: [
          { category: "Company", label: "Store count", value: "64 retail locations", status: "CONFIRMED_BY_CLIENT" },
          { category: "Oracle Environment", label: "Current version", value: "EBS 12.1.3, extended support expiring", status: "CONFIRMED_BY_CLIENT" },
          { category: "Oracle Environment", label: "Customisations", value: "~40 custom forms/reports, documentation incomplete", status: "FOUND_IN_DOCUMENTS" },
          { category: "Risks & Assumptions", label: "Customisation documentation", value: "Assumed poor based on similar retail clients", status: "ASSUMED_BY_INTELLOGER" },
          { category: "Budget & Timeline", label: "Hard deadline", value: "Support expiry in 9 months", status: "CONFIRMED_BY_CLIENT" },
          { category: "Stakeholders", label: "IT Director", value: "Faisal Otaibi — technical decision-maker", status: "CONFIRMED_BY_CLIENT" },
        ],
      },
    },
  });

  for (const opp of [hcmDeal, ebsDeal]) {
    const modules = opp.modules.split(",").map((m) => m.trim());
    const applicableModules = [...modules, COMMERCIAL_MODULE];
    for (const mod of applicableModules) {
      const questions = DISCOVERY_TEMPLATES[mod];
      if (!questions) continue;
      await prisma.discoveryQuestion.createMany({
        data: questions.map((q) => ({
          opportunityId: opp.id,
          module: mod,
          text: q.text,
          criticalForPricing: q.criticalForPricing ?? false,
        })),
      });
    }
  }

  // Partially answer HCM deal's discovery to show a realistic coverage meter.
  const hcmQuestions = await prisma.discoveryQuestion.findMany({
    where: { opportunityId: hcmDeal.id },
  });
  const answeredSamples: Record<string, string> = {
    "What are the employee populations by country?":
      "UAE: 1,400. Oman: 600. Morocco: 400.",
    "Which countries require payroll localisation?":
      "All three — UAE (WPS), Oman, and Morocco (CNSS).",
    "Are multiple assignments per worker required?": "Yes, for ~120 UAE staff.",
    "What is the budget range and funding status?": "USD 380k–520k, funded for FY27.",
    "What is the desired go-live / decision timeline?": "Decision by Sept 2026, go-live Q2 2027.",
    "Who are the economic buyer and key decision-makers?":
      "CFO Layla Haddad (budget), HR Director Karim Idrissi (requirements).",
  };
  for (const q of hcmQuestions) {
    const answer = answeredSamples[q.text];
    if (answer) {
      await prisma.discoveryQuestion.update({
        where: { id: q.id },
        data: { answered: true, answer },
      });
    }
  }

  const hcmEstimateInputs = {
    ...DEFAULT_ESTIMATE_INPUTS,
    entities: 3,
    countries: 3,
    modules: 4,
    businessUnits: 5,
    users: 180,
    integrations: 4,
    reports: 8,
    dataObjects: 6,
    workflows: 5,
    testingCycles: 2,
    trainingPopulations: 3,
    onSitePct: 40,
    documentationQuality: "Average" as const,
    governanceComplexity: "Medium" as const,
  };
  const hcmMultipliers = {
    multiCountryPayroll: true,
    arabicRequirements: true,
    largeHistoricalMigration: false,
  };
  const hcmResult = computeEstimate(hcmEstimateInputs, hcmMultipliers, 1200, 650, 12);
  await prisma.estimate.create({
    data: {
      opportunityId: hcmDeal.id,
      inputs: JSON.stringify(hcmEstimateInputs),
      multipliers: JSON.stringify(hcmMultipliers),
      dayRate: 1200,
      internalCostPerDay: 650,
      contingencyPct: 12,
      baseEffortDays: hcmResult.baseEffortDays,
      adjustedEffortDays: hcmResult.adjustedEffortDays,
      p50Days: hcmResult.p50Days,
      p80Days: hcmResult.p80Days,
      maxDays: hcmResult.maxDays,
      internalCost: hcmResult.internalCost,
      customerPrice: hcmResult.customerPrice,
      grossMargin: hcmResult.grossMargin,
    },
  });

  await prisma.promise.createMany({
    data: [
      {
        opportunityId: hcmDeal.id,
        statement: "Payroll will go live simultaneously across all three countries.",
        classification: "PROPOSED_DELIVERABLE",
        saidBy: "Account Executive",
        source: "Discovery meeting, 2026-07-02",
        owner: "Delivery Director",
        inSOW: false,
        commercialEffortIncluded: true,
      },
      {
        opportunityId: hcmDeal.id,
        statement: "Three parallel payroll runs will be performed before cutover.",
        classification: "PENDING_CONFIRMATION",
        saidBy: "Account Executive",
        source: "Meeting notes, 2026-07-15",
        owner: "Payroll Lead",
        inSOW: false,
        commercialEffortIncluded: false,
      },
      {
        opportunityId: hcmDeal.id,
        statement: "Client is responsible for historical data cleansing before migration.",
        classification: "CLIENT_RESPONSIBILITY",
        saidBy: "Presales Consultant",
        source: "Scope handshake draft",
        owner: "Client HR Ops",
        inSOW: true,
        commercialEffortIncluded: false,
      },
      {
        opportunityId: ebsDeal.id,
        statement: "Intelloger will provide an on-site cutover team for go-live weekend.",
        classification: "CONTRACTUAL_COMMITMENT",
        saidBy: "Account Executive",
        source: "Proposal v1 draft",
        owner: "Delivery Director",
        inSOW: true,
        commercialEffortIncluded: false,
      },
    ],
  });

  await prisma.proofItem.createMany({
    data: [
      {
        title: "GCC Manufacturing Group — 3-Country Payroll Rollout",
        type: "Case Study",
        industry: "Manufacturing & Distribution",
        country: "UAE, Oman, Morocco",
        oracleProduct: "Oracle HCM Cloud",
        summary:
          "Delivered simultaneous payroll go-live across UAE, Oman and Morocco for a 2,000+ employee group, including WPS and CNSS localisation.",
        confidentiality: "Name-confidential",
      },
      {
        title: "Retail Group — EBS 12.1 to 12.2 Upgrade",
        type: "Case Study",
        industry: "Retail",
        country: "Saudi Arabia",
        oracleProduct: "Oracle EBS",
        summary:
          "Upgraded a 50+ site retail operation from EBS 12.1.3 to 12.2 with 35 customisations rationalised to 12.",
        confidentiality: "Publicly usable",
      },
      {
        title: "Karim Boulos — Senior Oracle HCM Consultant",
        type: "Consultant CV",
        industry: "",
        country: "",
        oracleProduct: "Oracle HCM Cloud, Payroll",
        summary: "12 years Oracle HCM, led 6 multi-country payroll implementations across MENA.",
        confidentiality: "Requires permission",
      },
      {
        title: "APEX Modernisation Reference Architecture",
        type: "Architecture Diagram",
        industry: "",
        country: "",
        oracleProduct: "Oracle APEX, OCI",
        summary: "Standard reference architecture for migrating EBS custom forms to APEX on OCI.",
        confidentiality: "Publicly usable",
      },
      {
        title: "Standard SOW Language — Data Migration Exclusions",
        type: "SOW Template",
        industry: "",
        country: "",
        oracleProduct: "",
        summary: "Approved legal language limiting data migration liability to client-provided clean data.",
        confidentiality: "Publicly usable",
      },
    ],
  });

  console.log("Seed complete:", { hcmDeal: hcmDeal.id, ebsDeal: ebsDeal.id });
  console.log("Deal item categories available:", DEAL_ITEM_CATEGORIES.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
