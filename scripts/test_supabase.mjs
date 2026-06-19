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
