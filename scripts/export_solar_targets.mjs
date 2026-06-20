/**
 * Queries tcad_properties and writes a target list for fetch_google_solar.mjs.
 * Review data/solar_targets.json before running the fetch.
 *
 * Usage:
 *   node scripts/export_solar_targets.mjs                  # near peakers ≤0.5 mi
 *   node scripts/export_solar_targets.mjs --peaker-mi 2    # near peakers ≤2 mi
 *   node scripts/export_solar_targets.mjs --all-ae         # all in_ae=true
 *   node scripts/export_solar_targets.mjs --top-sqft 200   # top N by roof sqft
 *   node scripts/export_solar_targets.mjs --unfetched-only # skip already-fetched PIDs
 *
 * Output: data/solar_targets.json
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = join(__dirname, "..");
const OUT_DIR = join(ROOT, "data");
const OUT     = join(OUT_DIR, "solar_targets.json");
const SOL_DIR = join(ROOT, "data", "google_solar");

const args = process.argv.slice(2);
const allAE          = args.includes("--all-ae");
const unfetchedOnly  = args.includes("--unfetched-only");
const peakerMi = (() => {
  const i = args.indexOf("--peaker-mi");
  return i !== -1 ? parseFloat(args[i + 1]) : 0.5;
})();
const topSqft = (() => {
  const i = args.indexOf("--top-sqft");
  return i !== -1 ? parseInt(args[i + 1], 10) : null;
})();

function loadEnv(...files) {
  const vars = {};
  for (const f of files) {
    try {
      for (const line of readFileSync(join(ROOT, f), "utf8").split("\n")) {
        const eq = line.indexOf("=");
        if (eq === -1 || line.startsWith("#")) continue;
        const k = line.slice(0, eq).trim();
        const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (k && !vars[k]) vars[k] = v;
      }
    } catch {}
  }
  return vars;
}

const env = loadEnv(".env.local", ".env", "supabase/.env");
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("Missing Supabase URL/key"); process.exit(1); }

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
mkdirSync(OUT_DIR, { recursive: true });

let rows = [];

if (topSqft !== null) {
  process.stdout.write(`Fetching top ${topSqft} by roof sqft...`);
  const { data, error } = await sb.from("tcad_properties")
    .select("pid, centroid_lat, centroid_lon, estimated_roof_sqft, situs_address")
    .not("centroid_lat", "is", null)
    .not("estimated_roof_sqft", "is", null)
    .eq("in_ae", true)
    .order("estimated_roof_sqft", { ascending: false })
    .limit(topSqft);
  if (error) { console.error(error.message); process.exit(1); }
  rows = data ?? [];
} else {
  const PAGE = 1000;
  let baseQuery = () => {
    let q = sb.from("tcad_properties")
      .select("pid, centroid_lat, centroid_lon, estimated_roof_sqft, situs_address")
      .not("centroid_lat", "is", null)
      .not("centroid_lon", "is", null);
    if (allAE) {
      q = q.eq("in_ae", true);
    } else {
      q = q.lte("dist_proposed_peaker_mi", peakerMi).not("dist_proposed_peaker_mi", "is", null);
    }
    return q;
  };

  process.stdout.write("Fetching properties...");
  let from = 0;
  while (true) {
    const { data, error } = await baseQuery().range(from, from + PAGE - 1);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data?.length) break;
    rows.push(...data);
    process.stdout.write(` ${rows.length}`);
    if (data.length < PAGE) break;
    from += PAGE;
  }
}
console.log(" ✓");

if (unfetchedOnly) {
  const before = rows.length;
  rows = rows.filter(r => !existsSync(join(SOL_DIR, `${r.pid}.json`)));
  console.log(`  Excluded ${before - rows.length} already-fetched PIDs`);
}

writeFileSync(OUT, JSON.stringify(rows, null, 2));

const mode = topSqft !== null ? `top ${topSqft} by roof sqft`
           : allAE            ? "all in_ae=true"
           :                   `peaker ≤${peakerMi} mi`;

console.log(`\nWrote ${rows.length} targets to data/solar_targets.json`);
console.log(`  Mode: ${mode}${unfetchedOnly ? " (unfetched only)" : ""}`);
if (rows[0]?.estimated_roof_sqft) {
  const sqfts = rows.map(r => r.estimated_roof_sqft).filter(Boolean).sort((a, b) => b - a);
  console.log(`  Roof sqft range: ${sqfts.at(-1)?.toLocaleString()} – ${sqfts[0]?.toLocaleString()}`);
}
console.log(`\nReview data/solar_targets.json, then run:`);
console.log(`  node scripts/fetch_google_solar.mjs`);
