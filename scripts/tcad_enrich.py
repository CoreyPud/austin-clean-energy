# Enriches TCAD improvement detail data with situs addresses from Travis County parcel API.
# Input:  C:/Users/altbi/Downloads/improvement_detail_2026/*.csv
# Output: C:/Users/altbi/Downloads/tcad_enriched.csv

import pandas as pd
import requests
import time
import re
import urllib.request
import json
from pathlib import Path

IMPROVEMENT_DETAIL_DIR = r"C:\Users\altbi\Downloads\improvement_detail_2026"
OUTPUT_FILE = r"C:\Users\altbi\Downloads\tcad_enriched.csv"
OUTPUT_SOLAR_JOINED = r"C:\Users\altbi\Downloads\tcad_solar_joined.csv"
PARCELS_CACHE = r"C:\Users\altbi\Downloads\tcad_parcels_cache.csv"
PARCEL_API = "https://taxmaps.traviscountytx.gov/arcgis/rest/services/Parcels/MapServer/0/query"
BATCH_SIZE = 2000

SUPABASE_URL = "https://tnalryxoxswjofmtdtaf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuYWxyeXhveHN3am9mbXRkdGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTM2MTYsImV4cCI6MjA3NDk2OTYxNn0.xleoaIYfIh_lFPvD_BnsWgy7F1Z4n5q2MeotyNAsbh0"

STREET_ABBREVS = [
    (r'\bSTREET\b', 'ST'), (r'\bAVENUE\b', 'AVE'), (r'\bDRIVE\b', 'DR'),
    (r'\bBOULEVARD\b', 'BLVD'), (r'\bROAD\b', 'RD'), (r'\bLANE\b', 'LN'),
    (r'\bCOURT\b', 'CT'), (r'\bCIRCLE\b', 'CIR'), (r'\bPLACE\b', 'PL'),
    (r'\bTERRACE\b', 'TER'), (r'\bTRAIL\b', 'TRL'), (r'\bPARKWAY\b', 'PKWY'),
    (r'\bHIGHWAY\b', 'HWY'), (r'\bEXPRESSWAY\b', 'EXPY'), (r'\bCOVE\b', 'CV'),
    (r'\bPASS\b', 'PASS'), (r'\bBEND\b', 'BND'), (r'\bBND\b', 'BND'),
    (r'\bLOOP\b', 'LOOP'), (r'\bROW\b', 'ROW'),
]

STREET_TYPES = (
    r'ST|AVE|DR|BLVD|RD|LN|CT|CIR|PL|TER|TRL|PKWY|HWY|EXPY|CV|'
    r'PASS|BND|LOOP|LP|ROW|WAY|WALK|XING|FWY|SQ|PLZ|RUN|PATH|TRCE|GRN|HOLW|'
    r'MESA|PARK|RIDGE|HILL|CREEK|LAKE|POINT|POINTE|GLEN|VIEW|MEADOW|CROSSING|SPRINGS'
)

def normalize_street(addr):
    if not addr or pd.isna(addr):
        return None
    addr = str(addr).upper().strip()
    # Remove state+zip suffix
    addr = re.sub(r'\s+TX\s+\d{5}.*$', '', addr)
    addr = re.sub(r'\s+\d{5}.*$', '', addr)
    # Remove leading directional prefix before street number: "W 6501" -> "6501"
    addr = re.sub(r'^[NSEW]\s+(?=\d)', '', addr)
    # Remove unit/apt/bldg suffixes
    addr = re.sub(r'\s+(UNIT|APT|BLDG|STE|#|SVRD|NB|SB|EB|WB)\s*\S*.*$', '', addr)
    # Remove punctuation
    addr = re.sub(r'[.,#]', '', addr)
    # Normalize abbreviations
    for pattern, replacement in STREET_ABBREVS:
        addr = re.sub(pattern, replacement, addr)
    # Strip inline directional after street number: "4341 S CONGRESS AVE" -> "4341 CONGRESS AVE"
    addr = re.sub(r'^(\d+)\s+[NSEW]\s+(?=[A-Z])', r'\1 ', addr)
    # Truncate city name after the last street type token
    last = None
    for m in re.finditer(rf'\b({STREET_TYPES})\b', addr):
        last = m
    if last:
        addr = addr[:last.end()].strip()
    # Collapse spaces
    addr = re.sub(r'\s+', ' ', addr).strip()
    return addr

