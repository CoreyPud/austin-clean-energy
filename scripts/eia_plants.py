# Downloads Texas power plant data from EIA:
#   Form 860 — operating generators (nameplate capacity, lat/lon, status)
#   Form 923 — monthly net generation (2001-present)
#
# Outputs:
#   ~/Downloads/eia_tx_generators.csv   — generator-level (Form 860, one row per unit)
#   ~/Downloads/eia_tx_plants.csv       — plant-level with Form 923 enrichment
#   ~/Downloads/eia_tx_generation.csv   — monthly generation by plant (Form 923)
#
# New columns in eia_tx_plants.csv vs the previous version:
#   avg_output_mw          — average annual net generation from Form 923 (not nameplate)
#   actual_retirement_year — year after last generation, for plants no longer in Form 860
#
# Requires: pip install requests pandas
# API key: register free at eia.gov/opendata

import json
import time
from pathlib import Path

import pandas as pd
import requests

EIA_API_KEY  = "SUroxKGePzfAZh6P7L8wUYXGZGrYkQPva32NhBtx"
DOWNLOADS    = Path.home() / "Downloads"
OUT_GEN      = DOWNLOADS / "eia_tx_generators.csv"
OUT_PLANTS   = DOWNLOADS / "eia_tx_plants.csv"
OUT_GEN923   = DOWNLOADS / "eia_tx_generation.csv"
CACHE_F923   = DOWNLOADS / "cache_eia_form923_tx.json"

F860_URL  = "https://api.eia.gov/v2/electricity/operating-generator-capacity/data/"
F923_URL  = "https://api.eia.gov/v2/electricity/facility-fuel/data/"
PAGE_SIZE = 5000
GEN_START = "2001-01"

FUEL_MAP = {
    "NG":  "Gas",      "LFG": "Gas",     "OG":  "Gas",
    "BIT": "Coal",     "SUB": "Coal",    "LIG": "Coal",   "PC":  "Coal",
    "DFO": "Oil",      "RFO": "Oil",     "JF":  "Oil",    "KER": "Oil",
    "NUC": "Nuclear",
    "WND": "Wind",
    "SUN": "Solar",    "PV":  "Solar",   "CPV": "Solar",
    "WAT": "Hydro",
    "WDS": "Biomass",  "AB":  "Biomass", "MSW": "Biomass","OBG": "Biomass",
    "BLQ": "Biomass",
    "BFG": "Gas",
    "GEO": "Geothermal",
    "MWH": "Storage",  "ES":  "Storage",
    "WH":  "Waste Heat", "PUR": "Waste Heat", "TDF": "Waste Heat",
}

def _fuel(code):
    return FUEL_MAP.get(str(code).strip().upper(), "Other")


# ── Form 860: current operating generators ───────────────────────────────────

def fetch_f860_tx():
    """All TX generators for the latest available period."""
    r = requests.get(F860_URL, params={
        "api_key": EIA_API_KEY,
        "facets[stateid][]": "TX",
        "data[]": "nameplate-capacity-mw",
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        "length": 1,
    }, timeout=20)
    r.raise_for_status()
    latest_period = r.json()["response"]["data"][0]["period"]
    print(f"  Form 860 latest period: {latest_period}")

    rows, offset = [], 0
    while True:
        resp = requests.get(F860_URL, params={
            "api_key": EIA_API_KEY,
            "facets[stateid][]": "TX",
            "data[]": [
                "nameplate-capacity-mw",
                "operating-year-month",
                "planned-retirement-year-month",
                "latitude",
                "longitude",
                "county",
            ],
            "sort[0][column]": "period",
            "sort[0][direction]": "desc",
            "length": PAGE_SIZE,
            "offset": offset,
        }, timeout=30)
        resp.raise_for_status()
        batch = resp.json()["response"]["data"]
        if not batch:
            break
        for row in batch:
            if row["period"] == latest_period:
                rows.append(row)
            elif rows:
                print(f"  Form 860: {len(rows):,} generators")
                return rows, latest_period
        if len(batch) < PAGE_SIZE:
            break
        offset += len(batch)
        time.sleep(0.1)

    print(f"  Form 860: {len(rows):,} generators")
    return rows, latest_period


# ── Form 923: monthly generation ─────────────────────────────────────────────

