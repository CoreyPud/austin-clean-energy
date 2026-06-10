# Fetches Williamson County parcel data for AE-territory ZIPs and produces an
# enriched CSV analogous to tcad_enriched.csv.
# Input:  AE ZIPs from Supabase solar_installations.original_zip
# Output: C:/Users/altbi/Downloads/wcad_enriched.csv
#         columns: pID, situs_address, situs_zip, market_value, land_type_desc,
#                  py_owner_name, TotgrossArea, max_stories, year_built,
#                  estimated_roof_sqft, property_type, in_ae, has_solar

import pandas as pd
import requests
import urllib.request
import json
import time
from pathlib import Path

SUPABASE_URL = "https://tnalryxoxswjofmtdtaf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuYWxyeXhveHN3am9mbXRkdGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTM2MTYsImV4cCI6MjA3NDk2OTYxNn0.xleoaIYfIh_lFPvD_BnsWgy7F1Z4n5q2MeotyNAsbh0"

WCAD_API = "https://gis.wilco.org/arcgis/rest/services/public/county_wcad_parcels/MapServer/0/query"
PARCELS_CACHE = r"C:\Users\altbi\Downloads\wcad_parcels_cache.csv"
OUTPUT_FILE = r"C:\Users\altbi\Downloads\wcad_enriched.csv"
SOLAR_PARCEL_MATCHES = r"C:\Users\altbi\Downloads\solar_parcel_matches.csv"
WCAD_PARCEL_MATCHES = r"C:\Users\altbi\Downloads\wcad_parcel_matches.csv"
BATCH_SIZE = 2000

# Williamson CAD USECD codes
PROPERTY_TYPE_MAP = {
    "RES":  "single_family",
    "CA":   "commercial",
    "C1":   "commercial",
    "C2":   "commercial",
    "C3":   "commercial",
    "C4":   "commercial",
    "C5":   "commercial",
    "C6":   "commercial",
    # Land / transitional → other (no building)
    "L":    "other",
    "LTR":  "other",
    "LTRC": "other",
    "LTRR": "other",
}


def fetch_ae_zips():
    print("Fetching AE ZIPs from Supabase solar_installations...")
    records = []
    offset = 0
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/solar_installations"
            f"?select=original_zip&limit=1000&offset={offset}"
        )
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as r:
            batch = json.loads(r.read())
        if not batch:
            break
        records.extend(batch)
        offset += len(batch)
        if len(batch) < 1000:
            break
    zips = {str(r["original_zip"]).strip().zfill(5) for r in records if r.get("original_zip")}
    print(f"  {len(zips)} unique ZIPs in permit data: {sorted(zips)}")
    return zips


