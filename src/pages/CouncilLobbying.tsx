import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SectorBar from "@/components/SectorBar";
import { SECTOR_LABEL, SECTOR_COLOR, fmtUSD, COUNCIL_MEMBERS } from "@/lib/council-members";
import CouncilNav from "@/components/CouncilNav";

interface NexusRow { name: string; sector: string; donor_amount: number; recipients: string[] }
interface LobbySummary {
  generated_at: string;
  total_clients: number;
  sector_breakdown: Record<string, number>;
  nexus: NexusRow[];
}

// Map a finance recipient string back to a member display name for the nexus.
function recipientToMember(recipient: string): string {
  const m = COUNCIL_MEMBERS.find(mm => recipient.startsWith(mm.financePrefix));
  return m ? m.name : recipient;
}

export default function CouncilLobbying() {
  const [data, setData] = useState<LobbySummary | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: row } = await supabase
        .from("cached_stats").select("value").eq("stat_type", "council_lobbying_v1").maybeSingle();
      if (!row?.value) { setMissing(true); return; }
      try { setData(typeof row.value === "string" ? JSON.parse(row.value) : row.value); }
      catch { setMissing(true); }
    })();
  }, []);

  const topSectors = data
    ? Object.entries(data.sector_breakdown).sort((a, b) => b[1] - a[1])
    : [];
  const totalTagged = topSectors.reduce((s, [, n]) => s + n, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <CouncilNav />
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Austin City Council</p>
          <h1 className="text-3xl font-bold tracking-tight">Who lobbies City Hall</h1>
          <p className="text-muted-foreground max-w-2xl">
            Every organization registered to lobby the City of Austin, grouped by industry — and
            the ones that both lobby the city and fund council campaigns. For the money side, see{" "}
            <Link to="/council-members" className="underline">who funds your council</Link>.
          </p>
        </header>

        {missing && (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Lobbying summary hasn't been generated yet.
          </div>
        )}

        {data && (
          <>
            {/* Sector breakdown */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Lobbying by industry</h2>
                <p className="text-sm text-muted-foreground">
                  {data.total_clients.toLocaleString()} registered lobbying clients since 2016.
                </p>
              </div>
              <SectorBar breakdown={data.sector_breakdown} height={16} />
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                {topSectors.filter(([, n]) => n > 0).map(([sec, n]) => (
                  <li key={sec} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: SECTOR_COLOR[sec] ?? "#e5e7eb" }} />
                    <span className="text-muted-foreground truncate">{SECTOR_LABEL[sec] ?? sec}</span>
                    <span className="ml-auto tabular-nums text-foreground/80">{Math.round((n / totalTagged) * 100)}%</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Real estate and development dominate lobbying at City Hall — by a wide margin over
                every other industry, and mirroring where council campaign money comes from. Energy
                and climate interests are a rounding error by comparison.
              </p>
            </section>

            {/* Donor ∩ lobbyist nexus */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Lobbying <span className="text-muted-foreground">and</span> funding</h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Organizations that both lobby the city and rank among council members' top donor
                  employers — the clearest overlap of paid influence and campaign money.
                </p>
              </div>
              {data.nexus.length === 0 ? (
                <p className="text-sm text-muted-foreground">No overlaps found.</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {data.nexus.map(n => (
                    <div key={n.name} className="p-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: SECTOR_COLOR[n.sector] ?? "#e5e7eb" }} />
                          <span className="text-sm font-medium text-foreground">{n.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {SECTOR_LABEL[n.sector] ?? n.sector} · funded {n.recipients.map(recipientToMember).join(", ")}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm tabular-nums font-medium">{fmtUSD(n.donor_amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          Sources: City of Austin lobbyist registration &amp; campaign finance (City Clerk).
          Industry is inferred from each client's self-reported business description; the nexus
          matches organization names between the two datasets.
        </p>
      </div>
    </div>
  );
}
