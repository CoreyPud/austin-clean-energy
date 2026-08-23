// Temporary one-shot maintenance function: clears the properties-bulk cache objects and the
// leftover geo_derivation_setup.sql upload. Deleted immediately after use.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

Deno.serve(async () => {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const paths = ["bulk/manifest.json", "bulk/properties.json.gz", "geo_derivation_setup.sql"];
  const { data, error } = await sb.storage.from("no2-maps").remove(paths);
  return new Response(JSON.stringify({ removed: data?.map((o) => o.name) ?? [], error: error?.message ?? null }), {
    headers: { "Content-Type": "application/json" },
  });
});
