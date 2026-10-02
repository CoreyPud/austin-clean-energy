// Data for "Grid-Enhancing Technologies vs. the Peaker" — a new tool for this
// project (no standalone-HTML original; built directly from sourced research,
// see each item's sourceUrl below). Pulled and verified October 2026.
//
// The core interactive calculator is anchored to one real, Texas-specific,
// apples-to-apples comparison: Oncor's DOE-funded dynamic line rating (DLR)
// pilot on eight central-Texas 138kV/345kV transmission lines (2010-2014),
// which published a direct cost table comparing DLR against reconductoring
// and rebuilding the same 138kV line type. Everything else (other utilities'
// DLR results, topology optimization, power flow control, advanced
// conductors) is shown as reference case-study data, NOT fed into the
// calculator — those studies don't share a common $/MW-unlocked basis with
// the Oncor table, and forcing them onto one would manufacture false
// precision. See CASE_STUDIES below and the caveats in the component.

export type TechKey = "dlr" | "pfc" | "tto" | "advancedConductor";

export interface TechDef {
  id: TechKey;
  name: string;
  category: "Software" | "Hardware" | "Software + hardware";
  mechanism: string;
  quantifiedHere: boolean; // does the live calculator model this technology?
}

export const TECHNOLOGIES: TechDef[] = [
  {
    id: "dlr",
    name: "Dynamic line rating (DLR)",
    category: "Software + hardware",
    mechanism:
      "Replaces a transmission line's static, worst-case thermal rating (rated for the hottest, stillest, highest-load day) with a real-time one computed from actual wind, ambient temperature, and solar loading on that line — sensors plus a forecasting model, no new conductor.",
    quantifiedHere: true,
  },
  {
    id: "pfc",
    name: "Power flow controllers",
    category: "Hardware",
    mechanism:
      "Devices (the category companies like Smart Wires sell) that inject impedance into a line to reroute power flow away from a congested path onto underused parallel lines, raising effective deliverability without new conductor on the congested path itself.",
    quantifiedHere: false,
  },
  {
    id: "tto",
    name: "Transmission topology optimization",
    category: "Software",
    mechanism:
      "Pure software: reconfigures which lines and breakers are in service to relieve congestion on a network, without touching any hardware. The lowest-capex option in this group, and the only one with literally nothing to build.",
    quantifiedHere: false,
  },
  {
    id: "advancedConductor",
    name: "Advanced conductors",
    category: "Hardware",
    mechanism:
      "Carbon- or composite-core cable that runs hotter and sags less than conventional steel-core conductor at the same current — the one option in this group that's genuinely a reconductoring project, just with better cable.",
    quantifiedHere: false,
  },
];

/* ------------------------------------------------------------------ */
/*  The core grounded comparison: Oncor's own published table for a     */
/*  138kV Wood H-Frame line, DLR vs. reconductor vs. rebuild.           */
/*  Source: Oncor Smart Grid Investment Grant case study, DOE, May 2014 */
/* ------------------------------------------------------------------ */

export type SolutionId = "dlr" | "reconductor" | "rebuild";

export interface SolutionOption {
  id: SolutionId;
  label: string;
  newRatingPctOfStaticLow: number;
  newRatingPctOfStaticHigh: number;
  costPerMileLowUsd: number;
  costPerMileHighUsd: number;
  deploymentNote: string;
}

export const ONCOR_138KV_COMPARISON: SolutionOption[] = [
  {
    id: "dlr",
    label: "Dynamic line rating",
    newRatingPctOfStaticLow: 110,
    newRatingPctOfStaticHigh: 110,
    costPerMileLowUsd: 16767,
    costPerMileHighUsd: 56200,
    deploymentNote: "Operational in under a year (PPL Electric's comparable DLR rollout).",
  },
  {
    id: "reconductor",
    label: "Reconductor",
    newRatingPctOfStaticLow: 193,
    newRatingPctOfStaticHigh: 212,
    costPerMileLowUsd: 321851,
    costPerMileHighUsd: 750000,
    deploymentNote: "2–3 years, per PPL Electric's comparable reconductoring timeline.",
  },
  {
    id: "rebuild",
    label: "Rebuild",
    newRatingPctOfStaticLow: 140,
    newRatingPctOfStaticHigh: 209,
    costPerMileLowUsd: 237871,
    costPerMileHighUsd: 750000,
    deploymentNote: "Multi-year permitting and construction, same order as reconductoring or longer.",
  },
];

