import sys, json, pandas as pd, calendar
sys.path.insert(0, r'C:\Users\altbi\Documents\GitHub\austin-clean-energy\scripts')

gen = pd.read_csv(r'C:\Users\altbi\Downloads\eia_tx_generation.csv', low_memory=False)
plants = pd.read_csv(r'C:\Users\altbi\Downloads\eia_tx_plants.csv', low_memory=False)

data = json.load(open(r'C:\Users\altbi\Documents\GitHub\austin-clean-energy\public\no2_data.json'))
ae_plant_ids = set(int(k) for k in data['ae_pct'])
print(f"AE plant IDs ({len(ae_plant_ids)}): {sorted(ae_plant_ids)}")

gen['ym'] = gen['period'].str[:7]
ae_gen = gen[gen['plantid'].isin(ae_plant_ids)].copy()

print(f"\nAE plant reporting by period (2023-2026):")
print(f"{'Period':<10} | {'Plants filing':>13} | {'Total MWh':>12} | {'Avg MW':>8}")
print("-" * 55)
for ym in sorted(ae_gen['ym'].unique()):
    if ym < '2023-01': continue
    sub = ae_gen[ae_gen['ym'] == ym]
    y, m = int(ym[:4]), int(ym[5:7])
    hrs = calendar.monthrange(y, m)[1] * 24
    mwh = sub['generation_mwh'].sum()
    n = sub['plantid'].nunique()
    print(f"{ym:<10} | {n:>13} | {mwh:>12,.0f} | {mwh/hrs:>8.1f}")

print("\nAE plants details (avg_output_mw):")
ae_plants = plants[plants['plantid'].isin(ae_plant_ids)][['plantid','plant_name','fuel','capacity_mw','avg_output_mw']].copy()
print(ae_plants.to_string(index=False))

# Check which AE plants are absent in 2025
print("\nAE plants absent from 2025 filings:")
filing_2025 = set(ae_gen[ae_gen['ym'].str.startswith('2025')]['plantid'].unique())
for _, row in ae_plants.iterrows():
    pid = row['plantid']
    if pid not in filing_2025:
        print(f"  {pid}: {row['plant_name']} ({row['fuel']}, avg {row['avg_output_mw']:.1f} MW)")
