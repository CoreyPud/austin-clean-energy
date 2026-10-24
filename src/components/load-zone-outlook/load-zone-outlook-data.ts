// LOAD ZONE PRICE & INVESTMENT OUTLOOK — data file
// Secret Vote documentary project — built 2026-10-23
//
// Source: "ae-load-zone-20yr-price-projection.xlsx" (built 2026-10-12, Secret Vote/
// AE pricing over time/), which itself builds on "Austin_Energy_Wholesale_Cost_Report.docx"
// and companion workbook (2026-08-29). Every number below traces to a cell/row in that
// workbook; the workbook's own Sources tab lists primary citations. This file does not
// invent anything the workbook didn't already derive — it restructures it for the web page.
//
// TAG CONVENTION (matches the IRP Planning Interface and other Secret Vote Lovable tools):
//   reported     — stated directly by Austin Energy, ERCOT, EIA, NREL/Lazard, or a public filing
//   derived      — arithmetic on reported numbers
//   benchmarked  — an industry-standard curve (NREL ATB / Lazard) stands in for something
//                  not separately published
//   scenario     — this model's own Low/Base/High assumption, not a measured value
//   blocked      — no public figure exists; the gap is the finding

export type Tag = "reported" | "derived" | "benchmarked" | "scenario" | "blocked";

export interface SourceNote {
  tag: Tag;
  source: string;
}

// ---------------------------------------------------------------------------
// 1. THE HEADLINE: projected LZ_AEN wholesale price, 2026-2045
// ---------------------------------------------------------------------------
// LZ_AEN = ERCOT hub/system price + Austin Energy's own local basis/congestion premium.
// $/MWh, nominal. Full year-by-year detail; see methodology below for how each
// component is constructed.

export interface ProjectionYear {
  year: number;
  low: { hub: number; basis: number; total: number };
  base: { hub: number; basis: number; total: number };
  high: { hub: number; basis: number; total: number };
}

export const projection20yr: ProjectionYear[] = [
  { year: 2026, low: { hub: 30.30, basis: 5.65, total: 35.95 }, base: { hub: 31.04, basis: 5.99, total: 37.03 }, high: { hub: 32.24, basis: 6.32, total: 38.56 } },
  { year: 2027, low: { hub: 30.75, basis: 5.77, total: 36.52 }, base: { hub: 32.29, basis: 6.40, total: 38.69 }, high: { hub: 34.82, basis: 7.08, total: 41.89 } },
  { year: 2028, low: { hub: 31.21, basis: 5.88, total: 37.09 }, base: { hub: 33.58, basis: 6.85, total: 40.43 }, high: { hub: 37.60, basis: 7.92, total: 45.53 } },
  { year: 2029, low: { hub: 31.68, basis: 6.00, total: 37.68 }, base: { hub: 34.92, basis: 7.33, total: 42.25 }, high: { hub: 40.61, basis: 8.88, total: 49.49 } },
  { year: 2030, low: { hub: 32.16, basis: 6.12, total: 38.28 }, base: { hub: 36.32, basis: 7.85, total: 44.16 }, high: { hub: 43.86, basis: 9.94, total: 53.80 } },
  { year: 2031, low: { hub: 32.64, basis: 6.24, total: 38.88 }, base: { hub: 37.77, basis: 8.39, total: 46.16 }, high: { hub: 47.37, basis: 11.13, total: 58.50 } },
  { year: 2032, low: { hub: 33.13, basis: 6.37, total: 39.49 }, base: { hub: 39.28, basis: 8.98, total: 48.26 }, high: { hub: 51.16, basis: 12.47, total: 63.63 } },
  { year: 2033, low: { hub: 33.63, basis: 6.43, total: 40.06 }, base: { hub: 40.46, basis: 9.21, total: 49.67 }, high: { hub: 53.20, basis: 13.09, total: 66.30 } },
  { year: 2034, low: { hub: 34.13, basis: 6.49, total: 40.62 }, base: { hub: 41.67, basis: 9.44, total: 51.11 }, high: { hub: 55.33, basis: 13.75, total: 69.08 } },
  { year: 2035, low: { hub: 34.64, basis: 6.56, total: 41.20 }, base: { hub: 42.92, basis: 9.67, total: 52.60 }, high: { hub: 57.55, basis: 14.44, total: 71.98 } },
  { year: 2036, low: { hub: 35.16, basis: 6.62, total: 41.79 }, base: { hub: 44.21, basis: 9.91, total: 54.12 }, high: { hub: 59.85, basis: 15.16, total: 75.00 } },
  { year: 2037, low: { hub: 35.69, basis: 6.69, total: 42.38 }, base: { hub: 45.54, basis: 10.16, total: 55.70 }, high: { hub: 62.24, basis: 15.91, total: 78.16 } },
  { year: 2038, low: { hub: 36.22, basis: 6.76, total: 42.98 }, base: { hub: 46.90, basis: 10.42, total: 57.32 }, high: { hub: 64.73, basis: 16.71, total: 81.44 } },
  { year: 2039, low: { hub: 36.77, basis: 6.82, total: 43.59 }, base: { hub: 48.31, basis: 10.68, total: 58.99 }, high: { hub: 67.32, basis: 17.55, total: 84.87 } },
  { year: 2040, low: { hub: 37.32, basis: 6.89, total: 44.21 }, base: { hub: 49.76, basis: 10.94, total: 60.70 }, high: { hub: 70.01, basis: 18.42, total: 88.44 } },
  { year: 2041, low: { hub: 37.88, basis: 6.96, total: 44.84 }, base: { hub: 51.25, basis: 11.22, total: 62.47 }, high: { hub: 72.81, basis: 19.34, total: 92.16 } },
  { year: 2042, low: { hub: 38.45, basis: 7.03, total: 45.48 }, base: { hub: 52.79, basis: 11.50, total: 64.29 }, high: { hub: 75.73, basis: 20.31, total: 96.04 } },
  { year: 2043, low: { hub: 39.02, basis: 7.10, total: 46.13 }, base: { hub: 54.37, basis: 11.78, total: 66.16 }, high: { hub: 78.75, basis: 21.33, total: 100.08 } },
  { year: 2044, low: { hub: 39.61, basis: 7.17, total: 46.78 }, base: { hub: 56.00, basis: 12.08, total: 68.08 }, high: { hub: 81.91, basis: 22.39, total: 104.30 } },
  { year: 2045, low: { hub: 40.20, basis: 7.24, total: 47.45 }, base: { hub: 57.68, basis: 12.38, total: 70.07 }, high: { hub: 85.18, basis: 23.51, total: 108.69 } },
];

export const projectionReadout = {
  cagr: { low: 0.0147, base: 0.0341, high: 0.0561 },
  tag: "derived" as Tag,
  note: "2026→2045 compound annual growth rate of the total LZ_AEN price, by scenario.",
};

export const methodologyNote = {
  tag: "reported" as Tag,
  summary:
    "LZ_AEN price = ERCOT hub/system price + Austin's local basis (congestion) premium. The hub component is set by ERCOT-wide supply and demand (gas-CC marginal cost, moderated by statewide renewable buildout) — statewide load growth, including data centers anywhere on the grid, pushes this up for every zone. The basis component is the extra premium at Austin Energy's own transmission-constrained node — the channel through which nearby-but-not-AE load (Tesla's Travis County expansion, Samsung's Taylor fab, Blue Origin's Hutto facility) pushes directly on AE's own price, because those loads sit on the same constrained Central Texas import paths AE uses for its remote wind/solar. New local generation (the 2026 peaker + wind + battery) works the other way — it adds supply inside the constrained zone, which is Austin Energy's own stated rationale for siting generation locally.",
  hubBasis:
    "Hub price is trended from the 2025 ERCOT system-average price using NREL ATB 2024 and Lazard LCOE+ (June 2025) cost curves for gas combined-cycle (the technology that usually sets ERCOT's marginal price). Basis/congestion is trended from 2018–2026 actuals (two independently-sourced series that cross-validate within ~$1/MWh of each other), adjusted for the 2026 local generation additions and a load-growth uplift scenario sized to AE's and ERCOT's own disclosed large-load pipeline.",
  speculativeFlag:
    "The single most speculative lever in the whole model: the congestion/basis load-growth uplift rate (2%/7%/12% per year, 2026–2032) has no historical precedent to regress against, because Central Texas's data-center load wave is a 2024–2026 phenomenon. Treat it as the layer most worth revisiting as real interconnection data firms up.",
};

export const crossChecks = [
  {
    check: "EIA Short-Term Energy Outlook (Feb 2026): ERCOT 2027 wholesale price, high-data-center-demand scenario vs. baseline",
    benchmark: "+79% (~+$37/MWh on an implied ~$47/MWh baseline)",
    modelFigure: "Base scenario 2026→2027 hub growth: 4.0%/yr; High scenario: 8.0%/yr",
    read: "EIA's single-year spike is sharper than even this model's High scenario compound rate — read as confirmation of direction and order of magnitude (ERCOT/Texas is uniquely exposed to data-center load vs. other U.S. regions), not a number to mechanically match.",
    tag: "reported" as Tag,
  },
  {
    check: "AE's own historical basis/congestion cost, 2021–2023 (post-Uri, pre-2026-mitigation)",
    benchmark: "$11.60–$13.54/MWh",
    modelFigure: "Base scenario basis/congestion re-reaches $11.60/MWh in 2043",
    read: "If the Base scenario re-approaches 2021-level congestion before the mid-2030s, that's a flag that load growth is expected to erode most of the 2026 local-generation relief within a decade. It doesn't — 2043 is near the end of the window — which is itself worth stating plainly.",
    tag: "derived" as Tag,
  },
];

