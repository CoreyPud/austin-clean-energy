# Demand Distribution map (/demand-distribution)

A map of Austin showing where electricity demand sits. Dot color = building type, dot size = estimated load. A switch flips between **Today's demand** (all ~360,000 mapped county properties) and **New since 2020** (~22,000 permitted buildings).

## How it stays fast and still shows everything

```text
Zoomed out (city view)    -> heat grid: ~500 m squares, each colored by total MW in it
                             (all demand in one view, tiny download)
Zoom 14+ (neighborhood)   -> individual dots for just the visible area
```

Load-speed measures:
1. Grid totals are pre-computed once in the database, so the city view is a few thousand squares, not 360,000 points.
2. Dots load only for the area on screen, with a cap, and refresh as you pan.
3. Filters: building type (homes, apartments, condos, commercial, other), year built (e.g. last 5 years), and minimum load size — these shrink both the grid and the dots.
4. Dots drawn on a single canvas layer rather than separate markers.
5. Side panel: total estimated MW by type for the current filter, compared to Austin Energy's 3,067 MW record peak.

## Load estimate (shown openly on the page)
- Homes: 13,152 kWh/yr each (EIA Texas average, same as the Load Estimator).
- Apartments, condos, commercial, other: footprint sq ft x the same per-type energy-use benchmarks used on Building Demand Growth.
- kWh converted to peak MW with the existing 0.5 load factor.
- Caveat on page: county data gives building footprint, not floor area, so multi-story buildings are undercounted; ~270,000 parcels have no type and are left out (count displayed).

## New since 2020 view
The permit list has no map locations. A one-time step matches each permit number to the City's open permit data to get its coordinates; any unmatched permits are counted and noted on the page.

## Placement
Tile under Grid Planning Tools on Austin at a Glance, plus sitemap entries. Same green header and layout as other research pages.

## Technical details
- Migration: `demand_grid` table (cell id, lat/lon, type, year bucket, mw, count) built from `tcad_properties` with an EUI-per-type lookup; `permit_locations` table (permit_id, lat, lon). Public read RLS, refresh function.
- Edge function `demand-points` returns filtered points for a bounding box (limit ~20k, type/year filters).
- Map: existing Mapbox setup (as used on the decarb map) with a GeoJSON grid layer and a circle layer, data-driven radius/color.
- Permit geocoding: script hitting the City of Austin issued-permits dataset by permit number, batch-inserted.
