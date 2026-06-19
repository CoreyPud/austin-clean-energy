// EV vs. Gas financial model with Austin, Texas defaults

export const AUSTIN_EV_DEFAULTS = {
  electricityRatePerKwh: 0.12,
  gasPricePerGal: 3.50,
  evMiPerKwh: 3.5,
  gasMpg: 28,
  annualMiles: 13500,
  evNewPrice: 42000,
  evUsedPrice: 26000,
  gasNewPrice: 32000,
  gasUsedPrice: 20000,
  // AAA "Your Driving Costs" 2024 — maintenance, repair & tires, anchored at 15k mi/yr
  // ~40% fixed (time-based: inspection, filters, wiper blades)
  // ~60% variable (mileage-based: oil changes, tires, brakes)
  evMaintenanceBasePerYear: 950,
  gasMaintenanceBasePerYear: 1_280,
  maintenanceBaselineMiles: 15_000,
  maintenanceVariableFraction: 0.6,
  gasPriceInflationRate: 0.02,
  electricityInflationRate: 0.01,
  batteryDegradationPerYear: 0.02,
} as const;

export const AUSTIN_EV_INCENTIVES = {
  aeChargerRebate: 1200,         // Austin Energy Power Partner EV charger rebate
  txLdplipGrant: 2500,           // Texas TCEQ LDPLIP grant (new & used, 2,000/yr limit)
  federalChargerTaxCredit: 1000, // 30% of install cost up to $1,000, through June 2026
  federalEvCredit: 0,            // Expired Oct 1, 2025
} as const;

// ERCOT grid carbon intensity
const ERCOT_CO2_KG_PER_MWH = 400;
// EPA: CO2 per gallon of gasoline burned
const CO2_KG_PER_GAL_GAS = 8.89;
// EPA: average domestic round-trip flight, per passenger
const CO2_KG_PER_FLIGHT_ROUNDTRIP = 255;
// Trees absorb ~21 kg CO2/year
const CO2_KG_PER_TREE_YEAR = 21;

export const TCO_YEARS = 10;

// Travis County typical annual registration for a standard passenger car/light truck
// Source: Travis County Tax Office (tax-office.traviscountytx.gov)
export const TX_BASE_REGISTRATION_FEE = 75;

// Texas HB 1263 (2023): additional annual road-use fee for battery-electric vehicles,
// compensating for not paying the ~$0.20/gal state fuel tax. Applies on top of base fee.
export const TX_EV_REGISTRATION_SURCHARGE = 200;

export type EVMode = "buying" | "own-gas";

export interface EVInputs {
  mode: EVMode;
  annualMiles: number;
  evMiPerKwh: number;
  gasMpg: number;
  electricityRatePerKwh: number;
  gasPricePerGal: number;
  gasIsNew: boolean;
  gasModelYear: number;
  evIsNew: boolean;
  evModelYear: number;
  evPrice: number;
  gasPrice: number;
  gasTradeInValue: number;
}

// Default comparison: Chevy Equinox EV vs Chevy Equinox gas
// Same nameplate, same segment — isolates powertrain as the only variable
export const DEFAULT_EV_INPUTS: EVInputs = {
  mode: "buying",
  annualMiles: AUSTIN_EV_DEFAULTS.annualMiles,
  evMiPerKwh: 3.4,   // Chevy Equinox EV EPA combined
  gasMpg: 28,         // Chevy Equinox gas EPA combined
  electricityRatePerKwh: AUSTIN_EV_DEFAULTS.electricityRatePerKwh,
  gasPricePerGal: AUSTIN_EV_DEFAULTS.gasPricePerGal,
  gasIsNew: true,
  gasModelYear: new Date().getFullYear(),
  evIsNew: true,
  evModelYear: new Date().getFullYear(),
  evPrice: 34_995,    // Chevy Equinox EV base MSRP 2025
  gasPrice: 28_000,   // Chevy Equinox gas base MSRP 2025
  gasTradeInValue: 15000,
};

export interface TcoDataPoint {
  year: number;
  ev: number;
  gas: number;
}

