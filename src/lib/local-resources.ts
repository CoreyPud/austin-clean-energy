// Local (customer-sited) solar and battery storage, priced so it can be compared
// against the utility-scale sources on the Power Money page.
//
// Capacity and project counts come from City of Austin issued solar permits in our
// own solar_installations table (calendar_year_issued). Battery counts are permits
// whose description mentions battery / storage / Powerwall, so they are a floor:
// a permit that does not spell out storage is not counted.
//
// Prices come from published Austin Energy tariffs and program pages, listed in
// LOCAL_SOURCES below. Where a rate has to be assumed it is labeled as an estimate.

export interface LocalYear {
  year: number;
  /** solar capacity added that year, kW (permit-reported nameplate) */
  kwAdded: number;
  /** solar permits issued that year */
  permits: number;
  /** permits that mention battery storage */
  batteryPermits: number;
  partial?: boolean;
}

/** Source: public.solar_installations (City of Austin issued construction permits). */
export const LOCAL_YEARS: LocalYear[] = [
  { year: 2013, kwAdded: 44, permits: 421, batteryPermits: 0 },
  { year: 2014, kwAdded: 789.6, permits: 1180, batteryPermits: 0 },
  { year: 2015, kwAdded: 1309.6, permits: 1168, batteryPermits: 1 },
  { year: 2016, kwAdded: 2244.2, permits: 1325, batteryPermits: 2 },
  { year: 2017, kwAdded: 3820.0, permits: 1884, batteryPermits: 24 },
  { year: 2018, kwAdded: 4895.7, permits: 1393, batteryPermits: 21 },
  { year: 2019, kwAdded: 14290.8, permits: 1938, batteryPermits: 16 },
  { year: 2020, kwAdded: 9755.6, permits: 2010, batteryPermits: 35 },
  { year: 2021, kwAdded: 10396.1, permits: 2253, batteryPermits: 402 },
  { year: 2022, kwAdded: 16799.1, permits: 2070, batteryPermits: 342 },
  { year: 2023, kwAdded: 8996.4, permits: 1575, batteryPermits: 261 },
  { year: 2024, kwAdded: 22717.7, permits: 1239, batteryPermits: 246 },
  { year: 2025, kwAdded: 10992.1, permits: 853, batteryPermits: 261 },
  { year: 2026, kwAdded: 7153.9, permits: 435, batteryPermits: 205, partial: true },
];

/** Documented rate assumptions, surfaced on the page so nothing is hidden. */
export const LOCAL_RATES = {
  /** Value of Solar bill credit for systems under 1 MW-AC, $/MWh (9.91 c/kWh). */
  vosUsdPerMwh: 99.1,
  /** Value of Solar credit for systems 1 MW-AC and larger, $/MWh (7.24 c/kWh). */
  vosLargeUsdPerMwh: 72.4,
  /** Residential rebate per project, $. Raised from $2,500 to $4,000 on July 1, 2026. */
  residentialRebateUsd: 2500,
  residentialRebateUsdCurrent: 4000,
  /** Commercial Solar Standard Offer performance payment, $/MWh, projects under 400 kW. */
  standardOfferUsdPerMwh: 100,
  /** Austin rooftop PV yield, kWh per installed kW-DC per year (PVWatts-class estimate). */
  yieldKwhPerKwYear: 1450,
  /** Assumed system life used to amortize the up-front rebate, years. */
  systemLifeYears: 25,
  /** Power Partner battery: one-time rebate at permission to operate, $. */
  batteryRebateUsd: 500,
  /** Power Partner battery: annual performance payment, $ per enrolled battery (estimate). */
  batteryAnnualPaymentUsd: 250,
  /** Assumed dispatchable output per enrolled home battery, kW. */
  batteryDispatchKw: 5,
  /** Assumed enrolled-battery program life used for the $/kW-yr figure, years. */
  batteryLifeYears: 10,
} as const;

export const LOCAL_SOURCES = [
  {
    label: "Austin Energy Value of Solar rate (9.91 c/kWh under 1 MW-AC, 7.24 c/kWh at or above)",
    url: "https://austinenergy.com/rates/residential-rates/value-of-solar-rate",
  },
  {
    label: "Austin Energy solar rebates and commercial Standard Offer performance payments",
    url: "https://austinenergy.com/green-power/solar-solutions/for-your-home",
  },
  {
    label: "Austin Energy Power Partner battery rebate and performance payments",
    url: "https://austinenergy.com/green-power/power-partner-thermostats",
  },
  {
    label: "Local solar capacity and battery counts: City of Austin issued construction permits",
    url: "https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu",
  },
];

