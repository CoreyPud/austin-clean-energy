import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// Public endpoint: records one support/oppose vote per IP per agenda item.
// Votes are accepted regardless of the item's status — decided items take
// retroactive/hypothetical votes too.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  try {
    let body: { agenda_item_id?: unknown; choice?: unknown };
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, error: "Invalid JSON" });
    }

    const agendaItemId = typeof body.agenda_item_id === "string" ? body.agenda_item_id.trim() : "";
    const choice = body.choice;
    if (!agendaItemId) return json(400, { ok: false, error: "agenda_item_id is required" });
    if (choice !== "support" && choice !== "oppose") {
      return json(400, { ok: false, error: "choice must be 'support' or 'oppose'" });
    }

    // IP is derived from trusted proxy headers only — never from the request body.
    const ip =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let recordedChoice: string = choice;

    const { error: insertError } = await supabase
      .from("agenda_item_votes")
      .insert({ agenda_item_id: agendaItemId, choice, ip_address: ip });

    if (insertError) {
      if (insertError.code === "23505") {
        // This IP already voted on this item — report the vote already on record.
        const { data: existing, error: existingError } = await supabase
          .from("agenda_item_votes")
          .select("choice")
          .eq("agenda_item_id", agendaItemId)
          .eq("ip_address", ip)
          .maybeSingle();
        if (existingError) {
          console.error("vote-agenda-item: existing vote lookup failed", existingError);
          return json(500, { ok: false, error: "An internal error occurred." });
        }
        if (existing?.choice) recordedChoice = existing.choice;
      } else {
        console.error("vote-agenda-item: insert failed", insertError);
        return json(500, { ok: false, error: "An internal error occurred." });
      }
    }

    const { data: tally } = await supabase
      .from("agenda_item_vote_tallies")
      .select("support_count,oppose_count")
      .eq("agenda_item_id", agendaItemId)
      .maybeSingle();

    const { data: decision } = await supabase
      .from("council_decisions")
      .select("outcome,status")
      .eq("id", agendaItemId)
      .maybeSingle();

    return json(200, {
      ok: true,
      choice: recordedChoice,
      support_count: Number(tally?.support_count ?? 0),
      oppose_count: Number(tally?.oppose_count ?? 0),
      outcome: decision?.status === "open" ? null : (decision?.outcome ?? null),
    });
  } catch (err) {
    console.error("vote-agenda-item error", err);
    return json(500, { ok: false, error: "An internal error occurred." });
  }
});