PROPERTY_TYPE_MAP = {
    "SINGLE FAMILY RESIDENCE":         "single_family",
    "SINGLE FAMILY RESIDENCE MH":      "single_family",
    "SINGLE FAMILY RESIDENCE DETAILS": "single_family",
    "MULTIFAMILY":                     "multifamily",
    "DUPLEX":                          "multifamily",
    "TRI-PLEX":                        "multifamily",
    "FOUR-PLEX":                       "multifamily",
    "CONDOS":                          "condo",
    "CONDOS DETAILS":                  "condo",
    "COMMERCIAL RES CONVERSION":       "condo",
    "COMMERCIAL IMPROVED":             "commercial",
    "COMMERCIAL DETAILS":              "commercial",
    "COMMERCIAL CONDO":                "commercial",
    "INDUSTRIAL MAJOR MANUFACTURING IMPROVED": "commercial",
    "HS COMMERCIAL HIGHEST & BEST USE": "commercial",
}

AE_ZIPS = {
    '78610','78613','78617','78645','78652','78653','78660',
    '78701','78702','78703','78704','78705','78712','78717','78719',
    '78721','78722','78723','78724','78725','78726','78727','78728','78729',
    '78730','78731','78732','78733','78734','78735','78736','78737','78738','78739',
    '78741','78742','78744','78745','78746','78747','78748','78749',
    '78750','78751','78752','78753','78754','78756','78757','78758','78759',
}


def load_improvement_detail():
    print("Loading improvement detail CSVs...")
    cols = ["pID", "stateCd", "imprvStories", "TotgrossArea", "actualYearBuilt"]
    dfs = []
    for f in sorted(Path(IMPROVEMENT_DETAIL_DIR).glob("*.csv")):
        print(f"  {f.name}")
        dfs.append(pd.read_csv(f, usecols=cols, dtype={"pID": int, "stateCd": str}))
    return pd.concat(dfs, ignore_index=True)


def aggregate_by_property(df):
    print("Aggregating to one row per property...")
    agg = df.groupby("pID").agg(
        stateCd=("stateCd", "first"),
        TotgrossArea=("TotgrossArea", "max"),
        max_stories=("imprvStories", "max"),
        year_built=("actualYearBuilt", "min"),
    ).reset_index()
    agg["max_stories"] = agg["max_stories"].fillna(1).clip(lower=1)
    agg["estimated_roof_sqft"] = (agg["TotgrossArea"] / agg["max_stories"]).round(0).astype("Int64")
    print(f"  {len(agg):,} unique properties")
    return agg


