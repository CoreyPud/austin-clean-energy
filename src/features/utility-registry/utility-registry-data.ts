// Utility Innovation Registry: types and data. Generated from the registry seed (compiled Oct 20, 2026).

export type Confidence = "High" | "Medium" | "Low";
export type Status = "Operating" | "Pilot" | "Approved" | "Proposed" | "In development" | "On hold" | "Completed";
export interface LabelValue { label: string; value: string }
export interface Source { title: string; url: string }
export interface RegistryRecord {
  id: string; category: string; name: string; operator: string; state: string; utilityType: string;
  status: Status; technologies: string[]; businessModel: string; scale: string; mw: number | null;
  timing: string; summary: string; outcomes: string; modelNote: string; risks: string[]; riskNote: string | null;
  confidence: Confidence; categoryFields: LabelValue[]; sources: Source[];
  startDate?: string | null; endDate?: string | null; datePrecision?: "day" | "month" | "year" | null;
}
export interface Category { key: string; label: string }
export interface Finding { title: string; text: string; sourceLabel: string; sourceUrl: string; category: string }
export interface StateProfile {
  abbr: string; name: string; kind: string; standard: string; standardNote: string; incentives: string[];
  incentiveNote: string; standardConfidence: Confidence; incentiveConfidence: Confidence; sources: Source[];
}
export interface SolarRow {
  abbr: string; name: string; julyOutputGwh: number | null; rank: number | null; julyShare: number | null;
  annualShare: number | null; utilityScaleMw: number | null; pipelineMw: number | null; installRank2025: number | null;
  ytdGwh2026: number | null; ytdGwh2025: number | null; utilityScaleGwh: number | null; residentialGwh: number | null;
  commercialGwh: number | null; industrialGwh: number | null;
}
export interface EfficiencyRow {
  name: string; abbr: string; rebateAllocationMillions: number | null; rebateStatus: string; administrator: string;
  note: string; weatherizationDollars: number | null; aceeeRank: number | null; namedInSolarForAllSuit: boolean;
}

export interface PilotForm {
  title: string; sponsor: string; site: string; technology: string; stage: string;
  hypothesis: string; comparator: string; primary_metric: string; success_threshold: string;
  secondary_metrics: string; duration_sample: string; stop_rule: string;
  funder: string; regulatory_path: string; data_sharing: string;
  status: string; result: string; result_summary: string; protocol_changes: string; evaluator: string; published_in: string;
}


export const STATUS_ORDER: Status[] = ["Operating", "Pilot", "Approved", "Proposed", "In development", "On hold", "Completed"];


export const categories: Category[] = [
 {
  "key": "VPP",
  "label": "Virtual power plants"
 },
 {
  "key": "V2G",
  "label": "Vehicle-to-grid"
 },
 {
  "key": "GETs",
  "label": "Grid-enhancing tech"
 },
 {
  "key": "Geothermal",
  "label": "Advanced geothermal"
 },
 {
  "key": "Program",
  "label": "State and utility programs"
 },
 {
  "key": "Green bank",
  "label": "Green banks"
 }
];


export const findings: Finding[] = [
 {
  "title": "Every technology has a different evidence base",
  "text": "VPPs have scale numbers and years of operation. V2G is mostly one to a few dozen buses per program. Grid-enhancing technologies lean on projections and vendor case studies. Advanced geothermal has one first-power claim. Compare within a category before across.",
  "sourceLabel": "",
  "sourceUrl": "",
  "category": "All"
 },
 {
  "title": "VPPs are large, but short of the target",
  "text": "North American VPP capacity has reached about 33 GW. DOE sees 80 to 160 GW, or 10 to 20% of peak load, as the liftoff goal.",
  "sourceLabel": "DOE Liftoff: VPPs",
  "sourceUrl": "https://liftoff.energy.gov/vpp/",
  "category": "VPP"
 },
 {
  "title": "Most VPP programs are single-device",
  "text": "About 80% of utility programs accept only one DER type, often limited to certain manufacturers. Programs that buy capacity from aggregators are far more multi-technology.",
  "sourceLabel": "Wood Mackenzie",
  "sourceUrl": "https://www.woodmac.com/news/opinion/US-does-2025-vpp-liftoff-report-update-offers-a-playbook-to-accelerate-virtual-power-plant-adoption/",
  "category": "VPP"
 },
 {
  "title": "Enrollment is the recurring VPP weak point",
  "text": "Practitioner commentary points to enrollment, more than incentive level, as the most common reason programs miss capacity targets. Much of this comes from vendors, so treat it as a hypothesis to test against dockets.",
  "sourceLabel": "Codibly analysis",
  "sourceUrl": "https://codibly.com/blog/articles/virtual-power-plant-program",
  "category": "VPP"
 },
 {
  "title": "Regulators are pushing VPPs to scale",
  "text": "Maryland's commission sent utility VPP pilots back because they covered a small share of the law's peak reduction goal. Virginia's 450 MW pilot and Illinois' tariffs came from legislation.",
  "sourceLabel": "Maryland PSC",
  "sourceUrl": "https://psc.maryland.gov/news/2025/psc-orders-utilities-to-scale-up-drive-act-proposals/",
  "category": "VPP"
 },
 {
  "title": "School buses dominate V2G",
  "text": "Utility Dive (Sept 2026), citing WRI, counts at least 26 utilities in 19 states with V2G programs and more than 230 V2G-enabled school buses in US districts. Other sources cite different counts.",
  "sourceLabel": "Utility Dive",
  "sourceUrl": "https://www.utilitydive.com/news/utilities-school-districts-see-growing-value-in-electric-buses-for-vpp/830499/",
  "category": "V2G"
 },
 {
  "title": "V2G payments vary widely",
  "text": "Reported compensation ranges from $2 per kWh (SDG&E emergency events) to $200 per kW (National Grid) to about $9,000 per vehicle per year (Green Mountain Power). Massachusetts experience puts a typical bus nearer $6,000 per year. Event-limited payments may not cover equipment.",
  "sourceLabel": "WRI",
  "sourceUrl": "https://www.wri.org/update/electric-school-bus-v2g-lessons-examples",
  "category": "V2G"
 },
 {
  "title": "Technology integration is the recurring V2G snag",
  "text": "Dominion buses failed to dispatch on low 12-volt batteries, La Plata's first platform failed, and a Maine pilot is paused without a compensation scheme. Several pilots only discharge to a building, not the grid.",
  "sourceLabel": "WRI",
  "sourceUrl": "https://www.wri.org/update/electric-school-bus-v2g-lessons-examples",
  "category": "V2G"
 },
 {
  "title": "Most GETs numbers are projections or vendor-reported",
  "text": "Oncor's 2014 report is the main measured result here: up to 14% over ambient-adjusted ratings. National Grid's 20 to 30% is expected, Central Hudson's savings are utility estimates, and the AEP figures come from the conductor vendor.",
  "sourceLabel": "Oncor DLR report summary",
  "sourceUrl": "https://www.renewableenergyworld.com/power-grid/transmission/oncor-dlr-program-increases-transmission-capacity-reduces-congestion/",
  "category": "GETs"
 },
 {
  "title": "GETs are limited by integration, not hardware",
  "text": "National Grid says its DLR rollout is as much a procedural challenge as a technical one: security, control room software and operator training make each site different.",
  "sourceLabel": "Latitude Media",
  "sourceUrl": "https://www.latitudemedia.com/news/behind-the-scenes-of-the-countrys-largest-dynamic-line-rating-deployment/",
  "category": "GETs"
 },
 {
  "title": "Enhanced geothermal just reached utility scale",
  "text": "Fervo reported first power at Cape Station on Sept 24, 2026, with SCE holding 320 MW of PPAs. Austin Energy's 5 MW pilot uses a different approach (sCO2) and has slipped past its 2025 target.",
  "sourceLabel": "Power Engineering",
  "sourceUrl": "https://www.power-eng.com/renewables/fervo-energy-achieves-first-power-at-flagship-utah-geothermal-project",
  "category": "Geothermal"
 },
 {
  "title": "States fund access, utilities pay for performance",
  "text": "Maryland pairs a regulator-run community solar program (40% low and moderate income share, about 10% savings) with an energy office grant that raises the low-income savings floor to 12 to 25% and sometimes free energy. Funding comes from the Strategic Energy Investment Fund.",
  "sourceLabel": "Maryland Energy Administration",
  "sourceUrl": "https://energy.maryland.gov/residential/Pages/CommunitySolarLMI-PPA.aspx/2/0100019a2bc3fc74-24c10b61-bbdb-4425-a1a8-4a21307ca327-000000/hRt5JmWUKqtQ5knAR7nZ3N9iPuDlPyEBlOEbgD-p6E4",
  "category": "Program"
 }
];


