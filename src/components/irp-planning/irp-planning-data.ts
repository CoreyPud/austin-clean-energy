// Austin Clean Energy — IRP Planning Interface — data & field metadata.
//
// This file holds every input field the model uses, each tagged with where its
// starting value came from. Tags follow the same four-level system proposed for
// this project's "Assumptions Ledger":
//
//   reported     — a number Austin Energy, EIA, ERCOT or a council document states directly
//   derived      — arithmetic on reported numbers (e.g. fuel $ ÷ MWh = $/MWh)
//   benchmarked  — an industry-standard rate (NREL ATB) stood in for a number AE doesn't publish
//   invented     — a scenario assumption this toolkit itself made up for planning discussion
//   blocked      — no real number exists anywhere in this project yet; value is 0 and the
//                  calculations that depend on it will not run until a real number replaces it
//
// Sources, in order of how much of this file they fill in:
//   Power Money page            https://austincleanenergy.net/austin-energy-generation-costs (read 2026-10-18)
//   AE Power Plants             https://austinenergy.com/about/company-profile/electric-system/power-plants (read 2026-10-18, AE's own page last reviewed 2024-11-18)
//   AE Renewable Power Gen.     https://austinenergy.com/about/company-profile/environment/renewable-power-generation (read 2026-10-18, AE's own page last reviewed 2026-07-16)
//   Load Zone Pricing Pressure  https://claude.ai/artifact/7iMsxMMy4MeSLzzLoPdjAu
//   Load Growth & Pricing       https://claude.ai/artifact/BBNivU6NExaQFuBfhXqEVg
//   Power Contracts             https://claude.ai/artifact/XCtvzw7PPZWmgoGpW3sSNk
//   Austin Rate Explorer        https://claude.ai/artifact/8Zm8ow61HXRUT2C8LLVqLV
//
// 2026-10-18 update (v2): the two AE pages above give real nameplate MW,
// per-facility commercial-operation years and contract-expiration dates for
// every wind farm, solar farm and the biomass plant — none of that existed
// anywhere in this project before (Power Money has per-contract $/MWh for 6
// of the 7 solar farms but no MW for any of them; nothing had wind or biomass
// MW at all). The same facility list, plus the named owned gas/coal/nuclear
// plants, is now also saved as a standalone reference file in the Secret
// Vote folder: austin-energy-nameplate-capacity-2026-10.csv, so it isn't
// locked up inside this one tool's data file.
//
// 2026-10-18 update (v3): added Base Power, Inc. and OCI Energy, LLC — two
// real 2026 battery contracts found in Austin City Council records, neither
// on either public site.
//
// 2026-10-18 update (v4): added two more battery contracts with Jupiter
// Power subsidiaries — Balcones Ridge Resiliency, LLC (100 MW, approved
// 2025-07-24, the first one predates 2026) and Balcones Ridge Resiliency II,
// LLC (200 MW, approved 2026-07-23) — the second found only via an Electric
// Utility Commission agenda, not any Council minutes file, confirming that
// EUC documents can carry real contracts before they reach Council minutes
// or either public site. Also added Austin Energy's own stated target of
// 125 MW of battery storage by the end of 2027 (batteryStorageTarget2027),
// cited in the news release announcing the first Jupiter Power deal — the
// four contracts found so far already total 440 MW, well past that target.

export type Tag = "reported" | "derived" | "benchmarked" | "invented" | "blocked";

export interface ScalarField {
  id: string;
  label: string;
  unit: string;
  value: number;
  tag: Tag;
  source: string;
  note?: string;
}

export interface ResourceRow {
  id: string;
  fuel: string;
  kind: "owned" | "ppa" | "local";
  mw: number;
  mwTag: Tag;
  mwSource: string;
  generationMWh: number;
  generationTag: Tag;
  perMWh: number; // fuel price (owned) or contract price (ppa) or AE-paid rate (local)
  perMWhTag: Tag;
  perMWhSource: string;
  varOM: number; // $/MWh, owned only
  fixedOM: number; // $/kW-yr, owned only
  capital: number; // $/kW-yr, owned only
  omTag: Tag;
  omSource: string;
  retirement: string | null;
  retirementTag: Tag | null;
  retirementSource?: string;
  note?: string;
}

export interface NewResourceOption {
  id: string;
  label: string;
  capexPerKW: number;
  fixedOMPerKWyr: number;
  variableCostPerMWh: number;
  capacityFactorPct: number;
  tag: Tag;
}

