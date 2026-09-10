export type TimelineKind = "policy" | "contract" | "vote";

export interface TimelineEvent {
  date: string;
  year: string;
  kind: TimelineKind;
  tag?: string;
  title: string;
  body: string;
  source: string;
  sourceUrl?: string;
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    date: "1982",
    year: "1982–2004",
    kind: "contract",
    title: "Austin Energy's first energy-efficiency rebates",
    body:
      "After the 1970s energy crisis, the utility begins offering customer rebates for energy efficiency — framing conservation as a way to avoid building new power plants, a rationale it would return to for the next four decades.",
    source: "Austin Energy company history",
    sourceUrl: "https://austinenergy.com/about/history",
  },
  {
    date: "1991",
    year: "1982–2004",
    kind: "contract",
    title: "Austin Energy Green Building launches",
    body:
      "The city creates its green building program, rating homes and buildings on energy and water efficiency and environmentally-friendly design — letting Austin test practices that later get written into local building and energy codes.",
    source: "Austin Energy company history",
    sourceUrl: "https://austinenergy.com/about/history",
  },
  {
    date: "1996",
    year: "1982–2004",
    kind: "policy",
    title: "Austin decommissions its first gas plant, Seaholm",
    body:
      "Austin Energy retires the downtown Seaholm Power Plant in favor of newer, more efficient generation — the first of several legacy gas-plant retirements the utility would carry out over the next three decades.",
    source: "Austin Energy company history",
    sourceUrl: "https://austinenergy.com/about/history",
  },
  {
    date: "2001",
    year: "1982–2004",
    kind: "contract",
    title: "GreenChoice lets customers opt into renewable power",
    body:
      "Austin Energy launches its GreenChoice program, letting customers voluntarily pay higher rates for renewable power. It quickly becomes the top-selling program of its kind among U.S. utilities.",
    source: "Austin Energy company history",
    sourceUrl: "https://austinenergy.com/about/history",
  },
  {
    date: "2004",
    year: "1982–2004",
    kind: "contract",
    title: "Solar rebates and EV incentives begin",
    body:
      "Austin Energy launches its Solar Rebate Program, offering incentives for residents, businesses, and non-profits to install solar panels, alongside its first electric-vehicle programs.",
    source: "Austin Energy company history",
    sourceUrl: "https://austinenergy.com/about/history",
  },
  {
    date: "Feb 15, 2007",
    year: "2007",
    kind: "policy",
    title: "Austin adopts its first Climate Protection Plan",
    body:
      'Resolution 20070215-023 directs Austin Energy to become "the leading utility in the nation for greenhouse gas reductions": 30% renewable energy by 2020 with 100 MW required from solar, a cap and reduction plan for the utility\'s own emissions, and — a requirement that would resurface nineteen years later — that any new power plant burning carbon-based fuel achieve carbon neutrality. The backdrop: Al Gore\'s An Inconvenient Truth, Gov. Rick Perry pushing 18 new coal plants statewide, and the first Sierra Club "Beyond Coal" protests against Austin\'s own coal stake — the Fayette Power Project, co-owned with the Lower Colorado River Authority (LCRA).',
    source: "Resolution No. 20070215-023",
    sourceUrl: "https://services.austintexas.gov/edims/document.cfm?id=100723",
  },
  {
    date: "Apr 2010",
    year: "2010–11",
    kind: "contract",
    title: "Council raises the bar: 35% renewable, 200 MW solar",
    body:
      'The AE Resource, Generation & Climate Protection Plan to 2020 raises the renewable goal from 30% to 35% and the solar goal from 100 to 200 MW, and makes "energy efficiency ... the first priority in meeting new load growth." It\'s the first plan to commit specifically to reducing Fayette coal output — about 24% by 2020 — with the plan\'s effective date contingent on Council later adopting an affordability matrix.',
    source: "AE Resource, Generation & Climate Protection Plan to 2020, Apr 2010",
    sourceUrl: "https://services.austintexas.gov/edims/document.cfm?id=135513",
  },
  {
    date: "Feb 17, 2011",
    year: "2010–11",
    kind: "policy",
    title: "The affordability goal: 2% a year, or less",
    body:
      "Council adopts the rate-increase ceiling that governs every plan after it — all-in rate increases capped at 2% or less per year, with AE's rates kept in the lower half of Texas utilities. Every gas-vs-clean fight for the next fifteen years gets litigated against this number.",
    source: "Council Affordability Goal, Feb 17, 2011",
  },
  {
    date: "Apr 2011",
    year: "2010–11",
    kind: "contract",
    title: "Council commits to cutting coal by a third — and eyes eliminating it by 2020",
    body:
      'An update to the Generation Resource Plan commits Austin Energy to reducing Fayette coal use by at least a third (an equivalent of 367 MW of capacity) and to "continually reassess" fully eliminating coal "as soon as technically and economically feasible" — targeting 2020. It would take until 2025 for a firm exit date to even be publicly demanded again (see Feb 2024 below).',
    source: "Generation Resource Plan update, Apr 2011, cited in Resolution No. 20141016-023",
  },
  {
    date: "2011",
    year: "2010–11",
    kind: "policy",
    title: "Sierra Club's Beyond Coal campaign comes to Austin",
    body:
      "Backed by roughly $50M in Bloomberg Philanthropies funding nationally, the local campaign begins organizing to close the Fayette Power Project — block walks, petitions, and years of showing up at Electric Utility Commission (EUC) and Council meetings to come.",
    source: "Beyond Coal campaign history",
  },
  {
    date: "2012",
    year: "2012–13",
    kind: "policy",
    title: "Council starts asking: close Fayette, or sell it?",
    body:
      "With wind still limited in Texas and solar still expensive, there's no easy answer yet for what replaces Fayette's coal capacity. Organizers charter a plane to photograph the plant's full scale for public campaigning.",
    source: "Beyond Coal campaign history",
  },
  {
    date: "2013",
    year: "2012–13",
    kind: "policy",
    title: "A bill to take Austin Energy out of Council's hands",
    body:
      "State Sen. Kirk Watson introduces legislation (SB 410) to strip AE's management from City Council and hand it to an independent board, on the model of San Antonio's CPS Energy. Organizers mobilize to defend Council control with citizen input; the bill doesn't pass.",
    source: "Beyond Coal campaign history; 2013 Texas Legislature, SB 410",
  },
  {
    date: "Oct 24, 2013",
    year: "2012–13",
    kind: "contract",
    title: "The 2010 plan gets its first amendment: solar goes local",
    body:
      "Resolution 20131024-053 amends the 2010 Resource Plan's 200 MW solar goal, requiring that half of it be local solar and at least a quarter be local, customer-owned solar — rather than utility-scale solar built anywhere. It also directs staff to weigh raising the overall solar goal to 400 MW, the first of what becomes five amendments to the 2010 plan by 2024.",
    source: "Resolution No. 20131024-053",
    sourceUrl: "https://services.austintexas.gov/edims/document.cfm?id=200480",
  },
  {
    date: "Dec 31, 2013",
    year: "2012–13",
    kind: "policy",
    title: "The legal memo that starts the Fayette exit conversation",
    body:
      "A City Attorney analysis of Fayette retirement options finds the real obstacle: the Participation Agreement with LCRA, which obligates Austin to generate at least 160 MW of coal power on LCRA's request — whether or not AE would rather use cleaner sources.",
    source: "City Attorney memo, Dec 31, 2013",
  },
  {
    date: "Early 2014",
    year: "2014",
    kind: "policy",
    title: "AE proposes 500 MW of new gas — and a 25% rate-hike warning",
    body:
      "Austin Energy's Generation Plan update proposes adding 500 MW of new gas generation at Sand Hill or Decker by 2018. AE warns publicly that rates could rise 25% without it; the Statesman runs with it and the public reacts. Organizers march on AE headquarters; Council responds by demanding an independent Working Group review before anything is approved.",
    source: "Beyond Coal campaign history; 2014 Generation Plan",
  },
  {
    date: "Mar 2014",
    year: "2014",
    kind: "contract",
    title: "Solar beats gas on price, for the first time on paper",
    body:
      "Council authorizes a 150 MW utility-scale solar power purchase agreement priced below the cost of energy from AE's own gas fleet — the first hard evidence that solar had become the cheaper option.",
    source: "Recital, Resolution No. 20140828-157; Austin Energy PPA, Mar 2014",
  },
  {
    date: "Apr 10, 2014",
    year: "2014",
    kind: "contract",
    title: "Net zero by 2050 — and a new Task Force to get there",
    body:
      "Resolution 20140410-024 (the 2014 Austin Climate Protection Plan) sets a net-zero, community-wide emissions goal for 2050 and appoints the 2014 Austin Generation Resource Planning Task Force to rewrite the 2010 plan through 2024.",
    source: "Resolution No. 20140410-024",
  },
  {
    date: "Aug 28, 2014",
    year: "2014",
    kind: "contract",
    title: "Zero Carbon by 2030 — and a Low-Income Task Force",
    body:
      "Two resolutions pass together. Resolution 157 commits Austin Energy to zero carbon emissions by 2030 (against a 2010 baseline), 50% renewable energy by 2020, 65% by 2025, 600 MW of new utility-scale solar by 2017, and — a decade before the first battery contracts — at least 200 MW of fast-response storage by 2024. Resolution 158, sponsored by Council Member Kathie Tovo, creates a Low-Income Consumer Advisory Task Force and raises the energy-efficiency and demand-response goal to 1,200 MW by 2024.",
    source: "Resolution Nos. 20140828-157 & -158; Austin American-Statesman, Aug 31, 2014",
    sourceUrl: "https://services.austintexas.gov/edims/document.cfm?id=216608",
  },
  {
    date: "Oct 16, 2014",
    year: "2014",
    kind: "contract",
    title: "Council moves to break free of Fayette's coal mandate",
    body:
      "Resolution 023 directs staff to explore operational control of a single Fayette unit instead of the current 50/50 joint ownership with LCRA — a structure that obligates Austin to burn at least 160 MW of coal at LCRA's request regardless of what AE would rather run.",
    source: "Resolution No. 20141016-023",
  },
  {
    date: "Dec 11, 2014",
    year: "2014",
    kind: "contract",
    title: "Council blocks the last new gas plant AE proposed",
    body:
      "Council Member Kathie Tovo's floor amendments condition the 500 MW gas proposal on an independent third-party economic and environmental review — and bar AE from negotiating any contract for new gas generation until that review is complete and Council has acted on it. The plant is never built. It's the last time Austin tried to add new gas before 2026 — and the last time it came with real review attached.",
    source: 'CM Tovo, "Late Backup — Generation Plan Amendments," Dec 11, 2014',
  },
  {
    date: "Oct 15, 2015",
    year: "2015",
    kind: "contract",
    title: "600 MW of solar passes — the gas plant is dead",
    body:
      "Council approves power purchase agreements for the full 600 MW utility-scale solar goal set in Resolution 157. AE's 500 MW gas proposal, still pending independent review since Tovo's December amendments, never comes back.",
    source: "Austin City Council agenda, Oct 15, 2015",
  },
  {
    date: "Aug 17, 2017",
    year: "2017",
    kind: "policy",
    title: "The 2017 plan sets the Fayette and Decker retirement dates",
    body:
      "Council adopts the EUC Resource Planning Working Group's 2016-17 recommendations, reconfirming the 2014 commitment to close Fayette by 2022 and setting Decker Creek's gas-fired baseload units to retire in 2020 and 2021. Passed only after a contentious session — nine renewable-goal amendments from Council Member Leslie Pool, plus EV and efficiency amendments from Kitchen and Garza. Decker keeps its date (see 2020–21 below); Fayette does not.",
    source:
      "Resolution No. 20170817-061, adopting the EUC Resource Planning Working Group's 2016-17 Recommendations",
    sourceUrl: "https://services.austintexas.gov/edims/document.cfm?id=282674",
  },
  {
    date: "2018",
    year: "2018",
    kind: "policy",
    title: "Austin Energy plans to retire Decker's old baseload units",
    body:
      'An internal "Decker Decommissioning Update" sets a timeline to retire Decker Creek\'s two large 1970s-era gas-fired baseload units, citing age and market economics — the first concrete step in what becomes Austin\'s climate-driven move away from its legacy gas fleet. Decker\'s smaller gas peakers aren\'t part of this retirement and stay running.',
    source: "Austin Energy internal briefing, 2018 (EDIMS #317748)",
  },
  {
    date: "Apr 18, 2018",
    year: "2018",
    kind: "contract",
    title: "Council backs a Carbon Fee and Dividend",
    body:
      "Pushed by the Citizens Climate Lobby, Council passes a recommendation supporting a national Carbon Fee and Dividend policy to price fossil fuels out of the market — a resolution with no direct power over AE, but a marker of how far local climate politics had moved.",
    source: "Austin City Council resolution, Apr 18, 2018",
  },
  {
    date: "2018",
    year: "2018",
    kind: "policy",
    title: "LCRA's Sunset review — a reform chance that goes nowhere",
    body:
      "The Texas Legislature's periodic Sunset review of LCRA takes up Fayette, Bastrop County groundwater, and LCRA governance. Sen. Watson protects LCRA's structure; no reform lands.",
    source: "Beyond Coal campaign history, 2018 Legislature",
  },
  {
    date: "Aug 8, 2019",
    year: "2019",
    kind: "contract",
    title: "Council declares a Climate Emergency",
    body:
      "Following a May 2019 Climate Resilience briefing, Council formally declares a climate emergency — largely symbolic, but it resets the political baseline heading into the next generation-plan fight.",
    source: "Austin City Council resolution, Aug 8, 2019",
  },
  {
    date: "Mar 2020",
    year: "2020",
    kind: "policy",
    title: "Council sets the 100% carbon-free-by-2035 goal",
    body:
      "Council gives initial approval to the Resource, Generation and Climate Protection Plan — the policy document that first commits Austin Energy to a target of 100% carbon-free generation by 2035.",
    source:
      "Austin Energy Resource, Generation & Climate Protection Plan to 2030, recommended Mar 9, 2020",
    sourceUrl: "https://services.austintexas.gov/edims/document.cfm?id=337851",
  },
  {
    date: "Oct 31, 2020",
    year: "2020",
    kind: "policy",
    title: "Decker's Unit 1 gas-fired baseload unit retires",
    body:
      "The first of Decker Creek's two large gas-fired baseload units goes offline as scheduled; the plant's gas peakers remain running.",
    source: "Austin Monitor, Jun 2020",
  },
  {
    date: "2020",
    year: "2020",
    kind: "policy",
    title: "The REACH Plan — and a promise to close Fayette by 2023",
    body:
      "Grassroots groups (Sunrise, Extinction Rebellion) march on Austin Energy pushing for Zero Carbon by 2030; AE holds at 2035. The REACH Plan is adopted to price down Fayette's carbon output, and the 2020 plan still promises a Fayette closure by 2023 — a date that, four years later, Mayor Watson is still publicly asking AE to hit, now by 2029 instead (see Feb 2024 below). COVID hits mid-year; meetings go virtual and organizing slows.",
    source: "Beyond Coal campaign history; Austin Energy REACH Plan, 2020",
  },
  {
    date: "Feb 2021",
    year: "2021",
    kind: "policy",
    title: "Winter Storm Uri",
    body:
      "Statewide blackouts and a multi-day price spike to ERCOT's $9,000/MWh cap. Austin Energy's own plants mostly stay online while roughly 40% of its customers sit on rolling outages — the utility ends up a net seller, earning an estimated $54M by selling its surplus into the spiked market. The reference event the new peaker is later justified against.",
    source: "KUT, Community Impact, Mar 2021",
  },
  {
    date: "Fall 2021",
    year: "2021",
    kind: "policy",
    title: "Decker's Unit 2 gas-fired baseload unit retires",
    body:
      "The second large gas-fired baseload unit retires on schedule, completing the retirement of Decker Creek's baseload units — its gas peakers keep running, and are the plant's only generation left when the 2026 peaker deal is struck.",
    source: "Austin Energy, 2018 decommissioning plan",
  },
  {
    date: "2022",
    year: "2022",
    kind: "policy",
    title: "The EUC calls for a real review, given how much has changed",
    body:
      "The Electric Utility Commission and Council recognize that battery costs, load growth, and market conditions have shifted enough since 2020 to warrant a full generation-plan review — the process that becomes the 2035 plan update.",
    source: "Beyond Coal campaign history, 2022",
  },
  {
    date: "2023",
    year: "2023",
    kind: "policy",
    title: 'AE\'s "listening" sessions: three short presentations, no Working Group',
    body:
      "For the plan update process, AE offers three brief public presentations — reusing PowerPoints from 2014 — with no dedicated AE or EUC Working Group staff support, unlike the robust process that produced the 2014 Task Force. The EUC and activists push Council for a real Working Group and march on AE headquarters again, echoing 2014.",
    source: "Beyond Coal campaign history, 2023",
  },
  {
    date: "2023",
    year: "2023",
    kind: "contract",
    title: "The scorecard: what fifteen years of organizing built",
    body:
      "By 2023's resource map: roughly 1.8 GW of wind under contract statewide, about 1.0 GW of solar including local generation, and no new gas built since the 500 MW plan died in 2014. What it doesn't show: Fayette, promised closed by 2020 (2011 plan), then 2022 (2017 plan), then 2023 (2020 plan), is still running — a failure organizers trace to market conditions, the Mayor's office, LCRA, and the Governor.",
    source: "Beyond Coal campaign history, 2023 generation map",
  },
  {
    date: "Sep 2023",
    year: "2023",
    kind: "policy",
    title: "Work begins on the 2035 plan update",
    body:
      "Austin Energy starts developing an update to the resource plan, weighing climate goals against transmission constraints into its own zone — the planning process that will eventually include new gas.",
    source: "Austin Monitor, Sep 2023",
  },
  {
    date: "Feb 2024",
    year: "2024",
    kind: "policy",
    title: "Mayor Watson calls for exiting the Fayette coal plant",
    body:
      "Mayor Kirk Watson publicly urges Austin Energy to exit its stake in the Fayette coal plant by 2029, pressing the utility's broader fossil-fuel exit.",
    source: "Austin Chronicle, Statesman, Feb 2024",
  },
  {
    date: "Nov 2024",
    year: "2024",
    kind: "contract",
    title: "A geothermal pilot is announced — and hydrogen falls out",
    body:
      'Austin Energy announces a 5 MW geothermal pilot with Exceed Energy near Nacogdoches, calling it a possible "game changer." In the same window, the hydrogen-capable gas turbine pathway drops out of the resource-plan mix as modeling is refined.',
    source: "Austin Energy news release; Austin Monitor, Nov 2024",
  },
  {
    date: "Dec 12, 2024",
    year: "2024",
    kind: "policy",
    title: "Council adopts the 2035 plan — and opens the door to gas",
    body:
      'Council formally adopts the Resource, Generation and Climate Protection Plan to 2035. Consultant modeling (Ascend Analytics) shows a fully renewable path would nearly double costs; a fully gas-free "Portfolio B" is not advanced. The vote that makes everything after it possible.',
    source: "Austin City Council, Dec 12, 2024; Ascend Analytics case study",
    sourceUrl: "https://austinenergy.com/about/reports/generation-resource-planning",
  },
  {
    date: "Dec 2024",
    year: "2024",
    kind: "policy",
    title: "The catch: nothing old has to retire, and the goal only covers what customers use",
    body:
      'The plan Council adopts states Austin Energy will not prematurely retire its existing gas generation at Decker or Sand Hill — and at the May 2026 peaker vote, staff confirm the utility has "no plans on retiring its active peaker units." New gas capacity doesn\'t replace old gas capacity; it adds to it, a net increase in fossil-fuel capacity at a utility committed to 100% carbon-free power by 2035. That 2035 goal is itself scoped narrowly: Austin Energy\'s own planning language commits only to "100% of Austin Energy Load" — the power delivered to its customers — leaving the utility free to keep running gas plants to sell power into the wholesale ERCOT market beyond what Austin needs, without that counting against the goal. One guardrail Council does add: an amendment from Council Member Ryan Alter requires Austin Energy to report back on why a carbon-free alternative wasn\'t available before any future peaker unit is built.',
    source:
      "Austin Energy 2035 Plan, Dec 2024; Environmental Commission Recommendation 20241204-005; Austin Chronicle, Dec 20, 2024; Austin Current, May 14, 2026",
  },
  {
    date: "2025–26",
    year: "2025–26",
    kind: "contract",
    title: "A wave of wind and battery contracts",
    body:
      "Austin Energy signs OCI Energy (100 MW) and Jupiter Power/Balcones Ridge (100–200 MW) battery contracts, a 299 MW Invenergy wind PPA, a Whirlwind wind PPA extension, and a 40 MW Base Power distributed-battery deal — the non-gas half of what becomes the May 2026 package.",
    source: "Austin Energy news releases, 2025–26",
  },
  {
    date: "Jan 2026",
    year: "2025–26",
    kind: "policy",
    title: "The geothermal pilot hits trouble — then grows",
    body:
      'Austin Energy\'s own planning update describes the Exceed Energy pilot as "revived and expanded to 9.9 MW after regulatory and financial uncertainties."',
    source: "Austin Energy Resource Plan status update, Jan 2026",
  },
  {
    date: "Apr 2026",
    year: "2025–26",
    kind: "contract",
    title: "The Power Partner Battery Pilot launches",
    body:
      "Austin Energy launches its first residential virtual-power-plant program with EnergyHub — $500 upfront plus an annual payment per household, capped at 1,500 systems, with a stated goal of 78 MW by 2027.",
    source: "Austin Energy news release, Apr 2026",
  },
  {
    date: "May 11, 2026",
    year: "2025–26",
    kind: "policy",
    title: "The Electric Utility Commission meets — and is left waiting",
    body:
      'The EUC discusses the "competitive matters" classification about to shield the peaker deal, and requests updated financial modeling before a vote. The request appears to go unanswered.',
    source: "Electric Utility Commission meeting, May 11, 2026",
  },
  {
    date: "May 21, 2026",
    year: "2025–26",
    kind: "vote",
    tag: "The Secret Vote",
    title: "A public item is withdrawn. A closed-session item is approved.",
    body:
      "Item 7 — the public agenda item on new gas generation — is withdrawn without a vote. Item 82, taken up in closed executive session, approves a roughly $1 billion, 400 MW gas peaker deal alongside the wind and battery package above. No public vote is ever held on the gas plants themselves.",
    source: "Austin City Council agenda, May 21, 2026",
  },
  {
    date: "May 28, 2026",
    year: "2025–26",
    kind: "policy",
    title: "Council passes pollution-cap and equity resolutions",
    body:
      "One week after the vote, Council adopts resolutions on pollution caps and equity measures for the new plants — an after-the-fact response to the deal already approved.",
    source: "Community Impact, May 28, 2026",
  },
  {
    date: "Jul 23, 2026",
    year: "2025–26",
    kind: "contract",
    title: "The battery contract gets its public vote",
    body:
      "The Jupiter Power/Balcones Ridge battery contract — unlike the gas peakers — comes to Council for an open, recorded vote, and passes 10–0.",
    source: "Austin City Council, Jul 23, 2026",
  },
];

export const KIND_LABEL: Record<TimelineKind, string> = {
  policy: "Policy & planning",
  contract: "Wins & approvals",
  vote: "The vote & its aftermath",
};

export const TIMELINE_SOURCES = [
  "Austin Energy internal and public documents, 1982–2026 (services.austintexas.gov/edims; austinenergy.com/about/history)",
  "Austin Monitor, Austin Chronicle, Austin Current, Community Impact, KUT, and Statesman reporting, 2013–2026",
  "Ascend Analytics case study on the Austin Energy 2035 resource plan",
  "Austin City Council and Environmental Commission agendas and minutes, 2013–2026",
];

export function groupedByYear() {
  const groups: { year: string; events: TimelineEvent[] }[] = [];
  for (const e of TIMELINE_EVENTS) {
    const last = groups[groups.length - 1];
    if (last && last.year === e.year) last.events.push(e);
    else groups.push({ year: e.year, events: [e] });
  }
  return groups;
}