export const stateProfiles: StateProfile[] = [
 {
  "abbr": "AL",
  "name": "Alabama",
  "kind": "None found",
  "standard": "No standard listed",
  "standardNote": "NCSL lists no standard.",
  "incentives": [
   "No state tax credit",
   "Alabama Power pays avoided-cost export, about 5 to 7 cents per kWh"
  ],
  "incentiveNote": "Sources disagree on tax exemptions: one says none, one lists sales and property tax exemptions.",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "World Population Review: Solar incentives by state (Oct 2026)",
    "url": "https://worldpopulationreview.com/state-rankings/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "AK",
  "name": "Alaska",
  "kind": "None found",
  "standard": "No standard listed",
  "standardNote": "NCSL lists no standard.",
  "incentives": [
   "No state income tax credit",
   "Community grants through the Alaska Energy Authority's Renewable Energy Fund",
   "Net metering set utility by utility; Chugach pays retail for 25 kW or less"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "AZ",
  "name": "Arizona",
  "kind": "Mandatory RPS",
  "standard": "15% by 2025",
  "standardNote": "NCSL lists 15% by 2025 as mandatory. Wikipedia lists 100% by 2070; the sources do not explain the difference and it was not verified.",
  "incentives": [
   "25% state income tax credit, up to $1,000",
   "Utility rebates (APS, TEP, SRP)",
   "Sales tax exemption; property tax exclusion on added value"
  ],
  "incentiveNote": "Net metering varies by utility. See APS rows in the Solar Credit Benchmark.",
  "standardConfidence": "Low",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   },
   {
    "title": "Aurora Solar: Solar incentives by state (Feb 2026)",
    "url": "https://aurorasolar.com/home-solar/blog/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "AR",
  "name": "Arkansas",
  "kind": "None found",
  "standard": "No standard listed",
  "standardNote": "NCSL lists no standard.",
  "incentives": [
   "No state credit",
   "Retail-rate net metering mandate for Entergy Arkansas and OG&E; co-ops vary",
   "Sales tax exemption; 6-year property tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "CA",
  "name": "California",
  "kind": "100% target",
  "standard": "60% renewables by 2030; 100% clean by 2045",
  "standardNote": "Counts all non-emitting sources toward the 2045 goal.",
  "incentives": [
   "SGIP battery rebates ($150 to $200 per kWh standard, per one source)",
   "Net billing under NEM 3.0 with reduced export rates",
   "Low-income rooftop solar grants; property tax exclusion for active solar",
   "Demand Side Grid Support funds home battery dispatch (see CalReady in the registry)"
  ],
  "incentiveNote": "Funding status of the Demand Side Grid Support program for 2026 was not verified.",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   },
   {
    "title": "Aurora Solar: Solar incentives by state (Feb 2026)",
    "url": "https://aurorasolar.com/home-solar/blog/solar-incentives-by-state"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "CO",
  "name": "Colorado",
  "kind": "100% target",
  "standard": "80% clean by 2030; 100% clean by 2050 (utilities over 500,000 customers)",
  "standardNote": "Electric-sector zero-emission standard set by 2019 legislation, run through utility emissions-reduction plans.",
  "incentives": [
   "Xcel rebates up to $500 per kW and Solar*Rewards 10-year REC payments",
   "Sales and use tax exemption; residential property tax exemption on added value"
  ],
  "incentiveNote": "Sources disagree on a state income tax credit (one says 15% up to $1,000, one says none).",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "C2ES: State electricity portfolio standards",
    "url": "https://www.c2es.org/document/renewable-and-alternate-energy-portfolio-standards/"
   },
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "World Population Review: Solar incentives by state (Oct 2026)",
    "url": "https://worldpopulationreview.com/state-rankings/solar-incentives-by-state"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "CT",
  "name": "Connecticut",
  "kind": "Mandatory RPS",
  "standard": "48% by 2030",
  "standardNote": "Berkeley Lab says CT SB 4 weakened Class I requirements through 2030 and removed landfill gas and some biomass from eligibility.",
  "incentives": [
   "Residential Renewable Energy Solutions tariff replaced net metering",
   "Residential Solar Investment Program production payment about $0.20 to $0.26 per kWh for 6 years (one source)",
   "Property and sales tax exemptions"
  ],
  "incentiveNote": "One source describes ZREC and LREC auctions instead of the production payment.",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "Aurora Solar: Solar incentives by state (Feb 2026)",
    "url": "https://aurorasolar.com/home-solar/blog/solar-incentives-by-state"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "DE",
  "name": "Delaware",
  "kind": "Mandatory RPS",
  "standard": "40% by 2035",
  "standardNote": "Wikipedia lists an older 25% by 2025 figure.",
  "incentives": [
   "DNREC rebate $0.25 per watt, up to $2,500",
   "SRECs about $20 to $60 per MWh",
   "No sales tax; 9-year property tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "DC",
  "name": "District of Columbia",
  "kind": "100% target",
  "standard": "100% by 2032",
  "standardNote": "Not a state; included for completeness.",
  "incentives": [
   "SRECs about $350 to $450 per MWh (one source)",
   "Rebate and low-income programs; property tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   },
   {
    "title": "World Population Review: Solar incentives by state (Oct 2026)",
    "url": "https://worldpopulationreview.com/state-rankings/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "FL",
  "name": "Florida",
  "kind": "None found",
  "standard": "No standard listed",
  "standardNote": "NCSL lists no standard.",
  "incentives": [
   "Full retail-rate net metering",
   "Sales and property tax exemptions (full residential exemption)",
   "Utility rebates vary"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "GA",
  "name": "Georgia",
  "kind": "Voluntary goal",
  "standard": "Voluntary standard only",
  "standardNote": "Wikipedia lists Georgia among states with voluntary standards; NCSL lists none. Targets not captured.",
  "incentives": [
   "No state solar credit",
   "Retail net metering up to 10 kW; avoided cost above 10 kW",
   "Permanent property tax exemption; low-interest small business loans"
  ],
  "incentiveNote": "Georgia Power's 50 MW VPP is in the registry.",
  "standardConfidence": "Low",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "World Population Review: Solar incentives by state (Oct 2026)",
    "url": "https://worldpopulationreview.com/state-rankings/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "HI",
  "name": "Hawaii",
  "kind": "100% target",
  "standard": "100% by 2045",
  "standardNote": "Interim 40% by 2030 and 70% by 2040 per Wikipedia. Measured against generation, not retail sales.",
  "incentives": [
   "35% state income tax credit, capped at $5,000",
   "Smart Export about $0.14 to $0.20 per kWh; traditional net metering closed",
   "County property tax exemptions"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "ID",
  "name": "Idaho",
  "kind": "None found",
  "standard": "No standard listed",
  "standardNote": "NCSL lists no standard.",
  "incentives": [
   "No state credit; low-interest State Energy Loan (one source)",
   "Retail-rate mandate for Idaho Power and Avista with an October true-up"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "World Population Review: Solar incentives by state (Oct 2026)",
    "url": "https://worldpopulationreview.com/state-rankings/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "IL",
  "name": "Illinois",
  "kind": "100% target",
  "standard": "50% by 2040; 100% clean by 2050 (NCSL)",
  "standardNote": "Wikipedia lists 100% by 2045. The sources disagree and this was not resolved.",
  "incentives": [
   "Illinois Shines: up-front REC payment covering 15 years of production, about $75 to $90 per MWh (one source)",
   "Utility Rider SDVPP battery programs (see registry)",
   "Sales tax exemption; property tax assessment freeze"
  ],
  "incentiveNote": "",
  "standardConfidence": "Low",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "Aurora Solar: Solar incentives by state (Feb 2026)",
    "url": "https://aurorasolar.com/home-solar/blog/solar-incentives-by-state"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "IN",
  "name": "Indiana",
  "kind": "Voluntary goal",
  "standard": "10% by 2025 (voluntary)",
  "standardNote": "NCSL lists it as voluntary.",
  "incentives": [
   "No state incentives",
   "No net metering mandate; exports about $0.03 to $0.06 per kWh (AES, Duke)",
   "$6,000 property tax deduction"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "IA",
  "name": "Iowa",
  "kind": "Mandatory RPS",
  "standard": "105 MW of capacity (investor-owned utilities)",
  "standardNote": "Capacity-based target from 1999.",
  "incentives": [
   "No state credit (expired 2012)",
   "Net metering by Iowa Utilities Board mandate for MidAmerican and Alliant; co-ops vary",
   "5-year property tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "KS",
  "name": "Kansas",
  "kind": "Voluntary goal",
  "standard": "20% of peak demand by 2020 (goal)",
  "standardNote": "Binding status unclear in NCSL; Wikipedia lists it as voluntary.",
  "incentives": [
   "No state credit",
   "Net metering mandate for Evergy and Liberty; co-ops not covered",
   "Property tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Low",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "KY",
  "name": "Kentucky",
  "kind": "None found",
  "standard": "No standard listed",
  "standardNote": "NCSL lists no standard.",
  "incentives": [
   "No state credit",
   "Retail net metering (LG&E, KU, Duke); TVA buyback in eastern Kentucky"
  ],
  "incentiveNote": "Sources disagree on property tax exemption.",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "World Population Review: Solar incentives by state (Oct 2026)",
    "url": "https://worldpopulationreview.com/state-rankings/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "LA",
  "name": "Louisiana",
  "kind": "None found",
  "standard": "No standard listed",
  "standardNote": "Berkeley Lab notes Louisiana has an executive-order target only and excludes it from its counts.",
  "incentives": [
   "No state credit (expired 2015)",
   "Retail net metering (Entergy Louisiana, CLECO); co-ops vary",
   "50% property tax exemption for 10 years",
   "Entergy Louisiana and New Orleans proposals are in the registry"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "ME",
  "name": "Maine",
  "kind": "100% target",
  "standard": "80% by 2030; 100% by 2050",
  "standardNote": "Berkeley Lab says ME SP 738 extends Class IA targets through 2040 and creates a Class III that includes nuclear and other zero-GHG resources.",
  "incentives": [
   "Efficiency Maine rebate $450 per kW (up to $2,000); $800 per kW for income-qualified",
   "Net Energy Billing at retail",
   "Full property and sales tax exemptions"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "MD",
  "name": "Maryland",
  "kind": "Mandatory RPS",
  "standard": "50% by 2030, including 14.5% solar and at least 1,200 MW offshore wind",
  "standardNote": "Berkeley Lab says MD SB 783 adds a 150% multiplier under the solar carve-out for certain facilities under 5 MW, and excludes Maryland from its CES count (economy-wide targets only).",
  "incentives": [
   "Strategic Energy Investment Fund grants: low-income Community Solar Grant Program and commercial and canopy solar grants (see registry)",
   "Community Solar Program: 40% low and moderate income share, 5 MW per project",
   "Tier 1 SRECs about $40 to $90 per MWh; full property and sales tax exemptions",
   "$1,000 residential rebate (listed by two aggregators; not verified at the state source)"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Medium",
  "sources": [
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   },
   {
    "title": "Aurora Solar: Solar incentives by state (Feb 2026)",
    "url": "https://aurorasolar.com/home-solar/blog/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "MA",
  "name": "Massachusetts",
  "kind": "Mandatory RPS",
  "standard": "35% by 2030, then +1% per year",
  "standardNote": "Also has an alternative portfolio standard and a clean energy standard; percentages not captured.",
  "incentives": [
   "15% income tax credit, up to $1,000",
   "SMART production incentive about $0.05 to $0.20 per kWh for 10 to 20 years",
   "Full retail net metering; property tax exemption for up to 20 years",
   "ConnectedSolutions and MassCEC V2X (see registry)"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   },
   {
    "title": "Aurora Solar: Solar incentives by state (Feb 2026)",
    "url": "https://aurorasolar.com/home-solar/blog/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "MI",
  "name": "Michigan",
  "kind": "100% target",
  "standard": "Renewable 50% by 2030 and 60% by 2035; clean 80% by 2035 and 100% by 2040",
  "standardNote": "Public Act 235 of 2023. Also a 2,500 MW storage target and a distributed generation cap raised from 1% to 10%.",
  "incentives": [
   "Utility distributed generation payments about $0.025 to $0.040 per kWh for 10 years (one source)",
   "Retail-rate treatment under PA 342 for up to 150 kW (one source)",
   "Property tax exemption",
   "Michigan Saves green bank: home and commercial efficiency loans, on-bill financing (see registry)"
  ],
  "incentiveNote": "Pre-2023 aggregator figures may predate the new law.",
  "standardConfidence": "High",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "Michigan PSC: 2023 energy legislation",
    "url": "https://www.michigan.gov/mpsc/commission/workgroups/2023-energy-legislation"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "MN",
  "name": "Minnesota",
  "kind": "100% target",
  "standard": "55% by 2035; 100% carbon-free by 2040",
  "standardNote": "Wikipedia lists 80% by 2030. Berkeley Lab notes data center exemptions.",
  "incentives": [
   "Xcel Solar*Rewards about $0.020 to $0.035 per kWh for 10 years",
   "Full sales tax exemption; personal property often exempt from property tax",
   "Solar production tax applies above 1 MW"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "Aurora Solar: Solar incentives by state (Feb 2026)",
    "url": "https://aurorasolar.com/home-solar/blog/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "MS",
  "name": "Mississippi",
  "kind": "None found",
  "standard": "No standard listed",
  "standardNote": "NCSL lists no standard.",
  "incentives": [
   "No state credit",
   "Avoided-cost export about $0.03 to $0.06 per kWh (Entergy Mississippi, Mississippi Power)"
  ],
  "incentiveNote": "One source says net metering exists; another says avoided cost only.",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "World Population Review: Solar incentives by state (Oct 2026)",
    "url": "https://worldpopulationreview.com/state-rankings/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "MO",
  "name": "Missouri",
  "kind": "Mandatory RPS",
  "standard": "15% by 2021 (largest utilities)",
  "standardNote": "From a 2008 ballot measure. Berkeley Lab notes changes for accelerated renewable energy buyers.",
  "incentives": [
   "Retail net metering protected by SB 564 (Ameren Missouri, Evergy)",
   "Property tax exemption; utility rebates"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "MT",
  "name": "Montana",
  "kind": "Repealed",
  "standard": "15% by 2015, repealed in 2021",
  "standardNote": "NCSL.",
  "incentives": [
   "Retail net metering (NorthWestern Energy)",
   "10-year property tax exemption"
  ],
  "incentiveNote": "Sources disagree on a state credit and loan program. Not included.",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "NE",
  "name": "Nebraska",
  "kind": "None found",
  "standard": "No standard listed",
  "standardNote": "NCSL lists no standard.",
  "incentives": [
   "No state credit",
   "Retail net metering (OPPD, NPPD, LES); co-ops vary",
   "Sales tax exemption; 6-year property tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "NV",
  "name": "Nevada",
  "kind": "Mandatory RPS",
  "standard": "50% by 2030; 100% carbon-free by 2050 (non-binding)",
  "standardNote": "Berkeley Lab counts Nevada's electric-sector emission standard as a clean energy standard.",
  "incentives": [
   "Retail net metering with monthly rollover, protected by AB 405 (one source)",
   "Property and sales tax exemptions"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "NH",
  "name": "New Hampshire",
  "kind": "Mandatory RPS",
  "standard": "25.2% by 2025",
  "standardNote": "NCSL.",
  "incentives": [
   "Retail net metering up to 1 MW",
   "No sales tax; property tax exemption in most municipalities"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "World Population Review: Solar incentives by state (Oct 2026)",
    "url": "https://worldpopulationreview.com/state-rankings/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "NJ",
  "name": "New Jersey",
  "kind": "Mandatory RPS",
  "standard": "50% by 2030",
  "standardNote": "Berkeley Lab mentions a possible RPS freeze in 2025 without detail and treats New Jersey's clean standard as executive-order only.",
  "incentives": [
   "SREC-II about $185 to $270 per MWh",
   "Successor Solar Incentive (SuSI) 15-year payments",
   "Net metering with annual true-up; sales and property tax exemptions"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "NM",
  "name": "New Mexico",
  "kind": "100% target",
  "standard": "40% by 2025; 80% by 2040; 100% zero-carbon by 2045",
  "standardNote": "NCSL and Wikipedia.",
  "incentives": [
   "Solar Market Development Tax Credit, 10% up to $6,000",
   "Retail net metering protected by statute (PNM, El Paso Electric)",
   "Gross receipts tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "NY",
  "name": "New York",
  "kind": "100% target",
  "standard": "70% by 2030; 100% zero-emission by 2040",
  "standardNote": "NCSL and Wikipedia.",
  "incentives": [
   "25% state income tax credit, up to $5,000",
   "NY-Sun incentives (about $400 to $1,000 per kW in one source)",
   "Monthly credit rollovers; property tax exemption; sales tax exemption"
  ],
  "incentiveNote": "NY value stack credit details are in the Solar Credit Benchmark.",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "Aurora Solar: Solar incentives by state (Feb 2026)",
    "url": "https://aurorasolar.com/home-solar/blog/solar-incentives-by-state"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "NC",
  "name": "North Carolina",
  "kind": "100% target",
  "standard": "Carbon neutral by 2050",
  "standardNote": "Berkeley Lab says NC S 266 eliminated Duke Energy's interim 2030 target but kept the 2050 target.",
  "incentives": [
   "No state credit (phased out 2016)",
   "Duke retail net metering under HB 589 through 2027 (one source)",
   "80% property tax exclusion; partial sales tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "C2ES: State electricity portfolio standards",
    "url": "https://www.c2es.org/document/renewable-and-alternate-energy-portfolio-standards/"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "ND",
  "name": "North Dakota",
  "kind": "Voluntary goal",
  "standard": "10% by 2015 (objective)",
  "standardNote": "NCSL does not state binding status; Wikipedia lists it as voluntary.",
  "incentives": [
   "No state credit",
   "Net metering by commission mandate (Xcel, MDU); co-ops not covered",
   "5-year property tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Low",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "OH",
  "name": "Ohio",
  "kind": "Mandatory RPS",
  "standard": "8.5% by 2026",
  "standardNote": "Reduced by 2019 House Bill 6.",
  "incentives": [
   "SREC market very low, about $5 to $15 per MWh",
   "100% property tax exemption for 15 years",
   "Retail net metering under PUCO orders"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "OK",
  "name": "Oklahoma",
  "kind": "Voluntary goal",
  "standard": "15% by 2015 (goal)",
  "standardNote": "NCSL; Wikipedia lists it as voluntary.",
  "incentives": [
   "No state income tax credit",
   "Commission net metering mandate (OG&E, PSO); co-ops not covered",
   "State sales tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "OR",
  "name": "Oregon",
  "kind": "100% target",
  "standard": "Emissions 80% below baseline by 2030, 90% by 2035, 100% by 2040",
  "standardNote": "Electric-sector zero-emission standard from 2021 legislation, for retail electricity providers.",
  "incentives": [
   "Energy Trust of Oregon cash incentive (up to $2,500 in one source)",
   "Retail net metering, statutory",
   "Full property tax exemption"
  ],
  "incentiveNote": "Sources disagree on a state residential energy tax credit (30% up to $6,000 in one, none in another).",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "C2ES: State electricity portfolio standards",
    "url": "https://www.c2es.org/document/renewable-and-alternate-energy-portfolio-standards/"
   },
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "PA",
  "name": "Pennsylvania",
  "kind": "Mandatory RPS",
  "standard": "18% by 2021, including 0.5% solar",
  "standardNote": "NCSL and Wikipedia.",
  "incentives": [
   "Alternative Energy Credit market about $25 to $50 per MWh",
   "PUC-required retail net metering",
   "No statewide property or sales tax exemption (one source)"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "RI",
  "name": "Rhode Island",
  "kind": "100% target",
  "standard": "100% by 2033 (NCSL)",
  "standardNote": "Wikipedia lists 2030. The sources disagree.",
  "incentives": [
   "Renewable Energy Fund rebate $0.20 to $0.35 per watt (higher for income-qualified)",
   "Retail net metering, protected by statute",
   "Full property and sales tax exemptions"
  ],
  "incentiveNote": "",
  "standardConfidence": "Low",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "SC",
  "name": "South Carolina",
  "kind": "Voluntary goal",
  "standard": "2% by 2021 (voluntary)",
  "standardNote": "NCSL.",
  "incentives": [
   "25% state income tax credit, up to $3,500 per year with a 10-year carry-forward",
   "Retail net metering for systems under 20 kW",
   "Full property tax exemption"
  ],
  "incentiveNote": "Sources disagree on the credit cap.",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "SD",
  "name": "South Dakota",
  "kind": "Voluntary goal",
  "standard": "10% by 2015 (objective)",
  "standardNote": "NCSL does not state binding status; Wikipedia lists it as voluntary.",
  "incentives": [
   "No state credit",
   "Net metering by commission mandate (Black Hills, Xcel); co-ops set own rules",
   "3-year property tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Low",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "TN",
  "name": "Tennessee",
  "kind": "None found",
  "standard": "No standard listed",
  "standardNote": "NCSL lists no standard.",
  "incentives": [
   "No state credit",
   "TVA Green Power Providers buyback about $0.044 to $0.053 per kWh plus a monthly fee (one source)",
   "No traditional net metering in most areas"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "TX",
  "name": "Texas",
  "kind": "Mandatory RPS",
  "standard": "5,880 MW by 2015; 10,000 MW goal for 2025",
  "standardNote": "Wikipedia says the target was reached in 2010.",
  "incentives": [
   "No state credit or income tax",
   "100% property tax exemption on the value solar adds; sales tax exemption on equipment",
   "Utility programs: Austin Energy rebate and Value of Solar, CPS Energy rebate",
   "Retailer buyback plans pay about $0.04 to $0.08 per kWh"
  ],
  "incentiveNote": "See Texas rows in the Solar Credit Benchmark and Austin Energy records in the registry.",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "UT",
  "name": "Utah",
  "kind": "Voluntary goal",
  "standard": "20% by 2025 (goal)",
  "standardNote": "NCSL; Wikipedia lists it as voluntary.",
  "incentives": [
   "25% state tax credit, capped at $1,600 per year (two sources; a third lists none)",
   "Sales tax exemption",
   "Rocky Mountain Power export credit"
  ],
  "incentiveNote": "One source says Utah pays retail rate, but the Solar Credit Benchmark found an export credit rate of about 4 cents per kWh from the Public Service Commission. Treat that source as wrong on this point.",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "JouleIO: Solar incentives by state (updated Sept 2026)",
    "url": "https://jouleio.com/blog/solar-incentives-by-state/"
   }
  ]
 },
 {
  "abbr": "VT",
  "name": "Vermont",
  "kind": "100% target",
  "standard": "100% by 2030 for most utilities",
  "standardNote": "Berkeley Lab says VT H 289 raised the earlier 75% by 2032 standard, raised the distributed generation carve-out and added a new-renewables requirement.",
  "incentives": [
   "Retail net metering for systems up to 150 kW",
   "Property tax exemption; sales tax exemption",
   "Green Mountain Power battery and V2G programs (see registry)"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "VA",
  "name": "Virginia",
  "kind": "100% target",
  "standard": "100% clean by 2045 (Phase II utilities) or 2050 (Phase I)",
  "standardNote": "Excludes existing nuclear per Wikipedia. Berkeley Lab notes changes to eligibility and REC banking.",
  "incentives": [
   "Dominion retail net metering, protected through 2028 (one source)",
   "Local-option or 100% property tax exemption; limited residential sales tax exemption",
   "Dominion 450 MW VPP pilot and school bus V2G (see registry)"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "Aurora Solar: Solar incentives by state (Feb 2026)",
    "url": "https://aurorasolar.com/home-solar/blog/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "WA",
  "name": "Washington",
  "kind": "100% target",
  "standard": "100% renewable or zero-emitting by 2045; 80% clean by 2030",
  "standardNote": "Excludes existing large hydropower per Wikipedia.",
  "incentives": [
   "Sales and use tax exemption for qualifying systems",
   "Production incentives about $0.08 to $0.12 per kWh; program waitlisted (one source)"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "World Population Review: Solar incentives by state (Oct 2026)",
    "url": "https://worldpopulationreview.com/state-rankings/solar-incentives-by-state"
   },
   {
    "title": "Aurora Solar: Solar incentives by state (Feb 2026)",
    "url": "https://aurorasolar.com/home-solar/blog/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "WV",
  "name": "West Virginia",
  "kind": "Repealed",
  "standard": "25% by 2025, repealed in 2015",
  "standardNote": "NCSL.",
  "incentives": [
   "No state incentives",
   "Retail net metering with annual true-up at AEP and Mon Power"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   },
   {
    "title": "World Population Review: Solar incentives by state (Oct 2026)",
    "url": "https://worldpopulationreview.com/state-rankings/solar-incentives-by-state"
   }
  ]
 },
 {
  "abbr": "WI",
  "name": "Wisconsin",
  "kind": "Mandatory RPS",
  "standard": "10% by 2015",
  "standardNote": "Wikipedia marks this entry as needing an update. Berkeley Lab treats Wisconsin's clean energy target as executive-order only.",
  "incentives": [
   "Focus on Energy rebate about $500 to $800 (up to $2,500 income-qualified)",
   "Full property and sales tax exemptions",
   "Retail net metering up to 100 kW (one source)"
  ],
  "incentiveNote": "",
  "standardConfidence": "Low",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "Wikipedia: Renewable portfolio standards in the United States",
    "url": "https://en.wikipedia.org/wiki/Renewable_portfolio_standards_in_the_United_States"
   },
   {
    "title": "Berkeley Lab: State Electricity Resource Standards, 2025 data update",
    "url": "https://emp.lbl.gov/publications/us-state-electricity-resource"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 },
 {
  "abbr": "WY",
  "name": "Wyoming",
  "kind": "None found",
  "standard": "No standard listed",
  "standardNote": "NCSL lists no standard.",
  "incentives": [
   "No state income tax or solar credit",
   "Rocky Mountain Power net metering with annual true-up at avoided cost",
   "No property tax exemption"
  ],
  "incentiveNote": "",
  "standardConfidence": "Medium",
  "incentiveConfidence": "Low",
  "sources": [
   {
    "title": "NCSL: State RPS and goals (page dated Aug 2021)",
    "url": "https://www.ncsl.org/energy/state-renewable-portfolio-standards-and-goals"
   },
   {
    "title": "SolarPriceList: Solar incentives by state (Sept 2026)",
    "url": "https://solarpricelist.com/blog/2026-solar-incentives-by-region-complete-state-by-state-guide"
   }
  ]
 }
];


export const solarAdoption: SolarRow[] = [
 {
  "abbr": "AL",
  "name": "Alabama",
  "julyOutputGwh": null,
  "rank": null,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 1082,
  "ytdGwh2025": 831,
  "utilityScaleGwh": 1061,
  "residentialGwh": 6,
  "commercialGwh": 12,
  "industrialGwh": 3
 },
 {
  "abbr": "AK",
  "name": "Alaska",
  "julyOutputGwh": null,
  "rank": null,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 27,
  "ytdGwh2025": 23,
  "utilityScaleGwh": 8,
  "residentialGwh": 13,
  "commercialGwh": 5,
  "industrialGwh": 0.21
 },
 {
  "abbr": "AZ",
  "name": "Arizona",
  "julyOutputGwh": 2708,
  "rank": 4,
  "julyShare": 19.5,
  "annualShare": 14.4,
  "utilityScaleMw": 8700,
  "pipelineMw": 5200,
  "installRank2025": 5,
  "ytdGwh2026": 14618,
  "ytdGwh2025": 12286,
  "utilityScaleGwh": 10874,
  "residentialGwh": 2915,
  "commercialGwh": 815,
  "industrialGwh": 14
 },
 {
  "abbr": "AR",
  "name": "Arkansas",
  "julyOutputGwh": 766,
  "rank": 17,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": 1800,
  "installRank2025": 9,
  "ytdGwh2026": 3933,
  "ytdGwh2025": 3105,
  "utilityScaleGwh": 3540,
  "residentialGwh": 181,
  "commercialGwh": 160,
  "industrialGwh": 51
 },
 {
  "abbr": "CA",
  "name": "California",
  "julyOutputGwh": 10596,
  "rank": 1,
  "julyShare": 41,
  "annualShare": 32.1,
  "utilityScaleMw": 55000,
  "pipelineMw": 4800,
  "installRank2025": 2,
  "ytdGwh2026": 57641,
  "ytdGwh2025": 53922,
  "utilityScaleGwh": 34621,
  "residentialGwh": 15595,
  "commercialGwh": 5222,
  "industrialGwh": 2204
 },
 {
  "abbr": "CO",
  "name": "Colorado",
  "julyOutputGwh": 1175,
  "rank": 13,
  "julyShare": 19.7,
  "annualShare": 9.9,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 5989,
  "ytdGwh2025": 4657,
  "utilityScaleGwh": 4428,
  "residentialGwh": 1196,
  "commercialGwh": 326,
  "industrialGwh": 40
 },
 {
  "abbr": "CT",
  "name": "Connecticut",
  "julyOutputGwh": 332,
  "rank": 30,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 1810,
  "ytdGwh2025": 1510,
  "utilityScaleGwh": 531,
  "residentialGwh": 834,
  "commercialGwh": 358,
  "industrialGwh": 87
 },
 {
  "abbr": "DE",
  "name": "Delaware",
  "julyOutputGwh": 56,
  "rank": 44,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 301,
  "ytdGwh2025": 249,
  "utilityScaleGwh": 147,
  "residentialGwh": 110,
  "commercialGwh": 35,
  "industrialGwh": 8
 },
 {
  "abbr": "FL",
  "name": "Florida",
  "julyOutputGwh": 3280,
  "rank": 3,
  "julyShare": null,
  "annualShare": 10.3,
  "utilityScaleMw": 20100,
  "pipelineMw": 2800,
  "installRank2025": 4,
  "ytdGwh2026": 20673,
  "ytdGwh2025": 18206,
  "utilityScaleGwh": 17107,
  "residentialGwh": 3255,
  "commercialGwh": 266,
  "industrialGwh": 45
 },
 {
  "abbr": "GA",
  "name": "Georgia",
  "julyOutputGwh": 1302,
  "rank": 10,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": 7500,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 7494,
  "ytdGwh2025": 7403,
  "utilityScaleGwh": 7087,
  "residentialGwh": 162,
  "commercialGwh": 81,
  "industrialGwh": 164
 },
 {
  "abbr": "HI",
  "name": "Hawaii",
  "julyOutputGwh": 268,
  "rank": 35,
  "julyShare": 26.9,
  "annualShare": 21.2,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 1592,
  "ytdGwh2025": 1541,
  "utilityScaleGwh": 544,
  "residentialGwh": 716,
  "commercialGwh": 329,
  "industrialGwh": 2
 },
 {
  "abbr": "ID",
  "name": "Idaho",
  "julyOutputGwh": 279,
  "rank": 33,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 1436,
  "ytdGwh2025": 1222,
  "utilityScaleGwh": 1230,
  "residentialGwh": 165,
  "commercialGwh": 14,
  "industrialGwh": 26
 },
 {
  "abbr": "IL",
  "name": "Illinois",
  "julyOutputGwh": 1704,
  "rank": 6,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": 6,
  "ytdGwh2026": 8077,
  "ytdGwh2025": 5304,
  "utilityScaleGwh": 6251,
  "residentialGwh": 1017,
  "commercialGwh": 795,
  "industrialGwh": 13
 },
 {
  "abbr": "IN",
  "name": "Indiana",
  "julyOutputGwh": 1279,
  "rank": 11,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": 3200,
  "installRank2025": 3,
  "ytdGwh2026": 6266,
  "ytdGwh2025": 4031,
  "utilityScaleGwh": 5983,
  "residentialGwh": 112,
  "commercialGwh": 155,
  "industrialGwh": 16
 },
 {
  "abbr": "IA",
  "name": "Iowa",
  "julyOutputGwh": 246,
  "rank": 36,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 1272,
  "ytdGwh2025": 1178,
  "utilityScaleGwh": 886,
  "residentialGwh": 179,
  "commercialGwh": 191,
  "industrialGwh": 17
 },
 {
  "abbr": "KS",
  "name": "Kansas",
  "julyOutputGwh": 145,
  "rank": 38,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 675,
  "ytdGwh2025": 369,
  "utilityScaleGwh": 534,
  "residentialGwh": 89,
  "commercialGwh": 49,
  "industrialGwh": 3
 },
 {
  "abbr": "KY",
  "name": "Kentucky",
  "julyOutputGwh": 274,
  "rank": 34,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 1599,
  "ytdGwh2025": 896,
  "utilityScaleGwh": 1478,
  "residentialGwh": 86,
  "commercialGwh": 32,
  "industrialGwh": 3
 },
 {
  "abbr": "LA",
  "name": "Louisiana",
  "julyOutputGwh": 385,
  "rank": 28,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 1984,
  "ytdGwh2025": 1650,
  "utilityScaleGwh": 1747,
  "residentialGwh": 219,
  "commercialGwh": 18,
  "industrialGwh": 0.14
 },
 {
  "abbr": "ME",
  "name": "Maine",
  "julyOutputGwh": 374,
  "rank": 29,
  "julyShare": 25.2,
  "annualShare": 9.7,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 1989,
  "ytdGwh2025": 1769,
  "utilityScaleGwh": 1058,
  "residentialGwh": 156,
  "commercialGwh": 775,
  "industrialGwh": 0.02
 },
 {
  "abbr": "MD",
  "name": "Maryland",
  "julyOutputGwh": 483,
  "rank": 24,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 2528,
  "ytdGwh2025": 1812,
  "utilityScaleGwh": 1288,
  "residentialGwh": 901,
  "commercialGwh": 312,
  "industrialGwh": 27
 },
 {
  "abbr": "MA",
  "name": "Massachusetts",
  "julyOutputGwh": 823,
  "rank": 16,
  "julyShare": 32.2,
  "annualShare": 16.4,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 4503,
  "ytdGwh2025": 4136,
  "utilityScaleGwh": 1614,
  "residentialGwh": 1332,
  "commercialGwh": 1507,
  "industrialGwh": 51
 },
 {
  "abbr": "MI",
  "name": "Michigan",
  "julyOutputGwh": 692,
  "rank": 18,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": 4300,
  "installRank2025": null,
  "ytdGwh2026": 3249,
  "ytdGwh2025": 1969,
  "utilityScaleGwh": 2941,
  "residentialGwh": 176,
  "commercialGwh": 126,
  "industrialGwh": 6
 },
 {
  "abbr": "MN",
  "name": "Minnesota",
  "julyOutputGwh": 596,
  "rank": 21,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 2703,
  "ytdGwh2025": 2237,
  "utilityScaleGwh": 2347,
  "residentialGwh": 227,
  "commercialGwh": 113,
  "industrialGwh": 15
 },
 {
  "abbr": "MS",
  "name": "Mississippi",
  "julyOutputGwh": 415,
  "rank": 27,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 2260,
  "ytdGwh2025": 1763,
  "utilityScaleGwh": 2237,
  "residentialGwh": 14,
  "commercialGwh": 9,
  "industrialGwh": 1
 },
 {
  "abbr": "MO",
  "name": "Missouri",
  "julyOutputGwh": 461,
  "rank": 26,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 2709,
  "ytdGwh2025": 1343,
  "utilityScaleGwh": 2171,
  "residentialGwh": 352,
  "commercialGwh": 172,
  "industrialGwh": 13
 },
 {
  "abbr": "MT",
  "name": "Montana",
  "julyOutputGwh": 63,
  "rank": 42,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 297,
  "ytdGwh2025": 318,
  "utilityScaleGwh": 183,
  "residentialGwh": 97,
  "commercialGwh": 16,
  "industrialGwh": 0
 },
 {
  "abbr": "NE",
  "name": "Nebraska",
  "julyOutputGwh": 46,
  "rank": 45,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 227,
  "ytdGwh2025": 194,
  "utilityScaleGwh": 185,
  "residentialGwh": 30,
  "commercialGwh": 10,
  "industrialGwh": 2
 },
 {
  "abbr": "NV",
  "name": "Nevada",
  "julyOutputGwh": 1767,
  "rank": 5,
  "julyShare": 30.7,
  "annualShare": 25.4,
  "utilityScaleMw": 8200,
  "pipelineMw": 2500,
  "installRank2025": null,
  "ytdGwh2026": 10182,
  "ytdGwh2025": 9848,
  "utilityScaleGwh": 8681,
  "residentialGwh": 1351,
  "commercialGwh": 94,
  "industrialGwh": 56
 },
 {
  "abbr": "NH",
  "name": "New Hampshire",
  "julyOutputGwh": null,
  "rank": null,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 296,
  "ytdGwh2025": 254,
  "utilityScaleGwh": 5,
  "residentialGwh": 192,
  "commercialGwh": 90,
  "industrialGwh": 9
 },
 {
  "abbr": "NJ",
  "name": "New Jersey",
  "julyOutputGwh": 687,
  "rank": 19,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": 5100,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 4001,
  "ytdGwh2025": 3508,
  "utilityScaleGwh": 1329,
  "residentialGwh": 1454,
  "commercialGwh": 1054,
  "industrialGwh": 164
 },
 {
  "abbr": "NM",
  "name": "New Mexico",
  "julyOutputGwh": 974,
  "rank": 15,
  "julyShare": 22.4,
  "annualShare": 12.7,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 5438,
  "ytdGwh2025": 4072,
  "utilityScaleGwh": 4918,
  "residentialGwh": 431,
  "commercialGwh": 87,
  "industrialGwh": 3
 },
 {
  "abbr": "NY",
  "name": "New York",
  "julyOutputGwh": 1347,
  "rank": 8,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": 6800,
  "pipelineMw": null,
  "installRank2025": 10,
  "ytdGwh2026": 7295,
  "ytdGwh2025": 6325,
  "utilityScaleGwh": 3619,
  "residentialGwh": 1601,
  "commercialGwh": 2042,
  "industrialGwh": 34
 },
 {
  "abbr": "NC",
  "name": "North Carolina",
  "julyOutputGwh": 1546,
  "rank": 7,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": 9800,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 8894,
  "ytdGwh2025": 8528,
  "utilityScaleGwh": 8204,
  "residentialGwh": 513,
  "commercialGwh": 160,
  "industrialGwh": 16
 },
 {
  "abbr": "ND",
  "name": "North Dakota",
  "julyOutputGwh": 1,
  "rank": 47,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 3,
  "ytdGwh2025": 2,
  "utilityScaleGwh": 0,
  "residentialGwh": 2,
  "commercialGwh": 1,
  "industrialGwh": 0
 },
 {
  "abbr": "OH",
  "name": "Ohio",
  "julyOutputGwh": 1326,
  "rank": 9,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": 3900,
  "installRank2025": 7,
  "ytdGwh2026": 6614,
  "ytdGwh2025": 5091,
  "utilityScaleGwh": 6167,
  "residentialGwh": 223,
  "commercialGwh": 171,
  "industrialGwh": 53
 },
 {
  "abbr": "OK",
  "name": "Oklahoma",
  "julyOutputGwh": 287,
  "rank": 32,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 1292,
  "ytdGwh2025": 527,
  "utilityScaleGwh": 1110,
  "residentialGwh": 146,
  "commercialGwh": 32,
  "industrialGwh": 4
 },
 {
  "abbr": "OR",
  "name": "Oregon",
  "julyOutputGwh": 484,
  "rank": 23,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 2357,
  "ytdGwh2025": 2140,
  "utilityScaleGwh": 1840,
  "residentialGwh": 380,
  "commercialGwh": 122,
  "industrialGwh": 16
 },
 {
  "abbr": "PA",
  "name": "Pennsylvania",
  "julyOutputGwh": 470,
  "rank": 25,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 2510,
  "ytdGwh2025": 2031,
  "utilityScaleGwh": 1331,
  "residentialGwh": 724,
  "commercialGwh": 360,
  "industrialGwh": 95
 },
 {
  "abbr": "RI",
  "name": "Rhode Island",
  "julyOutputGwh": 125,
  "rank": 39,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 677,
  "ytdGwh2025": 657,
  "utilityScaleGwh": 475,
  "residentialGwh": 163,
  "commercialGwh": 33,
  "industrialGwh": 6
 },
 {
  "abbr": "SC",
  "name": "South Carolina",
  "julyOutputGwh": 520,
  "rank": 22,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 2898,
  "ytdGwh2025": 2466,
  "utilityScaleGwh": 2469,
  "residentialGwh": 318,
  "commercialGwh": 83,
  "industrialGwh": 28
 },
 {
  "abbr": "SD",
  "name": "South Dakota",
  "julyOutputGwh": 59,
  "rank": 43,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 305,
  "ytdGwh2025": 289,
  "utilityScaleGwh": 301,
  "residentialGwh": 4,
  "commercialGwh": 0,
  "industrialGwh": 0
 },
 {
  "abbr": "TN",
  "name": "Tennessee",
  "julyOutputGwh": 300,
  "rank": 31,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 1371,
  "ytdGwh2025": 741,
  "utilityScaleGwh": 1319,
  "residentialGwh": 17,
  "commercialGwh": 36,
  "industrialGwh": 0.03
 },
 {
  "abbr": "TX",
  "name": "Texas",
  "julyOutputGwh": 10126,
  "rank": 2,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": 51900,
  "pipelineMw": 38000,
  "installRank2025": 1,
  "ytdGwh2026": 49022,
  "ytdGwh2025": 36216,
  "utilityScaleGwh": 45531,
  "residentialGwh": 3093,
  "commercialGwh": 395,
  "industrialGwh": 3
 },
 {
  "abbr": "UT",
  "name": "Utah",
  "julyOutputGwh": 1026,
  "rank": 14,
  "julyShare": 24.6,
  "annualShare": 11.8,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": 8,
  "ytdGwh2026": 5426,
  "ytdGwh2025": 4056,
  "utilityScaleGwh": 4721,
  "residentialGwh": 584,
  "commercialGwh": 112,
  "industrialGwh": 10
 },
 {
  "abbr": "VT",
  "name": "Vermont",
  "julyOutputGwh": 89,
  "rank": 40,
  "julyShare": 37.1,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 449,
  "ytdGwh2025": 298,
  "utilityScaleGwh": 149,
  "residentialGwh": 126,
  "commercialGwh": 172,
  "industrialGwh": 2
 },
 {
  "abbr": "VA",
  "name": "Virginia",
  "julyOutputGwh": 1201,
  "rank": 12,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": 6200,
  "pipelineMw": 2100,
  "installRank2025": null,
  "ytdGwh2026": 7052,
  "ytdGwh2025": 6418,
  "utilityScaleGwh": 6321,
  "residentialGwh": 588,
  "commercialGwh": 137,
  "industrialGwh": 5
 },
 {
  "abbr": "WA",
  "name": "Washington",
  "julyOutputGwh": 219,
  "rank": 37,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 974,
  "ytdGwh2025": 873,
  "utilityScaleGwh": 458,
  "residentialGwh": 433,
  "commercialGwh": 82,
  "industrialGwh": 2
 },
 {
  "abbr": "WV",
  "name": "West Virginia",
  "julyOutputGwh": 42,
  "rank": 46,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 255,
  "ytdGwh2025": 213,
  "utilityScaleGwh": 192,
  "residentialGwh": 46,
  "commercialGwh": 14,
  "industrialGwh": 3
 },
 {
  "abbr": "WI",
  "name": "Wisconsin",
  "julyOutputGwh": 621,
  "rank": 20,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 3150,
  "ytdGwh2025": 2812,
  "utilityScaleGwh": 2851,
  "residentialGwh": 158,
  "commercialGwh": 116,
  "industrialGwh": 25
 },
 {
  "abbr": "WY",
  "name": "Wyoming",
  "julyOutputGwh": 67,
  "rank": 41,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 348,
  "ytdGwh2025": 344,
  "utilityScaleGwh": 319,
  "residentialGwh": 25,
  "commercialGwh": 3,
  "industrialGwh": 0.43
 },
 {
  "abbr": "DC",
  "name": "District of Columbia",
  "julyOutputGwh": null,
  "rank": null,
  "julyShare": null,
  "annualShare": null,
  "utilityScaleMw": null,
  "pipelineMw": null,
  "installRank2025": null,
  "ytdGwh2026": 313,
  "ytdGwh2025": 216,
  "utilityScaleGwh": 38,
  "residentialGwh": 205,
  "commercialGwh": 70,
  "industrialGwh": 0
 }
];


export const efficiency: EfficiencyRow[] = [
 {
  "name": "Alabama",
  "abbr": "AL",
  "rebateAllocationMillions": 146,
  "rebateStatus": "Not launched",
  "administrator": "ADECA",
  "note": "No launch date as of Oct 2026",
  "weatherizationDollars": 3545963,
  "aceeeRank": 50,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Alaska",
  "abbr": "AK",
  "rebateAllocationMillions": 75,
  "rebateStatus": "Not launched",
  "administrator": "AHFC",
  "note": "Lists only a $10,000 new-home rebate",
  "weatherizationDollars": 2455011,
  "aceeeRank": 40,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Arizona",
  "abbr": "AZ",
  "rebateAllocationMillions": 153,
  "rebateStatus": "Open with limits",
  "administrator": "Efficiency Arizona",
  "note": "Up to $8,000; no gas-to-electric swaps from Sept 1, 2026",
  "weatherizationDollars": 2437532,
  "aceeeRank": 29,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Arkansas",
  "abbr": "AR",
  "rebateAllocationMillions": 105,
  "rebateStatus": "Not launched",
  "administrator": "Arkansas Energy Office",
  "note": "Not available at this time",
  "weatherizationDollars": 2838513,
  "aceeeRank": 32,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "California",
  "abbr": "CA",
  "rebateAllocationMillions": 582,
  "rebateStatus": "Waitlist only",
  "administrator": "California Energy Commission",
  "note": "Single-family funds fully reserved Feb 24, 2026",
  "weatherizationDollars": 9034263,
  "aceeeRank": 1,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Colorado",
  "abbr": "CO",
  "rebateAllocationMillions": 140,
  "rebateStatus": "Closed",
  "administrator": "Colorado Energy Office",
  "note": "Region 1 closed Apr 27, 2026; Region 2 closed Aug 1, 2026",
  "weatherizationDollars": 6685109,
  "aceeeRank": 7,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Connecticut",
  "abbr": "CT",
  "rebateAllocationMillions": 99,
  "rebateStatus": "Not launched",
  "administrator": "DEEP",
  "note": "Pending DOE approval",
  "weatherizationDollars": 3682099,
  "aceeeRank": 13,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Delaware",
  "abbr": "DE",
  "rebateAllocationMillions": 66,
  "rebateStatus": "Not launched",
  "administrator": "DNREC",
  "note": "Source page last updated Oct 2024",
  "weatherizationDollars": 785428,
  "aceeeRank": 19,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "District of Columbia",
  "abbr": "DC",
  "rebateAllocationMillions": 59,
  "rebateStatus": "Open",
  "administrator": "Not named",
  "note": "Launched per the Sept 2025 tracker; not in the Oct 2026 status list",
  "weatherizationDollars": 755171,
  "aceeeRank": 12,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Florida",
  "abbr": "FL",
  "rebateAllocationMillions": 346,
  "rebateStatus": "Not launched",
  "administrator": "FDACS",
  "note": "No date; HEAR page offline",
  "weatherizationDollars": 3521305,
  "aceeeRank": 27,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Georgia",
  "abbr": "GA",
  "rebateAllocationMillions": 219,
  "rebateStatus": "Closed",
  "administrator": "GEFA",
  "note": "New HEAR applications stopped Aug 14, 2026",
  "weatherizationDollars": 5022550,
  "aceeeRank": 34,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Hawaii",
  "abbr": "HI",
  "rebateAllocationMillions": 70,
  "rebateStatus": "Not launched",
  "administrator": "HSEO",
  "note": "Expected early 2027",
  "weatherizationDollars": 317619,
  "aceeeRank": 16,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Idaho",
  "abbr": "ID",
  "rebateAllocationMillions": null,
  "rebateStatus": "Not launched",
  "administrator": "OEMR",
  "note": "Legislature rejected funding Mar 19, 2025",
  "weatherizationDollars": 2573714,
  "aceeeRank": 33,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Illinois",
  "abbr": "IL",
  "rebateAllocationMillions": 264,
  "rebateStatus": "Not launched",
  "administrator": "Illinois EPA",
  "note": "HEAR application not yet processed by DOE",
  "weatherizationDollars": 16902995,
  "aceeeRank": 15,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Indiana",
  "abbr": "IN",
  "rebateAllocationMillions": 182,
  "rebateStatus": "Open",
  "administrator": "Indiana Energy Saver",
  "note": "Up to $8,000 (at or below 150% area median income)",
  "weatherizationDollars": 9174538,
  "aceeeRank": 31,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Iowa",
  "abbr": "IA",
  "rebateAllocationMillions": 121,
  "rebateStatus": "Not launched",
  "administrator": "Not named",
  "note": "Source page last updated Jan 2025",
  "weatherizationDollars": 6145581,
  "aceeeRank": 38,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Kansas",
  "abbr": "KS",
  "rebateAllocationMillions": 106,
  "rebateStatus": "Not launched",
  "administrator": "Kansas Energy Office",
  "note": "Listed as coming soon",
  "weatherizationDollars": 3294377,
  "aceeeRank": 48,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Kentucky",
  "abbr": "KY",
  "rebateAllocationMillions": 134,
  "rebateStatus": "Not launched",
  "administrator": "Not named",
  "note": "Awaiting DOE approval",
  "weatherizationDollars": 6015375,
  "aceeeRank": 43,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Louisiana",
  "abbr": "LA",
  "rebateAllocationMillions": 213,
  "rebateStatus": "Not launched",
  "administrator": "LDENR",
  "note": "No launch date",
  "weatherizationDollars": 2185239,
  "aceeeRank": 37,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Maine",
  "abbr": "ME",
  "rebateAllocationMillions": 72,
  "rebateStatus": "Open with limits",
  "administrator": "Efficiency Maine",
  "note": "Single-family not offered; $13,900 for ducted heat pumps in designated mobile homes; claims due Dec 31, 2026",
  "weatherizationDollars": 3836304,
  "aceeeRank": 11,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Maryland",
  "abbr": "MD",
  "rebateAllocationMillions": 137,
  "rebateStatus": "Not launched",
  "administrator": "Not named",
  "note": "Conditional DOE approval only",
  "weatherizationDollars": 3517313,
  "aceeeRank": 4,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Massachusetts",
  "abbr": "MA",
  "rebateAllocationMillions": 146,
  "rebateStatus": "Not launched",
  "administrator": "DOER / Mass Save",
  "note": "Folded into the income-eligible pathway",
  "weatherizationDollars": 8501659,
  "aceeeRank": 2,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Michigan",
  "abbr": "MI",
  "rebateAllocationMillions": 211,
  "rebateStatus": "Open with limits",
  "administrator": "EGLE (MiHER)",
  "note": "Up to $8,000; EGLE paused new income-qualified approvals in the Detroit district (Aug 20, 2026 notice) because single-family funding is nearly used up; one guide says five districts",
  "weatherizationDollars": 20688033,
  "aceeeRank": 17,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Minnesota",
  "abbr": "MN",
  "rebateAllocationMillions": 148,
  "rebateStatus": "Not launched",
  "administrator": "Commerce",
  "note": "A $4,000 companion state rebate is blocked (update June 12, 2026)",
  "weatherizationDollars": 11924449,
  "aceeeRank": 10,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Mississippi",
  "abbr": "MS",
  "rebateAllocationMillions": 105,
  "rebateStatus": "Not launched",
  "administrator": "MDA",
  "note": "No portal, amounts or date",
  "weatherizationDollars": 2268706,
  "aceeeRank": 49,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Missouri",
  "abbr": "MO",
  "rebateAllocationMillions": 151,
  "rebateStatus": "Not launched",
  "administrator": "DNR",
  "note": "Vendor picked Aug 2026; awaiting federal approval",
  "weatherizationDollars": 7897214,
  "aceeeRank": 38,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Montana",
  "abbr": "MT",
  "rebateAllocationMillions": 71,
  "rebateStatus": "Not launched",
  "administrator": "DEQ",
  "note": "Utility and co-op programs only",
  "weatherizationDollars": 3079803,
  "aceeeRank": 30,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Nebraska",
  "abbr": "NE",
  "rebateAllocationMillions": 91,
  "rebateStatus": "Not launched",
  "administrator": "DWEE",
  "note": "Preparing application",
  "weatherizationDollars": 3043098,
  "aceeeRank": 44,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Nevada",
  "abbr": "NV",
  "rebateAllocationMillions": 96,
  "rebateStatus": "Not launched",
  "administrator": "GOE",
  "note": "$47.9M HEAR allocation pending federal review",
  "weatherizationDollars": 1387409,
  "aceeeRank": 23,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "New Hampshire",
  "abbr": "NH",
  "rebateAllocationMillions": 70,
  "rebateStatus": "Not launched",
  "administrator": "NH Department of Energy",
  "note": "Up to $8,000 planned; projects started before launch will not qualify",
  "weatherizationDollars": 1936926,
  "aceeeRank": 18,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "New Jersey",
  "abbr": "NJ",
  "rebateAllocationMillions": 183,
  "rebateStatus": "Not launched",
  "administrator": "BPU / NJCEP",
  "note": "No HEAR announcement",
  "weatherizationDollars": 6717777,
  "aceeeRank": 8,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "New Mexico",
  "abbr": "NM",
  "rebateAllocationMillions": 88,
  "rebateStatus": "Open",
  "administrator": "EMNRD",
  "note": "Up to $8,000 (at or below 80% area median income); launched Sept 2024",
  "weatherizationDollars": 2464558,
  "aceeeRank": 21,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "New York",
  "abbr": "NY",
  "rebateAllocationMillions": 318,
  "rebateStatus": "Open with limits",
  "administrator": "NYSERDA",
  "note": "EmPower+ $12,000 to $14,000 base plus add-ons; HEAR currently funds air sealing and insulation",
  "weatherizationDollars": 26370816,
  "aceeeRank": 3,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "North Carolina",
  "abbr": "NC",
  "rebateAllocationMillions": 209,
  "rebateStatus": "Open with limits",
  "administrator": "Energy Saver NC",
  "note": "Up to $8,000; fuel conversions excluded from Sept 1, 2026",
  "weatherizationDollars": 6196024,
  "aceeeRank": 26,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "North Dakota",
  "abbr": "ND",
  "rebateAllocationMillions": 74,
  "rebateStatus": "Not launched",
  "administrator": "Commerce",
  "note": "No estimated date",
  "weatherizationDollars": 2901306,
  "aceeeRank": 45,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Ohio",
  "abbr": "OH",
  "rebateAllocationMillions": 249,
  "rebateStatus": "Not launched",
  "administrator": "Department of Development",
  "note": "Up to $8,000 expected; awaiting DOE approval",
  "weatherizationDollars": 17341259,
  "aceeeRank": 40,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Oklahoma",
  "abbr": "OK",
  "rebateAllocationMillions": 129,
  "rebateStatus": "Not launched",
  "administrator": "Oklahoma State Energy Office",
  "note": "No launch date posted",
  "weatherizationDollars": 3526186,
  "aceeeRank": 34,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Oregon",
  "abbr": "OR",
  "rebateAllocationMillions": 114,
  "rebateStatus": "Not launched",
  "administrator": "ODOE",
  "note": "Contractor enrollment opens Oct 12, 2026; retail coupons planned for 2027",
  "weatherizationDollars": 3884558,
  "aceeeRank": 9,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Pennsylvania",
  "abbr": "PA",
  "rebateAllocationMillions": 259,
  "rebateStatus": "Not launched",
  "administrator": "DEP (Penn Energy Savers)",
  "note": "Awaiting final DOE approval",
  "weatherizationDollars": 18685058,
  "aceeeRank": 22,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Rhode Island",
  "abbr": "RI",
  "rebateAllocationMillions": 64,
  "rebateStatus": "Open with limits",
  "administrator": "Not named",
  "note": "Covers no heat pumps; appliance rebates require replacing electric equipment",
  "weatherizationDollars": 1546915,
  "aceeeRank": 13,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "South Carolina",
  "abbr": "SC",
  "rebateAllocationMillions": 137,
  "rebateStatus": "Not launched",
  "administrator": "Not named",
  "note": "Expected statewide in 2026",
  "weatherizationDollars": 2757967,
  "aceeeRank": 40,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "South Dakota",
  "abbr": "SD",
  "rebateAllocationMillions": null,
  "rebateStatus": "Not launched",
  "administrator": "Not named",
  "note": "Declined about $69M allocation in Aug 2024",
  "weatherizationDollars": 2253867,
  "aceeeRank": 47,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Tennessee",
  "abbr": "TN",
  "rebateAllocationMillions": 167,
  "rebateStatus": "Not launched",
  "administrator": "TVA (implementer)",
  "note": "Conditional DOE approval; no date",
  "weatherizationDollars": 5907711,
  "aceeeRank": 28,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Texas",
  "abbr": "TX",
  "rebateAllocationMillions": 690,
  "rebateStatus": "Not launched",
  "administrator": "SECO",
  "note": "Planning and design phase",
  "weatherizationDollars": 8354422,
  "aceeeRank": 36,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Utah",
  "abbr": "UT",
  "rebateAllocationMillions": 101,
  "rebateStatus": "Not launched",
  "administrator": "Office of Energy Development",
  "note": "On hold; DOE has not approved the application",
  "weatherizationDollars": 2745820,
  "aceeeRank": 23,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Vermont",
  "abbr": "VT",
  "rebateAllocationMillions": 59,
  "rebateStatus": "Not launched",
  "administrator": "Public Service Department",
  "note": "Source advises not to plan on HEAR funds ($29.2M allocation cited)",
  "weatherizationDollars": 1656920,
  "aceeeRank": 4,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Virginia",
  "abbr": "VA",
  "rebateAllocationMillions": 189,
  "rebateStatus": "Not launched",
  "administrator": "Virginia Energy",
  "note": "Updating documents per May 29, 2026 DOE guidance",
  "weatherizationDollars": 5649553,
  "aceeeRank": 20,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Washington",
  "abbr": "WA",
  "rebateAllocationMillions": 166,
  "rebateStatus": "Not launched",
  "administrator": "Commerce",
  "note": "Awaiting DOE approval; not retroactive",
  "weatherizationDollars": 5869814,
  "aceeeRank": 6,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "West Virginia",
  "abbr": "WV",
  "rebateAllocationMillions": 88,
  "rebateStatus": "Waitlist only",
  "administrator": "Neighborly (via energywv.org)",
  "note": "Up to $8,000; limited pilot; fuel switching barred",
  "weatherizationDollars": 4052080,
  "aceeeRank": 45,
  "namedInSolarForAllSuit": false
 },
 {
  "name": "Wisconsin",
  "abbr": "WI",
  "rebateAllocationMillions": 149,
  "rebateStatus": "Open with limits",
  "administrator": "Focus on Energy",
  "note": "Up to $8,000; fossil-fuel replacement coupons stopped Sept 1, 2026",
  "weatherizationDollars": 10757379,
  "aceeeRank": 25,
  "namedInSolarForAllSuit": true
 },
 {
  "name": "Wyoming",
  "abbr": "WY",
  "rebateAllocationMillions": 69,
  "rebateStatus": "Not launched",
  "administrator": "WEA",
  "note": "About $69M recommitted June 2026; no launch date",
  "weatherizationDollars": 1486898,
  "aceeeRank": 51,
  "namedInSolarForAllSuit": false
 }
];


export const records: RegistryRecord[] = [
 {
  "id": "VPP-001",
  "category": "VPP",
  "name": "Green Mountain Power Virtual Power Plant",
  "operator": "Green Mountain Power",
  "state": "VT",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "Batteries",
   "EVs",
   "Commercial flexible load",
   "Utility-scale storage"
  ],
  "businessModel": "Lease / BYOD",
  "scale": "110 MW total (Jul 2026), 53 MW from home batteries",
  "mw": 110,
  "timing": "Home battery lease program is state-approved and tariffed",
  "summary": "Home batteries, utility-scale storage, EV chargers, commercial buildings in a flexible load program, and hydro plants dispatched together as one resource. GMP says it is the largest single power resource in Vermont by capacity.",
  "outcomes": "GMP dispatched 90 MW during an early-July 2026 heat wave and estimates it avoided about $6M in peak costs for all customers, after about $11M the year before. Reporting says peaker plants in Vergennes and Rutland have been permanently shut down, and GMP says it plans to retire more.",
  "modelNote": "First US utility with a state-approved tariffed home battery lease program. Customers can also buy a compatible battery under a Bring Your Own Device program for an upfront incentive. Savings flow to all customers through lower purchased power costs.",
  "risks": [
   "Self-reported results"
  ],
  "riskNote": null,
  "confidence": "High",
  "categoryFields": [],
  "sources": [
   {
    "title": "GMP release: stored energy network delivers $6M in savings",
    "url": "https://gmpsnapshot.greenmountainpower.com/news/gmps-growing-stored-energy-network-delivers-6m-in-savings-during-july-heat-wave/"
   },
   {
    "title": "Electrek: Vermont's largest energy source is now a VPP",
    "url": "https://electrek.co/2026/07/28/vermonts-largest-energy-source-is-now-a-virtual-power-plant/"
   },
   {
    "title": "The Cool Down summary (peaker closures)",
    "url": "https://www.thecooldown.com/?p=749611"
   }
  ]
 },
 {
  "id": "VPP-002",
  "category": "VPP",
  "name": "Resilient Neighborhood 2.0 Innovative Pilot",
  "operator": "Green Mountain Power",
  "state": "VT",
  "utilityType": "Investor-owned",
  "status": "Proposed",
  "technologies": [
   "Batteries"
  ],
  "businessModel": "Utility-run program",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Notice filed Jan 2026",
  "summary": "A second-generation pilot that builds on GMP's existing Resilient Neighborhood Innovative Pilot. GMP filed notice in January 2026.",
  "outcomes": "No results reported yet.",
  "modelNote": "Filed as an innovative pilot with the Vermont regulator.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "SEPA / NCCETC: VPP policy developments, Q1 2026",
    "url": "https://sepapower.org/knowledge/vpp-and-supporting-der-policy-developments-q1-2026/"
   }
  ]
 },
 {
  "id": "VPP-003",
  "category": "VPP",
  "name": "ConnectedSolutions",
  "operator": "National Grid",
  "state": "MA, NY",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "Thermostats",
   "Batteries",
   "C&I demand response"
  ],
  "businessModel": "Utility-run program",
  "scale": "227 MW (RMI) to 250 MW (DOE 2025 update)",
  "mw": 250,
  "timing": "Launched 2016 in Massachusetts",
  "summary": "Residential thermostats, residential batteries, and commercial and industrial demand response aggregated for peak shaving in Massachusetts and New York.",
  "outcomes": "DOE cites it as an example of rapid utility-led deployment, saying it launched in under four months and now has 250 MW of peak shaving capacity in MA and NY. RMI puts it at 227 MW. The figures differ by source and date.",
  "modelNote": "Customer incentive program run by the utility across several device types.",
  "risks": [
   "Self-reported results"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "RMI: Grid-scale virtual power plants are here",
    "url": "https://rmi.org/resources/grid-scale-virtual-power-plants-are-here-have-utilities-noticed/"
   },
   {
    "title": "DOE Liftoff: Virtual Power Plants 2025 update",
    "url": "https://www.smartenergydecisions.com/wp-content/uploads/2025/04/liftoff_doe_virtualpowerplants2025update.pdf"
   }
  ]
 },
 {
  "id": "VPP-004",
  "category": "VPP",
  "name": "CalReady (Demand Side Grid Support)",
  "operator": "Sunrun, in the California Energy Commission DSGS program",
  "state": "CA",
  "utilityType": "State program / aggregator",
  "status": "Operating",
  "technologies": [
   "Batteries",
   "Solar + storage"
  ],
  "businessModel": "Aggregator-led",
  "scale": "425 MW peak dispatchable (Jul 2026), 110,000+ batteries",
  "mw": 425,
  "timing": "2024",
  "summary": "Sunrun-aggregated home batteries enrolled in the state's Demand Side Grid Support program, available 4 to 9 p.m. from May through October.",
  "outcomes": "2024: 16,000+ households, 48 MW average and 54 MW peak. 2025: about 75,000 batteries and up to 375 MW expected. July 2026: 80,000+ households and 110,000+ batteries. Sunrun and Tesla report a record 580 MW from 140,000+ batteries on Sept. 9, 2026 (company-reported).",
  "modelNote": "Customers could earn up to $150 per battery for events capped at 35 days per year between May and October, with events lasting no more than two hours (2025 terms). Sunrun customers were expected to share nearly $10M in 2025.",
  "risks": [
   "Funding / policy",
   "Self-reported results",
   "Vendor concentration"
  ],
  "riskNote": "RMI's affordability toolkit links to Utility Dive coverage titled 'California zeroes out funding for largest virtual power plant'. Current 2026 funding status was not verified in this pass.",
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "Sunrun release: CalReady quadruples in size (May 2025)",
    "url": "https://investors.sunrun.com/news-events/press-releases/detail/340/sunruns-distributed-power-plant-quadruples-in-size-to"
   },
   {
    "title": "Energy-Storage.news: Sunrun expands to 425 MW",
    "url": "https://www.energy-storage.news/sunrun-franklinwh-expand-bess-virtual-power-plant-capacity-in-california-texas/"
   },
   {
    "title": "Stocktwits: 580 MW Sept. 9 event",
    "url": "https://stocktwits.com/news-articles/markets/equity/tsla-run-stocks-in-focus-580-mw-heat-wave-battery-drop-lifts-tesla-and-sunrun-despite-2026-losses/cZMRFjNRBIh"
   },
   {
    "title": "RMI Electricity Affordability Toolkit: VPPs",
    "url": "https://affordability-toolkit.rmi.org/pdfs/virtual-power-plants.pdf"
   }
  ]
 },
 {
  "id": "VPP-005",
  "category": "VPP",
  "name": "Battery Emergency Demand Response Program",
  "operator": "LUMA Energy (PREPA), with Tesla and Sunrun as aggregators",
  "state": "PR",
  "utilityType": "Territory utility",
  "status": "Pilot",
  "technologies": [
   "Batteries"
  ],
  "businessModel": "Emergency DR",
  "scale": "About 48 MW from about 70,000 batteries in one reported dispatch",
  "mw": 48,
  "timing": "Announced 2023",
  "summary": "A pilot that lets aggregators dispatch customer batteries during grid emergencies and peak periods, to reduce load shedding on the island.",
  "outcomes": "LUMA reported dispatching about 70,000 batteries for around 48 MW, roughly a gas peaker's output with no fuel (reported 2025). The original pilot aimed to enroll 6,500 customers for about 26 MW. Tesla's program paid $1 per kWh supplied during events, as described at launch.",
  "modelNote": "Customers set their own backup reserve level. The utility accepts or rejects applicants at its discretion, and customers can enroll with only one aggregator.",
  "risks": [
   "Customer reserve limits",
   "Self-reported results"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "Virginia Mercury: Puerto Rico customers help keep the lights on",
    "url": "https://virginiamercury.com/2025/09/02/in-puerto-rico-customers-are-helping-to-keep-the-lights-on-could-a-virginia-program-do-the-same/"
   },
   {
    "title": "Latitude Media: Puerto Rico uses home batteries to back up its grid",
    "url": "https://www.latitudemedia.com/news/puerto-rico-is-using-residents-home-batteries-to-back-up-its-grid/"
   },
   {
    "title": "Tesla: VPP in Puerto Rico (program terms)",
    "url": "https://www.tesla.com/en_pr/support/energy/virtual-power-plant/puerto-rico"
   }
  ]
 },
 {
  "id": "VPP-006",
  "category": "VPP",
  "name": "Power Partner (thermostats, EVs, EV fleets)",
  "operator": "Austin Energy",
  "state": "TX",
  "utilityType": "Public power (municipal)",
  "status": "Operating",
  "technologies": [
   "Thermostats",
   "EVs",
   "Multi-DER"
  ],
  "businessModel": "Utility-run program",
  "scale": "57+ MW flexible capacity",
  "mw": 57,
  "timing": "Thermostat program has run several years",
  "summary": "Multi-device VPP of smart thermostats, residential EV charging, and EV fleets, managed on the EnergyHub Edge DERMS platform.",
  "outcomes": "About 38,000 thermostats are connected. The utility's plan targets 78 MW of demand response by 2027 and 270 MW by 2035.",
  "modelNote": "Customers enroll through a single streamlined microsite shared with the battery pilot.",
  "risks": [
   "Self-reported results"
  ],
  "riskNote": null,
  "confidence": "High",
  "categoryFields": [],
  "sources": [
   {
    "title": "EnergyHub: Austin Energy expands multi-DER VPP",
    "url": "https://www.energyhub.com/news/austin-energy-partners-with-energyhub-to-expand-multi-der-vpp-with-launch-of-power-partner-battery-pilot-program"
   },
   {
    "title": "Community Impact (sponsored): Austin Energy home battery program",
    "url": "https://communityimpact.com/sponsored/austin-energy-launches-home-battery-program-to-reduce-grid-stress-energy-costs/"
   }
  ]
 },
 {
  "id": "VPP-007",
  "category": "VPP",
  "name": "Power Partner Battery Pilot",
  "operator": "Austin Energy",
  "state": "TX",
  "utilityType": "Public power (municipal)",
  "status": "Pilot",
  "technologies": [
   "Batteries"
  ],
  "businessModel": "Utility-run program",
  "scale": "Pilot capped at 1,500 systems",
  "mw": null,
  "timing": "Launched Mar 24, 2026",
  "summary": "A Bring Your Own Battery demand response pilot that pays customers to let the utility use stored energy during peak demand.",
  "outcomes": "A sponsored article reports 100+ customers and 165 batteries enrolled by mid-2026. Austin Energy also has an agreement with local startup Base Power for up to 40 MW of distributed residential batteries (as reported by Public Power via Hoodline).",
  "modelNote": "$500 upfront rebate for recent installations plus performance payments, averaging above $300 per year per the utility. EnergyHub cites $75 per kW-year. Tesla, FranklinWH, SolarEdge, and Enphase are the initial eligible vendors.",
  "risks": [
   "Scale cap",
   "Vendor concentration"
  ],
  "riskNote": null,
  "confidence": "High",
  "categoryFields": [],
  "sources": [
   {
    "title": "Austin Energy release: Power Partner Battery Pilot",
    "url": "https://austinenergy.com/about/news/news-releases/2026/Austin-Energy-launches-innovative-Power-Partner-Battery-Pilot-program"
   },
   {
    "title": "Solar Builder: Texas utilities tap FranklinWH",
    "url": "https://solarbuildermag.com/energy-storage/texas-taps-franklinwh-for-two-new-vpp-programs/"
   },
   {
    "title": "Hoodline: Austin batteries join the grid",
    "url": "https://hoodline.com/2026/07/cash-for-kilowatts-austin-home-batteries-join-the-grid-lifeline/"
   }
  ]
 },
 {
  "id": "VPP-008",
  "category": "VPP",
  "name": "Battery Storage Solutions Program",
  "operator": "Entergy Texas",
  "state": "TX",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "Batteries"
  ],
  "businessModel": "Utility-run program",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Vendor selection announced Jul 2026",
  "summary": "A residential battery demand response program. FranklinWH was selected as an eligible system in July 2026, and Tesla batteries are also eligible.",
  "outcomes": "Customers can earn up to $325 per year. No enrollment or dispatch results found.",
  "modelNote": "Customers manage their system through the vendor app.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "Solar Builder: Texas utilities tap FranklinWH",
    "url": "https://solarbuildermag.com/energy-storage/texas-taps-franklinwh-for-two-new-vpp-programs/"
   }
  ]
 },
 {
  "id": "VPP-009",
  "category": "VPP",
  "name": "Tesla VPP in ERCOT ADER Pilot",
  "operator": "Guadalupe Valley Electric Cooperative",
  "state": "TX",
  "utilityType": "Cooperative",
  "status": "Operating",
  "technologies": [
   "Batteries"
  ],
  "businessModel": "Wholesale market",
  "scale": "130,000+ customers served; ERCOT ADER has about 17 MW registered across all participants",
  "mw": null,
  "timing": "Date not shown in source",
  "summary": "First Texas co-op to join ERCOT's Aggregated Distributed Energy Resource pilot with Tesla as a utility-scale VPP resource.",
  "outcomes": "Members receive an upfront rebate on registering in the Peak-Time Payback program and an annual rebate each year they participate. The co-op presents it as a new revenue stream for the member-owned co-op. In a CoBank interview, GVEC said it set a 2 MW battery target for the year and reached about 2.7 MW, with rebates of $220 per kW upfront and $75 per kW a year, and a long-term goal of offsetting 75% to 100% of its 10 to 20 MW ancillary service obligations to ERCOT. Participant count was not given.",
  "modelNote": "Co-op resource aggregated by Tesla and bid into the ERCOT pilot. The co-op also runs a long-standing commercial and industrial demand response program.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "Renewable Energy World: Texas co-op teams up with Tesla",
    "url": "https://www.renewableenergyworld.com/news/texas-electric-co-op-teams-up-with-tesla-for-utility-scale-virtual-power-plant/"
   },
   {
    "title": "CoBank Power Plays: How a Texas co-op is increasing reliability",
    "url": "https://www.cobank.com/podcast/power-plays/how-a-texas-co-op-is-increasing-reliability-with-its-virtual-power-plant"
   }
  ]
 },
 {
  "id": "VPP-010",
  "category": "VPP",
  "name": "Bandera Electric VPP",
  "operator": "Bandera Electric Cooperative",
  "state": "TX",
  "utilityType": "Cooperative",
  "status": "Operating",
  "technologies": [
   "Batteries",
   "Thermostats",
   "EVs"
  ],
  "businessModel": "Wholesale market",
  "scale": "0.5 MW called; target up to 1 MW by year-end, up to 6 MW eventually",
  "mw": 0.5,
  "timing": "Qualified with ERCOT on Aug. 20 (year not shown in source)",
  "summary": "A co-op-built platform aggregating behind-the-meter resources, qualified to sell into ERCOT's real-time wholesale market. Described as the first co-op to do so.",
  "outcomes": "At the time of reporting, 26 participants from the residential battery lease program had joined, and the VPP had been called on for half a megawatt. The co-op expects to enroll rooftop solar, thermostats, EVs, and pool pumps.",
  "modelNote": "ERCOT treats the VPP like a generating resource, so the co-op must be able to control load as it would a plant.",
  "risks": [
   "Scale cap",
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "NRECA: Texas co-op makes history as VPP enters wholesale market",
    "url": "https://www.cooperative.com/news/Pages/Texas-Co-op-Makes-History-as-Virtual-Power-Plant-Enters-Wholesale-Power-Market.aspx"
   }
  ]
 },
 {
  "id": "VPP-011",
  "category": "VPP",
  "name": "Aggregated Distributed Energy Resource (ADER) Pilot",
  "operator": "ERCOT",
  "state": "TX",
  "utilityType": "Grid operator",
  "status": "Pilot",
  "technologies": [
   "Batteries",
   "Multi-DER"
  ],
  "businessModel": "Wholesale market",
  "scale": "About 17 MW registered",
  "mw": 17,
  "timing": "Phase 1 began 2023 with two VPPs",
  "summary": "ERCOT's pilot letting aggregations of small distributed resources participate in the wholesale market. It is the venue for the Texas co-op VPPs above.",
  "outcomes": "About 17 MW of generation registered from companies such as Tesla using residential batteries.",
  "modelNote": "Wholesale market participation through aggregators.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "Renewable Energy World: Texas co-op teams up with Tesla",
    "url": "https://www.renewableenergyworld.com/news/texas-electric-co-op-teams-up-with-tesla-for-utility-scale-virtual-power-plant/"
   }
  ]
 },
 {
  "id": "VPP-012",
  "category": "VPP",
  "name": "Vermont Electric Cooperative VPP",
  "operator": "Vermont Electric Cooperative",
  "state": "VT",
  "utilityType": "Cooperative",
  "status": "In development",
  "technologies": [
   "EVs",
   "Batteries",
   "Distributed solar"
  ],
  "businessModel": "Utility-run program",
  "scale": "33,000 members; about 50 MW of distributed generation on system",
  "mw": null,
  "timing": "Date not shown in source",
  "summary": "A co-op building a VPP across fast-growing distributed generation, EVs, and batteries, with a DERMS named as a final piece.",
  "outcomes": "The EV flexible load program gives a bill credit to members who skip charging during demand peaks, using a co-op-provided charger that receives the signal. About 250 EVs were on the system, a number that was doubling every year.",
  "modelNote": "Utility-run bill credits with a co-op-supplied charger.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "NRECA Tech Insights: Virtual power plant in Vermont",
    "url": "https://www.cooperative.com/remagazine/articles/Pages/Tech-Insights-Virtual-Power-Plant-in-Vermont.aspx"
   }
  ]
 },
 {
  "id": "VPP-013",
  "category": "VPP",
  "name": "Renewable Battery Connect",
  "operator": "Xcel Energy (Public Service Co. of Colorado)",
  "state": "CO",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "Batteries"
  ],
  "businessModel": "Utility-run program",
  "scale": "About 10 MW enrolled, about 1,000 customers (Feb 2025)",
  "mw": 10,
  "timing": "Expanded in 2024 to 2025",
  "summary": "A battery program where Xcel manages customer batteries during peak demand. Itron's aggregator DERMS and Tesla Powerwall were announced as part of the build-out.",
  "outcomes": "Xcel dispatches the batteries up to 60 times per year. About 13 MW of additional distributed battery capacity was in the interconnection queue.",
  "modelNote": "Upfront incentive reported as more generous than comparable programs in Puerto Rico and Nova Scotia.",
  "risks": [
   "Schedule risk"
  ],
  "riskNote": "Xcel earlier expressed doubts about its ability to roll out a 50 MW VPP pilot by the October 2024 date in a regulator's recommended order.",
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "Utility Dive: Enphase VPP in Colorado",
    "url": "https://www.utilitydive.com/news/enphase-vpp-colorado-xcel-energy-battery-connect/739834/"
   },
   {
    "title": "Kurrant: Xcel partners with Itron and Tesla",
    "url": "https://kurrant.com/kurrantly-news/xcel-energy-partners-with-itron-and-tesla-for-colorado-virtual-power-plant/"
   }
  ]
 },
 {
  "id": "VPP-014",
  "category": "VPP",
  "name": "Aggregator Virtual Power Plant Program",
  "operator": "Xcel Energy (Public Service Co. of Colorado)",
  "state": "CO",
  "utilityType": "Investor-owned",
  "status": "Approved",
  "technologies": [
   "Batteries"
  ],
  "businessModel": "Aggregator-led",
  "scale": "125 MW program size",
  "mw": 125,
  "timing": "Approved 2025",
  "summary": "Approved aggregators combine distributed batteries and provide grid services. Aggregators manage enrollment, dispatch, customer compensation, and compliance.",
  "outcomes": "Colorado regulators approved the program in 2025. Compensation varies by aggregator and customer offer, so there is no single payment level.",
  "modelNote": "Standard-offer contract. Settlement terms reported in Q3 2025, before final approval: no methane, hydrogen, or front-of-the-meter DERs; each DER up to 750 kW; up to 2 MW per feeder and 5 MW per bank; 5 MW of the 125 MW competitively procured. Verify against the final order.",
  "risks": [
   "Evidence thin",
   "Schedule risk"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "NCCETC: States, utilities advance VPP programs in 2025",
    "url": "https://nccleantech.ncsu.edu/2026/01/29/states-utilities-advance-vpp-programs-plans-potential-in-2025-new-report/"
   },
   {
    "title": "SEPA / NCCETC: VPP policy, Q3 2025",
    "url": "https://sepapower.org/knowledge/vpp-der-policy-q3-2025/"
   },
   {
    "title": "Tigo: program summary",
    "url": "https://www.tigoenergy.com/bip/xcel-energy-aggregator-virtual-power-plant"
   }
  ]
 },
 {
  "id": "VPP-015",
  "category": "VPP",
  "name": "Capacity*Connect (Phase 2)",
  "operator": "Xcel Energy (Minnesota)",
  "state": "MN",
  "utilityType": "Investor-owned",
  "status": "Approved",
  "technologies": [
   "Utility-scale storage",
   "Batteries"
  ],
  "businessModel": "Utility-owned",
  "scale": "Up to 200 MW by end of 2028",
  "mw": 200,
  "timing": "Phase 2 approved 2026",
  "summary": "Utility-owned and operated, front-of-the-meter batteries of 1 to 3 MW each on the distribution system. This is VPP-adjacent: distributed storage rather than customer-owned devices.",
  "outcomes": "The Minnesota commission approved Phase 2. Separately, SEPA reports Minnesota approved a $430 million distributed battery program in Q1 2026.",
  "modelNote": "Rate-based utility ownership instead of customer incentives.",
  "risks": [
   "Regulatory approval",
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "SEPA / NCCETC: VPP policy developments, Q1 2026",
    "url": "https://sepapower.org/knowledge/vpp-and-supporting-der-policy-developments-q1-2026/"
   },
   {
    "title": "RMI: Grid-scale virtual power plants are here",
    "url": "https://rmi.org/resources/grid-scale-virtual-power-plants-are-here-have-utilities-noticed/"
   }
  ]
 },
 {
  "id": "VPP-016",
  "category": "VPP",
  "name": "Dominion Virginia VPP Pilot",
  "operator": "Dominion Energy Virginia",
  "state": "VA",
  "utilityType": "Investor-owned",
  "status": "Proposed",
  "technologies": [
   "Batteries",
   "Thermostats",
   "EVs",
   "School buses"
  ],
  "businessModel": "Utility-run program",
  "scale": "Up to 450 MW; pilot runs to July 1, 2028",
  "mw": 450,
  "timing": "Required by 2025 law (HB 2346)",
  "summary": "A 2025 Virginia law requires Dominion to propose a pilot aggregating up to 450 MW across regions. The proposal includes incentives for at least 15 MW of residential batteries and comprises almost a dozen programs.",
  "outcomes": "As of June 2026 reporting, State Corporation Commission approval was pending, with ramp-up planned after approval. After the pilot, the SCC is to evaluate it and develop a permanent program with procurement targets and performance metrics.",
  "modelNote": "Mandated pilot. A related 2026 bill (SB 487) would authorize electric cooperatives to run VPP programs; it had passed the Senate as of Feb 2026.",
  "risks": [
   "Regulatory approval"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "pv magazine USA: Virginia mandates Dominion VPP pilot",
    "url": "https://pv-magazine-usa.com/2025/05/16/virginia-mandates-dominion-energy-create-virtual-power-plant-pilot/"
   },
   {
    "title": "WVTF: VPPs will launch soon in Virginia",
    "url": "https://www.wvtf.org/2026-06-12/virtual-power-plants-will-launch-soon-in-virginia-heres-what-that-means"
   },
   {
    "title": "BillTrack50: HB 2346",
    "url": "https://www.billtrack50.com/billdetail/1768819/"
   }
  ]
 },
 {
  "id": "VPP-017",
  "category": "VPP",
  "name": "Solar-plus-Storage VPP Pilot and DERMS",
  "operator": "Georgia Power",
  "state": "GA",
  "utilityType": "Investor-owned",
  "status": "Approved",
  "technologies": [
   "Solar + storage"
  ],
  "businessModel": "Utility-run program",
  "scale": "50 MW pilot (25 MW customer-directed, 25 MW utility-directed)",
  "mw": 50,
  "timing": "Approved Jul 2025 in the IRP",
  "summary": "The Georgia PSC approved a customer-sited solar-plus-storage pilot for residential and small commercial customers, alongside a DERMS deployment.",
  "outcomes": "No dispatch results found. Georgia Power later agreed to modify the pilot, widening eligibility for larger systems and multifamily and nonprofit customers.",
  "modelNote": "One trade-site report lists $15/kW upfront plus $1.50/kWh performance for customer-directed, and $750 to $1,000/kW for utility-directed. This came from a low-quality source, so check the PSC order.",
  "risks": [
   "Eligibility limits",
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "NCCETC: States, utilities advance VPP programs in 2025",
    "url": "https://nccleantech.ncsu.edu/2026/01/29/states-utilities-advance-vpp-programs-plans-potential-in-2025-new-report/"
   },
   {
    "title": "SEPA / NCCETC: VPP policy, Q3 2025 (25/25 MW split)",
    "url": "https://sepapower.org/knowledge/vpp-der-policy-q3-2025/"
   },
   {
    "title": "pv magazine USA: Georgia Power modifies pilot",
    "url": "https://pv-magazine-usa.com/2025/07/24/georgia-power-agrees-to-give-community-solar-a-path-forward"
   },
   {
    "title": "Trade-site incentive figures (verify)",
    "url": "https://mgrid.org/?p=4825"
   }
  ]
 },
 {
  "id": "VPP-018",
  "category": "VPP",
  "name": "Bring Your Own Device Battery Pilot",
  "operator": "Arizona Public Service",
  "state": "AZ",
  "utilityType": "Investor-owned",
  "status": "Approved",
  "technologies": [
   "Batteries"
  ],
  "businessModel": "Utility-run program",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Approved Mar 2025",
  "summary": "The Arizona Corporation Commission approved APS's BYOD battery pilot in March 2025.",
  "outcomes": "No results found.",
  "modelNote": "Customer-owned batteries enrolled for utility dispatch.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "SEPA / NCCETC: Q1 2025 VPP policy updates",
    "url": "https://nccleantech.ncsu.edu/?p=12989"
   }
  ]
 },
 {
  "id": "VPP-019",
  "category": "VPP",
  "name": "Rider SDVPP (Scheduled Dispatch VPP)",
  "operator": "ComEd and Ameren Illinois",
  "state": "IL",
  "utilityType": "Investor-owned",
  "status": "Approved",
  "technologies": [
   "Batteries",
   "Thermostats"
  ],
  "businessModel": "Utility-run program",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Approved Jun 2026",
  "summary": "The Illinois Commerce Commission approved the tariffs in June 2026 under the Clean and Reliable Grid Affordability Act (S.B. 25). The programs offer a performance-based annual incentive.",
  "outcomes": "ComEd also proposed a Bring Your Own Device Load Reduction program in Feb 2026 for smart thermostats and thermal storage, with plans to fold it into a VPP later. That proposal was pending.",
  "modelNote": "Performance-based annual incentive.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "SEPA / NCCETC: VPP policy developments, Q2 2026",
    "url": "https://sepapower.org/knowledge/vpp-and-supporting-der-policy-developments-q2-2026/"
   },
   {
    "title": "DSIRE Insight: Q1 2026 update",
    "url": "https://www.dsireinsight.com/blog/2026/5/13/vpp-and-supporting-der-policy-developments-q1-2026"
   }
  ]
 },
 {
  "id": "VPP-020",
  "category": "VPP",
  "name": "DRIVE Act VPP and V2G Pilots",
  "operator": "BGE, Pepco, Delmarva Power, Potomac Edison",
  "state": "MD",
  "utilityType": "Investor-owned",
  "status": "Proposed",
  "technologies": [
   "Batteries",
   "EVs",
   "Thermostats"
  ],
  "businessModel": "Utility-run program",
  "scale": "Up to 440 MW across four utilities (BGE up to 188 MW, Pepco up to 185 MW)",
  "mw": 440,
  "timing": "DRIVE Act signed May 2024",
  "summary": "Two-year pilots mandated by the DRIVE Act that pay customers to let utilities adjust device use during peaks, including vehicle-to-grid.",
  "outcomes": "In Oct 2025 the PSC sent the VPP and V2G pilots back, agreeing the proposals targeted a small share of the Act's peak reduction goal and saying third-party aggregators have an important role. Revised proposals were filed, with hearings on April 7 and 8, 2026. The state's Office of People's Counsel argued BGE's plan to fold existing programs into the pilot is a poor fit for the DRIVE structure.",
  "modelNote": "Mandated pilots with utility-run incentives. BGE seeks cost recovery through a regulatory asset.",
  "risks": [
   "Regulatory approval",
   "Scale below target"
  ],
  "riskNote": null,
  "confidence": "High",
  "categoryFields": [],
  "sources": [
   {
    "title": "Maryland PSC: orders utilities to scale up DRIVE proposals",
    "url": "https://psc.maryland.gov/news/2025/psc-orders-utilities-to-scale-up-drive-act-proposals/"
   },
   {
    "title": "Utility Dive: Maryland regulators weigh flexible load proposals",
    "url": "https://utilitydive.com/news/maryland-regulators-weigh-investor-owned-utilities-flexible-load-proposals/817585/"
   },
   {
    "title": "BGE: DRIVE Act proposal",
    "url": "https://www.nacleanenergy.com/alternative-energies/bge-offers-solutions-to-modernize-and-strengthen-the-electric-grid"
   }
  ]
 },
 {
  "id": "VPP-021",
  "category": "VPP",
  "name": "Residential Battery VPP Pilot",
  "operator": "DTE Electric",
  "state": "MI",
  "utilityType": "Investor-owned",
  "status": "Proposed",
  "technologies": [
   "Batteries"
  ],
  "businessModel": "Utility-run program",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Proposed Jun 2026",
  "summary": "A proposed two-year pilot that would pay customers for using their existing battery systems for grid support.",
  "outcomes": "Proposed incentive is $105 per kW-year, with a maximum annual incentive of $504 per participant.",
  "modelNote": "Performance incentive for customer-owned batteries.",
  "risks": [
   "Regulatory approval"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "SEPA / NCCETC: VPP policy developments, Q2 2026",
    "url": "https://sepapower.org/knowledge/vpp-and-supporting-der-policy-developments-q2-2026/"
   }
  ]
 },
 {
  "id": "VPP-022",
  "category": "VPP",
  "name": "Solar Battery Savings Program",
  "operator": "San Diego Community Power",
  "state": "CA",
  "utilityType": "Community choice aggregator",
  "status": "Operating",
  "technologies": [
   "Batteries"
  ],
  "businessModel": "Utility-run program",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Date not shown in source",
  "summary": "Upfront, stackable incentives encourage residential battery adoption, with batteries dispatched daily.",
  "outcomes": "DOE's 2025 Liftoff update cites about $5M of Resource Adequacy savings.",
  "modelNote": "Upfront incentives plus daily dispatch.",
  "risks": [
   "Self-reported results"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "DOE Liftoff: Virtual Power Plants 2025 update",
    "url": "https://www.smartenergydecisions.com/wp-content/uploads/2025/04/liftoff_doe_virtualpowerplants2025update.pdf"
   }
  ]
 },
 {
  "id": "VPP-023",
  "category": "VPP",
  "name": "Flexible DER Portfolio",
  "operator": "United Power",
  "state": "CO",
  "utilityType": "Cooperative",
  "status": "Operating",
  "technologies": [
   "Multi-DER"
  ],
  "businessModel": "Utility-run program",
  "scale": "95 MW flexible DER capacity",
  "mw": 95,
  "timing": "Date not shown in source",
  "summary": "A cooperative using flexible distributed capacity and better grid visibility to manage its distribution system.",
  "outcomes": "DOE's 2025 update says United Power cut transformer outages from 25,000 minutes per year to near zero.",
  "modelNote": "Co-op operated.",
  "risks": [
   "Self-reported results"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "DOE Liftoff: Virtual Power Plants 2025 update",
    "url": "https://www.smartenergydecisions.com/wp-content/uploads/2025/04/liftoff_doe_virtualpowerplants2025update.pdf"
   }
  ]
 },
 {
  "id": "VPP-024",
  "category": "VPP",
  "name": "Demand Response Portfolio",
  "operator": "Otter Tail Power",
  "state": "MN",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "C&I demand response",
   "Thermostats"
  ],
  "businessModel": "Utility-run program",
  "scale": "Can reduce system peak by 15%",
  "mw": null,
  "timing": "Date not shown in source",
  "summary": "A portfolio of demand-side resources the DOE highlights as a utility case study.",
  "outcomes": "The utility can reduce its system peak demand by 15% through the portfolio, per the DOE update.",
  "modelNote": "Utility-run demand response.",
  "risks": [
   "Self-reported results"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "DOE Liftoff: Virtual Power Plants 2025 update",
    "url": "https://www.smartenergydecisions.com/wp-content/uploads/2025/04/liftoff_doe_virtualpowerplants2025update.pdf"
   }
  ]
 },
 {
  "id": "VPP-025",
  "category": "VPP",
  "name": "Richmond Virtual Power Plant",
  "operator": "MCE (community choice aggregator)",
  "state": "CA",
  "utilityType": "Community choice aggregator",
  "status": "Completed",
  "technologies": [
   "Batteries",
   "Multi-DER"
  ],
  "businessModel": "Aggregator-led",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "CEC EPIC project, report published 2026",
  "summary": "A community-focused VPP demonstration on rehabilitated affordable housing, funded by the California Energy Commission's EPIC program.",
  "outcomes": "A follow-on CEC grant would scale the Richmond VPP to MCE's entire service territory.",
  "modelNote": "Turnkey installation and financing in exchange for orchestrating the assets through a VPP.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "CEC report CEC-500-2026-013",
    "url": "https://www.energy.ca.gov/sites/default/files/2026-05/CEC-500-2026-013.pdf"
   }
  ]
 },
 {
  "id": "VPP-026",
  "category": "VPP",
  "name": "Affordability and Load Flexibility Portfolio",
  "operator": "Delmarva Power",
  "state": "DE",
  "utilityType": "Investor-owned",
  "status": "Proposed",
  "technologies": [
   "Multi-DER"
  ],
  "businessModel": "Utility-run program",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Proposed 2025",
  "summary": "A proposed portfolio of load flexibility offerings.",
  "outcomes": "No results yet.",
  "modelNote": "Details not captured in this pass.",
  "risks": [
   "Evidence thin",
   "Regulatory approval"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "NCCETC: States, utilities advance VPP programs in 2025",
    "url": "https://nccleantech.ncsu.edu/2026/01/29/states-utilities-advance-vpp-programs-plans-potential-in-2025-new-report/"
   }
  ]
 },
 {
  "id": "VPP-027",
  "category": "VPP",
  "name": "Demand Response and Battery Storage Proposals",
  "operator": "Entergy Louisiana and Entergy New Orleans",
  "state": "LA",
  "utilityType": "Investor-owned",
  "status": "Proposed",
  "technologies": [
   "Batteries",
   "C&I demand response"
  ],
  "businessModel": "Utility-run program",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Proposed 2025",
  "summary": "New demand response and battery storage programs proposed in Louisiana and New Orleans.",
  "outcomes": "No results yet. State trackers list related utility storage and DR dockets as decided or pending.",
  "modelNote": "Details not captured in this pass.",
  "risks": [
   "Evidence thin",
   "Regulatory approval"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [],
  "sources": [
   {
    "title": "NCCETC: States, utilities advance VPP programs in 2025",
    "url": "https://nccleantech.ncsu.edu/2026/01/29/states-utilities-advance-vpp-programs-plans-potential-in-2025-new-report/"
   }
  ]
 },
 {
  "id": "V2G-001",
  "category": "V2G",
  "name": "Beverly Public Schools bus V2G (ConnectedSolutions)",
  "operator": "National Grid, Highland Electric Fleets, Beverly Public Schools",
  "state": "MA",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "School bus",
   "Vehicle-to-grid",
   "Peak shaving"
  ],
  "businessModel": "Utility-run program",
  "scale": "1 bus",
  "mw": null,
  "timing": "Results reported for summers 2021 and 2022",
  "summary": "A single electric school bus that discharges to the grid during summer peak events under National Grid's ConnectedSolutions program. It is the most-cited early school bus V2G example in Massachusetts.",
  "outcomes": "The bus discharged about 10.8 MWh over summers 2021 and 2022 (MassCEC puts it at 10.78 MWh and $23,500 earned). Utility Dive (Sept 2026) cites nearly $12,000 per season, but Highland's CEO says about $6,000 per year is more typical in Massachusetts.",
  "modelNote": "Paid at $200 per kW delivered during summer peak events, roughly $6,000 per vehicle per year (WRI). Few events may not cover the cost of V2G equipment.",
  "risks": [
   "Payments may not cover equipment",
   "Single-bus evidence"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Electric school bus (1)"
   },
   {
    "label": "Direction",
    "value": "Export to grid"
   },
   {
    "label": "Compensation",
    "value": "$200 per kW delivered, summer peak events"
   }
  ],
  "sources": [
   {
    "title": "Utility Dive: Utilities, school districts see growing value in electric buses for VPPs (Sept 16, 2026)",
    "url": "https://www.utilitydive.com/news/utilities-school-districts-see-growing-value-in-electric-buses-for-vpp/830499/"
   },
   {
    "title": "WRI: Electric school bus V2G lessons and examples",
    "url": "https://www.wri.org/update/electric-school-bus-v2g-lessons-examples"
   },
   {
    "title": "Utility Dive: Massachusetts V2X demonstration",
    "url": "https://www.utilitydive.com/news/massachusetts-vehicle-to-everything-demonstration-hints-at-ev-batteries/821621/"
   }
  ]
 },
 {
  "id": "V2G-002",
  "category": "V2G",
  "name": "Massachusetts Vehicle-to-Everything Demonstration",
  "operator": "Massachusetts Clean Energy Center (MassCEC)",
  "state": "MA",
  "utilityType": "State program / aggregator",
  "status": "Pilot",
  "technologies": [
   "Light-duty EVs",
   "School bus",
   "Residential",
   "Vehicle-to-home"
  ],
  "businessModel": "State-funded demonstration",
  "scale": "About 70 to 80 chargers expected; 4 municipal, 5 school district and 45+ residential participants",
  "mw": null,
  "timing": "Two-year demonstration",
  "summary": "MassCEC installs bidirectional chargers at no cost for selected municipal, school and residential customers to test backup power, self-consumption and demand response from EV batteries.",
  "outcomes": "No kW or MW results are quantified. MassCEC says early school-district results 'show promise'. Utility Dive (Sept 2026) counts more than 20 buses in the state's V2G pilot plus other commercial and private light-duty vehicles. Counts differ by article and date.",
  "modelNote": "Funded from part of a $50M federal American Rescue Plan award. Compensation runs through National Grid's ConnectedSolutions: about $3,000 per summer for some light-duty vehicles and up to $12,000 per year for school buses, per a MassCEC case study.",
  "risks": [
   "Upfront cost",
   "Utilities still learning to dispatch",
   "Vehicle compatibility"
  ],
  "riskNote": "At a MassCEC workshop one utility raised concern about balancing its need for power against the owner's use of the battery during demand response events.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicles",
    "value": "F-150 Lightning, Nissan Leaf, Kia EV9, Volvo EX90, Polestar 3, five school bus models"
   },
   {
    "label": "Direction",
    "value": "Export to grid, backup power, self-consumption"
   },
   {
    "label": "Funding",
    "value": "Federal ARPA award, through state EV coordinating council"
   }
  ],
  "sources": [
   {
    "title": "Utility Dive: Massachusetts V2X demonstration hints at EV batteries",
    "url": "https://www.utilitydive.com/news/massachusetts-vehicle-to-everything-demonstration-hints-at-ev-batteries/821621/"
   },
   {
    "title": "Utility Dive: Utilities, school districts see growing value in electric buses for VPPs (Sept 16, 2026)",
    "url": "https://www.utilitydive.com/news/utilities-school-districts-see-growing-value-in-electric-buses-for-vpp/830499/"
   }
  ]
 },
 {
  "id": "V2G-003",
  "category": "V2G",
  "name": "Emergency Load Reduction Program: Oakland Unified buses",
  "operator": "PG&E, Zum, Oakland Unified School District",
  "state": "CA",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "School bus",
   "Vehicle-to-grid",
   "Emergency load reduction"
  ],
  "businessModel": "Emergency DR",
  "scale": "74 buses; more than 2 MW deployable",
  "mw": 2,
  "timing": "Not stated in sources",
  "summary": "A large school bus fleet that discharges in response to PG&E emergency load reduction events, with an hourly flexible pricing pilot alongside.",
  "outcomes": "74 buses with 150 kWh batteries and 30 kW chargers can deploy more than 2 MW in ELRP events (WRI). PG&E reports 2.1 GWh of annual discharge from the fleet (Utility Dive).",
  "modelNote": "PG&E describes it as the program with the most guaranteed revenue. WRI also lists a daily dynamic export rate. Scaling required extensive utility coordination and ISO 15118 compliance for vehicles and chargers.",
  "risks": [
   "Self-reported results"
  ],
  "riskNote": "WRI's table says 74 buses and its text says 'more than 70'.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Electric school buses, 150 kWh batteries"
   },
   {
    "label": "Chargers",
    "value": "30 kW bidirectional"
   },
   {
    "label": "Direction",
    "value": "Export to grid"
   },
   {
    "label": "Compensation",
    "value": "ELRP event payments; payment rate not stated here"
   }
  ],
  "sources": [
   {
    "title": "WRI: Electric school bus V2G lessons and examples",
    "url": "https://www.wri.org/update/electric-school-bus-v2g-lessons-examples"
   },
   {
    "title": "Utility Dive: Utilities, school districts see growing value in electric buses for VPPs (Sept 16, 2026)",
    "url": "https://www.utilitydive.com/news/utilities-school-districts-see-growing-value-in-electric-buses-for-vpp/830499/"
   }
  ]
 },
 {
  "id": "V2G-004",
  "category": "V2G",
  "name": "Zum San Francisco bus deployment",
  "operator": "PG&E, Zum",
  "state": "CA",
  "utilityType": "Investor-owned",
  "status": "In development",
  "technologies": [
   "School bus",
   "Vehicle-to-grid"
  ],
  "businessModel": "Planned grid-support deployment",
  "scale": "238 buses planned at three depots",
  "mw": null,
  "timing": "Planned over the next two school years (as of Sept 2026)",
  "summary": "A planned deployment of Zum buses at three San Francisco depots, targeted at high-need circuits.",
  "outcomes": "No results. The deployment is planned.",
  "modelNote": "Payment terms not stated.",
  "risks": [
   "Evidence thin",
   "Delivery unverified"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "School buses (238 planned)"
   },
   {
    "label": "Direction",
    "value": "Export to grid (planned)"
   }
  ],
  "sources": [
   {
    "title": "Utility Dive: Utilities, school districts see growing value in electric buses for VPPs (Sept 16, 2026)",
    "url": "https://www.utilitydive.com/news/utilities-school-districts-see-growing-value-in-electric-buses-for-vpp/830499/"
   }
  ]
 },
 {
  "id": "V2G-005",
  "category": "V2G",
  "name": "Fremont Unified School District V2G",
  "operator": "PG&E, The Mobility House, Fremont Unified School District",
  "state": "CA",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "School bus",
   "Vehicle-to-grid"
  ],
  "businessModel": "Aggregator-led",
  "scale": "4 of 14 owned buses providing V2G; 8 more on order",
  "mw": null,
  "timing": "Not stated in sources",
  "summary": "Buses discharge during PG&E's evening peak, managed by The Mobility House.",
  "outcomes": "Buses return around 4:30 p.m. at about 60% charge and can discharge for five to six hours. No energy or revenue figures are given.",
  "modelNote": "Aggregator-managed participation in PG&E's evening peak.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Electric school buses (4 providing V2G)"
   },
   {
    "label": "Direction",
    "value": "Export to grid, evening peak"
   }
  ],
  "sources": [
   {
    "title": "Utility Dive: Utilities, school districts see growing value in electric buses for VPPs (Sept 16, 2026)",
    "url": "https://www.utilitydive.com/news/utilities-school-districts-see-growing-value-in-electric-buses-for-vpp/830499/"
   }
  ]
 },
 {
  "id": "V2G-006",
  "category": "V2G",
  "name": "Cajon Valley bus V2G (ELRP)",
  "operator": "San Diego Gas & Electric, Cajon Valley Union School District",
  "state": "CA",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "School bus",
   "Vehicle-to-grid",
   "Emergency load reduction"
  ],
  "businessModel": "Emergency DR",
  "scale": "6 buses, six 60 kW chargers",
  "mw": 0.36,
  "timing": "More than 3 years as of May 2025",
  "summary": "Six electric school buses with bidirectional chargers take part in California's Emergency Load Reduction Program through SDG&E.",
  "outcomes": "Events run one to five hours and occur about 10 times a year. The district says it lowers energy costs while buses keep serving students.",
  "modelNote": "Compensation is $2 per kWh dispatched under ELRP. Buses must stay available for student transport first.",
  "risks": [
   "Small scale",
   "Event-limited revenue"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Electric school buses, about 180 kWh batteries"
   },
   {
    "label": "Chargers",
    "value": "Six 60 kW bidirectional"
   },
   {
    "label": "Direction",
    "value": "Export to grid"
   },
   {
    "label": "Compensation",
    "value": "$2 per kWh dispatched"
   }
  ],
  "sources": [
   {
    "title": "WRI: Electric school bus V2G lessons and examples",
    "url": "https://www.wri.org/update/electric-school-bus-v2g-lessons-examples"
   }
  ]
 },
 {
  "id": "V2G-007",
  "category": "V2G",
  "name": "Porterville Unified microgrid with V2G buses",
  "operator": "Southern California Edison, Porterville Unified School District",
  "state": "CA",
  "utilityType": "Investor-owned",
  "status": "In development",
  "technologies": [
   "School bus",
   "Vehicle-to-grid",
   "Microgrid",
   "Solar + storage"
  ],
  "businessModel": "Microgrid",
  "scale": "2 bidirectional buses; 35 fast chargers planned",
  "mw": null,
  "timing": "Announced in June (year not stated in source)",
  "summary": "A microgrid with a 763 kW solar array and a 408 kW / 1,632 kWh battery, supporting SCE's distribution grid.",
  "outcomes": "Planned. No results.",
  "modelNote": "Payment terms not stated.",
  "risks": [
   "Evidence thin",
   "Delivery unverified"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "2 bidirectional buses"
   },
   {
    "label": "Co-located assets",
    "value": "763 kW solar, 408 kW / 1,632 kWh battery"
   },
   {
    "label": "Direction",
    "value": "Microgrid and distribution grid support"
   }
  ],
  "sources": [
   {
    "title": "Utility Dive: Utilities, school districts see growing value in electric buses for VPPs (Sept 16, 2026)",
    "url": "https://www.utilitydive.com/news/utilities-school-districts-see-growing-value-in-electric-buses-for-vpp/830499/"
   }
  ]
 },
 {
  "id": "V2G-008",
  "category": "V2G",
  "name": "Electric school bus program and EPRI V2G demonstration",
  "operator": "Dominion Energy, with EPRI",
  "state": "VA",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "School bus",
   "Vehicle-to-grid",
   "Managed charging"
  ],
  "businessModel": "Utility-owned fleet support",
  "scale": "50 buses in first phase (16 districts); 15 feeders studied",
  "mw": null,
  "timing": "Announced Jan 2020",
  "summary": "Dominion paid the price gap between electric and diesel buses for the first 50 buses and built charging, with buses to act as a grid resource at the end of the school day. A separate multi-year EPRI demonstration studied 15 feeders.",
  "outcomes": "11 of 15 feeders could host a full electric bus fleet without upgrades. Some buses failed to dispatch because of low 12-volt battery charge. The 2020 plan was for 1,000 more buses by 2025 with legislative approval; whether that happened was not verified in this pass.",
  "modelNote": "Dominion invested $15M in the first 50 buses, covering over $100,000 per bus in extra cost. Expansion needed state legislative approval, with a rate impact estimated under $1 per month (2020 estimate).",
  "risks": [
   "Plan versus delivery unverified",
   "Dispatch failures",
   "Ratepayer funding"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Electric school buses"
   },
   {
    "label": "Direction",
    "value": "Export to grid, managed charging"
   },
   {
    "label": "Investment",
    "value": "$15M for first 50 buses (2020)"
   }
  ],
  "sources": [
   {
    "title": "Next City: Virginia utility plans to use electric school buses as a power station (Jan 30, 2020)",
    "url": "https://nextcity.org/urbanist-news/virginia-utility-plans-to-use-electric-school-buses-as-a-power-station"
   },
   {
    "title": "Utility Dive: Utilities, school districts see growing value in electric buses for VPPs (Sept 16, 2026)",
    "url": "https://www.utilitydive.com/news/utilities-school-districts-see-growing-value-in-electric-buses-for-vpp/830499/"
   }
  ]
 },
 {
  "id": "V2G-009",
  "category": "V2G",
  "name": "Flexible Load Management (South Burlington buses)",
  "operator": "Green Mountain Power",
  "state": "VT",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "School bus",
   "Vehicle-to-grid"
  ],
  "businessModel": "Utility-run program",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Not stated in sources",
  "summary": "GMP's Flexible Load Management program pays for school bus battery discharge in South Burlington.",
  "outcomes": "No energy figures are given.",
  "modelNote": "Roughly $9,000 per vehicle per year with year-round incentives (WRI).",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Electric school bus"
   },
   {
    "label": "Direction",
    "value": "Export to grid"
   },
   {
    "label": "Compensation",
    "value": "About $9,000 per vehicle per year"
   }
  ],
  "sources": [
   {
    "title": "WRI: Electric school bus V2G lessons and examples",
    "url": "https://www.wri.org/update/electric-school-bus-v2g-lessons-examples"
   }
  ]
 },
 {
  "id": "V2G-010",
  "category": "V2G",
  "name": "White Plains school bus V2G (VDER)",
  "operator": "Con Edison, Lion Electric, Nuvve, National Express",
  "state": "NY",
  "utilityType": "Investor-owned",
  "status": "Pilot",
  "technologies": [
   "School bus",
   "Vehicle-to-grid"
  ],
  "businessModel": "Utility-run program",
  "scale": "5 buses",
  "mw": null,
  "timing": "Project began 2018; results announced Dec 14, 2020",
  "summary": "Five Lion C electric school buses at a North White Plains depot sent power back to the grid with Nuvve's V2G technology. Lion called it the first successful V2G deployment in New York.",
  "outcomes": "No kW rating or total energy exported was stated in the 2020 announcement.",
  "modelNote": "Con Edison, NYSERDA and National Express helped fund the bus purchase. WRI later describes compensation under Con Edison's Value of Distributed Energy Resources program at reported actual cost to the utility.",
  "risks": [
   "Vendor-reported results",
   "Current status unclear"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Lion C electric school buses (5)"
   },
   {
    "label": "Direction",
    "value": "Export to grid"
   },
   {
    "label": "Platform",
    "value": "Nuvve V2G"
   }
  ],
  "sources": [
   {
    "title": "Lion Electric release via STN: successful V2G deployment with Con Edison (Dec 14, 2020)",
    "url": "https://stnonline.com/industry-releases/lion-electric-announces-successful-electric-school-bus-vehicle-to-grid-deployment-with-con-edison-in-new-york/"
   },
   {
    "title": "WRI: Electric school bus V2G lessons and examples",
    "url": "https://www.wri.org/update/electric-school-bus-v2g-lessons-examples"
   }
  ]
 },
 {
  "id": "V2G-011",
  "category": "V2G",
  "name": "Wells-Ogunquit school bus V2G pilot",
  "operator": "Wells-Ogunquit school district",
  "state": "ME",
  "utilityType": "School district (utility not named)",
  "status": "On hold",
  "technologies": [
   "School bus",
   "Vehicle-to-grid"
  ],
  "businessModel": "Pilot awaiting compensation scheme",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Paused as of WRI's report",
  "summary": "A V2G pilot paused while a compensation scheme is established with the utility and regulator.",
  "outcomes": "No results.",
  "modelNote": "No compensation scheme yet.",
  "risks": [
   "No compensation scheme",
   "Regulatory gap"
  ],
  "riskNote": "WRI cites this as an example of why clear, stable compensation determines whether a project succeeds.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Electric school buses"
   },
   {
    "label": "Blocker",
    "value": "Compensation scheme with utility and regulator"
   }
  ],
  "sources": [
   {
    "title": "WRI: Electric school bus V2G lessons and examples",
    "url": "https://www.wri.org/update/electric-school-bus-v2g-lessons-examples"
   }
  ]
 },
 {
  "id": "V2G-012",
  "category": "V2G",
  "name": "West Linn bus V2G demonstration",
  "operator": "Portland General Electric, First Student",
  "state": "OR",
  "utilityType": "Investor-owned",
  "status": "Pilot",
  "technologies": [
   "School bus",
   "Vehicle-to-grid"
  ],
  "businessModel": "Utility-run program",
  "scale": "1 bus, 155 kWh, 60 kW charger",
  "mw": 0.06,
  "timing": "Summer 2024 events",
  "summary": "A single bus with a 60 kW bidirectional charger used for utility dispatch tests.",
  "outcomes": "During summer 2024 the bus delivered stable output over three-hour events. PGE is optimistic about expanding to more bus and charger combinations.",
  "modelNote": "Utility dispatch control and pilot funding support testing.",
  "risks": [
   "Single-bus evidence"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Electric school bus, 155 kWh (1)"
   },
   {
    "label": "Chargers",
    "value": "60 kW bidirectional"
   },
   {
    "label": "Direction",
    "value": "Export to grid"
   }
  ],
  "sources": [
   {
    "title": "WRI: Electric school bus V2G lessons and examples",
    "url": "https://www.wri.org/update/electric-school-bus-v2g-lessons-examples"
   }
  ]
 },
 {
  "id": "V2G-013",
  "category": "V2G",
  "name": "Durango school bus V2G",
  "operator": "La Plata Electric Association, Durango School District 9-R",
  "state": "CO",
  "utilityType": "Cooperative",
  "status": "Operating",
  "technologies": [
   "School bus",
   "Vehicle-to-grid"
  ],
  "businessModel": "Utility-run program",
  "scale": "1 bus",
  "mw": null,
  "timing": "Not stated in sources",
  "summary": "A cooperative uses one bidirectional bus to help manage distribution demand.",
  "outcomes": "The utility's initial technology platform failed, so it worked with other providers to build software that gives better dispatch control.",
  "modelNote": "Payment terms not stated.",
  "risks": [
   "Platform failure",
   "Single-bus evidence"
  ],
  "riskNote": "WRI says a robust, generalized V2G system that works well with utilities is still needed.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Electric school bus (1)"
   },
   {
    "label": "Direction",
    "value": "Export to grid, distribution demand management"
   }
  ],
  "sources": [
   {
    "title": "WRI: Electric school bus V2G lessons and examples",
    "url": "https://www.wri.org/update/electric-school-bus-v2g-lessons-examples"
   }
  ]
 },
 {
  "id": "V2G-014",
  "category": "V2G",
  "name": "Sunrun and BGE F-150 Lightning vehicle-to-home pilot",
  "operator": "Baltimore Gas & Electric, Sunrun, Ford",
  "state": "MD",
  "utilityType": "Investor-owned",
  "status": "Completed",
  "technologies": [
   "Light-duty EVs",
   "Vehicle-to-home",
   "Residential"
  ],
  "businessModel": "Aggregator-led",
  "scale": "3 customers",
  "mw": null,
  "timing": "June 1 to Sept 30, 2024",
  "summary": "Three Sunrun customers with F-150 Lightning trucks shared energy with the grid during weekday 5 to 9 p.m. windows. Sunrun called it the first operational bidirectional EV 'power plant' in the US using a cohort of customer vehicles.",
  "outcomes": "No results were reported in the launch coverage. Sunrun's CEO called it 'a significant proof of concept'.",
  "modelNote": "Customers were paid by energy shared, about $800 per customer over the four months (Sunrun estimate). Funded by a US Department of Energy grant to BGE.",
  "risks": [
   "Very small scale",
   "Results not published"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Ford F-150 Lightning (3)"
   },
   {
    "label": "Direction",
    "value": "Export to grid via home system"
   },
   {
    "label": "Compensation",
    "value": "About $800 per customer for the season"
   }
  ],
  "sources": [
   {
    "title": "Utility Dive: Sunrun, BGE launch first US vehicle-to-home EV charging program",
    "url": "https://www.utilitydive.com/news/sunrun-bge-launch-first-us-vehicle-to-home-ev-charging-program/722367/"
   }
  ]
 },
 {
  "id": "V2G-015",
  "category": "V2G",
  "name": "Boulder V2X pilot",
  "operator": "Xcel Energy, Fermata Energy",
  "state": "CO",
  "utilityType": "Investor-owned",
  "status": "Pilot",
  "technologies": [
   "Light-duty EVs",
   "Vehicle-to-building",
   "Commercial"
  ],
  "businessModel": "Utility-run program",
  "scale": "6 Nissan Leafs, four 20 kW chargers",
  "mw": 0.08,
  "timing": "Announced May 20, 2024",
  "summary": "Bidirectional chargers at an affordable housing development and a beverage store, working with the City of Boulder, Colorado CarShare and Boulder Housing Partners.",
  "outcomes": "No results reported. Xcel calls it its first pilot of this kind and has no current plans to expand. Fermata says it is open to expansion.",
  "modelNote": "Approved under Xcel's partnerships, research and innovation portfolio within its 2021-2023 Transportation Electrification Plan. Goals: cut peak building demand and bills, study resiliency in outage-prone areas.",
  "risks": [
   "Not grid export",
   "Small scale"
  ],
  "riskNote": "The chargers can discharge to the building but not back to the grid, so this tests vehicle-to-building, not V2G.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Nissan Leaf (6)"
   },
   {
    "label": "Chargers",
    "value": "Four 20 kW Level 2 bidirectional"
   },
   {
    "label": "Direction",
    "value": "To building only"
   }
  ],
  "sources": [
   {
    "title": "Utility Dive: Fermata, Xcel launch V2X bidirectional charging pilot",
    "url": "https://www.utilitydive.com/news/fermata-xcel-energy-launch-v2x-bidirectional-charging-pilot/717321/"
   }
  ]
 },
 {
  "id": "V2G-016",
  "category": "V2G",
  "name": "MOVER school microgrid",
  "operator": "Hood River County School District, New Buildings Institute",
  "state": "OR",
  "utilityType": "School district",
  "status": "In development",
  "technologies": [
   "School bus",
   "Vehicle-to-building",
   "Microgrid",
   "Solar + storage"
  ],
  "businessModel": "Microgrid",
  "scale": "Buses integrated into one school microgrid",
  "mw": null,
  "timing": "Planned",
  "summary": "Electric school buses are planned to supply power directly to Wy'East Middle School in emergencies rather than export to the grid. Components include local solar, stationary batteries, a microgrid controller and bidirectional chargers.",
  "outcomes": "Planned. No results.",
  "modelNote": "Resilience use case, not a utility payment model.",
  "risks": [
   "Not grid export",
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vehicle",
    "value": "Electric school buses"
   },
   {
    "label": "Direction",
    "value": "To building and microgrid"
   }
  ],
  "sources": [
   {
    "title": "WRI: Electric school bus V2G lessons and examples",
    "url": "https://www.wri.org/update/electric-school-bus-v2g-lessons-examples"
   }
  ]
 },
 {
  "id": "GET-001",
  "category": "GETs",
  "name": "Dynamic line rating demonstration",
  "operator": "Oncor",
  "state": "TX",
  "utilityType": "Investor-owned",
  "status": "Completed",
  "technologies": [
   "Dynamic line rating",
   "Sensors"
  ],
  "businessModel": "DOE-funded demonstration, then commercial follow-on",
  "scale": "8 circuits, 138 to 345 kV",
  "mw": null,
  "timing": "Final report April 2014; Odessa-Midland follow-on June 2013",
  "summary": "Dynamic line rating on eight central Texas circuits, feeding real-time ratings to ERCOT, which used the added capacity in its dispatch process without operator intervention.",
  "outcomes": "DLR raised capacity by up to 14% above ambient-adjusted ratings, available 83.5 to 90.5% of the time. The report found 5% extra capacity could relieve up to 60% of congestion on the target lines and 10% could nearly eliminate it. Oncor's final report called the project 'a complete success'.",
  "modelNote": "Part of a US DOE Smart Grid Demonstration Program (award amount not stated). Oncor later deployed more DLR in Odessa-Midland with commercial funding.",
  "risks": [
   "Dated evidence",
   "Savings not monetized in source"
  ],
  "riskNote": "The source gives Oncor's total congestion costs (over $148M in 2011, over $197M in 2012) but no congestion cost savings from the program.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "GET type",
    "value": "Dynamic line rating"
   },
   {
    "label": "Voltage",
    "value": "138 to 345 kV"
   },
   {
    "label": "Measured capacity gain",
    "value": "Up to 14% over ambient-adjusted ratings"
   },
   {
    "label": "Result basis",
    "value": "Measured (final DOE demonstration report)"
   }
  ],
  "sources": [
   {
    "title": "Renewable Energy World: Oncor DLR program increases transmission capacity, reduces congestion",
    "url": "https://www.renewableenergyworld.com/power-grid/transmission/oncor-dlr-program-increases-transmission-capacity-reduces-congestion/"
   }
  ]
 },
 {
  "id": "GET-002",
  "category": "GETs",
  "name": "LineVision dynamic line rating, Syracuse",
  "operator": "National Grid",
  "state": "NY",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "Dynamic line rating",
   "Sensors"
  ],
  "businessModel": "Utility-run deployment",
  "scale": "4 lines at 115 kV",
  "mw": null,
  "timing": "Early May 2024, after a year of pilots",
  "summary": "Described as the largest operationalization of DLR in the US at the time. Automated ratings go straight to control room operators.",
  "outcomes": "National Grid expects average capacity increases of 20 to 30% on these lines. These are projections, not measured outcomes. Cost gains were not reported.",
  "modelNote": "Utility-run with LineVision sensors. Similar deployments are being considered in other parts of New York, Massachusetts and the UK, but not immediately.",
  "risks": [
   "Projected results",
   "Integration effort",
   "Operator training"
  ],
  "riskNote": "Integration took careful security and software work, and future deployments are 'not a simple copy and paste'.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "GET type",
    "value": "Dynamic line rating"
   },
   {
    "label": "Voltage",
    "value": "115 kV"
   },
   {
    "label": "Expected capacity gain",
    "value": "20 to 30% average (projection)"
   },
   {
    "label": "Result basis",
    "value": "Projected"
   }
  ],
  "sources": [
   {
    "title": "Latitude Media: Behind the scenes of the country's largest dynamic line rating deployment",
    "url": "https://www.latitudemedia.com/news/behind-the-scenes-of-the-countrys-largest-dynamic-line-rating-deployment/"
   }
  ]
 },
 {
  "id": "GET-003",
  "category": "GETs",
  "name": "Heimdall Power dynamic line rating pilot",
  "operator": "Ameren Transmission Co. of Illinois",
  "state": "IL",
  "utilityType": "Investor-owned",
  "status": "Pilot",
  "technologies": [
   "Dynamic line rating",
   "Sensors"
  ],
  "businessModel": "Utility-run pilot",
  "scale": "About 30 sensors (15 installed, 15 planned)",
  "mw": null,
  "timing": "Install began Dec 2025; announced Mar 30, 2026",
  "summary": "Heimdall sensors clamped onto some of the most congested lines in Ameren's MISO transmission system. Ameren also expects the data to help plan where and when new transmission is needed.",
  "outcomes": "No results yet. Future deployment depends on what the pilot shows.",
  "modelNote": "Utility-run pilot with the vendor.",
  "risks": [
   "Evidence thin",
   "Results pending"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "GET type",
    "value": "Dynamic line rating"
   },
   {
    "label": "Footprint",
    "value": "Unnamed congested lines in MISO"
   },
   {
    "label": "Result basis",
    "value": "None yet"
   }
  ],
  "sources": [
   {
    "title": "Utility Dive: Ameren tests Heimdall dynamic line rating",
    "url": "https://www.utilitydive.com/news/ameren-dynamic-line-rating-heimdall/816090/"
   }
  ]
 },
 {
  "id": "GET-004",
  "category": "GETs",
  "name": "SmartValve power flow control, Leeds-Hurley Avenue",
  "operator": "Central Hudson Gas & Electric",
  "state": "NY",
  "utilityType": "Investor-owned",
  "status": "Operating",
  "technologies": [
   "Advanced power flow control",
   "Smart Wires SmartValve"
  ],
  "businessModel": "Utility capital project (non-wires alternative)",
  "scale": "185 MW of transfer capacity; 15 units, about 150 MVAr",
  "mw": 185,
  "timing": "Installed 2023; 2019 pilot at 115 kV",
  "summary": "Fifteen Smart Wires SmartValves (10 MVAr each) at 345 kV push power onto an underused circuit, unlocking 185 MW on the UPNY-SENY interface. A fixed series capacitor was considered first.",
  "outcomes": "The utility reported less substation work, a 25% smaller footprint and an estimated $10M saving versus the capacitor option. The article reports expectations, not measured performance.",
  "modelNote": "Built to meet a NYISO-identified need at lowest cost to customers, tied to New York's 70% renewables target for 2030. Devices can be expanded or relocated.",
  "risks": [
   "Expected, not measured, results"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "GET type",
    "value": "Advanced power flow control"
   },
   {
    "label": "Voltage",
    "value": "345 kV (2019 pilot at 115 kV)"
   },
   {
    "label": "Capacity effect",
    "value": "185 MW transfer capacity unlocked"
   },
   {
    "label": "Result basis",
    "value": "Utility expectation"
   }
  ],
  "sources": [
   {
    "title": "Renewable Energy World: How a New York utility unlocked 185 MW without new transmission",
    "url": "https://www.renewableenergyworld.com/power-grid/transmission/case-study-how-a-new-york-utility-unlocked-185-mw-of-capacity-without-building-new-transmission"
   }
  ]
 },
 {
  "id": "GET-005",
  "category": "GETs",
  "name": "ACCC reconductor of two 345 kV lines",
  "operator": "AEP",
  "state": "TX",
  "utilityType": "Investor-owned",
  "status": "Completed",
  "technologies": [
   "Advanced conductors",
   "Reconductoring"
  ],
  "businessModel": "Utility capital project",
  "scale": "Two 120-mile lines, about 240 circuit-miles",
  "mw": null,
  "timing": "Completion date not stated",
  "summary": "Two parallel 345 kV lines near the Gulf were reconductored while energized with CTC Global's ACCC Drake conductor, reusing the existing steel structures.",
  "outcomes": "The vendor says capacity roughly doubled, line losses fell 30% and the project finished 8 months early and under budget.",
  "modelNote": "Utility capital project; the case study is published by the conductor vendor.",
  "risks": [
   "Vendor case study",
   "Internal inconsistencies"
  ],
  "riskNote": "The page gives $43M in one place and $50M+ in another for upfront savings, and 34 MW in one place and over 40 MW in another for freed generation. Treat figures as leads.",
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "GET type",
    "value": "Advanced conductor"
   },
   {
    "label": "Voltage",
    "value": "345 kV"
   },
   {
    "label": "Capacity effect",
    "value": "About 2x original (vendor)"
   },
   {
    "label": "Result basis",
    "value": "Vendor-reported"
   }
  ],
  "sources": [
   {
    "title": "CTC Global: AEP reconductor project",
    "url": "https://ctcglobal.com/aep-reconductor-project/"
   }
  ]
 },
 {
  "id": "GEO-001",
  "category": "Geothermal",
  "name": "Cape Station enhanced geothermal",
  "operator": "Fervo Energy, with Southern California Edison and other offtakers",
  "state": "UT, CA",
  "utilityType": "Developer with utility offtake",
  "status": "Operating",
  "technologies": [
   "Enhanced geothermal",
   "Horizontal drilling"
  ],
  "businessModel": "Power purchase agreement",
  "scale": "About 100 MW Phase I (three 33 MW blocks); about 900 MW contracted",
  "mw": 100,
  "timing": "First power announced Sept 24, 2026",
  "summary": "Fervo says Cape Station is the first utility-scale enhanced geothermal development to reach first power. The first GeoBlock is ramping as the full well system comes online.",
  "outcomes": "Output now was not stated. The first block is expected at contractual operation by Oct 1, 2026 and the other two by Jan 1, 2027, with another 400 MW under construction for 2028.",
  "modelNote": "SCE signed two 15-year PPAs totaling 320 MW in June 2024. Other offtakers include Google (396 MW PPA with an option to expand), Shell Energy North America and Clean Power Alliance.",
  "risks": [
   "Company-reported milestone",
   "Ramp-up not yet measured"
  ],
  "riskNote": "The 2024 SCE announcement said the first phase would be 70 MW by 2026, while the Sept 2026 report says Phase I is about 100 MW. Drilling cost and time figures were not stated.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Resource",
    "value": "Enhanced geothermal, horizontal wells"
   },
   {
    "label": "Offtake",
    "value": "About 900 MW contracted; SCE 320 MW"
   },
   {
    "label": "Phase I COD",
    "value": "Oct 1, 2026 and Jan 1, 2027 (expected)"
   }
  ],
  "sources": [
   {
    "title": "Power Engineering: Fervo achieves first power at flagship Utah project (Sept 24, 2026)",
    "url": "https://www.power-eng.com/renewables/fervo-energy-achieves-first-power-at-flagship-utah-geothermal-project"
   },
   {
    "title": "Utility Dive: Fervo, Southern California Edison geothermal deal (June 2024)",
    "url": "https://www.utilitydive.com/news/fervo-geothermal-deal-california-edison-energy/720128/"
   }
  ]
 },
 {
  "id": "GEO-002",
  "category": "Geothermal",
  "name": "Advanced geothermal pilot near Nacogdoches",
  "operator": "Austin Energy, Exceed Energy",
  "state": "TX",
  "utilityType": "Public power (municipal)",
  "status": "In development",
  "technologies": [
   "Advanced geothermal",
   "Supercritical CO2"
  ],
  "businessModel": "Utility pilot with developer",
  "scale": "5 MW",
  "mw": 5,
  "timing": "Announced Nov 14, 2024",
  "summary": "A 5 MW pilot using Exceed Energy's supercritical carbon dioxide technology, sited near Austin Energy's biomass facility in Nacogdoches.",
  "outcomes": "The release said it would be online in 2025. Earlier research notes (Feb 2026) put it still pre-construction; this was not re-verified in this pass.",
  "modelNote": "Cost and contract terms were not disclosed.",
  "risks": [
   "Schedule slip",
   "Contract terms undisclosed"
  ],
  "riskNote": "The utility calls this 'advanced geothermal', which uses sCO2 as the working fluid, so it may not be enhanced geothermal in the Fervo sense.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Resource",
    "value": "Advanced geothermal, sCO2"
   },
   {
    "label": "Site",
    "value": "Near the Nacogdoches biomass plant"
   },
   {
    "label": "Announced online date",
    "value": "2025 (not met per earlier notes)"
   }
  ],
  "sources": [
   {
    "title": "Austin Energy: explores potential game changer for geothermal energy in Texas (Nov 14, 2024)",
    "url": "https://austinenergy.com/about/news/news-releases/2024/austin-energy-explores-potential-game-changer-for-geothermal-energy-in-texas"
   },
   {
    "title": "ThinkGeoEnergy: Austin, Texas to pilot 5 MW geothermal power project",
    "url": "https://www.thinkgeoenergy.com/austin-texas-to-pilot-5-mw-geothermal-power-project/"
   }
  ]
 },
 {
  "id": "PRG-001",
  "category": "Program",
  "name": "Community Solar Grant Program (low-income)",
  "operator": "Maryland Energy Administration, with Department of Human Services",
  "state": "MD",
  "utilityType": "State energy office",
  "status": "Operating",
  "technologies": [
   "Community solar",
   "Low-income access",
   "Brownfield / landfill siting"
  ],
  "businessModel": "State grant",
  "scale": "Up to $42.5M offered in the FY27 round; $43M awarded to 69 projects (June 2026)",
  "mw": null,
  "timing": "Rounds announced Oct 2025, June 2026 and Sept 2026",
  "summary": "Grants to community solar projects that give low-income households guaranteed savings or free energy. Paid from the Strategic Energy Investment Fund. It is a state-level funding layer on top of the Public Service Commission's community solar program.",
  "outcomes": "June 2026: $43M in grants for 69 projects, including Solar Landscape (21 rooftop projects in BGE and Pepco territories), Pippin Farms (two capped landfills) and Lightstar (12 agrivoltaic projects). MW and households served were not stated. The FY27 round opened Sept 22, 2026, with applications due Dec 15, 2026 and notices expected in spring 2027.",
  "modelNote": "Oct 2025 round ($17M): about $12M set aside for landfill and brownfield sites; half the energy free to households designated by the Department of Human Services and half at a 25% discount; other projects direct 15% of output to low-income subscribers with at least 12% savings; awards of $50,000 to $1M, up to $6M for landfill and brownfield sites; projects funded by the earlier pilot ineligible. FY27 round: Area of Interest 1 needs 15% low-income output with 25% savings off the utility credit rate; Area of Interest 2 needs 50% free to low-income households plus 25% savings on the rest, on a landfill, rubble fill or brownfield.",
  "risks": [
   "Annual appropriation",
   "Round terms change each year",
   "Outcomes not yet reported"
  ],
  "riskNote": "The $17M (Oct 2025) and $43M (June 2026) figures come from different announcements and the sources do not say how the rounds relate. Do not add them.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Funder",
    "value": "Maryland Energy Administration"
   },
   {
    "label": "Fund source",
    "value": "Strategic Energy Investment Fund"
   },
   {
    "label": "Beneficiaries",
    "value": "Low-income subscribers, renters"
   },
   {
    "label": "Subscriber savings floor",
    "value": "12% to 25% off, depending on round and project type"
   },
   {
    "label": "Current window",
    "value": "FY27 FOA, due Dec 15, 2026"
   }
  ],
  "sources": [
   {
    "title": "Maryland Energy Administration: Community Solar Grant Program (FY27)",
    "url": "https://energy.maryland.gov/residential/Pages/CommunitySolarLMI-PPA.aspx/2/0100019a2bc3fc74-24c10b61-bbdb-4425-a1a8-4a21307ca327-000000/hRt5JmWUKqtQ5knAR7nZ3N9iPuDlPyEBlOEbgD-p6E4"
   },
   {
    "title": "Governor Moore: $17 million for community solar projects (Oct 2025)",
    "url": "https://governor.maryland.gov/news/press/pages/governor-moore-announces-%2417-million-for-community-solar-projects-to-cut-energy-costs-for-marylanders.aspx"
   },
   {
    "title": "SamSearch: Maryland allocates $43M for community solar (June 2026)",
    "url": "https://samsearch.co/government-contracting-news/maryland-allocates-43-million-for-community-solar-to-support-low-income-residents-112011"
   }
  ]
 },
 {
  "id": "PRG-002",
  "category": "Program",
  "name": "Maryland Community Solar Program",
  "operator": "Maryland Public Service Commission; BGE, Delmarva, Potomac Edison, Pepco",
  "state": "MD",
  "utilityType": "State regulator program",
  "status": "Operating",
  "technologies": [
   "Community solar",
   "Low-income access"
  ],
  "businessModel": "Subscription with utility bill credit",
  "scale": "Pilot: 139 projects, 204 MW operating (to June 30, 2024)",
  "mw": 204,
  "timing": "Pilot began 2015; permanent program rules published Feb 4, 2025",
  "summary": "Subscribers receive bill credits for their share of a community solar project's output. The pilot ran from 2015 to Dec 31, 2024 and a permanent program created by House Bill 908 (2023) replaced it.",
  "outcomes": "The pilot reached 139 projects and 204 MW operating through June 30, 2024. The page gives no subscriber count. Rules for consolidated utility billing are still in development.",
  "modelNote": "Projects up to 5 MW. Systems must send at least 40% of kWh output to low- and moderate-income subscribers unless subscribers wholly own the system, and those subscribers may not be charged more than 90% of the bill credit value, so about 10% savings. Each utility has a community solar tariff on file and does the interconnection work.",
  "risks": [
   "Savings floor is modest",
   "Billing rules still in development"
  ],
  "riskNote": null,
  "confidence": "High",
  "categoryFields": [
   {
    "label": "Funder",
    "value": "Subscribers via utility bill credits (no state fund)"
   },
   {
    "label": "Per-project cap",
    "value": "5 MW"
   },
   {
    "label": "Low and moderate income share",
    "value": "At least 40% of output"
   },
   {
    "label": "Subscriber savings floor",
    "value": "About 10% for LMI subscribers"
   }
  ],
  "sources": [
   {
    "title": "Maryland PSC: Community Solar Program",
    "url": "https://psc.maryland.gov/regulated-utilities/electricity/renewable-energy/community-solar-program/"
   }
  ]
 },
 {
  "id": "PRG-003",
  "category": "Program",
  "name": "Commercial and canopy solar grants (FY26)",
  "operator": "Maryland Energy Administration",
  "state": "MD",
  "utilityType": "State energy office",
  "status": "Approved",
  "technologies": [
   "Commercial solar",
   "Solar canopy"
  ],
  "businessModel": "State grant",
  "scale": "$13M pool",
  "mw": null,
  "timing": "Applications closed Feb 9, 2026",
  "summary": "Incentives for Maryland businesses and nonprofits installing solar. The FY26 round added solar canopy technology as an eligible project type.",
  "outcomes": "No award results found in this pass.",
  "modelNote": "Paid from the Strategic Energy Investment Fund, which is supported by proceeds from greenhouse-gas emission auctions and alternative compliance payments from utilities.",
  "risks": [
   "Evidence thin",
   "Awards not verified"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Funder",
    "value": "Maryland Energy Administration"
   },
   {
    "label": "Fund source",
    "value": "Strategic Energy Investment Fund"
   },
   {
    "label": "Beneficiaries",
    "value": "Businesses and nonprofits"
   }
  ],
  "sources": [
   {
    "title": "Solar Power World: Maryland opens $13M in grants for commercial and canopy solar",
    "url": "https://www.solarpowerworldonline.com/2025/11/maryland-opens-13-million-in-grants-for-commercial-and-canopy-solar-projects/"
   }
  ]
 },
 {
  "id": "GB-022",
  "category": "Green bank",
  "name": "Michigan Saves",
  "operator": "Michigan Saves (nonprofit green bank), with Consumers Energy, DTE Energy, SEMCO Energy and Traverse City Light & Power",
  "state": "MI",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated",
   "On-bill repayment"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "More than $675M financed across 51,986 projects",
  "mw": null,
  "timing": "Founded 2009 with state seed funding",
  "summary": "The first nonprofit green bank in the US. It finances energy improvements through partner lenders and a network of more than 1,200 authorized contractors.",
  "outcomes": "Results from Sept 2010 through Dec 2024: about 13,500 full-time jobs supported, 59% of financed households low or moderate income, and a 30-to-1 ratio of private investment to reserve dollars.",
  "modelNote": "Residential: Home Energy Loan Program (unsecured loans), Lead Poisoning Prevention Fund (50/50 cost share with the state health department) and Septic Replacement Loan Program. Commercial: Commercial Energy Loan Program, Michigan Saves Climate Fund and Tax Credit Bridge Financing. On-bill repayment through the four utilities named above. Funded by state seed money and utility partners; the source does not mention federal green bank money.",
  "risks": [
   "Self-reported results",
   "Leverage depends on reserves"
  ],
  "riskNote": "Figures come from Michigan Saves' May 2025 presentation to a Michigan House subcommittee. The presentation is undated beyond that and the numbers are the organization's own.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Funder",
    "value": "State seed funding and utility partners"
   },
   {
    "label": "Products",
    "value": "Home loans, commercial loans, on-bill financing, tax credit bridge loans"
   },
   {
    "label": "Beneficiaries",
    "value": "59% low or moderate income households (reported)"
   },
   {
    "label": "Total financed",
    "value": "More than $675M"
   }
  ],
  "sources": [
   {
    "title": "Michigan Saves presentation to the Michigan House LARA subcommittee (May 8, 2025)",
    "url": "https://house.mi.gov/HFA/PDF/LARA/LARA_DIFS_Subcmte_Testimony_Michigan_Saves_Presentation_5-8-25.pdf"
   },
   {
    "title": "Michigan Saves: 0% financing for commercial building energy upgrades",
    "url": "https://michigansaves.org/?p=10251"
   }
  ]
 },
 {
  "id": "GB-001",
  "category": "Green bank",
  "name": "Spruce Root",
  "operator": "Spruce Root",
  "state": "AK",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2012",
  "summary": "A nonprofit green bank in AK, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2012. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank (Spruce Roots, Inc.).",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2012"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-002",
  "category": "Green bank",
  "name": "Groundswell Capital",
  "operator": "Groundswell Capital",
  "state": "AZ",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2022",
  "summary": "A nonprofit green bank in AZ, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2022. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2022"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-003",
  "category": "Green bank",
  "name": "California Infrastructure and Economic Development Bank (IBank)",
  "operator": "California Infrastructure and Economic Development Bank (IBank)",
  "state": "CA",
  "utilityType": "Public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2020",
  "summary": "A public green bank in CA, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2020. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Subawardee (California Infrastructure Bank).",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Public"
   },
   {
    "label": "Founded",
    "value": "2020"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-004",
  "category": "Green bank",
  "name": "Collective Clean Energy Fund",
  "operator": "Collective Clean Energy Fund",
  "state": "CO",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2018",
  "summary": "A nonprofit green bank in CO, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2018. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source stated: USDA Rural Energy Savings Program grant. NGA lists it as Colorado Clean Energy Fund, a nonprofit founded 2018, with $30 million received in 2021 for loan projects. The Coalition for Green Capital network lists it as: Subawardee.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2018"
   },
   {
    "label": "Capital source",
    "value": "USDA Rural Energy Savings Program grant"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   },
   {
    "title": "National Governors Association: Green Banks, an overview for governors (May 2023)",
    "url": "https://www.nga.org/wp-content/uploads/2023/05/2023May_State_Green_Banks_Issue_Brief.pdf"
   }
  ]
 },
 {
  "id": "GB-005",
  "category": "Green bank",
  "name": "CT Green Bank",
  "operator": "CT Green Bank",
  "state": "CT",
  "utilityType": "Quasi-public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Quasi-public lender",
  "scale": "$51M invested in 2024; $393M private capital mobilized",
  "mw": null,
  "timing": "Founded 2011",
  "summary": "A quasi-public green bank in CT, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2011. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "Reported investment: $51M invested in 2024; $393M private capital mobilized.",
  "modelNote": "Capital source stated: Green Liberty Notes (short-term bonds from individuals). NGA says it is funded by an electric bill surcharge, RGGI proceeds, federal funding and private capital, and raised $25 million through Green Liberty Bonds. The Coalition for Green Capital network lists it as: Subawardee.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Quasi-public"
   },
   {
    "label": "Founded",
    "value": "2011"
   },
   {
    "label": "Capital source",
    "value": "Green Liberty Notes (short-term bonds from individuals)"
   },
   {
    "label": "Investment",
    "value": "$51M invested in 2024; $393M private capital mobilized"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   },
   {
    "title": "National Governors Association: Green Banks, an overview for governors (May 2023)",
    "url": "https://www.nga.org/wp-content/uploads/2023/05/2023May_State_Green_Banks_Issue_Brief.pdf"
   }
  ]
 },
 {
  "id": "GB-006",
  "category": "Green bank",
  "name": "Connecticut Inclusive Prosperity Capital",
  "operator": "Connecticut Inclusive Prosperity Capital",
  "state": "CT",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2018",
  "summary": "A nonprofit green bank in CT, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2018. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2018"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-007",
  "category": "Green bank",
  "name": "Energize Delaware",
  "operator": "Energize Delaware",
  "state": "DE",
  "utilityType": "Quasi-public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Quasi-public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2007",
  "summary": "A quasi-public green bank in DE, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2007. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Quasi-public"
   },
   {
    "label": "Founded",
    "value": "2007"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-008",
  "category": "Green bank",
  "name": "DC Green Bank",
  "operator": "DC Green Bank",
  "state": "DC",
  "utilityType": "Public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Local"
  ],
  "businessModel": "Public lender",
  "scale": "Over $300M public-private investment in 2024",
  "mw": null,
  "timing": "Founded 2018",
  "summary": "A public green bank in DC, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2018. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "Reported investment: Over $300M public-private investment in 2024.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Subawardee (DC Green Finance Authority).",
  "risks": [
   "Evidence thin",
   "Local, not statewide"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Public"
   },
   {
    "label": "Founded",
    "value": "2018"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Over $300M public-private investment in 2024"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-009",
  "category": "Green bank",
  "name": "Florida Solar & Energy Loan Fund (SELF)",
  "operator": "Florida Solar & Energy Loan Fund (SELF)",
  "state": "FL",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "$34.2M in loans in 2023",
  "mw": null,
  "timing": "Founded 2009",
  "summary": "A nonprofit green bank in FL, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2009. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "Reported investment: $34.2M in loans in 2023.",
  "modelNote": "Capital source stated: JPMorgan Chase and JPB Foundation (program development). The Coalition for Green Capital network lists it as: Subawardee.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2009"
   },
   {
    "label": "Capital source",
    "value": "JPMorgan Chase and JPB Foundation (program development)"
   },
   {
    "label": "Investment",
    "value": "$34.2M in loans in 2023"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-010",
  "category": "Green bank",
  "name": "Hawaii Green Infrastructure Authority",
  "operator": "Hawaii Green Infrastructure Authority",
  "state": "HI",
  "utilityType": "Public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2014",
  "summary": "A public green bank in HI, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2014. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source stated: $50M state appropriation for recapitalization. NGA gives 2013 as the founding year and says it is capitalized with $150.0 million of Green Energy Market Securitization bonds. The Coalition for Green Capital network lists it as: Emerging Green Bank.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Public"
   },
   {
    "label": "Founded",
    "value": "2014"
   },
   {
    "label": "Capital source",
    "value": "$50M state appropriation for recapitalization"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   },
   {
    "title": "National Governors Association: Green Banks, an overview for governors (May 2023)",
    "url": "https://www.nga.org/wp-content/uploads/2023/05/2023May_State_Green_Banks_Issue_Brief.pdf"
   }
  ]
 },
 {
  "id": "GB-011",
  "category": "Green bank",
  "name": "Illinois Finance Authority (Illinois Climate Bank)",
  "operator": "Illinois Finance Authority (Illinois Climate Bank)",
  "state": "IL",
  "utilityType": "Quasi-public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Quasi-public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2021",
  "summary": "A quasi-public green bank in IL, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2021. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source stated: $40M DOE GRID funding (SEFI designation). The Coalition for Green Capital network lists it as: Subawardee.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Quasi-public"
   },
   {
    "label": "Founded",
    "value": "2021"
   },
   {
    "label": "Capital source",
    "value": "$40M DOE GRID funding (SEFI designation)"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-012",
  "category": "Green bank",
  "name": "Illinois Clean Energy Jobs and Justice Fund",
  "operator": "Illinois Clean Energy Jobs and Justice Fund",
  "state": "IL",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2021",
  "summary": "A nonprofit green bank in IL, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2021. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2021"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-013",
  "category": "Green bank",
  "name": "Indiana Energy Independence Fund",
  "operator": "Indiana Energy Independence Fund",
  "state": "IN",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2024",
  "summary": "A nonprofit green bank in IN, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2024. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank.",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2024"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-014",
  "category": "Green bank",
  "name": "Iowa Energy Fund",
  "operator": "Iowa Energy Fund",
  "state": "IA",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2024",
  "summary": "A nonprofit green bank in IA, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2024. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank.",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2024"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-015",
  "category": "Green bank",
  "name": "Finance New Orleans",
  "operator": "Finance New Orleans",
  "state": "LA",
  "utilityType": "Public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Local"
  ],
  "businessModel": "Public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2017",
  "summary": "A public green bank in LA, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2017. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank.",
  "risks": [
   "Evidence thin",
   "Local, not statewide"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Public"
   },
   {
    "label": "Founded",
    "value": "2017"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-016",
  "category": "Green bank",
  "name": "Louisiana Clean Energy Fund",
  "operator": "Louisiana Clean Energy Fund",
  "state": "LA",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2023",
  "summary": "A nonprofit green bank in LA, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2023. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank.",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2023"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-017",
  "category": "Green bank",
  "name": "Efficiency Maine Trust",
  "operator": "Efficiency Maine Trust",
  "state": "ME",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2021",
  "summary": "A nonprofit green bank in ME, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2021. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Subawardee.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2021"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-018",
  "category": "Green bank",
  "name": "Montgomery County Green Bank",
  "operator": "Montgomery County Green Bank",
  "state": "MD",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Local"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2017",
  "summary": "A nonprofit green bank in MD, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2017. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Subawardee (Montgomery County Green Bank Corporation).",
  "risks": [
   "Evidence thin",
   "Local, not statewide"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2017"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-019",
  "category": "Green bank",
  "name": "Climate Access Fund",
  "operator": "Climate Access Fund",
  "state": "MD",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2017",
  "summary": "A nonprofit green bank in MD, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2017. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2017"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-020",
  "category": "Green bank",
  "name": "Maryland Clean Energy Center",
  "operator": "Maryland Clean Energy Center",
  "state": "MD",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2022",
  "summary": "A nonprofit green bank in MD, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2022. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. NGA says it was established in 2008, with a board appointed by the Governor.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2022"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "National Governors Association: Green Banks, an overview for governors (May 2023)",
    "url": "https://www.nga.org/wp-content/uploads/2023/05/2023May_State_Green_Banks_Issue_Brief.pdf"
   }
  ]
 },
 {
  "id": "GB-021",
  "category": "Green bank",
  "name": "Massachusetts Community Climate Bank",
  "operator": "Massachusetts Community Climate Bank",
  "state": "MA",
  "utilityType": "Quasi-public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Quasi-public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2023",
  "summary": "A quasi-public green bank in MA, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2023. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Quasi-public"
   },
   {
    "label": "Founded",
    "value": "2023"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-023",
  "category": "Green bank",
  "name": "Minnesota Climate Innovation Finance Authority",
  "operator": "Minnesota Climate Innovation Finance Authority",
  "state": "MN",
  "utilityType": "Public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2023",
  "summary": "A public green bank in MN, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2023. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Subawardee.",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Public"
   },
   {
    "label": "Founded",
    "value": "2023"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-024",
  "category": "Green bank",
  "name": "Fund for a Green Mississippi",
  "operator": "Fund for a Green Mississippi",
  "state": "MS",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2023",
  "summary": "A nonprofit green bank in MS, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2023. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2023"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-025",
  "category": "Green bank",
  "name": "Missouri Green Banc",
  "operator": "Missouri Green Banc",
  "state": "MO",
  "utilityType": "Quasi-public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Quasi-public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2017",
  "summary": "A quasi-public green bank in MO, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2017. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Subawardee (State Environmental Improvement and Energy Resources Authority).",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Quasi-public"
   },
   {
    "label": "Founded",
    "value": "2017"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-026",
  "category": "Green bank",
  "name": "Nevada Clean Energy Fund",
  "operator": "Nevada Clean Energy Fund",
  "state": "NV",
  "utilityType": "Quasi-public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Quasi-public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2017",
  "summary": "A quasi-public green bank in NV, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2017. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source stated: $1M state appropriation for operations. NGA says it was capitalized with unused American Recovery and Reinvestment Act funds through the Governor's Office of Energy. The Coalition for Green Capital network lists it as: Emerging Green Bank.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Quasi-public"
   },
   {
    "label": "Founded",
    "value": "2017"
   },
   {
    "label": "Capital source",
    "value": "$1M state appropriation for operations"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   },
   {
    "title": "National Governors Association: Green Banks, an overview for governors (May 2023)",
    "url": "https://www.nga.org/wp-content/uploads/2023/05/2023May_State_Green_Banks_Issue_Brief.pdf"
   }
  ]
 },
 {
  "id": "GB-027",
  "category": "Green bank",
  "name": "New Jersey Green Bank",
  "operator": "New Jersey Green Bank",
  "state": "NJ",
  "utilityType": "Public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2024",
  "summary": "A public green bank in NJ, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2024. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Subawardee.",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Public"
   },
   {
    "label": "Founded",
    "value": "2024"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-028",
  "category": "Green bank",
  "name": "New Mexico Climate Investment Center",
  "operator": "New Mexico Climate Investment Center",
  "state": "NM",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2024",
  "summary": "A nonprofit green bank in NM, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2024. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank.",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2024"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-029",
  "category": "Green bank",
  "name": "NYCEEC (New York City Energy Efficiency Corporation)",
  "operator": "NYCEEC (New York City Energy Efficiency Corporation)",
  "state": "NY",
  "utilityType": "Quasi-public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Local"
  ],
  "businessModel": "Quasi-public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2010",
  "summary": "A quasi-public green bank in NY, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2010. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Subawardee.",
  "risks": [
   "Evidence thin",
   "Local, not statewide"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Quasi-public"
   },
   {
    "label": "Founded",
    "value": "2010"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-030",
  "category": "Green bank",
  "name": "NY Green Bank",
  "operator": "NY Green Bank",
  "state": "NY",
  "utilityType": "Public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Public lender",
  "scale": "$2.5B invested to date ($7.9B total capital)",
  "mw": null,
  "timing": "Founded 2013",
  "summary": "A public green bank in NY, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2013. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "Reported investment: $2.5B invested to date ($7.9B total capital).",
  "modelNote": "Capital source stated: Ratepayer and RGGI funds, per NGA. NGA describes it as a division of NYSERDA, with its mandate expanded in 2019, and notes a $314 million liquidity enhancement from a 2021 portfolio sale to Bank of America. The Coalition for Green Capital network lists it as: Subawardee.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Public"
   },
   {
    "label": "Founded",
    "value": "2013"
   },
   {
    "label": "Capital source",
    "value": "Ratepayer and RGGI funds, per NGA"
   },
   {
    "label": "Investment",
    "value": "$2.5B invested to date ($7.9B total capital)"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   },
   {
    "title": "National Governors Association: Green Banks, an overview for governors (May 2023)",
    "url": "https://www.nga.org/wp-content/uploads/2023/05/2023May_State_Green_Banks_Issue_Brief.pdf"
   }
  ]
 },
 {
  "id": "GB-031",
  "category": "Green bank",
  "name": "Freedmen Green Bank & Trust",
  "operator": "Freedmen Green Bank & Trust",
  "state": "NC",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2023",
  "summary": "A nonprofit green bank in NC, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2023. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank (Freedmen Capital Foundation, listed under Georgia).",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2023"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-032",
  "category": "Green bank",
  "name": "North Carolina Clean Energy Fund",
  "operator": "North Carolina Clean Energy Fund",
  "state": "NC",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2018",
  "summary": "A nonprofit green bank in NC, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2018. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank (covers North and South Carolina).",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2018"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-033",
  "category": "Green bank",
  "name": "Growth Opportunity Partners",
  "operator": "Growth Opportunity Partners",
  "state": "OH",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2022",
  "summary": "A nonprofit green bank in OH, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2022. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2022"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-034",
  "category": "Green bank",
  "name": "Columbus Region Green Fund",
  "operator": "Columbus Region Green Fund",
  "state": "OH",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Local"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2020",
  "summary": "A nonprofit green bank in OH, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2020. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin",
   "Local, not statewide"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2020"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-035",
  "category": "Green bank",
  "name": "Philadelphia Green Capital Corporation",
  "operator": "Philadelphia Green Capital Corporation",
  "state": "PA",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Local"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2021",
  "summary": "A nonprofit green bank in PA, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2021. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank.",
  "risks": [
   "Evidence thin",
   "Local, not statewide"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2021"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-036",
  "category": "Green bank",
  "name": "Puerto Rico Green Energy Trust",
  "operator": "Puerto Rico Green Energy Trust",
  "state": "PR",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2019",
  "summary": "A nonprofit green bank in PR, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2019. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2019"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-037",
  "category": "Green bank",
  "name": "Rhode Island Infrastructure Bank",
  "operator": "Rhode Island Infrastructure Bank",
  "state": "RI",
  "utilityType": "Public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2015",
  "summary": "A public green bank in RI, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2015. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. NGA says it began in 1989 as the Clean Water Finance Agency and expanded in 2015, funded by state appropriations, federal grants and bond and product revenues.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Public"
   },
   {
    "label": "Founded",
    "value": "2015"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "National Governors Association: Green Banks, an overview for governors (May 2023)",
    "url": "https://www.nga.org/wp-content/uploads/2023/05/2023May_State_Green_Banks_Issue_Brief.pdf"
   }
  ]
 },
 {
  "id": "GB-038",
  "category": "Green bank",
  "name": "Memphis Metropolitan Green Financial Corporation",
  "operator": "Memphis Metropolitan Green Financial Corporation",
  "state": "TN",
  "utilityType": "Public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Local"
  ],
  "businessModel": "Public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2024",
  "summary": "A public green bank in TN, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2024. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin",
   "Early stage",
   "Local, not statewide"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Public"
   },
   {
    "label": "Founded",
    "value": "2024"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-039",
  "category": "Green bank",
  "name": "Clean Energy Fund of Texas",
  "operator": "Clean Energy Fund of Texas",
  "state": "TX",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2022",
  "summary": "A nonprofit green bank in TX, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2022. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank.",
  "risks": [
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2022"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-040",
  "category": "Green bank",
  "name": "SustainEnergyFinance",
  "operator": "SustainEnergyFinance",
  "state": "UT",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2024",
  "summary": "A nonprofit green bank in UT, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2024. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated. The Coalition for Green Capital network lists it as: Emerging Green Bank (Sustain Energy Finance).",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2024"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   },
   {
    "title": "Coalition for Green Capital: Our network",
    "url": "https://coalitionforgreencapital.com/about-us/our-network-2/"
   }
  ]
 },
 {
  "id": "GB-041",
  "category": "Green bank",
  "name": "Green Bank for Rural America",
  "operator": "Green Bank for Rural America",
  "state": "VA",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2024",
  "summary": "A nonprofit green bank in VA, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2024. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2024"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-042",
  "category": "Green bank",
  "name": "Washington State Green Bank",
  "operator": "Washington State Green Bank",
  "state": "WA",
  "utilityType": "Nonprofit green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Nonprofit lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2024",
  "summary": "A nonprofit green bank in WA, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2024. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Nonprofit"
   },
   {
    "label": "Founded",
    "value": "2024"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "GB-043",
  "category": "Green bank",
  "name": "Wisconsin Green Innovation Fund",
  "operator": "Wisconsin Green Innovation Fund",
  "state": "WI",
  "utilityType": "Public green bank",
  "status": "Operating",
  "technologies": [
   "Green bank",
   "Statewide or not stated"
  ],
  "businessModel": "Public lender",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Founded 2024",
  "summary": "A public green bank in WI, listed in Brown University's 2025 appendix of US green banks (data as of Feb 2025). Founded 2024. The source does not say what it financed or how much beyond the figures shown.",
  "outcomes": "No investment figures given in the source.",
  "modelNote": "Capital source not stated.",
  "risks": [
   "Evidence thin",
   "Early stage"
  ],
  "riskNote": null,
  "confidence": "Low",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Public"
   },
   {
    "label": "Founded",
    "value": "2024"
   },
   {
    "label": "Capital source",
    "value": "Not stated"
   },
   {
    "label": "Investment",
    "value": "Not stated"
   }
  ],
  "sources": [
   {
    "title": "Brown University Climate Solutions Lab: US Green Banks, Appendix A (Apr 2025)",
    "url": "https://climate.watson.brown.edu/sites/default/files/papers/CSL%20White%20Paper%20on%20US%20Green%20Banks.pdf"
   }
  ]
 },
 {
  "id": "VPP-028",
  "category": "VPP",
  "name": "Connected Homes VPP (MMWEC NextZero)",
  "operator": "MMWEC, for 18 participating Massachusetts public power utilities",
  "state": "MA",
  "utilityType": "Public power (municipal)",
  "status": "Operating",
  "technologies": [
   "Thermostats",
   "Batteries",
   "EVs",
   "Water heaters"
  ],
  "businessModel": "Utility-run program",
  "scale": "More than 4,500 enrolled devices; more than 10 MW available per demand response event statewide",
  "mw": 10,
  "timing": "Launched 2020; Tesla Powerwall integration added Dec 2025",
  "summary": "A joint action agency that pools small municipal utilities into one virtual power plant. Customers enroll thermostats, EV chargers, water heaters and home batteries, and MMWEC dispatches them for peak events.",
  "outcomes": "From January through May 2026, 15 enrolled batteries reduced peak demand by 600 kW. Customers earn $5 to $30 a month depending on the utility, and batteries earn $30 a month. Enrolled devices include about 3,000 HVAC devices, 1,000 EVs and chargers, 75 water heaters and more than 15 batteries.",
  "modelNote": "MMWEC is a wholesale agency, so each small municipal utility does not need its own platform. Battery customers can also get an upfront incentive of up to $100 per kWh (capped at 20 kWh) depending on the utility, plus a $90 quarterly credit per Powerwall.",
  "risks": [
   "Self-reported results",
   "Small battery count"
  ],
  "riskNote": "The trade article says 18 utilities take part in the battery program, but Tesla's enrollment page lists seven eligible municipal utilities plus Concord Light. The count may differ by device type.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Structure",
    "value": "Joint action agency serving municipal light departments"
   },
   {
    "label": "Event limits",
    "value": "Up to 5 events a month, 170 hours a year, 4 hours each (Tesla page)"
   },
   {
    "label": "Dispatch hours",
    "value": "Weekdays 4 to 8 PM"
   }
  ],
  "sources": [
   {
    "title": "Public Power magazine: finding flexible capacity, how public power sees promise in VPPs",
    "url": "https://www.publicpower.org/periodical/article/finding-flexible-capacity-how-public-power-sees-promise-virtual-power-plants"
   },
   {
    "title": "Tesla: VPP powered by MMWEC NextZero Connected Homes",
    "url": "https://tesla.com/support/energy/virtual-power-plant/MMWEC"
   }
  ]
 },
 {
  "id": "VPP-029",
  "category": "VPP",
  "name": "Platte River and EnergyHub 39 MW VPP",
  "operator": "Platte River Power Authority",
  "state": "CO",
  "utilityType": "Public power (municipal)",
  "status": "In development",
  "technologies": [
   "Thermostats",
   "EVs",
   "Batteries",
   "Multi-DER"
  ],
  "businessModel": "Utility-run program",
  "scale": "39 MW target: 19 MW customer-owned resources by 2030 plus 20 MW from four 5 MW utility batteries",
  "mw": 39,
  "timing": "Agreement signed June 2026; first program planned late summer 2026",
  "summary": "A wholesale public power supplier for Estes Park, Fort Collins, Longmont and Loveland is building a VPP on EnergyHub's platform, starting with smart thermostats and EV charge management.",
  "outcomes": "No results yet. As of a June 2026 report, no program had launched.",
  "modelNote": "The existing Efficiency Works customer program will offer the VPP products. Separately, Platte River has a contract for a battery of up to 100 MW and 400 MWh near Severance, owned by a NextEra subsidiary, with in-service planned for late 2026.",
  "risks": [
   "Not yet operating",
   "Targets may change"
  ],
  "riskNote": "An earlier trade article gave goals of 20 MW of flexible customer load plus 20 MW of batteries; the June 2026 report gives 19 MW plus 20 MW. The final size depends on program cost-effectiveness.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Vendor",
    "value": "EnergyHub"
   },
   {
    "label": "Member communities",
    "value": "Estes Park, Fort Collins, Longmont, Loveland"
   }
  ],
  "sources": [
   {
    "title": "Utility Dive: Platte River, EnergyHub partner to deploy 39-MW Colorado VPP",
    "url": "https://www.utilitydive.com/news/platte-river-energyhub-partner-to-deploy-39-mw-colorado-vpp/823634/"
   },
   {
    "title": "Public Power magazine: finding flexible capacity",
    "url": "https://www.publicpower.org/periodical/article/finding-flexible-capacity-how-public-power-sees-promise-virtual-power-plants"
   },
   {
    "title": "Public Power magazine: Platte River first large-scale battery",
    "url": "https://www.publicpower.org/periodical/article/platte-river-power-authority-details-plans-its-first-large-scale-battery-energy-storage-system"
   }
  ]
 },
 {
  "id": "VPP-030",
  "category": "VPP",
  "name": "My Energy Optimizer battery and thermostat programs",
  "operator": "Sacramento Municipal Utility District (SMUD)",
  "state": "CA",
  "utilityType": "Public power (municipal)",
  "status": "Operating",
  "technologies": [
   "Batteries",
   "Thermostats",
   "EVs"
  ],
  "businessModel": "Utility-run program",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Residential battery VPP launched with Swell Energy in 2023",
  "summary": "A large municipal utility runs a portfolio of flexible-load programs: thermostats, residential batteries, Peak Conserve, commercial batteries and a managed EV charging pilot. Residential batteries now enroll through Tesla's app.",
  "outcomes": "No dispatch results found. The Tesla enrollment page lists an upfront incentive of $5,400 per Powerwall (up to $10,000 a household) plus $110 a quarter per Powerwall, with the upfront amount scheduled to fall to $3,240 (up to $6,000) from Sept 23, 2026. Events can be called up to about 20 a month and 240 a year.",
  "modelNote": "Batteries must be on SMUD's Solar and Storage Rate, which SMUD raised its export credit for from 7.4 to 9.6 cents per kWh on June 1, 2026.",
  "risks": [
   "Vendor failure",
   "Incentives falling",
   "No results found"
  ],
  "riskNote": "SMUD paused new enrollments in its earlier Swell Energy program (Partners+) in Aug 2024 after reports that Swell was shutting down, and said it would honor existing commitments. The 2026 sources show enrollment through Tesla; I did not find a SMUD statement describing the transition.",
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Earlier vendor",
    "value": "Swell Energy (Partners+, target 10 MW and 1,500 customers by 2025)"
   },
   {
    "label": "Customer terms",
    "value": "One-year agreement, 20% backup reserve, opt out of events in the app"
   }
  ],
  "sources": [
   {
    "title": "Tesla: SMUD virtual power plant",
    "url": "https://tesla.com/support/energy/virtual-power-plant/smud"
   },
   {
    "title": "SMUD: boosts Solar and Storage Compensation rate (Apr 27, 2026)",
    "url": "https://www.smud.org/Corporate/About-us/News-and-Media/2026/2026/SMUD-boosts-Solar-and-Storage-Compensation-rate-for-rooftop-solar-customers"
   },
   {
    "title": "Renewable Energy World: utility pauses VPP program after Swell shutdown news (Aug 2024)",
    "url": "https://www.renewableenergyworld.com/?p=80798112865"
   },
   {
    "title": "SMUD board president remarks listing VPP programs (Climate Center, 2025)",
    "url": "https://theclimatecenter.org/wp-content/uploads/2025/04/Gregg-Fishman-SMUD.pdf"
   }
  ]
 },
 {
  "id": "PRG-004",
  "category": "Program",
  "name": "Distributed Energy Resources program (equitable access)",
  "operator": "Seattle City Light",
  "state": "WA",
  "utilityType": "Public power (municipal)",
  "status": "In development",
  "technologies": [
   "Rooftop solar",
   "Batteries",
   "Community solar"
  ],
  "businessModel": "Utility-run program",
  "scale": "Not stated in sources",
  "mw": null,
  "timing": "Interconnection handbook published Jan 2026; web page announced Aug 2026",
  "summary": "A municipal utility's effort to lower barriers to rooftop solar, batteries and other distributed resources, with a central web page, an installer interconnection handbook, and planned community solar, solar credit sharing and higher incentives.",
  "outcomes": "No capacity or participation figures reported. The web page and handbook are live; the new programs are planned without launch dates.",
  "modelNote": "The stated goal is to address historic inequities in access to distributed energy.",
  "risks": [
   "Planned items undated",
   "Evidence thin"
  ],
  "riskNote": null,
  "confidence": "Medium",
  "categoryFields": [
   {
    "label": "Planned",
    "value": "Community solar program, solar credit allocation program, increased incentives"
   }
  ],
  "sources": [
   {
    "title": "Public Power magazine: Seattle City Light aims to increase equitable access to DERs (Aug 12, 2026)",
    "url": "https://www.publicpower.org/periodical/article/seattle-city-light-aims-increase-equitable-access-distributed-energy-resources"
   }
  ]
 }
];


