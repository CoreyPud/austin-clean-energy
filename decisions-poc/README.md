# Austin climate/energy decisions tracker — POC

Normalizes Austin climate & energy **decisions** from public documents into a local
JSON dataset. Code does the deterministic work; the LLM only classifies and
summarizes; and the LLM's structural claims are **audited against regex ground truth**,
so the dataset is self-checking rather than trusting the model.

No Supabase — output is local files under `data/`. Designed to move to a Supabase
edge function later by swapping two seams only (see *Portability*).

## Run

```bash
cd decisions-poc
npm install
npm run run     # ingest seed docs -> data/
npm run eval    # score the parser against hand-labeled fixtures
```

Requires `OPENAI_API_KEY` in the repo-root `.env.local` (already copied there).

## Pipeline

```
sources → extract(PDF→text) → harvestFacts(regex) → classify(LLM) → validate(audit) → resolve(dedup) → data/*.json
```

- **`src/extract.ts`** — fetch EDIMS PDFs, extract text with `unpdf` (Deno-friendly), cached under `cache/`.
- **`src/deterministic.ts`** — regex harvest of ground-truth facts: dollar amounts, vote tallies + who voted against, cross-reference IDs.
- **`src/classify.ts`** — LLM segments the doc into climate/energy decision items (topic, significance, summary, fields).
- **`src/validate.ts`** — audits each LLM item against the harvested facts; confirmed fields are marked `_source:"regex" _verified:true`, unconfirmed ones are kept but flagged into the review queue.
- **`src/resolve.ts`** — merges staging items into canonical decisions: deterministic `(body, date, itemNo)` join for agenda↔minutes, title-token overlap for cross-doc/body.
- **`src/run.ts`** — orchestrates and writes output.

## Two grains

- **RawItem** — one per relevant agenda item per document (staging/evidence). N per document.
- **Decision** — canonical, deduped across documents/bodies. The output (`data/decisions/*.json`).

## Output (`data/`)

- `decisions/<slug>.json` — one self-contained decision each (nested votes, documents, links, provenance).
- `decisions.ndjson` — flattened roll-up, one decision per line (bulk load).
- `_meta.json` — run stats + review queue (unverified/conflicting fields to eyeball).

Every structural field carries provenance. Example — the gas peaker
(`2026-implementation-resource-generation-climate-protection.json`): the 8-3
recommendation is `_source:"regex" _verified:true` with dissenters Braden/Reed/White
pulled from the minutes; agenda item 12 and minutes item 12 merged on the item key.

## Portability to a Supabase edge function

Written in TypeScript on `fetch` + Web APIs only. Two seams change on the edge:

1. **LLM** (`src/llm.ts`) — set `LLM_BASE_URL=https://ai.gateway.lovable.dev/v1`,
   `LLM_MODEL=google/gemini-3-flash-preview`; the Lovable key is injected there. Same request shape.
2. **Output sink** (`src/run.ts` writes) — swap local file writes for Supabase inserts
   (field names already match the planned tables).

## Scope / not yet built

- Source registry is **seeded** (EUC 2026-05-11 agenda + minutes). Next: crawl the
  commission meeting index (`.../boards_commissions/meetings/{BOARD_ID}_{year}.htm`)
  and council agendas; add the Socrata backbone (votes, CIUR, Climate Equity Plan).
- Cross-**body** resolution (EUC rec ↔ council item, RCA "Boards and Commission Action" bridge) — modeled, not yet wired.
- Staff presentations (OCR) and reporting — intentionally out of scope for the POC.
- Executive-session decisions (e.g. the peaker's council vote) have no public backup;
  they surface via the commission layer + are flagged `sealed`, cost left null.
