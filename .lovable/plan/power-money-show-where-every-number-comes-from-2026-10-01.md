# Power Money: show where every number comes from

## What I found
Today the page mixes very different kinds of numbers, and only the footnotes explain which is which:

- **EIA reported:** generation (MWh) and fuel burned at each plant, plus Texas fuel prices for coal, gas and oil.
- **Calculated from EIA:** fuel dollars for coal, gas and oil (fuel burned x the Texas average price, not Austin Energy's actual invoices).
- **Our assumption:** the price Austin pays for solar ($50, then $28 per MWh after 2017), wind ($32, then $25), nuclear (about $7) and biomass ($70). These are single round numbers, not taken from Austin Energy contracts.
- **Industry averages:** plant upkeep and capital costs for coal, gas and nuclear (national NREL ranges).
- **Calculated from an Austin Energy document:** system costs, from the budget minus power supply cost, filled in between years.

Why this matters for "solar is cheapest": the solar bar rests mostly on the $28 assumption. Austin's real solar contracts vary a lot. Its early Webberville contract is widely reported as far above $28. Its newer contracts are lower. The bar also leaves out the extra cost of backing solar up when the sun is down. So the claim is not yet backed the way you want it to be.

## What to build

1. **A source label on every number.** Each number gets a small colored tag with one of six labels: AE document, Calculated from AE document, EIA reported, Calculated from EIA, Industry average, or Our estimate. Hovering over a tag shows the exact source and a link. Tags appear in the side-by-side comparison, the chart tooltips, and the per-year detail.
2. **A "How solid is this?" table near the top.** It has one row per source (solar, wind, gas, coal, nuclear, ...) and one column per cost piece (energy/fuel, plant upkeep, capital, system). Each cell shows its source label, so anyone can see at a glance which parts are measured and which are estimated.
3. **Replace the guesses with Austin Energy's own numbers wherever they exist.** I'll research council approvals and Austin Energy budget, rate-case and annual-report documents for the actual contract price of each solar and wind farm (Webberville, Roserock, Upton and others) and for South Texas Project and Fayette costs. I'll swap in each documented price, contract by contract, with a link to the document. Any price I can't find stays labeled "Our estimate," with a stated range.
4. **An honest note under the comparison chart.** It will say what the bars do and don't include, especially the cost of backup power for solar and wind. It will also say which source wins once only documented numbers are used.

## Open questions settled during the work
- If a solar contract price can't be documented, it stays an estimate. I won't fill it with a guess.
- Changes to the solar numbers will show up in the totals and charts automatically.

## Technical details
- Add a `basis` field per number (`ae_doc | ae_calc | eia | eia_calc | industry | estimate`) plus `sourceUrl`/`sourceNote` to `public/power_money.json` (in `scripts/eia_fuel_costs.py`). Replace `CONTRACTED_USD_PER_MWH` with a per-plant table keyed by EIA plant code, holding the documented $/MWh and the citation.
- New `SourceBadge` component plus a source-matrix component in `src/components/power-money/`. Thread `basis` through `toComparisonRows` and the chart tooltips in `src/lib/power-money.ts` and `PowerMoney.tsx`.
- Re-run the script to regenerate the JSON, then verify the page in the browser.
