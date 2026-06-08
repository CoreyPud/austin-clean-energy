// Returns compact array of all geocoded solar installations for map clustering.
// Fields kept minimal to keep payload small (~500KB for ~19k points).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const PAGE = 1000;
    const all: Array<[string, number, number, number, string | null]> = [];
    let from = 0;
    // Paginate until exhausted
    while (true) {
      const { data, error } = await supabase
        .from("solar_installations_view")
        .select("id, latitude, longitude, permit_class, original_zip")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .range(from, from + PAGE - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      for (const r of data as any[]) {
        const c = String(r.permit_class || "").toLowerCase() === "commercial" ? 1 : 0;
        all.push([r.id, r.longitude, r.latitude, c, r.original_zip || null]);
      }
      if (data.length < PAGE) break;
      from += PAGE;
    }

    return new Response(JSON.stringify({ points: all }), {
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
        "cache-control": "public, max-age=300",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
