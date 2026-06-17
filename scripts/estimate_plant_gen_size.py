import json, os, pandas as pd

path = r'C:\Users\altbi\Documents\GitHub\austin-clean-energy\public\no2_data.json'
size_kb = os.path.getsize(path) / 1024
print(f"Current no2_data.json: {size_kb:.1f} KB")

gen = pd.read_csv(r'C:\Users\altbi\Downloads\eia_tx_generation.csv', low_memory=False)
gen['ym'] = gen['period'].str[:7].str.replace('-', '_')

# aggregate to plant+month level (sum across fuels)
pm = gen.groupby(['plantid', 'ym'])['generation_mwh'].sum()
pm = pm[pm > 0]
print(f"Non-zero plant-month pairs in 923: {len(pm):,}")
print(f"Distinct plants: {gen['plantid'].nunique()}")
print(f"Distinct months: {gen['ym'].nunique()}")

# Compact nested format {plantid_str: {ym: mwh}}
# avg entry: "6179": {"2024_01": 123456.7, ...}
# key overhead ~6 bytes per plant, value ~18 bytes per month pair
n_plants = gen['plantid'].nunique()
n_pm = len(pm)
est_raw = n_pm * 26  # "\"2024_01\":123456," approx 18 chars + plantid key amortised
print(f"Estimated raw JSON size: {est_raw/1024:.0f} KB")
print(f"Estimated gzipped (~80% reduction): {est_raw/1024*0.20:.0f} KB")

# Even tighter: store as array indexed by month position (no month keys)
d = json.load(open(path))
n_months = len(d['months'])
est_array = n_plants * (n_months * 5 + 10)  # avg 5 bytes/null or number + overhead
print(f"\nAlternative array-per-plant ({n_months} months):")
print(f"  Raw: {est_array/1024:.0f} KB  |  Gzipped: {est_array/1024*0.20:.0f} KB")
