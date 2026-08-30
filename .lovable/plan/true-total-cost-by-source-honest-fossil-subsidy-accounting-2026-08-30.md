# True Total Cost by Source + Honest Fossil Subsidy Accounting

Two additions to `/power-money`, both below the federal-support card. Existing charts stay untouched.

## 1. New chart: "What it really cost, all payers"

A separate card with its own year selector and its own table, stacking Austin Energy's cost and federal support into one bar per source so the reader sees the combined figure.

- One horizontal bar per source, sorted by total descending.
- Segments, in order: fuel/contract energy, modeled plant costs, allocated system delivery costs (the three already in the comparison chart, same colors), then federal support in teal.
- Pale teal extension for the broader-estimate band, same treatment as the federal card so it never reads as a hard number.
- Bar label: combined $/MWh.
- Table beside/below the chart, one row per source: MWh, AE $/MWh, federal $/MWh, combined $/MWh, and a "who paid what share" split (ratepayer % vs taxpayer %).
- Header cards: combined total dollars for the year across all sources, and the same per residential household using the existing divisor.
- Same shared swatch tooltip as the other charts.

Only sources with both a cost row and a defensible federal figure carry a federal segment; sources without one (hydro, biomass, fuel oil) still appear with their AE cost and a note that no federal figure was estimated, rather than an implied zero.

## 2. Widen and re-caveat the fossil accounting

The gas bar is currently ~$1.35/MWh because the table counts only fuel-cycle tax provisions allocated to power-sector gas. That is defensible but incomplete, and the current copy does not say clearly enough why.

Changes:

- Split the gas and coal rate entries into named components in `src/lib/federal-support.ts` (intangible drilling costs, percentage depletion, accelerated depreciation) so each is visible and citable instead of hiding inside one number.
- Widen the fossil `broaderHigh` values and back them with real citations — the current $2.00 gas ceiling is too narrow for published estimates that include upstream leasing, non-tax support, and oil-side provisions that accrue to integrated gas producers. Any widened value gets a source or it does not go in.
- Add an explicit, prominent note under both the federal and combined charts covering:
  - Renewable credits are per-MWh and per-project, so they concentrate on the bar. Fossil support is upstream and volumetric across all gas use — heating, industry, LNG export, petrochemicals — so only a small slice lands on a power-generation MWh. This asymmetry is real, but it means a sharp number is being compared to a blurry one.
  - Much of the commonly cited oil-and-gas subsidy total accrues to oil revenue, not gas, and is not credited to gas here.
  - Structural and non-tax support is excluded from the statutory column: federal leasing terms, pipeline rate treatment, ERCOT market design, and the state Texas Energy Fund's low-cost loans to new gas plants. Where a published range exists it feeds the broader band; where it does not, it is named as excluded.
  - Health and climate externalities are not priced in either chart. Stated plainly as out of scope, not smuggled in.

## Technical notes

- New selector `toTotalCostRows(comparisonRows, federalRows)` in `src/lib/federal-support.ts` joining on source key, returning `{ key, label, color, fuelRate, nonFuelRate, systemRate, federalRate, broaderBand, combinedRate, ratepayerShare, taxpayerShare, mwh, combinedTotalUsd }`.
- New card rendered in `src/pages/PowerMoney.tsx` with independent `totalCostYear` state, defaulting to the same year as the comparison chart, following the existing card structure.
- Refactor gas/coal entries in `federalRate()` to carry a `components: { label, usdPerMwh, source }[]` array; the summed `statutory` value stays the bar length so nothing else changes.
- No changes to `public/power_money.json` or `scripts/eia_fuel_costs.py`.
- Every widened or new figure is verified against a primary source (EIA subsidy reports, JCT tax expenditure estimates, CRS reports) before it lands, with the citation added to `FEDERAL_SOURCES`.
- Verification: typecheck, then a Playwright load of `/power-money` confirming the new card renders, the year selector works, and there are no console errors.
