import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SectorBar from "@/components/SectorBar";
import { SECTOR_LABEL, SECTOR_COLOR, fmtUSD, COUNCIL_MEMBERS } from "@/lib/council-members";
import CouncilNav from "@/components/CouncilNav";
import companiesData from "@/data/council-companies.json";

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
  item_id: string; meeting_date: string | null; item_description: string;
  summary: string | null; category: string; yes_count: number; no_count: number; abstain_count: number;
}
interface NexusRow { name: string; sector: string; donor_amount: number; recipients: string[] }
interface LobbySummary { total_clients: number; sector_breakdown: Record<string, number>; nexus: NexusRow[] }

const fmtDate = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
const recipientToMember = (r: string) => COUNCIL_MEMBERS.find(m => r.startsWith(m.financePrefix))?.name ?? r;

// Tidy the messy self-reported business descriptions into clean labels.
const cleanBusiness = (b: string): string => {
  const s = (b || "").toLowerCase();
  if (/law|attorney|legal/.test(s)) return "Law / lobbying firm";
  if (/real estate|develop|property|land/.test(s)) return "Real estate / development";
  if (/tech/.test(s)) return "Technology";
  if (/engineer|architect/.test(s)) return "Engineering / architecture";
  if (/disposal|waste|recycl/.test(s)) return "Waste / recycling";
  if (/nonprofit|housing organ/.test(s)) return "Nonprofit";
  if (/music|hotel|hospitality|event/.test(s)) return "Hospitality / events";
  return b ? b.charAt(0).toUpperCase() + b.slice(1).toLowerCase() : "Other";
};

