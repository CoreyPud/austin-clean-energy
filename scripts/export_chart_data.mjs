/**
 * Dumps Supabase chart data to public/ JSON snapshots so city-overview
 * renders from static files at build time instead of querying at runtime.
 *
 * Run: node scripts/export_chart_data.mjs
 * Outputs:
 *   public/ae_plants.json
 *   public/plant_monthly_gen.json
 *   public/solar_installations.json
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

let url, key;
for (const f of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      if (line.startsWith("VITE_SUPABASE_URL="))             url = line.split("=")[1].trim().replace(/"/g, "");
      if (line.startsWith("VITE_SUPABASE_ANON_KEY=") ||
          line.startsWith("VITE_SUPABASE_PUBLISHABLE_KEY=")) key = line.split("=")[1].trim().replace(/"/g, "");
    }
  } catch {}
}
if (!url || !key) { console.error("Could not find VITE_SUPABASE_URL / anon key"); process.exit(1); }

const sb = createClient(url, key);

async function fetchAll(table, query) {
  const PAGE = 1000;
  let from = 0;
  const rows = [];
  process.stdout.write(`  ${table}...`);
  while (true) {
    const { data, error } = await query(sb, from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    process.stdout.write(` ${rows.length}`);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(` ✓`);
  return rows;
}

console.log("Exporting chart data from Supabase...");

const plants = await fetchAll("power_plants", (sb) =>
  sb.from("power_plants").select("*").not("ae_pct", "is", null)
);

const gen = await fetchAll("plant_monthly_gen", (sb, from, to) =>
  sb.from("plant_monthly_gen").select("plantid, period, avg_mw").range(from, to)
);

const solar = await fetchAll("solar_installations", (sb, from, to) =>
  sb.from("solar_installations")
    .select("issued_date, installed_kw")
    .not("issued_date", "is", null)
    .not("installed_kw", "is", null)
    .gt("installed_kw", 0)
    .order("issued_date")
    .range(from, to)
);

writeFileSync("public/ae_plants.json",            JSON.stringify(plants, null, 2));
writeFileSync("public/plant_monthly_gen.json",    JSON.stringify(gen, null, 2));
writeFileSync("public/solar_installations.json",  JSON.stringify(solar, null, 2));

console.log(`Done.`);
console.log(`  ae_plants.json:           ${plants.length} rows`);
console.log(`  plant_monthly_gen.json:   ${gen.length} rows`);
console.log(`  solar_installations.json: ${solar.length} rows`);
