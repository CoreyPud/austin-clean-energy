// Source: CarGurus Price Trends, June 2026 — cargurus.com/research/price-trends/<Model-dID>
// New MSRP = manufacturer base price, 2025 model year (manufacturer websites, June 2026)
// mi_per_kwh = EPA combined (fueleconomy.gov, June 2026); LR RWD trim used where multiple exist
// gas mpg = EPA combined (fueleconomy.gov, June 2026)
// range_mi = EPA combined range (fueleconomy.gov via insideevs.com, greencarreports.com)
// CarGurus d-IDs noted per model for spot-checking
// ⚠ Models with only 1–2 used years have thin data — handle with care
// ⚠ Discontinued models: usedPrices from CarGurus June 2026 listings (very sparse inventory)

export interface VehicleModel {
  make: string;
  model: string;
  msrp: number;
  miPerKwh: number;
  rangeMi: Partial<Record<number, number>>;
  usedPrices: Partial<Record<number, number>>;
  discontinued?: boolean;
}

export interface GasModel {
  make: string;
  model: string;
  msrp: number;
  mpg: number;
  usedPrices: Partial<Record<number, number>>;
  discontinued?: boolean;
}

export const EV_MODELS: VehicleModel[] = [
  {
    make: "Tesla", model: "Model 3",      // CarGurus d2475
    msrp: 38_630, miPerKwh: 4.0,         // MSRP: tesla.com 2025; EPA: 25 kWh/100mi LR RWD
    rangeMi: { 2019: 325, 2020: 326, 2021: 358, 2022: 358, 2023: 333, 2024: 342 },
    usedPrices: { 2019: 20_800, 2020: 22_600, 2021: 23_700, 2022: 26_000, 2023: 27_800, 2024: 36_500 },
  },
  {
    make: "Tesla", model: "Model Y",      // CarGurus d3044
    msrp: 41_630, miPerKwh: 3.5,         // MSRP: tesla.com 2025; EPA: 28 kWh/100mi LR AWD
    rangeMi: { 2020: 316, 2021: 326, 2022: 330, 2023: 330, 2024: 310 },
    usedPrices: { 2020: 25_300, 2021: 27_300, 2022: 30_300, 2023: 33_600, 2024: 36_800 },
  },
  {
    make: "Tesla", model: "Model S",      // CarGurus d2039
    msrp: 79_990, miPerKwh: 3.7,         // MSRP: tesla.com 2025; EPA: 27 kWh/100mi (124 MPGe) standard
    rangeMi: { 2019: 370, 2020: 402, 2021: 405, 2022: 405, 2023: 405 },
    usedPrices: { 2019: 29_800, 2020: 32_300, 2021: 46_400, 2022: 48_900, 2023: 57_000 },
  },
  {
    make: "Tesla", model: "Model X",      // CarGurus d2132
    msrp: 84_990, miPerKwh: 2.9,         // MSRP: tesla.com 2025; EPA: 34 kWh/100mi (98 MPGe) standard
    rangeMi: { 2019: 325, 2020: 351, 2022: 348, 2023: 348, 2024: 335 },
    usedPrices: { 2019: 32_700, 2020: 36_100, 2022: 56_700, 2023: 62_600, 2024: 72_900 },
  },
  {
    make: "Chevy", model: "Equinox EV",   // CarGurus d3267 — only 2024 in used market
    msrp: 34_995, miPerKwh: 3.2,         // EPA: 31 kWh/100mi (104 MPGe) FWD 2LT
    rangeMi: { 2024: 319 },
    usedPrices: { 2024: 27_500 },
  },
  {
    make: "Chevy", model: "Bolt EUV",     // CarGurus d3116 — discontinued after 2023
    msrp: 28_795, miPerKwh: 3.4, discontinued: true,  // EPA: 29 kWh/100mi
    rangeMi: { 2022: 247, 2023: 247 },
    usedPrices: { 2022: 20_600, 2023: 21_600 },
  },
  {
    make: "Ford", model: "Mustang Mach-E", // CarGurus d2990
    msrp: 37_995, miPerKwh: 3.0,           // MSRP: ford.com 2025; EPA: ~33 kWh/100mi ER RWD
    rangeMi: { 2021: 305, 2022: 314, 2023: 303, 2024: 320 },
    usedPrices: { 2021: 24_000, 2022: 28_100, 2023: 33_100, 2024: 34_600 },
  },
  {
    make: "Ford", model: "F-150 Lightning", // CarGurus d3147
    msrp: 49_780, miPerKwh: 2.1,            // MSRP: ford.com 2025; EPA: 48 kWh/100mi ER 4WD
    rangeMi: { 2022: 320, 2023: 320, 2024: 320 },
    usedPrices: { 2022: 41_700, 2023: 46_300, 2024: 50_900 },
  },
  {
    make: "Hyundai", model: "Ioniq 5",    // CarGurus d3120
    msrp: 37_000, miPerKwh: 3.3,          // MSRP: hyundaiusa.com 2025; EPA: 30 kWh/100mi (114 MPGe) RWD
    rangeMi: { 2022: 303, 2023: 303, 2024: 303 },
    usedPrices: { 2022: 22_600, 2023: 28_100, 2024: 28_400 },
  },
  {
    make: "Hyundai", model: "Ioniq 6",    // CarGurus d3297
    msrp: 39_095, miPerKwh: 3.9,          // MSRP: hyundaiusa.com 2025; EPA: 26 kWh/100mi (132 MPGe) LR RWD 18"
    rangeMi: { 2023: 361, 2024: 361 },
    usedPrices: { 2023: 25_700, 2024: 25_800 },
  },
  {
    make: "Kia", model: "EV6",            // CarGurus d3127
    msrp: 42_900, miPerKwh: 3.3,          // MSRP: kia.com 2025; EPA: 30 kWh/100mi (114 MPGe) LR RWD
    rangeMi: { 2022: 310, 2023: 310, 2024: 310 },
    usedPrices: { 2022: 23_900, 2023: 28_800, 2024: 29_800 },
  },
  {
    make: "Kia", model: "EV9",
    msrp: 54_900, miPerKwh: 3.0,          // EPA: ~33 kWh/100mi LR RWD
    rangeMi: { 2024: 304 },
    usedPrices: { 2024: 48_000 },         // sparse used market — rough estimate
  },
  {
    make: "Volkswagen", model: "ID.4",    // CarGurus d3098
    msrp: 45_095, miPerKwh: 3.1,          // MSRP: vw.com 2025 Pro RWD; EPA: 32 kWh/100mi (104 MPGe) RWD
    rangeMi: { 2021: 260, 2022: 275, 2023: 275, 2024: 291 },
    usedPrices: { 2021: 19_900, 2022: 22_000, 2023: 24_700, 2024: 25_100 },
  },
  {
    make: "Rivian", model: "R1T",         // CarGurus d2837
    msrp: 80_900, miPerKwh: 2.3,          // MSRP: rivian.com 2025; EPA: 43 kWh/100mi (79 MPGe) Dual Std 20"
    rangeMi: { 2022: 314, 2023: 352 },
    usedPrices: { 2022: 52_600, 2023: 57_500 },
  },
  {
    make: "Rivian", model: "R1S",         // CarGurus d2839
    msrp: 82_900, miPerKwh: 2.3,          // MSRP: rivian.com 2025; EPA: ~44 kWh/100mi
    rangeMi: { 2023: 352, 2024: 400 },
    usedPrices: { 2023: 65_900, 2024: 72_400 },
  },
  {
    make: "BMW", model: "i4",             // CarGurus d3155
    msrp: 57_900, miPerKwh: 3.3,          // MSRP: bmwusa.com 2025 eDrive40; EPA: 30 kWh/100mi (112 MPGe) eDrive40 18"
    rangeMi: { 2023: 301, 2024: 301 },
    usedPrices: { 2023: 34_500, 2024: 39_300 },
  },
  {
    make: "Cadillac", model: "Lyriq",     // CarGurus d3157
    msrp: 58_595, miPerKwh: 2.8,          // EPA: 36 kWh/100mi (92 MPGe) RWD
    rangeMi: { 2024: 314 },
    usedPrices: { 2024: 42_000 },
  },
  {
    make: "Honda", model: "Prologue",
    msrp: 47_400, miPerKwh: 3.0,          // EPA: 33 kWh/100mi (104 MPGe) FWD
    rangeMi: { 2024: 296 },
    usedPrices: { 2024: 38_000 },         // sparse used market — rough estimate
  },
  {
    make: "Polestar", model: "2",         // CarGurus d3036
    msrp: 64_800, miPerKwh: 3.3,          // MSRP: polestar.com 2025 dual motor; EPA: 30 kWh/100mi (114 MPGe) SM 19"
    rangeMi: { 2022: 270, 2023: 270, 2024: 320 },
    usedPrices: { 2022: 23_700, 2023: 28_600, 2024: 31_700 },
  },
  {
    make: "Nissan", model: "Leaf",        // CarGurus d2077 — sparse year coverage
    msrp: 28_140, miPerKwh: 3.3,          // EPA: 30 kWh/100mi (111 MPGe) Leaf Plus
    rangeMi: { 2019: 226, 2023: 212 },
    usedPrices: { 2019: 11_200, 2023: 17_500 },
  },
  {
    make: "GMC", model: "Sierra EV",
    msrp: 91_995, miPerKwh: 2.1,          // MSRP: gmc.com 2025 Denali; EPA: 48 kWh/100mi (64 MPGe) Denali
    rangeMi: { 2024: 440 },
    usedPrices: { 2024: 50_000 },         // sparse used market — rough estimate
  },

  // ── Discontinued / used-only models ──────────────────────────────────────────
  // usedPrices: CarGurus listing-page ranges, June 2026 (very thin inventory)
  // Midpoints of listed price ranges used; interpolated years marked with //~
  {
    make: "Hyundai", model: "Ioniq Electric", // CarGurus d2684 — discontinued after 2021
    msrp: 33_045, miPerKwh: 3.8, discontinued: true,  // EPA: ~26 kWh/100mi (130 MPGe) 2021
    rangeMi: { 2017: 124, 2018: 124, 2019: 124, 2020: 170, 2021: 170 },
    usedPrices: { 2017: 11_000, 2018: 12_500, 2019: 13_500, 2020: 15_000, 2021: 15_000 },
  },
  {
    make: "Chevy", model: "Bolt EV",       // CarGurus d2397 — discontinued after 2023
    msrp: 26_500, miPerKwh: 3.5, discontinued: true,  // EPA: 28 kWh/100mi (118 MPGe)
    rangeMi: { 2017: 238, 2018: 238, 2019: 238, 2020: 259, 2021: 259, 2022: 259, 2023: 259 },
    usedPrices: { 2017: 13_000, 2018: 14_000, 2019: 15_800, 2020: 16_200, 2021: 17_500, 2022: 19_000, 2023: 20_300 },
  },
  {
    make: "BMW", model: "i3",              // CarGurus d2263 — discontinued after 2021
    msrp: 44_450, miPerKwh: 3.5, discontinued: true,  // EPA: ~31 kWh/100mi avg across generations
    rangeMi: { 2014: 81, 2015: 81, 2016: 81, 2017: 114, 2018: 114, 2019: 153, 2020: 153, 2021: 153 },
    usedPrices: { 2014: 7_000, 2015: 7_500, 2016: 8_000, 2017: 8_500, 2018: 9_000, 2019: 9_500, 2020: 10_000, 2021: 10_500 },
  },
];

