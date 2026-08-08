# Council accountability — data inventory & schema design

Goal: show (1) differentiation between council members, (2) the holistic influence
on the council, and (3) the top companies donating/lobbying and what they're after.
This doc inventories what data actually exists, proposes a clean (non-blob) schema,
and maps it to those three goals.

---

## 1. What data we actually have

### A. Campaign finance (Socrata `3kfv-biw6`, 2016–present)
One row per contribution. Fields: `donor`, `recipient`, `contribution_amount`,
`contribution_date`, `donor_type` (INDIVIDUAL / ENTITY), `donor_reported_employer`,
`donor_reported_occupation`, `city_state_zip`, `contribution_year`.

Facts established:
- To the 11 current members: **$4.42M from individuals, only $64K (1.4%) from PACs/entities.**
  Corporations can't donate directly (TX ban); PAC money is negligible under Austin's cap.
- So the only industry lens is **aggregating individuals by employer** (OpenSecrets method).
- That aggregation is meaningful because the giving is demonstrably **bundled**:
  Armbrust & Brown = 58 donors, mostly at the $450 cap, to 9 of 11 members ($112K);
  Endeavor = 73 donors to 8 members ($117K). Dozens of employees maxing out across
  nearly the whole council = organized, not incidental.
- Contribution caps are CPI-indexed (~$450→$500); "at max" must be judged per-cycle
  or approximated by avg gift ≈ cap.

### B. Lobbying (Socrata, City Clerk)
- **Registrants** `96z6-upac`: lobbyist, registrant_id, registration_date.
- **Clients** `7ena-g23u`: registrant_id, `client_last_name`, `business_desc`,
  `comp_category`, `report_id`. ~128K rows = mostly duplicate quarterly refilings of
  **2,668 distinct clients**. 70% are real estate/development by business_desc.
- **Subject matter** `7jrx-icwh`: lookup of ~25 topic categories.
- **Report→subject junction** `tajf-gz53`: `report_id`, `sm_id` — links each lobby
  report to the subjects it covers. Chain: client (`7ena-g23u.report_id`) → `tajf-gz53`
  → `7jrx-icwh`. **This is "what they lobby on."**
  - Caveat: lobbyists over-select subjects (most reports tag ~20 of 25 categories),
    so subject counts are near-uniform (86K–147K) and only weakly discriminating.
    Land Development / Zoning / Permits / Real Estate lead; business_desc is the
    cleaner "who they are" signal.
- **Not available:** which council district or member a lobbyist targets. Lobbying is
  citywide. The only per-member link is via donations (below).

### C. Voting (Socrata `3c89-i35a`, 2023–present) — already in DB as `council_votes`
Per agenda item: tallies, `action_taken`, LLM climate classification. Plus
`council_vote_dissents` (non-Yes votes only). Key facts: ~0.6% dissent rate; ~500
substantive climate decisions after the trim; 66 contested; current members backed
~60–65 of 66; the "No" votes came mostly from departed members.

---

## 2. Proposed schema (normalized — no JSON blobs)

Replace `campaign_finance_summary`'s `sector_breakdown` / `top_employers` blobs.

**Dimensions**
- `council_members` — `district` (PK), `name`, `slug`, `title`, `since`,
  `finance_alias`, `voter_name`. (Populate it; today the roster lives only in
  frontend code.)
- `employers` — `employer_key` (PK, normalized name), `display_name`, `sector`,
  `is_lobby_client` (bool, cross-referenced to lobby clients). Sector classified once here.
- `lobby_clients` — `client_key` (PK, normalized), `display_name`, `business_desc`,
  `sector`, `first_year`, `last_year`. (Dedupe the 128K → 2,668.)

**Facts**
- `contributions_by_employer` — grain = recipient × employer × cycle:
  `recipient`, `cycle_year`, `employer_key`→employers, `total_amount`,
  `donor_count`, `gift_count`, `in_austin_amount`. PK(recipient,cycle_year,employer_key).
  *(donor_count + total/gift_count is what proves bundling — the thing the old blob lost.)*
