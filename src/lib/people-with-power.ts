// People With Power — Austin Energy leadership paired with the first arrival of each
// generation resource type. Every date and biography line below is tied to a public source
// in SOURCES. Where the public record is thin, the field is null and the UI renders an
// explicit "not documented" marker rather than a guess.

export interface Leader {
  name: string;
  /** Human-readable tenure, e.g. "2010 – 2016". */
  tenure: string;
  startYear: number | null;
  endYear: number | null;
  /** Job title held while running the utility. */
  title: string;
  /** Where they came from immediately before the job, or null if not documented. */
  cameFrom: string | null;
  /** Professional discipline / career track, or null if not documented. */
  background: string | null;
  /** Characterization of the perspective they publicly brought. Interpretive, sourced. */
  perspective: string | null;
  /** Source keys into SOURCES. */
  sources: string[];
}

export interface Milestone {
  /** Resource family, used for coloring. */
  fuel: "gas" | "coal" | "nuclear" | "wind" | "biomass" | "solar" | "localSolar" | "battery";
  resource: string;
  /** Display year or year range for first operation / program launch. */
  year: string;
  /** Numeric year used for sorting. */
  sortYear: number;
  what: string;
  /** Name of the leader in office at first operation, or null when not documented. */
  leader: string | null;
  /** Caveat about the leader attribution or the date itself. */
  note: string | null;
  /** Documented public framing by that leader at the time, or null. */
  framing: string | null;
  sources: string[];
  /** Date the contract / program was authorized, e.g. "Feb. 12, 2009". Null when not documented. */
  contractDate: string | null;
  /** Numeric year for sorting by contract date; falls back to sortYear when unknown. */
  contractSortYear: number | null;
  /** Leader running the utility when the contract was authorized, or null. */
  contractLeader: string | null;
  /** Caveat about the contract date or its leader attribution. */
  contractNote: string | null;
  /** Sources for the contract date. */
  contractSources: string[];
}


export const FUEL_COLOR: Record<Milestone["fuel"], string> = {
  gas: "#d97706",
  coal: "#991b1b",
  nuclear: "#7c3aed",
  wind: "#0ea5e9",
  biomass: "#15803d",
  solar: "#eab308",
  localSolar: "#f59e0b",
  battery: "#0891b2",
};

export const FUEL_LABEL: Record<Milestone["fuel"], string> = {
  gas: "Natural gas",
  coal: "Coal",
  nuclear: "Nuclear",
  wind: "Wind",
  biomass: "Biomass",
  solar: "Utility-scale solar",
  localSolar: "Customer-owned solar",
  battery: "Battery storage",
};