export interface LocalSolarYear extends LocalYear {
  /** cumulative installed capacity at year end, kW */
  cumulativeKw: number;
  /** estimated generation from that cumulative fleet, MWh */
  mwh: number;
  /** Value of Solar credits Austin Energy paid out that year, $ */
  vosUsd: number;
  /** rebates paid on that year's new projects, $ */
  rebateUsd: number;
  /** total Austin Energy outlay that year, $ */
  totalUsd: number;
  /** VoS credit plus rebate amortized over system life, $/MWh */
  usdPerMwh: number;
}

/** Rebate spread over a project's lifetime production, $/MWh. */
export function amortizedRebateUsdPerMwh(year: number): number {
  const rebate =
    year >= 2026 ? LOCAL_RATES.residentialRebateUsdCurrent : LOCAL_RATES.residentialRebateUsd;
  const avgSystemKw = 7.5; // Austin residential average, permit-reported
  const lifetimeMwh =
    (avgSystemKw * LOCAL_RATES.yieldKwhPerKwYear * LOCAL_RATES.systemLifeYears) / 1000;
  return +(rebate / lifetimeMwh).toFixed(2);
}

/** Per-year local solar cost series: what Austin Energy pays for behind-the-meter solar. */
export function localSolarSeries(): LocalSolarYear[] {
  let cumulativeKw = 0;
  return LOCAL_YEARS.map((y) => {
    cumulativeKw += y.kwAdded;
    const fraction = y.partial ? 0.5 : 1; // partial permit year, half-year of production
    const mwh = (cumulativeKw * LOCAL_RATES.yieldKwhPerKwYear * fraction) / 1000;
    const vosUsd = mwh * LOCAL_RATES.vosUsdPerMwh;
    const rebate =
      y.year >= 2026 ? LOCAL_RATES.residentialRebateUsdCurrent : LOCAL_RATES.residentialRebateUsd;
    const rebateUsd = y.year >= 2018 ? y.permits * rebate : 0;
    return {
      ...y,
      cumulativeKw: +cumulativeKw.toFixed(1),
      mwh: +mwh.toFixed(1),
      vosUsd: Math.round(vosUsd),
      rebateUsd: Math.round(rebateUsd),
      totalUsd: Math.round(vosUsd + rebateUsd),
      usdPerMwh: +(LOCAL_RATES.vosUsdPerMwh + amortizedRebateUsdPerMwh(y.year)).toFixed(2),
    };
  });
}

export interface LocalBatteryYear {
  year: number;
  newBatteries: number;
  cumulativeBatteries: number;
  /** dispatchable capacity from the installed fleet, MW */
  dispatchMw: number;
  /** rebates paid on new batteries that year, $ */
  rebateUsd: number;
  /** performance payments to the enrolled fleet that year, $ */
  performanceUsd: number;
  totalUsd: number;
  partial?: boolean;
}

/** Per-year local battery program cost series. */
export function localBatterySeries(): LocalBatteryYear[] {
  let cumulative = 0;
  return LOCAL_YEARS.map((y) => {
    cumulative += y.batteryPermits;
    const dispatchMw = (cumulative * LOCAL_RATES.batteryDispatchKw) / 1000;
    const rebateUsd = y.batteryPermits * LOCAL_RATES.batteryRebateUsd;
    const performanceUsd = cumulative * LOCAL_RATES.batteryAnnualPaymentUsd;
    return {
      year: y.year,
      newBatteries: y.batteryPermits,
      cumulativeBatteries: cumulative,
      dispatchMw: +dispatchMw.toFixed(2),
      rebateUsd,
      performanceUsd,
      totalUsd: rebateUsd + performanceUsd,
      partial: y.partial,
    };
  });
}

/**
 * Local batteries are a capacity resource, not an energy source, so the fair unit is
 * $ per kW of dispatchable capacity per year — the same unit as a gas peaker's fixed
 * O&M plus capital recovery.
 */
export function batteryUsdPerKwYear(): number {
  const lifetimeUsd =
    LOCAL_RATES.batteryRebateUsd +
    LOCAL_RATES.batteryAnnualPaymentUsd * LOCAL_RATES.batteryLifeYears;
  const perYear = lifetimeUsd / LOCAL_RATES.batteryLifeYears;
  return +(perYear / LOCAL_RATES.batteryDispatchKw).toFixed(2);
}

/** Gas peaker fixed O&M + capital recovery used as the comparison, $/kW-yr. */
export const GAS_PEAKER_USD_PER_KW_YEAR = 55;

export const localSolarYear = (year: number) =>
  localSolarSeries().find((y) => y.year === year) ?? null;

export const localBatteryYear = (year: number) =>
  localBatterySeries().find((y) => y.year === year) ?? null;
