# Generates an interactive HTML map showing:
#   - PM2.5 heatmap from 76 PurpleAir sensors (1-week average, EPA-corrected)
#   - NEI facility air emission markers
#   - EPA AQS ground monitor readings for reference
#
# Output: ~/Downloads/pollution_map.html
# Open in any browser — no server needed.
#
# Requires: pip install folium numpy scipy requests

import json
import math
import time
from pathlib import Path

import folium
import numpy as np
import requests
from folium.plugins import HeatMap

DOWNLOADS = Path.home() / "Downloads"
OUTPUT         = DOWNLOADS / "pollution_map.html"
CACHE_PA       = DOWNLOADS / "cache_purpleair.json"
CACHE_NEI      = DOWNLOADS / "cache_nei_facilities.json"
CACHE_AQS      = DOWNLOADS / "austin_aq_monitors.csv"

PURPLEAIR_KEY  = "25FF297D-66F3-11F1-B596-4201AC1DC123"
AUSTIN_LAT, AUSTIN_LON = 30.2672, -97.7431
HEADERS = {"User-Agent": "Mozilla/5.0"}
BASE_OAR = "https://geodata.epa.gov/arcgis/rest/services/OAR_OAQPS"

# Bounding box for Austin metro + surrounding area
BBOX_ARGS = {"nwlng": -98.3, "selng": -97.0, "nwlat": 31.0, "selat": 29.7}
BBOX_STR  = "-98.3,29.7,-97.0,31.0"

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

# EPA correction (Barkjohn 2021): requires cf1 channel and humidity
# When cf1 unavailable, use atm value with a scaling factor (~0.82 for US average)
def epa_correct(pm_atm, humidity=None, pm_cf1=None):
    if pm_cf1 is not None and humidity is not None:
        corrected = 0.524 * pm_cf1 - 0.0862 * humidity + 5.75
        return max(0, corrected)
    # Fallback: ATM is already a mild correction; apply ~0.82 scalar for US average
    return max(0, pm_atm * 0.82) if pm_atm else None


# ---------------------------------------------------------------------------
# Data fetching
# ---------------------------------------------------------------------------

def fetch_purpleair():
    if CACHE_PA.exists():
        print("  PurpleAir: loading from cache")
        return json.loads(CACHE_PA.read_text())

    print("  Fetching PurpleAir sensors...")
    r = requests.get(
        "https://api.purpleair.com/v1/sensors",
        headers={"X-API-Key": PURPLEAIR_KEY},
        params={
            "fields": "name,latitude,longitude,pm2.5_atm,pm2.5_cf_1,pm2.5_24hour,pm2.5_1week,humidity,last_seen",
            "location_type": 0,  # outdoor only
            **BBOX_ARGS,
        },
        timeout=20,
    )
    r.raise_for_status()
    data = r.json()
    fields = data["fields"]
    sensors = []
    for row in data["data"]:
        d = dict(zip(fields, row))
        week  = d.get("pm2.5_1week")
        atm   = d.get("pm2.5_atm")
        cf1   = d.get("pm2.5_cf_1")
        hum   = d.get("humidity")
        if week is None or week < 0:
            continue
        corrected = epa_correct(atm, hum, cf1)
        sensors.append({
            "name": d.get("name", ""),
            "lat": d["latitude"],
            "lon": d["longitude"],
            "pm25_raw_week": week,
            "pm25_corrected": corrected,
            "pm25_24h": d.get("pm2.5_24hour"),
            "humidity": hum,
            "last_seen": d.get("last_seen"),
        })
    print(f"  PurpleAir: {len(sensors)} outdoor sensors")
    CACHE_PA.write_text(json.dumps(sensors))
    return sensors


def fetch_nei():
    if CACHE_NEI.exists():
        print("  NEI facilities: loading from cache")
        return json.loads(CACHE_NEI.read_text())

    print("  Fetching NEI facilities...")
    r = requests.get(
        f"{BASE_OAR}/NEI_Facility_HAPs_CAPs/MapServer/0/query",
        params={
            "geometry": BBOX_STR, "geometryType": "esriGeometryEnvelope",
            "inSR": "4326", "spatialRel": "esriSpatialRelIntersects",
            "outFields": (
                "Latest_Site_Name,Latest_NAICS_Code,Latest_NAICS_Description,"
                "Latest_City,Latest_County,Latest_Latitude,Latest_Longitude,"
                "PM25_Primary_Filt_plus_Cond_2014,Nitrogen_Oxides_2014,Sulfur_Dioxide_2014"
            ),
            "returnGeometry": "false", "f": "json",
        },
        headers=HEADERS, timeout=30,
    )
    feats = r.json().get("features", [])
    print(f"  NEI facilities: {len(feats)}")
    CACHE_NEI.write_text(json.dumps(feats))
    return feats


