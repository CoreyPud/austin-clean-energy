import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { COUNCIL_MEMBERS, fmtUSD } from "@/lib/council-members";

interface MemberStat { raised: number; climateDissents: number }

export default function CouncilMembers() {
  const [stats, setStats] = useState<Record<number, MemberStat>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [fin, dis, split] = await Promise.all([
        supabase.from("campaign_finance_summary").select("recipient,total_amount"),
        supabase.from("council_vote_dissents").select("voter_name,item_id"),
        supabase.from("council_votes").select("item_id").eq("is_climate", true).gt("no_count", 0),
      ]);
      const splitIds = new Set((split.data ?? []).map((r: any) => r.item_id));
      const out: Record<number, MemberStat> = {};
      for (const m of COUNCIL_MEMBERS) {
        const raised = (fin.data ?? [])
          .filter((r: any) => (r.recipient ?? "").startsWith(m.financePrefix))
          .reduce((s: number, r: any) => s + (Number(r.total_amount) || 0), 0);
        const climateDissents = (dis.data ?? [])
          .filter((r: any) => r.voter_name === m.voterName && splitIds.has(r.item_id)).length;
        out[m.district] = { raised, climateDissents };
      }
      setStats(out);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Austin City Council</p>
          <h1 className="text-3xl font-bold tracking-tight">Who funds your council</h1>
          <p className="text-muted-foreground max-w-2xl">
            Austin's council votes on climate almost entirely by consensus, so how a member votes
            rarely sets them apart — but who funds them does. Pick a member to see their campaign
            money and the rare climate votes where they broke from the pack. For the body's overall
            record, see the{" "}
            <Link to="/council-climate-record" className="underline">climate record</Link>.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COUNCIL_MEMBERS.map(m => {
            const s = stats[m.district];
            return (
              <Link
                key={m.district}
                to={`/council-members/${m.slug}`}
                className="rounded-lg border border-border bg-card p-4 space-y-2 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-semibold text-foreground leading-tight">{m.name}</h2>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {m.district === 0 ? "Mayor" : `District ${m.district}`}
                  </span>
                </div>
                {loading || !s ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : (
                  <div className="flex items-baseline justify-between text-sm">
                    <span><span className="font-bold tabular-nums">{fmtUSD(s.raised)}</span> <span className="text-muted-foreground text-xs">raised</span></span>
                    <span className="text-xs text-muted-foreground">{s.climateDissents} climate dissent{s.climateDissents === 1 ? "" : "s"}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Campaign finance: City of Austin Clerk (2016–present). Funding totals are all reported
          contributions across cycles. Contributor street addresses are redacted by the Clerk.
        </p>
      </div>
    </div>
  );
}
