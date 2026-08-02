import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// Pulls Austin open-data (Socrata) into the council-accountability tables.
// Everything is aggregated server-side via SODA ($group / sum) so the huge
// contributions dataset is never streamed row-by-row into the function.
//
// Incremental: council_votes rows are upserted by item_id and existing
// classification columns are never touched, so a re-sync won't re-spend AI
// credits or clobber reviewed labels. classify-new-votes handles new items.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

const VOTES  = "https://data.austintexas.gov/resource/3c89-i35a.json";
const FIN     = "https://data.austintexas.gov/resource/3kfv-biw6.json";
const CLIENTS = "https://data.austintexas.gov/resource/7ena-g23u.json";
const PAGE = 5000;

async function soda(url: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${qs}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`SODA ${res.status} on ${url}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// Page through a grouped SODA query until exhausted.
async function sodaAll(url: string, params: Record<string, string>) {
  const out: any[] = [];
  let offset = 0;
  while (true) {
    const rows = await soda(url, { ...params, $limit: String(PAGE), $offset: String(offset) });
    out.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

// ---- votes: one aggregated row per agenda item + dissent detail ----
async function syncVotes(supabase: any) {
  const tallyRows = await sodaAll(VOTES, {
    $select: "item_id,meeting_date,item_description,action_taken,vote_cast,count(*) as n",
    $group:  "item_id,meeting_date,item_description,action_taken,vote_cast",
    $order:  "item_id",
  });

  const items = new Map<string, any>();
  for (const r of tallyRows) {
    const it = items.get(r.item_id) ?? {
      item_id: r.item_id,
      meeting_date: (r.meeting_date ?? "").slice(0, 10) || null,
      item_description: r.item_description ?? "",
      action_taken: r.action_taken ?? null,
      yes_count: 0, no_count: 0, abstain_count: 0,
      other_counts: {} as Record<string, number>,
      source_url: `https://data.austintexas.gov/resource/3c89-i35a?item_id=${r.item_id}`,
    };
    const n = Number(r.n) || 0;
    const vc = String(r.vote_cast ?? "");
    if (vc === "Yes") it.yes_count += n;
    else if (vc === "No") it.no_count += n;
    else if (vc === "Abstain") it.abstain_count += n;
    else it.other_counts[vc] = (it.other_counts[vc] ?? 0) + n;
    items.set(r.item_id, it);
  }

  // Upsert items WITHOUT classification columns → leaves is_climate NULL on new
  // rows (classify-new-votes picks them up) and preserves it on existing rows.
  const rows = [...items.values()];
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase
      .from("council_votes")
      .upsert(rows.slice(i, i + 500), { onConflict: "item_id", ignoreDuplicates: false, defaultToNull: false });
    if (error) throw new Error(`council_votes: ${error.message}`);
  }

  // Dissent detail (non-Yes recorded positions) — small; replace wholesale.
  const dissentRows = await sodaAll(VOTES, {
    $select: "item_id,voter_name,vote_cast",
    $where:  "vote_cast in('No','Abstain','Recused')",
    $order:  "item_id",
  });
  // district is not stored here — join voter_name to council_members when needed
  const dissents = dissentRows.map((r: any) => ({
    item_id: r.item_id,
    voter_name: r.voter_name,
    vote_cast: r.vote_cast,
  }));
  // idempotent: clear + reload (bounded set, a few hundred rows)
  await supabase.from("council_vote_dissents").delete().neq("item_id", "");
  for (let i = 0; i < dissents.length; i += 500) {
    const { error } = await supabase.from("council_vote_dissents").insert(dissents.slice(i, i + 500));
    if (error) throw new Error(`council_vote_dissents: ${error.message}`);
  }
  return { items: rows.length, dissents: dissents.length };
}

// ---- finance: per recipient+year totals, with in-Austin split ----
async function syncFinance(supabase: any) {
  const totals = await sodaAll(FIN, {
    $select: "recipient,contribution_year,sum(contribution_amount) as total,count(*) as n",
    $group:  "recipient,contribution_year",
    $order:  "contribution_year",
  });
  const inAustin = await sodaAll(FIN, {
    $select: "recipient,contribution_year,sum(contribution_amount) as in_amt",
    $where:  "upper(city_state_zip) like '%AUSTIN, TX%'",
    $group:  "recipient,contribution_year",
  });
  const inMap = new Map<string, number>();
  for (const r of inAustin) inMap.set(`${r.recipient}|${r.contribution_year}`, Number(r.in_amt) || 0);

  const rows = totals
    .filter((r: any) => r.recipient && r.contribution_year)
    .map((r: any) => {
      const total = Number(r.total) || 0;
      const inAmt = inMap.get(`${r.recipient}|${r.contribution_year}`) ?? 0;
      return {
        recipient: r.recipient,
        cycle_year: Number(r.contribution_year),
        total_amount: +total.toFixed(2),
        contribution_count: Number(r.n) || 0,
        in_district_amount: +inAmt.toFixed(2),
        out_district_amount: +(total - inAmt).toFixed(2),
        // sector_breakdown / top_employers filled by a later donor-classify pass
      };
    });
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase
      .from("campaign_finance_summary")
      .upsert(rows.slice(i, i + 500), { onConflict: "recipient,cycle_year" });
    if (error) throw new Error(`campaign_finance_summary: ${error.message}`);
  }
  return { finance_rows: rows.length };
}

// ---- lobbyist clients (registrant → client, business, compensation tier) ----
async function syncLobbyists(supabase: any) {
  const rows = (await sodaAll(CLIENTS, { $select: "*", $order: "row_id" })).map((r: any) => ({
    row_id: r.row_id,
    registrant_id: r.registrant_id ?? null,
    client_name: r.client_last_name ?? null,
    business_desc: r.business_desc ?? null,
    comp_category: r.comp_category ?? null,
    report_id: r.report_id ?? null,
    // sector_tag filled by a later classify pass
  }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase
      .from("lobbyist_clients")
      .upsert(rows.slice(i, i + 500), { onConflict: "row_id" });
    if (error) throw new Error(`lobbyist_clients: ${error.message}`);
  }
  return { lobbyist_clients: rows.length };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Guard: manual runs and cron both pass the shared import secret (reused from
  // solar-data-import, so no new secret is needed).
  const secret = Deno.env.get("SOLAR_IMPORT_SECRET");
  if (!secret || req.headers.get("x-sync-secret") !== secret) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Each section is isolated so one failure (e.g. a schema drift) doesn't block
  // the others — the response reports per-section results and errors.
  const result: Record<string, unknown> = { synced_at: new Date().toISOString() };
  const errors: Record<string, string> = {};
  for (const [name, fn] of [
    ["votes", syncVotes], ["finance", syncFinance], ["lobbyists", syncLobbyists],
  ] as const) {
    try {
      Object.assign(result, await fn(supabase));
    } catch (err) {
      errors[name] = String(err);
      console.error(`sync-council-data ${name} error:`, err);
    }
  }
  const ok = Object.keys(errors).length === 0;
  console.log("sync-council-data", { ok, ...result, errors });
  return new Response(JSON.stringify({ ok, ...result, errors }), {
    status: ok ? 200 : 207,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
