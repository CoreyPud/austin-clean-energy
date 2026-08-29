#!/usr/bin/env python3
"""
Austin Energy fuel spending by year  ->  public/power_money.json

Sources (EIA v2 API, same key/pattern as scripts/eia_plants.py):
  1. electricity/facility-fuel            (Form EIA-923) monthly net generation and
                                          heat input (MMBtu) per plant per fuel, 2001-present
  2. electricity/electric-power-operational-data  Texas electric-utility average fuel cost
                                          per MMBtu by fuel, monthly, 2001-present

Method
  heat-input dollars = total_consumption_btu(MMBtu) x TX cost_per_MMBtu x AE ownership share
  For fuels with no reported fuel cost (wind, solar, hydro, nuclear, biomass) the
  contracted / non-fuel energy cost is applied as a documented $/MWh assumption and
  reported in a separate "contracted" series so the two are never mixed silently.

Usage:  python scripts/eia_fuel_costs.py
"""
import json
import time
from pathlib import Path

import requests

EIA_API_KEY = "SUroxKGePzfAZh6P7L8wUYXGZGrYkQPva32NhBtx"
FACILITY_URL = "https://api.eia.gov/v2/electricity/facility-fuel/data/"
OPDATA_URL = "https://api.eia.gov/v2/electricity/electric-power-operational-data/data/"

OUT = Path(__file__).resolve().parent.parent / "public" / "power_money.json"

START, END = "2001-01", "2026-12"

# Austin Energy ownership / PPA share per EIA plant code.
# Mirrors AE_PCT in scripts/sentinel_no2_map.py so dollars line up with the fuel-mix chart.
AE_PCT = {
    3548: 1.0, 7900: 1.0, 56374: 1.0, 55708: 1.0,      # owned / operated
    6179: 0.36, 6251: 0.16,                             # co-owned (Fayette coal, STP nuclear)
    57699: 1.0, 59994: 0.98, 60436: 1.0, 60581: 1.0,    # solar PPAs
    61368: 0.98, 57659: 1.0, 63329: 0.96,
    56673: 1.0, 56823: 1.0, 57752: 1.0, 58021: 1.0,     # wind PPAs
    59320: 1.0, 59621: 1.0, 59321: 1.0, 61343: 0.67,
    62909: 1.0, 56661: 0.60,
}

# EIA fuel code -> display group
FUEL_GROUP = {
    "BIT": "coal", "SUB": "coal", "LIG": "coal", "RC": "coal", "WC": "coal",
    "COL": "coal", "COW": "coal", "SC": "coal", "PC": "coal",
    "NG": "gas", "OG": "gas", "BFG": "gas", "PG": "gas", "SGC": "gas", "SGP": "gas",
    "DFO": "oil", "RFO": "oil", "JF": "oil", "KER": "oil", "WO": "oil", "PEL": "oil",
    "NUC": "nuclear",
    "WND": "wind",
    "SUN": "solar",
    "WAT": "hydro",
    "WDS": "biomass", "AB": "biomass", "MSW": "biomass", "LFG": "biomass",
    "OBG": "biomass", "OBL": "biomass", "OBS": "biomass", "BLQ": "biomass",
    "SLW": "biomass", "TDF": "biomass", "MSB": "biomass", "MSN": "biomass",
    "WH": "other", "PUR": "other", "OTH": "other", "MWH": "other", "GEO": "other",
}

# Texas electric-utility fuel-cost series used for each group ($/MMBtu, EIA sector 1)
COST_FUELTYPE = {"coal": "COW", "gas": "NG", "oil": "DFO"}

# Fuels EIA reports no fuel cost for. Contracted / non-fuel energy cost, $/MWh.
# Documented assumptions, shown on the page and flagged as estimates.
CONTRACTED_USD_PER_MWH = {
    # Nuclear fuel is not in the EIA cost series; STP-class fuel cost runs ~$0.70/MMBtu
    # at a ~10,400 Btu/kWh heat rate, i.e. roughly $7/MWh.
    "nuclear": [(2001, 7.0)],
    # Austin Energy wind PPAs: early-2000s contracts ~$32/MWh, post-2015 contracts ~$25/MWh.
    "wind": [(2001, 32.0), (2015, 25.0)],
    # Solar PPAs: pre-2017 contracts ~$50/MWh, Roserock/Upton-era contracts ~$28/MWh.
    "solar": [(2001, 50.0), (2017, 28.0)],
    # Nacogdoches biomass energy cost (capacity payments excluded).
    "biomass": [(2001, 70.0)],
    "hydro": [(2001, 0.0)],
    "other": [(2001, 0.0)],
}

