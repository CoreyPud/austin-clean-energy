import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// Loads the council decisions register (generated offline by decisions-poc) into the
// council_decisions table. Fetches the JSON from a URL (the deployed site's
// /data/council-decisions.json, or any raw URL) and upserts by id, so re-running after
// a regenerate is idempotent. Guarded by the shared SOLAR_IMPORT_SECRET.
//
// Table shape (create via Lovable): scalar columns for filtering + a `data` jsonb holding
// the full decision object, so the frontend reads `data` and gets the exact JSON shape.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

interface Decision {
  id: string; meetingDate: string; itemNumber: string; body: string; topic: string;
  isClimate: boolean; significance: string; outcome: string; decidedInClosedSession: boolean;
  [k: string]: unknown;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const secret = Deno.env.get("SOLAR_IMPORT_SECRET");
  if (!secret || req.headers.get("x-sync-secret") !== secret) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    // accept an inline payload, else fetch from a URL (default: deployed site's public file)
    let payload = body.payload as { decisions: Decision[] } | undefined;
    if (!payload) {
      const url = body.url as string | undefined;
      if (!url) throw new Error("Provide `url` (to /data/council-decisions.json) or inline `payload`.");
      const res = await fetch(url);
      if (!res.ok) throw new Error(`fetch ${res.status} for ${url}`);
      payload = await res.json();
    }
    const decisions = payload?.decisions ?? [];
    if (!Array.isArray(decisions) || decisions.length === 0) throw new Error("No decisions in payload.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const rows = decisions.map((d) => ({
      id: d.id,
      meeting_date: d.meetingDate,
      meeting_year: Number((d.meetingDate || "").slice(0, 4)) || null,
      item_number: d.itemNumber,
      body: d.body,
      topic: d.topic,
      is_climate: d.isClimate,
      significance: d.significance,
      outcome: d.outcome,
      decided_in_closed_session: d.decidedInClosedSession,
      data: d, // full decision object (result, vote, references, closedSession, detail, flags, …)
    }));

    // upsert in chunks to stay within request limits
    let upserted = 0;
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const { error } = await supabase.from("council_decisions").upsert(slice, { onConflict: "id" });
      if (error) throw new Error(`upsert @${i}: ${error.message}`);
      upserted += slice.length;
    }

    return new Response(JSON.stringify({ ok: true, upserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
