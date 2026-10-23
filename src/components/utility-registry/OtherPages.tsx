import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import records from "./data/registry-records.json";
import profiles from "./data/state-profiles.json";
import solar from "./data/solar-adoption.json";
import eff from "./data/efficiency-funding.json";
import { RegistryShell, Ext, statusClass, ConfDot, Panel, SearchBox, Select, BASE } from "./shared";

const splitStates = (s: string) => s.split(",").map((x) => x.trim());
const recsFor = (abbr: string) => records.filter((r) => splitStates(r.state).includes(abbr));
const KINDS = ["100% target", "Mandatory RPS", "Voluntary goal", "Repealed", "None found"];
const na = (v: unknown, f: (x: number) => string = (x) => x.toLocaleString()) => (v == null ? "n/a" : typeof v === "number" ? f(v) : String(v));

/* ---------- State profiles ---------- */
export const StatesPage = () => {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [sort, setSort] = useState("name");
  const [open, setOpen] = useState<string | null>(null);
  let rows = profiles.filter((p) => (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.abbr.toLowerCase() === q.toLowerCase()) && (!kind || p.kind === kind));
  rows = [...rows].sort(sort === "records" ? (a, b) => recsFor(b.abbr).length - recsFor(a.abbr).length : sort === "kind" ? (a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) : (a, b) => a.name.localeCompare(b.name));
  return (
    <RegistryShell title="State profiles" subtitle="Clean energy standards and solar incentives for all 50 states and DC, with links to registry records in each state." seoDesc="State-by-state renewable portfolio standards, clean energy targets and solar incentives, with confidence ratings.">
      <p className="mb-4 rounded-md border px-3 py-2 text-sm bg-muted/40">Standards use NCSL (2021 baseline) corrected with Berkeley Lab's 2025 changes. Incentives come mostly from commercial guides and are rated Low. Verify with the state energy office.</p>
      <div className="flex flex-wrap items-end gap-3 mb-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search states" />
        <Select label="Standard type" value={kind} onChange={setKind} options={[["", "All"], ...KINDS]} />
        <Select label="Sort" value={sort} onChange={setSort} options={[["name", "Name"], ["records", "Registry records"], ["kind", "Standard type"]]} />
      </div>
      <div className="flex flex-wrap gap-3 text-xs mb-3">{KINDS.map((k) => <span key={k} className="inline-flex items-center gap-1"><span className={statusClass(k)}>{k}</span><span className="uir-mono">{profiles.filter((p) => p.kind === k).length}</span></span>)}</div>
      <p className="uir-mono text-sm text-muted-foreground mb-2">{rows.length} of {profiles.length} states</p>
      <ul className="border-t">
        {rows.map((p) => {
          const isOpen = open === p.abbr; const recs = recsFor(p.abbr);
          return (
            <li key={p.abbr} className="border-b">
              <button aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.abbr)} className="w-full text-left py-3 px-1 flex gap-3 items-center hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                <span className="uir-mono w-8 text-muted-foreground">{p.abbr}</span>
                <span className="flex-1 min-w-0"><span className="font-semibold">{p.name}</span> <span className={statusClass(p.kind) + " ml-2"}>{p.kind}</span><span className="block text-sm text-muted-foreground truncate">{p.standard}</span></span>
                <span className="uir-mono text-sm" title="Registry records">{recs.length}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {isOpen && (
                <div className="grid gap-6 md:grid-cols-2 px-1 pb-5 text-sm">
                  <div className="space-y-3">
                    <div><h4 className="uir-label mb-1">Standard</h4><p>{p.standard}</p><p className="text-muted-foreground mt-1">{p.standardNote}</p></div>
                    <div><h4 className="uir-label mb-1">Incentives</h4><ul className="list-disc pl-5">{p.incentives.map((i) => <li key={i}>{i}</li>)}</ul>{p.incentiveNote && <p className="mt-2 rounded border border-accent/40 bg-accent/10 px-2 py-1">{p.incentiveNote}</p>}</div>
                    <div className="flex gap-4"><span className="uir-label">Standard</span><ConfDot c={p.standardConfidence} /><span className="uir-label">Incentives</span><ConfDot c={p.incentiveConfidence} /></div>
                  </div>
                  <div className="space-y-3 rounded-lg bg-muted/40 p-4">
                    <div><h4 className="uir-label mb-1">Registry records ({recs.length})</h4>
                      {recs.length ? <><ul className="space-y-1">{recs.map((r) => <li key={r.id}><Link className="text-primary underline" to={`${BASE}?id=${r.id}`}>{r.id}</Link> {r.name}</li>)}</ul><Link className="inline-block mt-2 text-primary underline font-medium" to={`${BASE}?state=${p.abbr}`}>Show in registry</Link></> : <p className="text-muted-foreground">None yet.</p>}
                    </div>
                    <div><h4 className="uir-label mb-1">Sources</h4><ul className="space-y-1">{p.sources.map((s) => <li key={s.url}><Ext href={s.url}>{s.title}</Ext></li>)}<li><Ext href="https://www.dsireusa.org/">DSIRE incentive database</Ext></li></ul></div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </RegistryShell>
  );
};

/* ---------- Solar adoption ---------- */
type SRow = (typeof solar)[number];
const growth = (r: SRow) => (r.ytdGwh2025 ? r.ytdGwh2026 / r.ytdGwh2025 - 1 : null);
const SOLAR_COLS: [string, string, (r: SRow) => number | null][] = [
  ["ytdGwh2026", "Jan-Jul 2026 GWh", (r) => r.ytdGwh2026], ["utilityScaleGwh", "Utility-scale", (r) => r.utilityScaleGwh],
  ["residentialGwh", "Residential", (r) => r.residentialGwh], ["commercialGwh", "Commercial", (r) => r.commercialGwh],
  ["industrialGwh", "Industrial", (r) => r.industrialGwh], ["growth", "vs 2025", growth],
  ["annualShare", "Annual share", (r) => r.annualShare as number | null], ["utilityScaleMw", "Utility MW", (r) => r.utilityScaleMw as number | null],
  ["pipelineMw", "Pipeline MW", (r) => r.pipelineMw as number | null], ["installRank2025", "2025 install rank", (r) => r.installRank2025 as number | null],
];
export const SolarPage = () => {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ k: string; asc: boolean }>({ k: "ytdGwh2026", asc: false });
  const max = Math.max(...solar.map((r) => r.ytdGwh2026));
  const getter = sort.k === "name" ? null : SOLAR_COLS.find((c) => c[0] === sort.k)![2];
  const rows = solar.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.abbr.toLowerCase() === q.toLowerCase())
    .sort((a, b) => {
      if (!getter) return sort.asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      const x = getter(a), y = getter(b);
      if (x == null) return 1; if (y == null) return -1;
      return sort.asc ? x - y : y - x;
    });
  const click = (k: string) => setSort((s) => ({ k, asc: s.k === k ? !s.asc : k === "name" || k === "installRank2025" }));
  const fmt = (k: string, v: number | null) => v == null ? "n/a" : k === "growth" ? `${v >= 0 ? "+" : ""}${(v * 100).toFixed(0)}%` : k === "annualShare" ? `${v}%` : v.toLocaleString();
  const cards = [["Residential", "4.65", "down 2%"], ["Commercial", "2.35", "up 6%"], ["Community", "1.44", "down 25%"], ["Utility-scale", "34.7", "down 16%"], ["Total 2025", "43.2", "279 GWdc cumulative"]];
  return (
    <RegistryShell title="Solar adoption by state" subtitle="How much solar each state generated January through July 2026, split by segment, with 2025 national installs." seoDesc="State-by-state solar generation for Jan-Jul 2026 from EIA, split into utility-scale, residential, commercial and industrial.">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5 mb-2">
        {cards.map(([l, v, n]) => <div key={l} className="rounded-xl border p-4"><div className="uir-label">{l}</div><div className="text-2xl font-bold uir-mono">{v} <span className="text-sm font-normal">GWdc</span></div><div className="text-xs text-muted-foreground">{n}</div></div>)}
      </div>
      <p className="text-xs text-muted-foreground mb-6">2025 national installs. Sources: SEIA and Wood Mackenzie.</p>
      <div className="mb-3"><SearchBox value={q} onChange={setQ} placeholder="Search states" /></div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="uir-table min-w-[1000px]">
          <thead><tr>
            <th><button onClick={() => click("name")} className="uir-label hover:text-primary">State</button></th>
            {SOLAR_COLS.map(([k, l]) => <th key={k} className="num" aria-sort={sort.k === k ? (sort.asc ? "ascending" : "descending") : undefined}><button onClick={() => click(k)} className="uir-label hover:text-primary">{l}{sort.k === k ? (sort.asc ? " ↑" : " ↓") : ""}</button></th>)}
          </tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.abbr}>
              <td className="whitespace-nowrap font-medium">{r.name}</td>
              {SOLAR_COLS.map(([k, , g]) => (
                <td key={k} className="num">{k === "ytdGwh2026" ? (
                  <div className="flex items-center justify-end gap-2"><div className="h-2 rounded bg-primary/70" style={{ width: `${(r.ytdGwh2026 / max) * 80}px` }} />{fmt(k, g(r))}</div>
                ) : fmt(k, g(r))}</td>
              ))}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Panel title="How to read this">
        <p>The segment split is generation, not capacity. Residential, commercial and industrial values are EIA estimates of small-scale systems (Electric Power Monthly Table 1.17.B, January to July, preliminary).</p>
        <p>Utility-scale includes plants at any owner. Seven months of data favor the sunny months, so these are not annual totals. The capacity split by sector is national only.</p>
        <p>Annual share, utility-scale capacity, pipeline and install rank come from other sources and are missing for many states ("n/a").</p>
      </Panel>
    </RegistryShell>
  );
};

/* ---------- Efficiency and funding ---------- */
const LIVE = ["Open", "Open with limits"];
export const EfficiencyPage = () => {
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [sort, setSort] = useState("name");
  const live = eff.filter((e) => LIVE.includes(e.rebateStatus)).length;
  const totalRebate = eff.reduce((s, e) => s + (e.rebateAllocationMillions ?? 0), 0);
  const totalWx = eff.reduce((s, e) => s + (e.weatherizationDollars ?? 0), 0);
  const rows = eff.filter((e) => (!q || e.name.toLowerCase().includes(q.toLowerCase())) && (!status || e.rebateStatus === status))
    .sort(sort === "alloc" ? (a, b) => (b.rebateAllocationMillions ?? -1) - (a.rebateAllocationMillions ?? -1) : sort === "wx" ? (a, b) => b.weatherizationDollars - a.weatherizationDollars : sort === "aceee" ? (a, b) => (a.aceeeRank ?? 99) - (b.aceeeRank ?? 99) : (a, b) => a.name.localeCompare(b.name));
  const statusList = Array.from(new Set(eff.map((e) => e.rebateStatus)));
  return (
    <RegistryShell title="Efficiency and funding" subtitle="Federal home energy rebates, weatherization funding and efficiency rankings for all 50 states and DC." seoDesc="State status of federal home energy rebates, weatherization funding, ACEEE efficiency rank and Solar for All litigation.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-xl border p-4"><div className="uir-label">Home energy rebates</div><div className="text-2xl font-bold">{live} of {eff.length} have live rebates</div></div>
        <div className="rounded-xl border p-4"><div className="uir-label">Rebate allocation</div><div className="text-2xl font-bold uir-mono">${(totalRebate / 1000).toFixed(2)}B</div></div>
        <div className="rounded-xl border p-4"><div className="uir-label">Weatherization</div><div className="text-2xl font-bold uir-mono">${(totalWx / 1e6).toFixed(1)}M</div></div>
        <div className="rounded-xl border p-4"><div className="uir-label">Solar for All</div><p className="text-sm">A federal judge vacated EPA's August 2025 termination on Sept 18, 2026. EPA is weighing an appeal.</p></div>
      </div>
      <div className="flex flex-wrap items-end gap-3 mb-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search states" />
        <Select label="Rebate status" value={status} onChange={setStatus} options={[["", "All"], ...statusList]} />
        <Select label="Sort" value={sort} onChange={setSort} options={[["name", "Name"], ["alloc", "Allocation"], ["wx", "Weatherization"], ["aceee", "ACEEE rank"]]} />
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="uir-table min-w-[900px]">
          <thead><tr>{["State", "Rebate status", "Allocation ($M)", "Administrator", "Notes", "Weatherization ($M)", "ACEEE rank", "In Solar for All suit"].map((h, i) => <th key={h} className={`uir-label ${[2, 5, 6].includes(i) ? "num" : ""}`}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((e) => (
            <tr key={e.abbr}>
              <td className="font-medium whitespace-nowrap">{e.name}</td>
              <td><span className={statusClass(e.rebateStatus)}>{e.rebateStatus}</span></td>
              <td className="num">{na(e.rebateAllocationMillions)}</td>
              <td>{e.administrator}</td>
              <td className="text-muted-foreground">{e.note}</td>
              <td className="num">{na(e.weatherizationDollars, (x) => (x / 1e6).toFixed(1))}</td>
              <td className="num">{na(e.aceeeRank)}</td>
              <td>{e.namedInSolarForAllSuit ? "Yes" : "No"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Panel title="How to read this">
        <p>Allocations are potential funding as of Sept 2025. Statuses come from a commercial guide verified Oct 1, 2026. Weatherization is a program-year 2025 planning estimate. Efficiency rank is the ACEEE 2025 scorecard.</p>
      </Panel>
    </RegistryShell>
  );
};

/* ---------- About ---------- */
const LADDER = [
  ["0", "Analysis", "Desk study, model or literature review.", "", "Method written down; data or code shared."],
  ["1", "Bench or simulation", "Lab test or simulated grid.", "", "Result compared with a stated baseline."],
  ["2", "Field prototype", "One site, days to months.", "Xcel's six-car Boulder V2X pilot.", "Registered protocol; at least one full season."],
  ["3", "Utility pilot", "Several sites with real customers and tariffs.", "Ameren's dynamic line rating sensors.", "Independent evaluator; results filed."],
  ["4", "Scaled demonstration", "Many sites under operating conditions.", "Oncor's eight-circuit line rating program.", "Regulator decision on cost recovery."],
  ["5", "Commercial program", "Rate-based or market-based.", "Green Mountain Power's 110 MW virtual power plant.", "Ongoing: yearly results report."],
];
const VENUES = [
  ["Conference poster or proceedings", "Early results shown at meetings such as the American Solar Energy Society SOLAR conference", "Not confirmed", "Varies", "Evidence link for stages 0 to 2"],
  ["Preprint server", "Posted without journal review; moderators check scope, not quality (EarthArXiv)", "No", "Yes", "Fast public record; flag as not reviewed"],
  ["Peer-reviewed journal", "Experts review before publication", "Yes", "Yes", "Strongest paper evidence; slow; failures rarely appear"],
  ["OSTI.gov", "Department of Energy index of funded work, over 3 million records", "No, it indexes reviewed and unreviewed work", "Journal articles and datasets", "Source for funded studies and datasets"],
  ["Regulator docket or evaluation report", "Pilot filings, measurement and verification reports", "Reviewed by staff", "No", "Main source for utility pilots; hard to find"],
  ["Registry results report (proposed)", "Short structured report against the registered protocol", "Independent evaluator sign-off", "Proposed", "The new piece, required even for failures"],
];
export const AboutPage = () => (
  <RegistryShell title="About the registry" subtitle="Why utility pilots should be registered before they start, and how evidence could move up a ladder." seoDesc="Why a utility innovation registry, the proposed evidence ladder, and where pilot results get published.">
    <section className="max-w-3xl"><h2 className="text-xl font-bold mb-2">Why this exists</h2>
      <p className="text-muted-foreground">Medical trials are registered before they start, so results can be judged against what was promised. Utility pilots are not. They live in press releases, regulator dockets and conference posters, and failures rarely get written up. This registry starts with what has already been tried, and adds a pre-registration form so future pilots state their test up front.</p></section>
    <section className="mt-10"><h2 className="text-xl font-bold mb-1">The evidence ladder</h2><p className="text-sm text-muted-foreground mb-4">A proposal, not an existing standard.</p>
      <ol className="space-y-3">{LADDER.map(([n, t, d, ex, g]) => (
        <li key={n} className="rounded-xl border p-4 grid gap-2 md:grid-cols-[auto_1fr_1fr]">
          <span className="uir-mono text-2xl font-bold text-primary w-10">{n}</span>
          <div><h3 className="font-semibold">{t}</h3><p className="text-sm text-muted-foreground">{d}</p>{ex && <p className="text-sm mt-1"><span className="uir-label">Example</span> {ex}</p>}</div>
          <p className="text-sm"><span className="uir-label block">Gate to move up</span>{g}</p>
        </li>))}</ol></section>
    <section className="mt-10"><h2 className="text-xl font-bold mb-3">Where results get published</h2>
      <div className="overflow-x-auto border rounded-lg"><table className="uir-table min-w-[800px]">
        <thead><tr>{["Venue", "What it is", "Peer reviewed", "DOI", "Role"].map((h) => <th key={h} className="uir-label">{h}</th>)}</tr></thead>
        <tbody>{VENUES.map((v) => <tr key={v[0]}>{v.map((c, i) => <td key={i} className={i === 0 ? "font-medium" : ""}>{c}</td>)}</tr>)}</tbody>
      </table></div>
      <p className="text-xs text-muted-foreground mt-2">Sources: <Ext href="https://www.osti.gov/faq">OSTI FAQ</Ext>, <Ext href="https://eos.org/project-updates/earth-science-is-ready-for-preprints">Eos: Earth science is ready for preprints</Ext></p></section>
    <section className="mt-10 max-w-3xl"><h2 className="text-xl font-bold mb-2">Open questions</h2>
      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
        <li>Who hosts it: a national lab, a university center, a trade group, or an independent nonprofit.</li>
        <li>Who checks entries: start with self-registration, add verified status later.</li>
        <li>Why sponsors would file failures: make a filed protocol and results report a condition of grants or regulatory cost recovery.</li>
      </ul></section>
  </RegistryShell>
);