# Approximate Austin Energy residential customer counts (published AE annual reports,
# linearly interpolated between anchor years). Used only for the per-household view.
AE_RES_CUSTOMERS = {2001: 318000, 2005: 340000, 2010: 366000, 2015: 400000,
                    2020: 440000, 2023: 468000, 2026: 495000}
# Residential share of Austin Energy retail energy sales (AE annual reports, ~stable).
RES_SHARE_OF_SALES = 0.38

# ---------------------------------------------------------------------------
# Layer 2: non-fuel plant costs (variable O&M $/MWh, fixed O&M and capital/debt
# service $/kW-yr). Rate levels follow NREL Annual Technology Baseline ranges for
# the relevant technology vintage; they are estimates, labeled as such on the page.
#
# PPA fuels (wind, solar, biomass, hydro) are intentionally zero here: an Austin
# Energy power purchase agreement is an all-in $/MWh price that already contains the
# seller's O&M and capital recovery, so adding ATB O&M on top would double count.
NONFUEL_RATES = {
    "coal":    {"varOmUsdPerMwh": 5.0, "fixedOmUsdPerKwYr": 45.0, "capitalUsdPerKwYr": 25.0},
    "gas":     {"varOmUsdPerMwh": 5.5, "fixedOmUsdPerKwYr": 25.0, "capitalUsdPerKwYr": 30.0},
    "nuclear": {"varOmUsdPerMwh": 3.0, "fixedOmUsdPerKwYr": 130.0, "capitalUsdPerKwYr": 40.0},
    "oil":     {"varOmUsdPerMwh": 8.0, "fixedOmUsdPerKwYr": 0.0, "capitalUsdPerKwYr": 0.0},
    "wind":    {"varOmUsdPerMwh": 0.0, "fixedOmUsdPerKwYr": 0.0, "capitalUsdPerKwYr": 0.0},
    "solar":   {"varOmUsdPerMwh": 0.0, "fixedOmUsdPerKwYr": 0.0, "capitalUsdPerKwYr": 0.0},
    "biomass": {"varOmUsdPerMwh": 0.0, "fixedOmUsdPerKwYr": 0.0, "capitalUsdPerKwYr": 0.0},
    "hydro":   {"varOmUsdPerMwh": 0.0, "fixedOmUsdPerKwYr": 0.0, "capitalUsdPerKwYr": 0.0},
    "other":   {"varOmUsdPerMwh": 0.0, "fixedOmUsdPerKwYr": 0.0, "capitalUsdPerKwYr": 0.0},
}

# Austin Energy's share of nameplate capacity for the units it owns or co-owns, MW,
# by fuel group (EIA-860 nameplate x AE ownership share). Fixed O&M and capital only
# apply to this owned capacity; contracted resources carry none.
OWNED_CAPACITY_MW = {
    "gas": 1310.0,       # Decker Creek steam + GTs, Sand Hill combined cycle + peakers
    "coal": 608.0,       # 36% of Fayette Power Project units 1-2
    "nuclear": 430.0,    # 16% of the South Texas Project
    "oil": 0.0,
}

# Layer 3: system costs that cannot be attributed to a fuel — transmission and
# distribution, ERCOT congestion / ancillary / administrative charges, customer
# service and general administration, and the General Fund transfer. Anchor values
# are Austin Energy approved-budget requirement minus power-supply cost, in dollars,
# interpolated between anchor years. Coverage starts at the earliest year with a
# retrievable budget document.
SYSTEM_COSTS_USD = {
    2010: 620_000_000,
    2015: 700_000_000,
    2020: 800_000_000,
    2023: 900_000_000,
    2026: 1_000_000_000,
}
SYSTEM_COSTS_START = min(SYSTEM_COSTS_USD)


def system_costs(year):
    """Interpolated non-fuel-specific system cost for a year, or None before coverage."""
    if year < SYSTEM_COSTS_START:
        return None
    years = sorted(SYSTEM_COSTS_USD)
    if year >= years[-1]:
        return float(SYSTEM_COSTS_USD[years[-1]])
    for a, b in zip(years, years[1:]):
        if a <= year <= b:
            t = (year - a) / (b - a)
            return float(SYSTEM_COSTS_USD[a] + t * (SYSTEM_COSTS_USD[b] - SYSTEM_COSTS_USD[a]))
    return float(SYSTEM_COSTS_USD[years[-1]])




def _get(url, params, tries=4):
    for attempt in range(tries):
        r = requests.get(url, params=params, timeout=120)
        if r.status_code == 200:
            return r.json()["response"]
        time.sleep(2 + 3 * attempt)
    raise RuntimeError(f"EIA request failed {r.status_code}: {r.text[:300]}")


