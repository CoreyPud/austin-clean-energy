# Add curated stats materialized views

First slice of a data-access layer over the site's datasets: eight `public.stats_*`
materialized views plus a `refresh_stats_views()` function. Aggregates only, no
row-level PII, granted to `anon` so they're reachable through PostgREST and, later, an
MCP server. Full DDL: `supabase/migrations/20260910000000_stats_materialized_views.sql`.

## Why these eight

Picked for: data lives in the DB (not a Socrata-on-the-fly computation), chart-shaped
(time series or category breakdown), matches something the site already renders so the
numbers can be validated, and no personal data.

| View | Grain | Measures | Validate against |
|---|---|---|---|
| `stats_solar_by_year` | calendar year, 2014+ | installs, battery_installs, solar_only_installs, total_kw | `yearly-stats` edge function |
| `stats_solar_by_fiscal_year` | Austin FY (Oct-Sep), 2015+ | same | `fiscal-year-stats` |
| `stats_solar_by_quarter` | year + quarter, 2014+ | same (+ `period` label) | `quarterly-stats` |
| `stats_solar_by_district` | council district x year | installs, total_kw | council / People With Power pages |
| `stats_solar_permit_timeline` | year of application, 2014+ | permits, avg_days, median_days (applied to completed) | `permit-timeline-stats` |
| `stats_generation_by_month_fuel` | month (`YYYY-MM`) x fuel | catalog_avg_mw, austin_energy_avg_mw (ae_pct-weighted) | No2Section generation-mix chart |
| `stats_ev_charging_by_year` | year opened (Austin) | stations_opened, L1/L2/DC-fast ports, cumulative_stations, cumulative_ports | EV Progress page, AdminSchemaDocs example |
| `stats_council_climate_votes_by_year` | meeting year | climate_items, unanimous_yes, contested, avg_yes_votes, avg_no_votes | `council_votes` where `is_climate` |

Deliberately **excluded** for now: campaign finance and lobbying (computed from Socrata
into `cached_stats` / jsonb columns, not clean relational tables), zip-level solar (a
materialized `solar_permits_by_year_class_zip` already exists), `tcad_solar_adoption_by_year`
(already a view; materialize later if it gets slow).

## Blessed logic notes

- Source for all solar views is a new helper view `solar_installs_deduped`:
  `solar_installations_view` (corrections merged, `is_duplicate` dropped) then
  `DISTINCT ON (project_id)` keeping the most recent record, matching what the edge
  functions do in JS.
- Calendar-year bucket = `COALESCE(year(completed_date), year(issued_date), calendar_year_issued)`,
  same cascade as the existing `solar_permits_by_year_class_zip` matview.
- FY / quarter bucket = `COALESCE(completed_date, issued_date)` per row. `fiscal-year-stats`
  instead retries a whole FY on `issued_date` only when its `completed_date` count is zero;
  the per-row version matches the newer `quarterly-stats` and is closer to correct for
  sparse early years. Expect small differences vs `fiscal-year-stats` for 2015-2017.
- Battery test: `description ~* '(bess|batter|energy storage|powerwall|backup)'`.
- `ae_pct` is a percent (0-100) per AdminSchemaDocs, so AE-weighted MW divides by 100.
- EV view filters `city ILIKE 'austin'`, matching the AdminSchemaDocs query convention.

## Apply through Lovable

Paste this into the Lovable chat for the project:

> Create a database migration that adds eight read-only materialized views plus a
> refresh function, exactly as written in the SQL below. Do not change the SQL. After
> it runs, confirm all eight views exist, are populated, are granted SELECT to `anon`
> and `authenticated`, and each has its UNIQUE index; then run
> `select public.refresh_stats_views();` once and report row counts per view.
>
> ```sql
> <paste the full contents of supabase/migrations/20260910000000_stats_materialized_views.sql>
> ```

Then regenerate `src/integrations/supabase/types.ts` (Lovable does this automatically on
schema change; if not, ask it to) so the new views are typed for the client.

## Validate (Supabase SQL editor, after refresh)

```sql
-- Row counts + latest period per view
select 'solar_by_year' v, count(*), max(year)::text from stats_solar_by_year
union all select 'solar_by_fiscal_year', count(*), max(fiscal_year)::text from stats_solar_by_fiscal_year
union all select 'solar_by_quarter', count(*), max(period) from stats_solar_by_quarter
union all select 'solar_by_district', count(*), max(year)::text from stats_solar_by_district
union all select 'solar_permit_timeline', count(*), max(year)::text from stats_solar_permit_timeline
union all select 'generation_by_month_fuel', count(*), max(period) from stats_generation_by_month_fuel
union all select 'ev_charging_by_year', count(*), max(year)::text from stats_ev_charging_by_year
union all select 'council_climate_votes_by_year', count(*), max(year)::text from stats_council_climate_votes_by_year;

-- Spot-check: view total vs a direct recompute for recent years
select year, installs, total_kw from stats_solar_by_year where year >= 2020 order by year;
```

Compare those `stats_solar_by_year` rows to `supabase.functions.invoke('yearly-stats')`
and `stats_solar_by_fiscal_year` to `fiscal-year-stats`. Small deltas are expected from
the FY bucketing change above; large deltas mean the dedup or year cascade is off.

## Next slices (not in this migration)

- zip-level solar headline counts (distinct from the parcel-matched `solar_permits_by_year_class_zip`)
- `stats_pir_interconnections_by_month` from `pir_installations`
- `stats_lobbying_by_sector_year` from `lobbyist_clients`
- `stats_power_plants_by_fuel` snapshot (capacity, CO2, AE share)
- once ~10-12 views are stable and validated: an OpenAPI doc over PostgREST, then a thin
  MCP server wrapping it (see `.lovable/plan/add-the-chart-generator-2026-09-10.md` context)
