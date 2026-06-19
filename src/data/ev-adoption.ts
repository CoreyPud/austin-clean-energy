// Source: Atlas EV Hub / State DMV snapshots via DFW Clean Cities
// Austin = Travis County zip codes (78701–78759)
// Texas = all TX EV registrations in DMV snapshot
// Counts are cumulative registered EVs (BEV + PHEV, light-duty)
export const evAdoptionSeries = [
  { date: "2019-01-01", austin: 3570, texas: 24707 },
  { date: "2020-01-01", austin: 6678, texas: 43716 },
  { date: "2021-01-01", austin: 9503, texas: 64503 },
  { date: "2022-01-01", austin: 15327, texas: 110953 },
  { date: "2023-01-01", austin: 20935, texas: 164946 },
  { date: "2023-07-01", austin: 23600, texas: 203415 },
  { date: "2023-10-01", austin: 25026, texas: 225351 },
  { date: "2023-11-01", austin: 25842, texas: 234477 },
  { date: "2023-12-01", austin: 26268, texas: 239494 },
  { date: "2024-01-01", austin: 26824, texas: 245139 },
  { date: "2024-02-01", austin: 27537, texas: 253259 },
  { date: "2024-03-01", austin: 28344, texas: 260342 },
  { date: "2024-04-01", austin: 28823, texas: 265882 },
  { date: "2024-05-01", austin: 29726, texas: 274808 },
  { date: "2024-06-01", austin: 30302, texas: 281340 },
  { date: "2024-07-01", austin: 30694, texas: 287730 },
  { date: "2024-08-01", austin: 31597, texas: 296854 },
  { date: "2024-09-01", austin: 32183, texas: 304499 },
  { date: "2024-10-01", austin: 33015, texas: 314741 },
  { date: "2024-11-01", austin: 33645, texas: 322335 },
  { date: "2024-12-01", austin: 34125, texas: 328874 },
  { date: "2025-01-01", austin: 34704, texas: 337011 },
  { date: "2025-02-01", austin: 35483, texas: 346535 },
  { date: "2025-03-01", austin: 36330, texas: 356576 },
  { date: "2025-04-01", austin: 37057, texas: 365741 },
  { date: "2025-05-01", austin: 37907, texas: 373722 },
  { date: "2025-06-01", austin: 38509, texas: 382316 },
  { date: "2025-07-01", austin: 39241, texas: 392076 },
  { date: "2025-08-01", austin: 39778, texas: 396956 },
  { date: "2025-09-01", austin: 40495, texas: 404132 },
  { date: "2025-10-01", austin: 41439, texas: 422795 },
  { date: "2025-11-01", austin: 42507, texas: 437080 },
  { date: "2025-12-01", austin: 43260, texas: 448053 },
  { date: "2026-01-01", austin: 44078, texas: 454975 },
  { date: "2026-02-01", austin: 45471, texas: 462422 },
  { date: "2026-03-01", austin: 45980, texas: 466754 },
];

// Travis County estimated total registered vehicles (TxDMV annual reports)
export const TRAVIS_COUNTY_VEHICLES = 700_000;
// Texas total registered vehicles (TxDMV, ~2024)
export const TEXAS_TOTAL_VEHICLES = 23_000_000;
// US registered EV count — DOE AFDC Vehicle Technologies Office "Fact of the Week" series
// (currently registered light-duty BEV+PHEV, not cumulative sales)
export const usEvAnnual: { year: number; count: number }[] = [
  { year: 2019, count: 1_381_000 },
  { year: 2020, count: 1_735_000 },
  { year: 2021, count: 2_613_000 },
  { year: 2022, count: 3_310_000 },
  { year: 2023, count: 4_609_000 },
  { year: 2024, count: 5_800_000 },
  { year: 2025, count: 7_100_000 },
];
export const US_TOTAL_VEHICLES = 290_000_000;
