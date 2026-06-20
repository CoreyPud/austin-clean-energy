import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Read env from .env.local or .env
let url, key;
for (const f of [".env.local", ".env"]) {
  try {
    const lines = readFileSync(f, "utf8").split("\n");
    for (const line of lines) {
      if (line.startsWith("VITE_SUPABASE_URL=")) url = line.split("=")[1].trim().replace(/"/g,"");
      if (line.startsWith("VITE_SUPABASE_ANON_KEY=") || line.startsWith("VITE_SUPABASE_PUBLISHABLE_KEY="))
        key = line.split("=")[1].trim().replace(/"/g,"");
    }
  } catch {}
}

if (!url || !key) { console.error("Could not find VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"); process.exit(1); }

const sb = createClient(url, key);

const { data: plants, error: e1 } = await sb.from("power_plants").select("plantid, plant_name, ae_pct").not("ae_pct", "is", null).limit(5);
console.log("power_plants (ae_pct not null):", e1 ?? plants?.length + " rows", plants?.slice(0,3));

const { data: gen, error: e2 } = await sb.from("plant_monthly_gen").select("plantid, period, avg_mw").limit(3);
console.log("plant_monthly_gen:", e2 ?? gen?.length + " rows", gen);

// Distance backfill progress
const { count: filled, error: e3 } = await sb.from("tcad_properties").select("pid", { count: "exact", head: true }).not("dist_proposed_peaker_mi", "is", null);
const { count: total,  error: e4 } = await sb.from("tcad_properties").select("pid", { count: "exact", head: true }).not("centroid_lat", "is", null);
console.log(`\nDistance backfill: ${filled?.toLocaleString()} / ${total?.toLocaleString()} rows filled`);
if (e3) console.log("Error (dist col):", e3.message);
if (e4) console.log("Error (centroid col):", e4.message);

const { data: sample, error: e5 } = await sb.from("tcad_properties").select("pid, situs_address, dist_proposed_peaker_mi, dist_nearest_gas_plant_mi").not("dist_proposed_peaker_mi", "is", null).order("dist_proposed_peaker_mi", { ascending: true }).limit(5);
if (e5) console.log("Sample error:", e5.message);
else console.log("Closest to proposed peaker:", sample);
