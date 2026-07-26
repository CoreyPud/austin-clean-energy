## Add MW peak demand time-series to `/building-energy-usage`

Add a second chart below the existing MWh stacked area chart on `src/pages/BuildingEnergyUsage.tsx`, showing estimated peak MW contribution per year from newly permitted buildings, plus context KPIs comparing to Austin Energy's system totals.

### Constants (module-level in `src/lib/building-energy.ts`)

```
AUSTIN_ENERGY_ANNUAL_SALES_KWH = 14_000_000_000  // FY2024 AE annual report
AUSTIN_ENERGY_PEAK_MW          = 3067            // Aug 2023 record summer peak
LOAD_FACTOR                    = 0.5             // mixed-use assumption
HOURS_PER_YEAR                 = 8760
```

### New helper in `src/lib/building-energy.ts`

`peakMwByYear(rows)` → returns `{ year, peak_mw }[]`:
- For each year, sum `est_annual_kwh` across permits issued that year.
- `avg_kw = total_kwh / 8760`
- `peak_mw = (avg_kw / LOAD_FACTOR) / 1000`
- Round to 2 decimals.

Also extend `totals()` (or add `systemContext(rows)`) to return:
- `totalKwh`
- `pctOfAnnualSales = totalKwh / AUSTIN_ENERGY_ANNUAL_SALES_KWH * 100`
- `roughPeakMw = ((totalKwh / 8760) / LOAD_FACTOR) / 1000`
- `pctOfSystemPeak = roughPeakMw / AUSTIN_ENERGY_PEAK_MW * 100`

### UI changes in `src/pages/BuildingEnergyUsage.tsx`

1. **New section** below the existing MWh area chart, titled "Estimated peak MW added per year":
   - Recharts `LineChart` (single series) using `peakMwByYear` data.
   - Y-axis label "MW (peak)", tooltip formats to 2 decimals + " MW".
   - Short caption explaining this is per-year new-permit contribution, not cumulative.

2. **Extend KPI strip** (or add a second row) with two context cards:
   - "Est. peak MW added" — `roughPeakMw.toFixed(1)` MW, subtitle `"{pctOfSystemPeak.toFixed(2)}% of AE 3,067 MW peak"`.
   - "% of AE annual sales" — `pctOfAnnualSales.toFixed(2)}%`, subtitle "vs. 14 TWh FY2024".

3. **Methodology addendum** — new card in the existing "How this is calculated" section documenting the MW conversion:
   ```
   avg_kw     = total_annual_kwh / 8760
   peak_mw    = (avg_kw / load_factor) / 1000
   load_factor = 0.5   // mixed-use rough assumption
   ```
   Plus a note: AE annual sales ~14 TWh (FY2024 annual report), record system peak 3,067 MW (Aug 2023).

### Out of scope

- No new data file / no CSV changes.
- No changes to `/building-energy-use` (the separate ECAD explainer).
- No sitemap or homepage changes.
