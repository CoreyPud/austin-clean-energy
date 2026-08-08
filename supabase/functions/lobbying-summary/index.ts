import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { classifyClient } from "../_shared/sector-tags.ts";

// Computes (1) the sector breakdown of who lobbies Austin City Hall and (2) the
// donor∩lobbyist nexus — entities that both lobby the city AND appear as major
// donor employers to council. Result is cached as one row in cached_stats so the
// page reads it instantly. Bounded work; safe to run on a schedule.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
};
const CLIENTS = "https://data.austintexas.gov/resource/7ena-g23u.json";
const CACHE_KEY = "council_lobbying_v1";
const PAGE = 20000;

// Normalize an org name for matching: lowercase, drop punctuation and common
// company suffixes so "Endeavor Real Estate Group, LLC" ~ "Endeavor Real Estate".
function normOrg(name: string): string {
  return name.toLowerCase()
    .replace(/[.,&']/g, " ")
    .replace(/\b(llc|inc|lp|llp|pllc|ltd|co|company|corp|corporation|group|holdings|partners|management|properties|the)\b/g, " ")
    .replace(/\s+/g, " ").trim();
}

async function sodaAll(url: string, params: Record<string, string>) {
  const out: any[] = [];
  let offset = 0;
  while (true) {
    const qs = new URLSearchParams({ ...params, $limit: String(PAGE), $offset: String(offset) }).toString();
    const res = await fetch(`${url}?${qs}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`SODA ${res.status}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const secret = Deno.env.get("SOLAR_IMPORT_SECRET");
  if (!secret || req.headers.get("x-sync-secret") !== secret) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    // 1. Distinct lobby clients → sector
    const rows = await sodaAll(CLIENTS, {
      $select: "client_last_name,business_desc,count(*) as n",
      $group: "client_last_name,business_desc",
    });
    const clients = new Map<string, { name: string; sector: string }>();
    for (const r of rows) {
      const name = (r.client_last_name ?? "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!clients.has(key)) clients.set(key, { name, sector: classifyClient(name, r.business_desc) });
    }
    const sector_breakdown: Record<string, number> = {};
    for (const c of clients.values()) sector_breakdown[c.sector] = (sector_breakdown[c.sector] ?? 0) + 1;

    // 2. Nexus: match lobby clients against council donor employers
    const { data: finRows } = await supabase
      .from("campaign_finance_summary")
      .select("recipient,top_employers");
    const donorEmployers = new Map<string, { name: string; amount: number; recipients: Set<string> }>();
    for (const f of finRows ?? []) {
      for (const e of (f.top_employers as any[] ?? [])) {
        const norm = normOrg(e.name);
        if (norm.length < 4) continue;
        const d = donorEmployers.get(norm) ?? { name: e.name, amount: 0, recipients: new Set<string>() };
        d.amount += Number(e.amount) || 0;
        d.recipients.add(f.recipient);
        donorEmployers.set(norm, d);
      }
    }
    const lobbyNorms = new Map<string, { name: string; sector: string }>();
    for (const c of clients.values()) lobbyNorms.set(normOrg(c.name), c);

    const nexus: any[] = [];
    for (const [norm, d] of donorEmployers) {
      const hit = lobbyNorms.get(norm);
      if (hit) {
        nexus.push({
          name: hit.name, sector: hit.sector,
          donor_amount: Math.round(d.amount),
          recipients: [...d.recipients],
        });
      }
    }
    nexus.sort((a, b) => b.donor_amount - a.donor_amount);

    const payload = {
      generated_at: new Date().toISOString(),
      total_clients: clients.size,
      sector_breakdown,
      nexus: nexus.slice(0, 40),
    };
    await supabase.from("cached_stats").upsert(
      { stat_type: CACHE_KEY, value: JSON.stringify(payload), label: "Lobbying summary + donor nexus" },
      { onConflict: "stat_type" },
    );

    return new Response(JSON.stringify({ ok: true, total_clients: clients.size, nexus: nexus.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("lobbying-summary error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