// DLR's uplift is only available this fraction of the time — it's a
// real-time, weather-conditional rating, not a firm one like the static
// rating it replaces (or like a peaker's nameplate capacity).
export const DLR_AVAILABILITY_LOW_PCT = 84;
export const DLR_AVAILABILITY_HIGH_PCT = 91;

/* ------------------------------------------------------------------ */
/*  Comparison benchmark: this project's own peaker scale.             */
/*  ~$1B / ~400 MW is the scale already used in this project's          */
/*  peaker-vs-battery tool — reused here rather than inventing a new    */
/*  number, so the two tools stay comparable.                          */
/* ------------------------------------------------------------------ */

export const PEAKER_BENCHMARK = {
  totalCapexUsdM: 1000,
  mw: 400,
  capexPerMwUsd: (1000 * 1_000_000) / 400, // $2.5M/MW
  note:
    "Reuses this project's own peaker-vs-battery scale (~$1B for ~400 MW of new simple-cycle peaker capacity) as the new-build benchmark, rather than inventing a separate figure. This is overnight capex only — it doesn't include the years of permitting and construction that capex is spread across, which is itself one of GETs' core advantages (see deployment timelines below).",
};

/* ------------------------------------------------------------------ */
/*  Reference case studies — context only, not wired into the          */
/*  calculator (different units, different claims, not apples-to-apples */
/*  with each other or with the Oncor table above).                    */
/* ------------------------------------------------------------------ */

