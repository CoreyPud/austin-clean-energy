// Utility Innovation Registry: one component with six tabs. Drop it into any page: <UtilityRegistry />
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import "./utility-registry.css";
import {
  records, categories, findings, stateProfiles, solarAdoption, efficiency, pilotExample, STATUS_ORDER,
  type PilotForm, type RegistryRecord, type SolarRow,
} from "./utility-registry-data";
import {
  applyFilters, blankPilot, DATA_SHARING, emptyFilters, EVALUATORS, KIND_VAR, LADDER, na, num, PILOT_LABELS, PILOT_RESULT,
  PILOT_STATUS, REBATE_STATUSES, REBATE_VAR, REG_PATHS, REQUIRED_FIELDS, sortRecords, splitStates, STAGES, STATE_KINDS, TECH,
  uniq, VENUES, type Filters,
} from "./utility-registry-engine";
import { BarCell, ColorPill, ConfidenceDot, KeyLegend, Meter, SourceList, StatusBar, StatusPill } from "./utility-registry-charts";

const CONTACT_EMAIL = ""; // Put a real address here to show a corrections link in the banner.
const AS_OF = "Oct 20, 2026";

type Tab = "registry" | "states" | "solar" | "efficiency" | "pilot" | "about";
const TABS: [Tab, string][] = [
  ["registry", "Registry"], ["states", "State profiles"], ["solar", "Solar adoption"],
  ["efficiency", "Efficiency and funding"], ["pilot", "Register a pilot"], ["about", "About"],
];
const isState = (s: string) => /^[A-Z]{2}$/.test(s);

function initialFilters(): Filters {
  const f = { ...emptyFilters };
  if (typeof window === "undefined") return f;
  const p = new URLSearchParams(window.location.search);
  (Object.keys(f) as (keyof Filters)[]).forEach((k) => { const v = p.get(k); if (v) f[k] = v; });
  return f;
}

export default function UtilityRegistry() {
  const [tab, setTab] = useState<Tab>("registry");
  const [theme, setTheme] = useState<"auto" | "light" | "dark">("auto");
  const [f, setF] = useState<Filters>(initialFilters);
  const [openIds, setOpenIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["VPP-001"];
    return [new URLSearchParams(window.location.search).get("id") || "VPP-001"];
  });
  useEffect(() => {
    try { const t = localStorage.getItem("uir-theme"); if (t === "light" || t === "dark") setTheme(t); } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    try { if (theme === "auto") localStorage.removeItem("uir-theme"); else localStorage.setItem("uir-theme", theme); } catch { /* storage unavailable */ }
  }, [theme]);
  const nextTheme = theme === "auto" ? "dark" : theme === "dark" ? "light" : "auto";
  const set = (patch: Partial<Filters>) => setF((s) => ({ ...s, ...patch }));
  const showState = (abbr: string) => { setF({ ...emptyFilters, state: abbr }); setTab("registry"); };

  return (
    <div className="uir" data-theme={theme === "auto" ? undefined : theme}>
      <div className="wrap">
        <div className="eyebrow">Utility Innovation Registry</div>
        <nav className="topnav" role="tablist" aria-label="Main">
          {TABS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`nav${tab === k ? " active" : ""}`} onClick={() => setTab(k)}>{label}</button>
          ))}
          <span className="spacer" />
          <button className="theme" onClick={() => setTheme(nextTheme)} aria-label={`Theme: ${theme}. Switch to ${nextTheme}`}>Theme: {theme}</button>
        </nav>
        <div className="banner" role="note">
          Seed data compiled {AS_OF}. Many figures come from trade press and commercial guides. Verify before relying on them.
          {CONTACT_EMAIL && <> Send corrections to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</>}
        </div>

        {tab === "registry" && <RegistryView f={f} set={set} reset={() => setF(emptyFilters)} openIds={openIds} setOpenIds={setOpenIds} />}
        {tab === "states" && <StatesView onShow={showState} />}
        {tab === "solar" && <SolarView />}
        {tab === "efficiency" && <EfficiencyView />}
        {tab === "pilot" && <PilotView />}
        {tab === "about" && <AboutView />}

        <div className="foot">A first-sweep reference, not an official record. Each record lists its sources and a confidence rating.</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Registry */

