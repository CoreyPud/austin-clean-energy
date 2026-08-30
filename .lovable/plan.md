# Side-by-side all-in cost per source

Add a new chart that compares every electricity source head-to-head for a single year, on an all-in dollars-per-megawatt-hour basis — so wind can be read directly against natural gas. Everything already on the page stays exactly as it is.

## What the user sees

A new card, "Compare sources side by side", placed after the existing cost-per-MWh trend chart:

- A year picker (defaults to the latest complete year).
- A horizontal bar per source, sorted cheapest to most expensive, so the ranking is the story.
- Each bar is split into two stacked segments:
  - fuel or contracted energy cost per MWh
  - estimated plant O&M + capital / debt service per MWh
- The total all-in $/MWh is printed at the end of each bar.
- Under each source label: how many MWh it produced that year and its share of generation, so a cheap-but-tiny source isn't mistaken for a big one.
- Fuel oil is included here (unlike the trend chart, where its $150-350/MWh rate flattens the other lines); its bar simply runs long.
- A short honest-take note directly under the chart:
  - PPA sources (wind, solar, biomass, hydro) are all-in contract prices, so they carry no separate plant cost segment — their single bar is already the full cost of that energy.
  - Owned plants (gas, coal, nuclear) show fuel plus modeled O&M and capital, using NREL-range estimates, not Austin Energy's books.
  - System costs (transmission, distribution, congestion, admin) are excluded because they aren't attributable to a source — they're in the full-system layer above.
  - Contracted rates are documented assumptions, marked as estimates.

## Technical notes

- `src/lib/power-money.ts`: add a `toComparisonRows(data, year)` helper returning, per fuel present that year, `{ key, label, color, fuelRate, nonFuelRate, allInRate, mwh, share, measured, contracted }`, sorted ascending by `allInRate`. Rates are `fuelUsd|contractedUsd / mwh` and `nonFuelUsd / mwh`, skipping fuels with zero MWh.
- `src/pages/PowerMoney.tsx`: new `compareYear` state plus a memo over the helper; render a Recharts stacked horizontal `BarChart` (`layout="vertical"`, explicit container height scaled to row count) with a `LabelList` for the all-in total and a custom tooltip. Reuse `FUEL_META` colors and existing card/typography patterns.
- Independent of the `layer` selector — this chart is always all-in per source. No data regeneration, no script changes.
