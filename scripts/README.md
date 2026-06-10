# Data Pipeline Scripts

Python scripts for enriching the Austin Energy solar dataset with county appraisal district property data. Run locally — not deployed.

## Setup

```
pip install pandas requests
```

## Full Pipeline (run in order)

### 1. TCAD — Travis County

**Prerequisites:** Download the TCAD improvement detail CSVs from [tcad.org](https://www.tcad.org) → Data Downloads → Improvement Detail. Extract to `C:/Users/altbi/Downloads/improvement_detail_2026/`.

```
python tcad_enrich.py
```

- Fetches all ~373k Travis County parcels from the Travis County GIS API
- Joins improvement detail CSVs (building sqft, stories, year built)
- Matches against Supabase `solar_installations` to set `has_solar`
- **Outputs:**
  - `C:/Users/altbi/Downloads/tcad_enriched.csv` — one row per property, ~391k rows
  - `C:/Users/altbi/Downloads/tcad_solar_joined.csv` — same but with solar permit fields appended
  - `C:/Users/altbi/Downloads/tcad_parcels_cache.csv` — API cache (delete to force re-fetch)

---

### 2. TCAD — Match Solar Permits to Parcel IDs

```
python solar_parcel_match.py
```

- Queries Travis County parcel API by lat/lon for each of the ~19k solar installations
- Falls back to address matching for records without coordinates
- Uses 15 parallel workers (~13 min runtime)
- **Output:** `C:/Users/altbi/Downloads/solar_parcel_matches.csv` (id, address, lat, lon, pid, match_method)
- **Result:** ~88.6% match rate (17,206/19,419)

---

### 3. WCAD — Match Unmatched Solar Permits to Williamson County Parcels

Run *after* step 2 — takes the ~2,213 unmatched records from `solar_parcel_matches.csv`.

```
python wcad_parcel_match.py
```

- Queries Williamson County GIS API by lat/lon for the TCAD-unmatched installations
- **Output:** `C:/Users/altbi/Downloads/wcad_parcel_matches.csv` (id, address, lat, lon, pid, match_method)
- **Result:** ~29% match rate (643/2,213) — rest are outside both counties

---

### 4. WCAD — Williamson County Property Data

```
python wcad_enrich.py
```

- Fetches AE-territory ZIPs from Supabase `solar_installations.original_zip`
- Fetches all WCAD parcels in those ZIPs from the Williamson County GIS API
- Marks `has_solar` from `wcad_parcel_matches.csv`
- **Output:** `C:/Users/altbi/Downloads/wcad_enriched.csv` — ~61k rows
- **Cache:** `C:/Users/altbi/Downloads/wcad_parcels_cache.csv` (delete to force re-fetch)

---

### 5. WCAD — Add Year Built

```
python wcad_improvement_join.py
```

- Downloads improvement detail from [data.wcad.org](https://data.wcad.org) Socrata API (~247k rows)
- Joins `year_built` and building area onto `wcad_enriched.csv` where available (~20% coverage)
- Fills remaining nulls with 2010 (charts only go back to 2014 so pre-2014 exact year doesn't matter)
- **Updates `wcad_enriched.csv` in place**
- **Cache:** `C:/Users/altbi/Downloads/wcad_improvement_cache.csv` (delete to force re-fetch)

---

## Uploading to Supabase / Lovable

After running the pipeline, three uploads are needed:

### A. Solar installations → parcel IDs

Generate `solar_pid_update.csv` by running:

```python
import pandas as pd

tcad = pd.read_csv(r'C:/Users/altbi/Downloads/solar_parcel_matches.csv', dtype={'id': str, 'pid': str})
wcad = pd.read_csv(r'C:/Users/altbi/Downloads/wcad_parcel_matches.csv', dtype={'id': str, 'pid': str})

tcad_matched = tcad[tcad['pid'].notna()][['id', 'pid']].rename(columns={'pid': 'tcad_pid'})
tcad_matched['wcad_pid'] = None

wcad_matched = wcad[wcad['pid'].notna()][['id', 'pid']].copy()
wcad_matched['tcad_pid'] = None
wcad_matched['wcad_pid'] = wcad_matched['pid'].str.lstrip('R')
wcad_matched = wcad_matched[['id', 'tcad_pid', 'wcad_pid']]

pd.concat([tcad_matched, wcad_matched]).to_csv(r'C:/Users/altbi/Downloads/solar_pid_update.csv', index=False)
```

**Lovable prompt:** Add `parcel_id` (bigint, nullable) to `solar_installations`. Upload `solar_pid_update.csv` and update each row matched on `id`, setting `parcel_id` to whichever of `tcad_pid` / `wcad_pid` is populated.

### B. WCAD properties → append to properties table

Use `wcad_for_upload.csv` (regenerate if needed — see step 4 output + add county column).

**Lovable prompt:** Append `wcad_for_upload.csv` to the properties table. Add `county` column (text) first, backfill existing rows with `"travis"`. WCAD pIDs start with `"R"` — ensure `pID` column is text type.

### C. WCAD year built update

Use `wcad_year_built_update.csv`.

**Lovable prompt:** Upload `wcad_year_built_update.csv` (columns: `pID`, `year_built`). Update matching properties table rows on `pID`.

---

## Key Data Sources

| Source | URL | Auth |
|--------|-----|------|
| Travis County Parcel API | https://taxmaps.traviscountytx.gov/arcgis/rest/services/Parcels/MapServer/0/query | None |
| TCAD Improvement Detail CSVs | https://www.tcad.org (Data Downloads) | None |
| Williamson County Parcel API | https://gis.wilco.org/arcgis/rest/services/public/county_wcad_parcels/MapServer/0/query | None |
| WCAD Improvement Data (Socrata) | https://data.wcad.org/resource/2huh-jk3y.json | None |
| Census Bulk Geocoder | https://geocoding.geo.census.gov/geocoder/locations/addressbatch | None |
| Supabase | https://tnalryxoxswjofmtdtaf.supabase.co | Anon key in scripts |

## Notes

- **ZIP code mismatch:** TCAD `situs_zip` uses USPS delivery ZIPs, which differ from Census ZCTAs. ZIP 78729 is the main affected area — it spans the Travis/Williamson county line with ~400 Travis properties but ~7,400 Williamson properties. This is why early adoption calculations for 78729 were inflated.
- **WCAD year_built:** The Socrata improvement dataset only covers ~20% of parcels (recently assessed properties). Remaining nulls are filled with 2010 as a pre-2014 placeholder.
- **Cache files:** Delete `*_cache.csv` and `*.partial.csv` files in `C:/Users/altbi/Downloads/` before a fresh pull to force re-fetching from APIs.
- **WCAD property types:** Uses `USECD` field (`RES`, `CA`, `C1`–`C6`, `L`, `LTR`, etc.) rather than TCAD's text `land_type_desc`. Both map to the same `property_type` categories (single_family, multifamily, commercial, condo, other).
