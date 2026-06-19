# Sentinel-5P TROPOMI tropospheric NO2 — monthly time-series map for Texas
#
# First run: fetches ~97 months from Google Earth Engine (several hours).
# Each month is cached independently so the run is resumable.
# Subsequent runs: loads from cache, completes in minutes.
#
# Output:  ~/Downloads/sentinel_no2_map/
#            index.html          interactive map with time slider + play button
#            no2_YYYY_MM.png     one raster per month (consistent color scale)
#
# Cache:   ~/Downloads/sentinel_no2_cache/
#            no2_YYYY_MM.json    raw GEE grid data — load for custom averaging
#
# Setup (one-time):
#   pip install earthengine-api folium numpy matplotlib scipy requests
#   earthengine authenticate
#
# Then: python sentinel_no2_map.py

import base64
import csv
import json
import math
import re
import time
from datetime import date
from io import BytesIO
from pathlib import Path

import ee
import folium
import matplotlib
matplotlib.use("Agg")
import matplotlib.colors as mcolors
import matplotlib.pyplot as plt
from matplotlib.path import Path as MplPath
import numpy as np
import requests
from scipy.ndimage import gaussian_filter, zoom as nd_zoom, distance_transform_edt

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

DOWNLOADS    = Path.home() / "Downloads"
CACHE_DIR    = DOWNLOADS / "sentinel_no2_cache"   # raw monthly GEE data
OUTPUT_DIR   = DOWNLOADS / "sentinel_no2_map"     # HTML + PNGs

CACHE_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

CACHE_TX_BORDER = DOWNLOADS / "cache_tx_border.json"
CACHE_PLANTS    = DOWNLOADS / "cache_area_plants.json"

MIN_PLANT_MW = 2.0   # exclude sub-threshold backup generators (WAL/HEB etc.)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

GEE_PROJECT = "solarcalc-491303"

AUSTIN_LAT, AUSTIN_LON   = 30.2672, -97.7431
WEST, SOUTH, EAST, NORTH = -106.65, 25.84, -93.51, 36.50

# Grid step matching TROPOMI native resolution (~3.5 km)
LAT_STEP, LON_STEP = 0.032, 0.040

# Monthly range for GEE fetch: OFFL product stable from May 2018
MONTHS_START = (2018, 5)
MONTHS_END   = (2026, 5)

# Slider range: Form 923 generation data covers back to 2001
SLIDER_START = (2001, 1)

UPSAMPLE = 4   # cubic upscale factor — 4x is smooth, keeps PNGs ~500KB each

EIA_API_KEY    = "SUroxKGePzfAZh6P7L8wUYXGZGrYkQPva32NhBtx"

OVERPASS_URL   = "https://overpass-api.de/api/interpreter"
STATES_GEOJSON = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json"

MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

FUEL_COLORS = {
    "coal":       "#991b1b",
    "oil":        "#dc2626",
    "gas":        "#d97706",
    "biomass":    "#a16207",
    "nuclear":    "#166534",
    "hydro":      "#0d9488",
    "wind":       "#16a34a",
    "solar":      "#4ade80",
    "other":      "#6b7280",
    "storage":    "#7c3aed",
}

AE_PLANTS = [
    {"name": "Decker Creek Power Station",      "lat": 30.3067, "lon": -97.6135, "fuel": "gas",     "cap_mw": 793,  "owner": "Austin Energy", "co2_tons": 450_000},
    {"name": "Sand Hill Energy Center",         "lat": 30.2101, "lon": -97.6134, "fuel": "gas",     "cap_mw": 614,  "owner": "Austin Energy", "co2_tons": 220_000},
    {"name": "Thomas C. Ferguson Power Plant",  "lat": 30.2738, "lon": -97.2985, "fuel": "gas",     "cap_mw": 305,  "owner": "Austin Energy", "co2_tons": 380_000},
    {"name": "Fayette Power Project",           "lat": 29.8951, "lon": -96.8972, "fuel": "coal",    "cap_mw": 2650, "owner": "LCRA/Austin Energy", "co2_tons": 12_800_000},
    {"name": "Nacogdoches Generating Facility", "lat": 31.5697, "lon": -94.6474, "fuel": "biomass", "cap_mw": 100,  "owner": "Austin Energy", "co2_tons": None},
]

KNOWN_EMISSIONS = {p["name"]: p["co2_tons"] for p in AE_PLANTS if p.get("co2_tons")}

# ---------------------------------------------------------------------------
# Month helpers
# ---------------------------------------------------------------------------

def all_months(start=None, end=None):
    months = []
    y, m = start or MONTHS_START
    ey, em = end or MONTHS_END
    while (y, m) <= (ey, em):
        months.append((y, m))
        m += 1
        if m > 12:
            m, y = 1, y + 1
    return months


def month_cache_path(year, month):
    return CACHE_DIR / f"no2_{year:04d}_{month:02d}.json"


def month_label(year, month):
    return f"{MONTH_NAMES[month]} {year}"


def month_key(year, month):
    return f"{year:04d}_{month:02d}"


# ---------------------------------------------------------------------------
# GEE — monthly fetch
# ---------------------------------------------------------------------------

def init_gee():
    print(f"  Initialising Google Earth Engine (project: {GEE_PROJECT})...")
    try:
        ee.Initialize(project=GEE_PROJECT)
    except Exception as exc:
        print(f"  Auth error: {exc}\n  Run: earthengine authenticate")
        raise


def _fetch_one_month(year, month, lats, lons):
    """Download one month from GEE and cache to disk. Returns dict or None."""
    cache = month_cache_path(year, month)
    if cache.exists():
        return json.loads(cache.read_text())

    ny, nm = (year, month + 1) if month < 12 else (year + 1, 1)
    start, end = f"{year}-{month:02d}-01", f"{ny}-{nm:02d}-01"

    def mask_clouds(img):
        return img.updateMask(img.select("cloud_fraction").lt(0.3))

    collection = (
        ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_NO2")
        .filterDate(start, end)
        .filterBounds(ee.Geometry.Rectangle([WEST, SOUTH, EAST, NORTH]))
        .select(["tropospheric_NO2_column_number_density", "cloud_fraction"])
        .map(mask_clouds)
        .select("tropospheric_NO2_column_number_density")
    )

    scene_count = collection.size().getInfo()
    if scene_count == 0:
        print(f" 0 scenes — skipping")
        return None

    mean_img = collection.mean()
    all_features = [
        ee.Feature(ee.Geometry.Point([lon, lat]), {"lat": lat, "lon": lon})
        for lat in lats for lon in lons
    ]

    BATCH = 4000
    points = []
    for i in range(0, len(all_features), BATCH):
        grid = ee.FeatureCollection(all_features[i:i + BATCH])
        sampled = mean_img.sampleRegions(
            collection=grid, scale=3500, geometries=False, tileScale=4,
        )
        for feat in sampled.getInfo()["features"]:
            p = feat["properties"]
            v = p.get("tropospheric_NO2_column_number_density")
            if v and v > 0:
                points.append({
                    "lat": p["lat"],
                    "lon": p["lon"],
                    "no2_umol_m2": round(v * 1e6, 4),
                })

    result = {
        "year": year, "month": month,
        "scene_count": scene_count,
        "bbox": [WEST, SOUTH, EAST, NORTH],
        "grid_lat_step": LAT_STEP,
        "grid_lon_step": LON_STEP,
        "points": points,
    }
    cache.write_text(json.dumps(result))
    print(f" {scene_count} scenes, {len(points):,} cells")
    return result


