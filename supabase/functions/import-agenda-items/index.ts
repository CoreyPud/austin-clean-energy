import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// Secret-guarded write endpoint for loading council agenda items into
// council_decisions. Mirrors the other council sync/import functions:
// shared SOLAR_IMPORT_SECRET via x-sync-secret, chunked upsert by id.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const CHUNK = 500;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const secret = Deno.env.get("SOLAR_IMPORT_SECRET");
  if (!secret || req.headers.get("x-sync-secret") !== secret) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  let body: { items?: Record<string, unknown>[] };
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  const items = (body.items ?? []).filter((r) => r && typeof r.id === "string");
  if (!items.length) return json(400, { ok: false, error: "No valid items" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Reconciliation case: items arriving as "decided" that are currently stored
    // as "open" (PDF-sourced pre-vote) must carry decided_at + updated_at.
    const decidedIds = items
      .filter((r) => r.status === "decided")
      .map((r) => String(r.id));

    let openIds = new Set<string>();
    if (decidedIds.length) {
      const found: string[] = [];
      for (let i = 0; i < decidedIds.length; i += CHUNK) {
        const { data, error } = await supabase
          .from("council_decisions")
          .select("id")
          .eq("status", "open")
          .in("id", decidedIds.slice(i, i + CHUNK));
        if (error) throw new Error(error.message);
        found.push(...(data ?? []).map((r: { id: string }) => r.id));
      }
      openIds = new Set(found);
    }

    const now = new Date().toISOString();
    const rows = items.map((r) => {
      if (r.status === "decided" && openIds.has(String(r.id))) {
        return { ...r, decided_at: r.decided_at ?? now, updated_at: now };
      }
      return r;
    });

    let upserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const { error } = await supabase
        .from("council_decisions")
        .upsert(slice, { onConflict: "id" });
      if (error) throw new Error(error.message);
      upserted += slice.length;
    }

    return json(200, { ok: true, upserted });
  } catch (err) {
    console.error("import-agenda-items error", err);
    return json(500, { ok: false, error: String(err) });
  }
});
