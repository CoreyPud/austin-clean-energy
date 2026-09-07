# Power Money: account for non-fuel costs, and drop "delivered"

## Wording fix (immediate)

The Effective cost per MWh card currently says "per megawatt-hour of energy delivered." That implies a retail/delivered price, which this number is not. Reword to "per megawatt-hour of energy generated or contracted," and add a one-line note that this excludes transmission, distribution, and other grid charges.

## What "other costs" actually are

Today the page counts only two things: reported fuel purchases, and contracted energy rates for fuels with no fuel price (nuclear, wind, solar, biomass, hydro). Everything else in a customer bill is missing. Those missing costs split into two very different buckets:

1. **Fuel-specific (can be attributed per fuel)**
   - Variable O&M ($/MWh) — consumables, water, wear tied to output
   - Fixed O&M ($/kW-yr) — staffing, maintenance, insurance on the plant itself
   - Capital / debt service ($/kW-yr) on AE-owned units (Decker, Sand Hill, Fayette share, STP share)
   - Emissions/compliance costs where applicable
2. **System-wide (cannot honestly be attributed per fuel)**
   - Transmission and distribution (ERCOT 4CP transmission cost of service, AE's own wires)
   - Congestion / basis, ancillary services, ERCOT administrative fees
   - Customer service, billing, general administration
   - Community Benefit Charge, GA transfer to the City

Attributing wires or congestion to "coal" vs "solar" would be fabricated precision. So the plan adds bucket 1 per fuel, and bucket 2 as a single separate layer.

## Proposed approach

Extend the model to three cost layers per year:

```text
Layer 1  Fuel / contracted energy      (already built, per fuel)
Layer 2  Non-fuel plant costs          (per fuel: variable O&M, fixed O&M, capital)
Layer 3  System costs                  (one bar segment: T&D, ancillary, congestion, admin)
```

Layers 1+2 give a defensible **cost of energy by fuel**. Layers 1+2+3 give a **total system cost** that can be sanity-checked against Austin Energy's published annual revenue requirement — and that check is the honesty test for the whole page.

Sources, in order of preference:
- **Austin Energy Approved Budget / Annual Report** — actual dollars for purchased power, O&M, debt service, transmission, transfers. This is the authoritative system-level anchor for Layer 3 and for calibrating Layer 2 totals.
- **NREL Annual Technology Baseline (ATB)** — technology-level variable and fixed O&M and capital cost by vintage, used to split Layer 2 across fuels. Published, citable, clearly an estimate.
- **EIA-860** — nameplate capacity and online year per AE unit, needed to turn $/kW-yr into dollars.

Rule kept from the rest of the site: anything modeled is labeled as an estimate, with its source named inline, and never presented as a bill amount.

## UI changes

- New **cost layer** toggle on the spend chart: `Fuel only` (today's view) / `Fuel + plant O&M and capital` / `Full system cost`.
- Add a stacked "System costs (not fuel-specific)" segment in the full-system view, in a neutral gray, with an explicit tooltip that it is not allocated by fuel.
- Effective $/MWh chart gains a matching toggle so a fuel's rate can be seen with and without its non-fuel costs; axis label says "generated / contracted," not "delivered."
- New headline card: total system cost per MWh vs. AE's published average residential rate, so the gap between "what energy costs" and "what a bill costs" is visible instead of implied.
- Methodology section extended with a table of every non-fuel assumption ($/MWh, $/kW-yr, source, year of source) and a plain statement of what is still excluded.

## Technical notes

- `scripts/eia_fuel_costs.py` gains a non-fuel cost step: an `NONFUEL_RATES` table (variable O&M $/MWh, fixed O&M $/kW-yr, capital $/kW-yr per fuel, with source strings), AE unit capacities from EIA-860, and a `SYSTEM_COSTS` series taken from AE budget documents by year with interpolation for gaps.
- `public/power_money.json` schema extends each fuel entry with `varOmUsd`, `fixedOmUsd`, `capitalUsd`, and each year with `systemCostsUsd`, plus `assumptions.nonFuel` and `assumptions.systemCosts` including source citations.
- `src/lib/power-money.ts` gains a `CostLayer` type and layer-aware `toChartRows` / `toRateRows`; existing fuel-only behavior stays the default so nothing regresses if the JSON is older than the code.
- `src/pages/PowerMoney.tsx` adds the layer toggle, the system-cost segment, the rate-comparison card, and the expanded methodology.
- Non-fuel dollars only exist for years where an AE budget figure or ATB vintage is available; earlier years render the fuel-only layer and are labeled as such rather than back-filled with guesses.

## Open item

Historic AE budget line items are not machine-readable back to 2001. Coverage for Layer 3 will start from the earliest year with a retrievable budget document, and the page will state that start year explicitly.
