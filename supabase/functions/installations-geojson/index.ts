// Returns compact array of all geocoded solar installations for map clustering.
// Cached as a single row in cached_stats for sub-second response.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

const CACHE_KEY = "installations_geojson_v2";
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

async function rebuild(supabase: any): Promise<string> {
  // Parallel paginated fetch — assumes ~25k max
  const PAGE = 1000;
  const MAX_PAGES = 40;
  const requests = Array.from({ length: MAX_PAGES }, (_, i) =>
    supabase
      .from("solar_installations_view")
      .select("id, latitude, longitude, permit_class, original_zip, completed_date, issued_date")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .range(i * PAGE, i * PAGE + PAGE - 1),
  );
  const results = await Promise.all(requests);
  const all: any[] = [];
  for (const { data, error } of results) {
    if (error) throw error;
    if (data) all.push(...data);
  }
  const compact = all.map((r: any) => {
    const dateStr = r.completed_date || r.issued_date;
    const year = dateStr ? Number(String(dateStr).slice(0, 4)) || 0 : 0;
    return [
      r.id,
      Math.round(r.longitude * 1e5) / 1e5,
      Math.round(r.latitude * 1e5) / 1e5,
      String(r.permit_class || "").toLowerCase() === "commercial" ? 1 : 0,
      r.original_zip || null,
      year,
    ];
  });
  const payload = JSON.stringify({ points: compact, generated_at: new Date().toISOString() });
  await supabase
    .from("cached_stats")
    .upsert({ stat_type: CACHE_KEY, value: payload, label: "Map clustering points" }, { onConflict: "stat_type" });
  return payload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "1";

    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("cached_stats")
        .select("value, updated_at")
        .eq("stat_type", CACHE_KEY)
        .maybeSingle();

      if (cached?.value) {
        const ageMs = Date.now() - new Date(cached.updated_at).getTime();
        // Serve stale immediately, refresh in background if expired
        if (ageMs > MAX_AGE_MS) {
          // Fire and forget rebuild
          rebuild(supabase).catch((e) => console.error("Background rebuild failed:", e));
        }
        return new Response(cached.value, {
          headers: {
            ...corsHeaders,
            "content-type": "application/json",
            "cache-control": "public, max-age=1800",
          },
        });
      }
    }

    // No cache (or forced refresh) — build synchronously
    const payload = await rebuild(supabase);
    return new Response(payload, {
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
        "cache-control": "public, max-age=1800",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
