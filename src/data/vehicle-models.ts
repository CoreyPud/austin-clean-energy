// Used prices sourced from iSeeCars depreciation studies + CarGurus avg listings, mid-2025
// New MSRP = base trim 2025 (or last model year if discontinued)
// miPerKwh = EPA combined rating, real-world ~10% lower

export interface VehicleModel {
  make: string;
  model: string;
  msrp: number;
  miPerKwh: number;
  usedPrices: Partial<Record<number, number>>;
}

export interface GasModel {
  make: string;
  model: string;
  msrp: number;
  mpg: number;
  usedPrices: Partial<Record<number, number>>;
}

export const EV_MODELS: VehicleModel[] = [
  {
    make: "Tesla", model: "Model 3",
    msrp: 40_240, miPerKwh: 4.0,
    usedPrices: { 2019: 19_000, 2020: 21_000, 2021: 23_500, 2022: 26_500, 2023: 29_000, 2024: 32_500 },
  },
  {
    make: "Tesla", model: "Model Y",
    msrp: 43_990, miPerKwh: 3.5,
    usedPrices: { 2020: 26_000, 2021: 28_500, 2022: 31_500, 2023: 34_000, 2024: 38_000 },
  },
  {
    make: "Tesla", model: "Model S",
    msrp: 74_990, miPerKwh: 3.3,
    usedPrices: { 2019: 40_000, 2020: 43_000, 2021: 45_000, 2022: 48_000, 2023: 52_000, 2024: 58_000 },
  },
  {
    make: "Tesla", model: "Model X",
    msrp: 79_990, miPerKwh: 2.9,
    usedPrices: { 2019: 46_000, 2020: 50_000, 2021: 52_000, 2022: 55_000, 2023: 58_000, 2024: 65_000 },
  },
  {
    make: "Chevy", model: "Equinox EV",
    msrp: 34_995, miPerKwh: 3.4,
    usedPrices: { 2024: 30_000 },
  },
  {
    make: "Chevy", model: "Bolt EUV",
    msrp: 27_495, miPerKwh: 3.5,
    usedPrices: { 2021: 16_000, 2022: 18_500, 2023: 21_000 },
  },
  {
    make: "Ford", model: "Mustang Mach-E",
    msrp: 42_995, miPerKwh: 3.0,
    usedPrices: { 2021: 25_000, 2022: 27_500, 2023: 30_500, 2024: 35_000 },
  },
  {
    make: "Ford", model: "F-150 Lightning",
    msrp: 49_995, miPerKwh: 2.3,
    usedPrices: { 2022: 45_000, 2023: 38_000, 2024: 42_000 },
  },
  {
    make: "Hyundai", model: "Ioniq 5",
    msrp: 41_450, miPerKwh: 3.5,
    usedPrices: { 2022: 27_500, 2023: 30_500, 2024: 34_000 },
  },
  {
    make: "Hyundai", model: "Ioniq 6",
    msrp: 38_615, miPerKwh: 4.2,
    usedPrices: { 2023: 28_000, 2024: 31_500 },
  },
  {
    make: "Kia", model: "EV6",
    msrp: 42_600, miPerKwh: 3.7,
    usedPrices: { 2022: 28_000, 2023: 31_000, 2024: 35_000 },
  },
  {
    make: "Kia", model: "EV9",
    msrp: 54_900, miPerKwh: 3.0,
    usedPrices: { 2024: 48_000 },
  },
  {
    make: "Volkswagen", model: "ID.4",
    msrp: 38_995, miPerKwh: 3.2,
    usedPrices: { 2021: 23_000, 2022: 25_000, 2023: 27_500, 2024: 31_000 },
  },
  {
    make: "Rivian", model: "R1T",
    msrp: 69_900, miPerKwh: 2.5,
    usedPrices: { 2022: 55_000, 2023: 52_000, 2024: 58_000 },
  },
  {
    make: "Rivian", model: "R1S",
    msrp: 75_900, miPerKwh: 2.4,
    usedPrices: { 2022: 58_000, 2023: 56_000, 2024: 62_000 },
  },
  {
    make: "BMW", model: "i4",
    msrp: 52_200, miPerKwh: 3.2,
    usedPrices: { 2022: 36_000, 2023: 38_000, 2024: 42_000 },
  },
  {
    make: "Cadillac", model: "Lyriq",
    msrp: 58_590, miPerKwh: 3.3,
    usedPrices: { 2023: 43_000, 2024: 48_000 },
  },
  {
    make: "Honda", model: "Prologue",
    msrp: 47_400, miPerKwh: 3.2,
    usedPrices: { 2024: 38_000 },
  },
  {
    make: "Polestar", model: "2",
    msrp: 47_495, miPerKwh: 3.4,
    usedPrices: { 2022: 27_000, 2023: 30_000, 2024: 35_000 },
  },
  {
    make: "Nissan", model: "Leaf",
    msrp: 28_040, miPerKwh: 3.0,
    usedPrices: { 2019: 12_000, 2020: 13_500, 2021: 14_500, 2022: 16_000, 2023: 18_000 },
  },
  {
    make: "GMC", model: "Sierra EV",
    msrp: 57_400, miPerKwh: 2.8,
    usedPrices: { 2024: 50_000 },
  },
];