export default function CouncilOverview() {
  const [items, setItems] = useState<VoteRow[] | null>(null);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [splitItems, setSplitItems] = useState<number | null>(null);
  const [lobby, setLobby] = useState<LobbySummary | null>(null);

  useEffect(() => {
    (async () => {
      const [{ count: total }, { count: splits }] = await Promise.all([
        supabase.from("council_votes").select("item_id", { count: "exact", head: true }),
        supabase.from("council_votes").select("item_id", { count: "exact", head: true }).gt("no_count", 0),
      ]);
      setTotalItems(total ?? null);
      setSplitItems(splits ?? null);

      const { data } = await supabase
        .from("council_votes")
        .select("item_id,meeting_date,item_description,summary,category,yes_count,no_count,abstain_count")
        .eq("is_climate", true).neq("item_kind", "routine")
        .order("meeting_date", { ascending: false }).limit(3000);
      setItems((data ?? []) as VoteRow[]);

      const { data: row } = await supabase
        .from("cached_stats").select("value").eq("stat_type", "council_lobbying_v1").maybeSingle();
      if (row?.value) { try { setLobby(typeof row.value === "string" ? JSON.parse(row.value) : row.value); } catch { /* */ } }
    })();
  }, []);

  const byCategory = useMemo(() => {
    const m = new Map<string, VoteRow[]>();
    for (const it of items ?? []) { if (!m.has(it.category)) m.set(it.category, []); m.get(it.category)!.push(it); }
    return m;
  }, [items]);
  const splitClimate = useMemo(() => (items ?? []).filter(it => it.no_count > 0).slice(0, 25), [items]);
  const dissentPct = totalItems && splitItems != null ? ((splitItems / totalItems) * 100).toFixed(1) : null;

  const lobbySectors = lobby ? Object.entries(lobby.sector_breakdown).sort((a, b) => b[1] - a[1]) : [];
  const lobbyTotal = lobbySectors.reduce((s, [, n]) => s + n, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <CouncilNav />
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Austin City Council</p>
          <h1 className="text-3xl font-bold tracking-tight">Who really influences Austin City Council on climate</h1>
          <p className="text-muted-foreground max-w-2xl">
            The council decides climate policy by near-total consensus — so the story isn't how any
            one member votes, it's who funds and lobbies them. Real estate and development dominate
            both; energy and climate interests barely register.
          </p>
        </header>

        {/* Influence: funding + lobbying */}
        <section className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-lg font-semibold">The influence picture</h2>
          {dissentPct != null && (
            <p className="text-sm text-muted-foreground">
              Of <strong className="text-foreground">{totalItems?.toLocaleString()}</strong> agenda
              items voted since 2023, only <strong className="text-foreground">{splitItems?.toLocaleString()}</strong>{" "}
              ({dissentPct}%) drew a single "No." Most decisions ride the consent agenda after being
              negotiated beforehand, so the recorded vote rarely differentiates members.
            </p>
          )}

          {lobby ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">Who lobbies City Hall, by industry</p>
                <span className="text-xs text-muted-foreground">{lobby.total_clients.toLocaleString()} registered clients</span>
              </div>
              <SectorBar breakdown={lobby.sector_breakdown} height={16} />
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs pt-1">
                {lobbySectors.filter(([, n]) => n > 0).slice(0, 6).map(([sec, n]) => (
                  <li key={sec} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: SECTOR_COLOR[sec] ?? "#e5e7eb" }} />
                    <span className="text-muted-foreground truncate">{SECTOR_LABEL[sec] ?? sec}</span>
                    <span className="ml-auto tabular-nums text-foreground/80">{Math.round((n / lobbyTotal) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Lobbying breakdown pending data generation.</p>
          )}

          <p className="text-sm text-foreground/80 leading-relaxed">
            Real estate and development make up the large majority of both campaign money and
            registered lobbying at City Hall, while energy and climate interests are a rounding
            error — the influence vector in Austin is development, not energy.
          </p>

          {lobby && lobby.nexus.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Lobbying <span className="text-muted-foreground">and</span> funding council</p>
              <div className="divide-y divide-border rounded-lg border border-border">
                {lobby.nexus.slice(0, 8).map(n => (
                  <div key={n.name} className="p-3 flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: SECTOR_COLOR[n.sector] ?? "#e5e7eb" }} />
                      <span className="truncate">{n.name}</span>
                    </span>
                    <span className="tabular-nums shrink-0 text-muted-foreground">{fmtUSD(n.donor_amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* How influence works + companies of interest (static prototype data) */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">How influence actually works here</h2>
            <div className="text-sm text-muted-foreground max-w-2xl space-y-2">
              <p>
                In Texas, <strong className="text-foreground">companies can't donate to campaigns directly</strong>,
                and Austin caps individual gifts at roughly $450. So the money doesn't come as
                corporate checks — it comes as <strong className="text-foreground">bundling</strong>: firms
                with business before the city have dozens of their employees each donate, often at the
                max, to most of the council at once.
              </p>
              <p>
                The same firms <strong className="text-foreground">register to lobby</strong> the city. So the
                campaign money and the lobbying come from the same interests — overwhelmingly real
                estate and development. Below are the registered lobbying organizations whose employees
                gave the most to current council members.
              </p>
            </div>
          </div>

          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {companiesData.companies.map((c) => (
              <div key={c.name} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cleanBusiness(c.business)} · lobbies the city · funded {c.members_funded} of 11 members
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{fmtUSD(c.donated)}</p>
                  <p className="text-xs text-muted-foreground">{c.donors} donors</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {companiesData.note}
          </p>
        </section>

        {/* Report card entry */}
        <section className="rounded-lg border border-border bg-card p-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">The report card</h2>
            <p className="text-sm text-muted-foreground">Funding, sector breakdown, and climate votes for each of the 11 members.</p>
          </div>
          <Link to="/council-members" className="shrink-0 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
            View members →
          </Link>
        </section>

        {/* Full climate record — collapsed by default */}
        <details className="rounded-lg border border-border bg-card group">
          <summary className="cursor-pointer select-none p-6 font-semibold list-none flex items-center justify-between">
            <span>The council's full climate voting record{items ? ` (${items.length.toLocaleString()} decisions)` : ""}</span>
            <span className="text-muted-foreground text-sm group-open:hidden">Show ▾</span>
            <span className="text-muted-foreground text-sm hidden group-open:inline">Hide ▴</span>
          </summary>
          <div className="px-6 pb-6 space-y-6">
            {items == null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {CATEGORY_ORDER.filter(c => byCategory.has(c)).map(cat => {
                    const rows = byCategory.get(cat)!;
                    const meta = CATEGORY_META[cat] ?? { label: cat, blurb: "" };
                    return (
                      <div key={cat} className="rounded-lg border border-border p-4 space-y-2">
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

                {splitClimate.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Where the council split</h3>
                    <div className="divide-y divide-border rounded-lg border border-border">
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </details>

        <p className="text-xs text-muted-foreground">
          Sources: City of Austin Council Voting Record, campaign finance, and lobbyist registration
          (open data). Climate relevance and donor/lobby sectors are inferred from official descriptions.
        </p>
      </div>
    </div>
  );
}
