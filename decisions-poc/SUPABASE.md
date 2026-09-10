# Council decisions → Supabase

The register is generated offline (`npm run council`, writes `public/data/council-decisions.json`)
and loaded into Supabase via an edge function. The frontend (`/council-decisions`) reads from
Supabase, falling back to the static JSON if the table isn't there yet.

## 1. Create the table

`supabase/migrations/20260906120000_council_decisions_and_voting.sql` creates `council_decisions`
(now shared with the voting feature below, see columns there), `agenda_item_votes`, and the
`agenda_item_vote_tallies` view, with RLS. Run via the normal Lovable/Supabase migration apply.

## 2. Deploy the import function

`supabase/functions/import-council-decisions/index.ts` is in the repo (registered in
`config.toml`, `verify_jwt = false`). It reuses the existing `SOLAR_IMPORT_SECRET`. Deploy it
via the normal Lovable/Supabase deploy.

## 3. Load the data

After the site is deployed (so `/data/council-decisions.json` is live), trigger the import:

```bash
curl -X POST 'https://<project-ref>.functions.supabase.co/import-council-decisions' \
  -H 'x-sync-secret: <SOLAR_IMPORT_SECRET>' \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://<deployed-site>/data/council-decisions.json"}'
```

Returns `{ ok: true, upserted: N }`. It upserts by `id`, so re-run it any time the offline
generator regenerates the JSON (new meetings, reclassification), it's idempotent.

## Refresh cycle

1. Locally: `YEARS=2026 npm run council` (or add new years) → regenerates `public/data/council-decisions.json`.
2. Commit + deploy the site.
3. Re-trigger the import function (step 3) to sync Supabase.

Eventually this could run on a schedule (a cron edge function that regenerates + imports), but
the offline generator needs the minutes-scraping pipeline, which currently runs on your machine.

# Public voting feature

Lets visitors vote support/oppose on climate/energy agenda items, both upcoming and already
decided. Shares the `council_decisions` table above (see the migration for the full column list);
`agenda_item_votes` and `agenda_item_vote_tallies` are new, created by the same migration.

## 1. Deploy two new edge functions (Lovable prompts)

**`vote-agenda-item`**

> Create an edge function `vote-agenda-item`. Input JSON body: `{ agenda_item_id: string, choice:
> "support" | "oppose" }`. Derive the caller's IP from `x-real-ip`, falling back to the first
> entry of `x-forwarded-for` (same pattern as `admin-auth/index.ts`); never trust a client-supplied
> IP field. Using the service role client, insert a row into `agenda_item_votes` with
> `agenda_item_id`, `choice`, `ip_address`. On a unique-violation (Postgres code 23505, meaning
> this IP already voted on this item), instead look up the existing row's `choice` for that
> `(agenda_item_id, ip_address)` pair rather than erroring. Either way (fresh insert or duplicate),
> then read back that item's tally from `agenda_item_vote_tallies` (`support_count`,
> `oppose_count`) and, from `council_decisions`, its `outcome` and `status`. Respond 200 with
> `{ ok: true, choice, support_count, oppose_count, outcome }` where `choice` is whichever choice
> ended up on record (the new vote, or the pre-existing one on a duplicate) and `outcome` is null
> when `status` is `'open'`. Votes are accepted regardless of `status`, decided items take
> retroactive/hypothetical votes too, never reject based on status. CORS + JSON error handling
> should match the existing edge functions in this repo (e.g. `import-council-decisions`).

**`import-agenda-items`**

> Create an edge function `import-agenda-items`, closely mirroring the existing
> `import-council-decisions` function (same shared-secret auth via `SOLAR_IMPORT_SECRET` checked
> against an `x-sync-secret` header, same chunked upsert-by-id pattern). Input JSON body:
> `{ items: [...] }`, where each item is a partial `council_decisions` row (fields like `id`,
> `meeting_date`, `meeting_year`, `item_number`, `body`, `title`, `sponsor`, `co_sponsor`,
> `lead_dept`, `sub_depts`, `tags`, `source_url`, `is_climate`, `topic`, `significance`, `status`,
> `outcome`, `decided_at`). Upsert into `council_decisions` by `id` with `onConflict: "id"`, in
> chunks of 500, same as `import-council-decisions`. Additionally: before upserting, for any
> incoming item with `status: "decided"`, check whether a row with that `id` already exists with
> `status = 'open'`; if so this is the reconciliation case (an item that was PDF-sourced pre-vote
> now has a real outcome), so make sure `decided_at` and `updated_at` (set to `now()`) are included
> in that row's upsert. Respond `{ ok: true, upserted: N }` on success, `{ ok: false, error }` with
> status 500 on failure, matching `import-council-decisions`'s error shape.

## 2. Run the sync scripts and load the data

Both scripts live in `decisions-poc/src/` and write a local JSON file; nothing is posted to
Supabase automatically, mirroring the `npm run council` + manual curl workflow above.

```bash
npm run sync-agenda-history    # writes data/agenda-vote-history.json (past ~6 months, from CIUR)
npm run sync-agenda-upcoming   # writes data/agenda-vote-upcoming.json (next meeting, PDF-parsed)
```

Then POST each file's `items` array to `import-agenda-items`:

```bash
curl -X POST 'https://<project-ref>.functions.supabase.co/import-agenda-items' \
  -H 'x-sync-secret: <SOLAR_IMPORT_SECRET>' \
  -H 'Content-Type: application/json' \
  -d @data/agenda-vote-history.json

curl -X POST 'https://<project-ref>.functions.supabase.co/import-agenda-items' \
  -H 'x-sync-secret: <SOLAR_IMPORT_SECRET>' \
  -H 'Content-Type: application/json' \
  -d @data/agenda-vote-upcoming.json
```

Run `sync-agenda-upcoming` roughly weekly (a new Draft Agenda only exists once the prior meeting
has happened); run `sync-agenda-history` any time after to pick up the reconciliation once
`sich-49ay` shows the item as `Closed`. Both are manual for now, daily automation (cron edge
function or a GitHub Action) is a follow-up, not part of this pass.
