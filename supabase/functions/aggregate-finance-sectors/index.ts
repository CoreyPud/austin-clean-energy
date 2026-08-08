import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { classifySector } from "../_shared/sector-tags.ts";

// Fills campaign_finance_summary.sector_breakdown + top_employers by pulling each
// recipient's contributions from Socrata (grouped by year+employer+occupation),
// classifying donors into sectors, and rolling up dollars. Scoped to the recipient
// prefixes passed in the body (the current council roster) so each run is bounded
// to a handful of light SODA queries.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
};
const FIN = "https://data.austintexas.gov/resource/3kfv-biw6.json";
const PAGE = 5000;

// Placeholders donors write in the employer field that aren't real companies —
// kept out of the "top donor employers" list.
function isGenericEmployer(emp: string): boolean {
  const e = emp.trim().toLowerCase().replace(/[.\-]/g, "");
  if (e.length <= 2) return true;
  return /^(self|self ?employed|selfemployed|unemployed|not ?employed|retired|homemaker|home maker|none|na|n\/a|not ?applicable|not ?provided|not ?listed|not ?given|info(rmation)? ?requested|requested|unknown|various|no employer|individual|citizen|resident)$/i.test(e);
}

async function sodaAll(params: Record<string, string>) {
  const out: any[] = [];
  let offset = 0;
  while (true) {
    const qs = new URLSearchParams({ ...params, $limit: String(PAGE), $offset: String(offset) }).toString();
    const res = await fetch(`${FIN}?${qs}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`SODA ${res.status}: ${(await res.text()).slice(0, 150)}`);
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

  let body: { prefixes?: string[] };
  try { body = await req.json(); } catch { body = {}; }
  const prefixes = body.prefixes ?? [];
  if (!prefixes.length) {
    return new Response(JSON.stringify({ ok: false, error: "Provide recipient prefixes" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const results: Record<string, number> = {};

  try {
    for (const prefix of prefixes) {
      // escape single quotes for SoQL
      const p = prefix.replace(/'/g, "''");
      const rows = await sodaAll({
        $select: "contribution_year,donor_reported_employer,donor_reported_occupation,sum(contribution_amount) as amt",
        $where: `starts_with(recipient, '${p}')`,
        $group: "contribution_year,donor_reported_employer,donor_reported_occupation",
      });

      // year -> { sectors: {sector: $}, employers: {name: $} }
      const byYear = new Map<number, { sectors: Record<string, number>; employers: Record<string, number> }>();
      for (const r of rows) {
        const year = Number(r.contribution_year);
        if (!year) continue;
        const amt = Number(r.amt) || 0;
        if (amt <= 0) continue;
        const sector = classifySector(r.donor_reported_employer, r.donor_reported_occupation);
        const y = byYear.get(year) ?? { sectors: {}, employers: {} };
        y.sectors[sector] = (y.sectors[sector] ?? 0) + amt;
        const emp = (r.donor_reported_employer ?? "").trim();
        if (emp && !isGenericEmployer(emp)) {
          y.employers[emp] = (y.employers[emp] ?? 0) + amt;
        }
        byYear.set(year, y);
      }

      for (const [year, agg] of byYear) {
        const sector_breakdown = Object.fromEntries(
          Object.entries(agg.sectors).map(([k, v]) => [k, Math.round(v)]),
        );
        const top_employers = Object.entries(agg.employers)
          .sort((a, b) => b[1] - a[1]).slice(0, 8)
          .map(([name, amt]) => ({ name, amount: Math.round(amt) }));
        const { error } = await supabase
          .from("campaign_finance_summary")
          .update({ sector_breakdown, top_employers })
          .ilike("recipient", prefix + "%")
          .eq("cycle_year", year);
        if (error) throw new Error(`update ${prefix} ${year}: ${error.message}`);
      }
      results[prefix] = byYear.size;
    }

    return new Response(JSON.stringify({ ok: true, updated: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("aggregate-finance-sectors error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err), partial: results }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