def fetch_all_months():
    """Fetch all months, using cache where available. Returns (list of dicts, lats, lons)."""
    months = all_months()
    lats   = list(np.arange(SOUTH + LAT_STEP / 2, NORTH, LAT_STEP))
    lons   = list(np.arange(WEST  + LON_STEP / 2, EAST,  LON_STEP))

    missing = [(y, m) for y, m in months if not month_cache_path(y, m).exists()]
    cached  = len(months) - len(missing)
    print(f"\n  {cached}/{len(months)} months already cached, {len(missing)} to fetch")

    if missing:
        init_gee()

    results = []
    for i, (year, month) in enumerate(months):
        f = month_cache_path(year, month)
        if f.exists():
            data = json.loads(f.read_text())
        else:
            print(f"  [{i+1}/{len(months)}] {year}-{month:02d}...", end=" ", flush=True)
            try:
                data = _fetch_one_month(year, month, lats, lons)
            except Exception as exc:
                print(f" FAILED: {exc}")
                data = None
            time.sleep(0.4)

        if data and data.get("points"):
            results.append(data)

    print(f"\n  {len(results)}/{len(months)} months available with data")
    return results, lats, lons


# ---------------------------------------------------------------------------
# Texas border
# ---------------------------------------------------------------------------

def fetch_texas_border():
    if CACHE_TX_BORDER.exists():
        return json.loads(CACHE_TX_BORDER.read_text())
    print("  Fetching Texas state boundary...")
    r = requests.get(STATES_GEOJSON, timeout=30)
    r.raise_for_status()
    tx = next(f for f in r.json()["features"] if f["properties"].get("name") == "Texas")
    geom = tx["geometry"]
    rings = (geom["coordinates"] if geom["type"] == "Polygon"
             else [p[0] for p in geom["coordinates"]])
    CACHE_TX_BORDER.write_text(json.dumps(rings))
    return rings


def _tx_mask(lats_u, lons_u, tx_rings):
    """Boolean 2-D array (nrows x ncols), True = inside Texas."""
    grid_lons, grid_lats = np.meshgrid(lons_u, lats_u)
    pts = np.column_stack([grid_lons.ravel(), grid_lats.ravel()])
    inside = np.zeros(len(pts), dtype=bool)
    for ring in tx_rings:
        inside |= MplPath(ring).contains_points(pts)
    return inside.reshape(len(lats_u), len(lons_u))


# ---------------------------------------------------------------------------
# Power plants (OpenStreetMap)
# ---------------------------------------------------------------------------

def _norm_fuel(raw):
    raw = raw.lower().split(";")[0].strip()
    if raw in ("gas", "natural_gas", "natural gas"): return "gas"
    if raw == "coal":                                 return "coal"
    if raw == "wind":                                 return "wind"
    if raw in ("solar", "photovoltaic"):              return "solar"
    if raw == "nuclear":                              return "nuclear"
    if raw in ("oil", "diesel"):                      return "oil"
    if raw in ("biomass", "wood", "waste"):           return "biomass"
    if raw in ("hydro", "water"):                     return "hydro"
    if raw == "storage":                              return "storage"
    if raw in ("waste heat", "geothermal"):           return "other"
    return "other"


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat, dlon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = (math.sin(dlat/2)**2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2)
    return R * 2 * math.asin(math.sqrt(a))


def _dedup_plants(plants, radius_km=2.0):
    """Remove duplicates within radius_km of each other.
    Prefers entries with co2_tons set, then higher capacity, then first seen."""
    kept = []
    for plant in plants:
        match = None
        for i, existing in enumerate(kept):
            if haversine_km(plant["lat"], plant["lon"],
                            existing["lat"], existing["lon"]) < radius_km:
                match = i
                break
        if match is None:
            kept.append(dict(plant))
        else:
            # Merge better data into the existing entry
            ex = kept[match]
            if plant.get("co2_tons") and not ex.get("co2_tons"):
                ex["co2_tons"] = plant["co2_tons"]
            if plant.get("cap_mw") and not ex.get("cap_mw"):
                ex["cap_mw"] = plant["cap_mw"]
            if plant.get("owner") and not ex.get("owner"):
                ex["owner"] = plant["owner"]
    return kept


def fetch_area_plants():
    if CACHE_PLANTS.exists():
        print("  Area plants: loading from cache")
        return json.loads(CACHE_PLANTS.read_text())

    print("  Fetching power plants from OpenStreetMap...")
    query = f"""
[out:json][timeout:60];
(
  node["power"="plant"]({SOUTH},{WEST},{NORTH},{EAST});
  way["power"="plant"]({SOUTH},{WEST},{NORTH},{EAST});
  relation["power"="plant"]({SOUTH},{WEST},{NORTH},{EAST});
);
out center tags;
"""
    r = requests.post(OVERPASS_URL, data={"data": query}, timeout=90,
                      headers={"User-Agent": "austin-clean-energy-map/1.0"})
    r.raise_for_status()

    plants = []
    for elem in r.json()["elements"]:
        tags = elem.get("tags", {})
        name = tags.get("name") or tags.get("operator") or "Power plant"
        fuel = _norm_fuel(tags.get("plant:source") or tags.get("generator:source") or "other")
        lat  = elem.get("lat") or (elem.get("center") or {}).get("lat")
        lon  = elem.get("lon") or (elem.get("center") or {}).get("lon")
        if lat is None or lon is None:
            continue

        cap_mw = None
        m = re.search(r"([\d.]+)\s*(GW|MW|kW)?",
                      tags.get("plant:output:electricity", ""), re.I)
        if m:
            val, unit = float(m.group(1)), (m.group(2) or "MW").upper()
            cap_mw = val * 1000 if unit == "GW" else val / 1000 if unit == "KW" else val

        plants.append({
            "name": name, "lat": lat, "lon": lon, "fuel": fuel,
            "cap_mw": cap_mw, "owner": tags.get("operator", ""),
            "co2_tons": KNOWN_EMISSIONS.get(name),
        })

    # Merge AE assets — use 10km threshold so coordinate discrepancies don't miss them
    MATCH_KM = 10.0
    for ae in AE_PLANTS:
        distances = [haversine_km(ae["lat"], ae["lon"], p["lat"], p["lon"]) for p in plants]
        if not distances or min(distances) > MATCH_KM:
            plants.append(ae)
        else:
            # Enrich the nearest OSM entry with AE emissions data
            nearest = distances.index(min(distances))
            if ae.get("co2_tons") and not plants[nearest].get("co2_tons"):
                plants[nearest]["co2_tons"] = ae["co2_tons"]

    plants = _dedup_plants(plants)
    print(f"  {len(plants)} power plants after dedup")
    CACHE_PLANTS.write_text(json.dumps(plants))
    return plants


def load_eia_plants_timeline():
    """Load EIA Form 860 plant data for time-aware marker rendering.

    Returns a list of plant dicts with commission_year and retirement_year so
    the JavaScript slider can show/hide markers as the timeline advances.
    Falls back to None if eia_tx_plants.csv hasn't been generated yet.
    """
    path = DOWNLOADS / "eia_tx_plants.csv"
    if not path.exists():
        print("  eia_tx_plants.csv not found — run scripts/eia_plants.py first")
        return None

    def _safe_int(val):
        try:
            v = str(val).strip()
            return int(float(v)) if v and v not in ("nan", "None", "") else None
        except (ValueError, TypeError):
            return None

    def _safe_float(val):
        try:
            v = str(val).strip()
            return round(float(v), 1) if v and v not in ("nan", "None", "") else None
        except (ValueError, TypeError):
            return None

    plants = []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                lat = float(row["latitude"])
                lon = float(row["longitude"])
            except (ValueError, TypeError, KeyError):
                continue
            if not (WEST <= lon <= EAST and SOUTH <= lat <= NORTH):
                continue

            cap_mw = _safe_float(row.get("capacity_mw"))
            if cap_mw is not None and cap_mw < MIN_PLANT_MW:
                continue

            fuel = _norm_fuel(row.get("fuel", "Other"))
            co2  = KNOWN_EMISSIONS.get(row.get("plant_name", ""))

            # Prefer actual retirement (Form 923 last-gen date) over planned (Form 860)
            actual_ret  = _safe_int(row.get("actual_retirement_year"))
            planned_ret = _safe_int(row.get("retirement_year"))
            retirement  = actual_ret if actual_ret is not None else planned_ret

            cp = row.get("commission_period", "") or ""
            commission_month = cp[:7].replace('-', '_') if len(cp) >= 7 else None  # "YYYY_MM"

            plants.append({
                "id":               _safe_int(row.get("plantid")),
                "name":             row.get("plant_name", "Unknown"),
                "lat":              lat,
                "lon":              lon,
                "fuel":             fuel,
                "cap_mw":           cap_mw,
                "avg_output_mw":    _safe_float(row.get("avg_output_mw")),
                "owner":            row.get("owner", ""),
                "commission_month": commission_month,
                "retirement_year":  retirement,
                "co2_tons":         co2,
            })

    # Enrich any AE plants that are matched by proximity with known CO2 data
    for ae in AE_PLANTS:
        if not ae.get("co2_tons"):
            continue
        for p in plants:
            if haversine_km(ae["lat"], ae["lon"], p["lat"], p["lon"]) < 5.0:
                if not p.get("co2_tons"):
                    p["co2_tons"] = ae["co2_tons"]
                break

    n_output  = sum(1 for p in plants if p.get("avg_output_mw"))
    n_retired = sum(1 for p in plants if p.get("retirement_year"))
    print(f"  EIA timeline: {len(plants)} plants  "
          f"({n_output} with Form 923 output, {n_retired} with retirement dates)")
    return plants