def fetch_f923_tx():
    """Monthly net generation for TX plants, 2001-present. Cached locally."""
    if CACHE_F923.exists():
        print("  Form 923: loading from cache (delete cache_eia_form923_tx.json to refresh)")
        return json.loads(CACHE_F923.read_text())

    rows, offset = [], 0
    while True:
        resp = requests.get(F923_URL, params={
            "api_key": EIA_API_KEY,
            "facets[state][]": "TX",
            "facets[fuel2002][]": "ALL",   # total per plant, avoids double-counting
            "data[]": ["generation"],
            "frequency": "monthly",
            "start": GEN_START,
            "sort[0][column]": "period",
            "sort[0][direction]": "asc",
            "length": PAGE_SIZE,
            "offset": offset,
        }, timeout=60)
        resp.raise_for_status()
        batch = resp.json()["response"]["data"]
        if not batch:
            break
        rows.extend(batch)
        print(f"  Form 923: {len(rows):,} records fetched...", end="\r", flush=True)
        if len(batch) < PAGE_SIZE:
            break
        offset += len(batch)
        time.sleep(0.15)

    print(f"\n  Form 923: {len(rows):,} monthly records (TX, {GEN_START} to present)")
    CACHE_F923.write_text(json.dumps(rows))
    return rows


def build_gen_df(rows923):
    """Tidy DataFrame from Form 923 facility-fuel API rows."""
    df = pd.DataFrame(rows923)
    df["generation_mwh"] = pd.to_numeric(
        df.get("generation", pd.Series(dtype=float)), errors="coerce"
    ).fillna(0)
    # facility-fuel endpoint uses plantCode; normalise to plantid
    df["plantid"] = pd.to_numeric(df["plantCode"], errors="coerce")
    df["period"]  = df["period"].astype(str)
    df["year"]    = pd.to_numeric(df["period"].str[:4], errors="coerce")
    df["fuel"]    = "Total"   # fuel2002==ALL rows are plant totals

    return df[["plantid", "period", "year", "fuel", "generation_mwh"]].dropna(
        subset=["plantid"]
    )


# ── Enrichment: derive output + retirements from Form 923 ────────────────────

def derive_enrichment(gen_df, plant_860_ids):
    """
    Returns dict plantid -> {avg_output_mw, actual_retirement_year}

    avg_output_mw:
        Average annual net generation (MWh) over the most recent 3 full years,
        divided by 8760 to get average MW. Uses only years with positive generation.

    actual_retirement_year:
        Year AFTER the last month of positive generation, for plants that:
          (a) are no longer in current Form 860, AND
          (b) have been silent for at least 6 months.
        This is one more than the last active year so JS can use `year < retirement_year`.
    """
    import datetime
    today       = datetime.date.today()
    recent_from = today.year - 3
    silence_cut = (
        today.replace(day=1) - pd.DateOffset(months=6)
    ).strftime("%Y-%m")

    # --- avg_output_mw: average annual MWh / 8760 over recent 3 years ---
    recent = gen_df[(gen_df["year"] >= recent_from) & (gen_df["generation_mwh"] > 0)]
    annual = (
        recent.groupby(["plantid", "year"])["generation_mwh"].sum().reset_index()
    )
    avg_annual = annual.groupby("plantid")["generation_mwh"].mean()
    avg_output = (avg_annual / 8760).round(2)

    # --- actual retirement: last period of positive generation ---
    last_gen = (
        gen_df[gen_df["generation_mwh"] > 0]
        .groupby("plantid")["period"]
        .max()
    )

    # Plants in Form 923 history but NOT in current Form 860 = retired
    retired_ids = {int(p) for p in last_gen.index} - set(plant_860_ids)
    retirements = {}
    for pid in retired_ids:
        last = last_gen.get(pid)
        if last and last < silence_cut:
            retirements[int(pid)] = int(last[:4]) + 1  # first full year they were gone

    all_pids = {int(p) for p in list(avg_output.index) + list(last_gen.index)}
    result = {}
    for pid in all_pids:
        result[pid] = {
            "avg_output_mw":          float(avg_output.get(pid, 0)) or None,
            "actual_retirement_year": retirements.get(pid),
        }
    return result


# ── DataFrame assembly ───────────────────────────────────────────────────────

