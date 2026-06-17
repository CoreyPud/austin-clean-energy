"""
Generates public/no2_plant_gen.json — per-plant monthly MW output.

Format: { "plantid": [mw_or_null, ...] }  — one value per month, indexed
to match the `months` array in no2_data.json.  null means no 923 filing
that month; the React map falls back to avg_output_mw in that case.
"""
import json, calendar, pathlib
import pandas as pd

ROOT = pathlib.Path(__file__).parent.parent
OUT  = ROOT / "public" / "no2_plant_gen.json"

# Load months list from existing no2_data.json so indices align exactly
no2 = json.load(open(ROOT / "public" / "no2_data.json"))
months = no2["months"]  # ["2001_01", "2001_02", ...]
month_idx = {m: i for i, m in enumerate(months)}
n_months = len(months)

# Load EIA 923 generation data
gen = pd.read_csv(r"C:\Users\altbi\Downloads\eia_tx_generation.csv", low_memory=False)
gen["ym"] = gen["period"].str[:7].str.replace("-", "_")

# Sum across fuels per plant per month, convert MWh → avg MW
def hours(ym):
    y, m = int(ym[:4]), int(ym[5:7])
    return calendar.monthrange(y, m)[1] * 24

pm = (
    gen.groupby(["plantid", "ym"])["generation_mwh"]
    .sum()
    .reset_index()
)
pm = pm[pm["generation_mwh"] > 0]
pm["mw"] = pm.apply(lambda r: round(r["generation_mwh"] / hours(r["ym"]), 1), axis=1)

# Build {plantid_str: sparse dict} then convert to array
sparse: dict[str, dict[int, float]] = {}
for _, row in pm.iterrows():
    ym = row["ym"]
    if ym not in month_idx:
        continue
    pid = str(int(row["plantid"]))
    idx = month_idx[ym]
    sparse.setdefault(pid, {})[idx] = row["mw"]

# Convert to arrays (null where missing)
plant_gen: dict[str, list] = {}
for pid, vals in sparse.items():
    arr = [vals.get(i) for i in range(n_months)]
    plant_gen[pid] = arr

OUT.write_text(json.dumps(plant_gen, separators=(",", ":")))

import os
size_kb = os.path.getsize(OUT) / 1024
print(f"Wrote {OUT}  ({size_kb:.0f} KB,  {len(plant_gen)} plants × {n_months} months)")
