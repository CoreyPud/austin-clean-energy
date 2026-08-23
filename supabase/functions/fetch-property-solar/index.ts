import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { fetchAndBuildSolarRecord, persistSolarResult } from "../_shared/solarFetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function validateAdminToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: "validate", token }),
    });
    const result = await res.json();
    return result.valid === true;
  } catch (e) {
    console.error("Token validation error:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "POST only" });

  try {
    const token = req.headers.get("x-admin-token");
    const valid = await validateAdminToken(token);
    if (!valid) return json(401, { error: "Unauthorized" });

    let body: { pid?: string; lat?: number; lon?: number };
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const { pid, lat, lon } = body;
    if (!pid || typeof lat !== "number" || typeof lon !== "number") {
      return json(400, { error: "Missing pid, lat, or lon" });
    }

    const apiKey = Deno.env.get("GOOGLE_SOLAR_API_KEY");
    if (!apiKey) return json(500, { error: "GOOGLE_SOLAR_API_KEY not configured" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const result = await fetchAndBuildSolarRecord(apiKey, pid, lat, lon);
    if (result.status === "error") return json(500, { error: result.errorMessage });

    const { error } = await persistSolarResult(supabase, result);
    if (error) return json(500, { error });

    return json(200, { ok: true, property: result.property });
  } catch (e) {
    console.error("fetch-property-solar error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
