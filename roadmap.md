# Current
- [ ] Add sourced substations to the RFP 2026 map and nearest-substation ranked-table details; verify locations, layer toggle, and distance calculations.
- [x] Add a Solar Progress link and sortable, filterable permit table with address, recorded size, TCAD host/owner, contractor, and record details; verified all 19,054 corrected records load, combined filters find a real 132 kW permit, sorting/pagination/details work, phone has no page overflow, 4 tests pass and build OK. TCAD owner is not a verified solar host; missing fields remain explicitly unreported.
- [x] Correct automatic commercial/nonprofit CBI/PBI scenarios using shared AC thresholds and add upfront CBI / annual PBI columns; 64 tests pass, real nonprofit assessment switches at estimated 200 kW AC, cash/financed PBI and phone layout verified, build OK. July 2026 announcement conflicts with older nonprofit CBI guidance, so eligibility remains explicitly subject to Austin Energy confirmation. Rebate intake and project-share functions deployed; public frontend awaits publishing.
- [x] Add an expandable 25-year financial breakdown for all property types and existing cash/financing and utility incentive options. Verified real address assessment, financing updates, commercial SSO/PBI, nonprofit direct pay, multifamily tenant credits, and phone layout; 40 tests pass. Existing 30-year charts and separate investor pro forma are unchanged.
- [x] Fix Solar Suite Plans / Schedule navigation and add Austin Energy documents and private application access across all three tools; verified menu clicks, Plan Set Viewer, all three legacy links with query/anchor preservation, document menu and application navigation; no browser errors and build OK. External PDF contents remain unverified.
- [x] Add solar intake fields, owner-selected saved assessment / layout imports, unique-match TCAD lookup, AC-based suggested form routing and expanded encrypted admin exports. Verified layout import, CBI/PBI switch, private save/reopen, consent and actual admin CSV download; 21 tests pass and build OK. Official PDF downloads return 403, so exact field-by-field PDF completion remains unverified; worksheets link official forms and require reviewer verification and signatures.
- [x] Add encrypted, owner-private rebate drafts and consent-based, audited admin review/export. Verified signed-in synthetic PDF extraction, save/reopen, review, actual admin login and CSV download; 12 tests pass and build OK. CSV is a worksheet; official forms, signatures and utility submission remain separate.
- [x] Switch bill parsing to Lovable AI Gateway with Gemini 3.8 Flash; deployed and verified synthetic 12-month PDF through the live upload, all values correct, 5 tests pass, build OK; request 01a18f6b-88ab-7043-bd92-9ea1a96833e5 at 2026-10-31T00:45:55Z used 0.007806 credits.
- [x] Add a separate permit-size-weighted commercial solar bar alongside the residential comparison; verified real 2024–2026 cohorts, shared CBI/PBI thresholds, missing-kW disclosure, 52 tests, and build OK.
- [x] Check US Semrush keyword demand and competition for eight URL renames, then update routes, links, metadata and sitemaps while preserving old links; use /clean-energy-technology-database for ATB Options and verify navigation. Verified eight legacy links, parameters/anchors, metadata, database navigation/data and reload; hosting supports client-side replacements, not HTTP 301 rules.
- [x] Add a sortable saved-properties table with address search, property-type filtering, and persistent low-income incentive selections; verify saved changes and financials.
- [x] Automatically detect assessment property type from TCAD and enable Standard Offer for nonprofits and multifamily; verify lookup and program switching.
- [x] Correct Standard Offer escalation to 0.5% after year 10 and verify the rate schedule.
- [x] Verify rebate/federal incentive interaction; add commercial/nonprofit federal benefits and selectable low-income/domestic-content bonuses, persist selections, and verify financial updates.
- [x] Clarify and verify commercial improvement returns include lower electricity usage and bill savings, separate from rebates and program payments.
- [x] Update Load Zone Outlook from the revised supplied files, preserve Texas map, and verify new table and timeline.
- [x] Add a sourced, adjustable ERCOT supply/demand/gap scenario table for 2027–2045 and verify calculations and controls.
- [x] Give the Load Zone Outlook map a sourced Texas boundary and hover details for every symbol; verify hover and tap.
- [x] Add Austin Load Zone Outlook from supplied files, match site colors, and verify chart and map controls.
- [x] Add Austin IRP Planning from supplied files, match site styling, and verify inputs and outputs.
- [x] Add Innovation Gap from the supplied files, link it under Grid Planning Tools, and verify the page.
- [x] Split Progress and Resources into Austin at a Glance and What You Can Do pages; update home and sitemap links.
- [x] Add `/kwh-cost` from the Secret Vote project, including navigation, sitemap, and Work Sans.
- [x] Add `dollar_amount` to council decisions and agenda sync extraction.
- [x] Unify research page headers, fonts, widths, and section hierarchy; simplify the energy timeline and Case for Austin Energy.
- [x] Tighten nonprofit lender slider values, apply the annual bill to savings, and lead with 25-year savings.

# Roadmap

- [x] `/energy-education` quiz page (5 modules, pre/post questions, explanations)
- [x] `properties-bulk`: stale-while-revalidate regeneration via `EdgeRuntime.waitUntil()`
- [x] Add and brand the Load Growth Estimator at `/load-estimator`
- [x] Add home-page tiles for Case for Austin Energy, Pricing Pressure, Load Estimator, and Peaker vs. Battery
- [x] Streamline the four new research pages and collapse supporting detail
- [x] Unify new research and course pages with the Austin's Solar Progress layout
- [x] Peaker proforma: extend horizon/plant life to 40 years (was 20)
- [x] Peaker proforma: lifetime total cost strip, output-degradation control, header spacing
- [x] Peaker proforma: drop Equity IRR tile, default 400 MW and $2,500/kW CapEx
- [x] Peaker proforma: Project NPV number shown in white, not red