# ---------------------------------------------------------------------------
# Raster rendering — one PNG per month
# ---------------------------------------------------------------------------

def build_grid_index(lats, lons):
    lats_u  = sorted(set(lats), reverse=True)   # descending = image top to bottom
    lons_u  = sorted(set(lons))
    lat_idx = {v: i for i, v in enumerate(lats_u)}
    lon_idx = {v: i for i, v in enumerate(lons_u)}
    return lats_u, lons_u, lat_idx, lon_idx


def _render_grid_png(year, month, grid, outside_tx, cmap, norm):
    """Render a pre-built 2-D NO2 grid to PNG, always overwriting."""
    out_path = OUTPUT_DIR / f"no2_{year:04d}_{month:02d}.png"

    nan_mask = np.isnan(grid)
    if nan_mask.all():
        return

    if nan_mask.any():
        _, idx = distance_transform_edt(nan_mask, return_indices=True)
        grid   = grid[tuple(idx)]

    grid_up = nd_zoom(grid, UPSAMPLE, order=3)
    grid_up = gaussian_filter(grid_up, sigma=1.0)

    rgba = cmap(norm(np.clip(grid_up, 0.1, None)))
    rgba[outside_tx, 3]  = 0
    rgba[~outside_tx, 3] = 0.85

    buf = BytesIO()
    plt.imsave(buf, (rgba * 255).astype(np.uint8), format="png")
    buf.seek(0)
    out_path.write_bytes(buf.read())


def render_all_pngs(all_data, lats_u, lons_u, lat_idx, lon_idx, tx_rings):
    print(f"\n  Pre-computing Texas border mask ({len(lats_u)}x{len(lons_u)} grid)...")
    tx_inside  = _tx_mask(lats_u, lons_u, tx_rings)
    outside_tx = nd_zoom((~tx_inside).astype(float), UPSAMPLE, order=0) > 0.5

    # Build a raw grid for every cached month
    nrows, ncols = len(lats_u), len(lons_u)
    raw_grids = []
    for d in all_data:
        g = np.full((nrows, ncols), np.nan)
        for p in d["points"]:
            r = lat_idx.get(p["lat"])
            c = lon_idx.get(p["lon"])
            if r is not None and c is not None:
                g[r, c] = p["no2_umol_m2"]
        raw_grids.append(g)

    # 12-month trailing average per pixel
    stacked   = np.array(raw_grids)   # (N, nrows, ncols)
    avg_grids = [
        np.nanmean(stacked[max(0, i - 11):i + 1], axis=0)
        for i in range(len(raw_grids))
    ]

    # Global colour scale derived from the averaged grids
    avg_vals = np.concatenate([g[~np.isnan(g)] for g in avg_grids])
    vmin = float(np.percentile(avg_vals, 5))
    vmax = float(np.percentile(avg_vals, 95))
    print(f"  Global color scale: {vmin:.2f} - {vmax:.2f} umol/m2")
    stops = ["#0d47a1", "#1976d2", "#43a047", "#fdd835", "#f4511e", "#b71c1c"]
    cmap  = mcolors.LinearSegmentedColormap.from_list("no2", stops)
    norm  = mcolors.LogNorm(vmin=max(vmin, 0.1), vmax=vmax)

    print(f"  Rendering {len(all_data)} PNGs (12-month rolling average)...")
    for i, d in enumerate(all_data):
        _render_grid_png(d["year"], d["month"], avg_grids[i], outside_tx, cmap, norm)
        if (i + 1) % 12 == 0 or i + 1 == len(all_data):
            print(f"    {i+1}/{len(all_data)} months rendered")

    print(f"  Done — {len(all_data)} PNGs in {OUTPUT_DIR}")
    return vmin, vmax


# ---------------------------------------------------------------------------
# Map — folium base + JavaScript time slider
# ---------------------------------------------------------------------------

def compute_ae_monthly_load():
    """Estimate AE monthly retail load (avg MW) via EIA Form 861 annual + TX monthly totals.

    AE_monthly ≈ TX_monthly × (AE_annual / TX_annual).
    Applies 12-month trailing rolling average.
    Returns {YYYY_MM: avg_mw} for 2018+; empty dict on API failure.
    """
    import calendar
    import pandas as pd

    # AE calendar-year retail sales (MWh) from EIA Form 861 (utility 1015)
    AE_ANNUAL = {
        2018: 13_426_935, 2019: 13_695_862, 2020: 13_087_868,
        2021: 13_222_176, 2022: 14_286_216, 2023: 14_396_991,
        2024: 14_200_574,
    }
    # Extrapolate latest year forward for 2025+
    last_yr = max(AE_ANNUAL)
    for yr in range(last_yr + 1, 2030):
        AE_ANNUAL[yr] = AE_ANNUAL[last_yr]

    try:
        resp = requests.get(
            "https://api.eia.gov/v2/electricity/retail-sales/data/",
            params={
                "api_key": EIA_API_KEY,
                "facets[stateid][]": "TX",
                "facets[sectorid][]": "ALL",
                "data[]": ["sales"],
                "frequency": "monthly",
                "start": "2017-06",
                "end": "2026-12",
                "length": 5000,
            },
            timeout=30,
        )
        resp.raise_for_status()
        tx_rows = resp.json()["response"]["data"]
    except Exception as e:
        print(f"  Warning: EIA retail-sales API failed ({e}); no imported estimate")
        return {}

    tx_monthly = {}  # "YYYY-MM" -> MWh
    for row in tx_rows:
        if row.get("sales"):
            tx_monthly[row["period"]] = float(row["sales"]) * 1e6  # million kWh → MWh

    # Count available months per calendar year (need 12 for a reliable annual denominator)
    months_per_yr = {}
    for p in tx_monthly:
        yr = int(p[:4])
        months_per_yr[yr] = months_per_yr.get(yr, 0) + 1

    tx_annual = {}
    for p, mwh in tx_monthly.items():
        yr = int(p[:4])
        if months_per_yr.get(yr, 0) == 12:
            tx_annual[yr] = tx_annual.get(yr, 0) + mwh

    # AE fraction per complete year
    ae_fracs = {yr: AE_ANNUAL[yr] / tx_annual[yr]
                for yr in AE_ANNUAL if yr in tx_annual}

    raw = {}
    for p_str, tx_mwh in sorted(tx_monthly.items()):
        yr = int(p_str[:4])
        mo = int(p_str[5:7])
        # Use exact-year fraction if available; else nearest prior complete year
        frac = ae_fracs.get(yr)
        if frac is None:
            prior = max((y for y in ae_fracs if y <= yr), default=None)
            if prior is None:
                continue
            frac = ae_fracs[prior]
        hours = calendar.monthrange(yr, mo)[1] * 24
        raw[p_str.replace("-", "_")] = float(tx_mwh) * frac / hours

    if not raw:
        return {}

    periods = sorted(raw.keys())
    df = pd.DataFrame({"mw": [raw[p] for p in periods]}, index=periods)
    df = df.rolling(12, min_periods=1).mean().shift(1)
    return {p: round(float(v), 1) for p, v in df["mw"].items() if pd.notna(v)}


