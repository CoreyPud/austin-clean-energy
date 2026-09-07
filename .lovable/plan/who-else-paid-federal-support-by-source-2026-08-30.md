# Who Else Paid: Federal Support by Source

The Power Money charts show what Austin Energy paid. This adds a companion chart answering a different question: for each source, how much of the cost was carried by federal taxpayers rather than by Austin Energy ratepayers.

## What gets added

A new card on `/power-money`, below the side-by-side comparison, titled "Who else paid: federal support by source".

- Year selector, defaulting to the same year the comparison chart is set to.
- One horizontal bar per source (utility-scale fuels present that year, plus local solar), showing federal support in $/MWh generated.
- Each bar has two parts:
  - Solid segment: plant-level federal tax provisions that plausibly touch this generation (ITC/PTC for wind/solar, MACRS/accelerated depreciation, 45Q, production tax credit for nuclear, intangible drilling costs and percentage depletion for gas, coal-specific credits).
  - Hatched/lighter segment, clearly labeled "broader estimates": economy-wide support that is harder to attribute per MWh (upstream oil and gas provisions, federal R&D, foreign tax provisions). Shown as a band so it never reads as a hard number.
- Beside each bar: total federal dollars behind that source's Austin Energy generation for the year (rate x MWh), plus the source's MWh.
- Header row: total federal support behind Austin Energy's supply that year, and the same as $ per residential household using the existing household divisor.
- A "compare with what AE paid" line per source: federal $/MWh next to the delivered $/MWh already computed, so the reader sees the split between ratepayer and taxpayer.
- Swatch tooltip using the same shared tooltip component as the other three charts, so colors are unambiguous.

## Honest-take and caveats block

Directly under the chart, in the same voice as the existing methodology copy:

- These are modeled subsidy rates from published federal estimates, not Austin Energy accounting. Austin Energy is a municipal utility and cannot itself claim tax credits; the value flows to the private developers, PPA counterparties, and homeowners whose projects supply or offset AE load, and generally shows up as a lower contract or install price.
- Local solar credits (residential ITC) are claimed by the homeowner, so that bar is support to Austin residents, not to the utility.
- Fossil provisions are mostly upstream and structural, not per-plant payments, so the fossil bars are the weakest part of this chart and are labeled that way.
- Broader-estimate bands come from advocacy and agency studies that disagree with each other; the range is shown, not a point value.
- The chart does not price externalities (health, climate) — that is a separate question and is not being smuggled in here.

## Technical notes

- New `src/lib/federal-support.ts`: a documented, hand-maintained table of federal support rates by source and era (credits change by year — PTC/ITC phase-downs, the 2022 restructuring, the 2025/2026 changes), plus a `broaderRange` per source and a `FEDERAL_SOURCES` citation list mirroring the `LOCAL_SOURCES` pattern in `src/lib/local-resources.ts`. Every number carries a `basis: "statutory" | "estimate"` flag and a source key.
- Rates are applied to the MWh already in `public/power_money.json` (`y.fuels[key].mwh`) and to local solar MWh from `src/lib/local-resources.ts`. No change to `power_money.json` or `scripts/eia_fuel_costs.py`.
- New selector `toFederalRows(data, year)` in `src/lib/power-money.ts` (or the new lib) returning `{ key, label, color, statutoryRate, broaderLow, broaderHigh, mwh, totalUsd, deliveredRate }`, sorted by statutory rate descending.
- New `src/components/powermoney/FederalSupportCard.tsx` (or inline card in `src/pages/PowerMoney.tsx`, matching whatever the existing cards do) rendering a Recharts stacked horizontal `BarChart`.
- Existing charts, layer toggles, and data files are untouched.
- Before writing the rate table, verify each figure against primary sources (EIA direct-subsidy reports, JCT tax expenditure estimates, IRS credit values) and record the citation in the file; anything that cannot be sourced is omitted rather than guessed.
- Verification: typecheck, then Playwright load of `/power-money` to confirm the new card renders, the year selector works, and there are no console errors.