export interface CaseStudy {
  id: string;
  tech: TechKey;
  place: string;
  headline: string;
  detail: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "oncor-ercot-wide",
    tech: "dlr",
    place: "ERCOT-wide (Oncor estimate, 2012 data)",
    headline: "~$20M/year in congestion-cost savings",
    detail:
      "Oncor's own DLR pilot report estimated that ERCOT-wide DLR deployment could have cut system-wide congestion costs by roughly 3%, based on 2012 congestion data — the only ERCOT-specific economic estimate found for this project.",
    sourceLabel: "Oncor DLR case study, DOE/Smart Grid Investment Grant, May 2014",
    sourceUrl: "https://www.energy.gov/sites/prod/files/2014/08/f18/Oncor-SGIG-case-study-May2014.pdf",
  },
  {
    id: "massachusetts-dlr",
    tech: "dlr",
    place: "Massachusetts",
    headline: "Average 47% increase in line capacity",
    detail:
      "A materially larger uplift than Oncor's central-Texas 8–14% — a reminder that DLR's payoff is line-specific (it depends on how conservative that line's static rating already was), not a fixed percentage.",
    sourceLabel: "NCSL / WATT Coalition case-study compilation",
    sourceUrl: "https://watt-transmission.org/unlocking-the-grid-key-benefits-grid-enhancing-technologies/",
  },
  {
    id: "new-york-dlr",
    tech: "dlr",
    place: "New York",
    headline: "Up to 60% more capacity; $3.2M avoided a 26-mile rebuild",
    detail:
      "A single DLR project avoided the need to rebuild 26 miles of transmission line, at roughly $3.2M versus what a rebuild of that length would have cost.",
    sourceLabel: "WATT Coalition, \"Unlocking the Grid\"",
    sourceUrl: "https://watt-transmission.org/unlocking-the-grid-key-benefits-grid-enhancing-technologies/",
  },
  {
    id: "pa-duquesne-dlr",
    tech: "dlr",
    place: "Pennsylvania (Duquesne Light)",
    headline: "Average 25% more capacity",
    detail: "Mid-range outcome, closer to Oncor's Texas result than Massachusetts' or New York's.",
    sourceLabel: "WATT Coalition, \"Unlocking the Grid\"",
    sourceUrl: "https://watt-transmission.org/unlocking-the-grid-key-benefits-grid-enhancing-technologies/",
  },
  {
    id: "pa-ppl-dlr-cost",
    tech: "dlr",
    place: "Pennsylvania (PPL Electric)",
    headline: "DLR under $1M vs. $20M reconductor / $40–60M rebuild",
    detail:
      "PPL's own figures for a comparable line: DLR deployed for under $1M and operational in under a year, versus roughly $20M to reconductor or $40–60M to rebuild, each taking 2–3 years. Avoided over $20M/year in grid congestion costs.",
    sourceLabel: "WATT Coalition, \"Unlocking the Grid\"",
    sourceUrl: "https://watt-transmission.org/unlocking-the-grid-key-benefits-grid-enhancing-technologies/",
  },
  {
    id: "maine-dlr-vs-newline",
    tech: "dlr",
    place: "Maine",
    headline: "$1.3M DLR vs. $900M+ new transmission line",
    detail:
      "The starkest of the published comparisons: a $1.3M DLR deployment (plus ~$277K/year operating cost) against a $900M+ new transmission line that would otherwise have been needed.",
    sourceLabel: "NCSL, \"Boosting Grid Function Without Paying for New Power Lines\"",
    sourceUrl: "https://www.ncsl.org/news/details/boosting-grid-function-without-paying-for-new-power-lines",
  },
  {
    id: "brattle-ks-ok-tto",
    tech: "tto",
    place: "Kansas / Oklahoma",
    headline: "GETs roughly doubled available capacity for new generation interconnection",
    detail:
      "A Brattle Group analysis of constrained interconnection paths in the SPP footprint — the closest thing found to a regional-scale, GETs-vs-new-build capacity comparison, though it studied generation interconnection, not an urban-import constraint like Austin's.",
    sourceLabel: "Brattle Group, presented via Massachusetts EOEEA pop-up forum on GETs",
    sourceUrl: "https://www.mass.gov/doc/ma-eoeea-pop-up-forum-on-grid-enhancing-technologies-the-brattle-group-presentation/download",
  },
  {
    id: "us-tto-congestion",
    tech: "tto",
    place: "United States (multiple studies)",
    headline: "25–50% congestion-cost reduction; up to 50% less renewables curtailment",
    detail:
      "The broadest published range for topology optimization's effect — software-only, no capex figure attached, because the \"cost\" is mostly the optimization software/service itself rather than a per-mile hardware number like DLR's.",
    sourceLabel: "WATT Coalition, \"Unlocking the Grid\"",
    sourceUrl: "https://watt-transmission.org/unlocking-the-grid-key-benefits-grid-enhancing-technologies/",
  },
  {
    id: "rmi-6gw",
    tech: "pfc",
    place: "United States (RMI study)",
    headline: "6 GW of renewable interconnection enabled; $1.3B saved vs. traditional upgrades",
    detail:
      "A system-level estimate of what GETs (mixed) could unlock for renewable interconnection specifically, not an urban load-pocket case like Austin's.",
    sourceLabel: "RMI, cited via WATT Coalition compilation",
    sourceUrl: "https://watt-transmission.org/unlocking-the-grid-key-benefits-grid-enhancing-technologies/",
  },
  {
    id: "central-hudson-pfc",
    tech: "pfc",
    place: "New York (Central Hudson)",
    headline: "Closed a 185 MW deliverability gap",
    detail:
      "An advanced power-flow-controller deployment that addressed a specific 185 MW deliverability constraint — the device achieved roughly 110% utilization of the transfer path versus ~70% with traditional flow management, on a 1,000 MW transfer-limit scenario.",
    sourceLabel: "EPRI presentation to ERCOT Technology and Security Committee, Aug 19, 2024",
    sourceUrl: "https://www.ercot.com/files/docs/2024/08/12/4-introduction-to-grid-enhancing-technologies-gets-.pdf",
  },
];

/* ------------------------------------------------------------------ */
/*  Copy                                                                */
/* ------------------------------------------------------------------ */

