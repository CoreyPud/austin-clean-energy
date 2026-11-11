// AUSTIN ENERGY GRID FLOW MAP — page content and reference data.
// The model itself (substations, buildings, shapes, shares) is /data/grid-flow-model.json;
// the hourly plant output is /data/grid-flow-hourly-fy2024.csv. Both are built by the
// scripts in this project and are not edited by hand.

import type { SourceKey } from "./grid-flow-engine";

export const MODEL_URL = "/data/grid-flow-model.json";
export const HOURLY_URL = "/data/grid-flow-hourly-fy2024.csv";
export const REFERENCE_LABEL = "FY2024";
export const REFERENCE_START = "2023-10-01";
export const REFERENCE_END = "2024-09-30";

export const AUSTIN = { lon: -97.7431, lat: 30.2672 };

// Closer view: the box that holds the substations and located buildings.
export const CLOSE_BOX = { west: -98.02, east: -97.45, south: 30.06, north: 30.52 };
// Texas overview box.
export const TEXAS_BOX = { west: -106.8, east: -93.4, south: 25.7, north: 36.7 };

// Texas border: US Census state boundary (public domain), simplified.
export const TEXAS_RING: Array<[number, number]> = [[-101.8129,36.5019],[-100.0001,36.5019],[-100.0001,34.563],[-99.9234,34.574],[-99.6988,34.3823],[-99.5784,34.4151],[-99.2607,34.4042],[-99.1895,34.2125],[-98.9868,34.2235],[-98.7678,34.1358],[-98.5706,34.1468],[-98.4884,34.0646],[-98.3625,34.1577],[-98.1708,34.1139],[-98.0886,34.0044],[-97.9462,33.9879],[-97.8695,33.851],[-97.6943,33.9825],[-97.4588,33.9058],[-97.3711,33.8236],[-97.2561,33.862],[-97.174,33.736],[-96.922,33.9606],[-96.8508,33.8455],[-96.6318,33.8455],[-96.4236,33.7743],[-96.347,33.6867],[-96.1498,33.8401],[-95.9362,33.8894],[-95.8376,33.8346],[-95.6021,33.9332],[-95.5473,33.8784],[-95.2899,33.8729],[-95.2242,33.9606],[-94.9668,33.862],[-94.8682,33.747],[-94.4848,33.6374],[-94.3807,33.5443],[-94.1836,33.5936],[-94.0412,33.5498],[-94.0412,33.0185],[-94.0412,31.9943],[-93.8221,31.7753],[-93.8166,31.5562],[-93.5428,31.1509],[-93.5263,30.9373],[-93.6304,30.6799],[-93.729,30.5758],[-93.6961,30.4389],[-93.7673,30.3348],[-93.6906,30.1431],[-93.9261,29.7871],[-93.8385,29.6885],[-94.0028,29.6831],[-94.5231,29.5461],[-94.7094,29.6228],[-94.7422,29.7871],[-94.8737,29.6721],[-94.9668,29.6995],[-95.0161,29.5571],[-94.912,29.4969],[-94.8956,29.3106],[-95.0818,29.1135],[-95.383,28.867],[-95.9855,28.6041],[-96.0457,28.6479],[-96.2265,28.5822],[-96.2319,28.6425],[-96.4784,28.5986],[-96.5934,28.7246],[-96.6646,28.6972],[-96.4017,28.4398],[-96.5934,28.3577],[-96.7742,28.4069],[-96.8015,28.2262],[-97.0261,28.04],[-97.2561,27.6949],[-97.404,27.3335],[-97.5135,27.3608],[-97.5409,27.2294],[-97.4259,27.2623],[-97.4807,26.9994],[-97.5574,26.9884],[-97.5628,26.8405],[-97.4697,26.7584],[-97.4423,26.4572],[-97.3328,26.3531],[-97.3054,26.1614],[-97.2178,25.9916],[-97.5245,25.8876],[-97.6505,26.019],[-97.886,26.0683],[-98.1982,26.0573],[-98.4665,26.2216],[-98.6692,26.2381],[-98.8225,26.3695],[-99.0307,26.4133],[-99.1731,26.5393],[-99.2662,26.8405],[-99.4469,27.0213],[-99.425,27.1746],[-99.5071,27.3389],[-99.4798,27.4813],[-99.6057,27.6402],[-99.7098,27.6566],[-99.8796,27.799],[-99.9344,27.9797],[-100.0822,28.1441],[-100.2958,28.281],[-100.3999,28.5822],[-100.4985,28.6644],[-100.6299,28.9053],[-100.6737,29.1025],[-100.7997,29.2449],[-101.0133,29.3709],[-101.0626,29.4585],[-101.2598,29.5352],[-101.4131,29.7543],[-101.8513,29.8036],[-102.1142,29.7926],[-102.3387,29.8693],[-102.388,29.7652],[-102.629,29.7324],[-102.8097,29.5242],[-102.9193,29.1901],[-102.9795,29.1847],[-103.1165,28.9875],[-103.2808,28.982],[-103.5272,29.1354],[-104.1461,29.3818],[-104.2666,29.5133],[-104.5076,29.6393],[-104.6774,29.9241],[-104.6883,30.1815],[-104.8581,30.3896],[-104.8965,30.5703],[-105.006,30.6854],[-105.3949,30.8551],[-105.603,31.0852],[-105.7728,31.1673],[-105.9535,31.3645],[-106.2054,31.4686],[-106.3807,31.7314],[-106.5286,31.7862],[-106.6436,31.9012],[-106.6162,31.9998],[-103.0672,31.9998],[-103.0672,33.0021],[-103.0453,34.0153],[-103.0398,36.5019],[-103.0014,36.5019],[-101.8129,36.5019]];

