// Secret Vote — "The Innovation Gap" page content.
// Companion to the main Timeline (which stays Austin-Energy-only). This page
// pairs each Austin Energy "first"/"innovative" program claim against the
// peer utility that actually did it first, so the gap is visible rather than
// asserted. Every date and figure carries a sourceLabel — edit freely, but
// keep the citation intact.

export interface Milestone {
  date: string;
  year: number; // decimal year, used only to place the marker on the axis
  who: string;
  label: string;
  detail: string;
  sourceLabel: string;
  sourceUrl?: string;
}

export interface GapThread {
  id: string;
  kicker: string;
  title: string;
  dek: string;
  axisStart: number;
  axisEnd: number;
  axisTicks: number[];
  peer: Milestone;
  // Additional peer examples beyond the primary one, e.g. when "several
  // utilities already do this" is the point. Shown as unlabeled dots on the
  // axis (to avoid label collisions) with their own cards below — same
  // pattern the single peerSecondary slot used before this was generalized
  // to an array.
  peerOthers?: Milestone[];
  ae: Milestone | null;
  gapYears: number | null;
  gapLabel: string;
  note: string;
}

// A trend thread is a different shape than a GapThread: instead of pairing
// one Austin Energy date against one peer date, it plots Austin Energy's own
// measured performance over time against a peer's published commitment.
// Used where the story isn't "AE was late" but "AE won't say, and here's
// what its own numbers show."
export interface TrendPoint {
  year: number;
  days: number;
  n: number;
  provisional?: boolean; // not all of that year's cases had resolved when measured
}

export interface CommitmentStat {
  who: string;
  value: string; // e.g. "No published commitment" or "10–20 business days"
  detail: string;
  sourceLabel: string;
  sourceUrl?: string;
  // Reuses the same card coloring as MilestoneCard: "none" (red, a gap/
  // absence), "peer" (green, what a comparable utility does), "ae" (amber,
  // Austin Energy's own measured reality).
  tone: "none" | "peer" | "ae";
}

export interface TrendThread {
  id: string;
  kicker: string;
  title: string;
  dek: string;
  series: TrendPoint[];
  seriesLabel: string;
  commitments: CommitmentStat[];
  note: string;
}

export const trends: TrendThread[] = [
  {
    id: "interconnection-speed",
    kicker: "SOLAR INTERCONNECTION SPEED",
    title: "Doesn't publish a timeline. The data shows why.",
    dek:
      "Austin Energy's own 2026 solar permitting manual sets no timeline for interconnection review or Permission to Operate — the manual states a 3-day window only for scheduling an inspection appointment, nothing for how long review or approval itself takes. CPS Energy, a comparably sized Texas municipal utility 80 miles down I-35, publishes exactly that commitment. The City of Austin's own permit records show what Austin Energy isn't saying.",
    seriesLabel: "Commercial solar permits — median days, application to passing final inspection",
    series: [
      { year: 2018, days: 64, n: 35 },
      { year: 2019, days: 141, n: 27 },
      { year: 2020, days: 137, n: 26 },
      { year: 2021, days: 193, n: 29 },
      { year: 2022, days: 328, n: 17 },
      { year: 2023, days: 414, n: 40 },
      { year: 2024, days: 205, n: 43, provisional: true },
    ],
    commitments: [
      {
        who: "Austin Energy",
        value: "No published commitment",
        detail: "Its own May 2026 solar permitting manual and residential solar page state no target timeline for interconnection review or PTO — only that an inspection date is emailed “usually within 3 business days” of being scheduled.",
        sourceLabel: "Austin Energy Solar Permitting Manual, May 2026; austinenergy.com solar rebate page",
        sourceUrl: "https://austinenergy.com/-/media/project/websites/austinenergy/green-power/solar/austinenergy_solarpermittingmanual.pdf",
        tone: "none",
      },
      {
        who: "CPS Energy (San Antonio)",
        value: "10–20 business days, then 24–48 hours",
        detail: "Application review takes about 10–20 business days (up to 30 for systems over 25kW); PTO is emailed within 24–48 hours of passing final commissioning.",
        sourceLabel: "CPS Energy Commercial Solar Interconnection Process guide, 2026",
        sourceUrl: "https://www.cpsenergy.com/content/dam/corporate/en/Documents/EnergyEfficiency/Commercial_Solar_Process_31425_ADA.pdf",
        tone: "peer",
      },
      {
        who: "Austin Energy, measured",
        value: "414 days (2023) · 205 days (2024, provisional)",
        detail: "The City of Austin's own permit data: median time from application to a commercial solar permit passing final inspection — the same moment that triggers PTO in Austin Energy's own process.",
        sourceLabel: "City of Austin permit records, electrical permits (solar), pulled May 2026",
        tone: "ae",
      },
    ],
    note: "This measures the electrical permit only — not the separate building and fire-department inspections some projects also need, and not Austin Energy's rebate processing, which runs afterward on its own timeline. Uses the median, not the average: a handful of multi-year outlier permits would otherwise pull the “typical” number far higher than what most applicants experience. Where the same address applied for more than one solar-related permit on the same day — a paired electrical + upgrade/remodel permit for one project, about 18% of commercial permits — the pair is counted once, timed to whichever permit finaled last. 2024 is provisional — about a quarter of that year's commercial permits hadn't reached “Final” status as of the May 2026 data pull.",
  },
];