export const SOURCES: Record<string, { label: string; url: string }> = {
  travisArchives: {
    label: "Travis County Archives — City of Austin utility records",
    url: "https://archives.traviscountyhistory.org/agents/people/208",
  },
  nrcMoore: {
    label: "NRC correspondence from John Moore, Director, Electric Utility (1994)",
    url: "https://www.nrc.gov/docs/ML2009/ML20092B018.pdf",
  },
  councilMinutes1990: {
    label: "Austin City Council minutes, Electric Utility Commission report (1990)",
    url: "https://www.austintexas.gov/edims/document.cfm?id=11841",
  },
  garzaDeparture: {
    label: "Austin Monitor — Garza named general manager of Pedernales Electric Co-op (2008)",
    url: "https://austinmonitor.com/stories/2008/01/garza-named-general-manager-of-pedernales-electric-co-op/",
  },
  garzaPec: {
    label: "Austin American-Statesman — Fired Pedernales Electric manager (2010)",
    url: "https://www.statesman.com/story/business/2010/09/21/fired-pedernales-electric-manager-has/6680049007/",
  },
  duncanNamed: {
    label: "Austin Monitor — Duncan named Austin Energy general manager (2008)",
    url: "https://austinmonitor.com/stories/2008/02/duncan-named-austin-energy-general-manager/",
  },
  duncanProfile: {
    label: "Austin Chronicle — Roger Duncan profile",
    url: "https://www.austinchronicle.com/news/roger-duncans-night-visions-11742467/",
  },
  weisHired: {
    label: "Austin Chronicle — Austin Energy's newest general manager (2010)",
    url: "https://www.austinchronicle.com/news/austin-energys-newest-general-manager-12080222/",
  },
  weisSalary: {
    label: "Austin Monitor — Weis would be city's highest paid employee (2010)",
    url: "https://austinmonitor.com/stories/2010/07/weis-would-be-citys-highest-paid-employee-as-gm-of-austin-energy/",
  },
  weisCpp: {
    label: "Austin Monitor — Austin Energy supports Clean Power Plan (2015)",
    url: "https://austinmonitor.com/stories/2015/11/austin-energy-supports-clean-power-plan/",
  },
  weisResign: {
    label: "Austin Monitor — Austin Energy's GM resigns to take Seattle post (2015)",
    url: "https://austinmonitor.com/stories/2015/11/austin-energys-gm-resigns-take-seattle-post/",
  },
  sargentBio: {
    label: "ETS17 — Jackie Sargent biography",
    url: "https://ets17.com/item/jackie-sargent/",
  },
  sargentRetire: {
    label: "City of Austin — Sargent retirement announcement (2023)",
    url: "https://thetexan.news/app/uploads/2023/2023-03-31_-JSargent-Announcement.pdf",
  },
  sargentInterview: {
    label: "Public Utilities Fortnightly — Jackie Sargent interview (2019)",
    url: "https://www.fortnightly.com/fortnightly/2019/07/fortnightly-smartest-communities-jackie-sargent",
  },
  kahnReport: {
    label: "Austin Energy FY2024 Annual Report — general manager letter",
    url: "https://austinenergy.com/-/media/project/websites/austinenergy/about/pdfs/2024_annual_report.pdf",
  },
  kahnRetire: {
    label: "Austin Monitor — GM Bob Kahn retiring (2025)",
    url: "https://austinmonitor.com/stories/2025/04/austin-energy-general-manager-bob-kahn-retiring/",
  },
  reillyAppointed: {
    label: "Austin Energy — Stuart Reilly appointed general manager (Oct. 2025)",
    url: "https://austinenergy.com/about/news/news-releases/2025/City-of-Austin-Appoints-Stuart-Reilly-as-General-Manager-of-Austin-Energy",
  },
  reillyMessage: {
    label: "Austin Energy — Austin's clean energy future still requires reliable backup (2026)",
    url: "https://austinenergy.com/about/news/news-releases/2026/Austins-Clean-Energy-Future-Still-Requires-Reliable-Backup",
  },
  seaholm: {
    label: "Seaholm Power Plant history",
    url: "https://en.wikipedia.org/wiki/Seaholm_Power_Plant",
  },
  holly: {
    label: "Holly Street Power Plant history",
    url: "https://en.wikipedia.org/wiki/Holly_Street_Power_Plant",
  },
  aePlants: {
    label: "Austin Energy — power plants and electric system profile",
    url: "https://austinenergy.com/about/company-profile/electric-system/power-plants",
  },
  fayette: {
    label: "Fayette Power Project history",
    url: "https://en.wikipedia.org/wiki/Fayette_Power_Project",
  },
  fayetteEia: {
    label: "EIA plant record — Fayette Power Project (unit online dates)",
    url: "https://www.interconnection.fyi/eia/plant/6179",
  },
  stpLicense: {
    label: "NRC Operating License NPF-76, South Texas Project Unit 1",
    url: "https://www.nrc.gov/docs/ML2014/ML20148G084.pdf",
  },
  delawareMountain: {
    label: "Windpower Monthly — Texas 30 MW phase on line (1996)",
    url: "https://www.windpowermonthly.com/article/960525/texas-30-mw-phase-on-line",
  },
  rebateRca: {
    label: "City of Austin Council item — solar PV rebate program (May 27, 2004)",
    url: "https://www.austintexas.gov/edims/document.cfm?id=76413",
  },
  rebateChronicle: {
    label: "Austin Chronicle — Sun rises, finally, for AE (2004)",
    url: "https://www.austinchronicle.com/news/sun-rises-finally-for-ae-11719103/",
  },
  webberville: {
    label: "Austin Energy activates 30 MW solar farm (Jan. 2012)",
    url: "https://www.prnewswire.com/news-releases/austin-energy-activates-30-mw-solar-farm-136817858.html",
  },
  nacogdoches: {
    label: "Austin Monitor — Austin Energy's first biomass plant now in operation (2012)",
    url: "https://austinmonitor.com/stories/2012/07/austin-energys-first-biomass-power-plant-now-in-operation/",
  },
  batteryRca: {
    label: "City of Austin Council item — energy storage contract (Oct. 2015)",
    url: "https://services.austintexas.gov/edims/document.cfm?id=239917",
  },
  batteryStatesman: {
    label: "Austin American-Statesman — AE poised to test its first storage system (2016)",
    url: "https://www.statesman.com/story/news/2016/09/04/austin-energy-poised-to-test-its-first-energy-storage-system/9995279007/",
  },
};