export interface EVResults {
  effectiveMiPerKwh: number;
  evAnnualFuel: number;
  gasAnnualFuel: number;
  evAnnualMaintenance: number;
  gasAnnualMaintenance: number;
  evRegistrationSurcharge: number;
  gasRegistrationFee: number;
  evAnnualTotal: number;
  gasAnnualTotal: number;
  annualSavings: number;
  evCostPerMile: number;
  gasCostPerMile: number;
  evNetUpfrontCost: number;
  gasUpfrontCost: number;
  netEvPremium: number;
  breakEvenYear: number | null;      // ceiling integer for display
  breakEvenYearExact: number | null; // raw float for reference line position
  tcoData: TcoDataPoint[];
  co2AvoidedKgPerYear: number;
  treesEquivalent: number;
  gasCo2KgPerYear: number;
  evCo2KgPerYear: number;
  flightsEquivalent: number;
  tenYearSavings: number;
}

// Typical used prices by model year — simple depreciation curves
export function typicalEvPrice(isNew: boolean, modelYear: number): number {
  if (isNew) return AUSTIN_EV_DEFAULTS.evNewPrice;
  const age = new Date().getFullYear() - modelYear;
  return Math.round(Math.max(14_000, AUSTIN_EV_DEFAULTS.evNewPrice * Math.pow(0.82, age)) / 500) * 500;
}

export function typicalGasPrice(isNew: boolean, modelYear: number): number {
  if (isNew) return AUSTIN_EV_DEFAULTS.gasNewPrice;
  const age = new Date().getFullYear() - modelYear;
  return Math.round(Math.max(6_000, AUSTIN_EV_DEFAULTS.gasNewPrice * Math.pow(0.85, age)) / 500) * 500;
}

export function typicalTradeInValue(modelYear: number): number {
  const age = new Date().getFullYear() - modelYear;
  return Math.round(Math.max(4_000, AUSTIN_EV_DEFAULTS.gasNewPrice * 0.88 * Math.pow(0.83, age)) / 500) * 500;
}

// ~40% of maintenance is fixed (time-based), ~60% scales with miles vs AAA baseline of 15k/yr
function scaledMaintenance(baseCost: number, annualMiles: number): number {
  const { maintenanceBaselineMiles: baseline, maintenanceVariableFraction: vf } = AUSTIN_EV_DEFAULTS;
  return Math.round(baseCost * ((1 - vf) + vf * (annualMiles / baseline)));
}

export function calcEffectiveMiPerKwh(miPerKwh: number, isNew: boolean, ageYears: number): number {
  if (isNew) return miPerKwh;
  return +(miPerKwh * (1 - AUSTIN_EV_DEFAULTS.batteryDegradationPerYear * ageYears)).toFixed(2);
}