function RecordRow({ r, open, onToggle }: { r: RegistryRecord; open: boolean; onToggle: () => void }) {
  const catLabel = categories.find((c) => c.key === r.category)?.label ?? r.category;
  return (
    <li className={`rec${open ? " open" : ""}`} id={r.id}>
      <button className="head" aria-expanded={open} aria-controls={`${r.id}-body`} onClick={onToggle}>
        <span className="rid">{r.id}</span>
        <span className="nm">{r.name} <small><b className="cat">{catLabel}</b></small></span>
        <span className="cell"><span className="k">Where</span>{r.operator} · {r.state}</span>
        <span className="cell"><span className="k">Type</span>{r.utilityType}</span>
        <span className="cell"><StatusPill status={r.status} /> <span style={{ marginLeft: 6 }}>{r.scale}</span></span>
        <span className="cell confc"><ConfidenceDot level={r.confidence} /></span>
        <span className="chev" aria-hidden="true" />
      </button>
      {open && (
        <div className="body" id={`${r.id}-body`}>
          <div className="blk">
            <div><h3>Description</h3><p>{r.summary}</p></div>
            <div><h3>Reported outcomes</h3><p>{r.outcomes}</p></div>
            <div><h3>Business model and terms</h3><p>{r.modelNote}</p></div>
            <div>
              <h3>Risks and flags</h3>
              <div className="tags">{r.risks.map((x) => <span key={x} className="tag risk">{x}</span>)}</div>
              {r.riskNote && <p className="flag">{r.riskNote}</p>}
            </div>
          </div>
          <div className="blk">
            <div>
              <h3>Registration facts</h3>
              <dl className="kv">
                <dt>Category</dt><dd>{catLabel}</dd>
                <dt>Operator</dt><dd>{r.operator}</dd>
                <dt>Location</dt><dd>{r.state}</dd>
                <dt>Utility type</dt><dd>{r.utilityType}</dd>
                <dt>Model</dt><dd>{r.businessModel}</dd>
                <dt>Timing</dt><dd>{r.timing}</dd>
                <dt>Confidence</dt><dd>{r.confidence}</dd>
                <dt>Checked</dt><dd>{AS_OF}</dd>
              </dl>
            </div>
            {r.categoryFields.length > 0 && (
              <div>
                <h3>{catLabel} fields</h3>
                <dl className="kv">{r.categoryFields.map((x) => (<span key={x.label} style={{ display: "contents" }}><dt>{x.label}</dt><dd>{x.value}</dd></span>))}</dl>
              </div>
            )}
            <div><h3>Technology</h3><div className="tags">{r.technologies.map((t) => <span key={t} className="tag">{t}</span>)}</div></div>
            <div><h3>Sources</h3><SourceList sources={r.sources} /></div>
          </div>
        </div>
      )}
    </li>
  );
}