// ---------------------------------------------------------------------------
// 2. SUPPLY SIDE: the existing contract stack + what's rolling off
// ---------------------------------------------------------------------------

export interface ContractResource {
  name: string;
  fuel: "Gas" | "Coal" | "Nuclear" | "Wind" | "Solar" | "Battery" | "Biomass";
  mw: number;
  contractStart: number;
  contractEnd: number | "open";
  expiresInWindow: boolean;
  note?: string;
}

export const contractStack: ContractResource[] = [
  { name: "Sand Hill Energy Center", fuel: "Gas", mw: 595, contractStart: 2026, contractEnd: 2035, expiresInWindow: true, note: "AE 2020 Resource Plan requires retirement by 2035 or sooner; no specific date disclosed." },
  { name: "New 2026 Gas Peaker", fuel: "Gas", mw: 400, contractStart: 2026, contractEnd: 2061, expiresInWindow: false, note: "Approved May 2026; plotted at ~35-yr midpoint of reported 30–40yr life." },
  { name: "Fayette Power Project (AE 50% share)", fuel: "Coal", mw: 600, contractStart: 2026, contractEnd: 2035, expiresInWindow: true, note: "Original 2022 retirement deadline missed; folded into 2035 carbon-free goal, no firm date." },
  { name: "South Texas Project (AE 16% share)", fuel: "Nuclear", mw: 432, contractStart: 2026, contractEnd: 2047, expiresInWindow: false, note: "NRC license extension; Unit 1 to 2047, Unit 2 to 2048." },
  { name: "Wind contracts (9 PPAs, 2007–2026)", fuel: "Wind", mw: 1894.64, contractStart: 2007, contractEnd: 2041, expiresInWindow: true, note: "Whirlwind, Hackberry, Los Vientos II/III/IV, Whitetail, Jumbo Road, Karankawa, Raymond, Gulf Wind, Invenergy (Mills & Dickens, approved May 2026)." },
  { name: "Solar contracts (7 PPAs, 2011–2028)", fuel: "Solar", mw: 804, contractStart: 2011, contractEnd: 2056, expiresInWindow: true, note: "Webberville, Roserock, East Pecos, Upton County, Waymark, East Blacklands, SE Aragon, FM 812 Landfill, Big Sun." },
  { name: "Battery contracts (OCI + Jupiter Power II, 2026)", fuel: "Battery", mw: 300, contractStart: 2026, contractEnd: 2046, expiresInWindow: false, note: "Approved May/Jul 2026; 20-yr terms." },
  { name: "Nacogdoches Power (biomass)", fuel: "Biomass", mw: 105, contractStart: 2012, contractEnd: "open", expiresInWindow: false, note: "Owned outright, no contract end date." },
];

export const contractStackTotals = {
  totalActiveMw: 5528.64,
  expiringInWindowMw: 4255.64,
  tag: "derived" as Tag,
  note: "Of Austin Energy's ~5,529 MW active contracted/owned capacity in 2026, about 4,256 MW (77%) is scheduled to expire and need replacing somehow within this 20-year window — mostly the original wind/solar PPA fleet, plus Sand Hill and Fayette.",
};

export const replacementAssumption = {
  tag: "scenario" as Tag,
  note: "Expiring contracts are modeled as replaced 1:1 by the same technology at that year's NREL ATB / Lazard cost, except coal → gas combined-cycle (matching AE's own Nov 2023 Resource Generation Plan Update finding that a gas-CC portfolio modeled ~$1B/year cheaper than an all-renewables alternative). This is why the replacement cost curves — not the market price mechanism alone — are what pushes the model's average cost up over time: the fleet now retiring was contracted at 2007–2020-era prices; what replaces it is priced at 2030s-era capital costs, even before any load-growth effect on the clearing price.",
};

// ---------------------------------------------------------------------------
// 3. DEMAND SIDE: named large-load projects + the aggregate pipeline
// ---------------------------------------------------------------------------

export interface LoadGrowthProject {
  project: string;
  location: string;
  utility: string;
  inAeTerritory: boolean;
  scale: string;
  status: string;
  source: string;
}

export const namedLoadProjects: LoadGrowthProject[] = [
  {
    project: "Tesla Gigafactory Texas expansion",
    location: "Travis County (1 Tesla Rd, Austin)",
    utility: "Bluebonnet Electric Cooperative",
    inAeTerritory: false,
    scale: "+5.2M sq ft (~50% larger); $700–775M reported investment; MW demand not disclosed",
    status: "Construction underway since late 2024; targeted complete end of 2026",
    source: "CoStar Oct 2024; FreightWaves; kwhi.com",
  },
  {
    project: "Samsung Taylor semiconductor fab(s)",
    location: "Taylor, Williamson County",
    utility: "Oncor Electric Delivery",
    inAeTerritory: false,
    scale: "$17B+ first fab, expanding toward a reported $37–40B+ multi-fab campus; MW not disclosed by Samsung (leading-edge fabs at this scale typically draw 100s of MW, industry rule of thumb)",
    status: "First fab targeting 2026 risk production",
    source: "DataCenterDynamics; Samsung Newsroom; KVUE",
  },
  {
    project: "Blue Origin — Constellation Park",
    location: "Hutto, Williamson County",
    utility: "Oncor Electric Delivery (not confirmed in sources)",
    inAeTerritory: false,
    scale: "1.3M sq ft satellite/communications manufacturing campus; $554–650M; MW not disclosed. Not rocket manufacturing — that stays at Blue Origin's West Texas site, ~450 mi away",
    status: "Construction timeline not disclosed as of mid-2026",
    source: "RE Business Online; Fox7 Austin; Bisnow",
  },
  {
    project: "San Marcos data-center proposals",
    location: "Hays County",
    utility: "Not AE (Hays Co. / CenterPoint or Bluebonnet)",
    inAeTerritory: false,
    scale: "CloudBurst: proposed 1.2 GW hyperscale campus, designed to run on natural gas via pipeline rather than ERCOT grid power. Highlander SM One's 200-acre rezoning was REJECTED by San Marcos Council, Feb 2026",
    status: "CloudBurst targeting Q3 2026 ops; Highlander not proceeding as proposed",
    source: "ConnectCRE; Spectrum News, Feb 18 2026",
  },
];

export const aggregateLoadPipeline = [
  { metric: "Austin Energy's own system peak load", figure: "~3.1 GW", context: "Serving ~570,000 customers", tag: "reported" as Tag, source: "AE Dec 2025 staff memo, id=464919" },
  { metric: "Typical individual data-center request, historically", figure: "up to ~30 MW", context: "≈ enough for 6,000 homes", tag: "reported" as Tag, source: "AE Dec 2025 staff memo" },
  { metric: "Typical individual data-center request, now", figure: "~300 MW routinely; some 5,000–11,000 MW", context: "10x+ the historical norm; AE fielding “quite a few” such proposals", tag: "reported" as Tag, source: "AE Dec 2025 staff memo" },
  { metric: "ERCOT projected new load by 2028", figure: "70.5 GW", context: "Mostly data centers; AE's own memo notes the full amount may not materialize", tag: "reported" as Tag, source: "AE Dec 2025 staff memo, citing ERCOT" },
  { metric: "ERCOT projected peak demand by 2032 (upper-bound scenario)", figure: "~367.8 GW (~4.3x today)", context: "ERCOT's own CEO flagged this may overstate real load growth", tag: "reported" as Tag, source: "KXAN / ERCOT, 2026" },
  { metric: "EIA STEO (Feb 2026): ERCOT price impact of data-center demand, 2027", figure: "+$37/MWh, +79%", context: "Far larger than EIA's modeled uplift for any other U.S. region (PJM +4%, CA/SW +4%, NE/NYISO +5%)", tag: "reported" as Tag, source: "EIA STEO, Feb 2026" },
  { metric: "Local generation added inside AE's zone, 2026", figure: "~999 MW", context: "400 MW gas peaker + 299 MW wind + 300 MW battery — AE's own structural response", tag: "reported" as Tag, source: "Community Impact, May 21 2026; KUT" },
  { metric: "Local generation retired inside AE's zone since Uri (2021)", figure: "~725 MW (45% of local generation capacity)", context: "Not yet fully offset as of mid-2026", tag: "reported" as Tag, source: "austincurrent.org; Community Impact, May 2026" },
];

export const supplyDemandFraming = {
  tag: "derived" as Tag,
  note:
    "Both sides of this ledger are expanding at once, and the film's argument is about how they interact, not just that each is growing. New SUPPLY (gas, wind, batteries) is real capital that has to be paid for — Austin Energy's own money (base-rate funded) when it's local generation, or market capital (recovered through the wholesale price) when it's the statewide fleet. New DEMAND (data centers, fabs, the regional large-load wave) pushes directly on the price two ways: it raises ERCOT's hub price by tightening statewide supply/demand, and it raises Austin's own basis/congestion premium by loading the same constrained Central Texas transmission paths AE's own imports depend on. Austin Energy's local generation investment is explicitly meant to fight the second effect — but it's also exactly the kind of capital spending that raises base rates directly, independent of what the wholesale market does. A customer can see their bill rise from both channels at once: the PSA (pass-through of the wholesale price, pushed up by demand growth) and the base rate (pass-through of AE's own capital program, including the assets meant to fight that same demand growth).",
};