export const landmarks: Array<{ name: string; lon: number; lat: number }> = [
  { name: "Downtown", lon: -97.7431, lat: 30.2672 },
  { name: "The Domain", lon: -97.725, lat: 30.4025 },
  { name: "Airport", lon: -97.6699, lat: 30.1945 },
  { name: "Pflugerville", lon: -97.62, lat: 30.4394 },
  { name: "South Austin", lon: -97.8, lat: 30.162 },
];

export const sourceMeta: Record<SourceKey, { label: string; cssVar: string; note: string }> = {
  nuclear: { label: "Nuclear (STP)", cssVar: "--gf-nuclear", note: "Austin Energy's share of South Texas Project, Matagorda County" },
  coal: { label: "Coal (Fayette)", cssVar: "--gf-coal", note: "Austin Energy's share of Fayette Power Project, Fayette County" },
  gas: { label: "Gas combined cycle", cssVar: "--gf-gas", note: "Sand Hill combined cycle" },
  peaker: { label: "Gas peakers", cssVar: "--gf-peaker", note: "Sand Hill and Decker Creek gas turbines" },
  biomass: { label: "Biomass", cssVar: "--gf-biomass", note: "Nacogdoches Power" },
  solar: { label: "Solar", cssVar: "--gf-solar", note: "Local (East Blackland, Webberville) and West Texas contracts" },
  wind: { label: "Wind", cssVar: "--gf-wind", note: "South Texas, Gulf coast and Panhandle contracts" },
  ercot: { label: "Rest of ERCOT", cssVar: "--gf-ercot", note: "The shortfall between the fleet and Austin's load, bought on the grid" },
};

export interface Preset {
  key: string;
  label: string;
  date: string;
  hour: number;
  blurb: string;
}
export const presets: Preset[] = [
  { key: "summer", label: "Summer peak, 4 pm", date: "2024-08-21", hour: 16, blurb: "The FY2024 system peak. Local gas runs hard and the biggest flows stay close to town." },
  { key: "winter", label: "Winter morning peak", date: "2024-01-16", hour: 8, blurb: "The January peak. Coal and nuclear carry the long haul; the peakers are on." },
  { key: "spring", label: "Spring midday", date: "2024-04-10", hour: 13, blurb: "Mild load, big solar and wind. Fleet output roughly matches load, so little is bought." },
  { key: "wind", label: "Windy night", date: "2024-01-08", hour: 2, blurb: "Wind from the Panhandle and the Gulf coast covers the load and then some, so the fleet exports." },
];

export type Tag = "reported" | "derived" | "benchmarked" | "scenario" | "blocked";

