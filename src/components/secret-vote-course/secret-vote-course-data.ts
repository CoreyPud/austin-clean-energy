// Secret Vote: The Grid Primer — course content, quiz bank, and glossary.
// Pure data, ported from the companion course artifact. Body/callout "text"
// strings may contain a small set of inline HTML (currently only <b>…</b>)
// authored by us for emphasis — SecretVoteCourse.tsx renders those via
// dangerouslySetInnerHTML, which is safe here since this file has no
// user-generated content. Every other field (kicker, heading, part, quiz
// text, glossary entries) is rendered as plain text and contains no markup.

export type DiagramKey =
  | "gridFlow"
  | "ercotIsland"
  | "nodalFlow"
  | "dispatchSpectrum"
  | "execCompare"
  | "basisCostBars"
  | "diurnalCurve"
  | "roadToVote"
  | "voteDayFlow";

export type SlideCallout = {
  label: string;
  /** May contain inline <b> markup — rendered via dangerouslySetInnerHTML. */
  text: string;
};

export type Slide = {
  kicker: string;
  heading: string;
  /** Each paragraph may contain inline <b> markup — rendered via dangerouslySetInnerHTML. */
  body: string[];
  diagram?: DiagramKey;
  callout?: SlideCallout;
};

export type CourseModule = {
  part: string;
  title: string;
  slides: Slide[];
};

export type QuizQuestion = {
  q: string;
  choices: string[];
  correct: number;
  explain: string;
};

// ---------------------------------------------------------------------------
// modules
// ---------------------------------------------------------------------------