// ---------------------------------------------------------------------------
// 4. AVOIDED COST / VALUE OF SOLAR — does AE's own capex factor in?
// ---------------------------------------------------------------------------

export interface VosComponent {
  component: string;
  howCalculated: string;
  tag: Tag;
}

export const valueOfSolarRate = {
  residentialRate: 12.89,
  commercialRateUnder1MW: 12.89,
  commercialRateOver1MW: 10.22,
  unit: "¢/kWh",
  periodLabel: "FY2027–FY2029 (recalculated every 3 years, as the average of the prior 5 years' assessments)",
  tag: "reported" as Tag,
  source: "austinenergy.com/green-power/solar-solutions/value-of-solar-rate/FAQs (reviewed 2026-10-01)",
};

export const vosComponents: VosComponent[] = [
  { component: "Energy", howCalculated: "Weighted average ERCOT market energy price at the times solar actually produces.", tag: "reported" },
  { component: "Ancillary services", howCalculated: "Weighted average cost of keeping the right mix of plants running to prevent outages.", tag: "reported" },
  { component: "Transmission", howCalculated: "Based on average generation at peak times, wholesale transmission charges, and total solar output. Excluded entirely for systems ≥ 1 MW-ac.", tag: "reported" },
  { component: "Societal benefits", howCalculated: "Federal social cost of carbon × Texas-specific carbon per kWh.", tag: "reported" },
];

export const vosDataGap = {
  tag: "blocked" as Tag,
  finding:
    "Austin Energy's own Value of Solar FAQ lists exactly four avoided-cost components — energy, ancillary services, transmission, and a societal/carbon adder — and explicitly states solar “does not reduce overhead distribution system costs.” Generation CAPACITY avoidance is not listed as a component at all. Nowhere in the published methodology is there any statement of how — or whether — AE's own capital program (new transmission lines, substation/grid upgrades, or new local generation like the 2026 gas peaker) feeds back into this calculation. The rate is simply recalculated every three years off realized market prices.",
  implication:
    "This is the asymmetry worth putting on screen: AE's own capital investments (transmission, grid upgrades, new generation) raise what customers pay through the base rate, directly and on a known schedule. But rooftop/distributed solar is never credited for any capacity or distribution value it might provide against those same investments — AE's own rate design has already ruled that value out by definition, not through a calculation that came back at zero.",
};

// ---------------------------------------------------------------------------
// 5. "THE GAS PLANT WILL ENABLE MORE RENEWABLES" — is there published math?
// ---------------------------------------------------------------------------

export const gasEnablesRenewablesClaim = {
  tag: "blocked" as Tag,
  claimAsStated:
    "Austin Energy's public case for the 2026 gas peaker includes the argument that it will let the utility import more low-cost wind and solar from distant parts of Texas, because generating inside Austin's transmission-constrained zone relieves the congestion that currently limits those imports. AE's COO Lisa Martin put the related claim this way: peakers “don't displace renewables and they don't displace batteries.”",
  whatIsPublished:
    "AE has published the SIZE of the problem the peaker is meant to solve — congestion costs of $100–150M in some years — and a reliability figure (575 projected ‘reliability risk hours’ per year without new gas, up from 30–50 today). What is NOT published anywhere found in this research: any model, formula, or figure connecting ‘X MW of new local gas generation’ to ‘Y MW or $Z of additional renewable import capacity enabled.’ The reliability-hours figure is about local outage risk, not renewable integration, and is itself disputed by critics.",
  whyNotPublished:
    "Public Citizen's formal comments on the peaker decision state directly that Austin Energy has not made its peaker-vs-battery modeling public, and that AE is ‘designating all useful information from modeling peakers vs. batteries’ as competitive/confidential information — and that AE's conclusions ‘don't align with other analyses,’ prompting a request for an independent review. No contrary figures were found in this research pass.",
  sources: [
    "KUT, “Austin officials approve new gas plant,” May 21 2026 — kut.org/energy-environment/2026-05-21/austin-energy-tx-new-natural-gas-electricity-plant",
    "Public Citizen, comments on the Austin Energy peaker decision (Kaiba White) — citizen.org/wp-content/uploads/AE-peaker-comments.pdf",
  ],
};

// ---------------------------------------------------------------------------
// 6. LIVE DEMAND TRACKER — planned next phase (not yet built; see README tab)
// ---------------------------------------------------------------------------

export const liveTrackerPlan = {
  tag: "scenario" as Tag,
  demandSide:
    "Feasible as a genuinely live feed: the City of Austin's open-data portal (data.austintexas.gov, dataset “Issued Construction Permits,” id 3syk-w9eu) exposes a public Socrata API — confirmed reachable and returning real records, no key required. New large commercial/industrial permits (filtered by permit type, work class, and valuation) can stand in for new/expanding big loads inside Austin's own jurisdiction. It will NOT catch out-of-territory large loads like Samsung's Taylor fab or Tesla's Travis County expansion, since those are outside Austin's permitting jurisdiction entirely — those stay in the named-projects table above, updated by hand as reported.",
  supplySide:
    "NOT feasible as a live feed. Utility-scale generation (new gas/wind/solar/battery plants) isn't permitted through the city's building-permit system — it's tracked through ERCOT's Generation Interconnection Status report and City Council/EUC approval records, both of which are periodic published snapshots, not an API. (ERCOT's GIS report can be parsed programmatically with the open-source `gridstatus` library, but still only as often as ERCOT republishes it — not real-time.) This matches how the project already handles ERCOT price data: manual/periodic re-export, not a live feed.",
};

// ---------------------------------------------------------------------------
// 7. MAP DATA — combined loads + free generation-pipeline data (added 2026-10-23)
// ---------------------------------------------------------------------------
// Two free, independently-sourced feeds, combined:
//   (a) this project's own named-load research (section 3 above)
//   (b) Cleanview (cleanview.co) — a market-intelligence platform that tracks
//       data centers and ERCOT/SPP interconnection-queue projects from permits
//       and satellite imagery. Its FREE tier caps each table at ~100 rows
//       nationwide, alphabetical by project name — so the Cleanview lists below
//       are NOT the complete Texas pipeline, just whatever alphabetically-early
//       slice fits in that cap (pulled live from cleanview.co, 2026-10-23). A
//       paid subscription ($9,000/yr per category) or the $5,000/yr API add-on
//       would unlock the rest of each queue.

export type MapCategory = "load" | "solar" | "battery" | "generator-current" | "generator-retiring" | "generator-proposed";
export type LocationPrecision = "exact-site" | "county-centroid" | "city-approx";

export interface MapPoint {
  name: string;
  category: MapCategory;
  mw: number | null;
  lat: number;
  lon: number;
  year: string;
  detail: string;
  precision: LocationPrecision;
  tag: Tag;
}

// 7a. Named load projects (section 3), placed on the map with public,
// well-known city/campus-level coordinates — not from Cleanview.
export const namedLoadMapPoints: MapPoint[] = [
  { name: "Tesla Gigafactory Texas expansion", category: "load", mw: null, lat: 30.2224, lon: -97.6185, year: "2026", detail: "+5.2M sq ft expansion; $700–775M; MW not disclosed", precision: "exact-site", tag: "reported" },
  { name: "Samsung Taylor semiconductor fab(s)", category: "load", mw: null, lat: 30.5699, lon: -97.4091, year: "2026", detail: "$17B+ first fab, toward $37–40B+ campus; MW not disclosed", precision: "city-approx", tag: "reported" },
  { name: "Blue Origin — Constellation Park", category: "load", mw: null, lat: 30.5427, lon: -97.5464, year: "n/a", detail: "1.3M sq ft campus; $554–650M; MW not disclosed", precision: "city-approx", tag: "reported" },
  { name: "CloudBurst San Marcos data center", category: "load", mw: null, lat: 29.8833, lon: -97.9414, year: "2026", detail: "Proposed 1.2 GW campus; designed to run on gas via pipeline, not ERCOT grid power", precision: "city-approx", tag: "reported" },
];

