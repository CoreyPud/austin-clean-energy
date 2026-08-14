# Standard Offer Pro Forma with IRR

Add a detailed Standard Offer pro forma section to the property assessment page that mirrors the uploaded `Standard_offer_financial_model_stand_alone.xlsx` — third-party-owner (TPO) economics with lease payment, O&M, inverter replacement, ITC and depreciation credit, and an IRR to the TPO. The existing simple Standard Offer payback view stays as is.

## Two scenarios from the spreadsheet

The scenario is picked automatically from the system size, matching the two tabs:

| Assumption | Under 1,300 kWdc ("Ground") | 1,300 kWdc and above ("Large") |
|---|---|---|
| Cost per watt | $1.85 | $1.90 |
| Watts per panel | 550 | 400 |
| Annual yield | 1,350 kWh-ac per kWdc | 1,450 kWh-ac per kWdc |
| Standard Offer rate | $0.11 / kWh | $0.08 / kWh |
| Lease payment to property owner | $30,000 / yr | $16,000 / yr |

Shared assumptions: 0.5% annual production degradation; SSO rate steps up $0.02 in year 6, $0.04 in year 11, $0.06 in year 16; O&M $10 per kWdc-yr escalating 2%; inverter replacement of $8,000 per 125 kW (rounded up) in year 14; property taxes $0 (flagged as unknown, per the spreadsheet note); 25-year term.

Incentives: 30% ITC plus a simplified depreciation credit of 21% of (system cost less ITC), both received in year 2 — exactly as the spreadsheet models them. Both are clearly labeled as commercial/TPO incentives (this is separate from the residential tax credit the site never claims), with the "if commissioned before 12/31/2027" caveat shown.

IRR is computed on the same cash flow series the spreadsheet uses: year 1 includes the full capex outflow, year 2 adds the ITC and depreciation credit, and every year nets revenue less lease, O&M, and property taxes.

## What the page shows

A new "Standard Offer pro forma (third-party owner)" section, rendered only when Standard Offer mode is active on a commercial property:

1. **Headline metrics** — IRR to TPO, net cost after incentives, total system cost, annual year-1 revenue, and the lease income to the property owner.
2. **Cash flow table** — year, production kWh-ac, Standard Offer revenue, lease payment, O&M, annual expenses, incentives, and net cash flow to TPO, with a cumulative column.
3. **Cumulative cash flow chart** with the break-even crossing marked.
4. **Assumptions panel** listing every input, its value, the active scenario, and a source note citing the uploaded model, plus a disclaimer that these are estimates and not tax or investment advice.

## Technical notes

- New `src/lib/sso-proforma.ts`:
  - `SSO_SCENARIOS` with the two parameter sets above and a `pickScenario(systemKw)` helper at the 1,300 kWdc boundary.
  - `buildSsoProForma(systemKw)` returning `{ scenario, systemCost, itc, depreciationCredit, netCost, rows[], irr, paybackYear, cumulative[] }` where each row holds production, revenue, lease, O&M, expenses, incentives, and net cash flow.
  - `irr(cashflows)` via bisection over a bracketed rate range, returning `null` when no sign change exists so the UI can show "n/a" instead of a fabricated number.
  - Cleaned-up escalation: the spreadsheet's O&M column has a few stray references that break the 2% chain in later years (rows mixing 1.02 and 1.04 off different base cells); the port applies the stated 2% escalation consistently and notes that in the assumptions panel. Same for two off-by-one revenue references in the spreadsheet's cash-flow column.
- New `src/components/assessment/SsoProForma.tsx` using existing Card / Table / Recharts patterns and semantic design tokens only.
- Rendered from `src/pages/PropertyAssessment.tsx` beside `SolarCalculator`, gated on the existing `ssoEligible` / `billingMode === "sso"` state.
- `src/lib/solar-model.ts` and `buildSsoModel` are untouched, so `PropertyPage` behavior does not change.
- Frontend only — no database, edge function, or schema changes.
