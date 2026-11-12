// Utility Innovation Registry: filtering, sorting, formatting and constants. No React in this file.
import type { RegistryRecord, Status, PilotForm } from "./utility-registry-data";
import { STATUS_ORDER } from "./utility-registry-data";

export const STATUS_VAR: Record<Status, string> = {
  Operating: "--st-op", Pilot: "--st-pilot", Approved: "--st-appr", Proposed: "--st-prop",
  "In development": "--st-dev", "On hold": "--st-hold", Completed: "--st-done",
};

export const na = "n/a";
export const num = (v: number | null | undefined, digits = 0): string =>
  v == null ? na : v.toLocaleString("en-US", { maximumFractionDigits: digits });
export const pct = (v: number | null | undefined, digits = 0): string =>
  v == null ? na : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(digits)}%`;

export interface Filters {
  cat: string; q: string; type: string; state: string; status: string;
  tech: string; model: string; conf: string; sort: string;
}
export const emptyFilters: Filters = { cat: "", q: "", type: "", state: "", status: "", tech: "", model: "", conf: "", sort: "mw" };

export const splitStates = (s: string): string[] => s.split(",").map((x) => x.trim()).filter(Boolean);

export const haystack = (r: RegistryRecord): string =>
  [r.id, r.name, r.operator, r.state, r.utilityType, r.status, r.category, r.technologies.join(" "),
   r.businessModel, r.summary, r.outcomes, r.modelNote].join(" ").toLowerCase();

export function applyFilters(all: RegistryRecord[], f: Filters, ignore: (keyof Filters)[] = []): RegistryRecord[] {
  const skip = new Set(ignore);
  const q = f.q.trim().toLowerCase();
  return all.filter((r) =>
    (skip.has("cat") || !f.cat || r.category === f.cat) &&
    (!q || haystack(r).includes(q)) &&
    (!f.type || r.utilityType === f.type) &&
    (!f.state || splitStates(r.state).includes(f.state)) &&
    (!f.status || r.status === f.status) &&
    (!f.tech || r.technologies.includes(f.tech)) &&
    (!f.model || r.businessModel === f.model) &&
    (!f.conf || r.confidence === f.conf));
}

export function sortRecords(rs: RegistryRecord[], sort: string, catOrder: string[]): RegistryRecord[] {
  const out = [...rs];
  out.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "state") return a.state.localeCompare(b.state) || a.name.localeCompare(b.name);
    if (sort === "status") return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.name.localeCompare(b.name);
    if (sort === "cat") return catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || a.id.localeCompare(b.id);
    const x = a.mw == null ? -1 : a.mw, y = b.mw == null ? -1 : b.mw;
    return y - x || a.name.localeCompare(b.name);
  });
  return out;
}

export const uniq = (xs: string[]): string[] => Array.from(new Set(xs)).sort((a, b) => a.localeCompare(b));

export const STATE_KINDS = ["100% target", "Mandatory RPS", "Voluntary goal", "Repealed", "None found"];
export const KIND_VAR: Record<string, string> = {
  "100% target": "--st-op", "Mandatory RPS": "--st-pilot", "Voluntary goal": "--st-prop", Repealed: "--st-hold", "None found": "--st-dev",
};
export const REBATE_STATUSES = ["Open", "Open with limits", "Waitlist only", "Closed", "Not launched"];
export const REBATE_VAR: Record<string, string> = { Open: "--st-op", "Open with limits": "--st-prop", "Waitlist only": "--st-prop", Closed: "--st-hold", "Not launched": "--st-dev" };

export const TECH = ["Virtual power plant", "Vehicle-to-grid", "Grid-enhancing technology", "Advanced geothermal", "Building controls and efficiency", "Business model or rate design", "Other"];
export const STAGES = ["0 Analysis", "1 Bench or simulation", "2 Field prototype", "3 Utility pilot", "4 Scaled demonstration", "5 Commercial program"];
export const REG_PATHS = ["None (research only)", "Regulatory sandbox or waiver", "Tariff or program pilot", "Rate case"];
export const DATA_SHARING = ["Open data", "On request", "Not shared"];
export const PILOT_STATUS = ["Not started", "Running", "Completed", "Stopped early"];
export const PILOT_RESULT = ["Met", "Partly met", "Not met", "Inconclusive"];
export const EVALUATORS = ["Authors only", "Independent academic", "National lab", "Regulator-approved evaluator"];

export const blankPilot: PilotForm = {
  title: "", sponsor: "", site: "", technology: "", stage: "", hypothesis: "", comparator: "", primary_metric: "", success_threshold: "",
  secondary_metrics: "", duration_sample: "", stop_rule: "", funder: "", regulatory_path: "", data_sharing: "",
  status: "Not started", result: "", result_summary: "", protocol_changes: "", evaluator: "", published_in: "",
};
export const REQUIRED_FIELDS: [keyof PilotForm, string][] = [
  ["title", "title"], ["sponsor", "sponsor"], ["technology", "technology"], ["stage", "evidence stage"], ["hypothesis", "hypothesis"],
  ["comparator", "baseline or comparator"], ["primary_metric", "primary metric"], ["success_threshold", "success threshold"],
  ["duration_sample", "duration and sample"], ["stop_rule", "stop rule"],
];
export const PILOT_LABELS: Record<keyof PilotForm, string> = {
  title: "Title", sponsor: "Sponsor", site: "Site and location", technology: "Technology", stage: "Evidence stage",
  hypothesis: "Hypothesis", comparator: "Baseline or comparator", primary_metric: "Primary metric", success_threshold: "Success threshold",
  secondary_metrics: "Secondary metrics", duration_sample: "Duration and sample", stop_rule: "Stop rule", funder: "Funder",
  regulatory_path: "Regulatory path", data_sharing: "Data sharing", status: "Status", result: "Result against threshold",
  result_summary: "Result summary", protocol_changes: "Changes from the protocol", evaluator: "Evaluator", published_in: "Published in",
};

export const LADDER: [string, string, string, string][] = [
  ["Stage 0", "Analysis", "Desk study, model or literature review.", "Method written down; data or code shared."],
  ["Stage 1", "Bench or simulation", "Lab test or simulated grid.", "Result compared with a stated baseline."],
  ["Stage 2", "Field prototype", "One site, days to months. Example: Xcel's six-car Boulder V2X pilot.", "Registered protocol; at least one full season."],
  ["Stage 3", "Utility pilot", "Several sites with real customers and tariffs. Example: Ameren's dynamic line rating sensors.", "Independent evaluator; results filed."],
  ["Stage 4", "Scaled demonstration", "Many sites under operating conditions. Example: Oncor's eight-circuit line rating program.", "Regulator decision on cost recovery."],
  ["Stage 5", "Commercial program", "Rate-based or market-based. Example: Green Mountain Power's 110 MW virtual power plant.", "Yearly results report."],
];
export const VENUES: [string, string, string, string, string][] = [
  ["Conference poster or proceedings", "Early results shown at meetings such as the American Solar Energy Society SOLAR conference", "Not confirmed", "Varies", "Evidence link for stages 0 to 2"],
  ["Preprint server", "Posted without journal review; moderators check scope, not quality (EarthArXiv)", "No", "Yes", "Fast public record; flag as not reviewed"],
  ["Peer-reviewed journal", "Experts review before publication", "Yes", "Yes", "Strongest paper evidence; slow; failures rarely appear"],
  ["OSTI.gov", "Department of Energy index of funded work, over 3 million records", "No, it indexes reviewed and unreviewed work", "Journal articles and datasets", "Source for funded studies and datasets"],
  ["Regulator docket or evaluation report", "Pilot filings, measurement and verification reports", "Reviewed by staff", "No", "Main source for utility pilots; hard to find"],
  ["Registry results report (proposed)", "Short structured report against the registered protocol", "Independent evaluator sign-off", "Proposed", "The new piece, required even for failures"],
];

