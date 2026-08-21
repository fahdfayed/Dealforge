// Seeds the Proof Vault only. Deals start empty by design — "no opportunity
// is populated with fake customer facts" (doc 1.2) and the release
// acceptance checklist requires that creating a deal prefills nothing.
import "dotenv/config";
import { db } from "./client";
import { proofAssets, dealStates, radarIntakes } from "./schema";

async function main() {
  await db.delete(radarIntakes);
  await db.delete(dealStates);
  await db.delete(proofAssets);

  const now = Date.now();
  await db.insert(proofAssets).values([
    {
      id: crypto.randomUUID(),
      type: "Case study",
      title: "GCC Manufacturing Group — 3-Country Payroll Rollout",
      tags: JSON.stringify(["Manufacturing", "UAE", "Oman", "Morocco", "HCM/payroll"]),
      access: "Confidential",
      summary: "Delivered simultaneous payroll go-live across UAE, Oman and Morocco for a 2,000+ employee group.",
      whatItProves: "Intelloger can deliver multi-country payroll localisation on a compressed timeline.",
      storageKey: null,
      fileName: null,
      fileSize: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      type: "Case study",
      title: "Retail Group — EBS 12.1 to 12.2 Upgrade",
      tags: JSON.stringify(["Retail", "Saudi Arabia", "EBS modernisation"]),
      access: "Public",
      summary: "Upgraded a 50+ site retail operation from EBS 12.1.3 to 12.2, rationalising 35 customisations to 12.",
      whatItProves: "Intelloger reduces customisation burden during EBS upgrades without disrupting operations.",
      storageKey: null,
      fileName: null,
      fileSize: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      type: "Consultant CV",
      title: "Senior Oracle HCM Consultant — 12 years MENA payroll",
      tags: JSON.stringify(["HCM/payroll", "UAE", "Oman"]),
      access: "Permission-required",
      summary: "Led six multi-country payroll implementations across MENA.",
      whatItProves: "Named delivery capability for complex regional payroll engagements.",
      storageKey: null,
      fileName: null,
      fileSize: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      type: "Architecture diagram",
      title: "APEX Modernisation Reference Architecture",
      tags: JSON.stringify(["APEX & VBCS", "OCI"]),
      access: "Public",
      summary: "Standard reference architecture for migrating EBS custom forms to APEX on OCI.",
      whatItProves: "A validated, repeatable pattern for custom-form modernisation.",
      storageKey: null,
      fileName: null,
      fileSize: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      type: "SOW template",
      title: "Standard SOW Language — Data Migration Exclusions",
      tags: JSON.stringify(["Data Migration"]),
      access: "Public",
      summary: "Approved legal language limiting data migration liability to client-provided clean data.",
      whatItProves: "Pre-approved commercial protection language for migration scope.",
      storageKey: null,
      fileName: null,
      fileSize: null,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  console.log("Seed complete: Proof Vault populated, deals table left empty by design.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
