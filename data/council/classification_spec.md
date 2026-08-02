# Council climate-vote classification spec (v0 — refine this)

The LLM (backfill here, then sync for new items only) reads each agenda item's
`item_description` and returns:

```json
{ "is_climate": true,
  "category": "energy_supply | buildings_efficiency | transportation | climate_planning | water_resilience | natural_systems | waste | environmental_justice | none",
  "item_kind": "policy | contract | proclamation | executive_session",
  "summary": "one plain-English sentence",
  "confidence": "high | medium | low" }
```

## Inclusion rule
`is_climate = true` only if the item **substantively concerns** climate, clean
energy, emissions, environmental sustainability, or climate resilience — as
policy, funding, or a binding action.

## Exclusions (the noise this must reject)
- **Vendor-name collisions** — the word is in a company name, not the subject:
  SolarWinds (IT), Wind Services (trucks), "Coalition" (matches "coal"), Carbon
  Activated Corp (chemicals), Climatec (HVAC). → `is_climate:false`.
- **Routine watershed drainage / waterline / stormwater construction** — utility
  ops, not climate policy. → false (unless framed as climate resilience/flood adaptation).
- **Routine electric-utility supply/software contracts** (transformers, meters,
  base-rate corrections) — `is_climate` may be false, or true+`item_kind:contract`
  if it's genuinely a clean-energy program (e.g. solar incentives, EV charging).

## `item_kind` matters
Separate **policy/resolutions** (stances: climate plan, GHG targets, gas-plant
decisions, low-carbon mandates) from **routine contracts** (incentive issuances,
service agreements). The report card centers on policy; contracts are secondary.

## Worked examples
| description (truncated) | is_climate | category | kind |
|---|---|---|---|
| transition City to low-embodied-carbon concrete | yes | buildings_efficiency | policy |
| Fossil Fuel Non-Proliferation Treaty resolution (9-1) | yes | climate_planning | policy |
| I-35 project & transportation GHG emissions (7-3) | yes | transportation | policy |
| Climate Vulnerability Analysis for Parks natural areas | yes | natural_systems | policy |
| Fayette Power Project legal consultation | yes | energy_supply | executive_session |
| Austin Energy commercial/multifamily solar incentives $7M | yes | energy_supply | contract |
| SolarWinds software maintenance contract | no | none | contract |
| TGM Wind Services skylift vehicle maintenance | no | none | contract |
| Ending Community Homelessness Coalition agreement | no | none | contract |
| Carbon Activated Corporation SulfaTreat chemical contract | no | none | contract |
| routine watershed waterline extension construction | no | none | contract |

## Open questions to settle before full backfill
1. Do **transit / bike-ped / land-use density** items count as climate (mode-shift / VMT)? Currently only when emissions are explicitly named.
2. Do **routine clean-energy contracts** (solar incentive issuances) belong in the record, or only policy/resolutions?
3. Is **watershed protection / water conservation** in scope, or only when climate-framed?
