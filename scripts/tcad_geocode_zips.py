# Uses Census Bureau bulk geocoder to get USPS ZIP codes for TCAD situs addresses.
# Input:  ~/Downloads/tcad_enriched.csv
# Output: ~/Downloads/tcad_usps_zips.csv  (pID, usps_zip)

import pandas as pd
import requests
import re
import time
import io
from pathlib import Path

DOWNLOADS = Path.home() / "Downloads"
INPUT_FILE = DOWNLOADS / "tcad_enriched.csv"
OUTPUT_FILE = DOWNLOADS / "tcad_usps_zips.csv"
CHECKPOINT = DOWNLOADS / "tcad_usps_zips.partial.csv"
CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/addressbatch"
BATCH_SIZE = 10000


def clean_street(addr):
    if not addr or pd.isna(addr):
        return ""
    s = str(addr).strip()
    # Strip state+zip suffix
    s = re.sub(r'\s+(TX|TEXAS)\s+\d{5}.*$', '', s, flags=re.IGNORECASE).strip()
    s = re.sub(r'\s+\d{5}.*$', '', s).strip()
    # Strip leading directional: "S 2901 MAIN ST" -> "2901 MAIN ST"
    s = re.sub(r'^[NSEW]\s+', '', s).strip()
    # Collapse extra spaces
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def build_batch(rows):
    lines = []
    for _, r in rows.iterrows():
        street = clean_street(r["situs_address"])
        lines.append(f'{r["pID"]},"{street}","Austin","TX",""')
    return "\n".join(lines)


def parse_response(text):
    import csv as _csv
    results = {}
    for parts in _csv.reader(io.StringIO(text)):
        if len(parts) < 3:
            continue
        pid = parts[0].strip()
        match_status = parts[2].strip()
        if match_status == "Match" and len(parts) >= 5:
            zips = re.findall(r'\b(\d{5})\b', parts[4])
            results[pid] = zips[-1] if zips else None
        else:
            results[pid] = None
    return results


def submit_batch(payload):
    for attempt in range(4):
        try:
            resp = requests.post(CENSUS_URL, data={
                "benchmark": "Public_AR_Current",
                "returntype": "locations",
            }, files={
                "addressFile": ("batch.csv", io.StringIO(payload), "text/csv"),
            }, timeout=120)
            resp.raise_for_status()
            return parse_response(resp.text)
        except Exception as e:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)
    return {}


def main():
    print("Loading TCAD data...")
    df = pd.read_csv(INPUT_FILE, usecols=["pID", "situs_address"], dtype={"pID": str})
    df = df[df["situs_address"].notna()].reset_index(drop=True)
    print(f"  {len(df):,} rows with situs_address")

    done = {}
    if Path(CHECKPOINT).exists():
        cp = pd.read_csv(CHECKPOINT, dtype={"pID": str})
        done = dict(zip(cp["pID"], cp["usps_zip"]))
        print(f"  Resuming from checkpoint: {len(done):,} already processed")

    remaining = df[~df["pID"].isin(done)].reset_index(drop=True)
    print(f"  {len(remaining):,} remaining to geocode")

    results = dict(done)
    total_batches = (len(remaining) + BATCH_SIZE - 1) // BATCH_SIZE

    for i in range(0, len(remaining), BATCH_SIZE):
        batch_num = i // BATCH_SIZE + 1
        batch = remaining.iloc[i:i + BATCH_SIZE]
        payload = build_batch(batch)

        try:
            batch_results = submit_batch(payload)
        except Exception as e:
            print(f"\n  Batch {batch_num} failed: {e} — marking as unmatched")
            batch_results = {str(r["pID"]): None for _, r in batch.iterrows()}

        results.update(batch_results)
        matched = sum(1 for v in results.values() if v is not None)
        print(f"  Batch {batch_num}/{total_batches} — {len(results):,} processed, {matched:,} matched ({matched/len(results)*100:.1f}%)")

        pd.DataFrame(list(results.items()), columns=["pID", "usps_zip"]).to_csv(CHECKPOINT, index=False)
        time.sleep(1)

    out = pd.DataFrame(list(results.items()), columns=["pID", "usps_zip"])
    out.to_csv(OUTPUT_FILE, index=False)
    if Path(CHECKPOINT).exists():
        Path(CHECKPOINT).unlink()

    matched = out["usps_zip"].notna().sum()
    print(f"\nDone — {matched:,}/{len(out):,} got USPS ZIPs ({matched/len(out)*100:.1f}%)")
    print(f"Saved -> {OUTPUT_FILE}")

    print(f"\nProperties assigned usps_zip=78729: {len(out[out['usps_zip'] == '78729']):,}")


if __name__ == "__main__":
    main()
