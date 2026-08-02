# Council climate-vote classification spec (v1)

The LLM (backfill here, then sync for new items only) reads each agenda item's
`item_description` and returns:

```json
{ "is_climate": true,
  "category": "energy_supply | buildings_efficiency | transportation | land_use | water | natural_systems | waste | climate_planning | environmental_justice | none",
  "item_kind": "policy | resolution | decision | routine | proclamation | executive_session",
  "summary": "one plain-English sentence",
  "confidence": "high | medium | low" }
```

`category` is the topical bucket — the "beyond yes/no" classifier. It groups the
(deliberately wide) climate set so the page can organize it.

## Inclusion rule (resolved)
`is_climate = true` when the item is a **substantive decision** that relates —
**directly OR indirectly** — to climate, clean energy, emissions, sustainability,
or resilience. Indirect counts: transportation mode-shift / transit / bike-ped /
VMT, land-use density and zoning, water conservation and **watershed protection**,
tree canopy / natural systems, waste / recycling.

## Exclusions
- **Routine / administrative / procurement items** — even when energy-related —
  are NOT climate decisions. A solar-incentive *issuance*, an electric-utility
  *supply contract*, a base-rate correction → `is_climate:false`, `item_kind:routine`.
  Only actual decisions (policy, resolutions, ordinances, plan adoptions,
  significant agreements/PPAs, direction to staff) count. *(Q2: only decisions,
  not routine stuff.)*
- **Vendor-name collisions** — the term is only in a company name: SolarWinds
  (IT), Wind Services (trucks), "Coalition" (matches coal), Carbon Activated Corp
  (chemicals), Climatec (HVAC) → `is_climate:false`.

## Resolved scope questions
1. **Transit / bike-ped** → IN, direct or indirect (`transportation`).
   **Land use** → POLICY ONLY (`land_use`): citywide code changes and explicit
   density / transit-oriented / sustainability initiatives (e.g. HOME, TOD,
   compatibility/density reform). **EXCLUDE individual case-by-case rezonings** —
   `C14-…`, `C814-…`, `NPA-…` site cases, single-parcel or site-specific zoning
   and neighborhood-plan amendments are routine land development, `is_climate:false`,
   `item_kind:routine`, even though they change what can be built on one site.
2. **Routine clean-energy contracts** → OUT. Only decisions, not routine procurement.
3. **Watershed / water conservation** → IN. (category `water`.)

## `item_kind`
`policy` / `resolution` / `decision` = substantive (the record shows these).
`routine` = procurement/admin/contract (excluded). `proclamation`,
`executive_session` = noted but not decisions.

## Worked examples
| description (truncated) | is_climate | category | item_kind |
|---|---|---|---|
| transition City to low-embodied-carbon concrete | yes | buildings_efficiency | policy |
| Fossil Fuel Non-Proliferation Treaty resolution (9-1) | yes | climate_planning | resolution |
| I-35 project & transportation GHG emissions (7-3) | yes | transportation | resolution |
| resolution expanding the bike/pedestrian network | yes | transportation | resolution |
| land-use change increasing density near transit | yes | land_use | policy |
| Climate Vulnerability Analysis for Parks natural areas | yes | natural_systems | decision |
| watershed protection ordinance | yes | water | policy |
| adopt Austin Energy Resource / generation plan | yes | energy_supply | policy |
| Fayette Power Project (coal) legal consultation | yes | energy_supply | executive_session |
| Austin Energy solar-incentive issuance $7M | no | none | routine |
| electric-utility transformer supply contract | no | none | routine |
| SolarWinds software maintenance contract | no | none | routine |
| Ending Community Homelessness Coalition agreement | no | none | routine |
| routine watershed waterline construction contract | no | none | routine |

## Backfill + accuracy plan
1. Hand-label a stratified ~150-item gold sample here (independent of the model).
2. Update the classify-new-votes prompt to this spec; run it over all 6,535 rows
   (all currently is_climate NULL) — the one-time backfill.
3. Compare model output to the gold sample → precision / recall; review
   disagreements. Two independent models agreeing (Claude gold vs. Gemini run) +
   human spot-check is the accuracy evidence.
4. Refine prompt and re-run if needed; then enable the sync cron for new items only.
