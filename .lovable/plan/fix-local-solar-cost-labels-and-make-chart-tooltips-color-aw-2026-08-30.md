# Fix local solar cost labels and make chart tooltips color-aware

## What's wrong today

You're right on both counts.

**1. Local solar has no plant O&M, and the chart says it does.**

In the source comparison chart, every bar has the same three segments, and the tooltip/legend
labels are hardcoded generic names:

- Segment 1 is labeled "Fuel / contracted energy"
- Segment 2 is labeled "Plant O&M + capital (est.)"
- Segment 3 is labeled "System delivery costs (est.)"

For local solar, the underlying numbers are actually:

- Segment 1 = the Value of Solar bill credit Austin Energy pays the customer (9.91 cents/kWh)
- Segment 2 = the up-front rebate, spread over the 25-year system life — **not** O&M or capital
- Segment 3 = zero, because rooftop generation never crosses the grid

So the model is not charging local solar for maintenance it doesn't pay for; the label is simply
wrong. Customers own and maintain these systems. Austin Energy's only costs are the credits it pays
out, the rebate it writes at install, and internal program administration.

**2. Tooltips don't tell you which color you're reading.**

The tooltip lists three rows of dollar values with text labels, but no color swatch, so there's no
way to connect a number to the segment you're hovering.

## What I'll change

### Local solar labeling

- Make segment labels per-row instead of global. For local solar, segment 1 reads "Value of Solar
  bill credit" and segment 2 reads "Rebate, amortized over 25 years". For the utility-scale sources
  they stay "Fuel / contracted energy" and "Plant O&M + capital (est.)".
- Same fix on the legend: since a single legend can't carry two meanings, the legend entries become
  "Energy payment (fuel, contract, or bill credit)", "Plant O&M + capital, or amortized rebate",
  "System delivery costs (est.)", with the precise meaning shown in the tooltip and in the caption.
- Rewrite the local-solar caption under the chart to say explicitly: Austin Energy does not own,
  operate or maintain these systems — customers do. The utility's cost is the bill credit plus the
  rebate; program administration and permitting review are internal overhead that already sits in
  the system-cost layer, and are not double-counted here.
- In the "Local solar and batteries" card, rename the "Local solar, all-in cost" caption from
  "No fuel, no plant, no delivery" to name what the two pieces are, and add a sentence that no
  O&M is charged because customers maintain their own equipment.

### Tooltips with color swatches

- Add a shared custom tooltip renderer that draws a small colored square for each row, matching the
  exact fill of the segment or line it describes, followed by the label and value.
- Apply it to all three charts on the page: dollars-by-fuel-source-by-year, effective cost per MWh,
  and the source comparison. The line chart gets the same swatch treatment so dashed contracted-rate
  lines are identifiable too.
- For the comparison chart, order tooltip rows bottom-up so they read in the same order as the
  stacked segments, and keep the header line showing the source, total $/MWh, MWh and share.
- Suppress zero-value rows (e.g. local solar's system segment) so the tooltip doesn't list a
  segment that isn't drawn.

## Technical notes

- `src/pages/PowerMoney.tsx` — new local `ChartTooltip` component used as `<Tooltip content={...}>`
  on all three charts; per-row segment label helper keyed off `ComparisonRow.key === "localSolar"`;
  caption and card copy updates.
- `src/lib/power-money.ts` — no math changes. If a per-row label is cleaner to carry on the row, add
  optional `fuelLabel` / `nonFuelLabel` fields to `ComparisonRow` and populate them where the row is
  built.
- `src/lib/local-resources.ts` — no rate changes; the rebate amortization stays as is since it is a
  real Austin Energy outlay.
- Verify with a typecheck plus a Playwright pass on `/power-money` capturing a hovered tooltip on
  the local solar bar.
