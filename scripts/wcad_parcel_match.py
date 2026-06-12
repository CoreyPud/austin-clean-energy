# Spatial lookup of unmatched solar installations against Williamson County parcel API.
# Takes the 2,213 records from solar_parcel_matches.csv where pid is null and queries
# the WCAD GIS API by lat/lon to find their Williamson County property IDs.
# Input:  ~/Downloads/solar_parcel_matches.csv  (pid=null rows)
# Output: ~/Downloads/wcad_parcel_matches.csv
#         columns: id, address, lat, lon, pid, match_method
# After running, re-run wcad_enrich.py to populate has_solar from these matches.

import pandas as pd
import requests
import json
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

DOWNLOADS = Path.home() / "Downloads"
TCAD_MATCHES = DOWNLOADS / "solar_parcel_matches.csv"
OUTPUT_FILE = DOWNLOADS / "wcad_parcel_matches.csv"
CHECKPOINT = DOWNLOADS / "wcad_parcel_matches.partial.csv"
WCAD_API = "https://gis.wilco.org/arcgis/rest/services/public/county_wcad_parcels/MapServer/0/query"
WORKERS = 15
CHECKPOINT_EVERY = 200


def spatial_lookup(row):
    lat, lon = row["lat"], row["lon"]
    for attempt in range(4):
        try:
            resp = requests.get(WCAD_API, params={
                "geometry": json.dumps({"x": float(lon), "y": float(lat), "spatialReference": {"wkid": 4326}}),
                "geometryType": "esriGeometryPoint",
                "spatialRel": "esriSpatialRelIntersects",
                "outFields": "PARCELID",
                "returnGeometry": "false",
                "f": "json",
            }, timeout=15)
            resp.raise_for_status()
            features = resp.json().get("features", [])
            if features:
                pid = features[0]["attributes"].get("PARCELID")
                return str(pid) if pid is not None else None, "spatial"
            return None, None
        except Exception:
            if attempt == 3:
                return None, None
            time.sleep(2 ** attempt)
    return None, None


def main():
    print("Loading unmatched solar installations from TCAD match file...")
    tcad = pd.read_csv(TCAD_MATCHES)
    unmatched = tcad[tcad["pid"].isna() & tcad["lat"].notna() & tcad["lon"].notna()].reset_index(drop=True)
    print(f"  {len(unmatched):,} records with lat/lon but no TCAD pid")

    done = {}
    if Path(CHECKPOINT).exists():
        cp = pd.read_csv(CHECKPOINT, dtype={"pid": str})
        done = {r["id"]: r.to_dict() for _, r in cp.iterrows()}
        print(f"  Resuming from checkpoint: {len(done):,} already processed")

    remaining = unmatched[~unmatched["id"].isin(done)].reset_index(drop=True)
    print(f"  {len(remaining):,} remaining to query")
    print(f"  Running with {WORKERS} parallel workers...")

    results = list(done.values())
    lock = Lock()
    total = len(unmatched)

    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {executor.submit(spatial_lookup, row): row["id"] for _, row in remaining.iterrows()}
        for future in as_completed(futures):
            pid, method = future.result()
            row_id = futures[future]
            src = remaining[remaining["id"] == row_id].iloc[0]
            result = {
                "id": src["id"],
                "address": src["address"],
                "lat": src["lat"],
                "lon": src["lon"],
                "pid": pid,
                "match_method": method,
            }
            with lock:
                results.append(result)
                n = len(results)
                if n % 50 == 0:
                    matched = sum(1 for r in results if r["pid"] is not None)
                    print(f"  {n:,}/{total:,} — {matched:,} matched ({matched/n*100:.1f}%)", end="\r")
                if n % CHECKPOINT_EVERY == 0:
                    pd.DataFrame(results).to_csv(CHECKPOINT, index=False)

    df = pd.DataFrame(results)
    df.to_csv(OUTPUT_FILE, index=False)
    if Path(CHECKPOINT).exists():
        Path(CHECKPOINT).unlink()

    matched = df["pid"].notna().sum()
    print(f"\nDone — {matched:,}/{len(df):,} matched ({matched/len(df)*100:.1f}%)")
    print(f"Saved -> {OUTPUT_FILE}")

    # Show how many of the originally unmatched records now have a WCAD pid
    print(f"\nOf {len(unmatched):,} originally unmatched installations:")
    print(f"  Now matched via WCAD: {matched:,}")
    print(f"  Still unmatched: {len(df) - matched:,}")


if __name__ == "__main__":
    main()
