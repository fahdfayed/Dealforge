# Intelloger

Intelloger is a governed opportunity operating system. It turns
fragmented pursuit information into one reusable record, then uses that
same record to shape discovery, solution options, pricing, proposals,
negotiations and delivery handover.

> Intelloger is not an AI proposal generator. It is the controlled
> intelligence layer connecting pursuit decisions to commercially safe
> outputs and delivery-ready commitments.

This build implements the product described in the **V22 Product & Operating
Manual**: the Living Deal Twin, the governed Answer Graph, the Deal
Intelligence scoring engine, Solution Forge, the detailed commercial model,
Proposal Studio, the Promise Ledger / Scope Handshake / Negotiation Arena,
Submission Check, Proof Vault, Oracle coordination, delivery handover, and
the Today / Portfolio decision views.

## Primary flow

**Today → Deals → Understand → Build offer → Proposal → Handover**, with
stage-gated specialist controls (Health details, Sources, Detailed
solution, Detailed estimate, Negotiate, Commitments, Submission check,
Client share, Oracle coordination) reachable once a deal exists.

## Design principles carried into the code

- **Empty by default.** Creating a deal prefills nothing — no sample or
  assumed account data. `src/db/seed.ts` only seeds the reusable Proof
  Vault, never a deal.
- **Controlled input first.** The Answer Graph uses single/multiple/number
  response types (doc 4.2), not free text.
- **Revision safety.** Every deal save is optimistic-concurrency checked
  (`src/lib/deal-repo.ts` / `src/lib/deal-mutation.ts`) — a stale save is
  rejected with a visible conflict banner instead of silently overwriting
  newer work.
- **Nothing invented.** Proposal generation, Promise Ledger candidates,
  Scope Handshake statements and Proof Vault matches are all assembled
  from data already on the Deal Twin — never fabricated.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- **Drizzle ORM**, schema written in `drizzle-orm/sqlite-core` — the same
  schema and queries work against `drizzle-orm/d1` in a Cloudflare
  deployment. Locally it runs on `better-sqlite3` against a file database.
- **pdf-lib** for client-side branded PDF generation (PDF 1.4). There is no
  Markdown/HTML export path — the doc is explicit that generated output is
  PDF only.

## What's real here vs. what's documented-but-not-provisioned

This container has no Cloudflare account, no D1/R2 bindings and no ChatGPT
App platform session to attach to, so those integrations are built to the
*interface* the doc describes but run on local stand-ins:

| Documented (production) | This build (local dev) |
| --- | --- |
| Cloudflare D1 via Drizzle | Same Drizzle schema, `better-sqlite3` driver (`src/db/client.ts`) |
| Cloudflare R2 for sources/proof files | Local disk under `.storage/`, behind an R2-shaped `put/get/delete` interface (`src/lib/storage.ts`) |
| ChatGPT-authenticated user headers | Trusts an `x-chatgpt-user-id` header if present, falls back to a fixed dev user (`src/lib/identity.ts`) |

Swapping the left column in is a deployment task (wrangler bindings, a
`@cloudflare/next-on-pages` build, and an actual ChatGPT App registration),
not a code change to the business logic.

## Current limitations (carried from doc section 17)

- **No AI source analysis.** Files/notes stored on the Sources screen are
  governed records only — no automatic findings are produced.
- **Probability is a transparent, contextual model — not calibrated
  against historical win/loss data.** Use it for decision discipline, not
  as a revenue guarantee.
- **No Oracle licensing engine, no legal-policy engine.** Licensing and
  legal exceptions require human/Oracle confirmation.
- **Delivery capacity is a governed input, not a connected resource
  calendar.**
- **No Zoho/Microsoft/Oracle workflow integrations.**

Intelloger must never invent: project references, consultant/delivery
availability, licensing quantities or Oracle approval, commercial
approvals or margin-floor exceptions, client-confirmed scope, or legal
commitments.

## Getting started

```bash
npm install
cp .env.example .env        # DATABASE_PATH, STORAGE_DIR
npm run db:migrate          # creates the local SQLite database
npm run db:seed             # seeds the Proof Vault only — deals stay empty
npm run dev
```

Then open http://localhost:3000.

## Project structure

```
src/db/schema.ts              deal_states / radar_intakes / proof_assets (Drizzle, sqlite-core)
src/types/deal-twin.ts        Living Deal Twin payload types
src/lib/questions.ts          19 standard + tailored Answer Graph question packs
src/lib/answer-graph.ts       Active-question recalculation and answer invalidation
src/lib/scoring.ts            Deal Intelligence engine (evidence, coverage, gates, probability, safety modes)
src/lib/solution-forge.ts     Stabilise/Modernise/Transform inclusion + effort/confidence/risk
src/lib/commercial.ts         Detailed commercial estimate engine
src/lib/promises.ts           Promise Ledger candidate generation
src/lib/scope-handshake.ts    Scope Handshake generation and completion gate
src/lib/negotiation.ts        Negotiation Arena cash/margin impact
src/lib/submission-check.ts   Deterministic CFO/CIO/procurement/delivery/Oracle checks
src/lib/oracle.ts             Alliance health and Oracle rationale
src/lib/handover.ts           Delivery handover readiness
src/lib/today.ts              Decision queue and Answer Graph health
src/lib/portfolio.ts          Leadership aggregation across all deals
src/lib/pdf/                  Branded PDF generators (deal twin, answer graph, proposal, oracle brief, handover)
src/app/                      Today, Deals, Proof Vault, Portfolio, and the deal-scoped specialist screens
```