export const MODULES: CourseModule[] = [
{part:'Part I · Grid Fundamentals', title:'How Electricity Actually Gets to You', slides:[
  {kicker:'The basics', heading:'Three jobs, one instant', body:[
    'Every kilowatt-hour makes three stops: a power plant <b>generates</b> it, high-voltage lines <b>transmit</b> it across long distances, and local lines <b>distribute</b> it to your building. Different companies often own each stage.',
    'The part that makes electricity strange as a product: it can’t be stored in bulk (batteries are the exception, and a small one at grid scale). Supply has to equal demand in real time, every second, or the grid destabilizes.'
  ], diagram:'gridFlow'},
  {kicker:'The basics', heading:'Someone is always balancing the whole thing', body:[
    'A grid operator watches demand rise and fall through the day and dispatches generators to match it — cheapest available first, then progressively more expensive ones as demand peaks. That dispatch order is the origin of almost every price concept later in this course.',
    'In most of the country, that operator is a regional transmission organization spanning several states. In Texas, it’s <b>ERCOT</b> — and Texas’s choice to go it alone is the subject of the next module.'
  ]},
]},
{part:'Part I · Grid Fundamentals', title:'Texas Plays by Different Rules', slides:[
  {kicker:'ERCOT', heading:'An island grid, on purpose', body:[
    'Most of Texas sits on its own electrical island. The <b>Electric Reliability Council of Texas (ERCOT)</b> runs a grid that is only thinly connected to the rest of the country — a deliberate choice, originally made to avoid federal interstate-commerce regulation.',
    'The upside: Texas sets its own market rules. The downside, exposed hard by Winter Storm Uri in 2021: when ERCOT runs short, it can’t lean on neighboring grids to import much power. It has to solve its own shortage.'
  ], diagram:'ercotIsland'},
  {kicker:'ERCOT', heading:'Deregulated, but not everywhere', body:[
    'Most of Texas uses a deregulated retail market: a <b>TDU</b> (transmission & distribution utility) owns the wires, and you choose your <b>REP</b> (retail electric provider) for the actual electricity, the way you might choose a phone carrier.',
    'Austin is a well-known exception. <b>Austin Energy</b> is a <b>municipal utility</b> — city-owned, vertically integrated, no retail choice. It generates or contracts for its own power, delivers it on its own wires, and sets its own rates (subject to City Council). That single fact is why a Council vote can approve a power plant at all.'
  ]},
]},
{part:'Part I · Grid Fundamentals', title:'What a Kilowatt-Hour Costs, and Why That’s Complicated', slides:[
  {kicker:'Pricing', heading:'Two different prices are hiding in every bill', body:[
    'Retail price is what you pay Austin Energy: a monthly customer charge, usage priced in rising tiers, plus a <b>Power Supply Adjustment (PSA)</b> that passes through fuel-cost swings. This is set by City Council and moves rarely.',
    'Wholesale price is what Austin Energy pays (or earns) inside ERCOT’s market, every 5 to 15 minutes, at a specific location. This is <b>nodal pricing</b>, and it moves constantly. Nearly every number in this documentary’s other tools is a wholesale number, not a retail one.'
  ]},
  {kicker:'Pricing', heading:'Why location matters: hubs, zones, and LZ_AEN', body:[
    'ERCOT doesn’t have one statewide price. Power is priced at thousands of individual grid locations, then aggregated into a handful of <b>trading hubs</b> (wholesale reference points) and <b>load zones</b> (where actual demand sits). Austin Energy’s load zone is <b>LZ_AEN</b> — the specific price series behind most of this project’s charts.',
    'ERCOT also runs <b>ancillary services</b> markets alongside the energy market — paying generators and batteries to stand ready for frequency regulation and reserves, separate from the energy they actually deliver.'
  ], diagram:'nodalFlow', callout:{label:'Why this matters here', text:'When you see "basis cost" in this project’s other tools, it is the gap between what Austin Energy’s own generators earn and what LZ_AEN actually costs — covered in Module 7.'}},
]},
{part:'Part II · Comparing the Options', title:'The Vocabulary of "How Much Does a Power Plant Cost"', slides:[
  {kicker:'Cost vocabulary', heading:'Five numbers you’ll see on every technology comparison', body:[
    '<b>CapEx</b> ($/kW) — what it costs to build, per kilowatt of capacity. <b>Capacity factor</b> (%) — how much of the year a plant actually runs at full output; a peaker might run 5–10%, a nuclear plant 90%+.',
    '<b>Fixed O&amp;M</b> ($/kW-yr) — costs that don’t depend on how much it runs (staff, maintenance contracts). <b>Variable O&amp;M</b> ($/MWh) — costs tied to actual output (fuel, wear). <b>LCOE</b> (levelized cost of energy, $/MWh) — all of the above, spread over the plant’s life and output, into one comparable number — but only meaningful for technologies that run on a predictable schedule.'
  ]},
  {kicker:'Cost vocabulary', heading:'Two more: WACC and cost recovery period', body:[
    '<b>WACC</b> (weighted average cost of capital) is the blended cost of the debt and equity used to finance a plant — the discount rate underneath every levelized-cost calculation. <b>CRP</b> (cost recovery period) is how many years that capital is assumed to be paid back over.',
    'The standard reference for all of these, used throughout this project, is NREL’s <b>Annual Technology Baseline (ATB)</b> — published every year with three named cost-outlook scenarios: <b>Advanced</b> (optimistic decline), <b>Moderate</b> (central case), and <b>Conservative</b> (slower decline). Those are forecasting scenarios, not a data-quality rating.'
  ], callout:{label:'One gap worth knowing', text:'ATB does not track water consumption at all — it has to be sourced separately, technology by technology, which is exactly what the Grid Technology Explorer tool in this project does.'}},
]},
{part:'Part II · Comparing the Options', title:'Dispatchable vs. Weather-Driven', slides:[
  {kicker:'Technology types', heading:'The one distinction that explains almost everything else', body:[
    '<b>Dispatchable</b> generation can be turned on and off (or up and down) on command — gas, coal, nuclear, hydro with storage, batteries. <b>Weather-driven</b> generation runs whenever the resource is available — wind, solar — and can’t be commanded to produce more.',
    'Within dispatchable gas, there’s a further split that matters a lot for this documentary: a <b>simple-cycle combustion turbine</b> (a jet-engine-like turbine only) starts in minutes but burns fuel less efficiently — the classic "peaker." A <b>combined-cycle</b> plant adds a steam turbine that captures waste heat, running more efficiently but taking longer to ramp — better suited to running many hours than to fast peaking duty.'
  ], diagram:'dispatchSpectrum'},
  {kicker:'Technology types', heading:'Baseload, peaking, and one special case: storage', body:[
    '<b>Baseload</b> plants (nuclear, coal, big combined-cycle) are built to run nearly continuously — slow and expensive to cycle on and off. <b>Peaking</b> plants exist specifically for the relatively few hours a year when demand spikes above what baseload can cover.',
    'Batteries are dispatchable but <b>energy-limited</b> — unlike a gas plant, a battery can only discharge for as long as its stored energy lasts (its "duration"), then must recharge. And one more term worth knowing: <b>black-start</b> capability — the ability to restart from a total blackout without external power — something not every technology on this list can do.'
  ]},
]},
{part:'Part II · Comparing the Options', title:'What a Battery Is Actually Good For', slides:[
  {kicker:'Storage economics', heading:'Buying low, selling high — fast', body:[
    'The simplest way a battery earns money is <b>arbitrage</b>: charge when wholesale power is cheap, discharge when it’s expensive. LZ_AEN prices typically dip in the late morning (solar pushes prices down) and spike in the early evening as solar fades and demand is still high.',
    'The value is heavily front-loaded: the first 30–60 minutes of a battery’s discharge window captures far more of that evening spike than the hours after it — which is why a battery’s <b>duration</b> (2-hour, 4-hour, and so on) matters enormously to its economics, and why more duration doesn’t add proportional value.'
  ], diagram:'diurnalCurve'},
  {kicker:'Storage economics', heading:'How Austin Energy actually contracts for batteries', body:[
    'Austin Energy’s real battery deals (with Base Power and Jupiter Power) are structured as <b>tolling agreements</b>: AE pays a fixed annual fee for the right to dispatch the battery, while the counterparty owns it and bears the capital cost and maintenance.',
    'Two more pieces worth knowing: <b>round-trip efficiency</b> (~85% is typical — a battery must draw about 18% more energy charging than it delivers discharging) and <b>virtual power plant (VPP)</b> programs, which aggregate many small batteries (like home batteries) into one dispatchable resource — the model behind Austin Energy’s residential Power Partner pilot.'
  ], callout:{label:'A caveat this project takes seriously', text:'Real ERCOT batteries have earned roughly $29,000/MW-year on average through arbitrage and ancillary services combined — well below the arbitrage-only figures many models (including some in this project) produce. Treat modeled IRR/NPV numbers as an upper bound, not a guarantee.'}},
]},
{part:'Part III · Reading Claims Like a Skeptic', title:'Basis Cost: The Number Behind the Peaker’s Justification', slides:[
  {kicker:'Basis cost', heading:'When your own power plant costs you money', body:[
    '<b>Basis cost</b> (or "adverse basis") is what happens when Austin Energy’s generation fleet settles at a lower price than what AE has to pay for LZ_AEN. AE’s plants might be running, or contracted, at one price — but Austin’s actual load is billed at the LZ_AEN price, and the gap is a real cost AE absorbs.',
    'This is the number the ~$1B peaker is justified against: the pitch is that a plant sited to serve Austin’s own load directly should reduce that gap, and AE’s own figures put historical basis cost around $110M/year, fleet-wide.'
  ], diagram:'basisCostBars'},
  {kicker:'Basis cost', heading:'Reading the trend without the strawman', body:[
    'Basis cost spiked hard in 2021 (Winter Storm Uri) and stayed elevated through 2022–23 before roughly halving by 2024–26. It’s tempting to treat this as "an Uri problem" — but Uri’s 8 days accounted for only about 11% of the multi-year total. The other 89% is ordinary day-to-day congestion, not storm-driven, which is the more honest frame for evaluating a plant meant to run for decades.',
    'One more term: the <b>Performance Credit Mechanism (PCM)</b>, ERCOT’s new capacity-like backstop starting in 2026, hasn’t shown up in any of this history yet — it will change the economics going forward in ways the historical data can’t capture.'
  ]},
]},
{part:'Part III · Reading Claims Like a Skeptic', title:'How to Read a "Pays for Itself" Claim', slides:[
  {kicker:'Financial literacy', heading:'IRR, NPV, and the words that hide big assumptions', body:[
    '<b>IRR</b> (internal rate of return) and <b>NPV</b> (net present value) both answer "is this investment worth it," but from different angles — and both depend entirely on the assumptions fed in (future prices, a discount rate, how long the asset runs). A single IRR number without its assumptions attached tells you almost nothing.',
    'One distinction to watch for: <b>levered vs. unlevered IRR</b>. Unlevered IRR is the project’s return on the whole investment; levered IRR is the return to equity investors after debt is factored in — usually higher, and easy to conflate with the other if a source isn’t explicit.'
  ]},
  {kicker:'Financial literacy', heading:'The same plant, two verdicts', body:[
    'This project found two competing ways to test whether the peaker "pays for itself" against avoided basis cost, and they disagree: a <b>simple payback</b> method (cost divided by annual savings) says about 9 years. A <b>full-cost test</b> that also counts the plant’s own fixed and financing costs shows a net annual shortfall instead. Neither is "the" answer — the method chosen changes the conclusion.',
    'When you read any claim in this project (or anywhere else), ask: is this single-sourced or corroborated? Confidence-flagged or presented as settled fact? This documentary tries to keep those flags visible rather than smoothing them into a clean story — and this course tries to do the same.'
  ], callout:{label:'A habit worth building', text:'"Pays for itself" is a claim about a method, not a fact about a plant. Always ask which method, over what time horizon, against what alternative.'}},
]},
{part:'Part IV · Austin’s Specific Story', title:'Austin Energy’s Road Here', slides:[
  {kicker:'History', heading:'Retiring coal and steam, betting on a mostly-clean mix', body:[
    'Austin Energy has been shifting away from older fossil generation for years: two Decker Creek steam units retired in 2020–21, and in 2024 the mayor called for exiting the utility’s share of the out-of-town <b>Fayette</b> coal plant by 2029.',
    'In December 2024, Council adopted an updated 2035 resource plan. Consultant modeling (Ascend Analytics) found that a fully renewable, gas-free path — internally called <b>"Portfolio B"</b> — would nearly double costs. That scenario was not advanced. That single December 2024 vote is arguably the decision that made everything after it, including the May 2026 peaker vote, possible.'
  ]},
  {kicker:'History', heading:'A very busy eighteen months', body:[
    'Between the 2035 plan and the May 2026 vote, Austin Energy signed a wave of contracts: battery deals with Base Power (residential-scale) and Jupiter Power (utility-scale, aka Balcones Ridge), a wind power-purchase agreement with Invenergy, an extension with an existing wind project, and a small but growing geothermal pilot.',
    'That build-out matters for context: the peaker wasn’t Austin Energy’s only move during this period, or even its biggest dollar commitment — but it’s the one that was voted on behind closed doors.'
  ], diagram:'roadToVote'},
]},
{part:'Part IV · Austin’s Specific Story', title:'How a Public Vote Becomes a Secret One', slides:[
  {kicker:'Governance', heading:'Open by default, closed by narrow exception', body:[
    'Texas’s Open Meetings Act requires most government decisions to happen in public, on a posted agenda, with minutes. The exceptions are narrow and specific — things like real estate negotiations, legal advice, and <b>"competitive matters"</b> for a municipally owned utility competing in a market. That last category is the one that moved the peaker item into a closed <b>executive session</b>.',
    'Once a matter is in executive session, there is no public minute-by-minute record of what was said or how each member reasoned — only that a vote happened and what it approved. That absence of a record is exactly why a documentary like this one has to work from circumstantial evidence: agendas, public comment, staff org charts, and public records requests.'
  ], diagram:'execCompare'},
  {kicker:'Governance', heading:'The paper trail that does exist', body:[
    'City staff document formal decisions through a <b>Recommendation for Action (RCA)</b>, filed in the city’s <b>EDIMS</b> records system — the primary sourcing trail for reconstructing what happened, even when the discussion itself was closed.',
    'Austin also has an <b>Electric Utility Commission (EUC)</b>, a citizen oversight body for Austin Energy. On May 11, 2026 — ten days before the vote — the EUC requested updated financial modeling on the peaker and its alternatives. Public records reviewed for this project don’t show that request was ever answered before the vote.'
  ]},
]},
{part:'Part IV · Austin’s Specific Story', title:'May 21, 2026: What Actually Happened', slides:[
  {kicker:'The vote', heading:'One item withdrawn, one item closed', body:[
    'The Council agenda for May 21, 2026 included a public item (Item 7) related to gas generation — it was withdrawn without a vote. A separate item (Item 82), placed in closed executive session for "competitive matters," is where the roughly $1 billion, 400 MW peaker plant — alongside the wind and battery contracts — was actually approved.',
    'No public vote was ever taken on the gas plant itself. That gap between the withdrawn public item and the closed-session approval is the specific fact the documentary’s title refers to.'
  ], diagram:'voteDayFlow'},
  {kicker:'The vote', heading:'Who was, and wasn’t, in the room', body:[
    'Because there are no public minutes of the executive session, this project can only work from attendance records and public status, which is inherently circumstantial — it shows who was available to vote, not how anyone reasoned. Two patterns stood out: one council member’s only absence across several checked dates was the day of the vote itself; another had a pre-existing pattern of absences unrelated to this vote.',
    'On the staff side, the AE executive who had led resource planning had not made a public appearance since more than two years before the vote, and that role was still listed as vacant and being recruited two months after the vote — worth knowing, but not proof of anything on its own. This project is careful to label attendance data as circumstantial, not as evidence of intent.'
  ]},
]},
{part:'Part IV · Austin’s Specific Story', title:'What’s Still Unresolved', slides:[
  {kicker:'Open questions', heading:'What this course — and this project — doesn’t claim to know', body:[
    'Several things remain genuinely open: whether the $1B/400MW capex figure is fully comparable to national benchmarks (it runs well above them); whether basis-cost improvement since 2021 is actually caused by the battery build-out or just coincides with it; and how the post-vote emissions cap will really constrain the plant once it’s running.',
    'This course exists so you can follow the reasoning in this project’s other tools with the right vocabulary — not to hand you a verdict. Where a tool flags a number as disputed, estimated, or single-sourced, that flag is the point, not a flaw to look past.'
  ]},
  {kicker:'Where to go next', heading:'The rest of this project, now that you have the vocabulary', body:[
    'Grid Technology Explorer for cost/performance/water data across every generation technology; Battery &amp; Peaker Economics for the full IRR/NPV modeling; Basis Cost Since Uri and the ERCOT Price Map for the price history itself; The Road to the Vote and Who Was in the Room for the governance timeline in full detail.',
    'Use the Lexicon tab any time a term doesn’t stick — it covers everything in this course plus more, organized the way this project actually uses each term.'
  ]},
]},
];

