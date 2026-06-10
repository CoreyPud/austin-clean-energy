# Data Pipeline Scripts

Python scripts for enriching the Austin Energy solar dataset with county appraisal district property data. Run locally — not deployed. All outputs go to `~/Downloads/`.

## Setup

Install dependencies: `pip install pandas requests`

## Pipeline — run in order

### 1. tcad_enrich.py

Fetches all ~373k Travis County parcels from the Travis County GIS API, joins improvement detail CSVs (building sqft, stories, year built), and matches against Supabase solar_installations to set the has_solar flag.

**Prerequisite:** Download the TCAD improvement detail CSVs from tcad.org (Data Downloads → Improvement Detail) and extract to `~/Downloads/improvement_detail_2026/`.

Outputs: `tcad_enriched.csv`, `tcad_solar_joined.csv`, `tcad_parcels_cache.csv`

---

### 2. solar_parcel_match.py

Queries the Travis County parcel API by lat/lon for each of the ~19k solar installations to get their TCAD parcel ID. Falls back to address matching for records without coordinates. Uses 15 parallel workers (~13 min runtime). Match rate: ~88.6%.

Output: `solar_parcel_matches.csv` — columns: id, address, lat, lon, pid, match_method

---

### 3. wcad_parcel_match.py

Takes the ~2,213 unmatched records from `solar_parcel_matches.csv` and queries the Williamson County parcel API by lat/lon to find their WCAD property IDs. Match rate: ~29% (remaining installs are outside both counties).

Output: `wcad_parcel_matches.csv` — columns: id, address, lat, lon, pid, match_method

---

### 4. wcad_enrich.py

Fetches all WCAD parcels in AE-territory ZIPs (pulled live from Supabase solar_installations.original_zip), marks has_solar from wcad_parcel_matches.csv.

Outputs: `wcad_enriched.csv`, `wcad_parcels_cache.csv`

---

### 5. wcad_improvement_join.py

Downloads improvement detail from the WCAD Socrata open data portal (~247k rows) and joins year_built onto wcad_enriched.csv where available (~20% coverage). Fills remaining nulls with 2010 since charts only go back to 2014.

Updates `wcad_enriched.csv` in place. Cache: `wcad_improvement_cache.csv`

---

## Uploading to Supabase / Lovable

After running the pipeline, three uploads are needed. Generate the upload CSVs by combining the match files as described below, then use the Lovable prompts.

**A — Solar installations → parcel IDs**

Combine `solar_parcel_matches.csv` (TCAD pids, numeric) and `wcad_parcel_matches.csv` (WCAD pids, strip the R prefix) into a single CSV with columns: id, tcad_pid, wcad_pid. Each row has exactly one populated. Then coalesce into a single `parcel_id` column (bigint) for upload.

Lovable prompt: Add `parcel_id` (bigint, nullable) to `solar_installations`. Upload the CSV and update each row matched on `id`.

**B — WCAD properties → append to properties table**

Generate `wcad_for_upload.csv` from `wcad_enriched.csv`, adding a `county = "williamson"` column and null-filling TCAD-only columns (stateCd, hyperlink, tcad_acres, sub_dec, entities, max_stories).

Lovable prompt: Add `county` (text) to the properties table, backfill existing rows with "travis". Append the WCAD CSV. Ensure `pID` is text type since WCAD pIDs start with "R".

**C — WCAD year built update**

Generate a two-column CSV (pID, year_built) from `wcad_enriched.csv`.

Lovable prompt: Update properties table rows matched on pID, setting year_built from the CSV.

---

## Data Sources

| Source | URL |
|--------|-----|
| Travis County Parcel API | https://taxmaps.traviscountytx.gov/arcgis/rest/services/Parcels/MapServer/0/query |
| TCAD Improvement Detail CSVs | https://www.tcad.org (Data Downloads) |
| Williamson County Parcel API | https://gis.wilco.org/arcgis/rest/services/public/county_wcad_parcels/MapServer/0/query |
| WCAD Improvement Data (Socrata) | https://data.wcad.org/resource/2huh-jk3y.json |
| Census Bulk Geocoder | https://geocoding.geo.census.gov/geocoder/locations/addressbatch |

## Notes

- **Cache files:** Delete `*_cache.csv` and `*.partial.csv` in `~/Downloads/` before a fresh pull to force re-fetching from APIs.
- **ZIP 78729:** Spans the Travis/Williamson county line — ~400 Travis properties but ~7,400 Williamson properties. This caused inflated adoption figures before the WCAD data was added.
- **WCAD year_built:** Socrata improvement dataset only covers ~20% of parcels (recently assessed). Remaining rows default to 2010 as a pre-2014 placeholder.
- **WCAD property types:** Uses USECD codes (RES, CA, C1–C6, L, LTR) rather than TCAD's text land_type_desc. Both map to the same property_type categories.
- **Supabase anon key** is embedded in the scripts — it's a public anon key, safe to commit.
