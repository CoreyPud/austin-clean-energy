import { useEffect, useMemo, useState } from "react";
import CouncilNav from "@/components/CouncilNav";
import { supabase } from "@/integrations/supabase/client";

// Read-only register generated offline by decisions-poc and written to
// public/data/council-decisions.json. Fetched at load (kept out of the JS bundle);
// swap to Supabase later without changing this component's shape.
interface SourceRef { docType: string; url: string; locator: string; quote: string }
interface Decision {
  id: string; meetingDate: string; itemNumber: string; body: string;
  title: string; topic: string; isClimate: boolean; significance: string; summary: string;
  outcome: string; result: string; decidedInClosedSession: boolean;
  closedSession: { itemNumber: string; statutes: string[]; disposition: string } | null;
  vote: { recorded: boolean; tally: string | null; dissenters: string[]; reason?: string };
  verification: string; flags: string[]; references: SourceRef[];
}
interface Payload { meta: { generatedAt: string; years: string[]; llmModel: string; counts: Record<string, number> }; decisions: Decision[] }

// When reading from Supabase there's no stored meta row — derive the header stats from the rows.
function deriveMeta(ds: Decision[]): Payload["meta"] {
  return {
    generatedAt: "",
    llmModel: "gpt-4o-mini",
    years: [...new Set(ds.map((d) => d.meetingDate.slice(0, 4)))].sort(),
    counts: {
      decisions: ds.length,
      climate: ds.filter((d) => d.isClimate).length,
      meetings: new Set(ds.map((d) => d.meetingDate)).size,
    },
  };
}

const OUTCOME_STYLE: Record<string, string> = {
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  approved_on_consent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  postponed: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  withdrawn: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  conducted_and_approved: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  failed: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};
const label = (s: string) => s.replace(/_/g, " ");

