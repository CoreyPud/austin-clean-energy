// Source: CarGurus Price Trends, June 2026 — cargurus.com/research/price-trends/<Model-dID>
// New MSRP = manufacturer base price, current model year
// EV efficiency = EPA combined; gas mpg = EPA combined
// CarGurus d-IDs noted per model for spot-checking
// ⚠ Models with only 1–2 used years have thin data — handle with care
// ⚠ Discontinued models: usedPrices from CarGurus June 2026 listings (very sparse inventory)

export interface VehicleModel {
  make: string;
  model: string;
  msrp: number;
  miPerKwh: number;
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
    msrp: 40_240, miPerKwh: 4.0,
    usedPrices: { 2019: 20_800, 2020: 22_600, 2021: 23_700, 2022: 26_000, 2023: 27_800, 2024: 36_500 },
  },
  {
    make: "Tesla", model: "Model Y",      // CarGurus d3044
    msrp: 43_990, miPerKwh: 3.5,
    usedPrices: { 2020: 25_300, 2021: 27_300, 2022: 30_300, 2023: 33_600, 2024: 36_800 },
  },
  {
    make: "Tesla", model: "Model S",      // CarGurus d2039
    msrp: 74_990, miPerKwh: 3.3,
    // Jump 2020→2021 reflects Plaid refresh; 2024 not in CarGurus data
    usedPrices: { 2019: 29_800, 2020: 32_300, 2021: 46_400, 2022: 48_900, 2023: 57_000 },
  },
  {
    make: "Tesla", model: "Model X",      // CarGurus d2132
    msrp: 79_990, miPerKwh: 2.9,
    // 2021 not in CarGurus table; 2021 follows Plaid refresh like Model S
    usedPrices: { 2019: 32_700, 2020: 36_100, 2022: 56_700, 2023: 62_600, 2024: 72_900 },
  },
  {
    make: "Chevy", model: "Equinox EV",   // CarGurus d3267 — only 2024 in used market
    msrp: 34_995, miPerKwh: 3.4,
    usedPrices: { 2024: 27_500 },
  },
  {
    make: "Chevy", model: "Bolt EUV",     // CarGurus d3116 — discontinued after 2023
    msrp: 27_495, miPerKwh: 3.5, discontinued: true,
    usedPrices: { 2022: 20_600, 2023: 21_600 },
  },
  {
    make: "Ford", model: "Mustang Mach-E", // CarGurus d2990
    msrp: 42_995, miPerKwh: 3.0,
    usedPrices: { 2021: 24_000, 2022: 28_100, 2023: 33_100, 2024: 34_600 },
  },
  {
    make: "Ford", model: "F-150 Lightning", // CarGurus d3147
    msrp: 49_995, miPerKwh: 2.3,
    usedPrices: { 2022: 41_700, 2023: 46_300, 2024: 50_900 },
  },
  {
    make: "Hyundai", model: "Ioniq 5",    // CarGurus d3120
    msrp: 41_450, miPerKwh: 3.5,
    usedPrices: { 2022: 22_600, 2023: 28_100, 2024: 28_400 },
  },
  {
    make: "Hyundai", model: "Ioniq 6",    // CarGurus d3297
    msrp: 38_615, miPerKwh: 4.2,
    usedPrices: { 2023: 25_700, 2024: 25_800 },
  },
  {
    make: "Kia", model: "EV6",            // CarGurus d3127
    msrp: 42_600, miPerKwh: 3.7,
    usedPrices: { 2022: 23_900, 2023: 28_800, 2024: 29_800 },
  },
  {
    make: "Kia", model: "EV9",
    msrp: 54_900, miPerKwh: 3.0,
    usedPrices: { 2024: 48_000 },         // sparse used market — rough estimate
  },
  {
    make: "Volkswagen", model: "ID.4",    // CarGurus d3098
    msrp: 38_995, miPerKwh: 3.2,
    usedPrices: { 2021: 19_900, 2022: 22_000, 2023: 24_700, 2024: 25_100 },
  },
  {
    make: "Rivian", model: "R1T",         // CarGurus d2837 + c32771
    msrp: 69_900, miPerKwh: 2.5,
    usedPrices: { 2022: 52_600, 2023: 57_500 },
  },
  {
    make: "Rivian", model: "R1S",         // CarGurus d2839
    msrp: 75_900, miPerKwh: 2.4,
    usedPrices: { 2023: 65_900, 2024: 72_400 },
  },
  {
    make: "BMW", model: "i4",             // CarGurus d3155
    msrp: 52_200, miPerKwh: 3.2,
    usedPrices: { 2023: 34_500, 2024: 39_300 },
  },
  {
    make: "Cadillac", model: "Lyriq",     // CarGurus d3157
    msrp: 58_590, miPerKwh: 3.3,
    usedPrices: { 2024: 42_000 },
  },
  {
    make: "Honda", model: "Prologue",
    msrp: 47_400, miPerKwh: 3.2,
    usedPrices: { 2024: 38_000 },         // sparse used market — rough estimate
  },
  {
    make: "Polestar", model: "2",         // CarGurus d3036
    msrp: 47_495, miPerKwh: 3.4,
    usedPrices: { 2022: 23_700, 2023: 28_600, 2024: 31_700 },
  },
  {
    make: "Nissan", model: "Leaf",        // CarGurus d2077 — sparse year coverage
    msrp: 28_040, miPerKwh: 3.0,
    usedPrices: { 2019: 11_200, 2023: 17_500 },
  },
  {
    make: "GMC", model: "Sierra EV",
    msrp: 57_400, miPerKwh: 2.8,
    usedPrices: { 2024: 50_000 },         // sparse used market — rough estimate
  },

  // ── Discontinued / used-only models ──────────────────────────────────────────
  // usedPrices: CarGurus listing-page ranges, June 2026 (very thin inventory)
  // Midpoints of listed price ranges used; interpolated years marked with //~
  {
    make: "Hyundai", model: "Ioniq Electric", // CarGurus d2684 — discontinued after 2021
    msrp: 33_045, miPerKwh: 3.8, discontinued: true,
    // 2017: $9k–$13k range · 2019: $11.7k–$15.2k · 2020: $12k–$17.9k · 2021: $14.3k–$15.5k
    // 2018 interpolated; 2020 wide spread reflects two battery sizes (28 kWh vs 38.3 kWh)
    usedPrices: { 2017: 11_000, 2018: 12_500, 2019: 13_500, 2020: 15_000, 2021: 15_000 },
  },
  {
    make: "Chevy", model: "Bolt EV",       // CarGurus d2397 — discontinued after 2023
    msrp: 26_500, miPerKwh: 3.5, discontinued: true,
    // 2019: $15,804 avg · 2020: $16,249 avg · 2023: $20,280 avg (CarGurus price-trends)
    // 2017, 2018, 2021, 2022 interpolated //~
    usedPrices: { 2017: 13_000, 2018: 14_000, 2019: 15_800, 2020: 16_200, 2021: 17_500, 2022: 19_000, 2023: 20_300 },
  },
  {
    make: "BMW", model: "i3",              // CarGurus d2263 — discontinued after 2021
    msrp: 44_450, miPerKwh: 3.8, discontinued: true,
    // CarGurus overall avg $8,817 across all years; 2019–2021 avg ~$9.4k–$10.1k
    // All years estimated from those anchors //~
    usedPrices: { 2014: 7_000, 2015: 7_500, 2016: 8_000, 2017: 8_500, 2018: 9_000, 2019: 9_500, 2020: 10_000, 2021: 10_500 },
  },
];

