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
  inAeTerritory: boolean | "unconfirmed";
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
  {
    project: "Dog's Head (Endeavor) — East Austin mega-development",
    location: "~2,614 acres along the Colorado River, East Austin, between US-183 and SH-130, north of Austin-Bergstrom International Airport (~3.5 mi east of downtown)",
    utility: "Not stated in any source found. The land was ANNEXED into the City of Austin (May 21, 2026), but annexation doesn't by itself move electric service rights — Texas electric utilities serve fixed, PUC-certificated (CCN) territories independent of city limits, and no source found names which utility holds the CCN for this specific site.",
    inAeTerritory: "unconfirmed",
    scale: "2,614-acre mixed-use development (housing, retail, office, industrial, civic); preliminary TIRZ outline cites ~6,195 homes, ~6,200 apartments, 4M sq ft industrial, 2.5M sq ft retail, 1.5M sq ft offices, 1M sq ft hotels. First announced use: Amazon's robotics division on 305 acres — described as advanced manufacturing, NOT a data center (the project's own site explicitly says Dog's Head is not pursuing large-scale data centers). No MW or power-demand figure has been published for the project or the Amazon facility.",
    status: "Development Agreement + annexation approved by City Council May 21, 2026; TIRZ No. 21 approved July 23, 2026 (35-yr term); Austin Environmental Commission recommended delaying further review to Jan 2027+ citing no environmental assessment; Regulating Plan expected ~2027. This is the exception David asked about after noting nearby loads mapped on this page are outside AE's territory — but unlike Tesla/Samsung/Blue Origin (which have confirmed non-AE utilities), this one's utility and MW load are both unconfirmed, so it's flagged here rather than folded into the map/Gantt/toll-road sections, which rely on confirmed categorization.",
    source: "KXAN, May 2026; Community Impact, May & Jul 2026; CBS Austin, Jul 2026; austincurrent.org, Jun 2026; austintexas.gov/financial-services/dogs-head-documents-and-resources; dogshead.com (developer site)",
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

// Added 2026-10-25, after David asked directly: "is the avoided cost or hub
// price going up, and why? Have we answered that?" Hub price was already
// answered (see projectionMethodology / tollRoadDiagram.channelHub). Avoided
// cost (Value of Solar) was NOT — the page only had a 2-year snapshot of one
// of VOS's four components (Transmission). This section closes that gap with
// AE's own annual figures.

export interface VosAnnualTotal {
  fiscalYear: string;
  totalCentsPerKwhUnder1MW: number;
  energyComponentCentsPerKwh: number | null;
}

export const vosAnnualHistory: VosAnnualTotal[] = [
  { fiscalYear: "FY21", totalCentsPerKwhUnder1MW: 12.53, energyComponentCentsPerKwh: null },
  { fiscalYear: "FY22", totalCentsPerKwhUnder1MW: 15.53, energyComponentCentsPerKwh: 10.05 },
  { fiscalYear: "FY23", totalCentsPerKwhUnder1MW: 15.26, energyComponentCentsPerKwh: null },
  { fiscalYear: "FY24", totalCentsPerKwhUnder1MW: 11.57, energyComponentCentsPerKwh: null },
  { fiscalYear: "FY25", totalCentsPerKwhUnder1MW: 9.52, energyComponentCentsPerKwh: 2.80 },
];

export const vosHistoricalTrendFinding = {
  tag: "reported" as Tag,
  claim:
    "The ANNUAL Value of Solar total (systems under 1 MW-ac) actually fell in the most recent years — the opposite direction from the hub price: 12.53¢/kWh (FY21) → 15.53¢ (FY22, the peak) → 15.26¢ (FY23) → 11.57¢ (FY24) → 9.52¢ (FY25). The published customer-facing rate ($0.1289/kWh, in valueOfSolarRate above) is a 5-year rolling average of exactly these figures, reset only once every 3 years — which is why the published rate doesn't visibly move the way the underlying annual number does.",
  why:
    "The Energy component — the single largest piece of VOS — collapsed from about 10.05¢/kWh (FY22) to about 2.80¢/kWh (FY25). Austin Energy's own 2026 Value of Solar Update presentation attributes this specifically to battery storage growth on ERCOT suppressing the cost of summer scarcity events, which used to be the main driver of high avoided-energy value. This is a STATEWIDE market effect (ERCOT-wide battery buildout), not a result of any of AE's own transmission or generation spending discussed elsewhere on this page.",
  source:
    "Austin Energy, \"2026 Value of Solar Update,\" presented by Tim Harvey (services.austintexas.gov/edims/document.cfm?id=470907); Resource Management Commission, Value of Solar discussion, April 29 2026 (services.austintexas.gov/edims/document.cfm?id=472353).",
};

export const vosMethodologyChangeFinding = {
  tag: "reported" as Tag,
  claim:
    "Yes — Austin Energy has PROPOSED (not yet adopted, as of this page's last update) changing how the rate is calculated, in a way that would raise the published FY2027–2029 rate even though the underlying annual avoided costs have been falling. The current method pays out each historical year's avoided-cost dollars at their original nominal value; AE's own presentation says accounting for inflation instead would raise the rate by about 2¢/kWh on average, to roughly 14.4¢–15.2¢/kWh across FY27–FY29 (versus $0.1289 under the current method). This is a proposal the Resource Management Commission can push into the FY2027 budget process — not an adopted rate change.",
  secondChange:
    "A second, separate methodology question is already scheduled: AE says it will engage stakeholders in FY27 to revisit the Societal benefits (carbon) component specifically, because new federal policy sets the Social Cost of Carbon used in that formula to $0/kWh — which would otherwise zero out one of VOS's four components outright. Neither this nor the inflation-adjustment proposal has been decided as of this page's last update.",
  implication:
    "So the honest answer to \"is avoided cost going up\" has two layers: the real annual cost has been falling (driven by batteries, not AE's spending), but the published rate customers actually see is on track to rise anyway — for a methodology-correction reason, and possibly a second methodology change still to come, not because distributed solar is suddenly avoiding more cost.",
  source:
    "Austin Energy, \"2026 Value of Solar Update\" (id=470907); Resource Management Commission VOS discussion, Apr 29 2026 (id=472353).",
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
  { name: "Dog's Head (Endeavor) — East Austin", category: "load", mw: null, lat: 30.2250, lon: -97.6480, year: "2026", detail: "2,614-acre mixed-use development; Amazon robotics (305 ac, not a data center) is the first announced use; electric utility and MW load unconfirmed", precision: "city-approx", tag: "blocked" },
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
// 8. SUPPLY / DEMAND / GAP TABLE, 2027-2045 (added 2026-10-23, revised 2026-10-24)
// ---------------------------------------------------------------------------
// SCOPE — read this first: everything in this table is AUSTIN ENERGY'S OWN
// contracted/owned capacity and AE's OWN system peak demand. It is NOT an
// ERCOT-wide supply/demand balance — ERCOT runs its own much larger statewide
// resource-adequacy accounting (its Capacity, Demand and Reserves report),
// which isn't reproduced here. Don't read "supply" below as "all of ERCOT's
// generation" — the map and the Gantt chart in section 9 mix in statewide
// ERCOT context (the biggest proposed gas/nuclear plants, other utilities'
// retirements) for scale and are scoped item-by-item there; this table stays
// inside AE's own ledger throughout.
//
// NAMEPLATE vs. EFFECTIVE/DEPENDABLE SUPPLY — the first revision of this
// table (2026-10-23) held "supply" flat at the straight sum of contractStack's
// nameplate MW (5,130.64 MW) and compared that directly to demand. That
// overstates what AE can actually count on at its own peak hour: about 53%
// of that nameplate figure (1,894.64 MW wind + 804 MW solar) is weather-
// dependent, and nameplate MW isn't what shows up when the sun isn't out or
// the wind isn't blowing. This revision adds a second, capacity-factor-
// adjusted "effective/dependable supply" figure alongside the nameplate one,
// using ERCOT's own benchmarked summer-peak capacity contribution by fuel
// (from ERCOT's Dec 2025 Capacity, Demand and Reserves report, "Peak Load
// Hour" column, Summer 2026): wind ~19.9% of nameplate (8,186 MW counted /
// 41,208 MW installed, ERCOT-wide), solar ~23.7% (9,932 / 41,926 MW), battery
// storage ~43.0% (9,262 / 21,537 MW). Thermal (gas, coal, nuclear) is assumed
// at a flat 95% of nameplate as dependable (a simplifying scenario
// assumption, not an ERCOT-published derate), and the Nacogdoches biomass
// unit at 90%. Applying those to each contractStack entry:
//   Sand Hill (Gas) 595 x 95% = 565.25 | New 2026 Gas Peaker 400 x 95% = 380.00
//   Fayette (Coal) 600 x 95% = 570.00 | South Texas Project (Nuclear) 432 x 95% = 410.40
//   Wind contracts 1,894.64 x 19.87% = 376.37 | Solar contracts 804 x 23.69% = 190.46
//   Battery contracts 300 x 43.01% = 129.02 | Nacogdoches biomass 105 x 90% = 94.50
//   => Effective/dependable total = 2,716.0 MW (53% of the 5,130.64 MW nameplate sum)
// IMPORTANT CAVEAT: the wind/solar/storage percentages above are ERCOT-WIDE
// averages, not specific to AE's individual contracted units (e.g. AE's new
// 2026 battery may be locally dispatched and sized specifically to cover AE's
// own evening peak, which could accredit higher than the system-wide 43%
// average used here) — flagged as benchmarked/scenario, not a figure AE or
// ERCOT has published for these specific contracts.
//
// WHAT THE NEGATIVE "EFFECTIVE GAP" MEANS: on this dependable-capacity basis,
// AE's own contracted fleet already falls short of AE's own ~3,100 MW 2026
// peak — before any demand growth. That's not a blackout risk by itself: AE
// is inside the single ERCOT market and can (and does) buy the shortfall on
// the wholesale market at the hub price, rather than needing to physically
// self-supply every MW of its own peak. That's exactly the mechanism section
// 1's price projection is about — it's WHY ERCOT's statewide hub price (set
// by statewide gas-on-the-margin economics, pushed up by statewide data-
// center load growth) matters so directly to Austin ratepayers even though
// AE "has enough contracted nameplate MW" on paper. The nameplate gap (which
// only turns negative in the early 2040s) and the effective/dependable gap
// (already negative throughout the window) are both shown below so neither
// reading is presented as the whole story on its own.
//
// SUPPLY (both bases) is held FLAT 2027-2045, consistent with this project's
// own replacementAssumption (section 2): expiring contracts are modeled as
// replaced 1:1 by the same technology, so total MW — and, as a simplifying
// scenario assumption, the technology mix and its dependable share — don't
// mechanically shift over the window even as individual contracts roll off.
//
// A DATA-QUALITY NOTE, surfaced while building this table and not introduced
// by it: contractStackTotals.totalActiveMw (5,528.64) and .expiringInWindowMw
// (4,255.64) do NOT match what you get by summing the individual contractStack
// entries (5,130.64 and, for entries flagged expiresInWindow:true, 3,893.64) —
// a ~398 MW and ~362 MW gap respectively. Separately, the Solar contracts entry
// is flagged expiresInWindow:true but has contractEnd:2056, outside this
// 2026-2045 window — a flag/date contradiction. This table uses the sum of the
// granular array (5,130.64 MW nameplate) as the more auditable, traceable
// figure, and flags rather than silently corrects the totals object above.
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
  effectiveSupplyMw: number;
  effectiveGapMw: number;
}

export const contractStackCapacityFactors = {
  tag: "benchmarked" as Tag,
  source: "ERCOT Capacity, Demand and Reserves report, December 2025 (Summer 2026 \"Peak Load Hour\" capacity contribution by category)",
  byFuel: {
    Gas: 0.95,
    Coal: 0.95,
    Nuclear: 0.95,
    Wind: 0.1987,
    Solar: 0.2369,
    Battery: 0.4301,
    Biomass: 0.90,
  } as Record<ContractResource["fuel"], number>,
  note:
    "Gas/Coal/Nuclear assumed at a flat 95% of nameplate as dependable capacity (a simplifying scenario assumption — not an ERCOT-published thermal derate). Wind/Solar/Battery use ERCOT-wide Summer 2026 Peak Load Hour contribution ÷ ERCOT-wide installed nameplate for that category (wind 8,186/41,208 MW; solar 9,932/41,926 MW; storage 9,262/21,537 MW) — system-wide averages, not figures specific to AE's own contracted units. Biomass assumed 90%.",
};

export const supplyDemandGapTable: SupplyDemandGapRow[] = [
  { year: 2027, supplyMw: 5130.64, demandMw: 3205.7, gapMw: 1924.9, effectiveSupplyMw: 2716.0, effectiveGapMw: -489.7 },
  { year: 2028, supplyMw: 5130.64, demandMw: 3315.0, gapMw: 1815.6, effectiveSupplyMw: 2716.0, effectiveGapMw: -599.0 },
  { year: 2029, supplyMw: 5130.64, demandMw: 3428.1, gapMw: 1702.6, effectiveSupplyMw: 2716.0, effectiveGapMw: -712.1 },
  { year: 2030, supplyMw: 5130.64, demandMw: 3545.0, gapMw: 1585.7, effectiveSupplyMw: 2716.0, effectiveGapMw: -829.0 },
  { year: 2031, supplyMw: 5130.64, demandMw: 3665.8, gapMw: 1464.8, effectiveSupplyMw: 2716.0, effectiveGapMw: -949.8 },
  { year: 2032, supplyMw: 5130.64, demandMw: 3790.9, gapMw: 1339.8, effectiveSupplyMw: 2716.0, effectiveGapMw: -1074.9 },
  { year: 2033, supplyMw: 5130.64, demandMw: 3920.1, gapMw: 1210.5, effectiveSupplyMw: 2716.0, effectiveGapMw: -1204.1 },
  { year: 2034, supplyMw: 5130.64, demandMw: 4053.8, gapMw: 1076.8, effectiveSupplyMw: 2716.0, effectiveGapMw: -1337.8 },
  { year: 2035, supplyMw: 5130.64, demandMw: 4192.0, gapMw: 938.6, effectiveSupplyMw: 2716.0, effectiveGapMw: -1476.0 },
  { year: 2036, supplyMw: 5130.64, demandMw: 4335.0, gapMw: 795.7, effectiveSupplyMw: 2716.0, effectiveGapMw: -1619.0 },
  { year: 2037, supplyMw: 5130.64, demandMw: 4482.8, gapMw: 647.8, effectiveSupplyMw: 2716.0, effectiveGapMw: -1766.8 },
  { year: 2038, supplyMw: 5130.64, demandMw: 4635.7, gapMw: 495.0, effectiveSupplyMw: 2716.0, effectiveGapMw: -1919.7 },
  { year: 2039, supplyMw: 5130.64, demandMw: 4793.7, gapMw: 336.9, effectiveSupplyMw: 2716.0, effectiveGapMw: -2077.7 },
  { year: 2040, supplyMw: 5130.64, demandMw: 4957.2, gapMw: 173.4, effectiveSupplyMw: 2716.0, effectiveGapMw: -2241.2 },
  { year: 2041, supplyMw: 5130.64, demandMw: 5126.2, gapMw: 4.4, effectiveSupplyMw: 2716.0, effectiveGapMw: -2410.3 },
  { year: 2042, supplyMw: 5130.64, demandMw: 5301.1, gapMw: -170.4, effectiveSupplyMw: 2716.0, effectiveGapMw: -2585.1 },
  { year: 2043, supplyMw: 5130.64, demandMw: 5481.8, gapMw: -351.2, effectiveSupplyMw: 2716.0, effectiveGapMw: -2765.8 },
  { year: 2044, supplyMw: 5130.64, demandMw: 5668.8, gapMw: -538.1, effectiveSupplyMw: 2716.0, effectiveGapMw: -2952.8 },
  { year: 2045, supplyMw: 5130.64, demandMw: 5862.1, gapMw: -731.4, effectiveSupplyMw: 2716.0, effectiveGapMw: -3146.1 },
];

export const supplyDemandGapMethodology = {
  tag: "scenario" as Tag,
  scopeNote:
    "This whole table is Austin Energy's OWN contracted/owned supply against AE's OWN system peak demand — not an ERCOT-wide balance. ERCOT tracks statewide resource adequacy separately (its own Capacity, Demand and Reserves report); that's not reproduced here.",
  supplyNote:
    "Nameplate supply held flat at 5,130.64 MW for the whole window — the sum of this project's own contractStack entries (section 2), not AE's contractStackTotals figure (see data-quality note below). Flat because this model's own replacementAssumption treats expiring contracts as replaced 1:1 by the same technology, so nameplate capacity itself doesn't mechanically shrink over the window — only its cost and ownership terms change.",
  effectiveSupplyNote:
    "Effective/dependable supply applies ERCOT-benchmarked summer-peak capacity-contribution rates by fuel (contractStackCapacityFactors, above) to each contractStack entry and holds that mix flat too: 2,716.0 MW, about 53% of the nameplate figure, because roughly half of AE's contracted nameplate MW is wind and solar, which ERCOT counts at only ~20-24% of nameplate toward peak reliability. On this basis AE's own effective gap is already negative in 2027 and grows throughout the window — AE is a structural net buyer of wholesale power at its own peak hour, which is exactly why ERCOT's statewide hub price (section 1) matters so much to Austin ratepayers even though AE's nameplate MW looks adequate on paper until the 2040s.",
  demandNote:
    "Demand is a rough scenario proxy, not a published AE or ERCOT load forecast: AE's reported ~3.1 GW 2026 system peak (aggregateLoadPipeline), grown at this same model's own Base-scenario price CAGR (3.41%/yr) as a stand-in for load growth. Treat the nameplate crossover point (between 2041 and 2042) as illustrative of the shape of the problem — new large loads outpacing flat contracted nameplate supply — not a forecast of the exact year it happens. The effective/dependable gap, by contrast, is already negative at the start of the window.",
  dataQualityNote:
    "contractStackTotals.totalActiveMw (5,528.64 MW) and .expiringInWindowMw (4,255.64 MW) do not match the sum of the individual contractStack entries (5,130.64 MW total; 3,893.64 MW of entries flagged expiresInWindow:true) — gaps of about 398 MW and 362 MW. The Solar contracts entry is also flagged expiresInWindow:true despite a contractEnd of 2056, outside this window. Flagged here rather than silently reconciled; this table uses the granular, auditable sum.",
};

// ---------------------------------------------------------------------------
// 9. GANTT-STYLE TIMELINE — new loads, new generation, retiring assets
// (added 2026-10-23, revised 2026-10-24: added per-item `scope` and MW-based
// bar-thickness encoding)
// ---------------------------------------------------------------------------
// SCOPE — this chart deliberately mixes two different scopes to show scale,
// and that's the single most important thing to read correctly on it: AE
// items are Austin Energy's own contracted/owned assets (the same universe
// as the supply/demand/gap table in section 8); Statewide items are ERCOT-
// wide context (other utilities' plants, or loads mostly outside AE's own
// territory — all 4 named-load projects and all 18 Cleanview data centers in
// the "New loads" lane are confirmed NOT in AE's service territory) included
// to show the scale of what's happening around AE, not what AE itself owns
// or serves. Every item below carries a `scope` field so this distinction
// survives into the rendered chart (each item is labeled "AE" or
// "Statewide"), not just in this comment.
//
// Three lanes, each item spanning from "now" (2026) to its target/completion/
// retirement year, over a fixed 2026-2045 axis:
//   - "New loads": combinedLoadsForMap (section 7), excluding items whose
//     year is already in the past (Aligned Dallas DFW-01/-02, operating since
//     2015/2025) — 20 items, ALL scope:"Statewide" (none are in AE territory;
//     they're shown to illustrate the statewide load growth that pushes up
//     ERCOT's hub price, section 1 — not loads AE itself has to serve).
//   - "New generation": the 10 of 11 ercotProposedLargeGasNuclear entries with
//     a year still ahead (excluding NRG THW GT, EIA-reported year 2024, all
//     scope:"Statewide"), plus Austin Energy's own 3 announced 2026 additions
//     (scope:"AE" — the 400 MW gas peaker, ~299 MW of new wind, 300 MW of new
//     battery — AE's own reported total for these three is ~999 MW,
//     Community Impact/KUT) — 13 items.
//   - "Retiring assets": the 3 contractStack entries with expiresInWindow:true
//     AND a numeric contractEnd within this window (scope:"AE" — Sand Hill
//     2035, Fayette 2035, Wind contracts 2041 — Solar's contracts excluded
//     per the contractEnd:2056-outside-window note above), plus all 7
//     ercotRetiringSoon entries (scope:"Statewide") — 10 items.

export type GanttLane = "New loads" | "New generation" | "Retiring assets";
export type GanttScope = "AE" | "Statewide";

export interface GanttItem {
  name: string;
  lane: GanttLane;
  scope: GanttScope;
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
  // --- New loads (20) — all scope:"Statewide"; none are in AE's own territory ---
  { name: "Tesla Gigafactory Texas expansion", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2026, mw: null, detail: "Travis County, Bluebonnet Electric Co-op territory (not AE) · targeted complete end of 2026", tag: "reported" },
  { name: "Samsung Taylor semiconductor fab(s)", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2026, mw: null, detail: "Taylor, Oncor territory (not AE) · first fab targeting 2026 risk production", tag: "reported" },
  { name: "Blue Origin — Constellation Park", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2028, mw: null, detail: "Hutto, Oncor territory (not AE) · construction timeline not disclosed as of mid-2026; end year estimated", tag: "reported", yearIsEstimate: true },
  { name: "CloudBurst San Marcos data center", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2026, mw: null, detail: "Hays County (not AE) · targeting Q3 2026 ops; runs on gas via pipeline, not ERCOT grid power", tag: "reported" },
  { name: "5MW Temple Data Center", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2026, mw: 5, detail: "Oppidan · Bell County · Planned", tag: "reported" },
  { name: "ACS Fort Worth - Building 1", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2030, mw: 70, detail: "ACS · Tarrant County · Planned", tag: "reported" },
  { name: "ACS Fort Worth - Building 2", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2031, mw: 70, detail: "ACS · Tarrant County · Planned", tag: "reported" },
  { name: "ACS Fort Worth - Building 3", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2033, mw: 70, detail: "ACS · Tarrant County · Planned", tag: "reported" },
  { name: "ACS Fort Worth - Building 4", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2034, mw: 70, detail: "ACS · Tarrant County · Planned", tag: "reported" },
  { name: "ACS Fort Worth - Building 5", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2035, mw: 70, detail: "ACS · Tarrant County · Planned", tag: "reported" },
  { name: "AIB DFW-A - Expansion", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2028, mw: 40, detail: "AIB Data Centers · Mitchell County · Planned", tag: "reported" },
  { name: "AIB DFW-A - Phase I", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2028, mw: 15, detail: "AIB Data Centers · Mitchell County · Planned", tag: "reported" },
  { name: "Aligned DFW-04 North Star Road", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2026, mw: 86, detail: "Aligned · Collin County · Under Construction · tenant Lambda", tag: "reported" },
  { name: "Aligned DFW03 Mansfield", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2026, mw: 86, detail: "Aligned · Tarrant County · Under Construction", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-01", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2027, mw: 108, detail: "Aligned · Hale County · Under Construction", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-02", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2028, mw: 108, detail: "Aligned · Hale County · Planned", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-03", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2029, mw: 108, detail: "Aligned · Hale County · Planned", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-04", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2030, mw: 108, detail: "Aligned · Hale County · Planned", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-05", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2031, mw: 108, detail: "Aligned · Hale County · Planned", tag: "reported" },
  { name: "Aligned Project Caprock - LBB-06", lane: "New loads", scope: "Statewide", startYear: 2026, endYear: 2032, mw: 108, detail: "Aligned · Hale County · Planned", tag: "reported" },

  // --- New generation (13): 10 scope:"Statewide" + 3 scope:"AE" ---
  { name: "Project Matador Gas Plant (PMG)", lane: "New generation", scope: "Statewide", startYear: 2026, endYear: 2026, mw: 11679.3, detail: "Carson County · largest proposed ERCOT gas plant in EIA-860's queue", tag: "reported" },
  { name: "New 2026 Gas Peaker", lane: "New generation", scope: "AE", startYear: 2026, endYear: 2026, mw: 400, detail: "Austin Energy · approved May 2026 · inside AE's own zone", tag: "reported" },
  { name: "New 2026 wind additions (Mills & Dickens)", lane: "New generation", scope: "AE", startYear: 2026, endYear: 2026, mw: 299, detail: "Austin Energy · Invenergy PPA, approved May 2026 · part of AE's ~999 MW 2026 local-generation response", tag: "reported" },
  { name: "Battery contracts (OCI + Jupiter Power II)", lane: "New generation", scope: "AE", startYear: 2026, endYear: 2026, mw: 300, detail: "Austin Energy · approved May/Jul 2026, 20-yr terms", tag: "reported" },
  { name: "Pin Oak Creek Energy Center", lane: "New generation", scope: "Statewide", startYear: 2026, endYear: 2026, mw: 444.0, detail: "Freestone County · gas", tag: "reported" },
  { name: "Timmerman Power Plant", lane: "New generation", scope: "Statewide", startYear: 2026, endYear: 2026, mw: 188.0, detail: "Caldwell County · gas · ~30 mi from Austin", tag: "reported" },
  { name: "Vast Sands Power", lane: "New generation", scope: "Statewide", startYear: 2026, endYear: 2027, mw: 880.0, detail: "Ward County · gas", tag: "reported" },
  { name: "Sandow Lakes Energy Station", lane: "New generation", scope: "Statewide", startYear: 2026, endYear: 2028, mw: 1290.0, detail: "Lee County · gas · ~1hr from Austin", tag: "reported" },
  { name: "Legend Power Station", lane: "New generation", scope: "Statewide", startYear: 2026, endYear: 2028, mw: 754.0, detail: "Jefferson County · gas", tag: "reported" },
  { name: "Cedar Bayou 5", lane: "New generation", scope: "Statewide", startYear: 2026, endYear: 2028, mw: 721.0, detail: "Chambers County · gas", tag: "reported" },
  { name: "Greens Bayou 6", lane: "New generation", scope: "Statewide", startYear: 2026, endYear: 2028, mw: 447.0, detail: "Harris County · gas", tag: "reported" },
  { name: "CPV Basin Ranch Energy Center", lane: "New generation", scope: "Statewide", startYear: 2026, endYear: 2029, mw: 1445.0, detail: "Ward County · gas", tag: "reported" },
  { name: "Project Matador Nuclear", lane: "New generation", scope: "Statewide", startYear: 2026, endYear: 2031, mw: 4468.0, detail: "Carson County · same site as Project Matador Gas Plant", tag: "reported" },

  // --- Retiring assets (10): 7 scope:"Statewide" + 3 scope:"AE" ---
  { name: "O W Sommers", lane: "Retiring assets", scope: "Statewide", startYear: 2026, endYear: 2027, mw: 892.0, detail: "CPS Energy (San Antonio) · gas · Bexar County", tag: "reported" },
  { name: "Works 4", lane: "Retiring assets", scope: "Statewide", startYear: 2026, endYear: 2027, mw: 4.9, detail: "Distillate-oil-fired unit · Wichita County", tag: "reported" },
  { name: "J K Spruce", lane: "Retiring assets", scope: "Statewide", startYear: 2026, endYear: 2028, mw: 1488.5, detail: "CPS Energy (San Antonio) · coal · Bexar County · ERCOT's largest announced coal retirement in this filing", tag: "reported" },
  { name: "Hal C Weaver Power Plant", lane: "Retiring assets", scope: "Statewide", startYear: 2026, endYear: 2028, mw: 152.5, detail: "UT Austin (not Austin Energy) · gas combined-cycle · Travis County", tag: "reported" },
  { name: "Sand Hill Energy Center", lane: "Retiring assets", scope: "AE", startYear: 2026, endYear: 2035, mw: 595, detail: "Austin Energy · gas · AE 2020 Resource Plan requires retirement by 2035 or sooner", tag: "reported" },
  { name: "Fayette Power Project (AE 50% share)", lane: "Retiring assets", scope: "AE", startYear: 2026, endYear: 2035, mw: 600, detail: "Austin Energy · coal · folded into 2035 carbon-free goal, no firm date", tag: "reported" },
  { name: "Flower Valley I", lane: "Retiring assets", scope: "Statewide", startYear: 2026, endYear: 2032, mw: 9.9, detail: "Battery storage · Reeves County", tag: "reported" },
  { name: "Wind contracts (9 PPAs, 2007–2026)", lane: "Retiring assets", scope: "AE", startYear: 2026, endYear: 2041, mw: 1894.64, detail: "Austin Energy · 9 PPAs incl. Whirlwind, Hackberry, Los Vientos II/III/IV, Whitetail, Jumbo Road, Karankawa, Raymond, Gulf Wind, Mills & Dickens", tag: "reported" },
  { name: "Madero Grid", lane: "Retiring assets", scope: "Statewide", startYear: 2026, endYear: 2042, mw: 100.0, detail: "Battery storage · Hidalgo County · likely an end-of-contract-life placeholder", tag: "reported" },
  { name: "Ignacio Grid Energy Storage System", lane: "Retiring assets", scope: "Statewide", startYear: 2026, endYear: 2042, mw: 100.0, detail: "Battery storage · Hidalgo County · same note as Madero Grid", tag: "reported" },
];

export const ganttScopeCounts = {
  AE: ganttItems.filter((i) => i.scope === "AE").length,
  Statewide: ganttItems.filter((i) => i.scope === "Statewide").length,
};

export const ganttNote = {
  tag: "derived" as Tag,
  note:
    "All bars are drawn from 2026 (\"now\") to each item's own target/completion/retirement year — this is a timeline of when things land, not a duration-of-construction Gantt chart. Bar THICKNESS scales with each item's MW (sqrt scale, so a project 100x the size isn't drawn 100x taller) — items with no disclosed MW (Tesla, Samsung, Blue Origin) get a thin placeholder bar. Each item is also labeled AE or Statewide: AE = Austin Energy's own contracted/owned assets (the same universe as the supply/demand/gap table in section 8); Statewide = ERCOT-wide context included for scale, not assets AE owns or loads AE serves. Of the 43 items here, 6 are scope:\"AE\" and 37 are scope:\"Statewide\" — this chart is intentionally weighted toward showing how much bigger the surrounding statewide picture is than AE's own slice of it. \"New loads\" reuses the map's combined load list (section 7), minus the two Cleanview data centers already operating since 2015/2025 — all 20 are Statewide; none are inside AE's own service territory. \"New generation\" reuses EIA-860's largest proposed ERCOT gas/nuclear builds (minus one, NRG THW GT, whose EIA-reported year of 2024 is already past) plus Austin Energy's own 3 announced 2026 additions. \"Retiring assets\" combines this project's own contract-stack entries that expire within the window (excluding the Solar contracts entry, flagged elsewhere as a data-quality contradiction — its contractEnd of 2056 falls outside this 2026-2045 window despite being flagged expiresInWindow:true) with all 7 of ERCOT's EIA-reported planned-retirement plants.",
};

// ---------------------------------------------------------------------------
// 10. "WHY GEOGRAPHY MATTERS" — the toll-road mechanism diagram (added 2026-10-24)
// ---------------------------------------------------------------------------
// Built to answer a direct question: does any of the above actually show WHY
// loads and generation move Austin Energy's price, or does it just catalog
// MW and dates in a separate section from the price chart? Honest answer:
// the price projection (section 1) and the load/generation detail (sections
// 7-9) weren't visually or narratively connected — this section is the fix.
//
// THE REAL MECHANISM has two separate channels, both already described in
// methodologyNote (section 1) but easy to miss in paragraph form:
//   (1) HUB CHANNEL (statewide): ERCOT-wide load growth (data centers
//       anywhere on the grid) tightens the whole state's supply/demand
//       balance and sets the hub/system price — the larger of LZ_AEN's two
//       components. This is what projection20yr's hub column already
//       models; it's not AE-specific.
//   (2) BASIS/CONGESTION CHANNEL (local): a handful of specific nearby loads
//       (Tesla, Samsung, Blue Origin — all confirmed NOT on Austin Energy's
//       own system) sit on the same transmission-constrained Central Texas
//       import paths AE's own wind/solar imports rely on, so they push up
//       AE's own local congestion/basis premium directly — regardless of
//       whether they're AE customers. AE's own local generation (the
//       peaker, wind, battery) works the other way, adding supply inside
//       the constrained zone and relieving that same premium. This is the
//       channel the toll-road analogy below is built around, and it's the
//       one with real, sourced AE-specific numbers already in this file
//       (projection20yr's own .basis values; the 2021-2023 cross-check in
//       crossChecks).
//
// THE ANALOGY ITSELF is a standard way ISOs/utilities explain locational
// marginal pricing, not something invented for this page: cheap generation
// sits far away (West Texas/Panhandle wind, gas, nuclear); the transmission
// path to a load center has a fixed number of "lanes"; when nearby demand
// fills those lanes, the load center pays a premium on top of the far-away
// hub price — a "toll" for the congestion. Standard LMP/congestion
// explainers (e.g. upg.energy's "Understanding LMP and congestion costs")
// describe this exact West-Texas-wind-to-Dallas-load mechanism using the
// same highway/toll framing used here.
//
// WHAT THIS DIAGRAM DOES NOT CLAIM: it does not assert that Samsung's own
// meter sees a specific lower price than Austin Energy's zone. Samsung's
// Taylor fab is on Oncor's system (a different ERCOT load zone), and this
// project has no settlement-point-specific price data comparing Oncor's
// zone to LZ_AEN — that comparison is flagged as an open question, not
// answered either way. What IS sourced and shown here is AE's OWN
// documented congestion premium and which nearby loads are reported to sit
// in the same broader region AE imports through.
//
// REGIONAL, NOT CONFIRMED-LOCAL — a correction made 2026-10-24: of the 5
// named projects in namedLoadProjects and all 18 Cleanview data centers, 4
// named projects + all 18 Cleanview centers are confirmed inAeTerritory:false
// / outside Travis County — none are Austin Energy customers, and several of
// the Cleanview centers (Fort Worth, Lubbock-area, Mitchell County) aren't
// geographically near Austin at all. The 5th named project — Dog's Head
// (Endeavor), added 2026-10-24 after David asked whether it was an exception
// — is inAeTerritory:"unconfirmed", not confirmed either way: no source
// found names its electric utility, and annexation into the city doesn't by
// itself move electric-service (CCN) rights. It appears in the
// named-projects table (section 3) and on the map (section 7, tagged
// "blocked") so it isn't lost, but it's deliberately left OUT of this
// toll-road diagram and the Gantt chart below, since both of those rely on
// confirmed AE/not-AE categorization and Dog's Head doesn't have one yet.
// The earlier draft of channelBasis below overstated
// the specificity of the claim by saying these loads sit on "the same
// transmission-constrained Central Texas import paths" AE relies on — this
// project has no transmission-topology data confirming which loads
// physically share lines with AE's own imports. What's defensible is
// narrower and regional: Tesla, Samsung, and Blue Origin are genuinely
// close to Austin (Travis/Williamson/Hays counties) and plausibly draw on
// the same broad Central Texas transmission region AE does, which is
// consistent with (not proof of) the congestion-channel story; the more
// distant Cleanview data centers are better read as part of the STATEWIDE
// hub-price channel (channel 1) than this local/regional one. The diagram
// and its labels below have been reworded accordingly.

export const tollRoadDiagram = {
  tag: "derived" as Tag,
  scopeNote:
    "This diagram simplifies a real ERCOT mechanism (locational marginal pricing / congestion cost) into a single schematic \"highway\" — it is not a literal map of transmission lines, and Austin's real import constraints involve many lines and loop flow, not one road. The generation, load, and toll-gate positions are illustrative placement, not GIS-accurate. It is also a REGIONAL story, not a confirmed hyper-local one: this project has no transmission-topology data showing which specific lines these loads physically share with AE's own imports — only that Tesla, Samsung, and Blue Origin are geographically close to Austin (Travis/Williamson/Hays counties) and in the same broad Central Texas transmission region.",
  channelHub: {
    label: "Channel 1 — the hub price (statewide)",
    text:
      "ERCOT-wide load growth — data centers anywhere on the grid, including ones far from Austin (several of the Cleanview-sourced data centers mapped on this page are near Fort Worth, Lubbock, and West Texas, not Central Texas) — tightens the whole state's supply/demand balance and sets the hub/system price. This is the bigger of LZ_AEN's two components and it's what most of section 1's price chart is already modeling.",
  },
  channelBasis: {
    label: "Channel 2 — the regional congestion toll (Central Texas, not confirmed hyper-local)",
    text:
      "A handful of large loads confirmed NOT on Austin Energy's own system — Tesla's Travis County expansion, Samsung's Taylor fab, Blue Origin's Hutto campus — are geographically close to Austin and sit within the same broad Central Texas transmission region AE's own remote wind/solar imports depend on. That's a regional relationship, not a confirmed shared-line one — this project doesn't have transmission-topology data proving these specific loads draw on the exact same constrained path as AE's imports. AE's own local generation (the 2026 peaker, new wind, new battery) works the opposite way regardless: it adds supply inside AE's own zone and relieves the congestion premium at AE's own node specifically (see tollMoneyFlowFinding below for who that premium is actually paid to).",
  },
  samsungCaveat:
    "This diagram does NOT claim Samsung's own meter pays a specific lower price than Austin's. Samsung's Taylor fab is on Oncor's system — a different ERCOT load zone — and this project has no settlement-point-specific price data comparing that zone to LZ_AEN, and no transmission-topology data confirming it shares AE's specific import lines. Whether proximity to generation actually makes Taylor cheaper than Austin is an open question this data doesn't answer; what's sourced here is AE's own documented congestion premium and which nearby loads are regionally close to AE's own territory.",
  tollGrowth: {
    label: "The toll itself, over time (Austin's reported basis/congestion premium)",
    text:
      "Austin's Base-scenario basis/congestion premium — the \"toll\" in this analogy — grows from $5.99/MWh in 2026 to $12.38/MWh by 2045 (projection20yr), already a 107% increase on its own. The High scenario reaches $23.51/MWh. For scale, AE's own historical post-Uri basis cost (2021-2023, before 2026's local-generation relief) ran $11.60-13.54/MWh (crossChecks) — the Base scenario doesn't re-approach that level until 2043.",
  },
};

// CORRECTION (added 2026-10-25, after David pushed on "does this toll actually
// buy anyone more electricity, or is it just whoever owns the line charging
// more"): earlier wording on this page called this "AE's toll" in a way that
// could be misread as money Austin Energy collects and keeps. It isn't. See
// tollMoneyFlowFinding below before reading "basis/congestion premium"
// anywhere else on this page as AE revenue.
export const tollMoneyFlowFinding = {
  tag: "derived" as Tag,
  claim:
    "The \"toll\" is a price gap Austin customers pay, not money Austin Energy collects. In ERCOT's nodal market, when AE's import lines are congested, the higher price at Austin's node mostly reflects having to run a more expensive LOCAL generator instead of the cheaper, congested-out one — that extra margin is paid to THAT generator, not to AE or to whoever owns the transmission line. A separate layer, Congestion Revenue Rights (CRRs), lets market participants hedge against this price gap; ERCOT auctions CRRs and generally credits that auction revenue back to reduce the transmission charges load pays, rather than routing it to transmission owners as profit.",
  separateChannel:
    "AE's and Oncor's actual revenue from owning transmission assets — the $500M CIP, the 765kV STEP lines — comes through a completely different, regulated channel: a cost-of-service rate on their approved capital investment (their \"rate base\"), set by the PUC (for Oncor) or AE's own City Council-approved rates (for AE). That revenue is paid whether or not the line is congested that day. So \"the toll\" and \"what the line's owner earns\" are two different pots of money, not one.",
  throughputTest:
    "This also answers the throughput question directly: a congestion price on an already-constrained line, with no new capacity added, does not move one more electron — it only rations the existing fixed capacity and prices the backup generation that has to run instead. What actually adds throughput is new physical capacity (new lines, reconductoring, voltage upgrades) — which is what ERCOT's own Congestion Cost Savings Test methodology is built to evaluate: whether a proposed line's congestion-cost reduction exceeds its build cost. The $500M AE CIP and the 765kV lines are claims to be that kind of capacity addition; whether this specific $500M clears that bar has not been tested in public (see transmissionRateImpactFinding above).",
  source:
    "ERCOT Congestion Revenue Rights market education materials (ercot.com/mktinfo/crr); PCI Energy Solutions, \"How ERCOT's CRR Auction Works\"; Renewable Energy World, \"Primer on LMP\"; ERCOT/E3 Congestion Cost Savings Test for Economic Transmission Report, March 2024.",
};

// ---------------------------------------------------------------------------
// 11. PROXIMITY RADAR — a second, literal-geography view of distance from
// Austin (added 2026-10-24, after David asked for "something like circles
// around Austin where the loads and generators are and where the cost
// points are" as a different visual from the toll-road schematic above).
// ---------------------------------------------------------------------------
// Unlike the toll-road diagram (an illustrative, non-GIS schematic), every
// position here is REAL: great-circle (haversine) distance and true compass
// bearing from downtown Austin (30.2672, -97.7431 — the same point
// REFERENCE_CITIES uses for the map in section 7/2.5), computed from the
// exact lat/lon already sourced elsewhere in this file for each project.
// This is a CURATED subset, not the full 40+-point map dataset — picked to
// show the actual range the "regional vs. far away" argument depends on:
// from Tesla / Dog's Head / Sand Hill, all within 9 miles of downtown, out
// to Project Matador, 400+ miles away in the Panhandle. "Distance" here is
// straight-line, not transmission-line miles, driving distance, or proof of
// a shared line — same caveat as tollRoadDiagram's regional-not-local note
// above; it answers "how close is this, really" and nothing more.

export type ProximityCategory = "load" | "load-unconfirmed" | "generation-ae" | "generation-far";

export interface ProximityPoint {
  name: string;
  category: ProximityCategory;
  mw: number | null;
  distanceMi: number;
  bearingDeg: number; // true compass bearing from downtown Austin, 0=N, 90=E
  detail: string;
  tag: Tag;
}

export const austinReferencePoint = {
  lat: 30.2672,
  lon: -97.7431,
  label: "Downtown Austin — same reference point the map in section 7 uses for REFERENCE_CITIES",
};

export const proximityPoints: ProximityPoint[] = [
  { name: "Dog's Head (Endeavor) — East Austin", category: "load-unconfirmed", mw: null, distanceMi: 6.4, bearingDeg: 117.2, detail: "2,614-acre mixed-use development; utility and MW both unconfirmed (section 3)", tag: "blocked" },
  { name: "Tesla Gigafactory Texas expansion", category: "load", mw: null, distanceMi: 8.1, bearingDeg: 112.6, detail: "Travis County · Bluebonnet Electric Co-op territory (not AE)", tag: "derived" },
  { name: "Sand Hill Energy Center", category: "generation-ae", mw: 595, distanceMi: 8.7, bearingDeg: 117.0, detail: "Austin Energy's own gas plant — shows how close AE's own generation sits to downtown, for scale against the loads above", tag: "derived" },
  { name: "Blue Origin — Constellation Park", category: "load", mw: null, distanceMi: 22.4, bearingDeg: 31.6, detail: "Hutto, Williamson County · Oncor territory (not confirmed in sources)", tag: "derived" },
  { name: "Samsung Taylor semiconductor fab(s)", category: "load", mw: null, distanceMi: 28.9, bearingDeg: 43.5, detail: "Taylor, Williamson County · Oncor territory (not AE)", tag: "derived" },
  { name: "CloudBurst San Marcos data center", category: "load", mw: null, distanceMi: 29.1, bearingDeg: 204.1, detail: "Hays County · designed to run on gas via pipeline, not ERCOT grid power", tag: "derived" },
  { name: "Aligned Project Caprock - LBB-01 (Lubbock-area, representative)", category: "load", mw: 108, distanceMi: 346.0, bearingDeg: 317.0, detail: "Hale County · one of 6 Caprock-campus buildings mapped in section 7 · stands in for the far, purely-statewide Cleanview loads", tag: "derived" },
  { name: "Project Matador (gas + nuclear)", category: "generation-far", mw: 16147.3, distanceMi: 411.7, bearingDeg: 328.3, detail: "Carson County, Texas Panhandle · 11,679 MW gas + 4,468 MW nuclear at the same site · this page's anchor example of \"cheap generation sits far away\"", tag: "derived" },
];

export const proximityRadarNote = {
  tag: "derived" as Tag,
  note:
    "The close-in cluster is the headline: Tesla, Dog's Head (unconfirmed), and AE's own Sand Hill plant all sit within 9 miles of downtown Austin. Samsung and Blue Origin — both confirmed NOT on AE's system — are still only 22-29 miles out. CloudBurst is about the same distance, just south instead of northeast. The generation that's actually cheap (Project Matador's 16,147 MW combined) sits 400+ miles away in the opposite direction. Radius on the diagram uses a square-root scale (labeled on the rings) so that 400+-mile outlier doesn't crush the close-in cluster to a single dot — the rings themselves are the key to reading real mileage back out. None of this proves a shared transmission line between any load and AE's imports (see tollRoadDiagram's regional-not-local caveat) — it only shows straight-line distance, which is what the toll-road analogy's 'how far does the power have to travel' framing is actually about.",
};

// ---------------------------------------------------------------------------
// 12. NEW TRANSMISSION INVESTMENT — does it change this evaluation? (added
// 2026-10-24, researched after David asked directly whether the new 765kV
// line and Austin's internal transmission lines are part of this analysis.
// Honest answer going in: neither had been accounted for anywhere above.)
// ---------------------------------------------------------------------------

export interface TransmissionProject {
  name: string;
  scope: "Statewide" | "AE";
  status: string;
  purpose: string;
  relevanceToThisPage: string;
  tag: Tag;
  source: string;
}

export const transmissionInvestments: TransmissionProject[] = [
  {
    name: "Texas 765kV backbone (Strategic Transmission Expansion Plan / STEP)",
    scope: "Statewide",
    status: "PUC selected 765kV (over alternatives) in April 2025, following a 2023 legislative directive. First specific segment approved: a ~400-mile Glen Rose (near Fort Worth) → Reeves County (West Texas) line, Certificate of Convenience and Necessity granted Aug 28, 2026, letting Oncor begin land/easement work and construction.",
    purpose: "Part of the Permian Basin Reliability Plan (2023 legislation) — explicitly driven by ~6 GW of unmet West Texas oil-and-gas load growth and ERCOT reliability concerns (ERCOT warned of possible West Texas rolling blackouts as early as 2027 without it). Also expected to help move renewable generation across the state more broadly, which is a separate, secondary benefit cited in coverage.",
    relevanceToThisPage: "This is Channel 1 (the statewide hub price), not Channel 2 (AE's own local toll). The one specific segment approved so far runs Glen Rose to West Texas — nowhere near Austin or Central Texas. Coverage of the approval does mention a separate, southernmost STEP segment starting near the Hill Country outside San Antonio (opposed by the Hill Country Preservation Coalition), which is geographically closer to Central Texas — but that segment isn't approved yet and no route, timeline, or Austin-specific detail was found. Bottom line: a real statewide 765kV buildout is underway and could ease the broader ERCOT supply/demand balance this page's hub-price projection already models, but nothing found so far specifically targets relieving AE's own import constraint into Austin.",
    tag: "reported",
    source: "PUC April 2025 selection; hppr.org, Aug 28 2026 (\"regulators clear path for bigger transmission lines\"); Enverus Intelligence Research, \"The Future of ERCOT: 765 kV Transmission Expansion\"; Oncor 765kV One-Pager, June 2026",
  },
  {
    name: "AEN Dunlap to Decker 138kV Line Project (Phase I), 345kV upgrade (Phase II)",
    scope: "AE",
    status: "Phase I (new ~5.3-mile 138kV line, replacing an existing circuit) submitted for ERCOT Regional Planning Group review June 1, 2026; comment period closed June 22, 2026; ERCOT Independent Review due ~Oct 20, 2026; CCN application expected early 2027; in-service targeted Summer 2028. Cost: $61.6M (Phase I). Phase II would rebuild the corridor to 345kV, supporting up to 6,000 MVA of transfer.",
    purpose: "Stated driver is reliability: the existing Dunlap-Decker 138kV line overloads under multiple NERC/ERCOT contingency scenarios. ERCOT's and AE's own filings do NOT frame this as import-capacity relief for Austin — it's filed as a contingency-overload fix.",
    relevanceToThisPage: "This is AE's own grid (same universe as the Gantt chart's 'AE' scope items), and it's the closest thing found to a literal widening of one of the toll-road analogy's 'lanes' into Austin — Phase II's 6,000 MVA corridor would be a real increase in transfer capacity on one of AE's import paths. But no study or model was found connecting that MVA increase to a projected dollar change in AE's basis/congestion premium (the 'toll' tracked in tollRoadDiagram), so it's flagged here as a relevant, real, but NOT YET QUANTIFIED factor — not folded into the price projection or toll-road numbers.",
    tag: "reported",
    source: "ERCOT RPG filings, 26RPG022 AEN Dunlap to Decker 138 kV Line Project Overview and EIR Scope/Status Update, Jun-Aug 2026",
  },
  {
    name: "North Lamar Transmission Line Upgrade (69kV → 138kV)",
    scope: "AE",
    status: "Phase 1 (McNeil Substation to N. Lamar Blvd) complete. Phase 2 (N. Lamar Blvd to Justin Lane Substation): easements being acquired; construction targeted to start end of 2028.",
    purpose: "Austin Energy's own stated drivers are local: replacing 50+-year-old wooden H-frame structures with steel monopoles for reliability/safety, plus higher voltage to support local growth and reduce line losses. AE's own FAQ does not mention import capacity or statewide transmission constraints at all.",
    relevanceToThisPage: "A real AE capital project, but by AE's own framing it's a local reliability/growth upgrade, not a congestion-relief or import-capacity project — weaker relevance to the toll-road mechanism than Dunlap-to-Decker above. Included for completeness since it's real, AE-funded transmission spending that would show up in the base-rate capital program referenced elsewhere on this page (supplyDemandFraming).",
    tag: "reported",
    source: "austinenergy.com/about/better-austin/north-lamar-transmission-line-upgrade and its FAQ page",
  },
  {
    name: "$500M Five-Year Transmission Capital Improvement Plan (FY2026–FY2030)",
    scope: "AE",
    status: "Approved and in AE's current five-year CIP budget — roughly $100M/year, FY2026 through FY2030. Presented to the Electric Utility Commission in April 2026 (Item 11) by David Tomczyszyn, VP of Electric System Engineering and Technical Services.",
    purpose: "AE states 60% of the $500M will directly improve AE's own import capacity into Austin. The presentation groups the spending into four categories, not a project list: (1) reconductoring existing lines on congested corridors, (2) new transmission lines creating new import paths into Austin, (3) voltage conversions — 69kV→138kV and 138kV→345kV — to add capacity on existing corridors, and (4) new switchyards and autotransformers. AE does NOT itemize which specific lines or substations the money goes to, and says why on the same slide: NERC designates transmission infrastructure as \"Critical Protected Infrastructure,\" and AE cites the need to \"maintain a fair and open market.\" That's a stated policy, not a gap in this project's sourcing.",
    relevanceToThisPage: "This is the aggregate figure that AEN Dunlap-to-Decker and North Lamar (both already listed above) most likely report into — both fit the stated categories (a new line; a voltage conversion) and both fall inside the FY2026–FY2030 window. Two more real, named, located AE transmission-era projects turned up in this pass that also fit: a new line to Timber Creek Substation (southeast Austin) and the already-energized Kramer Substation (north Austin) — see transmissionLinesForMap/transmissionPointsForMap below for their map detail and namedAeTransmissionProjectsNote for why none of these four can be confirmed as literally part of this $500M total.",
    tag: "reported",
    source: "Austin Energy Transmission presentation, Electric Utility Commission, April 2026, Item 11 (services.austintexas.gov/edims/document.cfm?id=470908)",
  },
  {
    name: "New transmission line to Timber Creek Substation (southeast Austin)",
    scope: "AE",
    status: "Timber Creek Substation under construction; the connecting line's Travis County development permit and TNR permitting fees ($935,000, from AE's Capital Budget) were Item 8 on the May 11, 2026 Electric Utility Commission agenda.",
    purpose: "Route runs roughly parallel to Pearce Lane, from SH-130 to the Austin-Bergstrom International Airport (AUS) property, in the southeastern part of AE's service territory (Travis County jurisdiction and the City of Austin's ETJ). The document cites added capacity for AUS's own multi-year expansion (\"Journey With AUS\") and the Texas Division of Emergency Management as beneficiaries. No project name, voltage, or total project cost is given — the $935,000 figure is permitting fees only, not the full build cost.",
    relevanceToThisPage: "Fits the $500M CIP's \"new transmission lines\" / \"new switchyards\" categories, in the same FY2026 era — a plausible (not confirmed) piece of that aggregate.",
    tag: "reported",
    source: "Electric Utility Commission agenda, May 11, 2026, Item 8 (services.austintexas.gov/edims/document.cfm?id=472828)",
  },
  {
    name: "Kramer Substation (north Austin, near the Domain)",
    scope: "AE",
    status: "Energized; Austin Energy announced it Feb 17, 2026. Planning began 2019, construction began 2024 — so most of its build predates the FY2026 CIP window this page's $500M figure covers.",
    purpose: "Adds capacity in a \"rapidly growing\" part of north Austin near the Domain, and is described as supporting a future mixed-use development. Cost cited as about $25M. AE's own release ties it to the utility's Electric System Resiliency Plan, NOT to the transmission CIP or the $500M figure, and does not state whether Kramer is a transmission-level or distribution-level substation.",
    relevanceToThisPage: "The weakest of the four newly-added projects — included for completeness since it's real, located, AE-funded grid spending from roughly the same period, but flagged as likely NOT part of the $500M transmission figure (wrong program, and most of its build predates the FY2026–FY2030 window).",
    tag: "reported",
    source: "City of Austin news release, Feb 17 2026, \"Austin Energy energizes new Kramer substation\" (austintexas.gov/news/austin-energy-energizes-new-kramer-substation-adding-capacity-growing-north-austin)",
  },
];

export const transmissionInvestmentFinding = {
  tag: "blocked" as Tag,
  finding:
    "Before this pass, NEITHER the statewide 765kV backbone NOR any of Austin Energy's own internal transmission upgrades were accounted for anywhere on this page — the toll-road diagram and the price projection both implicitly treat Austin's import constraint and the statewide grid as static. Both are now listed above with sources. Neither changes any number on this page: no published study or model was found quantifying how much either project would move AE's basis/congestion premium (the 'toll') or the statewide hub price, and the one specific 765kV segment approved so far doesn't run anywhere near Austin. If AE, ERCOT, or the PUC publishes a transmission-planning study that does quantify this, that would be the next thing to fold in — flagged as an open research item, not resolved here.",
};

export const namedAeTransmissionProjectsNote = {
  tag: "blocked" as Tag,
  note:
    "No AE document found ties any of the four named, located projects above (Dunlap-to-Decker, North Lamar, the Timber Creek Substation line, Kramer Substation) to the $500M CIP figure by name — that linkage is this project's own inference, based on timing (same FY2026-era window) and category fit (each matches one of the $500M slide's four stated project types), not an AE confirmation. AE's stated reason for not publishing an itemized list (NERC Critical Protected Infrastructure status, market-fairness) applies to the whole $500M program, not just these four — there is very likely more spending in the $500M that this project has not found and cannot name.",
};

// ---------------------------------------------------------------------------
// 13.5 DOES THIS NEW TRANSMISSION SPENDING CHANGE RATES OR VALUE OF SOLAR?
// (added 2026-10-25, after David asked directly how the $500M CIP and the
// newly-found named projects affect customer rates and VOS avoided costs.)
// ---------------------------------------------------------------------------

export const vosTransmissionMechanismFinding = {
  tag: "blocked" as Tag,
  mechanism:
    "AE's own Value of Solar FAQ gives the actual formula for the VOS rate's \"Transmission\" component (see vosComponents above): it's calculated from the SUM OF WHOLESALE TRANSMISSION SERVICE CHARGES AE already pays (an existing, statewide ERCOT/transmission-service-provider cost-allocation tariff), scaled by how much solar's output coincides with system peak demand, divided across total solar generation. Published values: $0.0301/kWh for 2024, $0.0187/kWh for 2025 (systems under 1 MW-ac only — the component is excluded entirely for systems 1 MW-ac or larger).",
  doesNewCapexFlowIn:
    "No direct channel was found. The VOS transmission component is backward-looking and tariff-based — it values solar against transmission charges AE has ALREADY incurred, not against AE's own planned or actual capital spending on new lines. None of the $500M CIP, Dunlap-to-Decker, North Lamar, the Timber Creek line, or Kramer Substation would change this component directly or immediately. The only path by which they COULD eventually matter: if this new local spending changes AE's own wholesale transmission service charges (set through ERCOT's statewide transmission cost-allocation mechanism, not a simple pass-through of AE's local capex), that change would show up in a future year's recalculation — but no study or statement was found connecting the two, and the VOS rate is recalculated only every three years off realized market prices, not off AE's capital plan.",
  source: "austinenergy.com/green-power/solar-solutions/value-of-solar-rate/FAQs (Transmission Savings formula and 2024/2025 values)",
};

export const transmissionRateImpactFinding = {
  tag: "blocked" as Tag,
  finding:
    "Austin Energy's FY2026 budget included a 5% base rate increase (residential Customer Charge $15→$16.50), which AE and local coverage attributed to \"increased power supply costs and operational expenses\" — NOT explicitly to transmission capital spending. The ~$1.74B five-year capital improvement program (of which the $500M transmission figure is roughly 29%) is part of the general backdrop cited for rising costs, but no document found presents transmission spending specifically as a driver of that 5% increase. Separately, the Electric Utility Commission's own recommendation (20260511-018, May 11, 2026) calls for Austin Energy to run a full cost-of-service study and a formal rate case starting no later than spring 2027, using FY2026 as the test year — which means the $500M transmission program has NOT yet gone through the kind of rate case that would show its own, specific dollar impact on customer bills. That impact is a genuinely open, future item, not something this project's current sources can quantify.",
  source: "cp.soar.com, \"Austin Energy Proposes 5% Rate Increase Amid Rising Costs for 2026 Budget\"; Electric Utility Commission Recommendation 20260511-018 (services.austintexas.gov/edims/document.cfm?id=472822)",
};

// ---------------------------------------------------------------------------
// 13. TRANSMISSION LINES + PRICING NODES ON THE LITERAL MAP (added
// 2026-10-24, after David asked to "draw transmission lines on the map and
// show pricing at different nodes" — a third view, this time drawn onto the
// literal Texas map (section 7's LoadZoneMap), alongside the toll-road
// schematic and the proximity radar above.)
// ---------------------------------------------------------------------------
// WHAT THE LINES ARE: a true pole-by-pole GIS route for any of these four
// projects was not obtainable from this project's available sources at a
// resolution worth shipping (an HIFLD/EIA ArcGIS transmission feature
// service exists but returns mostly 69-138kV local segments near Austin and
// could not be queried statewide for 345kV+ backbone lines within this
// project's tooling limits). What's drawn instead is a straight segment
// between each project's REAL, named, sourced endpoints (a substation, a
// plant, or a county) — an approximate corridor standing in for the as-built
// path, the same honesty tradeoff REFERENCE_CITIES and the proximity radar
// already make elsewhere on this page. Every endpoint coordinate is sourced
// below; some are exact sites (a named power plant) and some are
// city/county-level approximations (no published substation coordinates
// were found) — each point says which.

export interface TransmissionLinePoint {
  lat: number;
  lon: number;
  label: string;
  precision: "exact-site" | "county-centroid" | "city-approx";
}

export interface TransmissionLine {
  name: string;
  voltageKv: number;
  scope: "AE" | "Statewide";
  status: string;
  points: TransmissionLinePoint[];
  detail: string;
  tag: Tag;
  source: string;
}

export const transmissionLinesForMap: TransmissionLine[] = [
  {
    name: "AEN Dunlap to Decker 138kV Line (Phase I)",
    voltageKv: 138,
    scope: "AE",
    status: "ERCOT Regional Planning Group review underway; CCN application expected early 2027; in-service targeted Summer 2028",
    points: [
      { lat: 30.2489, lon: -97.5597, label: "Dunlap, Travis County (community the line is named for — approx.)", precision: "city-approx" },
      { lat: 30.3033, lon: -97.6128, label: "Decker Creek Power Station (AE's own plant)", precision: "exact-site" },
    ],
    detail: "Straight-line distance between these two points is ~4.9 miles, consistent with the project's own stated ~5.3-mile line length. See transmissionInvestments above for the full project detail.",
    tag: "derived",
    source: "ERCOT RPG filing 26RPG022; Dunlap community coordinates: Wikipedia; Decker Creek coordinates: Global Energy Monitor (gem.wiki)",
  },
  {
    name: "North Lamar Transmission Line Upgrade (69kV → 138kV)",
    voltageKv: 138,
    scope: "AE",
    status: "Phase 1 (McNeil Substation → N. Lamar Blvd) complete. Phase 2 (N. Lamar Blvd → Justin Lane Substation): easements being acquired, construction targeted to start end of 2028.",
    points: [
      { lat: 30.4495, lon: -97.7563, label: "McNeil Substation, north Austin (approx. — no published substation coordinates found; located near McNeil Dr.)", precision: "city-approx" },
      { lat: 30.3267, lon: -97.7247, label: "Justin Lane Substation, Austin (approx. — no published substation coordinates found; located near N. Lamar Blvd. & Justin Ln.)", precision: "city-approx" },
    ],
    detail: "Runs along the east side of N. Lamar Blvd between US-183 and just south of Ferguson Dr., then crosses to Wagon Trail Rd. Both endpoints are approximate landmark-based placements, not surveyed substation coordinates.",
    tag: "derived",
    source: "austinenergy.com/about/better-austin/north-lamar-transmission-line-upgrade and FAQs",
  },
  {
    name: "Oncor 765kV: Glen Rose → Reeves County (approved)",
    voltageKv: 765,
    scope: "Statewide",
    status: "CCN approved by the Texas PUC Aug 28, 2026 — first STEP segment to clear regulatory review; Oncor now acquiring easements and surveying.",
    points: [
      { lat: 32.2352, lon: -97.7544, label: "Glen Rose, TX (~50 mi NW of Fort Worth)", precision: "city-approx" },
      { lat: 31.4229, lon: -103.4932, label: "Reeves County, TX (Pecos area, ~50 mi S of Carlsbad, NM)", precision: "county-centroid" },
    ],
    detail: "~400 route miles depending on final local routing — the straight line drawn here (~341 mi) is shorter than the actual path, which follows rights-of-way, not a great-circle line. Part of the statewide STEP program (see transmissionInvestments above); runs entirely through North/West Texas, nowhere near Austin or Central Texas.",
    tag: "derived",
    source: "PUC CCN approval, Aug 28 2026 (hppr.org / kut.org coverage, Docket not specified in coverage)",
  },
  {
    name: "LCRA TSC / Oncor 765kV: Sand Lake ↔ Big Hill (proposed, not yet approved)",
    voltageKv: 765,
    scope: "Statewide",
    status: "Application filed with the Texas PUC Jan 15, 2026 (Docket 59182); under regulatory review; PUC decision and final route expected fall 2026; targeted in-service end of 2030.",
    points: [
      { lat: 31.5952, lon: -102.8902, label: "Sand Lake Switch, Ward County (approx. — existing Oncor site)", precision: "county-centroid" },
      { lat: 30.8651, lon: -100.6098, label: "Big Hill Substation, Schleicher County (approx. — planned LCRA TSC site, adjacent to an existing 345kV Big Hill substation)", precision: "county-centroid" },
    ],
    detail: "~177 route miles across the Permian Basin region (Crane, Crockett, Ector, Irion, Pecos, Reagan, Reeves, Schleicher, Tom Green, Upton, Ward and Winkler counties) — a second real STEP-program 765kV filing, not previously listed in transmissionInvestments above. Not yet approved; nowhere near Austin.",
    tag: "derived",
    source: "lcra.org/energy/electric-transmission/transmission-line-routing/big-hill-to-sand-lake-765-kv-transmission-project/; PUC Docket 59182",
  },
  {
    name: "New line to Timber Creek Substation (southeast Austin, under construction)",
    voltageKv: 138,
    scope: "AE",
    status: "Timber Creek Substation under construction; the connecting line's Travis County permit and TNR fees were Item 8 on the May 11, 2026 EUC agenda. No in-service date given.",
    points: [
      { lat: 30.15, lon: -97.62, label: "Pearce Lane / SH-130 area, Del Valle (approx. — no exact substation coordinates published)", precision: "city-approx" },
      { lat: 30.178, lon: -97.676, label: "Austin-Bergstrom International Airport property (south end, away from the terminal — approx.)", precision: "city-approx" },
    ],
    detail: "Route runs roughly parallel to Pearce Lane, from SH-130 to the AUS airport property — exact voltage not stated in the source; 138kV assumed here as AE's standard local-import voltage (same as Dunlap-to-Decker and the post-upgrade North Lamar line), NOT independently confirmed. See transmissionInvestments above for the full project detail and the $935,000 permitting-fee figure.",
    tag: "derived",
    source: "Electric Utility Commission agenda, May 11, 2026, Item 8 (services.austintexas.gov/edims/document.cfm?id=472828)",
  },
];

export interface TransmissionPoint {
  name: string;
  scope: "AE" | "Statewide";
  status: string;
  lat: number;
  lon: number;
  precision: "exact-site" | "county-centroid" | "city-approx";
  detail: string;
  tag: Tag;
  source: string;
}

// Standalone AE facility projects that are a single point, not a line between
// two named endpoints (unlike transmissionLinesForMap above). Currently just
// Kramer Substation — deliberately NOT drawn as a line, since no source
// describes it as connecting two named places, and it's flagged (see
// namedAeTransmissionProjectsNote and the "Kramer Substation" entry in
// transmissionInvestments) as the weakest/least-confirmed of the four
// newly-added projects.
export const transmissionPointsForMap: TransmissionPoint[] = [
  {
    name: "Kramer Substation (north Austin, near the Domain)",
    scope: "AE",
    status: "Energized; announced Feb 17, 2026. Planning began 2019, construction began 2024.",
    lat: 30.398,
    lon: -97.706,
    precision: "city-approx",
    detail: "Approximated from Kramer Lane / the Kramer MetroRail Station area, just east of Metric Blvd, near the Domain — no exact substation coordinates published. ~$25M; AE's own release ties it to the Electric System Resiliency Plan, not explicitly to the $500M transmission CIP, and doesn't state whether it's transmission- or distribution-level.",
    tag: "derived",
    source: "City of Austin news release, Feb 17 2026 (austintexas.gov/news/austin-energy-energizes-new-kramer-substation-adding-capacity-growing-north-austin)",
  },
];

export const transmissionLinesNote = {
  tag: "blocked" as Tag,
  note:
    "These five lines (plus the Kramer Substation point below) are drawn as straight segments/points between real, sourced, named endpoints — not as surveyed GIS routes (see the note above this section). That limitation doesn't change the geographic point they're drawn to make: Austin Energy's own three local projects (Dunlap-to-Decker, North Lamar, the Timber Creek line) are short, entirely inside the Austin metro area, while both the approved and the proposed 765kV STEP segments run hundreds of miles away, entirely through North and West Texas — neither one reaches, or is proposed to reach, Central Texas.",
};

// Pricing nodes: real, recent ERCOT zonal settlement averages, placed at
// each zone's conventional representative city, alongside this project's
// own AE/LZ_AEN modeled price (section 1) at Austin itself. These two kinds
// of figures are NOT directly comparable — see kind and pricingNodesFinding.

export type PricingNodeKind = "ercot-zone-actual" | "ae-own-model";

export interface PricingNode {
  name: string;
  kind: PricingNodeKind;
  lat: number;
  lon: number;
  precision: "zone-average";
  daPrice: number | null; // $/MWh
  rtPrice: number | null; // $/MWh
  vintage: string;
  detail: string;
  tag: Tag;
  source: string;
}

export const pricingNodes: PricingNode[] = [
  {
    name: "ERCOT Houston Zone",
    kind: "ercot-zone-actual",
    lat: 29.93,
    lon: -95.2,
    precision: "zone-average",
    daPrice: 31.08,
    rtPrice: 29.84,
    vintage: "May 2026 monthly average",
    detail: "Zone-wide day-ahead/real-time average, not a single settlement point — plotted near Houston (the zone's conventional representative city, offset slightly northeast of downtown so the marker and the city label don't sit on top of each other), not a price specific to that city.",
    tag: "reported",
    source: "Potomac Economics, \"2026-05 ERCOT Nodal Monthly Report\"",
  },
  {
    name: "ERCOT North Zone",
    kind: "ercot-zone-actual",
    lat: 32.95,
    lon: -96.63,
    precision: "zone-average",
    daPrice: 28.22,
    rtPrice: 27.49,
    vintage: "May 2026 monthly average",
    detail: "Zone-wide average; plotted near Dallas–Fort Worth (the zone's conventional representative city, offset slightly northeast of downtown so the marker and the city label don't sit on top of each other).",
    tag: "reported",
    source: "Potomac Economics, \"2026-05 ERCOT Nodal Monthly Report\"",
  },
  {
    name: "ERCOT South Zone — includes AEN + CPS + LCRA combined",
    kind: "ercot-zone-actual",
    lat: 29.6,
    lon: -98.3,
    precision: "zone-average",
    daPrice: 30.43,
    rtPrice: 29.92,
    vintage: "May 2026 monthly average",
    detail: "NOT an Austin-specific price: Potomac Economics' South zone bundles Austin Energy (AEN) together with CPS Energy (San Antonio) and LCRA. Plotted near San Antonio (the zone's conventional representative city, offset slightly northeast of downtown so the marker and the city label don't sit on top of each other) — AE's own LZ_AEN is not broken out anywhere in this report.",
    tag: "reported",
    source: "Potomac Economics, \"2026-05 ERCOT Nodal Monthly Report\"",
  },
  {
    name: "ERCOT West Zone",
    kind: "ercot-zone-actual",
    lat: 31.9973,
    lon: -102.0779,
    precision: "zone-average",
    daPrice: 27.36,
    rtPrice: 27.08,
    vintage: "May 2026 monthly average",
    detail: "Lowest-priced of the four zones in May 2026 — consistent with where most proposed new gas/nuclear capacity (including Project Matador) sits. Midland/Odessa shown as the zone's conventional representative city.",
    tag: "reported",
    source: "Potomac Economics, \"2026-05 ERCOT Nodal Monthly Report\"",
  },
  {
    name: "Austin Energy / LZ_AEN — this project's own model",
    kind: "ae-own-model",
    lat: 30.33,
    lon: -97.84,
    precision: "zone-average",
    daPrice: 37.03,
    rtPrice: null,
    vintage: "2026 Base scenario (this project's own 20-year projection, section 1)",
    detail: "NOT an ERCOT-published settlement price. This is projection20yr's Base-scenario total for 2026: hub $31.04 + AE's own basis/congestion premium $5.99 = $37.03/MWh. Plotted just northwest of downtown Austin so the marker doesn't sit directly on top of other Austin-area markers — LZ_AEN is a zone, not a point. Shown on the same map as the four real zonal averages for geographic context only — see pricingNodesFinding before treating this as a like-for-like comparison.",
    tag: "derived",
    source: "This project's own section 1 price model (projection20yr)",
  },
];

export const pricingNodesFinding = {
  tag: "blocked" as Tag,
  finding:
    "No source found gives a real, published, AE-specific (LZ_AEN) settlement price at the resolution this page would need to validate its own model against actuals. Both ERCOT's \"Summer 2026 Operational and Market Review\" and Potomac Economics' Nodal Monthly Report price by ZONE (Houston/North/South/West) rather than by hub or individual settlement point, and Potomac Economics' South zone explicitly combines AEN with CPS Energy and LCRA — Austin Energy's own price is never isolated. The four zonal actuals and this project's own AE/LZ_AEN model are shown together on the map below for geographic and rough-magnitude context only ($27–$31/MWh real zonal DA averages vs. this project's own $37.03/MWh modeled 2026 Base figure, which already includes AE's local congestion premium on top of a hub price) — not as a validated check of the model against reality.",
};