function Chip({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

export default function CouncilDecisions() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [outcome, setOutcome] = useState("");
  const [climateOnly, setClimateOnly] = useState(true);
  const [closedOnly, setClosedOnly] = useState(false);
  const [showRoutine, setShowRoutine] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Supabase is the source of truth; page through all rows (>1000).
        const all: Decision[] = [];
        const PAGE = 1000;
        for (let from = 0; ; from += PAGE) {
          // cast: council_decisions isn't in the generated types until Lovable creates it
          // council_decisions is now shared with the voting feature's sync scripts, whose rows
          // don't carry a `data` blob -- filter to decisions-poc's own rows only.
          const { data: rows, error } = await (supabase as any)
            .from("council_decisions").select("data")
            .not("data", "is", null)
            .order("meeting_date", { ascending: false })
            .range(from, from + PAGE - 1);
          if (error) throw error;
          if (!rows?.length) break;
          all.push(...rows.map((r: { data: Decision }) => r.data));
          if (rows.length < PAGE) break;
        }
        if (all.length) { setData({ decisions: all, meta: deriveMeta(all) }); return; }
        throw new Error("council_decisions empty");
      } catch {
        // Fallback to the static file (works before the table is created/loaded).
        try {
          const res = await fetch("/data/council-decisions.json");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setData(await res.json());
        } catch (e) { setErr(String(e)); }
      }
    })();
  }, []);

  const topics = useMemo(
    () => [...new Set((data?.decisions ?? []).filter((d) => d.isClimate).map((d) => d.topic))].sort(),
    [data],
  );
  const outcomes = useMemo(
    () => [...new Set((data?.decisions ?? []).map((d) => d.outcome))].sort(),
    [data],
  );

  const rows = useMemo(() => {
    let ds = data?.decisions ?? [];
    if (climateOnly) ds = ds.filter((d) => d.isClimate);
    if (!showRoutine) ds = ds.filter((d) => d.significance !== "routine");
    if (closedOnly) ds = ds.filter((d) => d.decidedInClosedSession);
    if (topic) ds = ds.filter((d) => d.topic === topic);
    if (outcome) ds = ds.filter((d) => d.outcome === outcome);
    if (q) {
      const s = q.toLowerCase();
      ds = ds.filter((d) => `${d.title} ${d.summary} ${d.topic}`.toLowerCase().includes(s));
    }
    return ds;
  }, [data, climateOnly, showRoutine, closedOnly, topic, outcome, q]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <CouncilNav />

        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Austin City Council</p>
          <h1 className="text-3xl font-bold tracking-tight">Climate &amp; energy decisions</h1>
          <p className="text-muted-foreground max-w-2xl">
            Every council climate and energy decision, from the meeting minutes — with its outcome,
            result, and vote. Executive-session decisions are included and flagged.
          </p>
          {data && (
            <p className="text-xs text-muted-foreground">
              {data.meta.years.join(", ")} · {data.meta.counts.climate} climate decisions
              {data.meta.generatedAt ? ` · generated ${new Date(data.meta.generatedAt).toISOString().slice(0, 10)}` : ""}
            </p>
          )}
        </header>

        {err && <p className="text-sm text-destructive">Couldn’t load decisions ({err}).</p>}
        {!data && !err && <p className="text-sm text-muted-foreground">Loading…</p>}

        {data && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search decisions…"
                className="flex-1 min-w-[180px] rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              />
              <select value={topic} onChange={(e) => setTopic(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                <option value="">All topics</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={outcome} onChange={(e) => setOutcome(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                <option value="">Any outcome</option>
                {outcomes.map((o) => <option key={o} value={o}>{label(o)}</option>)}
              </select>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <input type="checkbox" checked={climateOnly} onChange={(e) => setClimateOnly(e.target.checked)} />
                Climate only
              </label>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <input type="checkbox" checked={closedOnly} onChange={(e) => setClosedOnly(e.target.checked)} />
                Executive session
              </label>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <input type="checkbox" checked={showRoutine} onChange={(e) => setShowRoutine(e.target.checked)} />
                Show routine
              </label>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">{rows.length} decisions</span>
            </div>

            <div className="divide-y divide-border">
              {rows.map((d) => (
                <article key={d.id} className={`grid grid-cols-[92px_1fr] gap-4 py-5 ${d.decidedInClosedSession ? "rounded-md bg-rose-500/5 -mx-3 px-3" : ""}`}>
                  <div className="text-xs">
                    <div className="font-mono tabular-nums">{d.meetingDate}</div>
                    <div className="mt-1 uppercase tracking-wide text-muted-foreground">item {d.itemNumber}</div>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold leading-snug">{d.title}</h2>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {d.significance === "major" && <Chip className="bg-primary/15 text-primary font-semibold">major</Chip>}
                      {d.significance === "routine" && <Chip className="bg-muted text-muted-foreground/70">routine</Chip>}
                      <Chip className="bg-primary/10 text-primary">{d.topic}</Chip>
                      <Chip className={OUTCOME_STYLE[d.outcome] ?? "bg-muted text-muted-foreground"}>{label(d.outcome)}</Chip>
                      {d.decidedInClosedSession && (
                        <Chip className="bg-rose-500/15 text-rose-600 dark:text-rose-400">
                          ■ executive session §{(d.closedSession?.statutes ?? []).join(", ")}
                        </Chip>
                      )}
                    </div>
                    <p className={`mt-2 text-sm ${d.decidedInClosedSession ? "font-medium text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
                      <span className="font-normal text-muted-foreground">Result: </span>{d.result}
                    </p>
                    {d.summary && d.summary !== d.title && (
                      <p className="mt-1.5 text-sm text-muted-foreground">{d.summary}</p>
                    )}
                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer text-primary">Sources ({d.references.length})</summary>
                      <div className="mt-2 space-y-2">
                        {d.references.map((r, i) => (
                          <div key={i} className="border-l-2 border-border pl-3">
                            <div className="font-mono text-xs text-muted-foreground">{r.locator} · {label(r.docType)}</div>
                            <div className="italic text-muted-foreground">“{r.quote}”</div>
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">open source ↗</a>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </article>
              ))}
              {rows.length === 0 && <p className="py-10 text-sm text-muted-foreground">No decisions match these filters.</p>}
            </div>

            <footer className="border-t border-border pt-4 text-xs text-muted-foreground max-w-2xl">
              Extracted from Austin City Council minutes (outcome + verbatim disposition) joined to the
              voting record (per-member votes). Classification &amp; summaries by {data.meta.llmModel}.
              Funding/department detail from the item RCA is a planned enrichment.
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