export const GAS_MODELS: GasModel[] = [
  {
    make: "Toyota", model: "RAV4",        // CarGurus d306
    msrp: 28_850, mpg: 30,               // MSRP: toyota.com 2025 LE FWD; EPA: 28/35 → 30 combined
    usedPrices: { 2019: 22_900, 2020: 23_700, 2021: 25_000, 2022: 27_900, 2023: 30_300, 2024: 31_100 },
  },
  {
    make: "Honda", model: "CR-V",         // CarGurus d589
    msrp: 30_100, mpg: 30,               // MSRP: honda.com 2025 LX; EPA: 28/34 → 30 combined
    usedPrices: { 2019: 20_900, 2020: 23_300, 2021: 24_700, 2022: 26_900, 2023: 29_800, 2024: 31_000 },
  },
  {
    make: "Toyota", model: "Camry",       // CarGurus d292
    msrp: 28_400, mpg: 32,               // EPA: 28/37 → 32 combined
    usedPrices: { 2019: 19_000, 2020: 20_600, 2021: 22_100, 2022: 23_700, 2023: 25_400, 2024: 26_600 },
  },
  {
    make: "Honda", model: "Accord",       // CarGurus d585
    msrp: 28_750, mpg: 32,               // EPA: 29/37 → 32 combined
    usedPrices: { 2019: 19_300, 2020: 20_700, 2021: 22_300, 2022: 24_700, 2023: 24_600, 2024: 25_500 },
  },
  {
    make: "Toyota", model: "Corolla",     // CarGurus d295
    msrp: 22_050, mpg: 35,               // EPA: 32/40 → 35 combined
    usedPrices: { 2019: 14_700, 2020: 16_500, 2021: 17_300, 2022: 19_000, 2023: 20_700, 2024: 21_400 },
  },
  {
    make: "Honda", model: "Civic",        // CarGurus d586
    msrp: 24_950, mpg: 36,               // EPA: 32/41 → 36 combined
    usedPrices: { 2019: 17_800, 2020: 19_000, 2021: 19_700, 2022: 22_500, 2023: 24_600, 2024: 25_400 },
  },
  {
    make: "Mazda", model: "CX-5",         // CarGurus d2133
    msrp: 28_850, mpg: 27,               // EPA: 25/31 → 27 combined FWD
    usedPrices: { 2019: 19_300, 2020: 20_200, 2021: 22_000, 2022: 24_200, 2023: 25_900, 2024: 26_600 },
  },
  {
    make: "Ford", model: "F-150",         // CarGurus d337
    msrp: 41_405, mpg: 20,               // MSRP: ford.com 2025 XL Regular Cab 2WD; EPA: 20/26 combined avg
    usedPrices: { 2019: 26_900, 2020: 29_600, 2021: 34_200, 2022: 39_200, 2023: 44_100, 2024: 48_800 },
  },
  {
    make: "Chevy", model: "Silverado 1500", // CarGurus d630
    msrp: 37_600, mpg: 20,               // EPA: 18/24 → 20 combined (4.3L V6 4x2)
    usedPrices: { 2019: 27_300, 2020: 29_400, 2021: 32_200, 2022: 36_000, 2023: 40_100, 2024: 44_400 },
  },
  {
    make: "Toyota", model: "Tacoma",      // CarGurus d311
    msrp: 31_500, mpg: 22,               // EPA: 20/26 → 22 combined (2WD non-hybrid)
    usedPrices: { 2019: 29_800, 2020: 31_800, 2021: 33_200, 2022: 34_100, 2023: 37_400, 2024: 39_200 },
  },
  {
    make: "Chevy", model: "Equinox",      // CarGurus d616
    msrp: 28_000, mpg: 30,               // EPA: 26/34 → 30 combined (1.5L FWD)
    usedPrices: { 2019: 14_800, 2020: 16_000, 2021: 17_300, 2022: 20_200, 2023: 22_500, 2024: 23_700 },
  },
  {
    make: "Ford", model: "Explorer",      // CarGurus d334
    msrp: 37_650, mpg: 24,               // EPA: 21/29 → 24 combined RWD
    usedPrices: { 2019: 18_000, 2020: 22_900, 2021: 24_900, 2022: 29_400, 2023: 33_300, 2024: 35_800 },
  },
  {
    make: "Toyota", model: "Highlander",  // CarGurus d298
    msrp: 38_005, mpg: 24,               // EPA: 21/29 → 24 combined FWD
    usedPrices: { 2019: 24_400, 2020: 28_400, 2021: 30_500, 2022: 33_700, 2023: 36_400, 2024: 39_200 },
  },
  {
    make: "BMW", model: "3 Series",       // CarGurus d1512
    msrp: 43_800, mpg: 28,               // EPA: 25/33 → 28 combined (330i RWD)
    usedPrices: { 2019: 20_800, 2020: 23_800, 2021: 26_400, 2022: 29_900, 2023: 35_600, 2024: 38_000 },
  },
  {
    make: "Toyota", model: "Tundra",      // CarGurus d313
    msrp: 38_555, mpg: 18,               // EPA: 14/19 → 18 combined (V8, non-hybrid)
    usedPrices: { 2019: 35_100, 2020: 37_600, 2021: 39_800, 2022: 40_400, 2023: 44_800, 2024: 47_300 },
  },
];

// Lookup helpers
export function getEvUsedPrice(make: string, model: string, year: number): number | null {
  const m = EV_MODELS.find(v => v.make === make && v.model === model);
  return m?.usedPrices[year] ?? null;
}

export function getGasUsedPrice(make: string, model: string, year: number): number | null {
  const m = GAS_MODELS.find(v => v.make === make && v.model === model);
  return m?.usedPrices[year] ?? null;
}
