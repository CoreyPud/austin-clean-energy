# Builds the NO2 map from whatever months are already cached locally.
# Safe to run while the GEE background fetch is still in progress — reads
# only from CACHE_DIR, does not touch the GEE API.
#
# Also outputs:
#   embed.html        — chart-free version for iframe embedding in the React site
#   no2_data.json     — generation data for the React Recharts component
#   public/no2_map/   — copy of embed.html + PNGs for Vite dev server
#   public/no2_data.json
#
# Usage: python scripts/build_map_now.py

import json
import shutil
import sys
from pathlib import Path

import numpy as np

# Allow importing from the same scripts/ directory
sys.path.insert(0, str(Path(__file__).parent))

from sentinel_no2_map import (
    CACHE_DIR, OUTPUT_DIR,
    SOUTH, NORTH, WEST, EAST, LAT_STEP, LON_STEP,
    build_grid_index, fetch_texas_border,
    load_eia_plants_timeline, fetch_area_plants,
    render_all_pngs, build_map, build_data_json, month_label, month_key,
)

# Project root (one level above scripts/)
PROJECT_ROOT = Path(__file__).parent.parent
PUBLIC_NO2   = PROJECT_ROOT / "public" / "no2_map"

print("=== NO2 Map Builder (cache-only) ===")

all_data = []
for f in sorted(CACHE_DIR.glob("no2_*.json")):
    try:
        data = json.loads(f.read_text())
        if data.get("points"):
            all_data.append(data)
    except Exception:
        pass

if not all_data:
    raise SystemExit(
        "No cached months found in %s.\n"
        "Run sentinel_no2_map.py first to pull data from GEE." % CACHE_DIR
    )

first = month_label(all_data[0]["year"],  all_data[0]["month"])
last  = month_label(all_data[-1]["year"], all_data[-1]["month"])
print(f"  {len(all_data)} months cached  ({first} – {last})")

lats = list(np.arange(SOUTH + LAT_STEP / 2, NORTH, LAT_STEP))
lons = list(np.arange(WEST  + LON_STEP / 2, EAST,  LON_STEP))
lats_u, lons_u, lat_idx, lon_idx = build_grid_index(lats, lons)

tx_rings   = fetch_texas_border()
eia_plants = load_eia_plants_timeline()
osm_plants = fetch_area_plants()
plants     = eia_plants if eia_plants is not None else osm_plants

print("\nRendering PNGs...")
vmin, vmax = render_all_pngs(all_data, lats_u, lons_u, lat_idx, lon_idx, tx_rings)

print("\nBuilding map...")
build_map(all_data, plants, vmin, vmax)

print("\nBuilding embed (chart-free for iframe)...")
build_map(all_data, plants, vmin, vmax, embed=True, out_filename="embed.html")

print("\nBuilding data JSON for React...")
cached_keys = {month_key(d["year"], d["month"]) for d in all_data}
build_data_json(cached_keys=cached_keys)

print("\nWriting no2_plants.json for React map...")
plants_out = PROJECT_ROOT / "public" / "no2_plants.json"
plants_out.write_text(json.dumps(plants or []))
print(f"  -> {plants_out}  ({len(plants or [])} plants)")

print("\nCopying assets to public/no2_map/ ...")
PUBLIC_NO2.mkdir(parents=True, exist_ok=True)
shutil.copy(OUTPUT_DIR / "embed.html", PUBLIC_NO2 / "index.html")
for png in OUTPUT_DIR.glob("no2_*.png"):
    shutil.copy(png, PUBLIC_NO2 / png.name)
shutil.copy(OUTPUT_DIR / "no2_data.json", PROJECT_ROOT / "public" / "no2_data.json")
print(f"  -> {PUBLIC_NO2}/index.html  ({len(list(OUTPUT_DIR.glob('no2_*.png')))} PNGs)")

print(f"\nDone — open in browser:")
print(f"  {OUTPUT_DIR / 'index.html'}")
if len(all_data) < 97:
    print(f"\n  ({len(all_data)}/97 months so far — re-run once the GEE fetch completes)")