function RegistryView({ f, set, reset, openIds, setOpenIds }: {
  f: Filters; set: (p: Partial<Filters>) => void; reset: () => void; openIds: string[]; setOpenIds: (fn: (o: string[]) => string[]) => void;
}) {
  const catOrder = categories.map((c) => c.key);
  const shown = useMemo(() => sortRecords(applyFilters(records, f), f.sort, catOrder), [f]);
  const inCat = useMemo(() => records.filter((r) => !f.cat || r.category === f.cat), [f.cat]);
  const stateCount = new Set(records.flatMap((r) => splitStates(r.state)).filter(isState)).size;
  const opts = {
    type: uniq(inCat.map((r) => r.utilityType)),
    state: uniq(inCat.flatMap((r) => splitStates(r.state)).filter(isState)),
    tech: uniq(inCat.flatMap((r) => r.technologies)),
    model: uniq(inCat.map((r) => r.businessModel)),
  };
  const toggle = (id: string) => setOpenIds((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const pick = (k: keyof Filters, label: string, options: string[]) => (
    <label className="f">{label}
      <select value={f[k]} onChange={(e) => set({ [k]: e.target.value })}>
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
  const chooseCat = (cat: string) => set({ cat, tech: "", type: "", model: "", state: "" });
  const shownFindings = findings.filter((x) => x.category === "All" || !f.cat || x.category === f.cat);

  return (
    <>
      <header className="pagehead">
        <h1>Utility Innovation Registry</h1>
        <p className="lede">A public record of virtual power plants, vehicle-to-grid pilots, grid-enhancing technologies, advanced geothermal, state programs and green banks across the US electric industry. Each entry lists what was tried, the reported results, and where the claim comes from.</p>
      </header>
      <div className="stats">
        <div className="stat"><b>{records.length}</b><span>Records</span></div>
        <div className="stat"><b>{categories.length}</b><span>Categories</span></div>
        <div className="stat"><b>{stateCount}</b><span>States and territories</span></div>
        <StatusBar statuses={records.map((r) => r.status)} />
      </div>
      <div className="tabs" role="group" aria-label="Category">
        <button className="chip" aria-pressed={!f.cat} onClick={() => chooseCat("")}>All<span>{records.length}</span></button>
        {categories.map((c) => (
          <button key={c.key} className="chip" aria-pressed={f.cat === c.key} onClick={() => chooseCat(c.key)}>
            {c.label}<span>{records.filter((r) => r.category === c.key).length}</span>
          </button>
        ))}
      </div>
      <div className="tools">
        <label className="f search">Search
          <input type="search" placeholder="Search records" value={f.q} onChange={(e) => set({ q: e.target.value })} />
        </label>
        {pick("type", "Utility type", opts.type)}
        {pick("state", "State", opts.state)}
        <label className="f">Status
          <select value={f.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="">All</option>{STATUS_ORDER.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        {pick("tech", "Technology", opts.tech)}
        {pick("model", "Business model", opts.model)}
        <label className="f">Confidence
          <select value={f.conf} onChange={(e) => set({ conf: e.target.value })}>
            <option value="">All</option><option>High</option><option>Medium</option><option>Low</option>
          </select>
        </label>
        <label className="f">Sort
          <select value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
            <option value="mw">Largest MW first</option><option value="name">Name</option>
            <option value="state">State</option><option value="status">Status</option><option value="cat">Category</option>
          </select>
        </label>
      </div>
      <div className="meta-row">
        <span className="count" aria-live="polite">{shown.length} of {records.length} records</span>
        <button className="reset" onClick={reset}>Clear filters</button>
      </div>
      {shown.length === 0 ? (
        <div className="empty">No records match these filters.</div>
      ) : (
        <ol className="list">
          {shown.map((r) => <RecordRow key={r.id} r={r} open={openIds.includes(r.id)} onToggle={() => toggle(r.id)} />)}
        </ol>
      )}
      <section className="panel">
        <h2>What the registry shows so far</h2>
        <div className="findings">
          {shownFindings.map((x) => (
            <div className="finding" key={x.title}>
              <span className="eyebrow">{x.category === "All" ? "All categories" : categories.find((c) => c.key === x.category)?.label}</span>
              <b>{x.title}</b><p>{x.text}</p>
              {x.sourceUrl && <a href={x.sourceUrl} target="_blank" rel="noopener noreferrer">{x.sourceLabel || "Source"}</a>}
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>How to read this</h2>
        <div className="about">
          <div>
            <p><b>Confidence ratings</b></p>
            <ul>
              <li><b>High:</b> a utility, regulator or government source backs the main facts.</li>
              <li><b>Medium:</b> trade press, vendor releases or policy trackers repeat program details.</li>
              <li><b>Low:</b> third-party summaries or marketing pages. Treat figures as leads to verify.</li>
            </ul>
          </div>
          <div>
            <p><b>Limits</b></p>
            <ul>
              <li>Results are mostly self-reported by the operator.</li>
              <li>The registry is a first sweep. Missing entries do not mean nothing was tried.</li>
              <li>Where sources disagree, the record says so instead of picking one.</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------ State profiles */

function StatesView({ onShow }: { onShow: (abbr: string) => void }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [sort, setSort] = useState("name");
  const [open, setOpen] = useState<string[]>([]);
  const count = (abbr: string) => records.filter((r) => splitStates(r.state).includes(abbr)).length;
  const rows = useMemo(() => {
    const x = stateProfiles.filter((s) => (!kind || s.kind === kind) && (!q || `${s.name} ${s.abbr}`.toLowerCase().includes(q.toLowerCase())));
    x.sort((a, b) => sort === "records" ? count(b.abbr) - count(a.abbr) || a.name.localeCompare(b.name)
      : sort === "kind" ? STATE_KINDS.indexOf(a.kind) - STATE_KINDS.indexOf(b.kind) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name));
    return x;
  }, [q, kind, sort]);
  return (
    <>
      <header className="pagehead">
        <h1>State profiles</h1>
        <p className="lede">Each state's clean-energy standard and the main solar incentives, with the registry records for that state.</p>
      </header>
      <div className="banner" role="note">Standards use NCSL (2021 baseline) corrected with Berkeley Lab's 2025 changes. Incentives come mostly from commercial guides and are rated Low. Verify with the state energy office.</div>
      <KeyLegend items={STATE_KINDS.map((k) => ({ label: k, cssVar: KIND_VAR[k], n: stateProfiles.filter((s) => s.kind === k).length }))} />
      <div className="tools">
        <label className="f search">Search<input type="search" placeholder="Search states" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <label className="f">Standard type
          <select value={kind} onChange={(e) => setKind(e.target.value)}><option value="">All</option>{STATE_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
        </label>
        <label className="f">Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Name</option><option value="records">Registry records</option><option value="kind">Standard type</option>
          </select>
        </label>
      </div>
      <div className="meta-row"><span className="count">{rows.length} of {stateProfiles.length}</span></div>
      <ol className="list">
        {rows.map((s) => {
          const isOpen = open.includes(s.abbr);
          const n = count(s.abbr);
          return (
            <li key={s.abbr} className={`rec${isOpen ? " open" : ""}`}>
              <button className="head shead" aria-expanded={isOpen} onClick={() => setOpen((o) => isOpen ? o.filter((x) => x !== s.abbr) : [...o, s.abbr])}>
                <span className="rid">{s.abbr}</span>
                <span className="nm">{s.name}</span>
                <span className="cell"><ColorPill label={s.kind} cssVar={KIND_VAR[s.kind]} /></span>
                <span className="cell">{s.standard}</span>
                <span className="cell">{n} {n === 1 ? "record" : "records"}</span>
                <span className="chev" aria-hidden="true" />
              </button>
              {isOpen && (
                <div className="body">
                  <div className="blk">
                    <div><h3>Standard</h3><p>{s.standard}</p><p style={{ color: "var(--muted)" }}>{s.standardNote}</p></div>
                    <div>
                      <h3>Incentives</h3>
                      <ul className="recl">{s.incentives.map((i) => <li key={i}>{i}</li>)}</ul>
                      {s.incentiveNote && <p className="flag">{s.incentiveNote}</p>}
                    </div>
                  </div>
                  <div className="blk">
                    <div><h3>Confidence</h3><dl className="kv"><dt>Standard</dt><dd>{s.standardConfidence}</dd><dt>Incentives</dt><dd>{s.incentiveConfidence}</dd></dl></div>
                    <div>
                      <h3>Registry records</h3>
                      {n > 0 ? <button className="lk" onClick={() => onShow(s.abbr)}>Show {n} in registry</button> : <p>None yet.</p>}
                    </div>
                    <div>
                      <h3>Sources</h3><SourceList sources={s.sources} />
                      <p><a href="https://www.dsireusa.org/" target="_blank" rel="noopener noreferrer">DSIRE incentive database</a></p>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* ------------------------------------------------------------ Solar adoption */

const SEGMENTS: [string, string, string][] = [
  ["Residential", "4.65 GWdc", "down 2% from 2024"], ["Commercial", "2.35 GWdc", "up 6%"],
  ["Community", "1.44 GWdc", "down 25%"], ["Utility-scale", "34.7 GWdc", "down 16%"],
];
const change = (a: SolarRow): number | null => (a.ytdGwh2026 != null && a.ytdGwh2025 ? a.ytdGwh2026 / a.ytdGwh2025 - 1 : null);
const SOLAR_KEYS: Record<string, (a: SolarRow) => number | null> = {
  gen: (a) => a.ytdGwh2026, ut: (a) => a.utilityScaleGwh, rs: (a) => a.residentialGwh, cm: (a) => a.commercialGwh,
  chg: change, util: (a) => a.utilityScaleMw, pipe: (a) => a.pipelineMw,
};

function SolarView() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("gen");
  const max = Math.max(...solarAdoption.map((a) => a.ytdGwh2026 ?? 0));
  const rows = useMemo(() => {
    const x = solarAdoption.filter((a) => !q || `${a.name} ${a.abbr}`.toLowerCase().includes(q.toLowerCase()));
    x.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const g = SOLAR_KEYS[sort]; const av = g(a) ?? -1e9, bv = g(b) ?? -1e9;
      return bv - av || a.name.localeCompare(b.name);
    });
    return x;
  }, [q, sort]);
  const cell = (v: number | null, prefix = "") => (v == null ? <span className="na">{na}</span> : `${prefix}${num(v)}`);
  return (
    <>
      <header className="pagehead">
        <h1>Solar adoption by state</h1>
        <p className="lede">How much solar each state has, and where the growth is. Segment totals are national 2025 installs. The state table shows generation for January through July 2026 from EIA, split into utility-scale plants and estimated small-scale rooftop and on-site systems.</p>
      </header>
      <div className="cards">
        {SEGMENTS.map(([n, v, c]) => <div className="card" key={n}><b>{v}</b><span>{n} installs, 2025</span><em>{c}</em></div>)}
        <div className="card"><b>43.2 GWdc</b><span>Total installed in 2025</span><em>279 GWdc cumulative. Sources: SEIA and Wood Mackenzie.</em></div>
      </div>
      <div className="tools">
        <label className="f search">Search<input type="search" placeholder="Search states" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <label className="f">Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="gen">Jan-Jul 2026 solar output</option><option value="ut">Utility-scale output</option>
            <option value="rs">Residential output</option><option value="cm">Commercial output</option><option value="chg">Growth vs 2025</option>
            <option value="util">Utility-scale capacity</option><option value="pipe">Pipeline</option><option value="name">Name</option>
          </select>
        </label>
      </div>
      <div className="meta-row"><span className="count">{rows.length} of {solarAdoption.length} (50 states and DC)</span></div>
      <div className="twrap">
        <table className="tbl">
          <thead><tr>
            <th>State</th><th className="num">Jan-Jul 2026 output (GWh)</th><th></th><th className="num">Utility-scale</th><th className="num">Residential</th>
            <th className="num">Commercial</th><th className="num">Industrial</th><th className="num">Change vs 2025</th>
            <th className="num">Annual share of in-state power</th><th className="num">Utility-scale capacity (MW)</th>
            <th className="num">Pipeline 2026-28 (MW)</th><th className="num">2025 installs rank</th>
          </tr></thead>
          <tbody>
            {rows.map((a) => {
              const c = change(a);
              return (
                <tr key={a.abbr}>
                  <td className="nm2">{a.name}</td><td className="num">{cell(a.ytdGwh2026)}</td>
                  <BarCell value={a.ytdGwh2026} max={max} />
                  <td className="num">{cell(a.utilityScaleGwh)}</td><td className="num">{cell(a.residentialGwh)}</td>
                  <td className="num">{cell(a.commercialGwh)}</td><td className="num">{cell(a.industrialGwh)}</td>
                  <td className="num">{c == null ? <span className="na">{na}</span> : `${c >= 0 ? "+" : ""}${(c * 100).toFixed(0)}%`}</td>
                  <td className="num">{a.annualShare == null ? <span className="na">{na}</span> : `${a.annualShare.toFixed(1)}%`}</td>
                  <td className="num">{cell(a.utilityScaleMw, "~")}</td><td className="num">{cell(a.pipelineMw, "~")}</td>
                  <td className="num">{a.installRank2025 ?? <span className="na">{na}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <section className="panel">
        <h2>How to read this</h2>
        <div className="about">
          <div>
            <p><b>Where the split comes from</b></p>
            <p>Utility-scale, residential, commercial and industrial columns come from EIA's Electric Power Monthly, Table 1.17.B (net generation from solar photovoltaic, by state and sector, year to date through July 2026, preliminary). Residential, commercial and industrial are EIA's estimates of small-scale systems. Utility-scale includes plants of any owner, including those at commercial or industrial sites.</p>
          </div>
          <div>
            <p><b>Limits</b></p>
            <ul>
              <li>This is generation (GWh), not installed capacity. EIA publishes the capacity split by sector for the nation only.</li>
              <li>Seven months of data favor sunny months, so shares will shift by year end.</li>
              <li>Small values can round to zero. Cells EIA marked not meaningful show as n/a.</li>
              <li>Annual share, capacity and pipeline come from other sources (Choose Energy, pv magazine) and appear only where reported.</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------ Efficiency and funding */

function EfficiencyView() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name");
  const live = efficiency.filter((e) => e.rebateStatus === "Open" || e.rebateStatus === "Open with limits").length;
  const totalRebate = efficiency.reduce((s, e) => s + (e.rebateAllocationMillions ?? 0), 0);
  const totalWx = efficiency.reduce((s, e) => s + (e.weatherizationDollars ?? 0), 0);
  const rows = useMemo(() => {
    const x = efficiency.filter((e) => (!status || e.rebateStatus === status) && (!q || `${e.name} ${e.abbr} ${e.administrator}`.toLowerCase().includes(q.toLowerCase())));
    const key: Record<string, (e: typeof efficiency[number]) => number | null> = {
      alloc: (e) => e.rebateAllocationMillions, wx: (e) => e.weatherizationDollars, rank: (e) => (e.aceeeRank == null ? null : -e.aceeeRank),
    };
    x.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "status") return REBATE_STATUSES.indexOf(a.rebateStatus) - REBATE_STATUSES.indexOf(b.rebateStatus) || a.name.localeCompare(b.name);
      const g = key[sort]; return (g(b) ?? -1e12) - (g(a) ?? -1e12) || a.name.localeCompare(b.name);
    });
    return x;
  }, [q, status, sort]);
  return (
    <>
      <header className="pagehead">
        <h1>Efficiency and funding</h1>
        <p className="lede">Home energy rebates and weatherization money by state: what is funded, who runs it, and whether it is open.</p>
      </header>
      <div className="cards">
        <div className="card"><b>{live} of {efficiency.length}</b><span>Have live rebates</span><em>Status Open or Open with limits</em></div>
        <div className="card"><b>${(totalRebate / 1000).toFixed(2)}B</b><span>Rebate allocations</span><em>Potential funding as of Sept 2025</em></div>
        <div className="card"><b>${(totalWx / 1e6).toFixed(0)}M</b><span>Weatherization funding</span><em>Program year 2025 planning estimate</em></div>
        <div className="card"><b>Solar for All</b><span>Court ruling</span><em>A federal judge vacated EPA's August 2025 termination on Sept 18, 2026. EPA is weighing an appeal.</em></div>
      </div>
      <div className="tools">
        <label className="f search">Search<input type="search" placeholder="Search states or administrators" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <label className="f">Rebate status<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option>{REBATE_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="f">Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Name</option><option value="status">Rebate status</option><option value="alloc">Allocation</option>
            <option value="wx">Weatherization</option><option value="rank">ACEEE rank (best first)</option>
          </select>
        </label>
      </div>
      <div className="meta-row"><span className="count">{rows.length} of {efficiency.length}</span></div>
      <div className="twrap">
        <table className="tbl">
          <thead><tr><th>State</th><th>Rebate status</th><th className="num">Allocation ($M)</th><th>Administrator</th><th>Notes</th><th className="num">Weatherization ($M)</th><th className="num">ACEEE rank</th><th>Named in Solar for All suit</th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.abbr}>
                <td className="nm2">{e.name}</td>
                <td><ColorPill label={e.rebateStatus} cssVar={REBATE_VAR[e.rebateStatus] ?? "--st-dev"} /></td>
                <td className="num">{e.rebateAllocationMillions == null ? <span className="na">{na}</span> : num(e.rebateAllocationMillions)}</td>
                <td>{e.administrator}</td><td>{e.note}</td>
                <td className="num">{e.weatherizationDollars == null ? <span className="na">{na}</span> : (e.weatherizationDollars / 1e6).toFixed(1)}</td>
                <td className="num">{e.aceeeRank ?? <span className="na">{na}</span>}</td>
                <td>{e.namedInSolarForAllSuit ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="panel">
        <h2>How to read this</h2>
        <div className="about"><div><ul>
          <li>Allocations are potential funding as of Sept 2025.</li>
          <li>Statuses come from a commercial guide verified Oct 1, 2026.</li>
          <li>Weatherization is a program-year 2025 planning estimate.</li>
          <li>Efficiency rank is the ACEEE 2025 scorecard.</li>
        </ul></div></div>
      </section>
    </>
  );
}

/* --------------------------------------------------------- Register a pilot */

function PilotView() {
  const [v, setV] = useState<PilotForm>(blankPilot);
  const [copied, setCopied] = useState("");
  const [fallback, setFallback] = useState("");
  const on = (k: keyof PilotForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  const flags = REQUIRED_FIELDS.map(([k]) => !!v[k].trim());
  const missing = REQUIRED_FIELDS.filter(([k]) => !v[k].trim()).map(([, n]) => n);
  const keys = Object.keys(PILOT_LABELS) as (keyof PilotForm)[];
  const text = useMemo(() => keys.filter((k) => v[k].trim()).map((k) => `${PILOT_LABELS[k]}: ${v[k].trim()}`).join("\n"), [v]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied("Copied."); setFallback(""); }
    catch { setFallback(text); setCopied("Copy it from the box below."); }
  };
  const select = (k: keyof PilotForm, label: string, opts: string[], req = false) => (
    <label className="f">{label}{req && <span className="req"> *</span>}
      <select value={v[k]} onChange={on(k)}><option value="">Choose</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>
    </label>
  );
  const line = (k: keyof PilotForm, label: string, req = false) => (
    <label className="f">{label}{req && <span className="req"> *</span>}<input type="text" value={v[k]} onChange={on(k)} /></label>
  );
  const area = (k: keyof PilotForm, label: string, req = false) => (
    <label className="f">{label}{req && <span className="req"> *</span>}<textarea value={v[k]} onChange={on(k)} /></label>
  );
  return (
    <>
      <header className="pagehead">
        <h1>Register a pilot</h1>
        <p className="lede">File the test before the pilot starts: what you expect, what you will measure, what counts as success, and when you will stop. Fields marked * are the ten pre-registration fields. Nothing is saved or sent yet.</p>
      </header>
      <div className="formgrid">
        <form className="pilot" onSubmit={(e) => e.preventDefault()} autoComplete="off">
          <div className="btnrow">
            <button type="button" className="btn ghost" onClick={() => setV(pilotExample)}>Load example</button>
            <button type="button" className="btn ghost" onClick={() => { setV(blankPilot); setCopied(""); setFallback(""); }}>Clear</button>
          </div>
          <fieldset><legend>1. Who and what</legend>
            {line("title", "Title", true)}{line("sponsor", "Sponsor", true)}{line("site", "Site and location")}
            <div className="two">{select("technology", "Technology", TECH, true)}{select("stage", "Evidence stage", STAGES, true)}</div>
          </fieldset>
          <fieldset><legend>2. Protocol, filed before the start</legend>
            {area("hypothesis", "Hypothesis", true)}{area("comparator", "Baseline or comparator", true)}{line("primary_metric", "Primary metric", true)}
            {area("success_threshold", "Success threshold", true)}{area("secondary_metrics", "Secondary metrics")}{line("duration_sample", "Duration and sample", true)}{area("stop_rule", "Stop rule", true)}
          </fieldset>
          <fieldset><legend>3. Money, rules and data</legend>
            {line("funder", "Funder")}
            <div className="two">{select("regulatory_path", "Regulatory path", REG_PATHS)}{select("data_sharing", "Data sharing", DATA_SHARING)}</div>
          </fieldset>
          <fieldset><legend>4. Results report, filed after</legend>
            <div className="two">{select("status", "Status", PILOT_STATUS)}{select("result", "Result against threshold", PILOT_RESULT)}</div>
            {area("result_summary", "Result summary")}{area("protocol_changes", "Changes from the protocol")}
            <div className="two">{select("evaluator", "Evaluator", EVALUATORS)}{line("published_in", "Published in")}</div>
          </fieldset>
        </form>
        <aside className="sticky" aria-label="Record preview">
          <Meter flags={flags} missing={missing} />
          <dl className="pv">
            {keys.map((k) => (
              <div key={k}><dt>{PILOT_LABELS[k]}</dt><dd className={v[k].trim() ? undefined : "none"}>{v[k].trim() || "Not filled"}</dd></div>
            ))}
          </dl>
          <div className="btnrow"><button type="button" className="btn" onClick={copy}>Copy record as text</button></div>
          {copied && <div className="txt" role="status">{copied}</div>}
          {fallback && <textarea readOnly value={fallback} onFocus={(e) => e.currentTarget.select()} />}
        </aside>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------- About */

function AboutView() {
  return (
    <>
      <header className="pagehead">
        <h1>About this registry</h1>
        <p className="lede">Medical trials are registered before they start, so results can be judged against what was promised. Utility pilots are not. They live in press releases, regulator dockets and conference posters, and failures rarely get written up. This registry starts with what has already been tried, and adds a pre-registration form so future pilots state their test up front.</p>
      </header>
      <section className="panel">
        <h2>The evidence ladder</h2>
        <p className="lede" style={{ marginBottom: 14 }}>A proposal, not an existing standard. Each stage has a gate to clear before moving up.</p>
        <ol className="ladder">
          {LADDER.map(([n, t, p, g]) => (
            <li key={n}><span className="n">{n}</span><b>{t}</b><p>{p}</p><div className="gate"><span>Gate</span>{g}</div></li>
          ))}
        </ol>
      </section>
      <section className="panel">
        <h2>Where results get published</h2>
        <div className="twrap">
          <table className="tbl plain">
            <thead><tr><th>Venue</th><th>What it is</th><th>Peer reviewed</th><th>DOI</th><th>Role</th></tr></thead>
            <tbody>{VENUES.map((x) => <tr key={x[0]}>{x.map((c, i) => <td key={i} className={i === 0 ? "nm2" : undefined} style={i === 0 ? { whiteSpace: "normal" } : undefined}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
          Sources: <a href="https://www.osti.gov/faq" target="_blank" rel="noopener noreferrer">OSTI FAQ</a> and{" "}
          <a href="https://eos.org/project-updates/earth-science-is-ready-for-preprints" target="_blank" rel="noopener noreferrer">Eos on preprints</a>.
        </p>
      </section>
      <section className="panel">
        <h2>Open questions</h2>
        <div className="about"><div><ul>
          <li><b>Who hosts it:</b> a national lab, a university center, a trade group, or an independent nonprofit.</li>
          <li><b>Who checks entries:</b> start with self-registration, add verified status later.</li>
          <li><b>Why sponsors would file failures:</b> make a filed protocol and results report a condition of grants or regulatory cost recovery.</li>
        </ul></div></div>
      </section>
    </>
  );
}
