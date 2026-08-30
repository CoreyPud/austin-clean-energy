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

export interface Retirement {
  fuel: Milestone["fuel"];
  resource: string;
  /** Display date of the closure decision / council action, or null when not documented. */
  decisionDate: string | null;
  /** Numeric year for sorting. */
  decisionSortYear: number;
  /** Leader running the utility when the closure was decided, or null. */
  decisionLeader: string | null;
  /** Display date the units actually stopped running, or a status line if still running. */
  closedDate: string;
  /** Leader in office at actual shutdown, or null when not documented / not yet closed. */
  closedLeader: string | null;
  what: string;
  note: string | null;
  sources: string[];
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
  webbervilleRca: {
    label: "City of Austin Council item — Gemini Solar 30 MW PPA (Feb. 12, 2009)",
    url: "https://services.austintexas.gov/edims/document.cfm?id=125999",
  },
  webbervillePvTech: {
    label: "PV Tech — Austin City Council approves 30 MW solar plant, chooses Gemini Solar (2009)",
    url: "https://www.pv-tech.org/austin_city_council_approves_30-mw_solar_power_plant_chooses_gemini_solar/",
  },
  nacogdochesRca: {
    label: "City of Austin — Resource Management Commission recommendation, 20-year biomass PPA (Aug. 19, 2008)",
    url: "https://www.austintexas.gov/edims/document.cfm?id=120178",
  },
  nacogdochesCouncil: {
    label: "Austin Monitor — Council takes next step toward contract for biomass plant (Aug. 2008)",
    url: "https://austinmonitor.com/stories/2008/08/council-takes-next-step-toward-contract-for-biomass-plant/",
  },
  aeRenewables: {
    label: "Austin Energy — Renewable Power Generation (utility-scale fleet table)",
    url: "https://austinenergy.com/about/company-profile/environment/renewable-power-generation",
  },
  leeChronicle: {
    label: "Austin Chronicle — Utility Player (Milton Lee profile)",
    url: "https://www.austinchronicle.com/news/utility-player-11731343/",
  },
  leeMinutes: {
    label: "Austin City Council minutes referencing GM Milton Lee (1997)",
    url: "https://www.austintexas.gov/edims/document.cfm?id=56808",
  },
  seaholmHistory: {
    label: "Seaholm Development — plant history (generation ends 1989, final shutdown 1996)",
    url: "https://www.seaholmdevelopment.com/history.html",
  },
  hollyClosure1995: {
    label: "City of Austin Council backup — Holly Street phased closure resolution (Jan. 19, 1995)",
    url: "https://services.austintexas.gov/edims/document.cfm?id=144574",
  },
  hollyChronicle2007: {
    label: "Austin Chronicle — Holly Power Plant to Close, Really! (2007)",
    url: "https://www.austinchronicle.com/news/holly-power-plant-to-close-really-11730018/",
  },
  deckerMonitor: {
    label: "Austin Monitor — Decker Creek Power Station finally closing (June 2020)",
    url: "https://austinmonitor.com/stories/2020/06/decker-creek-power-station-finally-closing/",
  },
  deckerPortfolio: {
    label: "Austin Energy Generation Portfolio Update (Nov. 16, 2021) — Decker Unit 2 shutdown, Fayette talks stalled",
    url: "https://services.austintexas.gov/edims/document.cfm?id=371411",
  },
  genPlan2030: {
    label: "City of Austin — 2030 Austin Energy Generation Plan resolution materials (2020)",
    url: "https://services.austintexas.gov/edims/document.cfm?id=370826",
  },
  fayetteWatson: {
    label: "Austin American-Statesman — Watson proposes halting Fayette exit, targets 2029 (Feb. 2024)",
    url: "https://www.statesman.com/story/news/local/2024/02/23/kirk-watson-austin-energy-fayette-power-plant-halt-plans-back-out-2029-coal-powered-plants-texas/72659137007/",
  },
  aeOpsQ4Fy2025: {
    label: "Austin Energy Q4 FY2025 Operations Update — Fayette still listed as an active resource",
    url: "https://services.austintexas.gov/edims/document.cfm?id=462166",
  },
  roserockRca: {
    label: "City of Austin Council — Roserock/2014 solar PPA award materials",
    url: "https://services.austintexas.gov/edims/document.cfm?id=239849",
  },
  roserockStatesman: {
    label: "Austin American-Statesman — first of three contracted solar plants comes online (April 2017)",
    url: "https://digital.olivesoftware.com/Olive/ODN/AustinAmericanStatesman/shared/ShowArticle.aspx?doc=AAS%2F2017%2F04%2F09&entity=Ar00106",
  },
  wind2017Rca: {
    label: "City of Austin Council item — 15-year PPA, 200 MW wind facility (June 22, 2017)",
    url: "https://services.austintexas.gov/edims/document.cfm?id=279145",
  },
  blacklandRca: {
    label: "City of Austin Council item — East Blackland Solar 144 MW PPA (Oct. 18, 2018)",
    url: "https://services.austintexas.gov/edims/document.cfm?id=307252",
  },
  wind2019Rca: {
    label: "City of Austin Council item — 170 MW wind PPA with Pattern Energy (March 7, 2019)",
    url: "https://services.austintexas.gov/edims/document.cfm?id=315317",
  },
  communitySolarRate: {
    label: "City of Austin Council item — community solar rate for Customer Assistance Program (Dec. 14, 2017)",
    url: "https://services.austintexas.gov/edims/document.cfm?id=289226",
  },
  laLoma: {
    label: "Austin Community Solar — La Loma community solar project",
    url: "https://austincommunitysolar.com/",
  },
  jupiterRca: {
    label: "City of Austin Council item — battery tolling agreement, Balcones Ridge Resiliency (July 24, 2025)",
    url: "https://services.austintexas.gov/edims/document.cfm?id=454800",
  },
  jupiterRelease: {
    label: "Austin Energy — Austin Energy signs battery storage deal (Oct. 23, 2025)",
    url: "https://austinenergy.com/about/news/news-releases/2025/Austin-Energy-signs-Battery-Storage-Deal",
  },
  peaker2026Rca: {
    label: "City of Austin Council item 26-1880 — local natural gas peaker generation (May 19, 2026)",
    url: "https://services.austintexas.gov/edims/document.cfm?id=473412",
  },
  peakerKut: {
    label: "KUT — Austin Energy to build new natural gas plant (May 2026)",
    url: "https://www.kut.org/energy-environment/2026-05-21/austin-energy-tx-new-natural-gas-electricity-plant",
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
    contractDate: null,
    contractSortYear: null,
    contractLeader: null,
    contractNote:
      "City-built plant, not a purchase contract. No authorization date or named utility director is documented.",
    contractSources: ["seaholm"],
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
    contractDate: null,
    contractSortYear: null,
    contractLeader: null,
    contractNote:
      "City-built plant. The Council authorization date and the utility director at the time are not documented.",
    contractSources: ["holly"],
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
    contractDate: null,
    contractSortYear: null,
    contractLeader: null,
    contractNote:
      "The joint-ownership agreement with LCRA dates to the early 1970s, but no precise authorization date or named Austin utility director is documented.",
    contractSources: ["fayette"],
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
    contractDate: null,
    contractSortYear: null,
    contractLeader: null,
    contractNote:
      "Austin's participation dates to a 1970s bond-backed agreement; no exact authorization date or utility director of record is documented here.",
    contractSources: ["stpLicense"],
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
    contractDate: null,
    contractSortYear: null,
    contractLeader: null,
    contractNote:
      "Austin Energy describes buying wind power \"since the 1990s\" but publishes no contract date for its first wind purchase, and no signing date is documented.",
    contractSources: ["aeRenewables"],
  },
  {
    fuel: "localSolar",
    resource: "Solar PV rebate program ($5/watt)",
    year: "June 2004 (program launch)",
    sortYear: 2004,
    what: "Council approves customer-sited solar rebates; the program launches that June — the start of rooftop solar as an Austin Energy resource.",
    leader: "Juan Garza",
    note: "Garza is documented as general manager through January 2008; his start year is not documented, so his tenure covering 2004 is inferred from that endpoint.",
    framing: null,
    sources: ["rebateRca", "rebateChronicle"],
    contractDate: "May 27, 2004",
    contractSortYear: 2004,
    contractLeader: "Juan Garza",
    contractNote: "Council approval of the rebate program rather than a generation contract.",
    contractSources: ["rebateRca"],
  },
  {
    fuel: "solar",
    resource: "Webberville Solar Farm (30 MW)",
    year: "January 2012",
    sortYear: 2012,
    what: "Austin Energy's first utility-scale solar plant is activated on January 6, 2012 under a 25-year PPA with Gemini Solar.",
    leader: "Larry Weis",
    note: null,
    framing: null,
    sources: ["webberville", "aeRenewables"],
    contractDate: "Feb. 12, 2009 (Council authorization; award announced March 2009)",
    contractSortYear: 2009,
    contractLeader: "Roger Duncan",
    contractNote:
      "Decided three years before the ribbon-cutting: Duncan was general manager when Council authorized the PPA, Weis when it came online.",
    contractSources: ["webbervilleRca", "webbervillePvTech"],
  },
  {
    fuel: "biomass",
    resource: "Nacogdoches Generating Facility (105 MW)",
    year: "Mid-2012",
    sortYear: 2012.5,
    what: "A 20-year biomass power purchase agreement begins commercial operation. Austin Energy bought the plant outright in 2019.",
    leader: "Larry Weis",
    note: null,
    framing: null,
    sources: ["nacogdoches", "aeRenewables"],
    contractDate: "August 2008",
    contractSortYear: 2008,
    contractLeader: "Roger Duncan",
    contractNote:
      "Council authorized negotiation of the $2.3 billion, 20-year PPA in August 2008, on Duncan's watch, four years before the plant ran.",
    contractSources: ["nacogdochesRca", "nacogdochesCouncil"],
  },
  {
    fuel: "battery",
    resource: "Kingsbery substation storage; community-solar battery",
    year: "September 2016 (first test)",
    sortYear: 2015,
    what: "Austin Energy's first grid battery is contracted in 2015 and tested in September 2016.",
    leader: "Jackie Sargent",
    note: "The system was commissioned after Sargent took over in August 2016.",
    framing: null,
    sources: ["batteryRca", "batteryStatesman"],
    contractDate: "October 2015",
    contractSortYear: 2015,
    contractLeader: "Larry Weis",
    contractNote: "Council authorized the storage contract while Weis was general manager.",
    contractSources: ["batteryRca"],
  },
  {
    fuel: "solar",
    resource: "Roserock Solar (157.5 MW AC, Pecos County)",
    year: "Late 2016 / early 2017",
    sortYear: 2016.5,
    what: "The first of the large West Texas solar PPAs Austin Energy contracted in the mid-2010s reaches commercial operation.",
    leader: "Jackie Sargent",
    note: "Reporting places first power in late 2016 / spring 2017, after Sargent took office in August 2016.",
    framing: null,
    sources: ["roserockStatesman", "aeRenewables"],
    contractDate: "2014 – 2015 solar procurement authorization",
    contractSortYear: 2014,
    contractLeader: "Larry Weis",
    contractNote:
      "Council's October 2015 action authorized up to 350 MW of new solar PPAs on Weis's watch; the exact signing date for this specific plant is not documented.",
    contractSources: ["roserockRca"],
  },
  {
    fuel: "localSolar",
    resource: "Community solar (La Loma, Kingsbery substation)",
    year: "2018",
    sortYear: 2018,
    what: "Renters and customers who cannot put panels on their own roof can subscribe to a local solar array, with a discounted rate for Customer Assistance Program households.",
    leader: "Jackie Sargent",
    note: null,
    framing: null,
    sources: ["laLoma", "communitySolarRate"],
    contractDate: "Dec. 14, 2017 (community solar rate approval)",
    contractSortYear: 2017,
    contractLeader: "Jackie Sargent",
    contractNote:
      "Council approved the community solar rate structure; the underlying project PPA date is not documented.",
    contractSources: ["communitySolarRate"],
  },
  {
    fuel: "wind",
    resource: "200 MW wind PPA (facility unnamed in the council item)",
    year: "First operation not documented",
    sortYear: 2017.5,
    what: "A 15-year power purchase agreement for 200 MW of wind, part of the build-out that pushed Austin Energy's renewable share past half its supply.",
    leader: null,
    note: "The council item does not name the facility and no first-operation date is documented.",
    framing: null,
    sources: ["wind2017Rca"],
    contractDate: "June 22, 2017",
    contractSortYear: 2017,
    contractLeader: "Jackie Sargent",
    contractNote: null,
    contractSources: ["wind2017Rca"],
  },
  {
    fuel: "solar",
    resource: "East Blackland Solar Project 1 (144 MW)",
    year: "First operation not documented",
    sortYear: 2018.5,
    what: "A 15-year, roughly $165 million solar PPA — about $11 million a year — for capacity east of Austin.",
    leader: null,
    note: "No commercial-operation date for this plant is documented in the sources checked.",
    framing: null,
    sources: ["blacklandRca"],
    contractDate: "Oct. 18, 2018",
    contractSortYear: 2018,
    contractLeader: "Jackie Sargent",
    contractNote: null,
    contractSources: ["blacklandRca"],
  },
  {
    fuel: "wind",
    resource: "170 MW wind PPA (Pattern Energy Group)",
    year: "First operation not documented",
    sortYear: 2019,
    what: "A second large 15-year wind agreement, signed two years after the 200 MW deal.",
    leader: null,
    note: "No first-operation date is documented for this contract.",
    framing: null,
    sources: ["wind2019Rca"],
    contractDate: "March 7, 2019",
    contractSortYear: 2019,
    contractLeader: "Jackie Sargent",
    contractNote: null,
    contractSources: ["wind2019Rca"],
  },
  {
    fuel: "battery",
    resource: "Balcones Ridge Resiliency battery tolling agreement (up to 100 MW, Jupiter Power)",
    year: "Not yet in service",
    sortYear: 2025.5,
    what: "Austin Energy's first large grid-scale battery deal — up to 20 years, about $14.4 million a year, up to $288 million total.",
    leader: null,
    note: "The contract was signed in October 2025; no in-service date has been reported yet.",
    framing: null,
    sources: ["jupiterRelease"],
    contractDate: "July 24, 2025 (Council authorization); signed Oct. 23, 2025",
    contractSortYear: 2025,
    contractLeader: "Stuart Reilly",
    contractNote:
      "Authorized while Reilly was interim general manager, signed before his permanent appointment in November 2025. The storage RFP behind it went out in February 2025, under Bob Kahn.",
    contractSources: ["jupiterRca", "jupiterRelease"],
  },
  {
    fuel: "gas",
    resource: "New local natural gas peaker units",
    year: "Not yet built",
    sortYear: 2026,
    what: "Council backs building new gas-fired peaking generation as part of the resource plan to 2035 — the first new Austin gas capacity in decades. Reporting put the potential cost above $1 billion and criticized the closed-door process.",
    leader: null,
    note: "No units are in service; this row tracks the decision, not an operating plant.",
    framing:
      "Austin's clean energy future still requires reliable backup generation.",
    sources: ["peakerKut", "peaker2026Rca", "reillyMessage"],
    contractDate: "May 19, 2026 (Council item 26-1880)",
    contractSortYear: 2026,
    contractLeader: "Stuart Reilly",
    contractNote:
      "Approved as a direction to pursue peaker generation; costs were not disclosed publicly at the time of the vote.",
    contractSources: ["peaker2026Rca", "peakerKut"],
  },
];

