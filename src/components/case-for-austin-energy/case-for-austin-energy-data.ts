// Data for "The Case for Austin Energy" — sourced comparison of Austin's
// municipal utility against Gov. Abbott's 2026 deregulation proposal.
// See SOURCES at the bottom for citations.

export type BarColor = "muni" | "dereg";

export type BarRow = {
  label: string;
  sub: string;
  value: string;
  pct: number; // 0-100, width of the fill relative to the largest value in its chart
  color: BarColor;
};

export const PRICE_ROWS: BarRow[] = [
  { label: "Austin Energy", sub: "city-set base rate", value: "12.0¢/kWh", pct: 75, color: "muni" },
  { label: "Dallas (Oncor)", sub: "average of available retail plans", value: "14.0¢/kWh", pct: 88, color: "dereg" },
  { label: "Houston (CenterPoint)", sub: "average of available retail plans", value: "14.5¢/kWh", pct: 91, color: "dereg" },
  { label: "Texas statewide", sub: "average residential rate, if you don't shop", value: "15.9¢/kWh", pct: 100, color: "dereg" },
];

export const RELIABILITY_ROWS: BarRow[] = [
  { label: "Public power", sub: "avg. outage minutes/year, non-major events", value: "65 min", pct: 48, color: "muni" },
  { label: "Investor-owned", sub: "avg. outage minutes/year, non-major events", value: "136 min", pct: 100, color: "dereg" },
];

export type MixSegment = {
  label: string;
  pct: number;
  color: "muni" | "nuclear" | "dereg";
};

export type MixRow = {
  title: string;
  sourceNote: string;
  badge: string;
  segments: MixSegment[];
};

export const MIX_ROWS: MixRow[] = [
  {
    title: "Austin Energy",
    sourceNote: "self-reported, Q reported May 2026",
    badge: "73% carbon-free",
    segments: [
      { label: "Renewables 46%", pct: 46, color: "muni" },
      { label: "Nuclear 27%", pct: 27, color: "nuclear" },
      { label: "Gas & other 27%", pct: 27, color: "dereg" },
    ],
  },
  {
    title: "ERCOT statewide",
    sourceNote: "Jan–Sep 2025, EIA",
    badge: "≤57% carbon-free",
    segments: [
      { label: "Wind & Solar 36%", pct: 36, color: "muni" },
      { label: "Nuclear/Hydro/Other 21%", pct: 21, color: "nuclear" },
      { label: "Natural Gas 43%", pct: 43, color: "dereg" },
    ],
  },
];

export type Tile = { label: string; value: string; sub: string };

export const MONEY_TILES: Tile[] = [
  { label: "Transferred to Austin, 2025", value: "$125M", sub: "funds libraries, parks, emergency services" },
  { label: "Share of city budget", value: "~13%", sub: "depends on Austin Energy revenue transfers" },
  { label: "Mayor Watson's cost estimate", value: "$1B+", sub: "to unwind the utility, paid by customers" },
];

export type StanceCard = { text: string; cite: string };

export const STANCE_CARDS: StanceCard[] = [
  { text: "Says Austin Energy's bills already run lower than anywhere else on the ERCOT grid, muni or deregulated.", cite: "Cyrus Reed, Sierra Club" },
  { text: "Warns that beating a muni rate on the open market takes constant attention most households won't sustain.", cite: "Kaiba White, Public Citizen" },
  { text: "Estimates the switchover itself would be a multi-year undertaking costing customers over a billion dollars.", cite: "Kirk Watson, Mayor of Austin" },
  { text: "Maintains that opening the market to competition would save customers more than 10% on their bills.", cite: "Gov. Greg Abbott's office" },
];

export type Source = { title: string; url?: string };

export const SOURCES: Source[] = [
  { title: "Texas Tribune, “Disbanding city-owned utilities won't lower costs, officials say,” Sept 8, 2026", url: "https://www.texastribune.org/2026/09/08/texas-austin-energy-san-antonio-cps-abbott/" },
  { title: "Austin Chronicle, “What Would Abbott's Deregulation Plan Mean for Austin Energy Customers?”", url: "https://www.austinchronicle.com/news/what-would-abbotts-deregulation-plan-mean-for-austin-energy-customers/" },
  { title: "KUT, “Will Gov. Abbott's plan for Austin Energy lower prices?,” Aug 7, 2026", url: "https://www.kut.org/energy-environment/2026-08-07/austin-energy-texas-tx-greg-abbott-power-grid-ercot" },
  { title: "KXAN, “Abbott pushes plan to break up Austin Energy, CPS Energy monopolies”", url: "https://www.kxan.com/news/texas/governor-abbott-proposes-ending-austin-energys-monopoly-as-power-provider/" },
  { title: "American Public Power Association, “Public Power Is Consistently Reliable” (EIA data, 2013–2023, published March 2025)", url: "https://www.publicpower.org/periodical/article/public-power-consistently-reliable" },
  { title: "American Public Power Association, “How Public Power Compares to Other Electric Utilities”", url: "https://www.publicpower.org/periodical/article/how-public-power-compares-other-electric-utilities" },
  { title: "U.S. EIA, “ERCOT increasingly meets rising demand with solar, wind, and batteries”", url: "https://www.eia.gov/todayinenergy/detail.php?id=66464" },
  { title: "NuWatt Energy, Austin Energy rate history, 2026", url: "https://nuwattenergy.com/en/texas/austin-energy-rates-2026" },
  { title: "ElectricChoice.com, Texas electricity rates, Sept 2026", url: "https://www.electricchoice.com/electricity-prices-by-state/texas/" },
  { title: "Austin Electric Utility Commission meeting, May 11, 2026 (staff presentation on Austin Energy's Resource, Generation and Climate Protection Plan to 2035) — closed-caption transcript, Secret Vote project archive" },
];