def fetch_all_parcels():
    if Path(PARCELS_CACHE).exists():
        print(f"Loading parcels from cache: {PARCELS_CACHE}")
        return pd.read_csv(PARCELS_CACHE, dtype={"pID": int})

    CHECKPOINT = Path(PARCELS_CACHE).with_suffix(".partial.csv")
    records = []
    offset = 0

    # Resume from checkpoint if one exists
    if CHECKPOINT.exists():
        checkpoint_df = pd.read_csv(CHECKPOINT)
        records = checkpoint_df.to_dict("records")
        offset = len(records)
        print(f"Resuming from checkpoint at {offset:,} parcels...")
    else:
        print("Fetching parcel addresses from Travis County API...")

    while True:
        for attempt in range(5):
            try:
                resp = requests.get(PARCEL_API, params={
                    "where": "1=1",
                    "outFields": "PROP_ID,situs_address,situs_zip,market_value,land_type_desc,py_owner_name,hyperlink,tcad_acres,sub_dec,entities",
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
                print(f"\n  Retry {attempt+1}/5 after error ({e.__class__.__name__}), waiting {wait}s...")
                time.sleep(wait)

        if "error" in data:
            raise RuntimeError(f"API error: {data['error']}")

        features = data.get("features", [])
        if not features:
            break

        records.extend(f["attributes"] for f in features)
        print(f"  {len(records):,} parcels fetched...", end="\r")

        # Save checkpoint every 20k records
        if len(records) % 20000 < BATCH_SIZE:
            pd.DataFrame(records).to_csv(CHECKPOINT, index=False)

        if not data.get("exceededTransferLimit", False) and len(features) < BATCH_SIZE:
            break

        offset += len(features)
        time.sleep(0.05)

    print(f"\n  Done - {len(records):,} parcels total")
    df = pd.DataFrame(records).rename(columns={"PROP_ID": "pID"})
    df.to_csv(PARCELS_CACHE, index=False)
    print(f"  Cached to {PARCELS_CACHE}")
    if CHECKPOINT.exists():
        CHECKPOINT.unlink()
    return df


def fetch_solar_installations():
    print("Fetching solar installations from Supabase...")
    records = []
    offset = 0
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    while True:
        url = f"{SUPABASE_URL}/rest/v1/solar_installations?select=*&limit=1000&offset={offset}"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as r:
            batch = json.loads(r.read())
        if not batch:
            break
        records.extend(batch)
        offset += len(batch)
        if len(batch) < 1000:
            break
    print(f"  {len(records):,} solar installations loaded")
    df = pd.DataFrame(records)
    df["norm_addr"] = df["address"].apply(normalize_street)
    return df


def main():
    raw = load_improvement_detail()
    props = aggregate_by_property(raw)

    parcels = fetch_all_parcels()

    print("Joining parcels...")
    enriched = props.merge(parcels, on="pID", how="left")
    matched = enriched["situs_address"].notna().sum()
    print(f"  Matched {matched:,} / {len(enriched):,} properties ({matched/len(enriched)*100:.1f}%)")

    enriched["in_ae"] = enriched["situs_zip"].astype(str).str.strip().str[:5].isin(AE_ZIPS)
    in_ae_count = enriched["in_ae"].sum()
    print(f"  In AE territory: {in_ae_count:,} / {len(enriched):,} ({in_ae_count/len(enriched)*100:.1f}%)")

    # Normalize TCAD addresses for solar join
    enriched["norm_addr"] = enriched["situs_address"].apply(normalize_street)

    # Fetch and join solar installations
    solar = fetch_solar_installations()
    solar_set = set(solar["norm_addr"].dropna())
    enriched["has_solar"] = enriched["norm_addr"].isin(solar_set)
    solar_count = enriched["has_solar"].sum()
    print(f"  Has solar: {solar_count:,} properties matched ({solar_count/in_ae_count*100:.1f}% of AE territory)")

    enriched["property_type"] = enriched["land_type_desc"].map(PROPERTY_TYPE_MAP).fillna("other")
    type_counts = enriched["property_type"].value_counts()
    print(f"  Property types: {dict(type_counts)}")

    # Build solar-joined output: TCAD rows with solar, enriched with all solar permit fields
    print("Building solar-joined dataset...")
    solar_cols = [c for c in solar.columns if c not in ("norm_addr",)]
    solar_for_join = (
        solar[solar["norm_addr"].notna()]
        .sort_values("completed_date", ascending=False)
        .drop_duplicates(subset="norm_addr", keep="first")
        .rename(columns={c: f"solar_{c}" for c in solar_cols})
        .rename(columns={"solar_norm_addr": "norm_addr"})
    )
    joined = enriched.merge(solar_for_join, on="norm_addr", how="left")
    joined.drop(columns=["norm_addr"], inplace=True)
    joined.sort_values("estimated_roof_sqft", ascending=False, inplace=True)
    joined.to_csv(OUTPUT_SOLAR_JOINED, index=False)
    solar_join_count = joined["solar_address"].notna().sum()
    print(f"  {solar_join_count:,} rows with solar permit data")
    print(f"  Saved -> {OUTPUT_SOLAR_JOINED}")

    enriched.drop(columns=["norm_addr"], inplace=True)
    enriched.sort_values("estimated_roof_sqft", ascending=False, inplace=True)
    enriched.to_csv(OUTPUT_FILE, index=False)
    print(f"\nSaved -> {OUTPUT_FILE}")
    print(f"\nTop 10 by estimated roof size (no solar yet, in AE):")
    top = enriched[enriched["in_ae"] & ~enriched["has_solar"] & enriched["situs_address"].notna()]
    print(top[["pID", "situs_address", "stateCd", "estimated_roof_sqft"]].head(10).to_string(index=False))


if __name__ == "__main__":
    main()