// ---------------------------------------------------------------------------
// quizzes — keyed by the 1-based module number the check-in follows
// ---------------------------------------------------------------------------

export const QUIZZES: Record<number, QuizQuestion[]> = {
2: [ // after module index 1 (Module 2)
  {q:'What makes ERCOT different from most of the rest of the U.S. grid?', choices:['It only serves municipal utilities','It is its own island, only thinly connected to neighboring grids','It has no wholesale market at all','It is run directly by the federal government'], correct:1, explain:'ERCOT is largely self-contained, which is why it must balance its own supply and demand without much help from outside Texas.'},
  {q:'What kind of company is Austin Energy?', choices:['A deregulated retail electric provider (REP)','An investor-owned utility','A municipal utility, owned by the city','A federal power authority'], correct:2, explain:'Austin Energy is city-owned and vertically integrated — unlike most of deregulated Texas, Austin residents don’t choose a retail provider.'},
  {q:'What does "nodal pricing" mean?', choices:['Every customer pays the same statewide price','Power is priced separately at many specific grid locations','Prices only change once a year','Only ERCOT staff can see prices'], correct:1, explain:'ERCOT prices power at thousands of locations; Austin Energy’s relevant price series is its load zone, LZ_AEN.'},
  {q:'What actually moves every few minutes on the wholesale market — unlike your retail bill?', choices:['The customer charge','The nodal / LZ_AEN price','Fixed O&M','The cost recovery period'], correct:1, explain:'Retail rates are set by Council and change rarely; wholesale nodal prices move constantly.'},
  {q:'Why can’t supply and demand mismatch on the grid for long?', choices:['It would raise your bill slightly','Electricity generally can’t be stored in bulk, so mismatch destabilizes the grid','It’s illegal under Texas law','ERCOT charges a penalty fee'], correct:1, explain:'Because bulk electricity storage is limited, generation must match demand essentially instant to instant.'},
],
4: [ // after module 4
  {q:'What does "capacity factor" measure?', choices:['How much a plant costs to build','How much of the year a plant actually runs at full output','How many workers a plant employs','How efficiently fuel is burned'], correct:1, explain:'A peaker might have a capacity factor of 5–10%; a nuclear plant 90%+.'},
  {q:'Why doesn’t NREL’s ATB publish a single LCOE for gas, coal, or storage?', choices:['Those technologies are too new','Their real cost depends on how often they’re actually dispatched, a market outcome not a fixed property','NREL doesn’t track them at all','LCOE only applies to nuclear'], correct:1, explain:'LCOE assumes a predictable run schedule, which fits weather/resource-driven technologies but not dispatchable ones.'},
  {q:'What do the ATB "Advanced / Moderate / Conservative" labels represent?', choices:['Data quality ratings','Three cost-outlook scenarios for how fast technology costs decline','Three different plant sizes','Regions of the country'], correct:1, explain:'They’re forecasting scenarios — Advanced assumes faster cost declines, Conservative slower — not a judgment on data reliability.'},
  {q:'What does WACC stand for, and what is it used for?', choices:['Weighted average cost of capital — the discount rate behind levelized-cost math','Watt-adjusted capacity calculation — a unit conversion','Wholesale average consumer cost — a retail rate metric','Water availability and cooling capacity'], correct:0, explain:'WACC blends the cost of debt and equity financing a project and sits underneath every LCOE calculation.'},
  {q:'Does NREL’s ATB track water consumption by technology?', choices:['Yes, for every technology','No — it has to be sourced separately','Only for nuclear and coal','Only for combined-cycle gas'], correct:1, explain:'Water consumption isn’t an ATB metric at all; this project sourced it from a separate DOE/NREL water-use study.'},
],
6: [ // after module 6
  {q:'What is the key difference between "dispatchable" and "weather-driven" generation?', choices:['Dispatchable is always cheaper','Dispatchable can be turned on/off on command; weather-driven runs only when conditions allow','Weather-driven never has emissions','There is no real difference'], correct:1, explain:'Wind and solar can’t be commanded to produce more — their output follows the weather, not a dispatch order.'},
  {q:'What’s the main tradeoff between a simple-cycle and a combined-cycle gas plant?', choices:['Simple-cycle is more fuel-efficient but slower to start','Combined-cycle starts faster but is less efficient','Simple-cycle starts in minutes but burns fuel less efficiently; combined-cycle is more efficient but slower to ramp','They are identical except for cost'], correct:2, explain:'That tradeoff is exactly why simple-cycle turbines are the go-to peaker technology.'},
  {q:'Why is a battery’s "duration" so important to its economics?', choices:['Longer duration always means proportionally more revenue','Most of the evening price-spike value is captured in the first 30–60 minutes of discharge','Duration doesn’t affect revenue at all','Batteries with longer duration charge for free'], correct:1, explain:'Value is front-loaded, so more duration doesn’t add value in proportion to its added cost.'},
  {q:'How are Austin Energy’s real battery deals (Base Power, Jupiter Power) structured?', choices:['AE owns the batteries outright','As tolling agreements — AE pays a fixed annual fee for dispatch rights while the counterparty owns the asset','As one-time purchase contracts','As free pilot programs'], correct:1, explain:'AE pays the toll; the counterparty bears capital cost, O&M, and ownership.'},
  {q:'What does the ~$29,000/MW-year real-world ERCOT battery revenue figure suggest about many modeled IRR/NPV numbers?', choices:['They’re usually too conservative','They should be treated as an upper bound, not a guarantee, since real revenue (arbitrage + ancillary) often falls short','They’re always exactly accurate','Batteries never make money in ERCOT'], correct:1, explain:'This project is explicit that arbitrage-only models tend to overstate what real batteries actually earn.'},
],
8: [ // after module 8
  {q:'What is "basis cost" (or "adverse basis")?', choices:['A late fee on your electric bill','The gap between what Austin Energy’s own generation settles for and what it pays for LZ_AEN load','A tax on gas plants','The cost of building new transmission lines'], correct:1, explain:'It’s the real cost AE absorbs when its fleet earns less than what it has to pay for Austin’s actual load.'},
  {q:'What share of the multi-year basis-cost total came from Winter Storm Uri’s 8 days?', choices:['About 89%','About 50%','About 11%','About 1%'], correct:2, explain:'The other ~89% is ordinary day-to-day congestion, which matters for judging a plant meant to run for decades.'},
  {q:'What is the difference between levered and unlevered IRR?', choices:['They are the same thing under different names','Unlevered IRR is the whole project’s return; levered IRR is the return to equity investors after debt','Levered IRR is always lower','Unlevered IRR only applies to batteries'], correct:1, explain:'Levered IRR is usually higher than unlevered, since debt financing can amplify equity returns — easy to conflate if a source isn’t explicit.'},
  {q:'In this project’s analysis, do the "simple payback" and "full-cost test" methods agree on whether the peaker pays for itself?', choices:['Yes, both say about 9 years','No — simple payback says ~9 years, the full-cost test shows a net annual shortfall','Yes, both show a shortfall','Neither method could be applied'], correct:1, explain:'The method chosen changes the conclusion — exactly the kind of thing worth asking about any "pays for itself" claim.'},
  {q:'What question should you ask about any big financial claim, per this course?', choices:['Is it exciting enough to share?','Which method was used, over what time horizon, against what alternative?','Did a computer calculate it?','Is the number round?'], correct:1, explain:'A method and its assumptions determine the answer as much as the underlying facts do.'},
],
10: [ // after module 10
  {q:'What set Austin Energy’s December 2024 resource-plan vote apart, according to this course?', choices:['It approved the peaker directly','It set aside a fully gas-free "Portfolio B" scenario, effectively making the later peaker vote possible','It closed the Fayette coal plant immediately','It happened in executive session'], correct:1, explain:'Modeling showed the gas-free path would nearly double costs, and it wasn’t advanced — a consequential, public decision that set up everything after it.'},
  {q:'Under Texas’s Open Meetings Act, when can a government body legally close its doors?', choices:['Whenever it wants','Only for a set of narrow, specific exceptions, such as certain "competitive matters"','Only during emergencies','Never — all meetings must be public'], correct:1, explain:'Open meetings are the default; closed executive sessions are a narrow, legally defined exception.'},
  {q:'What record exists after an executive session, per this course?', choices:['A full public transcript','Detailed minutes of every comment made','That a vote happened and what it approved — not a record of the discussion itself','Nothing at all, not even the outcome'], correct:2, explain:'The outcome is recorded; the reasoning and discussion are not — which is why circumstantial evidence matters so much here.'},
  {q:'What did the Electric Utility Commission (EUC) request on May 11, 2026 — ten days before the vote?', choices:['That the vote be delayed a year','Updated financial modeling on the peaker and its alternatives','A new commissioner be appointed','A public referendum'], correct:1, explain:'Public records reviewed for this project don’t show that request was answered before the vote.'},
  {q:'What is an RCA, in Austin city government?', choices:['A regional cost allocation formula','A Recommendation for Action — the formal document type used to record city decisions','A retail contract agreement','An ERCOT market rule'], correct:1, explain:'RCAs, filed in the city’s EDIMS system, are a key part of the paper trail even when a discussion itself was closed.'},
],
12: [ // after module 12
  {q:'On May 21, 2026, what happened to the public gas-generation agenda item (Item 7)?', choices:['It passed unanimously','It was withdrawn without a public vote','It was tabled for a future meeting','It failed by one vote'], correct:1, explain:'The peaker was instead approved through the separate, closed-session Item 82.'},
  {q:'What kind of evidence does this project rely on to reconstruct who was involved in the closed-session vote?', choices:['A leaked transcript','Direct testimony from every council member','Circumstantial evidence — attendance records, public status, and agendas','There is no way to know anything about it'], correct:2, explain:'This course is careful to call that evidence circumstantial — it shows availability, not reasoning or intent.'},
  {q:'Does this course conclude that the battery build-out caused the basis-cost improvement since 2021?', choices:['Yes, definitively', 'No — it’s called a leading candidate, but causation hasn’t been established', 'The two are unrelated', 'Basis cost has not changed since 2021'], correct:1, explain:'Correlation without a checked causal link — exactly the kind of claim this project flags rather than asserts.'},
  {q:'What is this course’s stance on numbers flagged elsewhere in the project as disputed or single-sourced?', choices:['Ignore the flags and present one clean story','Preserve the flags — they’re the point, not a flaw to smooth over','Only use numbers with no caveats at all','Replace disputed numbers with estimates'], correct:1, explain:'This project is built around being explicit about uncertainty rather than hiding it.'},
  {q:'Where should you go to see the full IRR/NPV modeling behind the peaker and battery comparisons?', choices:['The Lexicon tab of this course','Battery & Peaker Economics','The Road to the Vote','Who Was in the Room'], correct:1, explain:'Battery & Peaker Economics is the project’s primary financial-modeling tool, referenced throughout this course.'},
],
};

