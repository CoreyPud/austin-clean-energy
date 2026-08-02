import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// One-off helper: copies the SOLAR_IMPORT_SECRET runtime env value into the
// database vault (as 'council_sync_secret') so pg_cron jobs can send it as the
// x-sync-secret header without the value ever appearing in SQL or logs.
// It only ever WRITES the already-configured secret; it never returns it.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const val = Deno.env.get("SOLAR_IMPORT_SECRET");
  if (!val) {
    return new Response(JSON.stringify({ ok: false, error: "SOLAR_IMPORT_SECRET not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error } = await supabase.rpc("set_council_cron_secret", { _val: val });
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, stored: "council_sync_secret" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