export const LEADERS: Leader[] = [
  {
    name: "R.L. Hancock",
    tenure: "1970s era — dates not documented",
    startYear: null,
    endYear: null,
    title: "City of Austin electric utility leadership (era)",
    cameFrom: null,
    background: null,
    perspective: null,
    sources: ["travisArchives"],
  },
  {
    name: "John Moore",
    tenure: "Documented in the role 1989 – 1994",
    startYear: 1989,
    endYear: 1994,
    title: "Director, Electric Utility, City of Austin",
    cameFrom: null,
    background: null,
    perspective:
      "Represented Austin's stake in the South Texas Project before the NRC and carried routine Electric Utility Commission business to Council — the public record shows an oversight-and-administration role rather than a stated energy philosophy.",
    sources: ["nrcMoore", "councilMinutes1990"],
  },
  {
    name: "Juan Garza",
    tenure: "General manager through January 2008 (start year not documented)",
    startYear: null,
    endYear: 2008,
    title: "General Manager, Austin Energy",
    cameFrom: "Rose internally through City of Austin / Austin Energy management",
    background: "Career public-utility administrator and manager",
    perspective:
      "Framed his tenure around customer service and negotiating ratepayer outcomes. He left for Pedernales Electric Cooperative, which fired him in 2010 amid a governance controversy.",
    sources: ["garzaDeparture", "garzaPec"],
  },
  {
    name: "Roger Duncan",
    tenure: "January 2008 (interim) – September 2010",
    startYear: 2008,
    endYear: 2010,
    title: "General Manager, Austin Energy",
    cameFrom: "Austin Energy deputy GM for Distributed Energy Services",
    background:
      "Program builder rather than engineer — spent his career on efficiency, conservation and green-power programs",
    perspective:
      "The demand-side voice: publicly framed the utility's job as cutting load and building green-power programs first. He later became an energy research fellow at UT Austin.",
    sources: ["duncanNamed", "duncanProfile"],
  },
  {
    name: "Larry Weis",
    tenure: "September 2010 – January 2016",
    startYear: 2010,
    endYear: 2016,
    title: "General Manager, Austin Energy",
    cameFrom: "General manager / CEO of Turlock Irrigation District, California",
    background: "Career municipal-utility operations executive",
    perspective:
      "Hired as an operator, not an advocate — environmentalists questioned his renewables record at the time. In office he signed Austin Energy onto a legal brief backing the federal Clean Power Plan and oversaw the utility's first large solar, biomass and storage additions. Left to lead Seattle City Light.",
    sources: ["weisHired", "weisSalary", "weisCpp", "weisResign"],
  },
  {
    name: "Jackie Sargent",
    tenure: "August 2016 – 2023",
    startYear: 2016,
    endYear: 2023,
    title: "General Manager, Austin Energy",
    cameFrom:
      "Platte River Power Authority (Colorado); previously Austin Energy SVP of Power Supply and Market Operations, 2010 – 2012",
    background: "~30 years in the utility industry, power supply and market operations",
    perspective:
      "Consensus-and-community framing: emphasized stakeholder agreement, equity programs and keeping Austin Energy's clean-energy reputation intact while managing supply risk.",
    sources: ["sargentBio", "sargentRetire", "sargentInterview"],
  },
  {
    name: "Bob Kahn",
    tenure: "2023 – April 30, 2025",
    startYear: 2023,
    endYear: 2025,
    title: "General Manager, Austin Energy",
    cameFrom: null,
    background: null,
    perspective:
      "Reliability-first framing: his public letters center record summer and winter peaks and dependable service during rapid load growth.",
    sources: ["kahnReport", "kahnRetire"],
  },
  {
    name: "Stuart Reilly",
    tenure: "Interim May 2025; permanent since November 2, 2025",
    startYear: 2025,
    endYear: null,
    title: "General Manager, Austin Energy",
    cameFrom: "Austin Energy Deputy General Manager of Business Services (internal promotion)",
    background: "18+ years in public power, business-services and utility administration",
    perspective:
      "Publicly frames the current strategy as clean energy plus dispatchable backup generation to meet growth-driven demand.",
    sources: ["reillyAppointed", "reillyMessage"],
  },
];