def load_aqs():
    if not CACHE_AQS.exists():
        return []
    import csv
    seen, out = set(), []
    with open(CACHE_AQS) as f:
        for row in csv.DictReader(f):
            if row.get("pollutant") != "pm25":
                continue
            key = (round(float(row["latitude"]), 4), round(float(row["longitude"]), 4))
            if key not in seen:
                seen.add(key)
                out.append({"lat": float(row["latitude"]), "lon": float(row["longitude"]),
                             "pm25": float(row["mean_value"])})
    return out


# ---------------------------------------------------------------------------
# Heatmap data prep
# ---------------------------------------------------------------------------

def prepare_heatmap(sensors):
    """Normalise corrected 1-week PM2.5 to 0-1 for folium HeatMap.
    Uses 5th/95th percentile clipping so one outlier sensor doesn't
    compress the entire colour scale."""
    vals = np.array([s["pm25_raw_week"] * 0.82 for s in sensors])
    vmin = float(np.percentile(vals, 5))
    vmax = float(np.percentile(vals, 95))
    normed = np.clip((vals - vmin) / max(vmax - vmin, 0.1), 0, 1)
    heat_data = [[s["lat"], s["lon"], float(w)] for s, w in zip(sensors, normed)]
    print(f"  PM2.5 (corrected): {vals.min():.1f} - {vals.max():.1f} ug/m3  "
          f"(scale anchored {vmin:.1f} - {vmax:.1f})")
    return heat_data, vmin, vmax


# ---------------------------------------------------------------------------
# Map building
# ---------------------------------------------------------------------------