// 7b. Cleanview free "Data Centers" tracker — every Texas row found in the
// free 100-row national table (real site coordinates; pulled 2026-10-23).
export const cleanviewDataCenters: MapPoint[] = [
  { name: "5MW Temple Data Center", category: "load", mw: 5, lat: 31.12605427, lon: -97.36096275, year: "2026", detail: "Oppidan · Bell County · Planned · $150M · 61,554 sq ft", precision: "exact-site", tag: "reported" },
  { name: "ACS Fort Worth - Building 1", category: "load", mw: 70, lat: 32.9086, lon: -97.3966, year: "2030", detail: "ACS · Tarrant County · Planned · part of $1.9B campus", precision: "exact-site", tag: "reported" },
  { name: "ACS Fort Worth - Building 2", category: "load", mw: 70, lat: 32.9079, lon: -97.3958, year: "2031", detail: "ACS · Tarrant County · Planned", precision: "exact-site", tag: "reported" },
  { name: "ACS Fort Worth - Building 3", category: "load", mw: 70, lat: 32.9067, lon: -97.3958, year: "2033", detail: "ACS · Tarrant County · Planned", precision: "exact-site", tag: "reported" },
  { name: "ACS Fort Worth - Building 4", category: "load", mw: 70, lat: 32.9079, lon: -97.3922, year: "2034", detail: "ACS · Tarrant County · Planned", precision: "exact-site", tag: "reported" },
  { name: "ACS Fort Worth - Building 5", category: "load", mw: 70, lat: 32.9067, lon: -97.3922, year: "2035", detail: "ACS · Tarrant County · Planned", precision: "exact-site", tag: "reported" },
  { name: "AIB DFW-A - Expansion", category: "load", mw: 40, lat: 32.3772, lon: -100.7148, year: "2028", detail: "AIB Data Centers · Mitchell County · Planned · $1.2B", precision: "exact-site", tag: "reported" },
  { name: "AIB DFW-A - Phase I", category: "load", mw: 15, lat: 32.3795, lon: -100.7150, year: "2028", detail: "AIB Data Centers · Mitchell County · Planned · $440M", precision: "exact-site", tag: "reported" },
  { name: "Aligned Dallas DFW-01", category: "load", mw: 29, lat: 33.00931, lon: -96.676435, year: "2015", detail: "Aligned · Collin County · Operating", precision: "exact-site", tag: "reported" },
  { name: "Aligned Dallas DFW-02", category: "load", mw: 50, lat: 33.009004, lon: -96.675048, year: "2025", detail: "Aligned · Collin County · Operating · $1.4B", precision: "exact-site", tag: "reported" },
  { name: "Aligned DFW-04 North Star Road", category: "load", mw: 86, lat: 33.0060062, lon: -96.6570936, year: "2026", detail: "Aligned · Collin County · Under Construction · tenant Lambda · $2.7B", precision: "exact-site", tag: "reported" },
  { name: "Aligned DFW03 Mansfield", category: "load", mw: 86, lat: 32.54982, lon: -97.07486, year: "2026", detail: "Aligned · Tarrant County · Under Construction · $2.7B", precision: "exact-site", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-01", category: "load", mw: 108, lat: 33.867975, lon: -101.8509, year: "2027", detail: "Aligned · Hale County · Under Construction · $3.4B campus", precision: "exact-site", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-02", category: "load", mw: 108, lat: 33.866383, lon: -101.8509, year: "2028", detail: "Aligned · Hale County · Planned", precision: "exact-site", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-03", category: "load", mw: 108, lat: 33.865041, lon: -101.850995, year: "2029", detail: "Aligned · Hale County · Planned", precision: "exact-site", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-04", category: "load", mw: 108, lat: 33.863541, lon: -101.850836, year: "2030", detail: "Aligned · Hale County · Planned", precision: "exact-site", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-05", category: "load", mw: 108, lat: 33.865541, lon: -101.84678, year: "2031", detail: "Aligned · Hale County · Planned", precision: "exact-site", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-06", category: "load", mw: 108, lat: 33.863646, lon: -101.84678, year: "2032", detail: "Aligned · Hale County · Planned", precision: "exact-site", tag: "reported" },
];

export const combinedLoadsForMap: MapPoint[] = [...namedLoadMapPoints, ...cleanviewDataCenters];

