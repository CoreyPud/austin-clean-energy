export type TimelineKind = "policy" | "contract" | "vote";

export interface TimelineEvent {
  date: string;
  year: string;
  kind: TimelineKind;
  tag?: string;
  title: string;
  body: string;
  source: string;
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    date: "2018",
    year: "2018",
    kind: "policy",
    title: "Austin Energy plans to retire Decker's old steam units",
    body:
      'An internal "Decker Decommissioning Update" sets a timeline to retire Decker Creek\'s two large 1970s-era steam units, citing age and market economics — the first concrete step in what becomes Austin\'s climate-driven move away from its legacy gas fleet.',
    source: "Austin Energy internal briefing, 2018 (EDIMS #317748)",
  },
  {
    date: "Mar 2020",
    year: "2020",
    kind: "policy",
    title: "Council sets the 100% carbon-free-by-2035 goal",
    body:
      "Council gives initial approval to the Resource, Generation and Climate Protection Plan — the policy document that first commits Austin Energy to a target of 100% carbon-free generation by 2035.",
    source: "Austin Energy Resource, Generation & Climate Protection Plan, Mar 2020",
  },
  {
    date: "Oct 31, 2020",
    year: "2020",
    kind: "policy",
    title: "Decker's Unit 1 steam turbine retires",
    body:
      "The first of Decker Creek's two large steam units goes offline as scheduled; the plant's smaller gas turbines remain running.",
    source: "Austin Monitor, Jun 2020",
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
    title: "Decker's Unit 2 steam turbine retires",
    body:
      "The second large steam unit retires on schedule, completing the closure of Decker Creek's old steam plant.",
    source: "Austin Energy, 2018 decommissioning plan",
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
  contract: "Contracts signed",
  vote: "The vote & its aftermath",
};

export const TIMELINE_SOURCES = [
  "Austin Energy internal and public documents, 2018–2026 (services.austintexas.gov/edims)",
  "Austin Monitor, Austin Chronicle, Community Impact, KUT, and Statesman reporting, 2018–2026",
  "Ascend Analytics case study on the Austin Energy 2035 resource plan",
  "Austin City Council agendas and minutes, Dec 2024 and May–Jul 2026",
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