export function calcEVResults(inputs: EVInputs): EVResults {
  const {
    mode, annualMiles, evMiPerKwh, gasMpg,
    electricityRatePerKwh, gasPricePerGal,
    evIsNew, gasModelYear, evModelYear, evPrice, gasPrice, gasTradeInValue,
  } = inputs;
  const ownGas = mode === "own-gas";
  const evVehicleAge = evIsNew ? 0 : Math.max(0, new Date().getFullYear() - evModelYear);

  const effectiveMiPerKwh = calcEffectiveMiPerKwh(evMiPerKwh, evIsNew, evVehicleAge);

  const evAnnualFuel = (annualMiles / Math.max(effectiveMiPerKwh, 0.1)) * electricityRatePerKwh;
  const gasAnnualFuel = (annualMiles / Math.max(gasMpg, 1)) * gasPricePerGal;

  const evAnnualMaintenance  = scaledMaintenance(AUSTIN_EV_DEFAULTS.evMaintenanceBasePerYear,  annualMiles);
  const gasAnnualMaintenance = scaledMaintenance(AUSTIN_EV_DEFAULTS.gasMaintenanceBasePerYear, annualMiles);
  const evRegistrationSurcharge = TX_BASE_REGISTRATION_FEE + TX_EV_REGISTRATION_SURCHARGE;
  const gasRegistrationFee = TX_BASE_REGISTRATION_FEE;

  const evAnnualTotal = evAnnualFuel + evAnnualMaintenance + evRegistrationSurcharge;
  const gasAnnualTotal = gasAnnualFuel + gasAnnualMaintenance + gasRegistrationFee;

  const annualSavings = gasAnnualTotal - evAnnualTotal;

  const evCostPerMile = electricityRatePerKwh / Math.max(effectiveMiPerKwh, 0.1);
  const gasCostPerMile = gasPricePerGal / Math.max(gasMpg, 1);

  // own-gas: you already own the gas vehicle ($0 upfront), trade-in offsets EV cost
  const gasUpfrontCost = ownGas ? 0 : gasPrice;
  const evNetUpfrontCost = ownGas
    ? Math.max(0, evPrice - gasTradeInValue)
    : evPrice;
  const netEvPremium = evNetUpfrontCost - gasUpfrontCost;

  let breakEvenYear: number | null = null;
  let breakEvenYearExact: number | null = null;
  if (netEvPremium <= 0) {
    breakEvenYear = 0;
    breakEvenYearExact = 0;
  } else if (annualSavings > 0) {
    const raw = netEvPremium / annualSavings;
    if (raw <= TCO_YEARS) {
      breakEvenYearExact = raw;
      breakEvenYear = Math.ceil(raw);
    }
  }

  // Build 10-year TCO curve with fuel cost inflation
  const tcoData: TcoDataPoint[] = [];
  let evCumulative = evNetUpfrontCost;
  let gasCumulative = gasUpfrontCost;
  tcoData.push({ year: 0, ev: Math.round(evCumulative), gas: Math.round(gasCumulative) });

  let tenYearSavings = 0;
  for (let year = 1; year <= TCO_YEARS; year++) {
    const elecInfl = Math.pow(1 + AUSTIN_EV_DEFAULTS.electricityInflationRate, year - 1);
    const gasInfl = Math.pow(1 + AUSTIN_EV_DEFAULTS.gasPriceInflationRate, year - 1);
    evCumulative += evAnnualFuel * elecInfl + evAnnualMaintenance + evRegistrationSurcharge;
    gasCumulative += gasAnnualFuel * gasInfl + gasAnnualMaintenance + gasRegistrationFee;
    tcoData.push({ year, ev: Math.round(evCumulative), gas: Math.round(gasCumulative) });
    if (year === TCO_YEARS) {
      tenYearSavings = Math.round(gasCumulative - evCumulative);
    }
  }

  const gasCo2KgPerYear = (annualMiles / Math.max(gasMpg, 1)) * CO2_KG_PER_GAL_GAS;
  const evCo2KgPerYear = (annualMiles / Math.max(effectiveMiPerKwh, 0.1)) * (ERCOT_CO2_KG_PER_MWH / 1000);
  const co2AvoidedKgPerYear = Math.max(0, gasCo2KgPerYear - evCo2KgPerYear);
  const treesEquivalent = Math.round(co2AvoidedKgPerYear / CO2_KG_PER_TREE_YEAR);
  const flightsEquivalent = Math.round(co2AvoidedKgPerYear / CO2_KG_PER_FLIGHT_ROUNDTRIP);

  return {
    effectiveMiPerKwh,
    evAnnualFuel,
    gasAnnualFuel,
    evAnnualMaintenance,
    gasAnnualMaintenance,
    evRegistrationSurcharge,
    gasRegistrationFee,
    evAnnualTotal,
    gasAnnualTotal,
    annualSavings,
    evCostPerMile,
    gasCostPerMile,
    evNetUpfrontCost,
    gasUpfrontCost,
    netEvPremium,
    breakEvenYear,
    breakEvenYearExact,
    tcoData,
    co2AvoidedKgPerYear,
    treesEquivalent,
    gasCo2KgPerYear,
    evCo2KgPerYear,
    flightsEquivalent,
    tenYearSavings,
  };
}