// 7c. Cleanview free "Planned Solar" tracker — Texas rows (ERCOT + one SPP)
// from the free 100-row national table. Free tier exposes County, not
// site coordinates, so these are county-SEAT centroids — a close address,
// not the exact project site.
export const cleanviewPlannedSolar: MapPoint[] = [
  { name: "Aurelius 3 Solar", category: "solar", mw: 445, lat: 34.8229, lon: -102.3971, year: "2030", detail: "Intersect Power · Deaf Smith County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Buzzer Butte 2 Solar", category: "solar", mw: 243, lat: 33.2576, lon: -100.5712, year: "2030", detail: "Origis Energy · Kent County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Abeja Solar Farm", category: "solar", mw: 201, lat: 28.4008, lon: -97.7483, year: "2029", detail: "OCI Energy · Bee County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Abeja Solar Farm (II)", category: "solar", mw: 200, lat: 28.4008, lon: -97.7483, year: "2028", detail: "OCI Energy · Bee County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Ables Springs Solar & Storage", category: "solar", mw: 151, lat: 32.5890, lon: -96.3122, year: "2026", detail: "Enel · Kaufman County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Accalia Point Solar", category: "solar", mw: 191, lat: 25.9018, lon: -97.4975, year: "2029", detail: "Westbridge Renewable Energy · Cameron County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Accalia Point Solar, LLC", category: "solar", mw: 191, lat: 25.9018, lon: -97.4975, year: "2028", detail: "Westbridge Renewable Energy · Cameron County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Adams Creek Solar Project", category: "solar", mw: 240, lat: 34.1537, lon: -99.2847, year: "2027", detail: "Savion · Wilbarger County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Adamstown Solar", category: "solar", mw: 251, lat: 34.1537, lon: -99.2847, year: "2027", detail: "Savion · Wilbarger County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Albatross Solar, LLC", category: "solar", mw: 101, lat: 31.5493, lon: -97.1467, year: "2027", detail: "Sunraycer Assets · McLennan County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Alina Energy LLC (solar)", category: "solar", mw: 200, lat: 29.1333, lon: -98.1600, year: "2028", detail: "Advanced Power · Wilson County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Alira", category: "solar", mw: 223, lat: 32.3187, lon: -102.5460, year: "2029", detail: "Vistra · Andrews County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Allthorn Solar", category: "solar", mw: 232, lat: 27.7694, lon: -98.2425, year: "2029", detail: "Palladium Energy · Duval County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Amerada", category: "solar", mw: 300, lat: 31.7318, lon: -96.1611, year: "2029", detail: "Cypress Creek Renewables · Freestone County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Amerada Solar", category: "solar", mw: 302, lat: 31.7318, lon: -96.1611, year: "2028", detail: "Cypress Creek Renewables · Freestone County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Amphion Solar Phase 2", category: "solar", mw: 206, lat: 28.9064, lon: -98.5389, year: "2029", detail: "Pine Gate Renewables · Atascosa County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Amphion Solar Phase 3", category: "solar", mw: 115, lat: 28.9064, lon: -98.5389, year: "2029", detail: "Pine Gate Renewables · Atascosa County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Anila Solar", category: "solar", mw: 201, lat: 29.1333, lon: -98.1600, year: "2028", detail: "Advanced Power · Wilson County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Anson 2 Solar", category: "solar", mw: 219, lat: 32.8540, lon: -99.8942, year: "2026", detail: "Engie · Jones County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Anson Solar 2", category: "solar", mw: 201, lat: 32.8540, lon: -99.8942, year: "2026", detail: "Engie · Jones County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Antila Solar", category: "solar", mw: 500, lat: 32.7695, lon: -101.4504, year: "2027", detail: "SB Energy · Borden County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Apricot Sun Solar", category: "solar", mw: 201, lat: 27.7694, lon: -98.2425, year: "2029", detail: "Shell · Duval County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Argenta Solar", category: "solar", mw: 310, lat: 28.4008, lon: -97.7483, year: "2028", detail: "Geronimo Power · Bee County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Armadillo Solar", category: "solar", mw: 150, lat: 32.0954, lon: -96.4689, year: "2026", detail: "AES Clean Energy · Navarro County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Armadillo Solar Center", category: "solar", mw: 175, lat: 32.0954, lon: -96.4689, year: "2027", detail: "AES Clean Energy · Navarro County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Arroyo Solar", category: "solar", mw: 100, lat: 25.9018, lon: -97.4975, year: "2028", detail: "Belltown Power · Cameron County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Ashra Solar SLF", category: "solar", mw: 40, lat: 29.2097, lon: -99.7862, year: "2028", detail: "Birch Creek · Uvalde County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "1000 Mile Solar", category: "solar", mw: 300, lat: 33.1890, lon: -102.8238, year: "2026", detail: "Longroad Energy · Yoakum County (centroid) · SPP (not ERCOT) · Planned", precision: "county-centroid", tag: "reported" },
];

// 7d. Cleanview free "Planned Batteries" tracker — Texas (all ERCOT) rows
// from the free 100-row national table. Same county-centroid caveat as 7c.
export const cleanviewPlannedBatteries: MapPoint[] = [
  { name: "Adelite Storage", category: "battery", mw: 232, lat: 30.8534, lon: -96.9550, year: "2028", detail: "Acciona Energy · Milam County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Adelite Storage Project LLC", category: "battery", mw: 230, lat: 30.8534, lon: -96.9550, year: "2027", detail: "Acciona Energy · Milam County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Agricola BESS", category: "battery", mw: 205, lat: 29.9527, lon: -96.2572, year: "2029", detail: "Redeux Energy · Austin County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Alamo City BESS", category: "battery", mw: 128, lat: 29.4241, lon: -98.4936, year: "2027", detail: "OCI Energy · Bexar County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Alamo City ESS", category: "battery", mw: 200, lat: 29.4241, lon: -98.4936, year: "2027", detail: "OCI Energy · Bexar County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Alamo Street BESS2", category: "battery", mw: 10, lat: 30.8898, lon: -102.8793, year: "2027", detail: "Momentum Energy Storage Partners · Pecos County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Albatross BESS", category: "battery", mw: 50, lat: 31.5493, lon: -97.1467, year: "2028", detail: "Sunraycer Assets · McLennan County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Albatross Storage (co-located)", category: "battery", mw: 50, lat: 31.5493, lon: -97.1467, year: "2027", detail: "Sunraycer Assets · McLennan County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Aldrin 138 BESS", category: "battery", mw: 207, lat: 29.1694, lon: -95.4319, year: "2028", detail: "Vesper Energy · Brazoria County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Aldrin 345 BESS", category: "battery", mw: 362, lat: 29.1694, lon: -95.4319, year: "2028", detail: "Vesper Energy · Brazoria County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Alina Energy LLC (battery)", category: "battery", mw: 200, lat: 29.1333, lon: -98.1600, year: "2028", detail: "Advanced Power · Wilson County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Allthorn BESS", category: "battery", mw: 205, lat: 27.7694, lon: -98.2425, year: "2029", detail: "Palladium Energy · Duval County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Amador BESS", category: "battery", mw: 220, lat: 32.5563, lon: -95.8636, year: "2026", detail: "Taaleri Energia · Van Zandt County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Amador Storage", category: "battery", mw: 102, lat: 32.5563, lon: -95.8636, year: "2027", detail: "Taaleri Energia · Van Zandt County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Amerada Storage", category: "battery", mw: 151, lat: 31.7318, lon: -96.1611, year: "2028", detail: "Cypress Creek Renewables · Freestone County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Anatole Renewable Energy Storage", category: "battery", mw: 208, lat: 32.2049, lon: -95.8555, year: "2027", detail: "Vesper Energy · Henderson County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Anglin BESS", category: "battery", mw: 206, lat: 32.7555, lon: -97.3308, year: "2028", detail: "Exigent Energy · Tarrant County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Anila BESS", category: "battery", mw: 209, lat: 29.1333, lon: -98.1600, year: "2028", detail: "Advanced Power · Wilson County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Anson BAT", category: "battery", mw: 154, lat: 32.8540, lon: -99.8942, year: "2027", detail: "Engie · Jones County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Apache Hill BESS", category: "battery", mw: 201, lat: 32.4421, lon: -97.7892, year: "2026", detail: "Vitis Energy · Hood County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Apache Hill Energy Center", category: "battery", mw: 200, lat: 32.4421, lon: -97.7892, year: "2026", detail: "Vitis Energy · Hood County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Apple BESS", category: "battery", mw: 9.9, lat: 31.8457, lon: -102.3676, year: "2026", detail: "Stella ESS · Ector County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Apricot Sun Storage", category: "battery", mw: 201, lat: 27.7694, lon: -98.2425, year: "2029", detail: "Shell · Duval County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "APV Plumwood Storage", category: "battery", mw: 201, lat: 29.7658, lon: -94.6827, year: "2029", detail: "American Power Ventures · Chambers County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Arc Energy Storage", category: "battery", mw: 205, lat: 33.6609, lon: -95.5555, year: "2028", detail: "Valor Infrastructure Partners · Lamar County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Ardesia Storage", category: "battery", mw: 100, lat: 29.8830, lon: -97.6700, year: "2030", detail: "Acciona Energy · Caldwell County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Argenta Storage", category: "battery", mw: 192, lat: 28.4008, lon: -97.7483, year: "2028", detail: "Geronimo Power · Bee County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Arroyo Storage (Excelsior)", category: "battery", mw: 184, lat: 25.9018, lon: -97.4975, year: "2026", detail: "Excelsior Energy Capital · Cameron County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Arroyo Storage (Neely Clay)", category: "battery", mw: 180, lat: 25.9018, lon: -97.4975, year: "2026", detail: "Neely Clay · Cameron County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Ash Creek BESS", category: "battery", mw: 306, lat: 32.0099, lon: -97.1305, year: "2028", detail: "Primergy · Hill County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Ashra Storage SLF", category: "battery", mw: 1.6, lat: 29.2097, lon: -99.7862, year: "2028", detail: "Birch Creek · Uvalde County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Ashtrom Marigold BESS SLF", category: "battery", mw: 154, lat: 30.8898, lon: -102.8793, year: "2029", detail: "Ashtrom Renewable Energy · Pecos County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Atticus Energy Storage", category: "battery", mw: 103, lat: 30.5702, lon: -100.6465, year: "2030", detail: "Doral Renewables · Sutton County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Austin Bayou Storage I", category: "battery", mw: 151, lat: 29.1694, lon: -95.4319, year: "2027", detail: "SunChase Power · Brazoria County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Austin Bayou Storage II", category: "battery", mw: 157, lat: 29.1694, lon: -95.4319, year: "2027", detail: "SunChase Power · Brazoria County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Austin Bayou Storage III", category: "battery", mw: 157, lat: 29.1694, lon: -95.4319, year: "2027", detail: "SunChase Power · Brazoria County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Avalon BESS", category: "battery", mw: 522, lat: 29.5822, lon: -95.7602, year: "2026", detail: "Greenbelt Renewables · Fort Bend County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Avant Prairie BESS", category: "battery", mw: 202, lat: 31.7318, lon: -96.1611, year: "2029", detail: "OCI Energy · Freestone County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Avant Prairie ESS", category: "battery", mw: 200, lat: 31.7318, lon: -96.1611, year: "2029", detail: "OCI Energy · Freestone County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Ayass BESS", category: "battery", mw: 51, lat: 33.1779, lon: -99.1787, year: "2028", detail: "Solvent Energy · Throckmorton County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Backbone Creek BESS (Black Mountain)", category: "battery", mw: 124, lat: 30.7479, lon: -98.2228, year: "2026", detail: "Black Mountain Energy Storage · Burnet County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Backbone Creek BESS (UBS)", category: "battery", mw: 121, lat: 30.7479, lon: -98.2228, year: "2026", detail: "UBS · Burnet County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Badger BESS", category: "battery", mw: 139, lat: 31.2246, lon: -102.0477, year: "2029", detail: "Hanwha Group · Upton County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Banita Creek – Spindlepop (storage)", category: "battery", mw: 303, lat: 31.6035, lon: -94.6555, year: "2027", detail: "Solar Proponent · Nacogdoches County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Barton Branch IA", category: "battery", mw: 200, lat: 31.0255, lon: -96.4858, year: "2026", detail: "Jupiter Power · Robertson County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "Basketflower Storage", category: "battery", mw: 92, lat: 32.4035, lon: -98.8253, year: "2027", detail: "Samsung Renewable Energy · Eastland County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "18-ALPHA BESS", category: "battery", mw: 307, lat: 33.6257, lon: -97.1333, year: "2028", detail: "Energy Management · Cooke County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
  { name: "18-BRAVO BESS", category: "battery", mw: 407, lat: 33.1384, lon: -96.1108, year: "2028", detail: "Energy Management · Hunt County (centroid) · ERCOT · Planned", precision: "county-centroid", tag: "reported" },
];

export const combinedGenerationForMap: MapPoint[] = [...cleanviewPlannedSolar, ...cleanviewPlannedBatteries];

// 7e. EIA-860 generator fleet — found 2026-10-23 at Secret Vote/EIA/eia8602025.zip
// (a prior browser-pane download did land after all, just in the project's own
// EIA/ folder rather than plain Downloads). Extracted and cross-referenced
// against the Plant file for coordinates. ERCOT-wide, this form reports 2,185
// operable + 627 proposed + 326 retired individual generator records (935 /
// 389 / 165 plants) — far too many to put on this map one-for-one, so what
// follows is a deliberately curated subset: Austin Energy's own EIA-reported
// fleet in full, plus the handful of ERCOT-wide records that are specifically
// about RETIREMENT TIMELINES or large NEW builds (which is what was asked
// for), not an attempt at the complete 2,185-row operable fleet.
export const eia860GeneratorFleet = {
  tag: "reported" as Tag,
  status: "partial — curated, not the full ERCOT fleet",
  finding:
    "EIA-860 2025 (Secret Vote/EIA/eia8602025.zip) is now in hand. It reports 2,185 operable + 627 proposed + 326 retired individual ERCOT generator units across 935/389/165 plants — far too many to usefully plot as individual dots. This build adds three curated slices instead: (1) Austin Energy's own EIA-reported generating fleet, in full; (2) every ERCOT operable plant that has an EIA-reported PLANNED RETIREMENT YEAR (only 7 exist in this filing); (3) the largest proposed new ERCOT gas and nuclear plants (>=150 MW), since Cleanview's free tiers already cover solar/battery. The full 2,185-row operable fleet and 627-row proposed queue are not included — ask if you want those dumped in full instead of this curated set.",
  nextStep:
    "If you want the complete, unfiltered ERCOT fleet (not just this curated slice) added to the map or exported as its own sheet, say so and it can be pulled from the same file already saved at Secret Vote/EIA/eia860_2025/.",
};

// 7f. Austin Energy's own EIA-860-reported fleet — a direct cross-check
// against the contractStack table in section 2. Two corrections/additions
// this surfaced that contractStack did NOT have: Decker Creek still has
// 206 MW of operating gas turbines (contractStack only listed it as fully
// retired); and Sand Hill's EIA nameplate capacity (696.4 MW) is noticeably
// higher than the 595 MW figure used in contractStack — almost certainly a
// nameplate-vs-summer-capacity difference (gas combined-cycle plants derate
// in Texas summer heat), not a contradiction, but flagged rather than
// silently reconciled.
export const aeEiaFleetOperable: MapPoint[] = [
  { name: "Decker Creek (operating units)", category: "generator-current", mw: 206.0, lat: 30.3033, lon: -97.6128, year: "operable", detail: "Austin Energy · 4× gas combustion turbine (GT1–GT4) · Travis County. Not listed in this project's prior contract-stack table.", precision: "exact-site", tag: "reported" },
  { name: "Sand Hill Energy Center", category: "generator-current", mw: 696.4, lat: 30.2098, lon: -97.6129, year: "operable", detail: "Austin Energy · 2 combined-cycle units + 6 combustion turbines · Travis County. EIA nameplate is higher than the 595 MW used in this project's contract-stack table — likely nameplate vs. summer-capacity, not an error.", precision: "exact-site", tag: "reported" },
  { name: "Nacogdoches Power (biomass unit)", category: "generator-current", mw: 114.0, lat: 31.832132, lon: -94.90064, year: "operable", detail: "Austin Energy · wood/wood-waste biomass (STG4) · Nacogdoches County · matches contract-stack's 105 MW within rounding.", precision: "exact-site", tag: "reported" },
  { name: "Robert Mueller Energy Center", category: "generator-current", mw: 6.1, lat: 30.304994, lon: -97.707675, year: "operable", detail: "Austin Energy · small gas turbine + petroleum-liquids unit · Travis County · not previously listed.", precision: "exact-site", tag: "reported" },
  { name: "Kingsberry Energy Storage System", category: "generator-current", mw: 1.5, lat: 30.266028, lon: -97.686139, year: "operable", detail: "Austin Energy · battery · Travis County · AE-owned, separate from the 300 MW 3rd-party battery PPAs in the contract-stack table.", precision: "exact-site", tag: "reported" },
  { name: "System Control Center (flywheels)", category: "generator-current", mw: 5.0, lat: 30.219946, lon: -97.708808, year: "operable", detail: "Austin Energy · 2 flywheel frequency-regulation units · Travis County · not previously listed.", precision: "exact-site", tag: "reported" },
];

export const aeEiaFleetRetired = [
  { name: "Decker Creek (old steam units)", mw: 726.3, county: "Travis", detail: "2 gas steam turbines (321 + 405 MW) + a 0.3 MW solar PV test unit, all retired — separate from the still-operating gas turbines above." },
  { name: "Holly Street", mw: 558.0, county: "Travis", detail: "4 gas steam turbines, all retired — Austin's old downtown plant." },
  { name: "Nacogdoches Power (gas combined-cycle units)", mw: 925.0, county: "Nacogdoches", detail: "6 gas CC units, all retired — a prior, much larger use of the same site as the still-operating 114 MW biomass unit above." },
  { name: "Domain Integrated Energy System", mw: 5.0, county: "Travis", detail: "Small gas turbine at The Domain, retired." },
];

export const aeEiaNote = {
  tag: "reported" as Tag,
  note:
    "Austin Energy's May/July 2026 additions (the new 400 MW gas peaker, new wind, new batteries) do NOT appear in this EIA-860 2025 filing — that data reflects utility reporting as of year-end 2025, before those approvals, and the next annual EIA-860 (covering 2026) won't be published until roughly September 2027. Separately, AE's PPA wind and solar contracts (the ~1,895 MW wind / ~804 MW solar in the contract-stack table) are not expected to appear under 'Austin Energy' here at all — EIA-860 attributes a generator to its owner/operator, and those are third-party-owned assets AE merely buys output from.",
};

// 7g. ERCOT-wide operable plants with an EIA-reported PLANNED RETIREMENT YEAR
// — i.e., "current generators with a timeline for retirement," which is
// specifically what was asked for. Only 7 exist in this filing; two (the
// CPS Energy coal/gas pair in San Antonio) are large and directly relevant
// to the region's replacement-cost story even though they're not AE's own.
export const ercotRetiringSoon: MapPoint[] = [
  { name: "O W Sommers", category: "generator-retiring", mw: 892.0, lat: 29.308056, lon: -98.3242, year: "2027", detail: "CPS Energy (San Antonio) · gas · Bexar County · EIA-reported planned retirement 2027.", precision: "exact-site", tag: "reported" },
  { name: "J K Spruce", category: "generator-retiring", mw: 1488.5, lat: 29.309722, lon: -98.3203, year: "2028", detail: "CPS Energy (San Antonio) · coal · Bexar County · EIA-reported planned retirement 2028 — ERCOT's largest announced coal retirement in this filing.", precision: "exact-site", tag: "reported" },
  { name: "Hal C Weaver Power Plant", category: "generator-retiring", mw: 152.5, lat: 30.2867, lon: -97.7356, year: "2028", detail: "University of Texas at Austin (not Austin Energy) · gas combined-cycle · Travis County · EIA-reported planned retirement 2028.", precision: "exact-site", tag: "reported" },
  { name: "Works 4", category: "generator-retiring", mw: 4.9, lat: 34.003489, lon: -98.553539, year: "2027", detail: "Distillate-oil-fired unit · Wichita County · small, included for completeness.", precision: "exact-site", tag: "reported" },
  { name: "Flower Valley I", category: "generator-retiring", mw: 9.9, lat: 31.197283, lon: -103.361769, year: "2032", detail: "Battery storage · Reeves County · EIA-reported planned retirement 2032.", precision: "exact-site", tag: "reported" },
  { name: "Madero Grid", category: "generator-retiring", mw: 100.0, lat: 26.169846, lon: -98.329793, year: "2042", detail: "Battery storage · Hidalgo County · EIA-reported planned retirement 2042 — likely an end-of-contract-life placeholder rather than a real near-term date.", precision: "exact-site", tag: "reported" },
  { name: "Ignacio Grid Energy Storage System", category: "generator-retiring", mw: 100.0, lat: 26.166944, lon: -98.325, year: "2042", detail: "Battery storage · Hidalgo County · same note as Madero Grid.", precision: "exact-site", tag: "reported" },
];

// 7h. Largest proposed NEW ERCOT generators (>=150 MW) from EIA-860's
// Proposed tab — gas and nuclear specifically, since Cleanview's free
// trackers (section 7c/7d) already cover planned solar and battery.
export const ercotProposedLargeGasNuclear: MapPoint[] = [
  { name: "Project Matador Gas Plant (PMG)", category: "generator-proposed", mw: 11679.3, lat: 35.283762, lon: -101.568974, year: "2026", detail: "Gas · Carson County (Texas Panhandle) · by far the largest single proposed gas plant in ERCOT's EIA-reported queue; co-located with a 4,468 MW proposed nuclear unit at the same project (below).", precision: "exact-site", tag: "reported" },
  { name: "Project Matador Nuclear", category: "generator-proposed", mw: 4468.0, lat: 35.283762, lon: -101.568974, year: "2031", detail: "Nuclear · Carson County · same project/site as Project Matador Gas Plant above.", precision: "exact-site", tag: "reported" },
  { name: "CPV Basin Ranch Energy Center", category: "generator-proposed", mw: 1445.0, lat: 31.506094, lon: -103.487453, year: "2029", detail: "Gas · Ward County.", precision: "exact-site", tag: "reported" },
  { name: "Sandow Lakes Energy Station", category: "generator-proposed", mw: 1290.0, lat: 30.419441, lon: -97.191243, year: "2028", detail: "Gas · Lee County — about an hour from Austin.", precision: "exact-site", tag: "reported" },
  { name: "Vast Sands Power", category: "generator-proposed", mw: 880.0, lat: 31.584096, lon: -102.957966, year: "2027", detail: "Gas · Ward County.", precision: "exact-site", tag: "reported" },
  { name: "Legend Power Station", category: "generator-proposed", mw: 754.0, lat: 29.880219, lon: -93.995733, year: "2028", detail: "Gas · Jefferson County.", precision: "exact-site", tag: "reported" },
  { name: "Cedar Bayou 5", category: "generator-proposed", mw: 721.0, lat: 29.751132, lon: -94.921142, year: "2028", detail: "Gas · Chambers County.", precision: "exact-site", tag: "reported" },
  { name: "Greens Bayou 6", category: "generator-proposed", mw: 447.0, lat: 29.821222, lon: -95.217861, year: "2028", detail: "Gas · Harris County.", precision: "exact-site", tag: "reported" },
  { name: "Pin Oak Creek Energy Center", category: "generator-proposed", mw: 444.0, lat: 31.893702, lon: -96.110576, year: "2026", detail: "Gas · Freestone County.", precision: "exact-site", tag: "reported" },
  { name: "NRG THW GT Electric Generating Station", category: "generator-proposed", mw: 377.4, lat: 29.943892, lon: -95.531254, year: "2024", detail: "Gas · Harris County.", precision: "exact-site", tag: "reported" },
  { name: "Timmerman Power Plant", category: "generator-proposed", mw: 188.0, lat: 29.875, lon: -97.807, year: "2026", detail: "Gas · Caldwell County — about 30 miles from Austin.", precision: "exact-site", tag: "reported" },
];

// 7i. ERCOT-wide proposed-generation totals by fuel (all 627 proposed units,
// not just the >=150MW gas/nuclear subset above) — context for how AE's own
// 400 MW peaker compares to the scale of what's being proposed statewide.
export const ercotProposedFuelMix = [
  { fuel: "Solar", mw: 34546.1, tag: "reported" as Tag },
  { fuel: "Battery storage", mw: 21942.9, tag: "reported" as Tag },
  { fuel: "Gas", mw: 18579.5, tag: "reported" as Tag },
  { fuel: "Solar + battery (hybrid, co-located)", mw: 13067.4, tag: "reported" as Tag },
  { fuel: "Wind", mw: 5286.1, tag: "reported" as Tag },
  { fuel: "Nuclear", mw: 4468.0, tag: "reported" as Tag },
  { fuel: "Other (distillate oil, waste heat)", mw: 58.3, tag: "reported" as Tag },
];

export const combinedGeneratorsForMap: MapPoint[] = [
  ...aeEiaFleetOperable,
  ...ercotRetiringSoon,
  ...ercotProposedLargeGasNuclear,
];

export const mapDataNote = {
  tag: "derived" as Tag,
  note:
    "LOADS layer = this project's named large-load research (exact/city-level coordinates) + Cleanview's free Data Center tracker (exact site coordinates, Texas rows only). NEW SOLAR/BATTERY layer = Cleanview's free Planned Solar + Planned Batteries trackers (county-centroid coordinates — the free tier doesn't expose site-level lat/long for these two trackers). GENERATOR layers (new) = EIA-860 2025, cross-referenced against Austin Energy's own contract-stack table, plus ERCOT's 7 EIA-reported planned-retirement plants and its largest proposed gas/nuclear builds — a curated subset of EIA-860's 2,185 operable + 627 proposed + 326 retired ERCOT generator records, not the complete fleet. Both Cleanview layers are capped at whatever alphabetically-early slice of the national queue fits in Cleanview's free 100-row-per-table limit, pulled 2026-10-23.",
};

// ---------------------------------------------------------------------------
// 8. SUPPLY / DEMAND / GAP TABLE, 2027-2045 (added 2026-10-23)
// ---------------------------------------------------------------------------
// SUPPLY is held FLAT at the sum of the individual contractStack entries
// (595 + 400 + 600 + 432 + 1894.64 + 804 + 300 + 105 = 5,130.64 MW), consistent
// with this project's own replacementAssumption (section 2): expiring contracts
// are modeled as replaced 1:1 by the same technology, so total contracted/owned
// MW doesn't mechanically decline even as individual contracts roll off and get
// re-signed. This is a SCENARIO modeling choice, not a reported AE capacity plan.
//
// A DATA-QUALITY NOTE, surfaced while building this table and not introduced by
// it: contractStackTotals.totalActiveMw (5,528.64) and .expiringInWindowMw
// (4,255.64) do NOT match what you get by summing the individual contractStack
// entries (5,130.64 and, for entries flagged expiresInWindow:true, 3,893.64) —
// a ~398 MW and ~362 MW gap respectively. Separately, the Solar contracts entry
// is flagged expiresInWindow:true but has contractEnd:2056, outside this
// 2026-2045 window — a flag/date contradiction. This table uses the sum of the
// granular array (5,130.64 MW) as the more auditable, traceable figure, and
// flags rather than silently corrects the totals object above.
//
// DEMAND has no equivalent reported AE forecast to draw on for this specific
// 2027-2045 shape, so as a SCENARIO proxy this table reuses the model's own
// already-computed Base-scenario price CAGR (projectionReadout.cagr.base =
// 3.41%/yr — itself derived substantially from load-growth assumptions) as a
// stand-in demand-growth rate, anchored to AE's own reported ~3,100 MW 2026
// system peak (aggregateLoadPipeline). Demand(year) = 3,100 x 1.0341^(year-2026).
// This is explicitly a rough, self-referential proxy — not a load forecast AE
// or ERCOT has published — and is labeled as such everywhere it's shown.

export interface SupplyDemandGapRow {
  year: number;
  supplyMw: number;
  demandMw: number;
  gapMw: number;
}

export const supplyDemandGapTable: SupplyDemandGapRow[] = [
  { year: 2027, supplyMw: 5130.64, demandMw: 3205.7, gapMw: 1924.9 },
  { year: 2028, supplyMw: 5130.64, demandMw: 3315.0, gapMw: 1815.6 },
  { year: 2029, supplyMw: 5130.64, demandMw: 3428.1, gapMw: 1702.6 },
  { year: 2030, supplyMw: 5130.64, demandMw: 3545.0, gapMw: 1585.7 },
  { year: 2031, supplyMw: 5130.64, demandMw: 3665.8, gapMw: 1464.8 },
  { year: 2032, supplyMw: 5130.64, demandMw: 3790.9, gapMw: 1339.8 },
  { year: 2033, supplyMw: 5130.64, demandMw: 3920.1, gapMw: 1210.5 },
  { year: 2034, supplyMw: 5130.64, demandMw: 4053.8, gapMw: 1076.8 },
  { year: 2035, supplyMw: 5130.64, demandMw: 4192.0, gapMw: 938.6 },
  { year: 2036, supplyMw: 5130.64, demandMw: 4335.0, gapMw: 795.7 },
  { year: 2037, supplyMw: 5130.64, demandMw: 4482.8, gapMw: 647.8 },
  { year: 2038, supplyMw: 5130.64, demandMw: 4635.7, gapMw: 495.0 },
  { year: 2039, supplyMw: 5130.64, demandMw: 4793.7, gapMw: 336.9 },
  { year: 2040, supplyMw: 5130.64, demandMw: 4957.2, gapMw: 173.4 },
  { year: 2041, supplyMw: 5130.64, demandMw: 5126.2, gapMw: 4.4 },
  { year: 2042, supplyMw: 5130.64, demandMw: 5301.1, gapMw: -170.4 },
  { year: 2043, supplyMw: 5130.64, demandMw: 5481.8, gapMw: -351.2 },
  { year: 2044, supplyMw: 5130.64, demandMw: 5668.8, gapMw: -538.1 },
  { year: 2045, supplyMw: 5130.64, demandMw: 5862.1, gapMw: -731.4 },
];

export const supplyDemandGapMethodology = {
  tag: "scenario" as Tag,
  supplyNote:
    "Supply held flat at 5,130.64 MW for the whole window — the sum of this project's own contractStack entries (section 2), not AE's contractStackTotals figure (see data-quality note below). Flat because this model's own replacementAssumption treats expiring contracts as replaced 1:1 by the same technology, so capacity itself doesn't mechanically shrink over the window — only its cost and ownership terms change.",
  demandNote:
    "Demand is a rough scenario proxy, not a published AE or ERCOT load forecast: AE's reported ~3.1 GW 2026 system peak (aggregateLoadPipeline), grown at this same model's own Base-scenario price CAGR (3.41%/yr) as a stand-in for load growth. Treat the crossover point (between 2041 and 2042) as illustrative of the shape of the problem — new large loads outpacing flat contracted supply — not a forecast of the exact year it happens.",
  dataQualityNote:
    "contractStackTotals.totalActiveMw (5,528.64 MW) and .expiringInWindowMw (4,255.64 MW) do not match the sum of the individual contractStack entries (5,130.64 MW total; 3,893.64 MW of entries flagged expiresInWindow:true) — gaps of about 398 MW and 362 MW. The Solar contracts entry is also flagged expiresInWindow:true despite a contractEnd of 2056, outside this window. Flagged here rather than silently reconciled; this table uses the granular, auditable sum.",
};

// ---------------------------------------------------------------------------
// 9. GANTT-STYLE TIMELINE — new loads, new generation, retiring assets
// (added 2026-10-23)
// ---------------------------------------------------------------------------
// Three lanes, each item spanning from "now" (2026) to its target/completion/
// retirement year, over a fixed 2026-2045 axis:
//   - "New loads": combinedLoadsForMap (section 7), excluding items whose
//     year is already in the past (Aligned Dallas DFW-01/-02, operating since
//     2015/2025) — 20 items.
//   - "New generation": the 10 of 11 ercotProposedLargeGasNuclear entries with
//     a year still ahead (excluding NRG THW GT, EIA-reported year 2024), plus
//     Austin Energy's own 3 announced 2026 additions (the 400 MW gas peaker,
//     ~299 MW of new wind, 300 MW of new battery — AE's own reported total for
//     these three is ~999 MW, Community Impact/KUT) — 13 items.
//   - "Retiring assets": the 3 contractStack entries with expiresInWindow:true
//     AND a numeric contractEnd within this window (Sand Hill 2035, Fayette
//     2035, Wind contracts 2041 — Solar's contracts excluded per the
//     contractEnd:2056-outside-window note above), plus all 7
//     ercotRetiringSoon entries — 10 items.

export type GanttLane = "New loads" | "New generation" | "Retiring assets";

export interface GanttItem {
  name: string;
  lane: GanttLane;
  startYear: number;
  endYear: number;
  mw: number | null;
  detail: string;
  tag: Tag;
  yearIsEstimate?: boolean;
}

export const GANTT_YEAR_MIN = 2026;
export const GANTT_YEAR_MAX = 2045;

export const ganttItems: GanttItem[] = [
  // --- New loads (20) ---
  { name: "Tesla Gigafactory Texas expansion", lane: "New loads", startYear: 2026, endYear: 2026, mw: null, detail: "Travis County · targeted complete end of 2026", tag: "reported" },
  { name: "Samsung Taylor semiconductor fab(s)", lane: "New loads", startYear: 2026, endYear: 2026, mw: null, detail: "Taylor · first fab targeting 2026 risk production", tag: "reported" },
  { name: "Blue Origin — Constellation Park", lane: "New loads", startYear: 2026, endYear: 2028, mw: null, detail: "Hutto · construction timeline not disclosed as of mid-2026; end year estimated", tag: "reported", yearIsEstimate: true },
  { name: "CloudBurst San Marcos data center", lane: "New loads", startYear: 2026, endYear: 2026, mw: null, detail: "Hays County · targeting Q3 2026 ops; runs on gas via pipeline, not ERCOT grid power", tag: "reported" },
  { name: "5MW Temple Data Center", lane: "New loads", startYear: 2026, endYear: 2026, mw: 5, detail: "Oppidan · Bell County · Planned", tag: "reported" },
  { name: "ACS Fort Worth - Building 1", lane: "New loads", startYear: 2026, endYear: 2030, mw: 70, detail: "ACS · Tarrant County · Planned", tag: "reported" },
  { name: "ACS Fort Worth - Building 2", lane: "New loads", startYear: 2026, endYear: 2031, mw: 70, detail: "ACS · Tarrant County · Planned", tag: "reported" },
  { name: "ACS Fort Worth - Building 3", lane: "New loads", startYear: 2026, endYear: 2033, mw: 70, detail: "ACS · Tarrant County · Planned", tag: "reported" },
  { name: "ACS Fort Worth - Building 4", lane: "New loads", startYear: 2026, endYear: 2034, mw: 70, detail: "ACS · Tarrant County · Planned", tag: "reported" },
  { name: "ACS Fort Worth - Building 5", lane: "New loads", startYear: 2026, endYear: 2035, mw: 70, detail: "ACS · Tarrant County · Planned", tag: "reported" },
  { name: "AIB DFW-A - Expansion", lane: "New loads", startYear: 2026, endYear: 2028, mw: 40, detail: "AIB Data Centers · Mitchell County · Planned", tag: "reported" },
  { name: "AIB DFW-A - Phase I", lane: "New loads", startYear: 2026, endYear: 2028, mw: 15, detail: "AIB Data Centers · Mitchell County · Planned", tag: "reported" },
  { name: "Aligned DFW-04 North Star Road", lane: "New loads", startYear: 2026, endYear: 2026, mw: 86, detail: "Aligned · Collin County · Under Construction · tenant Lambda", tag: "reported" },
  { name: "Aligned DFW03 Mansfield", lane: "New loads", startYear: 2026, endYear: 2026, mw: 86, detail: "Aligned · Tarrant County · Under Construction", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-01", lane: "New loads", startYear: 2026, endYear: 2027, mw: 108, detail: "Aligned · Hale County · Under Construction", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-02", lane: "New loads", startYear: 2026, endYear: 2028, mw: 108, detail: "Aligned · Hale County · Planned", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-03", lane: "New loads", startYear: 2026, endYear: 2029, mw: 108, detail: "Aligned · Hale County · Planned", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-04", lane: "New loads", startYear: 2026, endYear: 2030, mw: 108, detail: "Aligned · Hale County · Planned", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-05", lane: "New loads", startYear: 2026, endYear: 2031, mw: 108, detail: "Aligned · Hale County · Planned", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-06", lane: "New loads", startYear: 2026, endYear: 2032, mw: 108, detail: "Aligned · Hale County · Planned", tag: "reported" },

  // --- New generation (13) ---
  { name: "Project Matador Gas Plant (PMG)", lane: "New generation", startYear: 2026, endYear: 2026, mw: 11679.3, detail: "Carson County · largest proposed ERCOT gas plant in EIA-860's queue", tag: "reported" },
  { name: "New 2026 Gas Peaker", lane: "New generation", startYear: 2026, endYear: 2026, mw: 400, detail: "Austin Energy · approved May 2026 · inside AE's own zone", tag: "reported" },
  { name: "New 2026 wind additions (Mills & Dickens)", lane: "New generation", startYear: 2026, endYear: 2026, mw: 299, detail: "Austin Energy · Invenergy PPA, approved May 2026 · part of AE's ~999 MW 2026 local-generation response", tag: "reported" },
  { name: "Battery contracts (OCI + Jupiter Power II)", lane: "New generation", startYear: 2026, endYear: 2026, mw: 300, detail: "Austin Energy · approved May/Jul 2026, 20-yr terms", tag: "reported" },
  { name: "Pin Oak Creek Energy Center", lane: "New generation", startYear: 2026, endYear: 2026, mw: 444.0, detail: "Freestone County · gas", tag: "reported" },
  { name: "Timmerman Power Plant", lane: "New generation", startYear: 2026, endYear: 2026, mw: 188.0, detail: "Caldwell County · gas · ~30 mi from Austin", tag: "reported" },
  { name: "Vast Sands Power", lane: "New generation", startYear: 2026, endYear: 2027, mw: 880.0, detail: "Ward County · gas", tag: "reported" },
  { name: "Sandow Lakes Energy Station", lane: "New generation", startYear: 2026, endYear: 2028, mw: 1290.0, detail: "Lee County · gas · ~1hr from Austin", tag: "reported" },
  { name: "Legend Power Station", lane: "New generation", startYear: 2026, endYear: 2028, mw: 754.0, detail: "Jefferson County · gas", tag: "reported" },
  { name: "Cedar Bayou 5", lane: "New generation", startYear: 2026, endYear: 2028, mw: 721.0, detail: "Chambers County · gas", tag: "reported" },
  { name: "Greens Bayou 6", lane: "New generation", startYear: 2026, endYear: 2028, mw: 447.0, detail: "Harris County · gas", tag: "reported" },
  { name: "CPV Basin Ranch Energy Center", lane: "New generation", startYear: 2026, endYear: 2029, mw: 1445.0, detail: "Ward County · gas", tag: "reported" },
  { name: "Project Matador Nuclear", lane: "New generation", startYear: 2026, endYear: 2031, mw: 4468.0, detail: "Carson County · same site as Project Matador Gas Plant", tag: "reported" },

  // --- Retiring assets (10) ---
  { name: "O W Sommers", lane: "Retiring assets", startYear: 2026, endYear: 2027, mw: 892.0, detail: "CPS Energy (San Antonio) · gas · Bexar County", tag: "reported" },
  { name: "Works 4", lane: "Retiring assets", startYear: 2026, endYear: 2027, mw: 4.9, detail: "Distillate-oil-fired unit · Wichita County", tag: "reported" },
  { name: "J K Spruce", lane: "Retiring assets", startYear: 2026, endYear: 2028, mw: 1488.5, detail: "CPS Energy (San Antonio) · coal · Bexar County · ERCOT's largest announced coal retirement in this filing", tag: "reported" },
  { name: "Hal C Weaver Power Plant", lane: "Retiring assets", startYear: 2026, endYear: 2028, mw: 152.5, detail: "UT Austin (not Austin Energy) · gas combined-cycle · Travis County", tag: "reported" },
  { name: "Sand Hill Energy Center", lane: "Retiring assets", startYear: 2026, endYear: 2035, mw: 595, detail: "Austin Energy · gas · AE 2020 Resource Plan requires retirement by 2035 or sooner", tag: "reported" },
  { name: "Fayette Power Project (AE 50% share)", lane: "Retiring assets", startYear: 2026, endYear: 2035, mw: 600, detail: "Austin Energy · coal · folded into 2035 carbon-free goal, no firm date", tag: "reported" },
  { name: "Flower Valley I", lane: "Retiring assets", startYear: 2026, endYear: 2032, mw: 9.9, detail: "Battery storage · Reeves County", tag: "reported" },
  { name: "Wind contracts (9 PPAs, 2007–2026)", lane: "Retiring assets", startYear: 2026, endYear: 2041, mw: 1894.64, detail: "Austin Energy · 9 PPAs incl. Whirlwind, Hackberry, Los Vientos II/III/IV, Whitetail, Jumbo Road, Karankawa, Raymond, Gulf Wind, Mills & Dickens", tag: "reported" },
  { name: "Madero Grid", lane: "Retiring assets", startYear: 2026, endYear: 2042, mw: 100.0, detail: "Battery storage · Hidalgo County · likely an end-of-contract-life placeholder", tag: "reported" },
  { name: "Ignacio Grid Energy Storage System", lane: "Retiring assets", startYear: 2026, endYear: 2042, mw: 100.0, detail: "Battery storage · Hidalgo County · same note as Madero Grid", tag: "reported" },
];

export const ganttNote = {
  tag: "derived" as Tag,
  note:
    "All bars are drawn from 2026 (\"now\") to each item's own target/completion/retirement year — this is a timeline of when things land, not a duration-of-construction Gantt chart. \"New loads\" reuses the map's combined load list (section 7), minus the two Cleanview data centers already operating since 2015/2025. \"New generation\" reuses EIA-860's largest proposed ERCOT gas/nuclear builds (minus one, NRG THW GT, whose EIA-reported year of 2024 is already past) plus Austin Energy's own 3 announced 2026 additions. \"Retiring assets\" combines this project's own contract-stack entries that expire within the window (excluding the Solar contracts entry, flagged elsewhere as a data-quality contradiction — its contractEnd of 2056 falls outside this 2026-2045 window despite being flagged expiresInWindow:true) with all 7 of ERCOT's EIA-reported planned-retirement plants.",
};