def fetch_wcad_parcels(ae_zips):
    if Path(PARCELS_CACHE).exists():
        print(f"Loading WCAD parcels from cache: {PARCELS_CACHE}")
        return pd.read_csv(PARCELS_CACHE, dtype={"pID": str, "situs_zip": str})

    checkpoint = Path(PARCELS_CACHE).with_suffix(".partial.csv")
    records = []
    offset = 0

    if checkpoint.exists():
        cp_df = pd.read_csv(checkpoint)
        records = cp_df.to_dict("records")
        offset = len(records)
        print(f"Resuming from checkpoint at {offset:,} parcels...")
    else:
        print("Fetching WCAD parcels...")

    zip_list = ",".join(f"'{z}'" for z in sorted(ae_zips))
    where_clause = f"PSTLZIP5 IN ({zip_list})"

    while True:
        for attempt in range(5):
            try:
                resp = requests.get(WCAD_API, params={
                    "where": where_clause,
                    "outFields": "PARCELID,SITEADDRESS,PSTLZIP5,TotalSqFtLivingArea,RESYRBLT,TotalPropMktValue,OWNERNME1,USECD",
                    "resultOffset": offset,
                    "resultRecordCount": BATCH_SIZE,
                    "f": "json",
                }, timeout=60)
                resp.raise_for_status()
                data = resp.json()
                break
            except Exception as e:
                if attempt == 4:
                    raise
                wait = 2 ** attempt
                print(f"\n  Retry {attempt+1}/5 ({e.__class__.__name__}), waiting {wait}s...")
                time.sleep(wait)

        if "error" in data:
            raise RuntimeError(f"API error: {data['error']}")

        features = data.get("features", [])
        if not features:
            break

        for f in features:
            a = f["attributes"]
            records.append({
                "pID":           a.get("PARCELID"),
                "situs_address": a.get("SITEADDRESS"),
                "situs_zip":     str(a.get("PSTLZIP5") or "").strip().zfill(5) or None,
                "market_value":  a.get("TotalPropMktValue"),
                "land_type_desc": a.get("USECD"),
                "py_owner_name": a.get("OWNERNME1"),
                "TotgrossArea":  a.get("TotalSqFtLivingArea"),
                "year_built":    a.get("RESYRBLT"),
            })

        print(f"  {len(records):,} parcels fetched...", end="\r")

        if len(records) % 20000 < BATCH_SIZE:
            pd.DataFrame(records).to_csv(checkpoint, index=False)

        if not data.get("exceededTransferLimit", False) and len(features) < BATCH_SIZE:
            break

        offset += len(features)
        time.sleep(0.05)

    print(f"\n  Done — {len(records):,} WCAD parcels in AE ZIPs")
    df = pd.DataFrame(records)
    df.to_csv(PARCELS_CACHE, index=False)
    print(f"  Cached to {PARCELS_CACHE}")
    if checkpoint.exists():
        checkpoint.unlink()
    return df


def main():
    ae_zips = fetch_ae_zips()
    df = fetch_wcad_parcels(ae_zips)

    df["TotgrossArea"] = pd.to_numeric(df["TotgrossArea"], errors="coerce")
    # TotalSqFtLivingArea is already per-floor area — use directly as roof sqft estimate
    df["estimated_roof_sqft"] = df["TotgrossArea"].round(0).astype("Int64")
    df["max_stories"] = pd.NA  # WCAD API doesn't expose floor count
    df["year_built"] = pd.to_numeric(df["year_built"], errors="coerce").astype("Int64")
    df["market_value"] = pd.to_numeric(df["market_value"], errors="coerce")

    df["in_ae"] = True  # already filtered to AE ZIPs

    # Mark solar: join from wcad_parcel_matches if available, else no solar data
    df["has_solar"] = False
    if Path(WCAD_PARCEL_MATCHES).exists():
        wm = pd.read_csv(WCAD_PARCEL_MATCHES, dtype={"pid": str})
        matched_pids = set(wm["pid"].dropna().astype(str))
        df["has_solar"] = df["pID"].astype(str).isin(matched_pids)
        print(f"  Has solar: {df['has_solar'].sum():,} properties matched from wcad_parcel_matches.csv")

    df["property_type"] = (
        df["land_type_desc"]
        .astype(str)
        .str.strip()
        .str.upper()
        .map(PROPERTY_TYPE_MAP)
        .fillna("other")
    )
    type_counts = df["property_type"].value_counts()
    print(f"  Property types: {dict(type_counts)}")

    col_order = [
        "pID", "situs_address", "situs_zip", "market_value", "land_type_desc",
        "py_owner_name", "TotgrossArea", "max_stories", "year_built",
        "estimated_roof_sqft", "property_type", "in_ae", "has_solar",
    ]
    df = df[col_order]
    df.sort_values("estimated_roof_sqft", ascending=False, inplace=True)
    df.to_csv(OUTPUT_FILE, index=False)

    print(f"\nSaved {len(df):,} rows -> {OUTPUT_FILE}")
    print(f"\nTop 10 by estimated roof size (no solar yet):")
    top = df[~df["has_solar"] & df["situs_address"].notna()]
    print(top[["pID", "situs_address", "situs_zip", "estimated_roof_sqft"]].head(10).to_string(index=False))


if __name__ == "__main__":
    main()
