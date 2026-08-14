# Standard Offer Pro Forma with After-Tax IRR

Add a detailed Standard Offer (SSO) pro forma section to the property assessment page, showing a full 30-year cash flow with O&M expenses, depreciation, and an after-tax IRR — driven by the assumptions in your spreadsheet.

## First: the spreadsheet

No spreadsheet came through with the last message. Attach the .xlsx (or Google Sheet link) and I'll read its SSO tab to pull the exact assumptions and formula structure:

- O&M cost basis ($/kW-yr or % of capex) and annual escalation
- Depreciation method and schedule (MACRS 5-yr, straight line, bonus depreciation %)
- Tax rate, inflation/degradation, insurance, inverter replacement, analysis term
- Whether IRR is levered (with debt) or unlevered, and any terminal/salvage value

Until it arrives I can't lock the numbers. If you'd rather start now, I'll build the structure with clearly labeled industry-standard placeholders (MACRS 5-yr + 21% tax rate + $15/kW-yr O&M at 2.5% escalation) and swap in your spreadsheet values as a follow-up.

## What gets built

A new "Standard Offer pro forma" section, shown only when the Standard Offer billing mode is active (commercial, roof capacity above the program threshold). The existing simple payback view and revenue chart stay exactly as they are.

The section contains:

1. **Headline metrics row** — After-tax IRR, NPV at the spreadsheet's discount rate, simple payback year, and 30-year net after-tax cash flow.
2. **Cash flow table** — year-by-year rows: production (kWh, degraded), SSO revenue, O&M expense, EBITDA, depreciation, taxable income, tax, after-tax cash flow, cumulative cash flow.
3. **Cumulative after-tax cash flow chart** — replaces/complements the current pre-tax cumulative line inside this section, with the break-even crossing marked.
4. **Assumptions panel** — every fixed input listed with its value and a source note citing the spreadsheet, per the project's data-transparency rule. Includes a disclaimer that these are estimates, not a tax opinion.

## Technical notes

- New module `src/lib/sso-proforma.ts`:
  - `buildSsoProForma(systemKw, productionPerKw, installCost)` returning typed yearly rows plus `irr`, `npv`, `paybackYear`, `totalAfterTaxCashFlow`.
  - Depreciation schedule helper (MACRS 5-yr table or straight line, per spreadsheet) applied to the depreciable basis (capex less any rebate/incentive treatment the spreadsheet specifies).
  - `irr()` via Newton–Raphson with bisection fallback, guarding the no-solution case (returns null, UI shows "n/a" rather than a bogus number).
  - Assumption constants exported in one `SSO_PROFORMA_ASSUMPTIONS` object so the UI can render the assumptions panel from a single source.
- New component `src/components/assessment/SsoProForma.tsx` using existing Card/Table/Recharts patterns and semantic design tokens only.
- Rendered from `src/pages/PropertyAssessment.tsx` next to `SolarCalculator`, gated on the same `ssoEligible` / `billingMode === "sso"` condition already in that file.
- `src/lib/solar-model.ts` and `buildSsoModel` are left untouched, so nothing on `PropertyPage` changes.
- Frontend-only; no database or edge function changes.