def load_monthly_gen(ae_pct=None):
    """Aggregate Form 923 monthly generation by period×fuel → {period: {fuel: avg_mw}}.

    Returns (all_tx_dict, ae_dict).  ae_dict uses only the plants in ae_pct,
    scaling each plant's generation by its ownership/contract share.
    Both dicts use 12-month trailing averages.
    Returns ({}, {}) if CSVs are unavailable.
    """
    import calendar
    import pandas as pd

    plants_path = DOWNLOADS / "eia_tx_plants.csv"
    gen_path    = DOWNLOADS / "eia_tx_generation.csv"
    if not plants_path.exists() or not gen_path.exists():
        return {}, {}

    import datetime as _dt

    pdf = pd.read_csv(plants_path)
    pdf = pdf[pd.to_numeric(pdf["capacity_mw"], errors="coerce") >= MIN_PLANT_MW]
    pdf["fuel_norm"] = pdf["fuel"].apply(_norm_fuel)
    pdf = pdf[pdf["fuel_norm"] != "storage"]
    fuel_map = dict(zip(pdf["plantid"].astype(int), pdf["fuel_norm"]))

    gdf = pd.read_csv(gen_path)
    gdf["plantid"] = pd.to_numeric(gdf["plantid"], errors="coerce").astype("Int64")
    gdf = gdf.dropna(subset=["plantid"])
    gdf["fuel"] = gdf["plantid"].apply(lambda p: fuel_map.get(int(p)))
    gdf = gdf[gdf["fuel"].notna() & (gdf["generation_mwh"] > 0)].copy()

    # Per-plant fallback for recent months where 923 filings are incomplete.
    # Plants absent from a recent period get their avg_output_mw injected so the
    # rolling average isn't dragged down by missing filers.
    FALLBACK_CF = {
        "coal": 0.65, "oil": 0.30, "gas": 0.45, "biomass": 0.55,
        "hydro": 0.45, "nuclear": 0.92, "wind": 0.35, "solar": 0.20, "other": 0.35,
    }
    _c = _dt.date.today().replace(day=1)
    for _ in range(18):
        _c = (_c - _dt.timedelta(days=1)).replace(day=1)
    _cutoff_period = _c.strftime("%Y-%m")

    plant_info: dict[int, tuple] = {}
    for _, row in pdf.iterrows():
        pid  = int(row["plantid"])
        fuel = row["fuel_norm"]
        avg  = float(row["avg_output_mw"]) if pd.notna(row.get("avg_output_mw")) else 0.0
        cap  = float(row["capacity_mw"])   if pd.notna(row.get("capacity_mw"))   else 0.0
        comm = str(row["commission_period"])[:7] if pd.notna(row.get("commission_period")) else None
        ret  = (int(row["actual_retirement_year"]) if pd.notna(row.get("actual_retirement_year"))
                else (int(row["retirement_year"]) if pd.notna(row.get("retirement_year")) else None))
        plant_info[pid] = (fuel, avg, cap, comm, ret)

    recent_periods = sorted(gdf[gdf["period"] >= _cutoff_period]["period"].unique())
    extra_rows: list[dict] = []
    for period in recent_periods:
        y, mo = int(period[:4]), int(period[5:7])
        hours = calendar.monthrange(y, mo)[1] * 24
        filed = set(gdf[gdf["period"] == period]["plantid"].dropna().astype(int))
        for pid, (fuel, avg, cap, comm, ret) in plant_info.items():
            if pid in filed:
                continue
            if comm and comm > period:
                continue
            if ret and ret <= y:
                continue
            est = avg if avg > 0 else cap * FALLBACK_CF.get(fuel, 0.35)
            if est <= 0:
                continue
            extra_rows.append({"plantid": pid, "period": period,
                                "fuel": fuel, "generation_mwh": est * hours})
    if extra_rows:
        gdf = pd.concat([gdf, pd.DataFrame(extra_rows)], ignore_index=True)
        print(f"  Injected {len(extra_rows)} plant-period fallbacks across {len(recent_periods)} recent periods")

    def _build_monthly(frame):
        """Build {period: {fuel: avg_mw}} — raw monthly averages, no smoothing."""
        result = {}
        for (period, fuel), mwh in frame.groupby(["period", "fuel"])["generation_mwh"].sum().items():
            try:
                y, mo = int(str(period)[:4]), int(str(period)[5:7])
                hours = calendar.monthrange(y, mo)[1] * 24
            except Exception:
                continue
            result.setdefault(str(period).replace("-", "_"), {})[fuel] = round(float(mwh) / hours, 1)
        return result

    def _build_rolling(frame):
        """Build {period: {fuel: avg_mw}} with 12-month trailing average."""
        raw = _build_monthly(frame)
        if not raw:
            return {}
        periods_sorted = sorted(raw.keys())
        all_fuels      = sorted({f for row in raw.values() for f in row})
        df = pd.DataFrame(
            [[raw[p].get(f, 0.0) for f in all_fuels] for p in periods_sorted],
            index=periods_sorted, columns=all_fuels,
        ).rolling(12, min_periods=1).mean().shift(1)
        return {
            p: {f: round(float(df.loc[p, f]), 1) for f in all_fuels
                if pd.notna(df.loc[p, f]) and df.loc[p, f] > 0}
            for p in periods_sorted
        }

    all_result = _build_rolling(gdf)

    # AE-only: scale each plant's generation by its ownership/contract share
    ae_result     = {}
    ae_raw_result = {}
    if ae_pct:
        ae_ids = set(ae_pct.keys())
        ae_gdf = gdf[gdf["plantid"].apply(lambda p: int(p) in ae_ids)].copy()
        ae_gdf["generation_mwh"] = ae_gdf.apply(
            lambda r: r["generation_mwh"] * ae_pct.get(int(r["plantid"]), 1.0), axis=1
        )
        ae_result     = _build_rolling(ae_gdf)
        ae_raw_result = _build_monthly(ae_gdf)

    print(f"  Monthly gen: {len(all_result)} TX periods, {len(ae_result)} AE periods (12-mo rolling avg)")
    return all_result, ae_result, ae_raw_result


# AE ownership/contract share by EIA plant ID (0–1).
AE_PCT = {
    3548:  1.0, 7900:  1.0, 56374: 1.0, 55708: 1.0,  # owned/operated
    6179:  0.36, 6251:  0.16,                           # co-owned
    57699: 1.0, 59994: 0.98, 60436: 1.0, 60581: 1.0,  # solar PPAs
    61368: 0.98, 57659: 1.0, 63329: 0.96,
    56673: 1.0, 56823: 1.0, 57752: 1.0, 58021: 1.0,   # wind PPAs
    59320: 1.0, 59621: 1.0, 59321: 1.0, 61343: 0.67,
    62909: 1.0, 56661: 0.60,
}


def build_data_json(cached_keys=None):
    """Write no2_data.json to OUTPUT_DIR for consumption by the React site."""
    import datetime as _dt
    tx_gen, ae_gen, ae_gen_raw = load_monthly_gen(ae_pct=AE_PCT)
    ae_load = compute_ae_monthly_load()

    all_months_set = sorted(set(tx_gen) | set(ae_gen))
    def _label(key):  # "2018_06" → "Jun 2018"
        y, m = int(key[:4]), int(key[5:])
        return _dt.date(y, m, 1).strftime("%b %Y")

    data = {
        "months": all_months_set,
        "labels": [_label(k) for k in all_months_set],
        "monthly_gen": tx_gen,
        "ae_monthly_gen": ae_gen,
        "ae_monthly_gen_raw": ae_gen_raw,
        "ae_monthly_load": ae_load,
        "has_no2": sorted(cached_keys) if cached_keys else [],
        "ae_pct": {str(k): v for k, v in AE_PCT.items()},
    }
    out = OUTPUT_DIR / "no2_data.json"
    out.write_text(json.dumps(data))
    print(f"  no2_data.json: {len(all_months_set)} months -> {out}")