export const RETIREMENTS: Retirement[] = [
  {
    fuel: "gas",
    resource: "Seaholm Power Plant (downtown)",
    decisionDate: null,
    decisionSortYear: 1989,
    decisionLeader: null,
    closedDate: "Stopped generating 1989; last generators shut down 1996",
    closedLeader: null,
    what: "Austin's original downtown steam plant goes dark and is later redeveloped into the Seaholm district.",
    note: "No council action or named utility director is documented for the shutdown decision. Milton Lee is documented as general manager later in the 1990s, but no source ties him to this closure.",
    sources: ["seaholmHistory", "seaholm"],
  },
  {
    fuel: "gas",
    resource: "Holly Street Power Plant (East Austin)",
    decisionDate: "Jan. 19, 1995 (Council resolution for phased closure)",
    decisionSortYear: 1995,
    decisionLeader: null,
    closedDate: "September 2007 (final units)",
    closedLeader: "Juan Garza",
    what: "After a decades-long neighborhood campaign — a closure committee was seated in 1993 — Council ordered a phased shutdown and the last units came off in 2007. Decommissioning ran into the 2010s.",
    note: "No source names the general manager at the 1995 vote; Milton Lee is documented as GM later in the 1990s. Garza is placed at the 2007 closure by his documented tenure through January 2008, not by a source naming him on Holly.",
    sources: ["hollyClosure1995", "hollyChronicle2007", "holly"],
  },
  {
    fuel: "gas",
    resource: "Decker Creek steam Units 1 and 2",
    decisionDate: "March 2020 (2030 Generation Plan, adopted unanimously)",
    decisionSortYear: 2020,
    decisionLeader: "Jackie Sargent",
    closedDate: "Unit 1 fall 2020; Unit 2 March 2022",
    closedLeader: "Jackie Sargent",
    what: "Austin Energy retires its two aging gas steam units at Decker. The four gas turbines on the site stayed online.",
    note: "The four Decker gas turbines were not retired and remain part of the fleet.",
    sources: ["deckerMonitor", "deckerPortfolio", "genPlan2030"],
  },
  {
    fuel: "coal",
    resource: "Fayette Power Project — Austin's coal share",
    decisionDate: "March 2020 (2030 Generation Plan: stop burning coal by end of 2022)",
    decisionSortYear: 2020,
    decisionLeader: "Jackie Sargent",
    closedDate: "Still operating — exit not completed as of the FY2025 Q4 update",
    closedLeader: null,
    what: "Council committed to exiting Austin's Fayette coal share by the end of 2022. Negotiations with co-owner LCRA stalled in 2021, Mayor Watson proposed a 2029 divestment target in 2024, and Austin Energy still listed Fayette as an active resource in late 2025.",
    note: "This is the clearest case of a retirement decision outliving the leader who made it: decided under Sargent, stalled under Kahn, still unresolved under Reilly.",
    sources: ["genPlan2030", "deckerPortfolio", "fayetteWatson", "aeOpsQ4Fy2025"],
  },
];

/** Sorted oldest-first by the year the closure was decided. */
export const sortedRetirements = () =>
  [...RETIREMENTS].sort((a, b) => a.decisionSortYear - b.decisionSortYear);


export const sortedMilestones = () => [...MILESTONES].sort((a, b) => a.sortYear - b.sortYear);

/** Sorted by contract authorization date, falling back to first-operation year when undocumented. */
export const milestonesByContract = () =>
  [...MILESTONES].sort((a, b) => (a.contractSortYear ?? a.sortYear) - (b.contractSortYear ?? b.sortYear));


export const leaderByName = (name: string | null) =>
  name ? LEADERS.find((l) => name.includes(l.name)) ?? null : null;
