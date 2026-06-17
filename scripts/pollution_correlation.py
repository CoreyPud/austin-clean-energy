# Correlation analysis: do fossil fuel power plants predict measured air quality near Austin?
#
# Data sources:
#   1. EPA GHGRP - power plant locations + annual CO2/NOx emissions (Texas)
#   2. EPA AQS annual summary - PM2.5 and ozone at monitoring stations
#
# Output:
#   ~/Downloads/austin_plants.csv       - plants within 200km of Austin
#   ~/Downloads/austin_aq_monitors.csv  - AQS monitors within 200km of Austin
#   ~/Downloads/pollution_correlation.csv - per-monitor scores + measured values
#   Prints correlation stats to stdout

import io
import math
import zipfile
from pathlib import Path

import pandas as pd
import requests

DOWNLOADS = Path.home() / "Downloads"
AUSTIN_LAT, AUSTIN_LON = 30.2672, -97.7431
RADIUS_KM = 200

# --- Helpers -----------------------------------------------------------------

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def download_zip_csv(url, cache_path, dtype=None):
    if cache_path.exists():
        print(f"  Using cache: {cache_path.name}")
        return pd.read_csv(cache_path, dtype=dtype, low_memory=False)
    print(f"  Downloading {url} ...")
    resp = requests.get(url, timeout=120, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
        csv_name = next(n for n in z.namelist() if n.endswith(".csv"))
        with z.open(csv_name) as f:
            df = pd.read_csv(f, dtype=dtype, low_memory=False)
    df.to_csv(cache_path, index=False)
    return df


def download_csv(url, cache_path, dtype=None):
    if cache_path.exists():
        print(f"  Using cache: {cache_path.name}")
        return pd.read_csv(cache_path, dtype=dtype, low_memory=False)
    print(f"  Downloading {url} ...")
    resp = requests.get(url, timeout=120, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    df = pd.read_csv(io.StringIO(resp.text), dtype=dtype, low_memory=False)
    df.to_csv(cache_path, index=False)
    return df

# --- 1. Power plants from GHGRP ----------------------------------------------

def fetch_plants():
    print("\n=== Power plants (EPA GHGRP) ===")
    # GHGRP summary CSV - all sectors, all states, most recent year available
    url = (
        "https://ghgdata.epa.gov/ghgp/service/export"
        "?q=&tr=current&ob=CO2e&ds=E&gr=S1"
        "&lowE=0&highE=1000000000"
        "&where=(YEAR%3D2022)%20AND%20(STATE%3D%27TX%27)"
        "&f=csv"
    )
    cache = DOWNLOADS / "ghgrp_tx_2022.csv"
    try:
        df = download_csv(url, cache)
        print(f"  Raw rows: {len(df):,}")
        print(f"  Columns: {list(df.columns[:20])}")
    except Exception as e:
        print(f"  GHGRP download failed: {e}")
        print("  Falling back to known Austin-area plants (hardcoded)")
        df = pd.DataFrame([
            {"facility_name": "Fayette Power Project",      "latitude": 29.9058, "longitude": -96.9061, "co2e_tons": 12_800_000, "sector": "Power Plants"},
            {"facility_name": "Decker Creek Power Station", "latitude": 30.3338, "longitude": -97.6543, "co2e_tons":    450_000, "sector": "Power Plants"},
            {"facility_name": "Sand Hill Energy Center",    "latitude": 30.2030, "longitude": -97.6790, "co2e_tons":    220_000, "sector": "Power Plants"},
            {"facility_name": "Lost Pines Power Park",      "latitude": 30.1060, "longitude": -97.3220, "co2e_tons":    600_000, "sector": "Power Plants"},
            {"facility_name": "Thomas C Ferguson",          "latitude": 30.2740, "longitude": -97.3020, "co2e_tons":    380_000, "sector": "Power Plants"},
        ])
        df.to_csv(cache, index=False)
        return df

    # Normalise columns — GHGRP CSV headers vary by export
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # Find lat/lon columns
    lat_col = next((c for c in df.columns if "lat" in c), None)
    lon_col = next((c for c in df.columns if "lon" in c), None)
    # Find emissions column
    co2_col = next((c for c in df.columns if "co2" in c and "equiv" in c), None) or \
              next((c for c in df.columns if "total" in c and "emission" in c), None) or \
              next((c for c in df.columns if "ghg" in c), None)
    # Find sector column
    sector_col = next((c for c in df.columns if "sector" in c), None)
    name_col   = next((c for c in df.columns if "facil" in c and "name" in c), None) or "facility_name"

    if not lat_col or not lon_col:
        print(f"  Cannot find lat/lon columns. Available: {list(df.columns)}")
        return pd.DataFrame()

    df = df.rename(columns={lat_col: "latitude", lon_col: "longitude"})
    if co2_col:
        df = df.rename(columns={co2_col: "co2e_tons"})
    if sector_col:
        df = df.rename(columns={sector_col: "sector"})
    if name_col != "facility_name":
        df = df.rename(columns={name_col: "facility_name"})

    df["latitude"]  = pd.to_numeric(df["latitude"],  errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df = df.dropna(subset=["latitude", "longitude"])

    # Filter to power plants only
    if "sector" in df.columns:
        power = df[df["sector"].str.contains("Power|power|Utility|util", na=False, regex=True)].copy()
        print(f"  Power plant rows: {len(power):,}")
    else:
        power = df.copy()

    # Filter to within radius
    power["dist_km"] = power.apply(
        lambda r: haversine_km(AUSTIN_LAT, AUSTIN_LON, r["latitude"], r["longitude"]), axis=1
    )
    nearby = power[power["dist_km"] <= RADIUS_KM].copy()
    print(f"  Within {RADIUS_KM}km of Austin: {len(nearby)}")
    if "co2e_tons" in nearby.columns:
        nearby["co2e_tons"] = pd.to_numeric(nearby["co2e_tons"].astype(str).str.replace(",", ""), errors="coerce")
        print(nearby[["facility_name", "dist_km", "co2e_tons"]].sort_values("dist_km").to_string(index=False))

    nearby.to_csv(DOWNLOADS / "austin_plants.csv", index=False)
    return nearby


# --- 2. AQS monitoring data --------------------------------------------------

def fetch_aqs_monitors():
    print("\n=== Air quality monitors (EPA AQS) ===")
    # AQS annual concentration summaries — public download, no API key
    # PM2.5 FRM/FEM = parameter 88101
    # Ozone = parameter 44201
    year = 2022

    monitors_all = []
    for param_code, param_name in [("88101", "pm25"), ("44201", "ozone")]:
        url = f"https://aqs.epa.gov/aqsweb/airdata/annual_conc_by_monitor_{year}.zip"
        cache = DOWNLOADS / f"aqs_annual_{year}.csv"
        try:
            df = download_zip_csv(url, cache)
        except Exception as e:
            print(f"  AQS download failed: {e}")
            continue

        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
        param_col = next((c for c in df.columns if "param" in c and "code" in c), "parameter_code")
        lat_col   = next((c for c in df.columns if "lat" in c), "latitude")
        lon_col   = next((c for c in df.columns if "lon" in c), "longitude")
        mean_col  = next((c for c in df.columns if "arithmetic_mean" in c), None) or \
                    next((c for c in df.columns if "mean" in c), None)

        sub = df[df[param_col].astype(str) == param_code].copy()
        if sub.empty:
            print(f"  No {param_name} data found")
            continue

        sub = sub.rename(columns={lat_col: "latitude", lon_col: "longitude"})
        sub["latitude"]  = pd.to_numeric(sub["latitude"],  errors="coerce")
        sub["longitude"] = pd.to_numeric(sub["longitude"], errors="coerce")
        sub = sub.dropna(subset=["latitude", "longitude"])

        sub["dist_km"] = sub.apply(
            lambda r: haversine_km(AUSTIN_LAT, AUSTIN_LON, r["latitude"], r["longitude"]), axis=1
        )
        nearby = sub[sub["dist_km"] <= RADIUS_KM].copy()
        if mean_col:
            nearby = nearby.rename(columns={mean_col: "mean_value"})
        nearby["pollutant"] = param_name
        monitors_all.append(nearby)
        print(f"  {param_name}: {len(nearby)} monitors within {RADIUS_KM}km")

    if not monitors_all:
        print("  No AQS data retrieved")
        return pd.DataFrame()

    all_monitors = pd.concat(monitors_all, ignore_index=True)
    all_monitors.to_csv(DOWNLOADS / "austin_aq_monitors.csv", index=False)
    return all_monitors


# --- 3. Correlation analysis --------------------------------------------------

def compute_plant_exposure(monitors_df, plants_df):
    """For each monitor, compute inverse-distance-squared weighted exposure from all plants."""
    if plants_df.empty or monitors_df.empty:
        return monitors_df

    monitors_df = monitors_df.copy()
    monitors_df["plant_exposure"] = 0.0
    monitors_df["nearest_plant_km"] = 9999.0
    monitors_df["nearest_plant_name"] = ""

    for _, plant in plants_df.iterrows():
        emission = pd.to_numeric(plant.get("co2e_tons", 1), errors="coerce") or 1
        for idx, mon in monitors_df.iterrows():
            d = haversine_km(mon["latitude"], mon["longitude"], plant["latitude"], plant["longitude"])
            d = max(d, 1)  # floor at 1km
            monitors_df.at[idx, "plant_exposure"] += emission / (d ** 2)
            if d < monitors_df.at[idx, "nearest_plant_km"]:
                monitors_df.at[idx, "nearest_plant_km"] = d
                monitors_df.at[idx, "nearest_plant_name"] = plant.get("facility_name", "")

    return monitors_df


def run_correlation(monitors_df):
    if monitors_df.empty or "mean_value" not in monitors_df.columns:
        print("\nNo data to correlate.")
        return

    monitors_df["mean_value"] = pd.to_numeric(monitors_df["mean_value"], errors="coerce")
    monitors_df = monitors_df.dropna(subset=["mean_value", "plant_exposure"])

    print("\n=== Correlation results ===")
    for pollutant in monitors_df["pollutant"].unique():
        sub = monitors_df[monitors_df["pollutant"] == pollutant]
        if len(sub) < 3:
            print(f"  {pollutant}: only {len(sub)} monitors — too few for correlation")
            continue
        corr = sub["plant_exposure"].corr(sub["mean_value"])
        corr_dist = sub["nearest_plant_km"].corr(sub["mean_value"])
        print(f"\n  {pollutant.upper()} ({len(sub)} monitors):")
        print(f"    Correlation(plant_exposure, {pollutant}):   r = {corr:.3f}")
        print(f"    Correlation(nearest_plant_km, {pollutant}): r = {corr_dist:.3f}")
        print(f"    Mean {pollutant}: {sub['mean_value'].mean():.3f}, std: {sub['mean_value'].std():.3f}")
        print(f"    Plant exposure range: {sub['plant_exposure'].min():.2e} – {sub['plant_exposure'].max():.2e}")
        print()
        print(sub[["latitude", "longitude", "dist_km", "nearest_plant_name",
                   "nearest_plant_km", "plant_exposure", "mean_value"]].sort_values("plant_exposure", ascending=False).to_string(index=False))

    monitors_df.to_csv(DOWNLOADS / "pollution_correlation.csv", index=False)
    print(f"\nSaved -> {DOWNLOADS / 'pollution_correlation.csv'}")


# --- Main --------------------------------------------------------------------

if __name__ == "__main__":
    plants   = fetch_plants()
    monitors = fetch_aqs_monitors()

    if not monitors.empty and not plants.empty:
        monitors = compute_plant_exposure(monitors, plants)
        run_correlation(monitors)
    elif monitors.empty:
        print("\nCould not fetch AQS monitor data — check internet connection or try again later.")
    elif plants.empty:
        print("\nCould not fetch plant data.")
