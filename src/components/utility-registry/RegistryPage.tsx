import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import records from "./data/registry-records.json";
import categories from "./data/categories.json";
import statuses from "./data/statuses.json";
import findings from "./data/findings.json";
import { RegistryShell, Ext, statusClass, ConfDot, Panel, SearchBox, Select } from "./shared";

type Rec = (typeof records)[number];
const RECS = records as Rec[];
const STATUSES = statuses as string[];
const catLabel = (k: string) => categories.find((c) => c.key === k)?.label ?? k;
export const splitStates = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const uniq = (a: string[]) => Array.from(new Set(a)).sort();

const FIELDS = ["cat", "q", "type", "state", "status", "tech", "model", "conf", "sort"] as const;

const RegistryPage = () => {
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? "";
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    if (k === "cat") next.delete("tech");
    setParams(next, { replace: true });
  };
  const cat = get("cat");
  const openId = params.has("id") ? get("id") : "VPP-001";

  const inCat = cat ? RECS.filter((r) => r.category === cat) : RECS;
  const techs = uniq(inCat.flatMap((r) => r.technologies));

  const list = useMemo(() => {
    const q = get("q").toLowerCase();
    const out = inCat.filter((r) => {
      if (q) {
        const hay = [r.id, r.name, r.operator, r.state, r.utilityType, r.status, r.category, catLabel(r.category), ...r.technologies, r.businessModel, r.summary, r.outcomes, r.modelNote].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (get("type") && r.utilityType !== get("type")) return false;
      if (get("state") && !splitStates(r.state).includes(get("state"))) return false;
      if (get("status") && r.status !== get("status")) return false;
      if (get("tech") && !r.technologies.includes(get("tech"))) return false;
      if (get("model") && r.businessModel !== get("model")) return false;
      if (get("conf") && r.confidence !== get("conf")) return false;
      return true;
    });
    const sort = get("sort") || "mw";
    const cmp: Record<string, (a: Rec, b: Rec) => number> = {
      mw: (a, b) => (b.mw ?? -1) - (a.mw ?? -1),
      name: (a, b) => a.name.localeCompare(b.name),
      state: (a, b) => a.state.localeCompare(b.state),
      status: (a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status),
      category: (a, b) => a.category.localeCompare(b.category),
    };
    return [...out].sort(cmp[sort] ?? cmp.mw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const states = uniq(RECS.flatMap((r) => splitStates(r.state)));
  const statusCounts = STATUSES.map((s) => [s, RECS.filter((r) => r.status === s).length] as const).filter(([, n]) => n);
  const anyFilter = FIELDS.some((f) => params.has(f));

  const toggle = (id: string) => set("id", openId === id ? "none" : id);

  return (
    <RegistryShell title="Utility Innovation Registry" subtitle="A public record of pilots, programs and policies across the US electric utility industry, with sources and a confidence rating on every entry." seoDesc="Searchable registry of US utility pilots: virtual power plants, V2G, grid-enhancing technologies, geothermal, programs and green banks.">
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        {[["Records", RECS.length], ["Categories", categories.length], ["States and territories", states.length]].map(([l, n]) => (
          <div key={l} className="rounded-xl border p-4"><div className="uir-label">{l}</div><div className="text-3xl font-bold uir-mono">{n}</div></div>
        ))}
      </div>
      <div className="mb-6">
        <div className="flex h-3 w-full overflow-hidden rounded-full" role="img" aria-label="Records by status">
          {statusCounts.map(([s, n]) => <div key={s} className={`${statusClass(s)} uir-swatch`} style={{ width: `${(n / RECS.length) * 100}%`, padding: 0, border: 0, borderRadius: 0 }} />)}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          {statusCounts.map(([s, n]) => <span key={s} className="inline-flex items-center gap-1"><span className={`${statusClass(s)} uir-swatch`} style={{ width: 10, height: 10, padding: 0 }} />{s} <span className="uir-mono">{n}</span></span>)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Category">
        {[["", "All", RECS.length] as const, ...categories.map((c) => [c.key, c.label, RECS.filter((r) => r.category === c.key).length] as const)].map(([k, l, n]) => (
          <button key={k || "all"} onClick={() => set("cat", k)} aria-pressed={cat === k}
            className={`rounded-full border px-3 py-1.5 text-sm ${cat === k ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/50"}`}>
            {l} <span className="uir-mono opacity-75">{n}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <SearchBox value={get("q")} onChange={(v) => set("q", v)} placeholder="Search records" />
        <Select label="Utility type" value={get("type")} onChange={(v) => set("type", v)} options={[["", "All"], ...uniq(RECS.map((r) => r.utilityType))]} />
        <Select label="State" value={get("state")} onChange={(v) => set("state", v)} options={[["", "All"], ...states]} />
        <Select label="Status" value={get("status")} onChange={(v) => set("status", v)} options={[["", "All"], ...STATUSES]} />
        <Select label="Technology" value={get("tech")} onChange={(v) => set("tech", v)} options={[["", "All"], ...techs]} />
        <Select label="Business model" value={get("model")} onChange={(v) => set("model", v)} options={[["", "All"], ...uniq(RECS.map((r) => r.businessModel))]} />
        <Select label="Confidence" value={get("conf")} onChange={(v) => set("conf", v)} options={[["", "All"], "High", "Medium", "Low"]} />
        <Select label="Sort" value={get("sort") || "mw"} onChange={(v) => set("sort", v === "mw" ? "" : v)} options={[["mw", "Largest MW first"], ["name", "Name"], ["state", "State"], ["status", "Status"], ["category", "Category"]]} />
        {anyFilter && <Button variant="outline" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear filters</Button>}
      </div>
      <p className="uir-mono text-sm text-muted-foreground mb-2" aria-live="polite">{list.length} of {RECS.length} records</p>

      <ul className="border-t">
        {list.map((r) => {
          const open = openId === r.id;
          return (
            <li key={r.id} className="border-b">
              <button onClick={() => toggle(r.id)} aria-expanded={open} className="w-full text-left py-3 px-1 flex gap-3 items-start hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                <span className="uir-mono text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{r.id}</span>
                <span className="flex-1 min-w-0">
                  <span className="font-semibold">{r.name}</span> <span className="uir-label ml-1">{catLabel(r.category)}</span>
                  <span className="block text-sm text-muted-foreground">{r.operator} · {r.state} · {r.utilityType}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs"><span className={statusClass(r.status)}>{r.status}</span><span className="text-muted-foreground">{r.scale}</span><ConfDot c={r.confidence} /></span>
                </span>
                <ChevronDown className={`h-4 w-4 mt-1 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {open && <RecordDetail r={r} />}
            </li>
          );
        })}
      </ul>

      <section className="mt-10">
        <h2 className="text-xl font-bold mb-3">What the registry shows so far</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {findings.filter((f) => f.category === "All" || !cat || f.category === cat).map((f) => (
            <div key={f.title} className="rounded-xl border p-4">
              <div className="uir-label mb-1">{f.category === "All" ? "All categories" : catLabel(f.category)}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
              {f.sourceUrl && <p className="text-xs mt-2"><Ext href={f.sourceUrl}>{f.sourceLabel || "Source"}</Ext></p>}
            </div>
          ))}
        </div>
      </section>

      <Panel title="How to read this">
        <p><strong>High</strong> confidence: a utility, regulator or government source backs the main facts. <strong>Medium</strong>: trade press, vendor releases or policy trackers repeat the program details. <strong>Low</strong>: third-party summaries or marketing pages; treat figures as leads to verify.</p>
        <p>This is a first sweep, not a census. Results are mostly self-reported by sponsors, and failed pilots are rarely written up, so the registry leans toward successes.</p>
      </Panel>
    </RegistryShell>
  );
};

const RecordDetail = ({ r }: { r: Rec }) => (
  <div className="grid gap-6 md:grid-cols-[3fr_2fr] px-1 pb-5 pt-1 text-sm">
    <div className="space-y-4">
      <div><h4 className="uir-label mb-1">Description</h4><p>{r.summary}</p></div>
      <div><h4 className="uir-label mb-1">Reported outcomes</h4><p>{r.outcomes}</p></div>
      <div><h4 className="uir-label mb-1">Business model and terms</h4><p>{r.modelNote}</p></div>
      {(r.risks.length > 0 || r.riskNote) && (
        <div><h4 className="uir-label mb-1">Risks and flags</h4>
          <div className="flex flex-wrap gap-1 mb-1">{r.risks.map((x) => <span key={x} className="rounded border px-2 py-0.5 text-xs">{x}</span>)}</div>
          {r.riskNote && <p>{r.riskNote}</p>}
        </div>
      )}
    </div>
    <div className="space-y-4 rounded-lg bg-muted/40 p-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {[["Category", catLabel(r.category)], ["Operator", r.operator], ["Location", r.state], ["Utility type", r.utilityType], ["Model", r.businessModel], ["Timing", r.timing], ["Confidence", r.confidence], ["Checked", "Oct 20, 2026"]].map(([k, v]) => (
          <div key={k} className="contents"><dt className="uir-label pt-0.5">{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      {r.categoryFields.length > 0 && (
        <div><h4 className="uir-label mb-1">{catLabel(r.category)} fields</h4>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">{(r.categoryFields as { label: string; value: string }[]).map((f) => <div key={f.label} className="contents"><dt className="text-muted-foreground">{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
        </div>
      )}
      <div><h4 className="uir-label mb-1">Technologies</h4><div className="flex flex-wrap gap-1">{r.technologies.map((t) => <span key={t} className="rounded bg-primary/10 text-primary px-2 py-0.5 text-xs">{t}</span>)}</div></div>
      <div><h4 className="uir-label mb-1">Sources</h4><ul className="space-y-1">{r.sources.map((s) => <li key={s.url}><Ext href={s.url}>{s.title}</Ext></li>)}</ul></div>
    </div>
  </div>
);

export default RegistryPage;