def build_map(all_data, area_plants, vmin, vmax, embed=False, out_filename="index.html"):
    if embed:
        _center, _zoom, _tiles = [31.0, -100.0], 6, "CartoDB positron"
    else:
        _center, _zoom, _tiles = [AUSTIN_LAT, AUSTIN_LON], 7, "CartoDB dark_matter"

    m = folium.Map(location=_center, zoom_start=_zoom, tiles=_tiles)

    if not embed:
        folium.Marker(
            [AUSTIN_LAT, AUSTIN_LON],
            icon=folium.Icon(color="blue", icon="home"),
            tooltip="Austin",
        ).add_to(m)

    # --- JavaScript: NO2 overlay + time slider + dynamic plant markers -------
    map_var   = m.get_name()

    # Slider covers 2001-01 to 2026-05 so plant history is fully visible.
    # NO2 overlay only activates for months with cached GEE data (2018+).
    full       = all_months(SLIDER_START, MONTHS_END)
    months_js  = json.dumps([month_key(y, m) for y, m in full])
    labels_js  = json.dumps([month_label(y, m) for y, m in full])
    last_idx   = len(full) - 1
    last_label = month_label(*full[-1])

    # Set of month keys that actually have NO2 data — overlay hidden for the rest
    cached_keys      = {month_key(d["year"], d["month"]) for d in all_data}
    has_no2_js       = json.dumps(list(cached_keys))
    plants_json      = json.dumps(area_plants or [])
    fuel_colors_json = json.dumps(FUEL_COLORS)
    ae_pct_js        = json.dumps(AE_PCT)
    _tx_gen, _ae_gen = load_monthly_gen(ae_pct=AE_PCT)

    _ae_load = compute_ae_monthly_load()
    if _ae_load:
        print(f"  AE monthly load: {len(_ae_load)} periods estimated")

    monthly_gen_js    = json.dumps(_tx_gen)
    ae_monthly_gen_js = json.dumps(_ae_gen)
    ae_monthly_load_js = json.dumps(_ae_load)

    def find_idx(y, mo):
        for i, (fy, fm) in enumerate(full):
            if fy == y and fm == mo:
                return i
        return last_idx

    # Start slider at the latest month that actually has NO2 data
    init_idx     = max(
        (i for i, (y, m) in enumerate(full) if month_key(y, m) in cached_keys),
        default=last_idx,
    )
    _chart_init_js   = "initCharts(); initTrendChart();" if not embed else ""
    _chart_panel_html = f"""
<!-- Capacity charts (bottom-right) -->
<div style="position:fixed;bottom:210px;right:20px;z-index:1000;
  background:#111827;border:1px solid #374151;border-radius:10px;
  padding:10px 12px;color:#f3f4f6;font-family:sans-serif;
  box-shadow:0 4px 12px rgba(0,0,0,0.6);width:390px">
  <div style="text-align:center;color:#9ca3af;font-size:10px;margin-bottom:6px">
    <span id="chart-scope">TX Installed Capacity</span> &mdash; <span id="chart-year" style="color:#f3f4f6;font-weight:bold"></span>
  </div>
  <div style="position:relative;width:100%;height:90px;margin-bottom:8px">
    <canvas id="trend-chart" style="width:100%;height:90px"></canvas>
  </div>
  <div style="display:flex;gap:8px;align-items:flex-start">
    <div>
      <div id="bar-unit" style="font-size:9px;color:#6b7280;text-align:center;margin-bottom:2px">Avg output (MW)</div>
      <canvas id="cap-bar" width="130" height="130"></canvas>
    </div>
    <div>
      <div style="font-size:9px;color:#6b7280;text-align:center;margin-bottom:2px">By fuel type</div>
      <canvas id="cap-pie" width="175" height="130"></canvas>
    </div>
  </div>
</div>
""" if not embed else ""

    _ctrl_html = f"""<!-- Time control bar at bottom -->
<div id="no2-ctrl" style="
  position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
  z-index:1000;background:#111827;border:1px solid #374151;
  border-radius:12px;padding:12px 20px;color:#f3f4f6;
  font-family:sans-serif;font-size:13px;text-align:center;
  box-shadow:0 4px 20px rgba(0,0,0,0.7);min-width:560px">
  <div id="no2-label" style="font-size:16px;font-weight:bold;margin-bottom:8px">
    {last_label}
  </div>
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
    <button onclick="_no2SetIdx(_no2GetCurrent()-1)"
      style="background:#374151;border:none;color:white;padding:4px 10px;
             border-radius:6px;cursor:pointer">&#9664;</button>
    <input id="no2-slider" type="range" min="0" max="{last_idx}" value="{init_idx}"
      style="flex:1;cursor:pointer" oninput="_no2SetIdx(parseInt(this.value))">
    <button onclick="_no2SetIdx(_no2GetCurrent()+1)"
      style="background:#374151;border:none;color:white;padding:4px 10px;
             border-radius:6px;cursor:pointer">&#9654;</button>
    <button id="play-btn" onclick="_no2TogglePlay()"
      style="background:#1d4ed8;border:none;color:white;padding:4px 14px;
             border-radius:6px;cursor:pointer;white-space:nowrap">&#9654; Play</button>
  </div>
  <div style="display:flex;align-items:center;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:6px;font-size:11px;color:#6b7280">
    <span>opacity</span>
    <input type="range" min="0" max="1" step="0.05" value="0.82"
      style="width:70px;cursor:pointer" oninput="_no2SetOpacity(this.value)">
    <span>circle&nbsp;min&nbsp;<span id="circ-min-val">1</span>px</span>
    <input type="range" min="1" max="12" step="0.5" value="1"
      style="width:60px;cursor:pointer" oninput="_circSetMin(this.value)">
    <span>max&nbsp;<span id="circ-max-val">12</span>px</span>
    <input type="range" min="2" max="20" step="0.5" value="12"
      style="width:60px;cursor:pointer" oninput="_circSetMax(this.value)">
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;font-size:11px;
              border-top:1px solid #374151;padding-top:6px">
    <span style="color:#9ca3af">Plants:</span>
    <label style="cursor:pointer"><input class="fuel-cb" type="checkbox" data-fuel="coal"    checked onchange="_updatePlants()"> <span style="color:#991b1b">&#9679;</span> Coal</label>
    <label style="cursor:pointer"><input class="fuel-cb" type="checkbox" data-fuel="gas"     checked onchange="_updatePlants()"> <span style="color:#d97706">&#9679;</span> Gas</label>
    <label style="cursor:pointer"><input class="fuel-cb" type="checkbox" data-fuel="nuclear" checked onchange="_updatePlants()"> <span style="color:#166534">&#9679;</span> Nuclear</label>
    <label style="cursor:pointer"><input class="fuel-cb" type="checkbox" data-fuel="wind"    checked onchange="_updatePlants()"> <span style="color:#16a34a">&#9679;</span> Wind</label>
    <label style="cursor:pointer"><input class="fuel-cb" type="checkbox" data-fuel="solar"   checked onchange="_updatePlants()"> <span style="color:#4ade80">&#9679;</span> Solar</label>
    <label style="cursor:pointer"><input class="fuel-cb" type="checkbox" data-fuel="oil"     checked onchange="_updatePlants()"> <span style="color:#dc2626">&#9679;</span> Oil</label>
    <label style="cursor:pointer"><input class="fuel-cb" type="checkbox" data-fuel="biomass" checked onchange="_updatePlants()"> <span style="color:#a16207">&#9679;</span> Biomass</label>
    <label style="cursor:pointer"><input class="fuel-cb" type="checkbox" data-fuel="storage" checked onchange="_updatePlants()"> <span style="color:#7c3aed">&#9679;</span> Storage</label>
    <label style="cursor:pointer"><input class="fuel-cb" type="checkbox" data-fuel="other"   checked onchange="_updatePlants()"> <span style="color:#6b7280">&#9679;</span> Other</label>
    <span style="color:#374151">|</span>
    <label style="cursor:pointer;color:#60a5fa"><input id="ae-cb" type="checkbox" onchange="_no2ToggleAE()"> Austin Energy</label>
    <span style="color:#374151">|</span>
    <label style="cursor:pointer;color:#9ca3af"><input type="checkbox" onchange="_toggleLabels(this.checked)"> Labels</label>
  </div>
</div>
""" if not embed else ""

    _legend_html = f"""<!-- Legend (bottom-left) -->
<div style="position:fixed;bottom:210px;left:20px;z-index:1000;
  background:#111827;border:1px solid #374151;border-radius:10px;
  padding:12px 16px;color:#f3f4f6;font-family:sans-serif;font-size:11px;
  box-shadow:0 4px 12px rgba(0,0,0,0.6);min-width:210px">
  <b style="font-size:12px">Tropospheric NO&#8322;</b>
  <div style="color:#9ca3af;margin-bottom:6px">
    Sentinel-5P TROPOMI &middot; monthly mean<br>
    ESA offline product &middot; log scale
  </div>
  <div style="width:130px;height:10px;border-radius:3px;margin:4px 0 2px;
    background:linear-gradient(to right,#0d47a1,#1976d2,#43a047,#fdd835,#f4511e,#b71c1c)">
  </div>
  <div style="display:flex;justify-content:space-between;width:130px;
              color:#9ca3af;margin-bottom:8px">
    <span>{vmin:.0f}</span><span>{vmax:.0f} &mu;mol/m&sup2;</span>
  </div>
  <hr style="border-color:#374151;margin:6px 0">
  <small style="color:#4b5563">EIA Form 860 &middot; size = capacity<br>
  Plants shown = commissioned by displayed year</small>
</div>
""" if not embed else ""

    custom_html = f"""
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
<script>
window.addEventListener('load', function() {{
  var months      = {months_js};
  var labels      = {labels_js};
  var HAS_NO2     = new Set({has_no2_js});
  var MONTHLY_GEN     = {monthly_gen_js};
  var AE_MONTHLY_GEN  = {ae_monthly_gen_js};
  var AE_MONTHLY_LOAD = {ae_monthly_load_js};
  var current     = {init_idx};
  var userOpacity = 0.82;
  var aeOnly  = false;
  // AE ownership share by EIA plant ID (0–1). Presence = AE plant;
  // value × EIA nameplate = AE's actual MW for chart scaling.
  var AE_PCT  = {ae_pct_js};
  var mapObj     = window["{map_var}"];

  // Fit the full Texas data extent with tight padding.
  // Disable zoomSnap first so fitBounds uses a fractional zoom instead of
  // rounding down to the nearest integer (which overshoots too zoomed-out).
  mapObj.options.zoomSnap = 0;
  mapObj.fitBounds([[{SOUTH}, {WEST}], [{NORTH}, {EAST}]], {{padding: [8, 8]}});
  mapObj.options.zoomSnap = 1;

  // Ctrl+scroll to zoom (same behavior as the Mapbox cooperativeGestures map)
  mapObj.scrollWheelZoom.disable();
  (function() {{
    var _overlay = document.createElement('div');
    _overlay.style.cssText = 'position:absolute;inset:0;z-index:2000;display:none;align-items:center;justify-content:center;pointer-events:none;';
    _overlay.innerHTML = '<div style="background:rgba(0,0,0,0.55);color:#fff;padding:8px 16px;border-radius:8px;font-family:sans-serif;font-size:13px">Use Ctrl + scroll to zoom</div>';
    mapObj.getContainer().style.position = 'relative';
    mapObj.getContainer().appendChild(_overlay);
    var _hideTimer = null;
    mapObj.getContainer().addEventListener('wheel', function(e) {{
      if (e.ctrlKey || e.metaKey) {{
        e.preventDefault();
        if (e.deltaY < 0) mapObj.zoomIn(); else mapObj.zoomOut();
      }} else {{
        _overlay.style.display = 'flex';
        clearTimeout(_hideTimer);
        _hideTimer = setTimeout(function() {{ _overlay.style.display = 'none'; }}, 1200);
      }}
    }}, {{ passive: false }});
  }})();

  // NO2 raster overlay — shown only when the current month has cached data
  var no2Layer = L.imageOverlay(
    'no2_' + months[current] + '.png',
    [[{SOUTH},{WEST}],[{NORTH},{EAST}]],
    {{opacity: 0, zIndex: 200}}
  );
  no2Layer.addTo(mapObj);

  // Plant markers — rebuilt dynamically so they reflect the current year
  var PLANT_DATA      = {plants_json};
  var FUEL_COLORS_MAP = {fuel_colors_json};
  var plantGroup      = L.layerGroup().addTo(mapObj);

  var showLabels = false;

  function updatePlants() {{
    var key  = months[current];
    var year = parseInt(key.slice(0, 4));
    plantGroup.clearLayers();
    var enabledFuels = {{}};
    document.querySelectorAll('.fuel-cb').forEach(function(cb) {{
      enabledFuels[cb.dataset.fuel] = cb.checked;
    }});

    // Collect active plants
    var activeList = [];
    PLANT_DATA.forEach(function(p) {{
      var active = (p.commission_month == null || p.commission_month <= key) &&
                   (p.retirement_year  == null || p.retirement_year  >  year);
      if (!active || enabledFuels[p.fuel] === false) return;
      if (aeOnly && AE_PCT[p.id] == null) return;
      activeList.push(p);
    }});

    // Distance-based grouping for fan-out (threshold ~2.5 km ≈ 0.022°)
    var THRESH    = 0.022;
    var SPREAD_PX = 2;  // pixel radius of fan-out circle (4px total diameter)
    var groupOf = new Array(activeList.length).fill(-1);
    var groups  = [];   // each entry is array of indices
    for (var i = 0; i < activeList.length; i++) {{
      if (groupOf[i] >= 0) continue;
      var grp = [i];
      groupOf[i] = groups.length;
      for (var j = i + 1; j < activeList.length; j++) {{
        if (groupOf[j] >= 0) continue;
        var dlat = activeList[i].lat - activeList[j].lat;
        var dlon = activeList[i].lon - activeList[j].lon;
        if (Math.sqrt(dlat*dlat + dlon*dlon) < THRESH) {{
          groupOf[j] = groups.length;
          grp.push(j);
        }}
      }}
      groups.push(grp);
    }}

    // Pass 1: compute MW scale from actual active-plant range
    var mwVals = activeList.map(function(p) {{
      return p.avg_output_mw != null ? p.avg_output_mw
             : (p.cap_mw ? p.cap_mw * (CF[p.fuel] || 0.35) : 0);
    }}).filter(function(v) {{ return v > 0; }});
    var mwMin   = mwVals.length ? Math.min.apply(null, mwVals) : 0;
    var mwRange = mwVals.length > 1 ? Math.max.apply(null, mwVals) - mwMin : 1;

    // Pass 2: render
    activeList.forEach(function(p, i) {{
      var grp = groups[groupOf[i]];
      var lat = p.lat, lon = p.lon;
      if (grp.length > 1) {{
        var pos   = grp.indexOf(i);
        var angle = (2 * Math.PI * pos) / grp.length;
        var pt    = mapObj.latLngToLayerPoint([p.lat, p.lon]);
        var off   = mapObj.layerPointToLatLng(
          L.point(pt.x + SPREAD_PX * Math.cos(angle), pt.y + SPREAD_PX * Math.sin(angle))
        );
        lat = off.lat; lon = off.lng;
      }}
      var effMw = p.avg_output_mw != null ? p.avg_output_mw
                  : (p.cap_mw ? p.cap_mw * (CF[p.fuel] || 0.35) : 0);
      var t = effMw > 0 ? Math.max(0, Math.min(1, (effMw - mwMin) / mwRange)) : 0;
      var r = circMin + Math.sqrt(t) * (circMax - circMin);
      var color = FUEL_COLORS_MAP[p.fuel] || '#6b7280';
      var dispMw = p.avg_output_mw != null ? p.avg_output_mw : p.cap_mw;
      var html  = '<b>' + p.name + '</b><br>Fuel: ' + p.fuel;
      if (p.cap_mw) html += '<br>Nameplate: ' + p.cap_mw.toFixed(0) + ' MW';
      if (p.avg_output_mw) html += '<br>Avg output: ' + p.avg_output_mw.toFixed(0) + ' MW';
      if (p.owner)  html += '<br>Owner: ' + p.owner;
      if (p.commission_year) html += '<br>Commissioned: ' + p.commission_year;
      if (p.co2_tons) html += '<br>Est CO₂: ' + p.co2_tons.toLocaleString() + ' t/yr';
      var tip = p.name + ' (' + p.fuel + (dispMw ? ', ' + dispMw.toFixed(0) + ' MW' : '') + ')';
      L.circleMarker([lat, lon], {{
        radius: r, fillColor: color, fillOpacity: 0.9, color: 'white', weight: 1
      }}).bindPopup(html).bindTooltip(tip).addTo(plantGroup);
      if (showLabels && dispMw) {{
        var lbl = '<div style="font-size:10px;font-weight:600;color:#f9fafb;' +
          'text-shadow:0 0 3px #000,0 0 3px #000;white-space:nowrap;pointer-events:none;' +
          'position:relative;top:-' + Math.round(r + 14) + 'px;text-align:center">' +
          Math.round(dispMw) + ' MW</div>';
        L.marker([lat, lon], {{
          icon: L.divIcon({{ html: lbl, className: '', iconSize: [0, 0], iconAnchor: [0, 0] }}),
          interactive: false, zIndexOffset: -500
        }}).addTo(plantGroup);
      }}
    }});
  }}

  // ── Capacity charts ────────────────────────────────────────────────────
  // FUEL_ORDER drives the charts — storage excluded (it is not generation)
  var FUEL_ORDER = ['coal','oil','gas','biomass','hydro','nuclear','wind','solar','other'];
  var GROUPS = [
    {{ key:'fossil', fuels:['coal','oil'],                            color:'#dc2626', label:'Fossil' }},
    {{ key:'gasbio', fuels:['gas','biomass'],                         color:'#d97706', label:'Gas/Bio' }},
    {{ key:'clean',  fuels:['nuclear','hydro','wind','solar','other'], color:'#16a34a', label:'Clean'  }}
  ];
  // Capacity factors: nameplate → average annual output
  var CF = {{
    coal:0.47, oil:0.15, gas:0.40, biomass:0.55,
    hydro:0.38, nuclear:0.93, wind:0.34, solar:0.25, other:0.35
  }};

  function computeCapByFuel() {{
    var key  = months[current];
    var year = parseInt(key.slice(0, 4));
    var enabled = {{}};
    document.querySelectorAll('.fuel-cb').forEach(function(cb) {{
      enabled[cb.dataset.fuel] = cb.checked;
    }});
    var out = {{}};
    FUEL_ORDER.forEach(function(f) {{ out[f] = 0; }});
    var genDict  = aeOnly ? AE_MONTHLY_GEN : MONTHLY_GEN;
    var monthRow = genDict[key];
    if (monthRow) {{
      FUEL_ORDER.forEach(function(f) {{
        if (enabled[f] !== false) out[f] = monthRow[f] || 0;
      }});
    }} else {{
      // Fallback for pre-2001 or data gap: nameplate × pct × CF
      PLANT_DATA.forEach(function(p) {{
        if (!p.cap_mw || enabled[p.fuel] === false) return;
        var pct = aeOnly ? AE_PCT[p.id] : 1.0;
        if (pct == null) return;
        var active = (p.commission_month == null || p.commission_month <= key) &&
                     (p.retirement_year  == null || p.retirement_year  >  year);
        if (active) out[p.fuel] = (out[p.fuel] || 0) + p.cap_mw * pct * (CF[p.fuel] || 0.35);
      }});
    }}
    return out;
  }}

  // Circle size parameters — adjustable via UI sliders
  var circMin = 1;   // px radius for smallest plant in view
  var circMax = 12;  // px radius for largest plant in view

  var barChart = null, pieChart = null, trendChart = null;

  function _aeLoadVal() {{
    var key = months[current];
    return (aeOnly && AE_MONTHLY_LOAD[key]) ? AE_MONTHLY_LOAD[key] : null;
  }}
  function _loadLineData() {{
    var v = _aeLoadVal();
    return GROUPS.map(function() {{ return v; }});
  }}

  function _trendSrc() {{ return aeOnly ? AE_MONTHLY_GEN : MONTHLY_GEN; }}

  function initTrendChart() {{
    if (typeof Chart === 'undefined') return;
    var src = _trendSrc();
    var datasets = FUEL_ORDER.map(function(f) {{
      var color = FUEL_COLORS_MAP[f] || '#6b7280';
      return {{
        label: f,
        data: months.map(function(m) {{ return (src[m] || {{}})[f] || 0; }}),
        backgroundColor: color + 'bb',
        borderColor: color,
        borderWidth: 0.5,
        fill: true,
        pointRadius: 0,
        tension: 0.2
      }};
    }});
    var ctx = document.getElementById('trend-chart').getContext('2d');
    trendChart = new Chart(ctx, {{
      type: 'line',
      data: {{ labels: months, datasets: datasets }},
      options: {{
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {{
          x: {{
            stacked: true,
            ticks: {{
              color: '#6b7280', font: {{ size: 9 }}, maxTicksLimit: 14,
              callback: function(val, idx) {{
                var m = months[idx];
                return (m && m.slice(5) === '01') ? m.slice(0, 4) : '';
              }}
            }},
            grid: {{ color: '#1f2937' }}
          }},
          y: {{
            stacked: true,
            ticks: {{ color: '#6b7280', font: {{ size: 9 }} }},
            grid: {{ color: '#1f2937' }}
          }}
        }},
        plugins: {{
          legend: {{ display: false }},
          tooltip: {{ mode: 'index', intersect: false,
            callbacks: {{ label: function(ctx) {{ return ctx.dataset.label + ': ' + Math.round(ctx.raw); }} }} }},
          annotation: {{
            annotations: {{
              cur: {{ type: 'line', xMin: current, xMax: current,
                      borderColor: '#f9fafb', borderWidth: 1.5, borderDash: [3,2] }}
            }}
          }}
        }}
      }}
    }});
  }}

  function updateTrendChart() {{
    if (!trendChart) return;
    trendChart.options.plugins.annotation.annotations.cur.xMin = current;
    trendChart.options.plugins.annotation.annotations.cur.xMax = current;
    trendChart.update('none');
  }}

  function rebuildTrendData() {{
    if (!trendChart) return;
    var src = _trendSrc();
    trendChart.data.datasets.forEach(function(ds, i) {{
      var f = FUEL_ORDER[i];
      ds.data = months.map(function(m) {{ return (src[m] || {{}})[f] || 0; }});
    }});
    updateTrendChart();
  }}

  function initCharts() {{
    if (typeof Chart === 'undefined') return;
    Chart.defaults.color = '#9ca3af';
    var byFuel = computeCapByFuel();

    barChart = new Chart(document.getElementById('cap-bar'), {{
      type: 'bar',
      data: {{
        labels: GROUPS.map(function(g) {{ return g.label; }}),
        datasets: FUEL_ORDER.map(function(f) {{
          var gIdx = -1;
          GROUPS.forEach(function(g, i) {{ if (g.fuels.indexOf(f) >= 0) gIdx = i; }});
          return {{
            label: f,
            data: GROUPS.map(function(g, i) {{ return i === gIdx ? Math.round(byFuel[f] || 0) : 0; }}),
            backgroundColor: FUEL_COLORS_MAP[f] || '#6b7280',
            borderWidth: 0,
            stack: 'gen'
          }};
        }}).concat([{{
          type: 'line',
          label: 'AE retail load',
          data: _loadLineData(),
          borderColor: '#f9fafb',
          borderWidth: 1.5,
          borderDash: [4, 3],
          pointRadius: 0,
          fill: false,
          stack: undefined,
          order: -1
        }}])
      }},
      options: {{
        responsive: false, animation: false,
        plugins: {{
          legend: {{ display: false }},
          tooltip: {{ callbacks: {{
            label: function(ctx) {{
              if (ctx.dataset.label === 'AE retail load') {{
                return ctx.parsed.y != null ? 'AE load: ' + Math.round(ctx.parsed.y) + ' MW' : null;
              }}
              if (!ctx.parsed.y) return null;
              return aeOnly
                ctx.dataset.label + ': ' + Math.round(ctx.parsed.y) + ' MW';
            }}
          }} }}
        }},
        scales: {{
          x: {{ stacked: true, ticks: {{ color:'#9ca3af', font:{{ size:9 }} }}, grid:{{ color:'#1f2937' }} }},
          y: {{ stacked: true, min: 0, max: 40000,
               ticks: {{ color:'#9ca3af', font:{{ size:9 }},
                callback: function(v) {{
                  return aeOnly ? Math.round(v) : (v/1000).toFixed(0)+'k';
                }}
              }}, grid:{{ color:'#1f2937' }} }}
        }}
      }}
    }});

    pieChart = new Chart(document.getElementById('cap-pie'), {{
      type: 'pie',
      data: {{
        labels: FUEL_ORDER,
        datasets: [{{
          data: FUEL_ORDER.map(function(f) {{ return Math.round(byFuel[f]); }}),
          backgroundColor: FUEL_ORDER.map(function(f) {{ return FUEL_COLORS_MAP[f] || '#6b7280'; }}),
          borderWidth: 1, borderColor: '#111827'
        }}]
      }},
      options: {{
        responsive: false, animation: false,
        plugins: {{
          legend: {{ display: true, position: 'right', labels: {{
            color: '#9ca3af', font: {{ size: 8 }}, boxWidth: 8, padding: 3,
            filter: function(item, data) {{
              return data.datasets[0].data[item.index] > 0;
            }}
          }} }},
          tooltip: {{ callbacks: {{ label: function(ctx) {{
            var tot = ctx.dataset.data.reduce(function(a, b) {{ return a + b; }}, 0);
            var pct = tot > 0 ? (ctx.parsed / tot * 100).toFixed(1) : '0';
            var val = Math.round(ctx.parsed) + ' MW';
            return ctx.label + ': ' + val + ' (' + pct + '%)';
          }} }} }}
        }}
      }}
    }});

    document.getElementById('chart-year').textContent = labels[current];
  }}

  function updateCharts() {{
    if (!barChart || !pieChart) return;
    var byFuel = computeCapByFuel();
    FUEL_ORDER.forEach(function(f, fi) {{
      var gIdx = -1;
      GROUPS.forEach(function(g, i) {{ if (g.fuels.indexOf(f) >= 0) gIdx = i; }});
      barChart.data.datasets[fi].data = GROUPS.map(function(g, i) {{
        return i === gIdx ? Math.round(byFuel[f] || 0) : 0;
      }});
    }});
    // last dataset is the load line
    barChart.data.datasets[FUEL_ORDER.length].data = _loadLineData();
    barChart.update('none');
    pieChart.data.datasets[0].data = FUEL_ORDER.map(function(f) {{ return Math.round(byFuel[f]); }});
    pieChart.update('none');
    document.getElementById('chart-year').textContent = labels[current];
    updateTrendChart();
  }}

  function setIdx(idx) {{
    if (idx < 0 || idx >= months.length) return;
    current = idx;
    var key = months[idx];
    if (HAS_NO2.has(key)) {{
      no2Layer.setUrl('no2_' + key + '.png');
      no2Layer.setOpacity(userOpacity);
    }} else {{
      no2Layer.setOpacity(0);
    }}
    var _lbl = document.getElementById('no2-label'); if (_lbl) _lbl.textContent = labels[idx];
    var _sld = document.getElementById('no2-slider'); if (_sld) _sld.value = idx;
    updatePlants();
    updateCharts();
  }}

  var timer = null;
  function togglePlay() {{
    if (timer) {{
      clearInterval(timer); timer = null;
      var _pb1 = document.getElementById('play-btn'); if (_pb1) _pb1.textContent = '▶ Play';
    }} else {{
      timer = setInterval(function() {{
        setIdx(current >= months.length - 1 ? 0 : current + 1);
      }}, 400);
      var _pb2 = document.getElementById('play-btn'); if (_pb2) _pb2.textContent = '⏸ Pause';
    }}
  }}

  window._no2SetIdx     = setIdx;
  window._no2TogglePlay = togglePlay;
  window._no2SetOpacity = function(v) {{
    userOpacity = parseFloat(v);
    if (HAS_NO2.has(months[current])) no2Layer.setOpacity(userOpacity);
  }};
  window._circSetMin = function(v) {{ circMin = parseFloat(v); var _cm1 = document.getElementById('circ-min-val'); if (_cm1) _cm1.textContent = v; updatePlants(); }};
  window._circSetMax = function(v) {{ circMax = parseFloat(v); var _cm2 = document.getElementById('circ-max-val'); if (_cm2) _cm2.textContent = v; updatePlants(); }};
  window._toggleLabels   = function(checked) {{ showLabels = checked; updatePlants(); }};
  window._no2GetCurrent = function() {{ return current; }};
  window._updatePlants  = function() {{ updatePlants(); updateCharts(); }};
  window._no2ToggleAE   = function(forceVal) {{
    var _cb = document.getElementById('ae-cb');
    aeOnly = (forceVal !== undefined) ? !!forceVal : (_cb ? _cb.checked : aeOnly);
    var _sc = document.getElementById('chart-scope');
    if (_sc) _sc.textContent = aeOnly ? 'AE Portfolio' : 'TX Installed Capacity';
    if (barChart) {{ barChart.options.scales.y.max = aeOnly ? 2500 : 40000; }}
    var _bu = document.getElementById('bar-unit');
    if (_bu) _bu.textContent = 'Avg output (MW)';
    updatePlants();
    updateCharts();
    rebuildTrendData();
  }};

  {_chart_init_js}
  setIdx(current);

  // postMessage bridge for React parent
  window.addEventListener('message', function(ev) {{
    if (!ev.data || !ev.data.type) return;
    if (ev.data.type === 'no2SetIdx') {{ setIdx(ev.data.idx); }}
    else if (ev.data.type === 'no2SetAE') {{ window._no2ToggleAE(ev.data.ae); }}
  }});
  if (window.parent !== window) {{
    window.parent.postMessage({{type: 'no2Ready', total: months.length}}, '*');
  }}
}});
</script>

{_ctrl_html}{_chart_panel_html}{_legend_html}
"""
    m.get_root().html.add_child(folium.Element(custom_html))

    out = OUTPUT_DIR / out_filename
    m.save(str(out))
    print(f"\n  Saved -> {out}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=== Sentinel-5P NO2 Monthly Map ===")
    print(f"  Months: {month_label(*MONTHS_START)} - {month_label(*MONTHS_END)}"
          f" ({len(all_months())} total)\n")

    print("Fetching GEE data...")
    all_data, lats, lons = fetch_all_months()

    if not all_data:
        raise SystemExit("No monthly data available — check GEE auth and network")

    lats_u, lons_u, lat_idx, lon_idx = build_grid_index(lats, lons)

    tx_rings   = fetch_texas_border()
    osm_plants = fetch_area_plants()
    eia_plants = load_eia_plants_timeline()

    print("\nRendering PNGs...")
    vmin, vmax = render_all_pngs(all_data, lats_u, lons_u, lat_idx, lon_idx, tx_rings)

    print("\nBuilding map...")
    build_map(all_data, eia_plants if eia_plants is not None else osm_plants, vmin, vmax)

    cached_count = len(list(CACHE_DIR.glob("no2_*.json")))
    print(f"\nDone.")
    print(f"  Open:  {OUTPUT_DIR / 'index.html'}")
    print(f"  Cache: {CACHE_DIR}  ({cached_count} months stored as JSON)")
    print(f"\nTo load monthly data for averaging:")
    print(f"  import json; from pathlib import Path")
    print(f"  data = [json.loads(f.read_text())")
    print(f"          for f in sorted(Path(r'{CACHE_DIR}').glob('no2_*.json'))]")
