-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "countries" TEXT NOT NULL,
    "legalEntities" TEXT NOT NULL DEFAULT '',
    "oracleEnvironment" TEXT NOT NULL DEFAULT '',
    "dealType" TEXT NOT NULL,
    "modules" TEXT NOT NULL,
    "budgetMin" REAL,
    "budgetMax" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timelineMonths" INTEGER,
    "probability" INTEGER NOT NULL DEFAULT 20,
    "momentum" TEXT NOT NULL DEFAULT 'Steady',
    "nextAction" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL DEFAULT 'Qualifying',
    "oracleRegistrationStatus" TEXT NOT NULL DEFAULT 'Not registered',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DealItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunityId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STILL_UNKNOWN',
    "source" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DealItem_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscoveryQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunityId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "criticalForPricing" BOOLEAN NOT NULL DEFAULT false,
    "answered" BOOLEAN NOT NULL DEFAULT false,
    "answer" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DiscoveryQuestion_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunityId" TEXT NOT NULL,
    "inputs" TEXT NOT NULL,
    "multipliers" TEXT NOT NULL,
    "baseEffortDays" REAL NOT NULL DEFAULT 0,
    "adjustedEffortDays" REAL NOT NULL DEFAULT 0,
    "dayRate" REAL NOT NULL DEFAULT 1200,
    "internalCostPerDay" REAL NOT NULL DEFAULT 650,
    "p50Days" REAL NOT NULL DEFAULT 0,
    "p80Days" REAL NOT NULL DEFAULT 0,
    "maxDays" REAL NOT NULL DEFAULT 0,
    "internalCost" REAL NOT NULL DEFAULT 0,
    "customerPrice" REAL NOT NULL DEFAULT 0,
    "grossMargin" REAL NOT NULL DEFAULT 0,
    "contingencyPct" REAL NOT NULL DEFAULT 10,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Estimate_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Promise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunityId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "classification" TEXT NOT NULL DEFAULT 'INFORMAL_DISCUSSION',
    "saidBy" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "owner" TEXT NOT NULL DEFAULT '',
    "inSOW" BOOLEAN NOT NULL DEFAULT false,
    "commercialEffortIncluded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Promise_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approverNote" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proposal_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProofItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "industry" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "oracleProduct" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL,
    "confidentiality" TEXT NOT NULL DEFAULT 'Publicly usable',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_opportunityId_key" ON "Estimate"("opportunityId");
