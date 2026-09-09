// Austin Energy fleet-wide "adverse basis" cost, 2018-2026.
// Source: ERCOT day-ahead + real-time settlement data across ~30 Austin-Energy-related
// generation resources, computed by researcher Chris Gillett (same dataset behind the
// Peaker Ledger's Winter Storm Uri analysis). Dollars of adverse basis per MWh of fleet
// generation, by calendar year. 2018 and 2026 are partial years.

export type HistYear = {
  year: number;
  value: number;
  partial: boolean;
};

export const HIST: HistYear[] = [
  { year: 2018, value: 1.87, partial: true },
  { year: 2019, value: 2.60, partial: false },
  { year: 2020, value: 3.65, partial: false },
  { year: 2021, value: 11.60, partial: false },
  { year: 2022, value: 13.25, partial: false },
  { year: 2023, value: 13.54, partial: false },
  { year: 2024, value: 6.11, partial: false },
  { year: 2025, value: 7.17, partial: false },
  { year: 2026, value: 6.06, partial: true },
];

export const BASELINE_YEAR = 2025;
export const BASELINE_VAL = 7.17;
// Assumed fleet exposure: 2024-25 average annual generation volume across the same
// resource set, from the "Daily Data" / annual summary in gillett-annual-summary-2018-2026.csv.
export const FLEET_MWH = 12_000_000;
export const PROJECTION_END_YEAR = 2033;
