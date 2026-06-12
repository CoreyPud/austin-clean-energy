# Data Pipeline Scripts

Python scripts for enriching the Austin Energy solar dataset with county appraisal district property data. Run locally — not deployed. All outputs go to `~/Downloads/`.

## Setup

Install dependencies: `pip install pandas requests`

## Pipeline — run in order

### 1. tcad_enrich.py

Fetches all ~373k Travis County parcels from the Travis County GIS API, joins improvement detail CSVs (building sqft, stories, year built), and matches against Supabase solar_installations to set the has_solar flag.

**Prerequisite:** Download the TCAD improvement detail CSVs from tcad.org (Data Downloads → Improvement Detail) and extract to `~/Downloads/improvement_detail_2026/`.

Outputs: `tcad_enriched.csv` (391,385 rows), `tcad_solar_joined.csv`, `tcad_parcels_cache.csv`

---

### 2. solar_parcel_match.py

Queries the Travis County parcel API by lat/lon for each of the ~19k solar installations to get their TCAD parcel ID. Falls back to address matching for records without coordinates. Uses 15 parallel workers (~13 min runtime).

Result: 17,206/19,419 matched (88.6%) — 17,130 spatial, 76 address, 2,213 unmatched

Output: `solar_parcel_matches.csv` (19,419 rows)

---

### 3. wcad_parcel_match.py

Takes the 2,213 unmatched records from `solar_parcel_matches.csv` and queries the Williamson County parcel API by lat/lon. Run after step 2.

Result: 643/2,213 matched (29.1%) — remaining installs are outside both counties

Output: `wcad_parcel_matches.csv` (2,213 rows)

---

### 4. wcad_enrich.py

Fetches all WCAD parcels in AE-territory ZIPs (pulled live from Supabase solar_installations.original_zip), marks has_solar from wcad_parcel_matches.csv.

Output: `wcad_enriched.csv` (60,981 rows), `wcad_parcels_cache.csv`

---

### 5. wcad_improvement_join.py

Downloads improvement detail from the WCAD Socrata open data portal (~247k rows) and joins year_built onto wcad_enriched.csv where available (~20% coverage). Fills remaining nulls with 2010 since charts only go back to 2014.

Updates `wcad_enriched.csv` in place. Cache: `wcad_improvement_cache.csv`

---

## Columns

### tcad_enriched.csv — 391,385 rows

| Column | Source | Notes |
|--------|--------|-------|
| pID | TCAD improvement detail CSVs | Travis County property ID (integer) |
| stateCd | TCAD improvement detail CSVs | Texas state property class code (e.g. A1, F1) |
| TotgrossArea | TCAD improvement detail CSVs | Total gross building area sqft (max across improvements) |
| max_stories | TCAD improvement detail CSVs | Number of stories (max across improvements) |
| year_built | TCAD improvement detail CSVs | Year built (min across improvements) |
| estimated_roof_sqft | Derived | TotgrossArea / max_stories |
| situs_address | Travis County parcel API | Property street address |
| situs_zip | Travis County parcel API | ZIP code |
| market_value | Travis County parcel API | Assessed market value |
| land_type_desc | Travis County parcel API | Land use description (e.g. "SINGLE FAMILY RESIDENCE") |
| py_owner_name | Travis County parcel API | Owner name |
| hyperlink | Travis County parcel API | Link to TCAD property detail page |
| tcad_acres | Travis County parcel API | Lot size in acres |
| sub_dec | Travis County parcel API | Subdivision description |
| entities | Travis County parcel API | Taxing entities |
| in_ae | Derived | True if situs_zip is in Austin Energy territory ZIP list |
| has_solar | Derived | True if address matches a solar_installations record |
| property_type | Derived | Mapped from land_type_desc: single_family, multifamily, condo, commercial, other |

### wcad_enriched.csv — 60,981 rows

