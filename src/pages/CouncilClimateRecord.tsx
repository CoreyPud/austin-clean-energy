import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CouncilNav from "@/components/CouncilNav";

// ---- Category presentation ----
const CATEGORY_META: Record<string, { label: string; blurb: string }> = {
  energy_supply:         { label: "Energy supply",          blurb: "Generation, the grid, Austin Energy resource decisions, coal/gas, renewables." },
  buildings_efficiency:  { label: "Buildings & efficiency", blurb: "Codes, weatherization, green building, embodied carbon." },
  transportation:        { label: "Transportation",         blurb: "Transit, bike/pedestrian, EVs, vehicle-miles and mode shift." },
  land_use:              { label: "Land-use policy",         blurb: "Citywide density, transit-oriented and sustainability initiatives." },
  water:                 { label: "Water",                   blurb: "Conservation, watershed protection, flood and drought resilience." },
  natural_systems:       { label: "Natural systems",         blurb: "Tree canopy, parks, ecological land management." },
  waste:                 { label: "Waste",                   blurb: "Recycling, composting, zero-waste." },
  climate_planning:      { label: "Climate planning",        blurb: "Climate targets, plans, and formal climate resolutions." },
  environmental_justice: { label: "Environmental justice",   blurb: "Equity in environmental and climate policy." },
};
const CATEGORY_ORDER = [
  "climate_planning", "energy_supply", "transportation", "buildings_efficiency",
  "water", "natural_systems", "land_use", "waste", "environmental_justice",
];

interface VoteRow {
  item_id: string;
  meeting_date: string | null;
  item_description: string;
  summary: string | null;
  category: string;
  item_kind: string;
  yes_count: number;
  no_count: number;
  abstain_count: number;
  source_url: string | null;
}

const fmtDate = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";

export default function CouncilClimateRecord() {
  const [items, setItems]   = useState<VoteRow[] | null>(null);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [splitItems, setSplitItems] = useState<number | null>(null);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Whole-council decision stats (all items, and how many were non-unanimous)
      const [{ count: total }, { count: splits }] = await Promise.all([
        supabase.from("council_votes").select("item_id", { count: "exact", head: true }),
        supabase.from("council_votes").select("item_id", { count: "exact", head: true }).gt("no_count", 0),
      ]);
      setTotalItems(total ?? null);
      setSplitItems(splits ?? null);

      // The climate record itself
      const { data, error } = await supabase
        .from("council_votes")
        .select("item_id,meeting_date,item_description,summary,category,item_kind,yes_count,no_count,abstain_count,source_url")
        .eq("is_climate", true)
        .neq("item_kind", "routine")
        .order("meeting_date", { ascending: false })
        .limit(3000);
      if (error) { setError(error.message); return; }
      setItems((data ?? []) as VoteRow[]);
    })();
  }, []);

  const byCategory = useMemo(() => {
    const m = new Map<string, VoteRow[]>();
    for (const it of items ?? []) {
      if (!m.has(it.category)) m.set(it.category, []);
      m.get(it.category)!.push(it);
    }
    return m;
  }, [items]);

  const splitClimate = useMemo(
    () => (items ?? []).filter(it => it.no_count > 0).slice(0, 25),
    [items],
  );

  const dissentPct = totalItems && splitItems != null
    ? ((splitItems / totalItems) * 100).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <CouncilNav />

        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Austin City Council</p>
          <h1 className="text-3xl font-bold tracking-tight">The council's climate record</h1>
          <p className="text-muted-foreground max-w-2xl">
            Every substantive climate, clean-energy, and environmental decision the Austin City
            Council has taken since 2023 — pulled from the city's official voting record and
            grouped by topic. Routine procurement and administrative items are excluded.
          </p>
        </header>

        {/* How decisions get made */}
        <section className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h2 className="text-lg font-semibold">How the council actually decides</h2>
          {dissentPct != null ? (
            <p className="text-sm text-muted-foreground">
              Of <strong className="text-foreground">{totalItems?.toLocaleString()}</strong> agenda
              items voted since 2023, only <strong className="text-foreground">{splitItems?.toLocaleString()}</strong>{" "}
              ({dissentPct}%) drew a single "No" vote. Austin's council governs by near-total
              consensus — most decisions are negotiated in work sessions and ride the consent
              agenda, so the public vote usually ratifies a deal already struck. That means how an
              individual member votes rarely differs from the rest; the more revealing questions are
              what the body decides as a whole, and who funds it.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Loading council decision statistics…</p>
          )}
        </section>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Couldn't load the council record: {error}
          </div>
        )}

        {/* Climate record by category */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Climate decisions by topic</h2>
          {items == null ? (
            <p className="text-sm text-muted-foreground">Loading climate record…</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {CATEGORY_ORDER.filter(c => byCategory.has(c)).map(cat => {
                const rows = byCategory.get(cat)!;
                const meta = CATEGORY_META[cat] ?? { label: cat, blurb: "" };
                return (
                  <div key={cat} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{meta.label}</h3>
                      <span className="text-2xl font-bold tabular-nums">{rows.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{meta.blurb}</p>
                    <ul className="space-y-1.5 pt-1">
                      {rows.slice(0, 3).map(it => (
                        <li key={it.item_id} className="text-xs text-foreground/80 leading-snug">
                          <span className="text-muted-foreground">{fmtDate(it.meeting_date)} — </span>
                          {it.summary || it.item_description.slice(0, 120)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Where the council split */}
        {splitClimate.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Where the council split</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              The rare climate decisions that weren't unanimous — the clearest on-the-record
              differences between members.
            </p>
            <div className="divide-y divide-border rounded-lg border border-border bg-card">
              {splitClimate.map(it => (
                <div key={it.item_id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-sm text-foreground leading-snug">{it.summary || it.item_description.slice(0, 160)}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(it.meeting_date)} · {CATEGORY_META[it.category]?.label ?? it.category}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs tabular-nums">
                    <span className="text-emerald-600 font-medium">{it.yes_count} yes</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-amber-600 font-medium">{it.no_count} no</span>
                    {it.abstain_count > 0 && <span className="text-muted-foreground"> · {it.abstain_count} abstain</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-xs text-muted-foreground">
          Source: City of Austin Council Voting Record (open data), 2023–present. Climate relevance
          is classified from each item's official description. <Link to="/data-sources" className="underline">About the data</Link>.
        </p>
      </div>
    </div>
  );
}
