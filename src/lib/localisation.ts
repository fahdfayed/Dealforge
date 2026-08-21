// Country-driven localisation questions.
//
// Statutory scope is one of the largest swings in an Oracle implementation and
// nothing was asking about it: a Dubai payroll deal and an Ontario payroll deal
// received exactly the same question set. What actually differs is regional —
// VAT and WPS across the Gulf, GST and TDS in India, sales-and-use tax and SOX
// in North America — so packs are keyed by region rather than by country, and
// countries map onto a region.
//
// This is deliberately separate from the industry packs: localisation is
// cross-cutting. A healthcare client and a construction client in the same
// country need the same VAT questions, and duplicating them into every
// industry pack would mean fixing a tax change in fourteen places.
//
// Type-only import: erased at compile time, so the cycle with lib/questions.ts
// exists only in the type graph.
import type { Question } from "@/lib/questions";

export type RegionId = "gcc" | "india" | "north-america" | "australia";

// Countries are captured as free text on the deal and account screens, so this
// has to tolerate what people actually type. Keys are compared lowercased with
// punctuation and surrounding whitespace stripped.
const COUNTRY_TO_REGION: Record<string, RegionId> = {
  // Gulf
  uae: "gcc",
  "u a e": "gcc",
  "united arab emirates": "gcc",
  emirates: "gcc",
  dubai: "gcc",
  "abu dhabi": "gcc",
  sharjah: "gcc",
  fujairah: "gcc",
  "saudi arabia": "gcc",
  saudi: "gcc",
  ksa: "gcc",
  "kingdom of saudi arabia": "gcc",
  oman: "gcc",
  "sultanate of oman": "gcc",
  qatar: "gcc",
  kuwait: "gcc",
  bahrain: "gcc",
  // India
  india: "india",
  bharat: "india",
  // North America
  usa: "north-america",
  us: "north-america",
  "u s a": "north-america",
  "united states": "north-america",
  "united states of america": "north-america",
  america: "north-america",
  canada: "north-america",
  // Australia
  australia: "australia",
  aus: "australia",
  au: "australia",
  nsw: "australia",
};

function normalise(country: string): string {
  return country
    .toLowerCase()
    .replace(/[.,_/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function regionFor(country: string): RegionId | null {
  return COUNTRY_TO_REGION[normalise(country)] ?? null;
}

// Every distinct region represented, in a stable order so the question list
// does not reshuffle between renders when countries are entered in a different
// sequence.
const REGION_ORDER: RegionId[] = ["gcc", "india", "north-america", "australia"];

export function regionsFor(countries: string[]): RegionId[] {
  const found = new Set<RegionId>();
  for (const country of countries) {
    const region = regionFor(country);
    if (region) found.add(region);
  }
  return REGION_ORDER.filter((r) => found.has(r));
}

const q = (
  id: string,
  module: string,
  text: string,
  inputType: Question["inputType"],
  options: string[] | undefined,
  critical = false
): Question => ({ id, module, text, inputType, options, critical });

export const REGION_PACKS: Record<RegionId, Question[]> = {
  gcc: [
    q("ctx-gcc-1", "Gulf localisation", "VAT registration and filing in scope?", "single",
      ["Yes — registered entity", "Not VAT registered", "Unknown"], true),
    q("ctx-gcc-2", "Gulf localisation", "E-invoicing mandate applies?", "single",
      ["Yes — already in force", "Yes — phased or upcoming", "No", "Unknown"], true),
    q("ctx-gcc-3", "Gulf localisation", "Wage Protection System (WPS) payroll filing required?", "single",
      ["Yes", "No", "Unknown"]),
    q("ctx-gcc-4", "Gulf localisation", "Nationalisation quota reporting required?", "single",
      ["Yes — Emiratisation", "Yes — Saudisation / Omanisation", "No", "Unknown"]),
    q("ctx-gcc-5", "Gulf localisation", "Arabic language support required", "multiple",
      ["Application interface", "Printed documents and invoices", "Reporting", "Not required"]),
    q("ctx-gcc-6", "Gulf localisation", "End-of-service gratuity calculation in scope?", "single",
      ["Yes", "No", "Unknown"]),
    q("ctx-gcc-7", "Gulf localisation", "In-country data residency required?", "single",
      ["Yes — mandated", "Preferred, not mandated", "No", "Unknown"], true),
  ],
  india: [
    q("ctx-in-1", "India localisation", "GST registration and filing in scope?", "single",
      ["Yes — multi-state", "Yes — single state", "No", "Unknown"], true),
    q("ctx-in-2", "India localisation", "E-invoicing and e-way bill compliance required?", "single",
      ["Yes — both", "E-invoicing only", "No", "Unknown"], true),
    q("ctx-in-3", "India localisation", "Tax deducted at source (TDS) handling in scope?", "single",
      ["Yes", "No", "Unknown"]),
    q("ctx-in-4", "India localisation", "Statutory payroll components in scope", "multiple",
      ["Provident Fund", "ESI", "Professional Tax", "Gratuity", "Not in scope"]),
  ],
  "north-america": [
    q("ctx-na-1", "North America localisation", "Sales and use tax determination required?", "single",
      ["Yes — multi-state", "Yes — single state or province", "No", "Unknown"], true),
    q("ctx-na-2", "North America localisation", "Vendor tax reporting (1099 / T4A) in scope?", "single",
      ["Yes", "No", "Unknown"]),
    q("ctx-na-3", "North America localisation", "Multi-state or multi-province payroll in scope?", "single",
      ["Yes", "No", "Unknown"]),
    q("ctx-na-4", "North America localisation", "SOX controls applicable?", "single",
      ["Yes", "No", "Unknown"], true),
  ],
  australia: [
    q("ctx-au-1", "Australia localisation", "GST and BAS reporting in scope?", "single",
      ["Yes", "No", "Unknown"], true),
    q("ctx-au-2", "Australia localisation", "Single Touch Payroll (STP) reporting required?", "single",
      ["Yes", "No", "Unknown"], true),
    q("ctx-au-3", "Australia localisation", "Superannuation processing in scope?", "single",
      ["Yes", "No", "Unknown"]),
  ],
};

export function localisationQuestions(countries: string[]): Question[] {
  return regionsFor(countries).flatMap((region) => REGION_PACKS[region]);
}

// Flat list for the question index in lib/questions.ts, so an answer to a
// localisation question resolves rather than throwing "Unknown question id".
export const ALL_REGION_QUESTIONS: Question[] = REGION_ORDER.flatMap((r) => REGION_PACKS[r]);