// ---------------------------------------------------------------------------
// glossary
// ---------------------------------------------------------------------------

export type GlossaryEntry = { t: string; c: string; d: string };

export const GLOSSARY: GlossaryEntry[] = [
{t:'Grid (electric grid)', c:'Foundations', d:'The connected system of generation, transmission, and distribution that moves electricity from power plants to end users.'},
{t:'Generation / Transmission / Distribution', c:'Foundations', d:'The three stages power passes through: made at a plant, moved long distances on high-voltage lines, then delivered locally on lower-voltage lines.'},
{t:'ERCOT', c:'Foundations', d:'Electric Reliability Council of Texas — operates the grid covering most of Texas as its own electrical island, only thinly tied to the rest of the U.S.'},
{t:'PUCT', c:'Foundations', d:'Public Utility Commission of Texas — the state regulator overseeing ERCOT and Texas utilities.'},
{t:'Deregulated retail market', c:'Foundations', d:'The system, used in most of Texas outside Austin, where customers choose a retail electric provider (REP) for power while a separate TDU owns the wires.'},
{t:'REP (Retail Electric Provider)', c:'Foundations', d:'A company that sells electricity to customers in deregulated Texas markets — Austin Energy customers don’t have or need one.'},
{t:'TDU (Transmission & Distribution Utility)', c:'Foundations', d:'The company that owns and maintains the wires in deregulated Texas markets, separate from the retail electricity seller.'},
{t:'Municipal utility (muni)', c:'Foundations', d:'A city-owned, vertically integrated utility like Austin Energy — generates or contracts for power, owns the wires, and sets its own rates via city government.'},
{t:'Load zone / LZ_AEN', c:'Market & Regulatory', d:'ERCOT aggregates nodal prices into load zones matching demand areas. LZ_AEN is Austin Energy’s zone — the price series behind most of this project’s charts.'},
{t:'Trading hub', c:'Market & Regulatory', d:'A wholesale reference price point in ERCOT’s nodal system, distinct from a load zone (which reflects actual local demand).'},
{t:'Settlement point price', c:'Market & Regulatory', d:'The specific price ERCOT calculates at a given grid location for a given interval — the raw building block of nodal pricing.'},
{t:'Nodal pricing', c:'Market & Regulatory', d:'ERCOT’s system of pricing power separately at thousands of specific grid locations rather than one statewide price.'},
{t:'Day-ahead / real-time market', c:'Market & Regulatory', d:'ERCOT runs both: a day-ahead market for next-day scheduling, and a real-time market settling every 5 minutes based on actual conditions.'},
{t:'Ancillary services', c:'Market & Regulatory', d:'Separate ERCOT markets paying generators and batteries to stand ready for frequency regulation and reserves, apart from the energy they deliver.'},
{t:'Performance Credit Mechanism (PCM)', c:'Market & Regulatory', d:'ERCOT’s new capacity-like reliability backstop, starting in 2026 — not reflected in any of this project’s historical price data.'},
{t:'Interconnection queue', c:'Market & Regulatory', d:'The backlog of proposed power plants waiting for ERCOT approval to connect to the grid — currently stretched by high demand, including from the Texas Energy Fund.'},
{t:'Texas Energy Fund (TEF)', c:'Market & Regulatory', d:'A state low-interest loan program financing new gas generation in Texas, cited in this project as one driver of a longer gas-turbine interconnection queue.'},
{t:'CEII', c:'Market & Regulatory', d:'Critical Energy/Electric Infrastructure Information — the federal classification that keeps real transmission-line topology out of public maps.'},
{t:'Value of Solar (VoS)', c:'Market & Regulatory', d:'Austin Energy’s own published methodology for valuing distributed solar generation — used in this project as a sourced check on battery and peaker value.'},
{t:'TCOS (avoided Transmission Cost of Service)', c:'Market & Regulatory', d:'One component of AE’s avoided-cost rate, distinct from energy-market arbitrage value.'},
{t:'Power Supply Adjustment (PSA)', c:'Market & Regulatory', d:'The fuel-cost-linked line item on Austin Energy residential bills, separate from the base rate — the most volatile part of a typical bill.'},
{t:'Dispatchable', c:'Technical & Engineering', d:'Generation that can be commanded on, off, or to a specific output level — gas, coal, nuclear, hydro, batteries.'},
{t:'Baseload', c:'Technical & Engineering', d:'Generation built to run nearly continuously (nuclear, coal, large combined-cycle) — slow and costly to cycle up and down.'},
{t:'Peaker / peaking plant', c:'Technical & Engineering', d:'A plant built to run only during the relatively few hours a year when demand spikes — valued for speed, not efficiency.'},
{t:'Simple-cycle combustion turbine', c:'Technical & Engineering', d:'A jet-engine-style gas turbine with no steam bottoming cycle — starts in minutes, burns fuel less efficiently. Austin Energy’s approved peaker is this type.'},
{t:'Combined-cycle gas plant', c:'Technical & Engineering', d:'A gas plant adding a steam turbine that captures waste heat for extra output — more efficient but slower to ramp than simple-cycle.'},
{t:'Capacity factor', c:'Technical & Engineering', d:'The share of the year a plant actually runs at full output — a peaker might run 5–10%, nuclear 90%+.'},
{t:'Black-start', c:'Technical & Engineering', d:'The ability of a power plant to restart from a total blackout without drawing power from the grid — not every technology can do this.'},
{t:'Round-trip efficiency', c:'Technical & Engineering', d:'The share of energy a battery returns on discharge relative to what it drew while charging — typically around 85%.'},
{t:'Duration (battery)', c:'Technical & Engineering', d:'How long a battery can discharge at full power before needing to recharge — e.g. "4-hour" storage. Sets the ceiling on a battery’s value per cycle.'},
{t:'Battery tolling agreement', c:'Technical & Engineering', d:'A contract where a utility pays a fixed annual fee for dispatch rights over a battery it doesn’t own — the structure behind AE’s Base Power and Jupiter Power deals.'},
{t:'Virtual power plant (VPP)', c:'Technical & Engineering', d:'Many small distributed batteries (e.g. home batteries) aggregated and dispatched as one resource — the model behind AE’s residential Power Partner pilot.'},
{t:'SCR (Selective Catalytic Reduction)', c:'Technical & Engineering', d:'An emissions-control add-on for gas plants, priced into some of this project’s technology cost benchmarks.'},
{t:'Water consumption (gal/MWh)', c:'Technical & Engineering', d:'How much cooling water a generation technology uses per unit of output — not tracked by NREL’s ATB, so sourced separately in this project. Simple-cycle peakers need essentially none; combined-cycle and steam-cycle plants need much more.'},
{t:'LCOE (Levelized Cost of Energy)', c:'Financial', d:'A single $/MWh figure combining CapEx, O&M, and financing costs over a plant’s life and expected output — only published for technologies with a predictable run schedule.'},
{t:'ATB (Annual Technology Baseline)', c:'Financial', d:'NREL’s annual reference dataset of cost and performance projections for every major generation and storage technology — the backbone of this project’s Grid Technology Explorer.'},
{t:'ATB cost cases (Advanced / Moderate / Conservative)', c:'Financial', d:'ATB’s three cost-outlook scenarios — not a data-quality rating. Advanced assumes faster cost declines, Conservative slower, Moderate is the central case.'},
{t:'CapEx', c:'Financial', d:'Capital expenditure — what it costs to build a plant, usually expressed per kilowatt of capacity ($/kW).'},
{t:'Fixed O&M / Variable O&M', c:'Financial', d:'Fixed O&M ($/kW-yr) doesn’t depend on output; Variable O&M ($/MWh) scales with how much the plant actually runs.'},
{t:'WACC (Weighted Average Cost of Capital)', c:'Financial', d:'The blended cost of debt and equity financing a project — the discount rate underlying levelized-cost math.'},
{t:'CRP (Cost Recovery Period)', c:'Financial', d:'The number of years a plant’s capital cost is assumed to be paid back over in a levelized-cost calculation.'},
{t:'IRR (Internal Rate of Return)', c:'Financial', d:'The discount rate at which a project’s net present value is zero — a common, assumption-dependent way to compare investment returns.'},
{t:'NPV (Net Present Value)', c:'Financial', d:'The sum of a project’s future cash flows, discounted back to today’s dollars at a chosen rate.'},
{t:'Levered vs. unlevered IRR', c:'Financial', d:'Unlevered IRR is the whole project’s return; levered IRR is the return to equity investors after debt financing, usually higher — easy to conflate.'},
{t:'LCOS (Levelized Cost of Storage)', c:'Financial', d:'Storage’s equivalent to LCOE — a $/MWh benchmark for battery projects, used opposite LCOE for generation in this project’s comparisons.'},
{t:'Simple payback vs. full-cost test', c:'Financial', d:'Two different ways to judge whether an investment "pays for itself" — this project found they reach opposite verdicts for the Austin peaker.'},
{t:'Arbitrage', c:'Financial', d:'Earning revenue by charging a battery when power is cheap and discharging when it’s expensive.'},
{t:'Basis cost / adverse basis', c:'Financial', d:'The gap between what Austin Energy’s own generation settles for and what AE pays for its actual LZ_AEN load — the number the peaker is justified against.'},
{t:'$/kW vs. $/kW-yr vs. $/MWh vs. $/MW-yr', c:'Financial', d:'Four different units this project is careful not to conflate: build cost, annual fixed cost, per-energy cost, and annual capacity payment, respectively.'},
{t:'Executive session', c:'Governance & Legal', d:'A closed portion of a public meeting, legally allowed only for narrow reasons — the setting in which the May 21, 2026 peaker vote actually happened.'},
{t:'Open Meetings Act (Texas)', c:'Governance & Legal', d:'State law requiring most government decisions to happen in public, on a posted agenda, with minutes — with narrow, specific exceptions.'},
{t:'"Competitive matters" classification', c:'Governance & Legal', d:'The specific legal basis used to move the peaker item into closed session, available to a municipal utility competing in a market.'},
{t:'RCA (Recommendation for Action)', c:'Governance & Legal', d:'The City of Austin’s formal document type for recording a proposed or approved city decision.'},
{t:'EDIMS', c:'Governance & Legal', d:'The City of Austin’s official records management system where RCAs and related documents are filed — a key sourcing trail for this project.'},
{t:'Electric Utility Commission (EUC)', c:'Governance & Legal', d:'Austin’s citizen oversight body for Austin Energy; requested updated financial modeling on the peaker ten days before the vote.'},
{t:'Baseline-year emissions cap', c:'Governance & Legal', d:'A fleet-wide (not plant-specific) emissions condition attached after the vote, measured against whatever AE’s fleet emitted the year before the new peaker starts running.'},
{t:'TIRZ', c:'Governance & Legal', d:'Tax Increment Reinvestment Zone — an Austin land-financing tool; unrelated to the peaker itself, but a nearby example of contested city-vote recordkeeping this project flagged.'},
{t:'Decker Creek Power Station', c:'People & Places', d:'Austin Energy’s East Austin gas plant; its two steam units retired in 2020–21, and the new peaker is discussed relative to this site.'},
{t:'Fayette Power Project', c:'People & Places', d:'An out-of-town coal plant Austin Energy holds a share of; the mayor called for exiting it by 2029.'},
{t:'Base Power', c:'People & Places', d:'Counterparty on Austin Energy’s 40MW residential-scale battery tolling contract.'},
{t:'Jupiter Power / Balcones Ridge', c:'People & Places', d:'Counterparty on Austin Energy’s up-to-100MW utility-scale battery tolling contract, publicly voted on in July 2026.'},
{t:'Winter Storm Uri', c:'People & Places', d:'The February 2021 winter storm that pushed ERCOT to the edge of total collapse and briefly sent prices to their cap — a major driver of the 2021 basis-cost spike, though not the whole story.'},
{t:'Portfolio B', c:'People & Places', d:'The fully gas-free scenario modeled for Austin Energy’s December 2024 resource plan and not advanced, after modeling showed it would nearly double costs.'},
{t:'Ascend Analytics', c:'People & Places', d:'The consulting firm whose modeling underpinned Austin Energy’s December 2024 resource-plan decision.'},
{t:'Item 7 / Item 82', c:'People & Places', d:'The two relevant agenda items on May 21, 2026: Item 7 (public gas-generation item) was withdrawn without a vote; Item 82 (closed session) is where the peaker was approved.'},
];