def build_dataframes(f860_rows, enrichment=None):
    df = pd.DataFrame(f860_rows)

    df["fuel"]          = df["energy_source_code"].apply(_fuel)
    df["capacity_mw"]   = pd.to_numeric(df["nameplate-capacity-mw"], errors="coerce")
    df["latitude"]      = pd.to_numeric(df["latitude"],  errors="coerce")
    df["longitude"]     = pd.to_numeric(df["longitude"], errors="coerce")
    df["commissioned"]  = df["operating-year-month"]
    df["commission_year"] = df["commissioned"].str[:4].apply(
        lambda x: int(x) if x and x.isdigit() else None
    )
    df["retirement_planned"] = df["planned-retirement-year-month"]
    df["retirement_year"] = df["retirement_planned"].str[:4].apply(
        lambda x: int(x) if isinstance(x, str) and x.isdigit() else None
    )

    gen_df = df[[
        "plantid", "plantName", "generatorid", "fuel",
        "capacity_mw", "latitude", "longitude", "county",
        "entityName", "balancing_authority_code", "status", "statusDescription",
        "commissioned", "commission_year", "retirement_planned", "retirement_year",
    ]].rename(columns={
        "plantName": "plant_name", "generatorid": "generator_id",
        "entityName": "owner",
        "balancing_authority_code": "balancing_authority",
        "statusDescription": "status_desc",
    })

    plant_df = (
        df.groupby(["plantid", "plantName"])
        .agg(
            fuel        = ("fuel",         lambda x: x.mode()[0] if len(x) else "Other"),
            capacity_mw = ("capacity_mw",  "sum"),
            latitude    = ("latitude",     "first"),
            longitude   = ("longitude",    "first"),
            county      = ("county",       "first"),
            owner       = ("entityName",   "first"),
            ba          = ("balancing_authority_code", "first"),
            first_unit_commissioned = ("commission_year", "min"),
            commission_period       = ("commissioned",    "min"),   # earliest YYYY-MM
            generators  = ("generatorid", "count"),
            retirement_year = ("retirement_year", "min"),
        )
        .reset_index()
        .rename(columns={"plantName": "plant_name", "ba": "balancing_authority"})
    )

    if enrichment:
        plant_df["avg_output_mw"] = plant_df["plantid"].apply(
            lambda pid: (enrichment.get(int(pid)) or {}).get("avg_output_mw")
        )
        plant_df["actual_retirement_year"] = plant_df["plantid"].apply(
            lambda pid: (enrichment.get(int(pid)) or {}).get("actual_retirement_year")
        )

    return gen_df, plant_df


def print_summary(gen_df, plant_df):
    print(f"\n{'='*55}")
    print(f"Texas generators: {len(gen_df):,}  |  Plants: {len(plant_df):,}")

    by_fuel = gen_df.groupby("fuel")["capacity_mw"].sum().sort_values(ascending=False)
    print("\nNameplate capacity by fuel (MW):")
    for fuel, mw in by_fuel.items():
        print(f"  {fuel:<14} {mw:>9,.0f} MW  ({mw/by_fuel.sum()*100:.1f}%)")

    if "avg_output_mw" in plant_df.columns:
        n = plant_df["avg_output_mw"].notna().sum()
        tot = plant_df["avg_output_mw"].sum()
        print(f"\nForm 923 avg output data: {n:,} plants  ({tot:,.0f} MW total avg)")

    if "actual_retirement_year" in plant_df.columns:
        ret = plant_df[plant_df["actual_retirement_year"].notna()].sort_values(
            "actual_retirement_year"
        )
        print(f"\nRetired plants detected via Form 923: {len(ret)}")
        for _, r in ret.iterrows():
            print(
                f"  {r['plant_name']:<42} last gen ~{int(r['actual_retirement_year'])-1}"
                f"  ({r['fuel']})"
            )
    print("=" * 55)


if __name__ == "__main__":
    print("=== EIA Texas Power Plant Data ===\n")

    print("Fetching Form 860 (operating generators)...")
    f860_rows, period = fetch_f860_tx()

    print("\nFetching Form 923 (monthly generation, 2001-present)...")
    f923_rows = fetch_f923_tx()
    gen_df_923 = build_gen_df(f923_rows)
    gen_df_923.to_csv(OUT_GEN923, index=False)
    print(f"  Saved {OUT_GEN923.name}  ({len(gen_df_923):,} rows)")

    # First pass to get current plant IDs for retirement detection
    _, plant_tmp = build_dataframes(f860_rows)
    plant_860_ids = {int(pid) for pid in plant_tmp["plantid"]}

    print("\nDeriving avg output and retirements from Form 923...")
    enrichment = derive_enrichment(gen_df_923, plant_860_ids)
    n_ret = sum(1 for v in enrichment.values() if v.get("actual_retirement_year"))
    n_out = sum(1 for v in enrichment.values() if v.get("avg_output_mw"))
    print(f"  {n_out:,} plants with avg output  |  {n_ret} retirements detected")

    print("\nBuilding final DataFrames...")
    gen_df_860, plant_df = build_dataframes(f860_rows, enrichment)
    print_summary(gen_df_860, plant_df)

    gen_df_860.to_csv(OUT_GEN, index=False)
    plant_df.to_csv(OUT_PLANTS, index=False)
    print(f"\nSaved:")
    print(f"  {OUT_GEN}      ({len(gen_df_860):,} generators)")
    print(f"  {OUT_PLANTS}   ({len(plant_df):,} plants)")
    print(f"  {OUT_GEN923}   ({len(gen_df_923):,} monthly records)")