export const GAS_MODELS: GasModel[] = [
  {
    make: "Toyota", model: "RAV4",        // CarGurus d306
    msrp: 30_225, mpg: 30,
    usedPrices: { 2019: 22_900, 2020: 23_700, 2021: 25_000, 2022: 27_900, 2023: 30_300, 2024: 31_100 },
  },
  {
    make: "Honda", model: "CR-V",         // CarGurus d589
    msrp: 31_895, mpg: 31,
    usedPrices: { 2019: 20_900, 2020: 23_300, 2021: 24_700, 2022: 26_900, 2023: 29_800, 2024: 31_000 },
  },
  {
    make: "Toyota", model: "Camry",       // CarGurus d292
    msrp: 28_400, mpg: 32,
    usedPrices: { 2019: 19_000, 2020: 20_600, 2021: 22_100, 2022: 23_700, 2023: 25_400, 2024: 26_600 },
  },
  {
    make: "Honda", model: "Accord",       // CarGurus d585
    msrp: 28_750, mpg: 33,
    usedPrices: { 2019: 19_300, 2020: 20_700, 2021: 22_300, 2022: 24_700, 2023: 24_600, 2024: 25_500 },
  },
  {
    make: "Toyota", model: "Corolla",     // CarGurus d295
    msrp: 22_050, mpg: 35,
    usedPrices: { 2019: 14_700, 2020: 16_500, 2021: 17_300, 2022: 19_000, 2023: 20_700, 2024: 21_400 },
  },
  {
    make: "Honda", model: "Civic",        // CarGurus d586
    msrp: 24_950, mpg: 36,
    usedPrices: { 2019: 17_800, 2020: 19_000, 2021: 19_700, 2022: 22_500, 2023: 24_600, 2024: 25_400 },
  },
  {
    make: "Mazda", model: "CX-5",         // CarGurus d2133
    msrp: 28_850, mpg: 26,
    usedPrices: { 2019: 19_300, 2020: 20_200, 2021: 22_000, 2022: 24_200, 2023: 25_900, 2024: 26_600 },
  },
  {
    make: "Ford", model: "F-150",         // CarGurus d337
    msrp: 36_805, mpg: 20,
    usedPrices: { 2019: 26_900, 2020: 29_600, 2021: 34_200, 2022: 39_200, 2023: 44_100, 2024: 48_800 },
  },
  {
    make: "Chevy", model: "Silverado 1500", // CarGurus d630
    msrp: 37_600, mpg: 20,
    usedPrices: { 2019: 27_300, 2020: 29_400, 2021: 32_200, 2022: 36_000, 2023: 40_100, 2024: 44_400 },
  },
  {
    make: "Toyota", model: "Tacoma",      // CarGurus d311
    msrp: 31_500, mpg: 22,
    usedPrices: { 2019: 29_800, 2020: 31_800, 2021: 33_200, 2022: 34_100, 2023: 37_400, 2024: 39_200 },
  },
  {
    make: "Chevy", model: "Equinox",      // CarGurus d616
    msrp: 28_000, mpg: 28,
    usedPrices: { 2019: 14_800, 2020: 16_000, 2021: 17_300, 2022: 20_200, 2023: 22_500, 2024: 23_700 },
  },
  {
    make: "Ford", model: "Explorer",      // CarGurus d334
    msrp: 37_650, mpg: 24,
    usedPrices: { 2019: 18_000, 2020: 22_900, 2021: 24_900, 2022: 29_400, 2023: 33_300, 2024: 35_800 },
  },
  {
    make: "Toyota", model: "Highlander",  // CarGurus d298
    msrp: 38_005, mpg: 24,
    usedPrices: { 2019: 24_400, 2020: 28_400, 2021: 30_500, 2022: 33_700, 2023: 36_400, 2024: 39_200 },
  },
  {
    make: "BMW", model: "3 Series",       // CarGurus d1512
    msrp: 43_800, mpg: 28,
    usedPrices: { 2019: 20_800, 2020: 23_800, 2021: 26_400, 2022: 29_900, 2023: 35_600, 2024: 38_000 },
  },
  {
    make: "Toyota", model: "Tundra",      // CarGurus d313
    msrp: 38_555, mpg: 18,
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