export const provenance: Array<{ what: string; tag: Tag; detail: string }> = [
  { what: "Plant output, every hour", tag: "reported", detail: "21 Austin Energy plants and contracts, hourly MW for FY2024, rebuilt from Chris Gillett's published 15-minute node data (ERCOT settlement points). The same series drives the Digital Twin." },
  { what: "Plant locations", tag: "derived", detail: "Approximate site coordinates, the same ones the Digital Twin fleet table uses." },
  { what: "System load", tag: "derived", detail: "The Digital Twin's hourly load for Austin Energy's zone: ERCOT South Central hourly load scaled to Austin's peak. Not Austin Energy's own meter data." },
  { what: "Building locations", tag: "derived", detail: "Travis CAD commercial improvements (your classified file), each placed at the centre of its tax parcel from Travis County's public parcel layer." },
  { what: "Building loads", tag: "benchmarked", detail: "Annual kWh from your TCAD file, shaped by NREL ComStock 15-minute profiles for the building type, with assumed weekend and monthly factors." },
  { what: "Substation locations", tag: "derived", detail: "HIFLD substation points, mapped from imagery around 2015 to 2017. No owner, no capacity, and some are not Austin Energy's. Treat each dot as 'a substation about here'." },
  { what: "Which substation serves which building", tag: "blocked", detail: "Nearest substation by straight-line distance. Austin Energy's feeder map is not public." },
  { what: "How each plant's power reaches each substation", tag: "blocked", detail: "Real flows follow Kirchhoff's laws on a network we do not have. The map uses a distance-weighted allocation that balances at every hour; it shows scale and direction, not line loadings." },
];

export const assumptions: Array<{ label: string; value: string; why: string }> = [
  { label: "Commercial share of load", value: "55% of annual energy", why: "Assumed. Splits system load into the part that follows commercial-building shapes and the rest (homes, industry, street lighting), which is spread by substation using commercial kWh and new residential permits." },
  { label: "Distance decay", value: "22 km", why: "Assumed. Each plant's power prefers substations near its entry point; shorter decay keeps more of a plant's output local." },
  { label: "Where remote plants enter", value: "Nearest 345 kV substation", why: "Remote plants and the rest of ERCOT enter at the 345 kV substations on the east side (Austrop, Dunlap, Decker, Dessau)." },
  { label: "Local plants", value: "Nearest substation", why: "Sand Hill, Decker Creek, East Blackland and Webberville inject at the closest substation." },
  { label: "Building reach", value: "9 km", why: "A building more than 9 km from any kept substation is dropped rather than assigned to a far one." },
];

export const limitations: string[] = [
  "This is a schematic. Electricity cannot be traced from one generator to one building. The lines show how much of each source's output is allocated to each part of town so that every hour balances, not which wires carry it.",
  "Substation dots are approximate and unverified for Austin Energy. The list was filtered to the Austin area, with line taps removed, and may include substations that other utilities own and omit some Austin Energy has built since 2017.",
  "Located buildings carry about 5.7 TWh of the 8.2 TWh in your TCAD file, because some parcels did not resolve and some buildings sit outside the substation area. Each cell's commercial load is spread across the buildings that were placed, so a dot's load is a relative figure, not a meter reading.",
  "Imports from the rest of ERCOT are drawn at the 345 kV substations. In FY2024 the fleet produced less than the zone's load in most hours; the gap is power bought on the grid at the load-zone price.",
  "The load is a proxy built from ERCOT's South Central zone. It is the weakest link in the chain, and the one Austin Energy's own 15-minute meter data would replace.",
];

export const typeLabels: Record<string, string> = {
  fullservicerestaurant: "Full-service restaurant",
  hospital: "Hospital",
  largehotel: "Large hotel",
  largeoffice: "Large office",
  mediumoffice: "Medium office",
  outpatient: "Outpatient clinic",
  primaryschool: "Primary school",
  quickservicerestaurant: "Quick-service restaurant",
  retailstandalone: "Standalone retail",
  retailstripmall: "Strip-mall retail",
  secondaryschool: "Secondary school",
  smallhotel: "Small hotel",
  smalloffice: "Small office",
  warehouse: "Warehouse",
};

export const clusterLabels: Array<{ label: string; groups: string[] }> = [
  { label: "West Texas solar", groups: ["solarWest"] },
  { label: "Rio Grande and coast wind", groups: ["windSouth"] },
  { label: "Panhandle wind", groups: ["windWest"] },
];