| Column | Source | Notes |
|--------|--------|-------|
| pID | WCAD GIS API (PARCELID) | Williamson County property ID, format "R######" |
| situs_address | WCAD GIS API (SITEADDRESS) | Property street address |
| situs_zip | WCAD GIS API (PSTLZIP5) | ZIP code |
| market_value | WCAD GIS API (TotalPropMktValue) | Assessed market value |
| land_type_desc | WCAD GIS API (USECD) | Use code: RES, CA, C1–C6, L, LTR, etc. |
| py_owner_name | WCAD GIS API (OWNERNME1) | Owner name |
| TotgrossArea | WCAD GIS API (TotalSqFtLivingArea) | Total sq ft living area |
| max_stories | — | Always null — not exposed by WCAD API |
| year_built | WCAD Socrata API (feffyear) | ~20% coverage; nulls filled with 2010 |
| estimated_roof_sqft | Derived | Same as TotgrossArea (no stories to divide by) |
| property_type | Derived | Mapped from USECD: single_family, commercial, other |
| in_ae | Derived | Always true — dataset is pre-filtered to AE ZIPs |
| has_solar | Derived | True if pID appears in wcad_parcel_matches.csv |
| county | Constant | "williamson" |

### solar_parcel_matches.csv — 19,419 rows

| Column | Source |
|--------|--------|
| id | solar_installations UUID |
| address | Permit address |
| lat / lon | Permit coordinates |
| pid | TCAD property ID (integer, null if unmatched) |
| match_method | "spatial", "address", or null |

### wcad_parcel_matches.csv — 2,213 rows

Same schema as solar_parcel_matches.csv. pid is a WCAD PARCELID string ("R######").

---

## Uploading to Supabase via Lovable

Run these after the pipeline. Generate the upload CSVs first using the snippets in each section, then paste the prompts into Lovable.

### A — Add parcel_id to solar_installations

Generate `solar_pid_update.csv` by loading both match files, taking the TCAD pid as-is and stripping the "R" prefix from WCAD pids, then coalescing into a single `parcel_id` column (bigint).

**Lovable prompt:** Add `parcel_id` (bigint, nullable) to `solar_installations`. Upload `solar_pid_update.csv` and update each row matched on `id`, setting `parcel_id` to whichever of `tcad_pid` or `wcad_pid` is populated. 17,206 rows have a TCAD pid, 643 have a WCAD pid, none have both.

### B — Append WCAD properties to properties table

Generate `wcad_for_upload.csv` from `wcad_enriched.csv`, adding `county = "williamson"` and null-filling TCAD-only columns (stateCd, hyperlink, tcad_acres, sub_dec, entities, max_stories).

**Lovable prompt:** Add `county` (text, nullable) to the properties table and backfill all existing rows with "travis". Then append `wcad_for_upload.csv` (60,981 rows). The pID column must be text type — WCAD pIDs start with "R". Null values for stateCd, hyperlink, tcad_acres, sub_dec, entities, max_stories are expected.

### C — Update WCAD year_built

Generate a two-column CSV (pID, year_built) from `wcad_enriched.csv`.

**Lovable prompt:** Upload `wcad_year_built_update.csv`. For each row, update the matching properties table record on pID and set year_built. This affects the 60,981 Williamson County rows only.

---

## Data Sources

| Source | URL |
|--------|-----|
| Travis County Parcel API | https://taxmaps.traviscountytx.gov/arcgis/rest/services/Parcels/MapServer/0/query |
| TCAD Improvement Detail CSVs | https://www.tcad.org (Data Downloads → Improvement Detail) |
| Williamson County Parcel API | https://gis.wilco.org/arcgis/rest/services/public/county_wcad_parcels/MapServer/0/query |
| WCAD Improvement Data (Socrata) | https://data.wcad.org/resource/2huh-jk3y.json |
| Census Bulk Geocoder | https://geocoding.geo.census.gov/geocoder/locations/addressbatch |

## Notes

- **Cache files:** Delete `*_cache.csv` and `*.partial.csv` in `~/Downloads/` before a fresh pull to force re-fetching from APIs.
- **ZIP 78729:** Spans the Travis/Williamson county line — ~400 Travis properties but ~7,400 Williamson properties. This caused inflated adoption figures (77% solar rate) before WCAD data was added.
- **WCAD year_built:** Socrata improvement dataset only covers ~20% of parcels (recently assessed). Remaining rows default to 2010 as a pre-2014 placeholder — charts only go back to 2014 so this is acceptable.
- **WCAD property types:** Uses USECD codes (RES, CA, C1–C6, L, LTR) rather than TCAD's text land_type_desc. Both map to the same property_type categories.
- **Supabase anon key** is embedded in the scripts — it is a public anon key, safe to commit.
- **This data updates annually** — tied to the CAD tax appraisal cycle (certified May–June each year). Solar permit data updates continuously and is handled separately via the admin import tools in the site.
