// Federal support per MWh by generation source — the "who else paid" layer for /power-money.
//
// The Power Money charts show what Austin Energy paid. This file estimates what federal
// taxpayers carried for the same megawatt-hours, through production and investment tax
// credits and fuel-specific tax provisions.
//
// Austin Energy is a municipal utility and cannot itself claim federal tax credits. The
// value lands on the private developers and PPA counterparties who build and sell the
// power, and on the homeowners who install rooftop systems, and it generally shows up as
// a lower contract or install price. So these numbers are *support behind* Austin
// Energy's supply, not line items in Austin Energy's budget.
//
// Every figure is either statutory (a credit rate written into the tax code) or a
// documented analyst estimate. Nothing here is a guess: where a defensible number does
// not exist, the source is omitted rather than filled in.

import type { ComparisonRow, FuelKey } from "./power-money";

export type FederalKey = FuelKey | "localSolar";

export type SupportBasis = "statutory" | "estimate";

/** One named tax provision inside a source's federal support rate. */
export interface SupportComponent {
  label: string;
  usdPerMwh: number;
  /** short note on where the figure comes from */
  source: string;
}

export interface FederalRate {
  /** plant-level federal support attributable to this generation, $/MWh */
  statutory: number;
  /** low end of broader published estimates, $/MWh */
  broaderLow: number;
  /** high end of broader published estimates, $/MWh */
  broaderHigh: number;
  basis: SupportBasis;
  /** what the statutory number is */
  what: string;
  /** itemised provisions behind `statutory`, where they can be separated */
  components?: SupportComponent[];
}


/** Conversion assumptions for the credits that are capital-based rather than per-MWh. */
export const FEDERAL_ASSUMPTIONS = {
  /** Utility PV capex used to levelize the ITC, $/kW (NREL ATB 2023 class). */
  utilityPvCapexUsdPerKw: 1200,
  /** Utility PV capacity factor used to levelize the ITC. */
  utilityPvCapacityFactor: 0.25,
  /** Residential install benchmark used to levelize the 25D credit, $/W. */
  residentialPvUsdPerWatt: 2.8,
  /** Residential yield used to spread the credit over lifetime output, kWh/kW-yr. */
  residentialYieldKwhPerKwYear: 1450,
  /** Asset life used for both levelizations, years. */
  lifeYears: 25,
  /** Real discount rate used to annuitize capital-based credits. */
  discountRate: 0.06,
  /** Corporate rate used for the accelerated-depreciation shield. */
  corporateTaxRate: 0.21,
} as const;

/**
 * Section 45 production tax credit for wind, inflation-adjusted and adjusted for the
 * 2017-2019 statutory phase-down, then restored at full value with the prevailing-wage
 * and apprenticeship bonus from 2022. Values are $/MWh.
 */
const WIND_PTC: [number, number][] = [
  [1994, 15.0],
  [2005, 19.0],
  [2010, 22.0],
  [2016, 23.0],
  [2017, 18.4],
  [2018, 13.8],
  [2019, 9.2],
  [2020, 13.8],
  [2022, 27.5],
  [2024, 29.0],
  [2025, 30.0],
];

/** Section 48 investment tax credit percentage for utility-scale solar by year. */
const UTILITY_ITC_PCT: [number, number][] = [
  [2006, 0.3],
  [2020, 0.26],
  [2022, 0.3],
];

/** Section 25D residential credit percentage. Terminated for property placed in service after 2025. */
const RESIDENTIAL_25D_PCT: [number, number][] = [
  [2006, 0.3],
  [2020, 0.26],
  [2022, 0.3],
  [2026, 0.0],
];

/** Value of accelerated (5-, 15- and 20-year MACRS plus bonus) depreciation, $/MWh. */
const MACRS_USD_PER_MWH: Partial<Record<FederalKey, number>> = {
  wind: 4.0,
  solar: 5.0,
  nuclear: 1.5,
  gas: 1.0,
  coal: 0.75,
};

const stepValue = (table: [number, number][], year: number): number => {
  let value = table[0][1];
  for (const [start, v] of table) if (year >= start) value = v;
  return value;
};

/** Annuity factor that turns an up-front credit into a level annual amount. */
const capitalRecoveryFactor = () => {
  const { discountRate: r, lifeYears: n } = FEDERAL_ASSUMPTIONS;
  return (r * (1 + r) ** n) / ((1 + r) ** n - 1);
};

/** ITC on utility PV, levelized to $/MWh with the assumptions above. */
export function utilitySolarItcUsdPerMwh(year: number): number {
  const pct = stepValue(UTILITY_ITC_PCT, year);
  const { utilityPvCapexUsdPerKw, utilityPvCapacityFactor } = FEDERAL_ASSUMPTIONS;
  const annualUsdPerKw = pct * utilityPvCapexUsdPerKw * capitalRecoveryFactor();
  const annualMwhPerKw = (utilityPvCapacityFactor * 8760) / 1000;
  return +(annualUsdPerKw / annualMwhPerKw).toFixed(2);
}

