// EV model MSRP history — base/entry trim at model year launch
// Sources:
//   Tesla Model Y/3: Tesla.com pricing pages; price-change articles on Electrek + InsideEVs
//   Ford Mach-E: Ford Media Center press releases (media.ford.com)
//   Hyundai Ioniq 5: Hyundai Newsroom (hyundainews.com) annual pricing announcements
//   Kia EV6: Kia Media (kiamedia.com/us/en/media/pressreleases/18376 for 2022 launch)
//
// Trim notes:
//   Model Y — LR AWD (2020–21); LR AWD chip-shortage peak in 2022; SR RWD restored Jan 2023
//   Model 3 — SR+ base (2019–20); LR rose during chip shortage; Highland refresh 2025
//   Mach-E  — Select RWD (base available trim each year)
//   Ioniq 5 — SE Standard Range RWD (base trim each year)
//   EV6     — Light RWD in 2022 (discontinued after 2022); Wind RWD as base from 2023 onward

export interface ModelMsrpPoint {
  year: number;
  modelY: number | null;
  model3: number | null;
  machE:  number | null;
  ioniq5: number | null;
  ev6:    number | null;
}

export const evModelMsrpSeries: ModelMsrpPoint[] = [
  { year: 2019, modelY: null,   model3: 39_990, machE: null,   ioniq5: null,   ev6: null   },
  { year: 2020, modelY: 52_990, model3: 37_990, machE: null,   ioniq5: null,   ev6: null   },
  { year: 2021, modelY: 49_990, model3: 39_990, machE: 42_895, ioniq5: null,   ev6: null   },
  { year: 2022, modelY: 62_990, model3: 46_990, machE: 43_895, ioniq5: 39_950, ev6: 40_900 },
  { year: 2023, modelY: 43_990, model3: 40_240, machE: 42_995, ioniq5: 41_450, ev6: 48_700 },
  { year: 2024, modelY: 43_990, model3: 38_990, machE: 39_995, ioniq5: 43_175, ev6: 50_095 },
  { year: 2025, modelY: 44_990, model3: 42_490, machE: 36_495, ioniq5: 42_500, ev6: 51_795 },
  { year: 2026, modelY: 37_490, model3: 38_380, machE: 39_840, ioniq5: 35_000, ev6: 46_345 },
];