export const LEDE_HTML =
  "Grid-enhancing technologies (GETs) attack the same problem a new peaker is built to solve &mdash; not enough deliverable capacity where and when it's needed &mdash; from the delivery side instead of the generation side. Four distinct technologies get lumped under this name, and they shouldn't be modeled as one thing: their mechanisms, their costs, and how firm their capacity gain is all differ. This tool models the one piece with a real, apples-to-apples, Texas-specific cost table &mdash; dynamic line rating &mdash; against reconductoring, rebuilding, and this project's own peaker-build benchmark, and shows the rest as sourced reference points rather than forcing them into false precision.";

export const CALCULATOR_INTRO_HTML =
  "Oncor, the transmission utility serving much of central Texas, ran a DOE-funded dynamic line rating pilot on eight 138kV/345kV lines from 2010&ndash;2014 and published a direct cost table for one line type (138kV Wood H-Frame): dynamic line rating against reconductoring the same line, against rebuilding it outright. That table is the only ERCOT-adjacent, apples-to-apples GETs cost comparison found for this project &mdash; so it's the one driving the numbers below. Scale it to a hypothetical constrained path by setting how many miles of line and how much baseline capacity per mile you want to model.";

export const AVAILABILITY_NOTE_HTML =
  "<strong>This is the caveat that matters most.</strong> Dynamic line rating's uplift is real-time and weather-conditional &mdash; Oncor's own pilot found the higher rating available 84&ndash;91% of the time, not continuously. That's a fundamentally different kind of capacity than a peaker's nameplate MW, or even a battery operating under a firm tolling contract. Toggle the availability discount below to see the difference it makes to the comparison.";

export const EVIDENCE_GAP_HTML =
  "<strong>An honest gap, flagged the same way as elsewhere in this project's evidence index:</strong> nothing found in this project's research shows Austin Energy or City Council ever evaluating grid-enhancing technologies as an alternative to this specific peaker decision. The ERCOT Technology and Security Committee received an educational GETs presentation in August 2024, but it contains no ERCOT-specific pilot data and no connection to Austin Energy's deliberations. That's an absence of evidence that it was considered &mdash; not evidence that it was considered and rejected. Worth stating carefully if this becomes a claim in the film.";

export const UNQUANTIFIED_NOTE_HTML =
  "Power flow controllers, topology optimization, and advanced conductors are shown below as reference case studies only. None of the sources checked for this tool published a $/MW-unlocked figure for them comparable to Oncor's DLR table &mdash; their published results are point case-study totals (a $180M net benefit here, a 185 MW deliverability gap closed there), not a rate that scales. Treat the case-study cards as evidence that these technologies work somewhere, not as inputs you could use to model Austin specifically.";

export const METHODOLOGY_INTRO_HTML =
  "This tool has no original standalone HTML page &mdash; it was built directly from the sourced research below, at David's request, as a companion to the project's existing peaker-vs-battery economics tools.";

export const METHODOLOGY_ITEMS_HTML: string[] = [
  "<strong>Core calculator (DLR vs. reconductor vs. rebuild):</strong> Oncor Electric Delivery, dynamic line rating case study prepared for the U.S. Department of Energy's Smart Grid Investment Grant program, May 2014 &mdash; Table 2 (138kV Wood H-Frame line comparison).",
  "<strong>Peaker benchmark (~$1B / ~400 MW):</strong> reused from this project's own peaker-vs-battery tool rather than re-derived here &mdash; see that tool for its sourcing.",
  "<strong>Reference case studies:</strong> individually sourced per card above &mdash; WATT Coalition's \"Unlocking the Grid\" compilation, NCSL's GETs overview, a Brattle Group presentation on GETs (via Massachusetts EOEEA), and an EPRI presentation to ERCOT's own Technology and Security Committee (Aug 2024).",
  "<strong>Not independently verified beyond the source documents themselves</strong> &mdash; several of the compiled case studies (Massachusetts, New York, Pennsylvania/Duquesne) are cited secondhand through the WATT Coalition and NCSL compilations rather than traced to each utility's own primary filing.",
];

export const METHODOLOGY_OUTRO_HTML =
  "Pulled and verified October 2026. Grid-enhancing technology costs and utility pilot results are an active, fast-moving area of regulatory and vendor literature &mdash; re-check sources before using updated figures in final cut or publicity.";
