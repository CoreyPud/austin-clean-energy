# Downloads WCAD improvement detail from Socrata open data portal and joins
# year_built and building area onto wcad_enriched.csv for matched parcels.
# Input:  ~/Downloads/wcad_enriched.csv
# Output: ~/Downloads/wcad_enriched.csv  (updated in place)

import pandas as pd
import requests
import time
from pathlib import Path

DOWNLOADS = Path.home() / "Downloads"
SOCRATA_URL = "https://data.wcad.org/resource/2huh-jk3y.json"
IMPROVEMENT_CACHE = DOWNLOADS / "wcad_improvement_cache.csv"
ENRICHED_FILE = DOWNLOADS / "wcad_enriched.csv"
PAGE_SIZE = 50000


def fetch_improvement_data():
    if Path(IMPROVEMENT_CACHE).exists():
        print(f"Loading improvement data from cache: {IMPROVEMENT_CACHE}")
        return pd.read_csv(IMPROVEMENT_CACHE, dtype={"propertyid": str})

    print("Downloading WCAD improvement data from Socrata...")
    records = []
    offset = 0
    while True:
        resp = requests.get(SOCRATA_URL, params={
            "$select": "propertyid,feffyear,vtsgimp_comtotbldarea",
            "$limit": PAGE_SIZE,
            "$offset": offset,
            "$order": "propertyid",
        }, timeout=60, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        records.extend(batch)
        print(f"  {len(records):,} rows fetched...", end="\r")
        if len(batch) < PAGE_SIZE:
            break
        offset += len(batch)
        time.sleep(0.2)

    print(f"\n  Done — {len(records):,} improvement records")
    df = pd.DataFrame(records)
    df.to_csv(IMPROVEMENT_CACHE, index=False)
    return df


def main():
    imp = fetch_improvement_data()

    imp["propertyid"] = imp["propertyid"].astype(str)
    imp["feffyear"] = pd.to_numeric(imp["feffyear"], errors="coerce")
    imp["vtsgimp_comtotbldarea"] = pd.to_numeric(imp["vtsgimp_comtotbldarea"], errors="coerce")

    # One row per property: earliest year built, largest building area
    agg = imp.groupby("propertyid").agg(
        year_built=("feffyear", "min"),
        bldg_area=("vtsgimp_comtotbldarea", "max"),
    ).reset_index()
    print(f"  {len(agg):,} unique properties in improvement data")

    enriched = pd.read_csv(ENRICHED_FILE, dtype={"pID": str, "situs_zip": str})
    enriched["propertyid"] = enriched["pID"].str.lstrip("R")

    before = enriched["year_built"].notna().sum()
    enriched = enriched.merge(agg, on="propertyid", how="left", suffixes=("", "_imp"))

    # Fill nulls from improvement data
    enriched["year_built"] = enriched["year_built"].combine_first(enriched["year_built_imp"])
    # Also update TotgrossArea where we have better data from improvement
    enriched["TotgrossArea"] = enriched["TotgrossArea"].combine_first(enriched["bldg_area"])
    enriched["estimated_roof_sqft"] = enriched["TotgrossArea"].round(0).astype("Int64")

    enriched.drop(columns=["propertyid", "year_built_imp", "bldg_area"], inplace=True)

    # Fill remaining nulls with 2010 — charts only go back to 2014 so exact pre-2014 year doesn't matter
    enriched["year_built"] = enriched["year_built"].fillna(2010)

    after = enriched["year_built"].notna().sum()
    print(f"  year_built: {before:,} -> {after:,} rows populated ({after/len(enriched)*100:.1f}%)")

    enriched.to_csv(ENRICHED_FILE, index=False)
    print(f"Saved -> {ENRICHED_FILE}")

    print(f"\nYear built distribution (sample):")
    print(enriched["year_built"].dropna().astype(int).value_counts().sort_index().tail(20))


if __name__ == "__main__":
    main()