export const MILESTONES: Milestone[] = [
  {
    fuel: "gas",
    resource: "Seaholm Power Plant",
    year: "1951",
    sortYear: 1951,
    what: "Austin's downtown gas-fired steam plant opens; it runs until 1996.",
    leader: null,
    note: "Predates the modern general manager role — no named utility director is documented for this year.",
    framing: null,
    sources: ["seaholm"],
  },
  {
    fuel: "gas",
    resource: "Holly Street Power Plant",
    year: "1960",
    sortYear: 1960,
    what: "Second gas plant, in East Austin — later the focus of a decades-long neighborhood closure fight.",
    leader: null,
    note: "No named utility director documented for this year.",
    framing: null,
    sources: ["holly"],
  },
  {
    fuel: "coal",
    resource: "Fayette Power Project, Unit 1",
    year: "1979",
    sortYear: 1979,
    what: "Austin's first coal generation, co-owned with LCRA. Unit 2 followed in 1980.",
    leader: null,
    note: "No named Austin utility director is documented in public sources at the time Unit 1 came online.",
    framing: null,
    sources: ["fayetteEia", "fayette"],
  },
  {
    fuel: "nuclear",
    resource: "South Texas Project, Unit 1",
    year: "1988",
    sortYear: 1988,
    what: "Austin's minority share of the nuclear plant finally starts producing, a decade behind schedule.",
    leader: null,
    note: "The director at startup is not documented. John Moore is documented as Director, Electric Utility from 1989, handling STP oversight with the NRC.",
    framing: null,
    sources: ["stpLicense", "nrcMoore"],
  },
  {
    fuel: "wind",
    resource: "Delaware Mountain Wind Farm (West Texas)",
    year: "1996 – 1999",
    sortYear: 1996,
    what: "First West Texas wind capacity feeding the Austin area, contracted regionally rather than built by Austin Energy.",
    leader: null,
    note: "Sources conflict on the online year (1996 phase vs. 1999 full operation), and no Austin Energy director is documented as the decision-maker on this regional contract.",
    framing: null,
    sources: ["delawareMountain"],
  },
  {
    fuel: "localSolar",
    resource: "Solar PV rebate program ($5/watt)",
    year: "2004",
    sortYear: 2004,
    what: "Council approves customer-sited solar rebates on May 27, 2004; the program launches that June — the start of rooftop solar as an Austin Energy resource.",
    leader: "Juan Garza",
    note: "Garza is documented as general manager through January 2008; his start year is not documented, so his tenure covering 2004 is inferred from that endpoint.",
    framing: null,
    sources: ["rebateRca", "rebateChronicle"],
  },
  {
    fuel: "solar",
    resource: "Webberville Solar Farm (30 MW)",
    year: "2012",
    sortYear: 2012,
    what: "Austin Energy's first utility-scale solar plant is activated on January 6, 2012.",
    leader: "Larry Weis",
    note: null,
    framing: null,
    sources: ["webberville"],
  },
  {
    fuel: "biomass",
    resource: "Nacogdoches Generating Facility (115 MW)",
    year: "2012",
    sortYear: 2012.5,
    what: "A 20-year biomass power purchase agreement begins commercial operation in mid-2012.",
    leader: "Larry Weis",
    note: null,
    framing: null,
    sources: ["nacogdoches"],
  },
  {
    fuel: "battery",
    resource: "Kingsbery substation storage; community-solar battery",
    year: "2015 – 2016",
    sortYear: 2015,
    what: "Council authorizes Austin Energy's first grid battery contract in October 2015; the system is tested in September 2016.",
    leader: "Larry Weis, then Jackie Sargent",
    note: "The contract was authorized under Weis; the system was commissioned after Sargent took over in August 2016.",
    framing: null,
    sources: ["batteryRca", "batteryStatesman"],
  },
];

export const sortedMilestones = () => [...MILESTONES].sort((a, b) => a.sortYear - b.sortYear);

export const leaderByName = (name: string | null) =>
  name ? LEADERS.find((l) => name.includes(l.name)) ?? null : null;
