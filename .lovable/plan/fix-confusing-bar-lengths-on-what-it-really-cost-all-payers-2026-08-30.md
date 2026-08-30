# Fix confusing bar lengths on "What it really cost, all payers"

## What's wrong

The bar for each source is drawn as five stacked segments, and the last one is the pale
"broader federal estimates" band. So the drawn length is combined cost **plus** the width
of the uncertainty band, while the number printed at the end of the bar is the combined
cost only.

Sources with a wide band (utility solar, wind) get long bars for a smaller printed number;
natural gas, with a narrow band, gets a shorter bar for a bigger number. Rows are also
sorted by combined cost, so the ordering doesn't match the visual lengths either. Result:
$137 renders shorter than $131.

## The fix

Make bar length mean exactly one thing: combined $/MWh.

- Remove the pale band from the stack, so each bar ends at its combined cost and the label
  sits right at the bar end. Longest bar = biggest number, always.
- Keep the uncertainty visible instead of deleting it: draw the broader-estimate range as a
  thin light tick/whisker extending past the bar end, visually distinct from the cost
  segments, with its own legend entry ("broader federal estimate, upper bound").
- Add a "Broader federal range $/MWh" column to the table beneath the chart so the wider
  numbers are still readable and citable.
- Reserve enough right margin that the whisker and the label never collide.

Nothing changes in the underlying numbers, the year selector, the other charts, or the
federal-support card above.

## Technical notes

- In `src/pages/PowerMoney.tsx`, the combined chart's `broaderBand` `<Bar>` stops carrying
  the `combinedRate` `LabelList`; the label moves to the `federalRate` bar (last segment of
  the real stack) with `position="right"`.
- The band renders in a second `stackId` alongside the cost stack, drawn with low opacity
  and a small fixed pixel height so it reads as a range marker rather than a cost segment —
  or, if that reads poorly, as a `ReferenceLine`-style tick per row.
- Table gets one more column from the existing `broaderHigh` field on `TotalCostRow`; no
  change to `src/lib/federal-support.ts`.
- Verify with a typecheck, then load `/power-money` in Playwright, confirm bar order matches
  label order descending and no console errors.