- `lobby_client_subjects` — `client_key`, `subject` (resolved category), for "what they lobby on".
- `council_votes` — keep as-is (per-item tally + climate classification).
- `council_vote_positions` — replace `council_vote_dissents`: per member × climate item,
  `item_id`, `voter_name`, `vote_cast`. Storing **all** positions (not just No) enables
  both "voted against" and "supported despite dissent" without re-querying Socrata.

**Recommended grain decision:** employer-aggregate (above), not 700K raw contributions.
It supports sector / top-employer / bundling / nexus, is computable via SODA
server-side (light sync), and stays small. Raw individual contributions are the only
thing it can't do (listing named donors); add a `contributions` table later only if
donor-level drill-down is ever needed — the schema above doesn't have to change to add it.

**Aggregates = SQL views over the base tables** (always fresh, nothing to re-bake):
`v_member_funding`, `v_member_top_employers`, `v_lobby_by_sector`,
`v_lobby_by_subject`, `v_donor_lobby_nexus`, `v_member_climate_record`.

---

## 3. How the data powers the three goals

### Goal 1 — Differentiation between members
Members vote near-identically (consensus), so differentiation lives in **money** and
**leadership**, both per-member:
- **Funding mix** (`v_member_funding`): sector breakdown differs by member.
- **Bundling exposure** (`v_member_top_employers`): "N donors from Armbrust (a lobbying
  firm), all near max" — per member, from `donor_count`. This is the sharp differentiator.
- **Contested-vote support** (`council_vote_positions`): "supported X of 66 contested
  climate votes" and any dissents — tenure-adjusted (`council_members.since`).
- **Tenure**: served-since date, already added.

### Goal 2 — Holistic influence on the council
Two independent datasets pointing the same way, plus how decisions get made:
- **Funding by sector** (all members): real estate/development dominates individual giving.
- **Lobbying by industry** (`v_lobby_by_sector`): 70% real estate/development.
- **What lobbying is about** (`v_lobby_by_subject`): land use / zoning / permits lead.
- **Climate/energy is ~1% of both** — the key contrast for a climate site.
- **How decisions are made**: 0.6% dissent, 60% approved on consent, ~15% quietly
  withdrawn/postponed, ~2 items ever voted down. The vote is largely ratification.

### Goal 3 — Top companies + what they're trying to do
- **Top bundlers** (`contributions_by_employer` ordered by total, `is_lobby_client` flagged):
  Armbrust & Brown, Endeavor, Presidium, Aquila, Stratus — with donor_count showing scale.
- **What they're after** = their `sector`/`business_desc` (real estate/development) +
  their lobby `subject`s (land use, zoning, permits). Framed as "a land-use law firm
  that lobbies the city on zoning and bundles maxed donations to 9 of 11 members."
- **Which members they fund** (from the fact table) — the only per-member tie for lobbying orgs.
- Honest framing throughout: "donors who work at X" (individual, aggregated), not
  "X donated"; bundling is legal and disclosed; correlation, not proof of a vote.

---

## 4. Open decisions for review
1. Grain: confirm employer-aggregate (recommended) vs full raw contributions.
2. Scope: all recipients, or council members + candidates only? (Aggregate makes "all"
   cheap; recommend all recipients so elections/comparisons work later.)
3. Confirm views (not summary tables) for the read layer.
4. `council_vote_positions`: store positions for all climate items, or just contested?
   (Contested is enough for the UI and far smaller.)

## 5. Migration path
1. Lovable: create the tables above; drop the blob columns.
2. Rewrite `aggregate-finance-sectors` → populate `employers` + `contributions_by_employer`
   via SODA aggregation (group by recipient, employer, year: sum, count(distinct donor), count).
3. Rewrite `lobbying-summary` → populate `lobby_clients` + `lobby_client_subjects`; set
   `employers.is_lobby_client` by name match.
4. Extend the vote sync → `council_vote_positions` for climate items.
5. Create the views; point the pages at them. Remove the JSON-blob reads.
