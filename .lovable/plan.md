# Power Money — What Austin pays for each fuel

A new public page at `/power-money` showing how many dollars Austin Energy customers spent on each fuel source each year, 2001–present, both as system totals and per household.

## Where the cost data comes from (no upload needed)

The project already pulls Austin Energy generation from the EIA v2 API in `scripts/eia_plants.py` (Form 923 `facility-fuel` endpoint, with an API key already in the script). Two sibling EIA endpoints supply the money side:

1. **Fuel costs** — `https://api.eia.gov/v2/electricity/fuel-receipts-and-costs/data/`
   Monthly, per plant, per fuel: quantity received, average heat content, and cost in cents per MMBtu. Coverage 2008–present.
   Docs/browser: https://www.eia.gov/opendata/browser/electricity/fuel-receipts-and-costs
2. **Retail sales / revenue** — `https://api.eia.gov/v2/electricity/retail-sales/data/` (already called in `scripts/sentinel_no2_map.py`)
   Austin Energy residential revenue, sales MWh, price, and customer counts by year — used for the per-household view and as a sanity check on totals.

Fallback for the pre-2008 years and for the 2026 partial year: EIA's state-level average fuel cost per MMBtu by fuel, held as a small documented table in the script with a visible "estimated" flag on the chart.

Fuels with no fuel receipts (wind, solar, hydro, biomass PPAs) have no fuel cost. For those the page shows contracted energy cost using AE's published PPA rates as clearly labeled assumptions, in a separate series from measured fuel cost, so the two are never silently mixed.

## Method

For each Austin Energy plant, month, and fuel:

```text
fuel_dollars = heat_input_MMBtu x cost_per_MMBtu x AE_ownership_share
heat_input   = generation_MWh x plant_heat_rate (from Form 923 total-consumption-btu)
```

AE ownership/PPA shares reuse the existing `AE_PCT` mapping in `scripts/sentinel_no2_map.py`, so the dollars line up exactly with the fuel-mix chart on the No2 section. Annual totals are the sum of months; per-household is annual total divided by that year's AE residential customer count.

## The page

- Headline: total fuel spend for the most recent full year, and the per-household equivalent.
- Stacked area/bar chart: dollars by fuel by year, 2001–present, with a toggle between **Total system $** and **Per household $**.
- Second chart: effective cost per MWh by fuel by year — this is where the story lives (gas volatility, the 2021 Uri spike, coal vs. wind).
- Year detail table: MWh, dollars, $/MWh, and share of total spend per fuel for a selected year.
- Methodology block naming both EIA endpoints, the ownership shares, what is measured vs. estimated, and an explicit note that this is fuel and contracted-energy cost only — not transmission, debt service, or O&M, so it does not equal a customer bill.
- Share widget (existing `ShareWidget`) and SEO title/description/JSON-LD via the existing `useSeo` hook.

## Technical notes

- New script `scripts/eia_fuel_costs.py` fetches and caches the receipts-and-costs data, joins it to the existing plant/generation cache, applies AE shares, and writes `public/power_money.json` in the same static-snapshot pattern as `no2_data.json`. Keeps the page a pure client read — no new tables, no edge function.
- New `src/pages/PowerMoney.tsx` plus a small `src/lib/power-money.ts` for loading and reshaping the JSON. Recharts, existing chart colors and fuel groupings from `No2Section.tsx` so the palette matches.
- Route registered in the public layout so the global footer applies; card added to the home page section and an entry added to `public/sitemap.xml`.
- Estimated years and PPA-derived series are visually distinct (hatched/dashed) with tooltips saying so, per the project's data-transparency rules.

## Open item

If the EIA receipts endpoint returns thin coverage for a specific AE plant (small units sometimes omit Schedule 2), the page shows that plant's fuel as "cost not reported" in the table rather than filling it with a guess, and the methodology names the gap.
