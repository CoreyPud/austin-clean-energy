## Build the Austin Building Energy Usage page

Add a new public page at `/building-energy-usage` (distinct from existing `/building-energy-use` ECAD explainer) that visualizes estimated annual electricity load for newly permitted Austin buildings.

### Files to create

1. **`public/data/building-energy-usage.csv`** — placeholder with the 6-column header (`permit_id,issued_date,property_type,sqft,est_annual_kwh,permit_class`) and 3–4 sample rows. User will upload real CSV after (they've uploaded a larger raw file already; we'll leave replacement to them since column names differ).

2. **`src/lib/building-energy.ts`** — types + zero-dep CSV parser (handles quoted fields with commas) + `loadBuildingEnergyCsv`, `stackByYear`, `byPropertyType`, `totals` helpers.

3. **`src/pages/BuildingEnergyUsage.tsx`** — full page:
   - `useSeo` with specified title/description
   - Header: back link, "Austin at a Glance" eyebrow, H1, subtitle
   - Hero `Card` with 320px stacked `AreaChart` (recharts), Y-axis label "MWh / yr", loading + error states, 8-color palette from semantic tokens
   - 4-card KPI strip (permits, sqft, MWh, top type)
   - Horizontal `BarChart` by property type with `LabelList` showing "X MWh"
   - Permit table: top 10 rows sorted by `est_annual_kwh` desc, sortable headers, download CSV button, "Showing 10 of N" footer
   - Methodology: formula callout card, literature benchmarks table (single_family 6.48, residential_other 6.48, adu_accessory 8.94, personal_services 14.04, pool_spa n/a), sources with 4 external links, limitations `Alert`
   - Layout `max-w-6xl px-4`, shadcn components, tabular-nums, `Intl.NumberFormat`

### Files to modify

4. **`src/App.tsx`** — import `BuildingEnergyUsage`, add `<Route path="/building-energy-usage" ...>` inside `PublicLayout`.

5. **`src/pages/Index.tsx`** — add a 4th `FeatureCard` in the "Austin at a Glance" grid with a small stacked `AreaChart` preview (years 2023–2025, 8 property types, semantic colors, fillOpacity ~0.5).

6. **`src/pages/Sitemap.tsx`** — add entry with `Gauge` icon, title "Building Energy Usage", specified description.

### Notes

- Existing `/building-energy-use` page and its sitemap entry stay untouched.
- Chart palette uses `hsl(var(--primary))`, `hsl(var(--accent))`, plus fixed semantic-friendly hues for blue/amber/emerald/purple/red/cyan.
- No backend/database changes — CSV lives in `public/` and is fetched client-side.
- I'll skip updating `public/sitemap.xml` unless you want it included (it's a static XML file maintained manually per project memory).

Ready to implement on approval.