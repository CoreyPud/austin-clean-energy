# Matches solar installations to TCAD parcel IDs via spatial (lat/lon) lookup.
# Falls back to address matching for records without coordinates.
# Input:  Supabase solar_installations table
# Output: C:/Users/altbi/Downloads/solar_parcel_matches.csv
#         columns: id, address, lat, lon, pid, match_method

import pandas as pd
import requests
import urllib.request
import json
import time
import re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

SUPABASE_URL = "https://tnalryxoxswjofmtdtaf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuYWxyeXhveHN3am9mbXRkdGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTM2MTYsImV4cCI6MjA3NDk2OTYxNn0.xleoaIYfIh_lFPvD_BnsWgy7F1Z4n5q2MeotyNAsbh0"

PARCEL_API = "https://taxmaps.traviscountytx.gov/arcgis/rest/services/Parcels/MapServer/0/query"
PARCELS_CACHE = r"C:\Users\altbi\Downloads\tcad_parcels_cache.csv"
OUTPUT_FILE = r"C:\Users\altbi\Downloads\solar_parcel_matches.csv"
CHECKPOINT = r"C:\Users\altbi\Downloads\solar_parcel_matches.partial.csv"
WORKERS = 15
CHECKPOINT_EVERY = 500


def fetch_solar_installations():
    print("Fetching solar installations from Supabase...")
    records = []
    offset = 0
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/solar_installations"
            f"?select=id,address,latitude,longitude,original_zip"
            f"&limit=1000&offset={offset}"
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
    print(f"  {len(records):,} records loaded")
    return pd.DataFrame(records)


def spatial_lookup(row):
    lat, lon = row["latitude"], row["longitude"]
    for attempt in range(4):
        try:
            resp = requests.get(PARCEL_API, params={
                "geometry": json.dumps({"x": float(lon), "y": float(lat), "spatialReference": {"wkid": 4326}}),
                "geometryType": "esriGeometryPoint",
                "spatialRel": "esriSpatialRelIntersects",
                "outFields": "PROP_ID",
                "returnGeometry": "false",
                "f": "json",
            }, timeout=15)
            resp.raise_for_status()
            features = resp.json().get("features", [])
            if features:
                return int(features[0]["attributes"]["PROP_ID"]), "spatial"
            return None, None
        except Exception:
            if attempt == 3:
                return None, None
            time.sleep(2 ** attempt)
    return None, None


_ABBREVS = [
    (r'\bSTREET\b', 'ST'), (r'\bAVENUE\b', 'AVE'), (r'\bDRIVE\b', 'DR'),
    (r'\bBOULEVARD\b', 'BLVD'), (r'\bROAD\b', 'RD'), (r'\bLANE\b', 'LN'),
    (r'\bCOURT\b', 'CT'), (r'\bCIRCLE\b', 'CIR'), (r'\bPLACE\b', 'PL'),
    (r'\bTERRACE\b', 'TER'), (r'\bTRAIL\b', 'TRL'), (r'\bPARKWAY\b', 'PKWY'),
    (r'\bHIGHWAY\b', 'HWY'), (r'\bEXPRESSWAY\b', 'EXPY'), (r'\bCOVE\b', 'CV'),
]
_STREET_TYPES = (
    r'ST|AVE|DR|BLVD|RD|LN|CT|CIR|PL|TER|TRL|PKWY|HWY|EXPY|CV|'
    r'PASS|BND|LOOP|LP|ROW|WAY|WALK|XING|FWY|SQ|PLZ|RUN|PATH|TRCE|GRN|HOLW|'
    r'MESA|PARK|RIDGE|HILL|CREEK|LAKE|POINT|POINTE|GLEN|VIEW|MEADOW|CROSSING|SPRINGS'
)

def _normalize(addr):
    if not addr or pd.isna(addr):
        return None
    addr = str(addr).upper().strip()
    addr = re.sub(r'\s+TX\s+\d{5}.*$', '', addr)
    addr = re.sub(r'\s+\d{5}.*$', '', addr)
    addr = re.sub(r'^[NSEW]\s+(?=\d)', '', addr)
    addr = re.sub(r'\s+(UNIT|APT|BLDG|STE|#)\s*\S*.*$', '', addr)
    addr = re.sub(r'[.,#]', '', addr)
    for pattern, replacement in _ABBREVS:
        addr = re.sub(pattern, replacement, addr)
    addr = re.sub(r'^(\d+)\s+[NSEW]\s+(?=[A-Z])', r'\1 ', addr)
    last = None
    for m in re.finditer(rf'\b({_STREET_TYPES})\b', addr):
        last = m
    if last:
        addr = addr[:last.end()].strip()
    return re.sub(r'\s+', ' ', addr).strip()


def address_lookup(addr, parcels_df):
    norm = _normalize(addr)
    if not norm:
        return None, None
    if "_norm" not in parcels_df.columns:
        parcels_df["_norm"] = parcels_df["situs_address"].apply(_normalize)
    match = parcels_df[parcels_df["_norm"] == norm]
    if len(match) == 1:
        return int(match.iloc[0]["pID"]), "address"
    return None, None


def process_row(row, parcels_df):
    if pd.notna(row.get("latitude")) and pd.notna(row.get("longitude")):
        pid, method = spatial_lookup(row)
        if pid is not None:
            return {"id": row["id"], "address": row["address"], "lat": row["latitude"], "lon": row["longitude"], "pid": pid, "match_method": method}
    pid, method = address_lookup(row["address"], parcels_df)
    return {"id": row["id"], "address": row["address"], "lat": row.get("latitude"), "lon": row.get("longitude"), "pid": pid, "match_method": method}


def main():
    solar = fetch_solar_installations()

    done = {}
    if Path(CHECKPOINT).exists():
        cp = pd.read_csv(CHECKPOINT)
        done = {r["id"]: r.to_dict() for _, r in cp.iterrows()}
        print(f"  Resuming from checkpoint: {len(done):,} already matched")

    remaining = solar[~solar["id"].isin(done)].reset_index(drop=True)
    has_coords = remaining["latitude"].notna() & remaining["longitude"].notna()
    print(f"  {len(remaining):,} remaining — {has_coords.sum():,} with lat/lon, {(~has_coords).sum():,} address-only")

    print(f"  Loading parcel cache for address fallback...")
    parcels = pd.read_csv(PARCELS_CACHE, dtype={"pID": int})

    results = list(done.values())
    lock = Lock()
    total = len(solar)

    print(f"  Running with {WORKERS} parallel workers...")
    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {executor.submit(process_row, row, parcels): row["id"] for _, row in remaining.iterrows()}
        for future in as_completed(futures):
            result = future.result()
            with lock:
                results.append(result)
                n = len(results)
                if n % 100 == 0:
                    matched = sum(1 for r in results if r["pid"] is not None)
                    print(f"  {n:,}/{total:,} — {matched:,} matched ({matched/n*100:.1f}%)", end="\r")
                if n % CHECKPOINT_EVERY == 0:
                    pd.DataFrame(results).to_csv(CHECKPOINT, index=False)

    df = pd.DataFrame(results)
    df.to_csv(OUTPUT_FILE, index=False)
    if Path(CHECKPOINT).exists():
        Path(CHECKPOINT).unlink()

    matched = df["pid"].notna().sum()
    spatial = (df["match_method"] == "spatial").sum()
    addr = (df["match_method"] == "address").sum()
    print(f"\nDone — {matched:,}/{total:,} matched ({matched/total*100:.1f}%)")
    print(f"  spatial: {spatial:,}  address fallback: {addr:,}  unmatched: {total-matched:,}")
    print(f"Saved -> {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