/** Section 25D credit spread over a rooftop system's lifetime output, $/MWh. */
export function residentialCreditUsdPerMwh(year: number): number {
  const pct = stepValue(RESIDENTIAL_25D_PCT, year);
  if (pct === 0) return 0;
  const { residentialPvUsdPerWatt, residentialYieldKwhPerKwYear, lifeYears } = FEDERAL_ASSUMPTIONS;
  const creditPerKw = pct * residentialPvUsdPerWatt * 1000;
  const lifetimeMwhPerKw = (residentialYieldKwhPerKwYear * lifeYears) / 1000;
  return +(creditPerKw / lifetimeMwhPerKw).toFixed(2);
}

/**
 * Federal support for one source in one year, or null when no defensible per-MWh
 * figure exists for that source (hydro, biomass and fuel oil in Austin Energy's mix).
 */
export function federalRate(key: FederalKey, year: number): FederalRate | null {
  const macrs = MACRS_USD_PER_MWH[key] ?? 0;
  switch (key) {
    case "wind": {
      const ptc = stepValue(WIND_PTC, year);
      return {
        statutory: +(ptc + macrs).toFixed(2),
        broaderLow: ptc,
        broaderHigh: +(ptc + macrs + 12).toFixed(2),
        basis: "statutory",
        what: "Section 45 / 45Y production tax credit plus 5-year accelerated depreciation",
      };
    }
    case "solar": {
      const itc = utilitySolarItcUsdPerMwh(year);
      return {
        statutory: +(itc + macrs).toFixed(2),
        broaderLow: itc,
        broaderHigh: +(itc * 1.67 + macrs + 5).toFixed(2),
        basis: "estimate",
        what: "Section 48 investment tax credit, levelized, plus 5-year accelerated depreciation",
      };
    }
    case "localSolar": {
      const credit = residentialCreditUsdPerMwh(year);
      if (credit === 0)
        return {
          statutory: 0,
          broaderLow: 0,
          broaderHigh: 0,
          basis: "statutory",
          what: "Section 25D terminated for systems placed in service after December 31, 2025",
        };
      return {
        statutory: credit,
        broaderLow: credit,
        broaderHigh: +(credit * 2).toFixed(2),
        basis: "statutory",
        what: "Section 25D residential clean energy credit, spread over lifetime output",
      };
    }
    case "nuclear": {
      // Section 45J only covered new reactors, so the South Texas Project earned nothing
      // until the 45U zero-emission credit began in 2024.
      const credit = year >= 2024 ? 15.0 : 0;
      return {
        statutory: +(credit + (year >= 2024 ? macrs : 0)).toFixed(2),
        broaderLow: year >= 2024 ? 3.0 : 0,
        broaderHigh: year >= 2024 ? +(credit + macrs).toFixed(2) : 2.0,
        basis: "statutory",
        what:
          year >= 2024
            ? "Section 45U zero-emission nuclear credit at the prevailing-wage rate, plus depreciation"
            : "No generation-based federal credit existed for reactors online in 1988",
      };
    }
    case "gas":
      return {
        statutory: +(0.35 + macrs).toFixed(2),
        broaderLow: 0.2,
        broaderHigh: 2.0,
        basis: "estimate",
        what:
          "Intangible drilling costs, percentage depletion and accelerated depreciation, allocated to power-sector gas",
      };
    case "coal":
      return {
        statutory: +(0.5 + macrs).toFixed(2),
        broaderLow: 0.3,
        broaderHigh: 2.0,
        basis: "estimate",
        what: "Coal percentage depletion, black-lung credit and accelerated depreciation",
      };
    default:
      return null;
  }
}

export const FEDERAL_SOURCES = [
  {
    label: "EIA, Federal Financial Interventions and Subsidies in Energy (FY2016–FY2022)",
    url: "https://www.eia.gov/analysis/requests/subsidy/",
  },
  {
    label: "Joint Committee on Taxation, Estimates of Federal Tax Expenditures (annual)",
    url: "https://www.jct.gov/publications/",
  },
  {
    label: "IRS annual Section 45 production tax credit inflation-adjustment notices",
    url: "https://www.irs.gov/credits-deductions/businesses/renewable-electricity-production-credit-amounts",
  },
  {
    label: "IRC Sections 45, 45U, 45Y, 48 and 25D as amended by the Inflation Reduction Act (2022)",
    url: "https://www.congress.gov/bill/117th-congress/house-bill/5376/text",
  },
  {
    label: "Congressional Research Service, Section 45U zero-emission nuclear production credit",
    url: "https://www.congress.gov/crs-product/IN12557",
  },
  {
    label: "NREL Annual Technology Baseline — capex and capacity factors used to levelize the ITC",
    url: "https://atb.nrel.gov/",
  },
  {
    label: "Oil Change International, Paying for Climate Chaos — broader fossil support estimates",
    url: "https://priceofoil.org/",
  },
];

