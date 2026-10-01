"""Extract NREL ATB workbook Summary_* sheets into public/data/atb.json.
To add technologies: they are picked up automatically from the workbook. To limit
or rename, edit TECH_INCLUDE / TECH_LABELS below. Usage: python3 scripts/atb_extract.py <workbook.xlsx>"""
import json, sys, openpyxl
METRICS = {  # sheet -> (key, label, unit)
  "Summary_LCOE": ("lcoe", "Levelized cost of energy", "$/MWh"),
  "Summary_CAPEX": ("capex", "Capital cost (CAPEX)", "$/kW"),
  "Summary_FOM": ("fom", "Fixed O&M", "$/kW-yr"),
  "Summary_VOM": ("vom", "Variable O&M", "$/MWh"),
  "Summary_CF": ("cf", "Capacity factor", "fraction"),
  "Summary_Fuel": ("fuel", "Fuel cost", "$/MWh"),
}
TECH_INCLUDE = None  # e.g. {"UtilityPV", "LandbasedWind"}; None = everything in the workbook
TECH_LABELS = {}     # optional overrides: {"UtilityPV": "Utility solar"}
wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
years, rows = None, []
for sheet, (key, label, unit) in METRICS.items():
    if sheet not in wb.sheetnames: continue
    it = wb[sheet].iter_rows(values_only=True)
    hdr = next(it); yi = [i for i, h in enumerate(hdr) if isinstance(h, int)]
    years = years or [hdr[i] for i in yi]
    for r in it:
        if not r or not r[4]: continue
        if TECH_INCLUDE and r[4] not in TECH_INCLUDE: continue
        v = [round(r[i], 4 if key == "cf" else 2) if isinstance(r[i], (int, float)) else None for i in yi]
        if all(x is None for x in v): continue
        rows.append({"m": key, "f": r[1], "c": r[2], "y": r[3], "t": r[4], "d": r[5], "n": r[6], "v": v})
out = {"source": "NREL Annual Technology Baseline 2024 v3 workbook", "url": "https://atb.nrel.gov/electricity/2024/data",
       "years": years, "metrics": {k: {"label": l, "unit": u} for k, l, u in METRICS.values()},
       "techLabels": TECH_LABELS, "rows": rows}
json.dump(out, open("public/data/atb.json", "w"), separators=(",", ":"))
print(len(rows), "rows", years[0], years[-1])
