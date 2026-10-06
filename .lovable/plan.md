# Peaker Proforma: lifetime cost, output aging, header spacing

## What you asked for

1. A total-cost figure that captures everything the plant costs over its life, shown at the top.
2. Output that fades as the plant ages. Right now it does not: the model calculates annual generation once and reuses the identical number in every year, so a 40-year-old unit is assumed to produce exactly what it did on day one. Real peakers do lose output, so a new control will model that decline.
3. A little breathing room between the green header and the calculator.

## Changes

### 1. Lifetime cost strip above the KPI cards

A full-width card sits directly above the existing five KPI cards, showing three figures:

```text
+----------------------------------------------------------------------------+
| TOTAL COST OF OWNERSHIP, 40 YEARS                                          |
|  $6,120.5M        $3,412.8M in today's dollars        $148.20 / MWh         |
|  as paid          discounted at 8.5% WACC             all-in, lifetime     |
+----------------------------------------------------------------------------+
```

- **As paid** — the plain sum of every dollar spent across the plant life.
- **In today's dollars** — the same money discounted at the WACC slider, so it can be read next to the NPV card.
- **Per MWh** — the as-paid total divided by lifetime energy actually delivered.

What counts as a cost: build cost (CapEx), fuel, fixed O&M, variable O&M, loan interest, income taxes, and decommissioning. Loan principal is deliberately left out because the build cost is already counted in full — including both would bill you twice for the same turbine. Decommissioning is counted once, at the end of life. The existing NPV and IRR math keeps its current treatment (decommissioning appears both as a present value in Year 0 and again in the final year, as originally specified); the new total is stated separately so the two are not confused.

Tooltips on each figure spell out exactly which items are inside the number.

### 2. Output degradation control

A new slider in the Plant group: **Output degradation**, 0% to 2% per year, defaulting to **0.5% per year**.

- Each year's generation is reduced by that compounding rate, so energy revenue, fuel burn, and variable O&M all follow the declining output.
- At the default, a 40-year-old unit produces roughly 17% less than in year one, and the annual table's "Gen (MWh)" column visibly steps down year by year.
- Fixed O&M stays charged on nameplate capacity, and ancillary services stay priced on nameplate capacity — the decline is applied to energy only. This is stated in the note at the bottom of the page.
- Setting the slider to 0% restores today's behaviour exactly.

### 3. Header spacing

The calculator area gets a small top gap so the assumption panel and KPI cards no longer sit flush against the header band. This is applied to this page only; the shared header used by every other page is untouched.

## Technical details

All work is in `src/pages/PeakerProforma.tsx`.

- `Inputs` gains `deg: number`, with `DEFAULTS.deg = 0.5`, plus a new `GROUPS` control under **Plant**: key `deg`, label "Output degradation", min 0, max 2, step 0.05, displayed as a percent per year.
- In `model()`: hoist `mwhBase = i.mw * 8760 * (i.cf / 100)` and inside the year loop compute `const mwh = mwhBase * Math.pow(1 - i.deg / 100, y - 1);` — every downstream line (energy revenue, fuel, variable O&M) already reads `mwh`, so they follow automatically.
- Accumulate inside the loop: `totalFuel`, `totalOm`, `totalInterest`, `totalTaxes`, `totalMwh`, and a discounted counterpart using `Math.pow(1 + wacc, y)`.
- Return `totalCostNominal = capex + totalFuel + totalOm + totalInterest + totalTaxes + i.decom`, `totalCostPv = capex + pvFuel + pvOm + pvInterest + pvTaxes + i.decom / Math.pow(1 + wacc, L)`, and `costPerMwh = totalCostNominal / totalMwh`.
- New `CostStrip` component (same card styling as `Kpi`, three columns) rendered above the existing `<div className="grid gap-3 grid-cols-2 xl:grid-cols-5">`, which stays as is.
- Page body container gains `pt-6` (currently `max-w-7xl mx-auto px-4 pb-16`).
- Bottom disclaimer gains two sentences: degradation is applied to energy only, and the lifetime total counts CapEx once and decommissioning once.

## Verification

- `bunx tsgo --noEmit -p tsconfig.app.json`.
- Browser check at `/peaker-proforma`: the strip renders with all three figures; dragging Output degradation to 0% makes the table's Gen column constant again and leaves the total unchanged from the flat case; raising it lowers later-year generation, fuel, and the lifetime cost; the gap under the header is visible in a screenshot.