export const pilotExample: PilotForm = {
 "title": "Sensor-informed office digital twin for thermostat decision support",
 "sponsor": "Department of Civil, Construction and Environmental Engineering, University of Alabama (C. D. Ponnan, Q. L. Duan)",
 "site": "Small office; exact location not stated (university is in Tuscaloosa, AL)",
 "technology": "Building controls and efficiency",
 "stage": "2 Field prototype",
 "hypothesis": "Low-cost sensors and a predictive digital twin can forecast indoor temperature 30 minutes ahead and support thermostat setpoint recommendations without modifying the HVAC system.",
 "comparator": "Persistence baseline (next value equals the current value)",
 "primary_metric": "30-minute-ahead indoor temperature error (MAE and RMSE, °C), leave-one-session-out",
 "success_threshold": "",
 "secondary_metrics": "Setpoint recommendations (22, 23, 24, 25 °C) under comfort-priority and energy-priority strategies",
 "duration_sample": "Monitoring Sept 7 to 8, 2026; 5-minute logging; four held-out sessions",
 "stop_rule": "",
 "funder": "Not stated",
 "regulatory_path": "None (research only)",
 "data_sharing": "",
 "status": "Completed",
 "result": "Not met",
 "result_summary": "The persistence baseline had lower error than the Random Forest model (MAE 0.219 vs 0.616 °C; RMSE 0.347 vs 0.726 °C, as read from the poster). Authors attribute this to stable indoor conditions over a 30-minute horizon, a small dataset and few sessions. The setpoint tool is a decision-support prototype; an operator applies changes by hand.",
 "protocol_changes": "None reported",
 "evaluator": "Authors only",
 "published_in": "Conference poster with American Solar Energy Society branding; peer review status not stated"
};
