import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { memberBySlug, fmtUSD } from "@/lib/council-members";
import SectorBar from "@/components/SectorBar";

interface FinRow { cycle_year: number; total_amount: number; contribution_count: number; in_district_amount: number; out_district_amount: number; sector_breakdown: Record<string, number> | null; top_employers: { name: string; amount: number }[] | null }
interface DissentVote { item_id: string; vote_cast: string; item_description: string; summary: string | null; category: string; meeting_date: string | null; yes_count: number; no_count: number }

const fmtDate = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";

export default function CouncilMemberDetail() {
  const { slug } = useParams<{ slug: string }>();
  const member = slug ? memberBySlug(slug) : undefined;

  const [fin, setFin] = useState<FinRow[] | null>(null);
  const [dissents, setDissents] = useState<DissentVote[] | null>(null);

  useEffect(() => {
    if (!member) return;
    setFin(null); setDissents(null);
    (async () => {
      const { data: finRows } = await supabase
        .from("campaign_finance_summary")
        .select("cycle_year,total_amount,contribution_count,in_district_amount,out_district_amount,sector_breakdown,top_employers")
        .ilike("recipient", member.financePrefix + "%")
        .order("cycle_year", { ascending: false });
      setFin((finRows ?? []) as FinRow[]);

      const { data: disRows } = await supabase
        .from("council_vote_dissents")
        .select("item_id,vote_cast")
        .eq("voter_name", member.voterName);
      const ids = [...new Set((disRows ?? []).map((r: any) => r.item_id))];
      if (ids.length === 0) { setDissents([]); return; }
      const { data: voteRows } = await supabase
        .from("council_votes")
        .select("item_id,item_description,summary,category,meeting_date,yes_count,no_count")
        .in("item_id", ids)
        .eq("is_climate", true)
        .order("meeting_date", { ascending: false });
      const castById = new Map((disRows ?? []).map((r: any) => [r.item_id, r.vote_cast]));
      setDissents((voteRows ?? []).map((v: any) => ({ ...v, vote_cast: castById.get(v.item_id) ?? "No" })) as DissentVote[]);
    })();
  }, [member?.slug]);

  if (!member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Council member not found</p>
        <Link to="/council-members" className="text-sm text-primary underline">All members</Link>
      </div>
    );
  }

  const totals = useMemo(() => {
    const rows = fin ?? [];
    const total = rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
    const inD = rows.reduce((s, r) => s + (Number(r.in_district_amount) || 0), 0);
    const count = rows.reduce((s, r) => s + (Number(r.contribution_count) || 0), 0);
    return { total, inD, outD: total - inD, count, inPct: total ? Math.round((inD / total) * 100) : 0 };
  }, [fin]);

  const sectorBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of fin ?? []) for (const [k, v] of Object.entries(r.sector_breakdown ?? {})) acc[k] = (acc[k] ?? 0) + (Number(v) || 0);
    return acc;
  }, [fin]);
  const sectorTotal = useMemo(() => Object.values(sectorBreakdown).reduce((s, v) => s + v, 0), [sectorBreakdown]);

  const topEmployers = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of fin ?? []) for (const e of r.top_employers ?? []) acc[e.name] = (acc[e.name] ?? 0) + (Number(e.amount) || 0);
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [fin]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div>
          <Link to="/council-members" className="text-xs text-muted-foreground hover:text-foreground">← All council members</Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{member.name}</h1>
          <p className="text-muted-foreground">{member.district === 0 ? "Mayor of Austin" : `Council Member, District ${member.district}`}</p>
        </div>

        {/* Funding */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Campaign funding</h2>
          {fin == null ? (
            <p className="text-sm text-muted-foreground">Loading funding…</p>
          ) : totals.total === 0 ? (
            <p className="text-sm text-muted-foreground">No campaign finance on record for this name.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Total raised" value={fmtUSD(totals.total)} />
                <Stat label="Contributions" value={totals.count.toLocaleString()} />
                <Stat label="From within Austin" value={`${totals.inPct}%`} />
                <Stat label="From outside" value={`${100 - totals.inPct}%`} />
              </div>
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="text-left font-medium px-4 py-2">Cycle</th>
                      <th className="text-right font-medium px-4 py-2">Raised</th>
                      <th className="text-right font-medium px-4 py-2"># gifts</th>
                      <th className="text-right font-medium px-4 py-2">In-Austin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(fin ?? []).map(r => (
                      <tr key={r.cycle_year} className="border-b border-border last:border-0">
                        <td className="px-4 py-2">{r.cycle_year}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{fmtUSD(Number(r.total_amount) || 0)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{(Number(r.contribution_count) || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                          {r.total_amount ? Math.round((Number(r.in_district_amount) / Number(r.total_amount)) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Sector breakdown */}
              {sectorTotal > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium">Who's funding them, by sector</p>
                  <SectorBar breakdown={sectorBreakdown} height={14} showLegend />
                </div>
              )}

              {/* Top employers */}
              {topEmployers.length > 0 && (
                <div className="space-y-1 pt-2">
                  <p className="text-sm font-medium">Top donor employers</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {topEmployers.map(([name, amt]) => (
                      <li key={name} className="flex justify-between gap-4">
                        <span className="truncate">{name}</span>
                        <span className="tabular-nums shrink-0">{fmtUSD(amt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {sectorTotal === 0 && (
                <p className="text-xs text-muted-foreground">
                  Sector breakdown pending the donor-classification run.
                </p>
              )}
            </>
          )}
        </section>

        {/* Climate dissents */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Climate votes against the majority</h2>
          {dissents == null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : dissents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recorded climate dissents — {member.name} voted with the council majority on every
              climate decision in the record (2023–present). That's the norm here: near-unanimous.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-card">
              {dissents.map(d => (
                <div key={d.item_id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-sm text-foreground leading-snug">{d.summary || d.item_description.slice(0, 160)}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(d.meeting_date)} · {d.category}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs tabular-nums">
                    <span className="font-medium text-amber-600">voted {d.vote_cast}</span>
                    <div className="text-muted-foreground">{d.yes_count}-{d.no_count}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-muted-foreground">
          Voting: City of Austin Council Voting Record. Funding: City of Austin Clerk.
          See the council's full <Link to="/council-climate-record" className="underline">climate record</Link>.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}