def fetch_costs():
    """{'YYYY-MM': {'coal': $/MMBtu, 'gas': ..., 'oil': ...}}"""
    out = {}
    offset = 0
    while True:
        resp = _get(OPDATA_URL, {
            "api_key": EIA_API_KEY, "frequency": "monthly",
            "data[]": ["cost-per-btu"],
            "facets[location][]": ["TX"], "facets[sectorid][]": ["1"],
            "facets[fueltypeid][]": list(COST_FUELTYPE.values()),
            "start": START, "end": END, "length": 5000, "offset": offset,
            "sort[0][column]": "period", "sort[0][direction]": "asc",
        })
        rows = resp["data"]
        for r in rows:
            v = r.get("cost-per-btu")
            if v in (None, ""):
                continue
            v = float(v)
            if v <= 0:
                continue
            for group, code in COST_FUELTYPE.items():
                if r["fueltypeid"] == code:
                    out.setdefault(r["period"], {})[group] = v
        if len(rows) < 5000:
            break
        offset += 5000
    print(f"  cost series: {len(out)} months")
    return out


def fetch_ae_generation():
    """[(period, plantCode, fuel, mwh, mmbtu)] for Austin Energy plants."""
    rows_out = []
    codes = [str(c) for c in AE_PCT]
    for i in range(0, len(codes), 6):
        chunk = codes[i:i + 6]
        offset = 0
        while True:
            resp = _get(FACILITY_URL, {
                "api_key": EIA_API_KEY, "frequency": "monthly",
                "data[]": ["generation", "total-consumption-btu"],
                "facets[plantCode][]": chunk,
                "start": START, "end": END, "length": 5000, "offset": offset,
                "sort[0][column]": "period", "sort[0][direction]": "asc",
            })
            rows = resp["data"]
            for r in rows:
                # keep one row per plant/fuel/month: fuel-specific, all prime movers
                if r.get("primeMover") != "ALL" or r.get("fuel2002") in (None, "ALL"):
                    continue
                mwh = float(r.get("generation") or 0)
                btu = float(r.get("total-consumption-btu") or 0)
                if mwh == 0 and btu == 0:
                    continue
                rows_out.append((r["period"], int(r["plantCode"]), r["fuel2002"], mwh, btu))
            if len(rows) < 5000:
                break
            offset += 5000
        print(f"  plants {i + 1}-{i + len(chunk)}: {len(rows_out)} rows so far")
    return rows_out


def rate_for(group, year):
    schedule = CONTRACTED_USD_PER_MWH.get(group)
    if not schedule:
        return 0.0
    rate = schedule[0][1]
    for start_year, value in schedule:
        if year >= start_year:
            rate = value
    return rate


def res_customers(year):
    years = sorted(AE_RES_CUSTOMERS)
    if year <= years[0]:
        return AE_RES_CUSTOMERS[years[0]]
    if year >= years[-1]:
        return AE_RES_CUSTOMERS[years[-1]]
    for a, b in zip(years, years[1:]):
        if a <= year <= b:
            t = (year - a) / (b - a)
            return round(AE_RES_CUSTOMERS[a] + t * (AE_RES_CUSTOMERS[b] - AE_RES_CUSTOMERS[a]))
    return AE_RES_CUSTOMERS[years[-1]]