export const GAS_MODELS: GasModel[] = [
  {
    make: "Toyota", model: "RAV4",
    msrp: 30_225, mpg: 30,
    usedPrices: { 2019: 22_000, 2020: 24_000, 2021: 28_000, 2022: 26_000, 2023: 27_000, 2024: 30_000 },
  },
  {
    make: "Honda", model: "CR-V",
    msrp: 31_895, mpg: 31,
    usedPrices: { 2019: 20_000, 2020: 21_000, 2021: 24_000, 2022: 25_000, 2023: 27_000, 2024: 30_000 },
  },
  {
    make: "Toyota", model: "Camry",
    msrp: 28_400, mpg: 32,
    usedPrices: { 2019: 16_000, 2020: 18_000, 2021: 20_000, 2022: 21_000, 2023: 23_000, 2024: 25_000 },
  },
  {
    make: "Honda", model: "Accord",
    msrp: 28_750, mpg: 33,
    usedPrices: { 2019: 16_000, 2020: 18_000, 2021: 20_000, 2022: 22_000, 2023: 24_000, 2024: 27_000 },
  },
  {
    make: "Toyota", model: "Corolla",
    msrp: 22_050, mpg: 35,
    usedPrices: { 2019: 13_000, 2020: 14_000, 2021: 16_000, 2022: 17_000, 2023: 18_500, 2024: 20_000 },
  },
  {
    make: "Honda", model: "Civic",
    msrp: 24_950, mpg: 36,
    usedPrices: { 2019: 13_500, 2020: 14_500, 2021: 17_000, 2022: 18_000, 2023: 19_500, 2024: 22_000 },
  },
  {
    make: "Mazda", model: "CX-5",
    msrp: 28_850, mpg: 26,
    usedPrices: { 2019: 18_000, 2020: 19_500, 2021: 22_000, 2022: 23_000, 2023: 24_000, 2024: 27_000 },
  },
  {
    make: "Ford", model: "F-150",
    msrp: 36_805, mpg: 20,
    usedPrices: { 2019: 28_000, 2020: 30_000, 2021: 34_000, 2022: 38_000, 2023: 36_000, 2024: 38_000 },
  },
  {
    make: "Chevy", model: "Silverado 1500",
    msrp: 37_600, mpg: 20,
    usedPrices: { 2019: 27_000, 2020: 29_000, 2021: 33_000, 2022: 36_000, 2023: 34_000, 2024: 37_000 },
  },
  {
    make: "Toyota", model: "Tacoma",
    msrp: 31_500, mpg: 22,
    usedPrices: { 2019: 25_000, 2020: 26_000, 2021: 31_000, 2022: 33_000, 2023: 34_000, 2024: 35_000 },
  },
  {
    make: "Chevy", model: "Equinox",
    msrp: 28_000, mpg: 28,
    usedPrices: { 2019: 16_000, 2020: 17_000, 2021: 20_000, 2022: 21_000, 2023: 22_000, 2024: 24_000 },
  },
  {
    make: "Ford", model: "Explorer",
    msrp: 37_650, mpg: 24,
    usedPrices: { 2019: 25_000, 2020: 26_000, 2021: 30_000, 2022: 31_000, 2023: 32_000, 2024: 35_000 },
  },
  {
    make: "Toyota", model: "Highlander",
    msrp: 38_005, mpg: 24,
    usedPrices: { 2019: 26_000, 2020: 28_000, 2021: 33_000, 2022: 34_000, 2023: 35_000, 2024: 37_000 },
  },
  {
    make: "BMW", model: "3 Series",
    msrp: 43_800, mpg: 28,
    usedPrices: { 2019: 24_000, 2020: 26_000, 2021: 29_000, 2022: 31_000, 2023: 34_000, 2024: 38_000 },
  },
  {
    make: "Toyota", model: "Tundra",
    msrp: 38_555, mpg: 18,
    usedPrices: { 2019: 30_000, 2020: 32_000, 2021: 38_000, 2022: 42_000, 2023: 40_000, 2024: 40_000 },
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