export interface Facility {
  name: string;
  fuel: string;
  mw: number;
  onlineYear: number | string;
  expiration: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Named owned/co-owned plants and per-contract renewable facilities — a
// citation-level reference table, not just an aggregate. Source: Austin
// Energy's own Power Plants and Renewable Power Generation pages (read
// 2026-10-18). Also saved as austin-energy-nameplate-capacity-2026-10.csv
// in the Secret Vote folder.
// ---------------------------------------------------------------------------
export const namedOwnedPlants: Facility[] = [
  { name: "Decker Creek Power Station", fuel: "Natural gas", mw: 200, onlineYear: "1967–78", expiration: "owned", note: "NE Austin; AE-operated" },
  { name: "Mueller Energy Center", fuel: "Natural gas (CHP)", mw: 4.6, onlineYear: 2006, expiration: "owned", note: "Combined Heat & Power facility" },
  { name: "Sand Hill Energy Center", fuel: "Natural gas", mw: 595, onlineYear: "2001–10", expiration: "owned", note: "Combined cycle + gas turbines; Del Valle, TX" },
  { name: "Fayette Power Project (AE share)", fuel: "Coal", mw: 600, onlineYear: "1979–80", expiration: "owned", note: "AE owns 50% of 2 of 3 units; co-owned with LCRA, which manages the plant. Power Money's EIA-860-derived figure is 608 MW — a small, unreconciled gap." },
  { name: "South Texas Project (AE share)", fuel: "Nuclear", mw: 430, onlineYear: "1988–89", expiration: "owned", note: "AE owns 16% of 2 units (2,700 MW combined); co-owned with CPS Energy & Constellation; STPNOC manages. Matches Power Money exactly." },
  { name: "New 2026 gas peaker", fuel: "Natural gas", mw: 400, onlineYear: 2026, expiration: "~2061 (estimated)", note: "From Power Contracts artifact — not yet listed on AE's consumer-facing Power Plants page as of its 2024-11-18 review date. Likely why that page's named-plant gas total (799.6 MW) sits below Power Money's EIA-860-derived 1,310 MW owned-gas figure." },
];

export const windFacilities: Facility[] = [
  { name: "Whirlwind Energy Center", fuel: "Wind", mw: 59.8, onlineYear: 2007, expiration: "2027" },
  { name: "Hackberry Wind Project", fuel: "Wind", mw: 165.6, onlineYear: 2008, expiration: "2032" },
  { name: "Los Vientos II", fuel: "Wind", mw: 201.6, onlineYear: 2012, expiration: "2037" },
  { name: "Whitetail", fuel: "Wind", mw: 92.3, onlineYear: 2012, expiration: "2037" },
  { name: "Los Vientos III", fuel: "Wind", mw: 200, onlineYear: 2015, expiration: "2040" },
  { name: "Jumbo Road", fuel: "Wind", mw: 299.7, onlineYear: 2015, expiration: "2033" },
  { name: "Los Vientos IV", fuel: "Wind", mw: 200, onlineYear: 2016, expiration: "2041" },
  { name: "Karankawa", fuel: "Wind", mw: 206.64, onlineYear: 2019, expiration: "2034" },
  { name: "Raymond", fuel: "Wind", mw: 200, onlineYear: 2020, expiration: "2032" },
  { name: "Gulf Wind", fuel: "Wind", mw: 170, onlineYear: 2021, expiration: "2041" },
];

export const solarFacilities: Facility[] = [
  { name: "Webberville Solar Project", fuel: "Solar", mw: 30, onlineYear: 2011, expiration: "2036", note: "Matches Power Money's Webberville pricing row ($174/MWh)" },
  { name: "Roserock", fuel: "Solar", mw: 157.5, onlineYear: 2016, expiration: "2036", note: "Matches Power Money's Roserock pricing row ($48/MWh)" },
  { name: "East Pecos (Bootleg)", fuel: "Solar", mw: 118.5, onlineYear: 2017, expiration: "2031", note: "Matches Power Money's East Pecos pricing row ($40/MWh) and the Secret Vote gillett-resource-meta.json BOOTLEG_UNIT1 nameplate, exactly" },
  { name: "Upton County (SPTX12B1)", fuel: "Solar", mw: 157.5, onlineYear: 2017, expiration: "2042", note: "Matches Power Money's Upton County pricing row ($40/MWh)" },
  { name: "Waymark", fuel: "Solar", mw: 178.5, onlineYear: 2018, expiration: "2043", note: "Not named in Power Money's per-contract pricing table — but Power Money's \"Midway (2019)\" row prices a contract described only by a council RCA as \"150-180 MW,\" which brackets this facility's 178.5 MW closely. Possibly the same project under a different name (a post-financing rebrand is common for solar developers); not confirmed, so carried here as a separate, unpriced facility rather than merged." },
  { name: "East Blacklands", fuel: "Solar", mw: 144, onlineYear: 2021, expiration: "2036", note: "Matches Power Money's East Blackland pricing row ($38/MWh) exactly" },
  { name: "SE Aragon", fuel: "Solar", mw: 180, onlineYear: 2021, expiration: "2036", note: "= Power Money's \"Aragorn\" pricing row ($30/MWh); spelling differs between the two AE-linked sources" },
];

export const biomassFacility: Facility = {
  name: "Nacogdoches Power (Sacul, TX)",
  fuel: "Biomass",
  mw: 105,
  onlineYear: 2012,
  expiration: "owned since 2019",
  note: "AE acquired the plant outright in 2019. Power Money treats biomass as a \"contracted-rate estimate\" PPA across its whole 2001–present series — that framing predates the acquisition.",
};

// ---------------------------------------------------------------------------
// Battery/wind/gas contracts — Council-approved but NOT on austinenergy.com's
// Power Plants or Renewable Power Generation pages yet (those pages' own
// "last reviewed" dates, 2024-11-18 and 2026-07-16, predate or just barely
// overlap these). Found by searching Austin City Council RCAs/minutes, EUC
// agendas and backup documents, and news coverage, since neither AE's site
// nor austincleanenergy.net had them. Kept as a SEPARATE table from the
// 2025-actuals resource rows above rather than merged in, because mixing a
// not-yet-operating contract into those rows would break the cost-layer
// formula's calibration check against Power Money's published 2025 totals.
//
// Despite the array's name (kept to minimize churn after it was first built
// around the 2026 deals), one entry — Jupiter Power I / Balcones Ridge
// Resiliency, LLC — was actually approved in 2025. It's included here for
// the same reason as the others: it's real and Council-approved, but it
// isn't on either public page, and the user's prompt to check Electric
// Utility Commission minutes specifically (not just Council minutes) is what
// surfaced the second Jupiter Power deal below.
// ---------------------------------------------------------------------------
export interface ContractedResource2026 {
  name: string;
  fuel: string;
  mw: number;
  annualCost: number;
  termYears: number;
  approvalDate: string;
  expectedOnline: string;
  tag: Tag;
  source: string;
  note?: string;
}

export const contractedResources2026: ContractedResource2026[] = [
  {
    name: "Base Power, Inc. — residential battery tolling agreement",
    fuel: "Battery (distributed residential)",
    mw: 40,
    annualCost: 4080000,
    termYears: 10,
    approvalDate: "2026-04-23",
    expectedOnline: "not stated in the approved documents",
    tag: "reported",
    source: "Electric Utility Commission backup PDF already in the Secret Vote folder (Austin Energy Solar Austin/Austin Energy Contracts/Base Power agreement 2026_04_13...PDF), recommended 9-0 on 2026-04-13; Council RCA #26-1526, agenda item 8, 2026-04-23",
    note: "Up to 40 MW of distributed residential battery capacity via a tolling agreement, not a single plant. This document was already sitting in the Secret Vote folder, unused in any dataset or tool until now.",
  },
  {
    name: "OCI Energy, LLC — utility-scale battery storage",
    fuel: "Battery (utility-scale, 2-hour duration)",
    mw: 100,
    annualCost: 8250000,
    termYears: 20,
    approvalDate: "2026-05-21",
    expectedOnline: "2030",
    tag: "reported",
    source: "Austin City Council RCA #26-1743, agenda item 4; recommended 11-0 by the Electric Utility Commission on 2026-05-11; corroborated by Austin Energy's own 2026-05-21 news release",
    note: "Approved the same day as the broader 299 MW wind / 400 MW gas peaker authorization below — may be what that announcement's \"100 MW local battery storage\" refers to, or a separate, additional 100 MW; sources don't say which, so this is NOT added to the total below to avoid risking double-counting.",
  },
  {
    name: "Balcones Ridge Resiliency, LLC (Jupiter Power I) — battery tolling agreement",
    fuel: "Battery (utility-scale)",
    mw: 100,
    annualCost: 14400000,
    termYears: 20,
    approvalDate: "2025-07-24",
    expectedOnline: "not stated in the approved documents; publicly announced 2025-10-23",
    tag: "reported",
    source: "Austin City Council Item 16, approved 11-0, 2025-07-24 (Austin City Council Mtg Minutes since 2020/minutes_text/2025/2025-07-24_reg_minutes.txt in the Secret Vote folder); austintexas.gov news release \"Austin Energy signs battery storage deal advancing climate and reliability goals,\" 2025-10-23",
    note: "Up to 100 MW from a utility-scale battery facility via a tolling agreement with Balcones Ridge Resiliency, LLC, a Jupiter Power subsidiary; total contract value up to $288,000,000 over the term ($14,400,000/yr funded from the FY2026 Operating budget). From 2025, not 2026 — kept in this table anyway since it's real, Council-approved, and absent from both public pages. The 2025-10-23 announcement states this supports Austin Energy's own target of 125 MW of battery storage by the end of 2027 — see batteryStorageTarget2027 below. A September 2026 Council agenda item granting an LCRA transmission easement for \"a battery tolling project of Austin Energy and Balcones Ridge Resiliency, LLC\" confirms this project is still moving forward (interconnection work) as of fall 2026.",
  },
  {
    name: "Balcones Ridge Resiliency II, LLC (Jupiter Power II) — battery storage agreement",
    fuel: "Battery (utility-scale)",
    mw: 200,
    annualCost: 16000000,
    termYears: 20,
    approvalDate: "2026-07-23",
    expectedOnline: "not stated in the approved documents",
    tag: "reported",
    source: "Electric Utility Commission recommendation, agenda item 7, 2026-07-20 (Austin Energy Solar Austin/Austin Energy City Council pdf agendas/2026_07_20, Regular Meeting Agenda, Electric Utility Commission.PDF in the Secret Vote folder); approved on Consent by Council, Item 6, 2026-07-23 (services.austintexas.gov/council_meetings/action_notes.cfm?mid=1490)",
    note: "Up to 200 MW of electrical power capacity from a utility-scale battery facility with Balcones Ridge Resiliency II, LLC — a second, distinct Jupiter Power subsidiary/project from the one above; total contract value up to $320,000,000 over the term. Found only via the EUC agenda, not any Council minutes file in the Secret Vote folder — this is the deal the user's prompt to check EUC minutes specifically was looking for.",
  },
];

export const batteryStorageTarget2027 = {
  mw: 125,
  byYear: 2027,
  tag: "reported" as Tag,
  source: "austintexas.gov news release, \"Austin Energy signs battery storage deal advancing climate and reliability goals,\" 2025-10-23",
  note: "Austin Energy's own stated planning target, cited in the same release announcing the Jupiter Power I deal above. The four battery contracts in the table above, summed, already come to 40 + 100 + 100 + 200 = 440 MW — more than three times this target. That gap isn't resolved here: it may mean the target predates these deals (three of the four were approved after Oct 2025), covers a narrower category of battery than all four combined, or AE's actual contracting has simply moved past its own last-published figure. Flagged rather than picked for the reader.",
};

export const windAuthorization2026 = {
  mw: 299,
  approvalDate: "2026-05-21",
  tag: "reported" as Tag,
  source: "Austin Energy news release, \"Austin Energy Strengthens Community's Reliable, Clean Energy Future,\" 2026-05-21",
  note:
    "This is Council authorizing Austin Energy to begin contracting for 299 MW of wind — not a signed PPA with a named developer, project, or online date. No such project has been announced publicly as of this tool's last check (Oct 2026). Treated here as a pipeline item, not added to the Wind row's 1,795.64 MW nameplate total, which is signed contracts only.",
};

export const gasPeakerAuthorization2026Note =
  "The same 2026-05-21 Council action also authorized 400 MW of high-efficiency gas peaker capacity — this matches the \"new 2026 gas peaker, 400 MW\" entry already in the owned-plants table above (from the Power Contracts artifact), rather than being a second, additional peaker.";

// ---------------------------------------------------------------------------
// SECTION 1 — Load forecast
// ---------------------------------------------------------------------------
export const loadForecastFields: ScalarField[] = [
  {
    id: "peakDemandMW",
    label: "Current system peak demand",
    unit: "MW",
    value: 3067,
    tag: "reported",
    source: "AE record peak, August 2023",
  },
  {
    id: "annualEnergyMWh",
    label: "Annual energy supplied, 2025",
    unit: "MWh",
    value: 14151693,
    tag: "reported",
    source: "Power Money — EIA Form 923 generation + contracted energy, all sources",
  },
  {
    id: "residentialCustomers",
    label: "Residential customers",
    unit: "accounts",
    value: 486000,
    tag: "reported",
    source: "Power Money — AE annual report, 2025",
  },
  {
    id: "residentialSharePct",
    label: "Residential share of retail sales",
    unit: "%",
    value: 38,
    tag: "reported",
    source: "Power Money methodology note",
  },
  {
    id: "committedMW",
    label: "Committed / permitted new load",
    unit: "MW",
    value: 533.1,
    tag: "reported",
    source: "Load Growth & Pricing Pressure — City of Austin building-permit pipeline, 22,177 permits",
  },
  {
    id: "committedMWh",
    label: "Committed / permitted new load, annualized",
    unit: "MWh/yr",
    value: 2330000,
    tag: "reported",
    source: "Load Growth & Pricing Pressure — same permit pipeline",
  },
  {
    id: "peakGrowthRatePct",
    label: "Peak-demand growth rate beyond the committed pipeline",
    unit: "%/yr",
    value: 0,
    tag: "blocked",
    source: "Not found",
    note:
      "No sourced long-range AE peak-demand growth forecast exists anywhere in this toolkit — the Load Growth tool models hypothetical scenarios (data centers, EVs, Dog's Head) but AE itself has not published a single forward growth-rate figure. Enter a real number from an AE or ERCOT load forecast to run multi-year capacity balance.",
  },
  {
    id: "reserveMarginTargetPct",
    label: "Target reserve margin",
    unit: "%",
    value: 0,
    tag: "blocked",
    source: "Not found",
    note:
      "No AE-specific or ERCOT-specific reserve-margin target has been sourced in this project. Capacity balance cannot run until a real target (e.g. from an AE or ERCOT planning filing) is entered here.",
  },
];

// ---------------------------------------------------------------------------
// SECTION 2 — Existing & committed resource portfolio, by fuel (2025 actuals)
// ---------------------------------------------------------------------------
export const resourceRows: ResourceRow[] = [
  {
    id: "coal",
    fuel: "Coal (Fayette)",
    kind: "owned",
    mw: 608,
    mwTag: "reported",
    mwSource: "Power Money — EIA-860 nameplate × AE ownership share (36% of Fayette)",
    generationMWh: 3036742,
    generationTag: "reported",
    perMWh: 19.65,
    perMWhTag: "derived",
    perMWhSource: "Power Money — $59,674,803 reported fuel cost ÷ 3,036,742 MWh",
    varOM: 5.0,
    fixedOM: 45,
    capital: 25,
    omTag: "benchmarked",
    omSource: "Power Money — NREL Annual Technology Baseline rate levels",
    retirement: "~2035 (estimated)",
    retirementTag: "reported",
    retirementSource: "Austin Energy's Power Contracts artifact",
    note: "AE's own Power Plants page states Fayette at 600 MW (AE's share) — a small, unreconciled gap from this EIA-860-derived 608 MW used for the cost-layer formula below.",
  },
  {
    id: "gas",
    fuel: "Natural gas (fleet incl. new 2026 peaker)",
    kind: "owned",
    mw: 1310,
    mwTag: "reported",
    mwSource: "Power Money — EIA-860 nameplate × AE ownership share",
    generationMWh: 1960692,
    generationTag: "reported",
    perMWh: 25.13,
    perMWhTag: "derived",
    perMWhSource: "Power Money — $49,274,946 reported fuel cost ÷ 1,960,692 MWh",
    varOM: 5.5,
    fixedOM: 25,
    capital: 30,
    omTag: "benchmarked",
    omSource: "Power Money — NREL ATB rate levels",
    retirement: "new unit ~2061 (estimated)",
    retirementTag: "reported",
    retirementSource: "Austin Energy's Power Contracts artifact (new 2026 gas peaker, 400 MW)",
    note: "AE's own Power Plants page names three gas plants totaling 799.6 MW (Decker 200 + Mueller 4.6 + Sand Hill 595) and doesn't yet list the new 2026 peaker — well below this EIA-860-derived 1,310 MW figure used for the cost-layer formula below. Gap not reconciled; see the named-facility table.",
  },
  {
    id: "nuclear",
    fuel: "Nuclear (South Texas Project)",
    kind: "owned",
    mw: 430,
    mwTag: "reported",
    mwSource: "Power Money — EIA-860 nameplate × AE's 16% STP share",
    generationMWh: 3485140,
    generationTag: "reported",
    perMWh: 7.0,
    perMWhTag: "benchmarked",
    perMWhSource: "Power Money — contracted-rate assumption, EIA reports no nuclear fuel cost",
    varOM: 3.0,
    fixedOM: 130,
    capital: 40,
    omTag: "benchmarked",
    omSource: "Power Money — NREL ATB rate levels",
    retirement: "2047–2048",
    retirementTag: "reported",
    retirementSource: "Austin Energy's Power Contracts artifact",
  },
  {
    id: "wind",
    fuel: "Wind (PPA fleet)",
    kind: "ppa",
    mw: 1795.64,
    mwTag: "reported",
    mwSource: "AE's Renewable Power Generation page — 10 named wind contracts, summed (AE's own page rounds to 1,796 MW)",
    generationMWh: 3576412,
    generationTag: "reported",
    perMWh: 25.0,
    perMWhTag: "reported",
    perMWhSource: "Power Money — contracted-rate estimate, $25/MWh from 2015",
    varOM: 0,
    fixedOM: 0,
    capital: 0,
    omTag: "reported",
    omSource: "PPA price is all-in — no separate O&M for contracted resources",
    retirement: "2027–2041 by contract (varies by farm)",
    retirementTag: "reported",
    retirementSource: "AE's Renewable Power Generation page — see the wind facility table below",
  },
  {
    id: "solar",
    fuel: "Utility solar (PPA fleet)",
    kind: "ppa",
    mw: 966,
    mwTag: "reported",
    mwSource: "AE's Renewable Power Generation page — 7 named solar contracts, summed to AE's own stated 966 MW total",
    generationMWh: 1835788,
    generationTag: "reported",
    perMWh: 38.2,
    perMWhTag: "derived",
    perMWhSource: "Power Money — $70,122,773 ÷ 1,835,788 MWh, 2025",
    varOM: 0,
    fixedOM: 0,
    capital: 0,
    omTag: "reported",
    omSource: "PPA price is all-in",
    retirement: "2031–2043 by contract (varies by farm)",
    retirementTag: "reported",
    retirementSource: "AE's Renewable Power Generation page — see the solar facility table below",
    note:
      "All 7 contracts and their individual MW are now in the solar facility table below. One of them, Waymark (178.5 MW, online 2018), isn't named in Power Money's per-contract pricing table under that name — it may be the same project as Power Money's \"Midway (2019),\" priced from a council RCA describing \"150-180 MW\" (see the facility table note), or it may be a genuinely unpriced 7th farm. Either way this row's $38.20/MWh effective rate is Power Money's own total fuel dollars divided by all 7 farms' combined generation, not confirmed per-farm for all seven.",
  },
  {
    id: "biomass",
    fuel: "Biomass (Nacogdoches)",
    kind: "ppa",
    mw: 105,
    mwTag: "reported",
    mwSource: "AE's Power Plants / Renewable Power Generation pages — Nacogdoches Power, Sacul TX",
    generationMWh: 250745,
    generationTag: "reported",
    perMWh: 70.0,
    perMWhTag: "reported",
    perMWhSource: "Power Money — contracted-rate estimate, $70/MWh",
    varOM: 0,
    fixedOM: 0,
    capital: 0,
    omTag: "reported",
    omSource: "PPA price is all-in",
    retirement: null,
    retirementTag: null,
    note:
      "AE acquired this plant outright in 2019 — it is an owned asset, not a PPA. Power Money's \"contracted-rate estimate, all-in, no separate O&M\" treatment (kept here for consistency with its cost-layer formula) predates that acquisition and may understate this row's true owned-asset O&M/capital cost.",
  },
  {
    id: "fueloil",
    fuel: "Fuel oil",
    kind: "owned",
    mw: 0,
    mwTag: "reported",
    mwSource: "Power Money — EIA-860 (rounds to 0 MW owned capacity)",
    generationMWh: 6173,
    generationTag: "reported",
    perMWh: 174.54,
    perMWhTag: "derived",
    perMWhSource: "Power Money — reported fuel + plant cost ÷ MWh",
    varOM: 8.0,
    fixedOM: 0,
    capital: 0,
    omTag: "benchmarked",
    omSource: "Power Money — NREL ATB",
    retirement: null,
    retirementTag: null,
  },
  {
    id: "localsolar",
    fuel: "Local rooftop solar",
    kind: "local",
    mw: 114.2,
    mwTag: "reported",
    mwSource: "Power Money — cumulative permitted capacity through 2026 (partial)",
    generationMWh: 155224,
    generationTag: "reported",
    perMWh: 114,
    perMWhTag: "derived",
    perMWhSource: "Power Money — Value of Solar credit (9.91¢/kWh) + amortized rebate",
    varOM: 0,
    fixedOM: 0,
    capital: 0,
    omTag: "reported",
    omSource: "Customers own and maintain their own equipment — no AE O&M or capital",
    retirement: null,
    retirementTag: null,
    note:
      "AE's own Power Plants page states 188 MW of local customer-sited solar — notably higher than this 114.2 MW figure, which Power Money derives from City of Austin permits through 2026 (partial). Power Money's own methodology note says permit-based counts undercount MW whenever a permit is missing a capacity value, which may explain the gap.",
  },
];

export const localBatteries = {
  dispatchableMW: 9.1,
  dispatchableMWTag: "derived" as Tag,
  dispatchableMWSource: "Power Money — 1,816 permitted batteries × ~5 kW assumed dispatchable each",
  capacityCostPerKWyr: 60,
  capacityCostTag: "derived" as Tag,
  capacityCostSource: "Power Money — Power Partner rebate + assumed $250/yr performance payment, levelized",
};

export const systemCostAdder: ScalarField = {
  id: "systemCostPerMWh",
  label: "System cost adder (T&D, ERCOT congestion, admin)",
  unit: "$/MWh",
  value: 68.31,
  tag: "derived",
  source: "Power Money — AE approved budget requirement minus power-supply cost, 2025",
};

// ---------------------------------------------------------------------------
// SECTION 3 — New resource options (forward-looking build choices)
// ---------------------------------------------------------------------------
export const newResourceOptions: NewResourceOption[] = [
  { id: "new-solar", label: "New utility solar (per MW added)", capexPerKW: 0, fixedOMPerKWyr: 0, variableCostPerMWh: 0, capacityFactorPct: 0, tag: "blocked" },
  { id: "new-wind", label: "New wind (per MW added)", capexPerKW: 0, fixedOMPerKWyr: 0, variableCostPerMWh: 0, capacityFactorPct: 0, tag: "blocked" },
  { id: "new-battery", label: "New battery storage (per MW added)", capexPerKW: 0, fixedOMPerKWyr: 0, variableCostPerMWh: 0, capacityFactorPct: 0, tag: "blocked" },
  { id: "new-gas", label: "New gas peaker capacity beyond the committed 400 MW unit", capexPerKW: 0, fixedOMPerKWyr: 0, variableCostPerMWh: 0, capacityFactorPct: 0, tag: "blocked" },
];
export const newResourceBlockNote =
  "Power Money and the pricing-pressure tools cover historical Austin Energy costs and a basis-cost growth scenario — neither contains forward-looking new-build capital or operating costs. This project has not gathered real figures for any new-resource option (e.g. from an Austin Energy resource-planning filing or NREL's Annual Technology Baseline). Every field below is 0 and the new-resource comparison will not run until real numbers replace them.";

// ---------------------------------------------------------------------------
// SECTION 4 — Reliability / grid constraints
// ---------------------------------------------------------------------------
export const reliabilityFields: ScalarField[] = [
  {
    id: "euclidHiljeReliefMW",
    label: "Euclid–Hillje transmission relief",
    unit: "MW",
    value: 2500,
    tag: "reported",
    source: "Load Zone Pricing Pressure — announced relief, targeted by June 2031",
  },
  {
    id: "ercotCapacityNowGW",
    label: "ERCOT system-wide installed capacity, current",
    unit: "GW",
    value: 150,
    tag: "reported",
    source: "Load Zone Pricing Pressure — ERCOT forecast",
  },
  {
    id: "ercotCapacity2031GW",
    label: "ERCOT system-wide installed capacity, 2031 forecast",
    unit: "GW",
    value: 218,
    tag: "reported",
    source: "Load Zone Pricing Pressure — ERCOT forecast",
  },
  {
    id: "aeTransmissionLimitMW",
    label: "AE-specific transmission-constrained import limit",
    unit: "MW",
    value: 0,
    tag: "blocked",
    source: "Not found",
    note:
      "Nothing in this project states Austin Energy's own transmission-constrained capacity limit as a single MW figure — only the Euclid–Hillje relief amount is sourced. Enter a real number from an AE or ERCOT transmission study to run a full reliability check.",
  },
  {
    id: "windELCCPct",
    label: "Wind effective (ELCC) capacity credit",
    unit: "% of nameplate",
    value: 0,
    tag: "blocked",
    source: "Not found",
    note:
      "AE's own pages now give real wind nameplate MW (1,795.64 MW), but nameplate isn't dependable capacity — wind rarely blows at full output during Austin's summer evening peak. Neither AE nor ERCOT's own peak-coincident capacity credit for AE's wind portfolio is sourced anywhere in this project. Counting raw nameplate MW toward the capacity balance would overstate how much of it is actually there at peak, so this stays 0/blocked until a real ELCC-style % is entered.",
  },
  {
    id: "solarELCCPct",
    label: "Solar effective (ELCC) capacity credit",
    unit: "% of nameplate",
    value: 0,
    tag: "blocked",
    source: "Not found",
    note:
      "Same issue as wind: 966 MW of utility-solar nameplate is now sourced, but AE's summer peak is a weekday-evening peak (per ERCOT's own methodology) when solar output is well past its midday maximum. No ERCOT- or AE-published solar capacity credit for this portfolio exists in this project yet.",
  },
];

// ---------------------------------------------------------------------------
// SECTION 5 — Forward price-pressure assumptions (explicitly scenario, not measured)
// ---------------------------------------------------------------------------
export const pricePressureFields = {
  baselineYear: 2025,
  baselineValue: 7.17,
  baselineTag: "reported" as Tag,
  baselineSource: "Load Zone Pricing Pressure — adverse basis cost, 2025",
  fleetMWhExposure: 12000000,
  fleetMWhTag: "invented" as Tag,
  fleetMWhSource: "Load Zone Pricing Pressure's own fixed fleet-exposure assumption",
  reliefYear: 2031,
  reliefYearTag: "derived" as Tag,
  reliefYearSource: "Derived from the Euclid–Hillje relief announcement",
  scenarios: [
    { id: "low", label: "Low", ratePct: 5, tag: "invented" as Tag },
    { id: "mid", label: "Mid", ratePct: 12, tag: "invented" as Tag },
    { id: "high", label: "High", ratePct: 22, tag: "invented" as Tag },
  ],
  scenarioNote:
    "These three growth rates are this toolkit's own planning presets, not a measured AE or ERCOT forecast — carried forward unchanged from the Load Zone Pricing Pressure tool.",
};

// ---------------------------------------------------------------------------
// SECTION 6 — Financial parameters
// ---------------------------------------------------------------------------
export const financialFields: ScalarField[] = [
  {
    id: "discountRatePct",
    label: "Discount rate",
    unit: "%",
    value: 0,
    tag: "blocked",
    source: "Not found",
    note:
      "No discount rate has been sourced or assumed anywhere in this project. Levelized-cost and NPV comparisons across resource options cannot run until a real rate is entered.",
  },
];

export const tagMeta: Record<Tag, { label: string; description: string }> = {
  reported: { label: "Reported", description: "Stated directly by Austin Energy, EIA, ERCOT, or a council document" },
  derived: { label: "Derived", description: "Arithmetic on reported numbers" },
  benchmarked: { label: "Benchmarked", description: "An industry-standard rate (NREL ATB) stands in for a number AE doesn't publish" },
  invented: { label: "Invented", description: "This toolkit's own scenario assumption for planning discussion" },
  blocked: { label: "Not available", description: "No real number exists in this project yet — calculations needing it will not run" },
};

export const intro = {
  kicker: "Standalone Planning Tool",
  title: "Austin Energy IRP Planning Interface",
  dek:
    "A standard Integrated Resource Plan has three parts: load-forecast and resource inputs, a calculation engine, and output fields — total cost, capacity balance, resource mix, reliability margin. This tool is built to that structure. Every input below is either a real number gathered from Austin Energy, EIA or ERCOT sources elsewhere in this project, or it is set to 0 and marked not available — and any calculation that depends on a 0 field will not run and says exactly which field is missing, instead of quietly guessing.",
  dataNote:
    "Source data pulled from austincleanenergy.net/austin-energy-generation-costs, Austin Energy's own Power Plants and Renewable Power Generation pages, Austin City Council RCAs/minutes and Electric Utility Commission agendas and backup documents for contracts not yet on either public site, and three companion tools in this project: Load Zone Pricing Pressure, Load Growth & Pricing Pressure, and Austin Energy's Power Contracts. Edit any field below — the calculations re-run live, including unblocking a calculation once you replace a 0 with a real figure.",
};
