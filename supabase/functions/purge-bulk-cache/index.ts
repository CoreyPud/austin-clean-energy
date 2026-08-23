// Temporary one-shot maintenance function: clears the properties-bulk cache objects so the next
// request rebuilds them with the current payload shape. Deleted immediately after use.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

Deno.serve(async () => {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data, error } = await sb.storage.from("no2-maps").remove([
    "bulk/manifest.json",
    "bulk/properties.json.gz",
  ]);
  return new Response(JSON.stringify({ removed: data?.map((o) => o.name) ?? [], error: error?.message ?? null }), {
    headers: { "Content-Type": "application/json" },
  });
});
