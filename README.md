# Intelloger DealForge

DealForge is the intelligence layer between the first client conversation and
successful project delivery. It turns fragmented sales information into
defensible solutions, commercially safe proposals and delivery-ready
commitments.

This repository contains the first-version "spine" of DealForge:

- **Living Deal Twin** — one evolving record per opportunity: company,
  environment, stakeholders, risks, commitments. Every fact carries a status
  (confirmed by client, found in documents, assumed, internally proposed,
  still unknown, contradictory).
- **Discovery Architect** — question templates generated dynamically from
  the deal type and modules selected, with a coverage meter per module and
  a lightweight "import from meeting notes" extractor.
- **Commercial Lab** — an effort/cost/price estimator with complexity
  multipliers and a live "what breaks the budget?" simulator, producing
  P50 / P80 / maximum-exposure bands.
- **Promise Ledger** — every commitment made during the sale, classified and
  checked against the estimate; flags commitments with no backing effort
  (the scope firewall).
- **Proposal Studio** — generates persona-specific proposal documents from
  the Deal Twin (never inventing references, pricing or availability),
  tracks a lightweight approval workflow, and exports to `.docx`.
- **Proof & Reference Vault** — searchable library of references, case
  studies, CVs and reusable content with confidentiality tracking.
- **Today** — a lightweight executive command centre: weighted pipeline,
  high-risk deals, pending approvals and promise-ledger warnings.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM with SQLite (via the `better-sqlite3` driver adapter)
- `docx` for Word export

## Getting started

```bash
npm install
cp .env.example .env      # DATABASE_URL="file:./dev.db"
npx prisma migrate dev    # creates the SQLite database
npx prisma db seed        # loads two example opportunities
npm run dev
```

Then open http://localhost:3000.

## Project structure

```
prisma/schema.prisma         Data model for the Living Deal Twin
prisma/seed.ts                Example opportunities, discovery answers, promises, proof
src/lib/domain.ts             Deal types, modules, discovery question templates, status vocab
src/lib/estimate.ts           Commercial Lab calculation engine
src/lib/coverage.ts           Discovery coverage meter calculation
src/lib/proposal-generator.ts Assembles proposal markdown from the Deal Twin
src/lib/docx-export.ts        Markdown -> .docx conversion
src/app/                      Routes: Today, Opportunities, Deal Twin, Discovery,
                               Commercial Lab, Promises, Proposals, Proof Vault
```

## Notes on scope

This is the first-version spine described in the product vision: Living Deal
Twin, Discovery Architect, Commercial Lab, Proposal Studio, Proof Vault, a
lightweight approval workflow, and the Promise Ledger. Later phases (client
conviction rooms, negotiation coaching, red-team reviews, Oracle alliance
tracking, delivery handover, AI rehearsal rooms, predictive analytics) are
intentionally not built yet.
