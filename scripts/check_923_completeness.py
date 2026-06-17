import pandas as pd, numpy as np, calendar

df = pd.read_csv(r'C:\Users\altbi\Downloads\eia_tx_generation.csv', low_memory=False)
plants_df = pd.read_csv(r'C:\Users\altbi\Downloads\eia_tx_plants.csv', low_memory=False)

df['ym'] = df['period'].str[:7]

def hours(ym):
    y, m = int(ym[:4]), int(ym[5:7])
    return calendar.monthrange(y, m)[1] * 24

monthly = df.groupby('ym').agg(
    n_plants=('plantid', 'nunique'),
    total_mwh=('generation_mwh', 'sum')
).reset_index()
monthly['hrs'] = monthly['ym'].apply(hours)
monthly['total_mw'] = monthly['total_mwh'] / monthly['hrs']
monthly = monthly.sort_values('ym')

total_roster = plants_df['plantid'].nunique() if 'plantid' in plants_df.columns else None
print(f"Plants in roster (eia_tx_plants.csv): {total_roster}")
print(f"Distinct plants ever filing in 923:   {df['plantid'].nunique()}")
print()
print(f"{'Year':<6} | {'avg n_plants':>12} | {'min n':>6} | {'max n':>6} | {'avg MW':>8} | {'stddev MW':>10} | {'CV%':>5}")
print("-" * 75)
for yr in sorted(monthly['ym'].str[:4].unique()):
    sub = monthly[monthly['ym'].str[:4] == yr]
    avg_p = sub['n_plants'].mean()
    min_p = sub['n_plants'].min()
    max_p = sub['n_plants'].max()
    avg_mw = sub['total_mw'].mean()
    std_mw = sub['total_mw'].std()
    cv = 100 * std_mw / avg_mw if avg_mw else 0
    print(f"{yr:<6} | {avg_p:>12.0f} | {min_p:>6.0f} | {max_p:>6.0f} | {avg_mw:>8.0f} | {std_mw:>10.0f} | {cv:>5.1f}")

# Nameplate comparison
print()
cap_col = [c for c in plants_df.columns if 'cap' in c.lower() or 'mw' in c.lower()]
print("Plants columns:", list(plants_df.columns))