export interface FederalRow {
  key: FederalKey;
  label: string;
  color: string;
  /** plant-level federal support, $/MWh */
  statutoryRate: number;
  /** extra width of the broader-estimate band above the statutory rate, $/MWh */
  broaderBand: number;
  broaderLow: number;
  broaderHigh: number;
  basis: SupportBasis;
  what: string;
  components?: SupportComponent[];
  mwh: number;
  /** statutory rate x MWh, $ */
  totalUsd: number;

  /** what Austin Energy paid per MWh, for the side-by-side line */
  deliveredRate: number;
}

interface RowInput {
  key: FederalKey;
  label: string;
  color: string;
  mwh: number;
  deliveredRate: number;
}

/**
 * Federal support rows for one year, largest support first. Built from the same
 * megawatt-hours as the delivered-cost comparison, so the two read together.
 * Sources with no defensible per-MWh estimate are dropped rather than shown as zero.
 */
export function toFederalRows(rows: RowInput[], year: number): FederalRow[] {
  return rows
    .map((r): FederalRow | null => {
      const rate = federalRate(r.key, year);
      if (!rate) return null;
      return {
        key: r.key,
        label: r.label,
        color: r.color,
        statutoryRate: rate.statutory,
        broaderBand: +Math.max(0, rate.broaderHigh - rate.statutory).toFixed(2),
        broaderLow: rate.broaderLow,
        broaderHigh: rate.broaderHigh,
        basis: rate.basis,
        what: rate.what,
        components: rate.components,

        mwh: r.mwh,
        totalUsd: Math.round(rate.statutory * r.mwh),
        deliveredRate: r.deliveredRate,
      };
    })
    .filter((r): r is FederalRow => r !== null)
    .sort((a, b) => b.statutoryRate - a.statutoryRate);
}

/** Chart color for the federal-support bars — deliberately distinct from every fuel color. */
export const FEDERAL_META = { label: "Federal support", color: "#0d9488" };

// ---------------------------------------------------------------------------
// Combined cost: what Austin Energy paid plus what federal taxpayers carried.
// ---------------------------------------------------------------------------

export interface TotalCostRow {
  key: FederalKey;
  label: string;
  color: string;
  /** fuel purchases or contracted energy price, $/MWh */
  fuelRate: number;
  /** modeled plant O&M + capital, $/MWh */
  nonFuelRate: number;
  /** allocated system delivery costs, $/MWh */
  systemRate: number;
  /** what Austin Energy paid, all three layers, $/MWh */
  aeRate: number;
  /** federal support attributable to this generation, $/MWh */
  federalRate: number;
  /** extra width of the broader-estimate band above the federal rate, $/MWh */
  broaderBand: number;
  broaderHigh: number;
  /** true when no defensible federal figure exists for this source */
  federalUnknown: boolean;
  basis: SupportBasis | null;
  what: string | null;
  /** aeRate + federalRate */
  combinedRate: number;
  /** share of combinedRate carried by Austin Energy ratepayers, 0-1 */
  ratepayerShare: number;
  /** share of combinedRate carried by federal taxpayers, 0-1 */
  taxpayerShare: number;
  mwh: number;
  /** combinedRate x MWh, $ */
  combinedTotalUsd: number;
  /** federalRate x MWh, $ */
  federalTotalUsd: number;
}

/**
 * Joins the delivered-cost rows with the federal-support rows on source key so a
 * single bar shows the whole cost of a megawatt-hour regardless of who paid it.
 * Sources with no defensible federal figure keep their Austin Energy cost and are
 * flagged `federalUnknown` rather than being credited a zero.
 */
export function toTotalCostRows(comparisonRows: ComparisonRow[], year: number): TotalCostRow[] {
  return comparisonRows
    .map((r): TotalCostRow => {
      const rate = federalRate(r.key, year);
      const federal = rate?.statutory ?? 0;
      const combined = +(r.deliveredRate + federal).toFixed(2);
      return {
        key: r.key,
        label: r.label,
        color: r.color,
        fuelRate: r.fuelRate,
        nonFuelRate: r.nonFuelRate,
        systemRate: r.systemRate,
        aeRate: r.deliveredRate,
        federalRate: federal,
        broaderBand: rate ? +Math.max(0, rate.broaderHigh - rate.statutory).toFixed(2) : 0,
        broaderHigh: rate?.broaderHigh ?? 0,
        federalUnknown: rate === null,
        basis: rate?.basis ?? null,
        what: rate?.what ?? null,
        combinedRate: combined,
        ratepayerShare: combined > 0 ? r.deliveredRate / combined : 0,
        taxpayerShare: combined > 0 ? federal / combined : 0,
        mwh: r.mwh,
        combinedTotalUsd: Math.round(combined * r.mwh),
        federalTotalUsd: Math.round(federal * r.mwh),
      };
    })
    .sort((a, b) => b.combinedRate - a.combinedRate);
}