export const intro = {
  kicker: "A New Pattern",
  title: "The Innovation Gap",
  dek:
    "Austin Energy calls these programs “innovative” and “leading.” Lined up against the utilities that actually did each one first, the gap is years — in one case, over a decade. This page pairs claim against record; the main Timeline stays Austin-Energy-only.",
};

export const threads: GapThread[] = [
  {
    id: "vpp",
    kicker: "HOME BATTERIES / VIRTUAL POWER PLANTS",
    title: "“Innovative,” 11 years after the first mover",
    dek:
      "Austin Energy's demand-response program dates to a 2013 thermostat pilot. The battery layer — the part that makes it a true “virtual power plant” — only launched in March 2026, calling itself innovative in its own press release.",
    axisStart: 2011,
    axisEnd: 2029,
    axisTicks: [2013, 2017, 2021, 2025],
    peer: {
      date: "2015",
      year: 2015,
      who: "Green Mountain Power (VT)",
      label: "First U.S. utility to partner with Tesla on home batteries",
      detail:
        "Formal regulatory approval followed in 2020. By 2023, GMP had roughly 40MW of behind-the-meter battery capacity across about 2,500 customer homes — from a utility with only ~270,000 total customers.",
      sourceLabel: "Utility Dive, “Green Mountain Power aims to lift cap on residential energy storage programs,” 2023",
      sourceUrl: "https://www.utilitydive.com/news/green-mountain-power--residential-energy-tesla-vermont/650341/",
    },
    ae: {
      date: "March 24, 2026",
      year: 2026.2,
      who: "Austin Energy",
      label: "Launches its “innovative” Power Partner Battery Pilot",
      detail:
        "Capped at 1,500 systems. Existing flexible capacity (mostly thermostats) is ~57MW; the pilot is framed as a step “toward” a 270MW-by-2035 virtual power plant target. Austin Energy serves 575,087 customer accounts — more than double GMP's.",
      sourceLabel:
        "Austin Energy news release, Mar 24, 2026, “Austin Energy launches innovative Power Partner Battery Pilot program”; EnergyHub news release, Mar 2026",
      sourceUrl: "https://austinenergy.com/about/news/news-releases/2026/Austin-Energy-launches-innovative-Power-Partner-Battery-Pilot-program",
    },
    gapYears: 11,
    gapLabel: "11 years behind",
    note: "Austin Energy's own demand-response precursor — a Power Partner thermostat pilot with ecobee — dates to 2013. It took 13 more years to add batteries.",
  },
  {
    id: "fit",
    kicker: "FEED-IN TARIFFS / SOLAR STANDARD OFFER",
    title: "A program other utilities have already retired",
    dek:
      "Austin Energy's Solar Standard Offer — a real feed-in tariff, paying a fixed rate for solar sold onto the grid — went live in December 2024. Gainesville, Florida ran the same kind of program from 2009 to 2014, before Austin's had even launched.",
    axisStart: 2006,
    axisEnd: 2028,
    axisTicks: [2009, 2013, 2017, 2021, 2025],
    peer: {
      date: "2009",
      year: 2009,
      who: "Gainesville Regional Utilities (FL)",
      label: "First U.S. utility solar feed-in tariff",
      detail: "Ran 2009–2014, discontinued after the program met its capacity cap — 15 years before Austin's version launched.",
      sourceLabel: "Harvard Kennedy School Case Program, “Gainesville Regional Utilities' Feed-in Tariff (Epilogue)”",
      sourceUrl: "https://case.hks.harvard.edu/gainesville-regional-utilities-feed-in-tariff-epilogue/",
    },
    peerOthers: [
      {
        date: "2013",
        year: 2013,
        who: "LADWP (Los Angeles)",
        label: "Still-running feed-in tariff, now the nation's largest",
        detail: "Authorized capacity has grown to 450MW — described as the largest feed-in tariff program in the country.",
        sourceLabel: "Pivot Energy, “Gain a New Revenue Stream with LADWP's FiT Program”",
        sourceUrl: "https://www.pivotenergy.net/blog/gain-a-new-revenue-stream-with-ladwps-fit-program",
      },
    ],
    ae: {
      date: "December 2024",
      year: 2024.9,
      who: "Austin Energy",
      label: "First commercial Solar Standard Offer project goes online",
      detail: "A fixed avoided-cost rate paid per kWh for solar sold onto the grid — the same mechanism Gainesville and LADWP pioneered.",
      sourceLabel: "Austin Chronicle, “Standard Offer Program Ramps Up Local Solar Capacity”; AustinTexas.gov news release, Dec 2024",
      sourceUrl: "https://www.austinchronicle.com/news/austin-energy-standard-offer-program-ramps-up-local-solar-capacity/",
    },
    gapYears: 15,
    gapLabel: "15 years behind",
    note: "Measured against LADWP's still-running program instead, the gap is 11 years — and LADWP's is 450MW versus Austin's still-small one.",
  },
  {
    id: "v2g",
    kicker: "VEHICLE-TO-GRID (BUS / EV BATTERIES)",
    title: "Not behind — absent, while the field gets crowded",
    dek:
      "This isn't a case of Austin catching up late. There's no vehicle-to-grid program here at all — while utilities from New York to Maryland have been running these programs since 2018, several at far larger scale than Dominion's — and the region's electric-bus rollout that would make one possible has actually been scaled back.",
    axisStart: 2016,
    axisEnd: 2029,
    axisTicks: [2019, 2021, 2023, 2025],
    peer: {
      date: "2019",
      year: 2019,
      who: "Dominion Energy (VA)",
      label: "Launches electric school bus V2G program",
      detail: "Scaling toward roughly 1,050 buses by 2025, with up to 105MWh of grid-usable battery storage — enough to power more than 10,000 homes.",
      sourceLabel: "PJM Inside Lines, “V2G Hits the Big Time with Dominion Electric School Bus Project”",
      sourceUrl: "https://insidelines.pjm.com/dominion-to-roll-out-largest-electric-school-bus-deployment-in-u-s/",
    },
    peerOthers: [
      {
        date: "2018",
        year: 2018,
        who: "Con Edison (NY)",
        label: "First V2G power flow from a school bus in New York State",
        detail: "Five Lion Electric buses serving White Plains schools, each discharging up to 10kW back to the grid — the earliest of these programs found in this research, a year before Dominion's launch.",
        sourceLabel: "T&D World, “Con Edison Test Drives Electric School Buses Toward Improved Reliability, Cleaner Air”",
        sourceUrl: "https://www.tdworld.com/electrification/article/21150526/con-edison-test-drives-electric-school-buses-toward-improved-reliability-cleaner-air",
      },
      {
        date: "2021",
        year: 2021,
        who: "National Grid (MA)",
        label: "Beverly, MA school bus discharges to the grid over a full summer",
        detail: "One Thomas Built/Proterra bus sent nearly 3MWh back to the grid across 30 events and more than 50 hours — National Grid called it “among the first instances in the United States” of school-bus V2G.",
        sourceLabel: "Business Wire, Oct 13, 2021, “Massachusetts Electric School Bus Helps Power Electricity Grid in Breakthrough for Vehicle-to-Grid Technology”",
        sourceUrl: "https://www.businesswire.com/news/home/20211013005688/en/Massachusetts-Electric-School-Bus-Helps-Power-Electricity-Grid-in-Breakthrough-for-Vehicle-to-Grid-Technology",
      },
      {
        date: "2025",
        year: 2025.3,
        who: "Pepco / Montgomery County, MD",
        label: "326 V2G-equipped buses under a four-year deployment",
        detail: "The largest school-bus V2G fleet found in this research — more than six times Dominion's scale — operated with Highland Electric Fleets.",
        sourceLabel: "World Resources Institute, “Electric School Bus Vehicle-to-Grid Programs,” 2025",
        sourceUrl: "https://www.wri.org/insights/electric-school-bus-vehicle-grid-programs",
      },
      {
        date: "Aug 2026",
        year: 2026.65,
        who: "National tally (Advanced Energy United)",
        label: "30+ utilities across 21 states now run school-bus V2G",
        detail: "By this later count the practice has moved well past a handful of pilots. Highland Electric Fleets' Leah Brams describes the buses as “massive batteries on wheels” (avg. battery: 200kWh, roughly 15x a Tesla Powerwall). Modeling cited on the same episode estimates 10% EV enrollment in V2G could supply about 9GW of 12-hour storage in California alone by 2036, saving utilities and consumers an estimated $550M/year.",
        sourceLabel: "Renewable Energy World / Advanced Energy United, “Factor This Policycast,” Aug 27, 2026",
        sourceUrl: "https://www.renewableenergyworld.com/electric-vehicle/ev-charging/supporting-the-grid-with-managed-ev-charging-and-v2g-technology-factor-this-policycast/",
      },
    ],
    ae: null,
    gapYears: null,
    gapLabel: "No program",
    note: "By 2025, similar programs were running or under deployment in at least half a dozen states — New York, Massachusetts, Michigan, Illinois, Maryland, California, Georgia among them. By August 2026 that count had grown well past a handful of states — more than 30 utilities across 21 states, per the industry tally above. Meanwhile CapMetro, Austin's transit agency, walked back its all-electric bus fleet plan in 2023–24 after range limits (e-buses covering only ~36% of routes) and reliability problems (mechanical failures roughly every 1,623 miles). It's now buying hybrid-diesel and exploring hydrogen buses instead.",
  },
  {
    id: "gets",
    kicker: "GRID-ENHANCING TECHNOLOGIES (GETs)",
    title: "Proven worldwide for nearly two decades — not in the plan",
    dek:
      "Grid-enhancing technologies — software like dynamic line rating, which reads a power line's real-time capacity instead of relying on a fixed worst-case number — can unlock double-digit percentage gains on lines a utility already owns, for a fraction of the cost of new construction. Belgium proved it in 2008. A fellow Texas utility proved it on the ERCOT grid in 2013. Britain is currently scaling it to hundreds of kilometers of line. The federal government has since started requiring a lighter version of this nationwide — and exempted ERCOT from it entirely. Austin Energy's current grid plan doesn't use any version of it.",
    axisStart: 2007,
    axisEnd: 2029,
    axisTicks: [2009, 2013, 2017, 2021, 2025],
    peer: {
      date: "2013–2014",
      year: 2013,
      who: "Oncor (Central & West Texas)",
      label: "DOE-backed pilot proves dynamic line rating on the Texas grid",
      detail:
        "Sensors on eight transmission circuits found real-time capacity running 6–14% (345kV) and 8–12% (138kV) above the fixed “ambient-adjusted” rating Oncor otherwise uses — available 84–91% of the time. Oncor called the results “commercially ready” and expanded to five more lines in West Texas that same year.",
      sourceLabel: "U.S. Department of Energy, Oncor Dynamic Line Rating Case Study, May 2014; SmartGrid.gov project summary",
      sourceUrl: "https://www.energy.gov/sites/prod/files/2016/12/f34/Oncor_DLR_Case_Study_05-20-14_FINAL.pdf",
    },
    peerOthers: [
      {
        date: "2008–2015",
        year: 2008,
        who: "Elia (Belgium)",
        label: "Where dynamic line rating was proven first",
        detail:
          "Elia began working with Belgian firm Ampacimon in 2008; by 2014–15 it had the technology running on eight cross-border interconnectors with France and the Netherlands, lifting power flow on those lines 30–40%. It's since spread to system operators across Europe, North America, and Asia.",
        sourceLabel: "Ampacimon, “Belgium's Transmission Breakthrough Is Going Global”",
        sourceUrl: "https://www.ampacimon.com/news/belgiums-transmission-breakthrough-is-going-global",
      },
      {
        date: "2022",
        year: 2022,
        who: "National Grid (New York, US)",
        label: "Largest dynamic-line-rating deployment in the U.S.",
        detail:
          "Sensors on five miles of 115kV line unlocked 190MW of added capacity and cut curtailment by more than 350MW — enough for roughly 80,000–100,000 homes. National Grid says its past deployments averaged over 30% more transmission capacity.",
        sourceLabel: "National Grid / LineVision news release, Oct 20, 2022",
        sourceUrl: "https://www.prnewswire.com/news-releases/national-grid-and-linevision-deploy-largest-dynamic-line-rating-project-in-the-united-states-301653906.html",
      },
      {
        date: "2022–2028",
        year: 2022.5,
        who: "National Grid (Great Britain)",
        label: "Expanding to 585km of transmission routes by 2028",
        detail:
          "The same parent company as the New York deployment, on its home grid: started with a Cumbria trial in 2022, now adding roughly 8% more capacity across hundreds of kilometers of line, projected to save consumers up to £50 million over five years.",
        sourceLabel: "Solar Power Portal, “National Grid to expand DLR technology to 585km of British grid transmission routes”",
        sourceUrl: "https://www.solarpowerportal.co.uk/solar-technology/national-grid-to-expand-dlr-technology-to-585km-of-british-grid-transmission-routes",
      },
      {
        date: "Oct 2022–2023",
        year: 2022.8,
        who: "PPL Electric (Pennsylvania, PJM)",
        label: "First U.S. utility to feed dynamic line ratings into real-time market operations",
        detail:
          "Started on 3 congested 230kV lines in October 2022, expanded to 5 more in 2023. Measured ratings averaged more than 16% above the old fixed ratings; congestion costs on just one of the lines fell by roughly $65 million against the prior winter, an estimated $50 million in transmission-rebuild spending was avoided, and PJM now feeds the hourly forecasts directly into its day-ahead market. By comparison, the largest single U.S. deployment — AES's utilities in Indiana and Ohio, paired with LineVision and announced April 2024 — has so far published only qualitative “early learnings,” not a capacity or dollar figure.",
        sourceLabel: "Renewable Energy World, “Case study: The first US electric utility to integrate dynamic line ratings into real-time and market operations,” Jan 15, 2025; PJM Inside Lines",
        sourceUrl: "https://www.renewableenergyworld.com/power-grid/smart-grids/case-study-the-first-us-electric-utility-to-integrate-dynamic-line-ratings-into-real-time-and-market-operations/",
      },
    ],
    ae: null,
    gapYears: null,
    gapLabel: "No program",
    note: "Austin Energy's own April 2026 transmission briefing to the Electric Utility Commission details $500 million in transmission upgrades approved in its current five-year Capital Improvement Plan (FY2026–2030) — reconductoring, new import lines, voltage upgrades, and new switchyards, about 60% of it aimed directly at import capacity. All four categories are physical construction; none of Austin Energy's transmission, resiliency, or resource-planning documents mention dynamic line rating, topology optimization, or advanced power flow control anywhere. (This is separate from Austin Energy's $735 million, 10-year Electric System Resiliency Plan, which covers wildfire mitigation, pole hardening, and grid analytics — a different budget aimed at reliability, not import capacity.) A 2025 Texas bill that would have required ERCOT to formally evaluate grid-enhancing technologies on new transmission projects (HB 5200) died in committee, so nothing currently requires this in Texas. But it's a choice twice over, not a shortcoming forced by regulation: FERC Order 881 (Dec. 16, 2021) already requires transmission owners nationally to adopt hourly, weather-based “Ambient-Adjusted Ratings” by mid-2025 — a lighter step than true dynamic line rating, which FERC explicitly declined to mandate in that same order and is still only exploring in a separate, still-open rulemaking (Docket RM24-6, opened June 2024, ANOPR stage, no final rule as of this writing). ERCOT and Texas transmission utilities fall outside that federal mandate entirely, because ERCOT is intrastate-only and not synchronously interconnected to the rest of the U.S. grid — putting it beyond FERC's jurisdiction under the Federal Power Act. So there's no federal requirement pulling Austin Energy toward this technology the way there increasingly is almost everywhere else in the country. DOE's April 2024 “Pathways to Commercial Liftoff” report puts a number on what that leaves on the table nationally: dynamic line rating alone can add 10–30% more capacity to a line in under three months, at under 5% of the cost of rebuilding it, and DOE estimates deferring $5–35 billion in transmission and distribution spending over five years across this and related grid technologies together (not a DLR-only figure). Texas's own record complicates any simple “it's not proven here” defense, and doesn't resolve cleanly: ERCOT's own August 2024 internal training presentation on grid-enhancing technologies names zero Texas examples — every case study in it is out-of-state or international (the Pacific Northwest, Pennsylvania, New York, Spain, Slovenia, Israel) — and this research turned up no Oncor, CenterPoint, or AEP Texas deployment announcement since the original 2013–14 Oncor pilot. Yet an ERCOT senior vice president told Utility Dive in April 2024 that “a good majority” of Texas's transmission lines were already dynamically line rated — a claim that conflicts with both the silence in ERCOT's own later deck and the absence of any specific deployment this research could find. Neither claim could be independently confirmed or ruled out here; both are presented as each party stated them.",
  },
  {
    id: "egs",
    kicker: "ENHANCED GEOTHERMAL (EGS)",
    title: "Called a “game changer.” Still hasn’t broken ground.",
    dek:
      "In December 2024, Austin Energy announced a 5-megawatt enhanced-geothermal pilot with Exceed GeoEnergy near its Nacogdoches biomass plant, calling the broader technology a “potential game changer” for Texas, with electricity production targeted for 2025. The same stimulated-rock drilling technique has delivered commercial power in Germany for over a decade, and utility-scale U.S. projects are now going from first well to first power in about three years — including a larger project from Austin's own contractor, in another Texas town.",
    axisStart: 2010,
    axisEnd: 2029,
    axisTicks: [2012, 2016, 2020, 2024, 2028],
    peer: {
      date: "2012",
      year: 2012,
      who: "Insheim Geothermal Power Station (Germany)",
      label: "Stimulated-rock geothermal plant, still running today",
      detail:
        "A 4.8MW plant using the same core technique now branded “enhanced geothermal” — drilling into hot rock and engineering a fracture network to circulate fluid — has fed Germany's grid continuously since 2012, in the same seismically active Upper Rhine Graben region where an earlier nearby project (Landau) had to manage induced-seismicity concerns.",
      sourceLabel: "Wikipedia, “Insheim Geothermal Power Station”; GTN project page",
      sourceUrl: "https://en.wikipedia.org/wiki/Insheim_Geothermal_Power_Station",
    },
    peerOthers: [
      {
        date: "2023–2026",
        year: 2023,
        who: "Fervo Energy / Southern California Edison (Cape Station, UT)",
        label: "A utility took EGS from first well to first power in about 3 years",
        detail:
          "Southern California Edison signed 320MW of 15-year power purchase agreements at Fervo's Cape Station project. Drilling began in 2023; the first 70MW phase is targeting commercial operation by the end of 2026, with the full 400MW project online by 2028.",
        sourceLabel: "Fervo Energy, PPA announcement with Southern California Edison, 2026",
        sourceUrl: "https://fervoenergy.com/fervo-energy-announces-320-mw-power-purchase-agreements-with-southern-california-edison/",
      },
      {
        date: "May 2025",
        year: 2025.4,
        who: "Exceed GeoEnergy (Presidio, TX)",
        label: "The same contractor's larger Texas project is moving, while Austin's stalls",
        detail:
          "Five months after Austin Energy's own pilot missed its 2025 target, Exceed GeoEnergy — Austin's own geothermal partner — signed a 110MW geothermal power purchase term sheet with the Presidio Municipal Development District, more than 20 times the size of Austin's pilot, targeting an initial phase online before the end of 2026.",
        sourceLabel: "PMDD / Exceed GeoEnergy, geothermal power purchase term sheet, May 2025",
        sourceUrl: "https://exceedgeoenergy.com/pmdd-signs-historic-110-megawatt-geothermal-power-purchase-term-sheet-setting-stage-for-major-economic-transformation/",
      },
    ],
    ae: {
      date: "December 11, 2024",
      year: 2024.94,
      who: "Austin Energy",
      label: "Announces 5MW geothermal pilot with Exceed GeoEnergy",
      detail:
        "Sited near Austin Energy's Nacogdoches biomass plant, the pilot was announced to “begin electricity production by 2025.” As of the most recent public project tracking (February 2026), it remains listed pre-construction, with no groundbreaking date announced and no public explanation for the delay.",
      sourceLabel: "Austin Energy news release, Dec 2024; Global Energy Monitor project tracker, accessed 2026",
      sourceUrl: "https://austinenergy.com/about/news/news-releases/2024/Austin-Energy-explores-potential-game-changer-for-geothermal-energy-in-Texas",
    },
    gapYears: 13,
    gapLabel: "13 years behind — and still not built",
    note: "This thread is a different shape from the others on this page: Austin Energy isn't merely behind a first mover, it announced a specific project with a specific target date and missed it, while comparable projects — including a much larger one from its own contractor — move ahead elsewhere. Insheim shows the underlying technique isn't new; Cape Station shows a utility can get a modern EGS project from first well to first power in about three years when it moves.",
  },
];

export const footnote =
  "Every figure above carries a citation. Peer-utility facts are drawn from public reporting and each utility's own announcements; Austin Energy figures are drawn from its own press releases, public filings, and City of Austin permit records. Where a program isn't a clean apples-to-apples match, that's noted rather than smoothed over.";