def main():
    print("Fetching Texas fuel costs ($/MMBtu)...")
    costs = fetch_costs()
    print("Fetching Austin Energy plant generation and heat input...")
    gen = fetch_ae_generation()
    print(f"  {len(gen)} plant/fuel/month rows")

    years = {}
    months_covered = set()
    for period, plant, fuel, mwh, mmbtu in gen:
        share = AE_PCT.get(plant, 0.0)
        if share <= 0:
            continue
        group = FUEL_GROUP.get(fuel, "other")
        year = int(period[:4])
        months_covered.add(period)
        y = years.setdefault(year, {})
        f = y.setdefault(group, {"mwh": 0.0, "mmbtu": 0.0, "fuel_usd": 0.0,
                                 "contracted_usd": 0.0, "cost_reported": False})
        f["mwh"] += mwh * share
        f["mmbtu"] += mmbtu * share

        cpb = costs.get(period, {}).get(group)
        if cpb and mmbtu > 0:
            f["fuel_usd"] += mmbtu * share * cpb
            f["cost_reported"] = True
        elif group in CONTRACTED_USD_PER_MWH:
            f["contracted_usd"] += max(mwh, 0.0) * share * rate_for(group, year)

    last_period = max(months_covered) if months_covered else None
    partial_year = int(last_period[:4]) if last_period and last_period[5:7] != "12" else None

    out_years = []
    for year in sorted(years):
        fuels = {}
        for group, f in years[year].items():
            total = f["fuel_usd"] + f["contracted_usd"]
            if f["mwh"] <= 0 and total <= 0:
                continue
            rates = NONFUEL_RATES.get(group, NONFUEL_RATES["other"])
            cap_kw = OWNED_CAPACITY_MW.get(group, 0.0) * 1000.0
            var_om = max(f["mwh"], 0.0) * rates["varOmUsdPerMwh"]
            fixed_om = cap_kw * rates["fixedOmUsdPerKwYr"]
            capital = cap_kw * rates["capitalUsdPerKwYr"]
            if partial_year == year and last_period:
                # scale annualized fixed costs to the months actually reported
                frac = int(last_period[5:7]) / 12.0
                fixed_om *= frac
                capital *= frac
            nonfuel = var_om + fixed_om + capital
            with_nonfuel = total + nonfuel
            fuels[group] = {
                "mwh": round(f["mwh"], 1),
                "fuelUsd": round(f["fuel_usd"], 0),
                "contractedUsd": round(f["contracted_usd"], 0),
                "totalUsd": round(total, 0),
                "varOmUsd": round(var_om, 0),
                "fixedOmUsd": round(fixed_om, 0),
                "capitalUsd": round(capital, 0),
                "nonFuelUsd": round(nonfuel, 0),
                "totalWithNonFuelUsd": round(with_nonfuel, 0),
                "usdPerMwh": round(total / f["mwh"], 2) if f["mwh"] > 0 else None,
                "usdPerMwhWithNonFuel": round(with_nonfuel / f["mwh"], 2) if f["mwh"] > 0 else None,
                "measured": bool(f["cost_reported"]),
            }
        if not fuels:
            continue
        total_usd = sum(v["totalUsd"] for v in fuels.values())
        nonfuel_usd = sum(v["nonFuelUsd"] for v in fuels.values())
        sys_usd = system_costs(year)
        if sys_usd is not None and partial_year == year and last_period:
            sys_usd *= int(last_period[5:7]) / 12.0
        customers = res_customers(year)
        full_usd = total_usd + nonfuel_usd + (sys_usd or 0.0)
        out_years.append({
            "year": year,
            "fuels": fuels,
            "totalUsd": round(total_usd, 0),
            "nonFuelUsd": round(nonfuel_usd, 0),
            "systemCostsUsd": None if sys_usd is None else round(sys_usd, 0),
            "totalWithNonFuelUsd": round(total_usd + nonfuel_usd, 0),
            "fullSystemUsd": None if sys_usd is None else round(full_usd, 0),
            "totalMwh": round(sum(v["mwh"] for v in fuels.values()), 1),
            "resCustomers": customers,
            "perHouseholdUsd": round(total_usd * RES_SHARE_OF_SALES / customers, 2),
            "perHouseholdWithNonFuelUsd": round((total_usd + nonfuel_usd) * RES_SHARE_OF_SALES / customers, 2),
            "perHouseholdFullUsd": None if sys_usd is None else round(full_usd * RES_SHARE_OF_SALES / customers, 2),
            "partial": year == partial_year,
        })

    data = {
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "lastPeriod": last_period,
        "years": out_years,
        "assumptions": {
            "contractedUsdPerMwh": CONTRACTED_USD_PER_MWH,
            "residentialShareOfSales": RES_SHARE_OF_SALES,
            "aeResidentialCustomers": AE_RES_CUSTOMERS,
            "aePct": {str(k): v for k, v in AE_PCT.items()},
            "nonFuel": {
                "rates": NONFUEL_RATES,
                "ownedCapacityMw": OWNED_CAPACITY_MW,
                "source": "NREL Annual Technology Baseline O&M and capital ranges; EIA-860 nameplate capacity x Austin Energy ownership share. PPA resources carry no separate non-fuel cost because the contract price is all-in.",
            },
            "systemCosts": {
                "usdByYear": SYSTEM_COSTS_USD,
                "startYear": SYSTEM_COSTS_START,
                "source": "Austin Energy approved budget requirement minus power-supply cost, interpolated between anchor years. Covers transmission and distribution, ERCOT congestion, ancillary and administrative charges, customer service, general administration and the General Fund transfer. Not attributable to any single fuel.",
            },
        },
    }

    OUT.write_text(json.dumps(data))
    print(f"  power_money.json: {len(out_years)} years -> {OUT}")


if __name__ == "__main__":
    main()