// ---------------------------------------------------------------------------
// diagram data — pure parameters, consumed by the Dia* components in
// SecretVoteCourse.tsx
// ---------------------------------------------------------------------------

export type FlowStep = { label: string; sub?: string };
export type FlowSpec = { kind: "flow"; steps: FlowStep[] };

export type CompareColumn = { title: string; colorVar: string; items: string[] };
export type CompareSpec = { kind: "compare"; left: CompareColumn; right: CompareColumn; vs?: string };

export type SpectrumItem = { label: string; sub: string; pos: number };
export type SpectrumSpec = { kind: "spectrum"; items: SpectrumItem[] };

export type BarDatum = { label: string; value: number; hi?: boolean };
export type BarsSpec = { kind: "bars"; data: BarDatum[]; unit: string; note?: string };

export type LinePoint = { x: string; y: number };
export type LineSpec = { kind: "line"; points: LinePoint[]; ylabel: string; shadeFrom?: number; shadeTo?: number };

export type TimelineEvent = { date: string; label: string; hi?: boolean };
export type TimelineSpec = { kind: "timeline"; events: TimelineEvent[] };

export type DiagramSpec = FlowSpec | CompareSpec | SpectrumSpec | BarsSpec | LineSpec | TimelineSpec;

export const DIAGRAM_DATA: Record<DiagramKey, DiagramSpec> = {
  gridFlow: {
    kind: "flow",
    steps: [
      { label: "Generation", sub: "power plants" },
      { label: "Transmission", sub: "high-voltage lines" },
      { label: "Distribution", sub: "local lines" },
      { label: "You", sub: "the meter" },
    ],
  },
  ercotIsland: {
    kind: "compare",
    left: {
      title: "Eastern & Western Interconnections",
      colorVar: "var(--sv-muted)",
      items: ["Cover the other 47 states", "Synchronized with each other", "Can lean on neighbors in a crunch"],
    },
    right: {
      title: "ERCOT (most of Texas)",
      colorVar: "var(--sv-teal)",
      items: ["Its own island, by design", 'Only thin DC "ties" to the rest', "Must balance itself, alone"],
    },
    vs: "vs",
  },
  nodalFlow: {
    kind: "flow",
    steps: [
      { label: "A generator", sub: "sells power" },
      { label: "Settlement point", sub: "ERCOT prices it here" },
      { label: "Load zone", sub: "LZ_AEN for Austin" },
      { label: "Your bill", sub: "via Austin Energy" },
    ],
  },
  dispatchSpectrum: {
    kind: "spectrum",
    items: [
      { label: "Nuclear / coal", sub: "baseload", pos: 0.06 },
      { label: "Combined-cycle gas", sub: "runs most hours", pos: 0.3 },
      { label: "Battery storage", sub: "fast, energy-limited", pos: 0.55 },
      { label: "Simple-cycle peaker", sub: "fast, rarely on", pos: 0.75 },
      { label: "Wind / solar", sub: "weather sets the schedule", pos: 0.95 },
    ],
  },
  execCompare: {
    kind: "compare",
    left: {
      title: "Open meeting",
      colorVar: "var(--sv-teal)",
      items: ["Posted on a public agenda", "Public can watch and speak", "Minutes and a recorded vote"],
    },
    right: {
      title: "Executive session",
      colorVar: "var(--sv-amber)",
      items: [
        "Allowed only for narrow legal reasons",
        "Doors closed, no public minutes",
        'A "competitive matters" claim is common for utility deals',
      ],
    },
    vs: "vs",
  },
  basisCostBars: {
    kind: "bars",
    data: [
      { label: "2019", value: 2.6 },
      { label: "2020", value: 3.65 },
      { label: "2021", value: 11.6, hi: true },
      { label: "2022", value: 13.2 },
      { label: "2023", value: 13.54 },
      { label: "2024", value: 7.17 },
      { label: "2025", value: 6.8 },
      { label: "2026", value: 6.06 },
    ],
    unit: "$/MWh, Austin Energy fleet-wide basis cost",
    note: "2021 = Winter Storm Uri",
  },
  diurnalCurve: {
    kind: "line",
    points: [
      { x: "12am", y: 31 },
      { x: "4am", y: 27 },
      { x: "8am", y: 29 },
      { x: "9:30am", y: 25.4 },
      { x: "12pm", y: 33 },
      { x: "4pm", y: 48 },
      { x: "7:45pm", y: 92.7 },
      { x: "10pm", y: 52 },
      { x: "11:59pm", y: 34 },
    ],
    ylabel: "illustrative $/MWh shape, LZ_AEN",
    shadeFrom: 3,
    shadeTo: 6,
  },
  roadToVote: {
    kind: "timeline",
    events: [
      { date: "2018", label: "Decker Creek retirement plan set" },
      { date: "Mar 2020", label: "Council adopts 100% carbon-free-by-2035 goal" },
      { date: "2020–21", label: "Decker's two steam units retire" },
      { date: "Feb 2021", label: "Winter Storm Uri" },
      { date: "Feb 2024", label: "Mayor calls for exiting Fayette coal by 2029" },
      { date: "Dec 2024", label: 'Council adopts updated 2035 plan; gas-free "Portfolio B" set aside' },
      { date: "2025–26", label: "Battery and wind contracts signed (Base Power, Jupiter, Invenergy)" },
      { date: "May 11, 2026", label: "EUC requests modeling before any vote" },
      { date: "May 21, 2026", label: "THE VOTE — closed session", hi: true },
      { date: "May 28, 2026", label: "Council passes pollution-cap resolution" },
    ],
  },
  voteDayFlow: {
    kind: "flow",
    steps: [
      { label: "Item 7", sub: "public gas item" },
      { label: "Withdrawn", sub: "no public vote" },
      { label: "Item 82", sub: "closed session" },
      { label: "Approved", sub: "~$1B / 400MW" },
    ],
  },
};