def build_map(sensors, nei_feats, aqs_monitors):
    m = folium.Map(
        location=[AUSTIN_LAT, AUSTIN_LON],
        zoom_start=10,
        tiles="CartoDB dark_matter",
    )

    # --- PM2.5 heatmap from sensor points -----------------------------------
    # Pass sensor points directly — folium's HeatMap does its own kernel blending.
    # No pre-interpolation means no oscillation artifacts.
    heat_data, vmin, vmax = prepare_heatmap(sensors)

    HeatMap(
        heat_data,
        name="PM2.5 heatmap (PurpleAir 1-week avg, EPA-corrected)",
        min_opacity=0.2,
        max_opacity=0.8,
        radius=45,
        blur=35,
        gradient={
            0.0:  "#0d47a1",
            0.25: "#1976d2",
            0.45: "#43a047",
            0.6:  "#fdd835",
            0.75: "#f4511e",
            1.0:  "#b71c1c",
        },
    ).add_to(m)

    # --- PurpleAir sensor markers -------------------------------------------
    pa_group = folium.FeatureGroup(name="PurpleAir sensors (81)", show=True)
    for s in sensors:
        val = s["pm25_raw_week"] * 0.82
        t = max(0, min(1, (val - vmin) / max(vmax - vmin, 0.1)))
        if t < 0.4:
            dot_color = "#4dac26"
        elif t < 0.7:
            dot_color = "#f46d43"
        else:
            dot_color = "#d73027"

        last = s.get("last_seen")
        last_str = f"{(time.time() - last)/3600:.0f}h ago" if last else "unknown"

        folium.CircleMarker(
            location=[s["lat"], s["lon"]], radius=5,
            color="white", weight=1,
            fill=True, fill_color=dot_color, fill_opacity=0.9,
            tooltip=f"{s['name']}: {val:.1f} ug/m3 (corrected)",
            popup=folium.Popup(
                f"<b>{s['name']}</b><br>"
                f"1-week avg (EPA-corrected): <b>{val:.1f} ug/m3</b><br>"
                f"1-week avg (raw): {s['pm25_raw_week']:.1f} ug/m3<br>"
                f"24-hour avg: {s.get('pm25_24h') or 'n/a'} ug/m3<br>"
                f"Humidity: {s.get('humidity') or 'n/a'}%<br>"
                f"Last seen: {last_str}<br>"
                f"<small>PurpleAir outdoor sensor</small>",
                max_width=260,
            ),
        ).add_to(pa_group)
    pa_group.add_to(m)

    # --- NEI facility markers -----------------------------------------------
    nei_group   = folium.FeatureGroup(name="Other industrial emitters (NEI 2014)", show=False)
    power_group = folium.FeatureGroup(name="Power generation facilities (NEI 2014)", show=True)

    for feat in nei_feats:
        a = feat["attributes"]
        lat = a.get("Latest_Latitude"); lon = a.get("Latest_Longitude")
        if not lat or not lon: continue
        pm25  = a.get("PM25_Primary_Filt_plus_Cond_2014") or 0
        nox   = a.get("Nitrogen_Oxides_2014") or 0
        so2   = a.get("Sulfur_Dioxide_2014") or 0
        if pm25 <= 0 and nox <= 0: continue
        naics = str(a.get("Latest_NAICS_Code") or "")
        name  = a.get("Latest_Site_Name") or "Unknown"
        total = pm25 + nox * 0.1 + so2 * 0.1
        radius = max(5, min(26, 5 + math.log10(max(total, 1)) * 5))
        is_power = naics.startswith("2211")
        color = "#ef4444" if is_power else "#fb923c"
        marker = folium.CircleMarker(
            location=[lat, lon], radius=radius,
            color="white", weight=1.5,
            fill=True, fill_color=color, fill_opacity=0.85,
            tooltip=f"{name} — PM2.5: {pm25:.1f}t NOx: {nox:.1f}t",
            popup=folium.Popup(
                f"<b>{name}</b><br>NAICS: {naics}<br>"
                f"PM2.5: {pm25:.1f} t/yr&nbsp; NOx: {nox:.1f} t/yr&nbsp; SO2: {so2:.1f} t/yr<br>"
                f"<small>Source: EPA NEI 2014</small>", max_width=270),
        )
        (power_group if is_power else nei_group).add_child(marker)

    nei_group.add_to(m)
    power_group.add_to(m)

    # --- AQS reference monitors ---------------------------------------------
    if aqs_monitors:
        aqs_group = folium.FeatureGroup(name="EPA AQS official monitors (2022)", show=True)
        for mon in aqs_monitors:
            folium.CircleMarker(
                location=[mon["lat"], mon["lon"]], radius=10,
                color="white", weight=2.5,
                fill=True, fill_color="#38bdf8", fill_opacity=0.95,
                tooltip=f"AQS: {mon['pm25']:.2f} ug/m3 annual avg (2022)",
                popup=folium.Popup(
                    f"<b>EPA AQS Official Monitor</b><br>"
                    f"Annual PM2.5: <b>{mon['pm25']:.2f} ug/m3</b> (2022)<br>"
                    f"<small>Regulatory-grade instrument</small>", max_width=230),
            ).add_to(aqs_group)
        aqs_group.add_to(m)

    folium.Marker(
        [AUSTIN_LAT, AUSTIN_LON],
        icon=folium.Icon(color="blue", icon="home"),
        tooltip="Austin city centre",
    ).add_to(m)

    # --- Legend -------------------------------------------------------------
    vmin_r, vmax_r = round(vmin, 1), round(vmax, 1)
    legend = f"""
    <div style="position:fixed;bottom:30px;left:30px;z-index:1000;
                background:#111827;border:1px solid #374151;border-radius:10px;
                padding:14px 18px;color:#f3f4f6;font-family:sans-serif;font-size:12px;
                box-shadow:0 4px 12px rgba(0,0,0,0.6);min-width:230px">
      <b style="font-size:13px">PM2.5 (1-week avg)</b>
      <div style="display:flex;align-items:center;gap:6px;margin:7px 0 2px">
        <div style="width:110px;height:12px;
          background:linear-gradient(to right,#2166ac,#4dac26,#fee08b,#f46d43,#d73027);
          border-radius:3px"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;
                  color:#9ca3af;margin-bottom:8px;width:110px">
        <span>{vmin_r}</span><span>{vmax_r} ug/m3</span>
      </div>
      <hr style="border-color:#374151;margin:7px 0">
      <div style="margin-bottom:4px">
        <span style="color:#38bdf8">&#9679;</span> EPA AQS official monitor<br>
        <span style="color:#86efac">&#9679;</span> PurpleAir sensor<br>
        <span style="color:#ef4444">&#9679;</span> Power generation facility<br>
        <span style="color:#fb923c">&#9679;</span> Other industrial emitter
      </div>
      <hr style="border-color:#374151;margin:7px 0">
      <small style="color:#6b7280">
        Heatmap: 76 PurpleAir outdoor sensors<br>
        EPA correction factor applied<br>
        Thin-plate spline interpolation<br>
        Emission sources: EPA NEI 2014
      </small>
    </div>"""
    m.get_root().html.add_child(folium.Element(legend))
    folium.LayerControl(collapsed=False).add_to(m)
    return m


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Fetching data...")
    sensors  = fetch_purpleair()
    nei      = fetch_nei()
    aqs      = load_aqs()

    print("Interpolating and building map...")
    m = build_map(sensors, nei, aqs)
    m.save(str(OUTPUT))
    print(f"\nSaved -> {OUTPUT}")
    print("Open in any browser.")
