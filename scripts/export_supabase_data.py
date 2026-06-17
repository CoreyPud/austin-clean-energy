"""
Exports power_plants.csv and plant_monthly_gen.csv for Supabase import.
Also uploads no2_map PNGs to Supabase Storage bucket 'no2-maps'.
"""
import json, pathlib, pandas as pd

ROOT   = pathlib.Path(__file__).parent.parent
PUBLIC = ROOT / "public"
OUT    = ROOT / "scripts" / "supabase_export"
OUT.mkdir(exist_ok=True)

# ── power_plants.csv ──────────────────────────────────────────────────────────
plants = json.load(open(PUBLIC / "no2_plants.json"))
data   = json.load(open(PUBLIC / "no2_data.json"))
ae_pct = data["ae_pct"]

rows = []
for p in plants:
    rows.append({
        "plantid":           p["id"],
        "plant_name":        p["name"],
        "fuel":              p["fuel"],
        "capacity_mw":       p.get("cap_mw"),
        "latitude":          p["lat"],
        "longitude":         p["lon"],
        "county":            p.get("county"),
        "owner":             p.get("owner"),
        "commission_period": p.get("commission_month"),
        "retirement_year":   p.get("retirement_year"),
        "avg_output_mw":     p.get("avg_output_mw"),
        "co2_tons":          p.get("co2_tons"),
        "ae_pct":            ae_pct.get(str(p["id"])),
    })

pp = pd.DataFrame(rows)
pp.to_csv(OUT / "power_plants.csv", index=False)
print(f"power_plants.csv: {len(pp)} rows")

ae_ids = set(ae_pct.keys())
ae_pp  = pp[pp["plantid"].astype(str).isin(ae_ids)]
ae_pp.to_csv(OUT / "ae_power_plants.csv", index=False)
print(f"ae_power_plants.csv: {len(ae_pp)} rows")

# ── plant_monthly_gen.csv ─────────────────────────────────────────────────────
plant_gen = json.load(open(PUBLIC / "no2_plant_gen.json"))
months    = data["months"]

gen_rows    = []
ae_gen_rows = []
for pid_str, arr in plant_gen.items():
    is_ae = pid_str in ae_ids
    for i, mw in enumerate(arr):
        if mw is not None:
            row = {"plantid": int(pid_str), "period": months[i], "avg_mw": mw}
            gen_rows.append(row)
            if is_ae:
                ae_gen_rows.append(row)

pmg = pd.DataFrame(gen_rows)
pmg.to_csv(OUT / "plant_monthly_gen.csv", index=False)
print(f"plant_monthly_gen.csv: {len(pmg)} rows")

ae_pmg = pd.DataFrame(ae_gen_rows)
ae_pmg.to_csv(OUT / "ae_plant_monthly_gen.csv", index=False)
print(f"ae_plant_monthly_gen.csv: {len(ae_pmg)} rows")

print(f"\nFiles written to {OUT}")
print("Upload PNGs from public/no2_map/*.png to Supabase Storage bucket 'no2-maps'")
