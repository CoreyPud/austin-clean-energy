/**
 * Reads local data/google_solar/{pid}.json files and populates:
 *   - tcad_properties: solar scalar columns + solar_fetched_at
 *   - tcad_roof_segments: one row per roof face
 *
 * Run after applying migrations 20260619200000 and 20260619210000.
 * Safe to re-run — uses upsert for segments, update for properties.
 *
 * Usage: node scripts/populate_solar_db.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = join(__dirname, "..");
const SOL_DIR = join(ROOT, "data", "google_solar");

// ── Load env vars ─────────────────────────────────────────────────────────────
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
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Parse a single raw file ───────────────────────────────────────────────────
function parseFile(pid, raw) {
  // 404 — building not found
  if (raw._status === 404) {
    return {
      property: {
        pid,
        solar_fetched_at: raw._fetched_at ?? new Date().toISOString(),
        solar_imagery_quality: null,
        solar_imagery_date: null,
        solar_max_panels: null,
        solar_max_area_m2: null,
        solar_sunshine_hrs: null,
        solar_panel_capacity_w: null,
      },
      segments: [],
    };
  }

  const sp = raw.solarPotential ?? {};
  const id = raw.imageryDate;
  const imageryDate = id?.year
    ? `${id.year}-${String(id.month).padStart(2,"0")}-${String(id.day).padStart(2,"0")}`
    : null;

  const property = {
    pid,
    solar_fetched_at:       raw._fetched_at ?? new Date().toISOString(),
    solar_imagery_quality:  raw.imageryQuality ?? null,
    solar_imagery_date:     imageryDate,
    solar_max_panels:       sp.maxArrayPanelsCount ?? null,
    solar_max_area_m2:      sp.maxArrayAreaMeters2 ?? null,
    solar_sunshine_hrs:     sp.maxSunshineHoursPerYear ?? null,
    solar_sunshine_median:  sp.wholeRoofStats?.sunshineQuantiles?.[5] ?? null,
    solar_panel_capacity_w: sp.panelCapacityWatts ?? null,
  };

  const segments = (sp.roofSegmentStats ?? []).map((seg, i) => ({
    pid,
    segment_index:   i,
    pitch_deg:       seg.pitchDegrees ?? null,
    azimuth_deg:     seg.azimuthDegrees ?? null,
    area_m2:         seg.stats?.areaMeters2 ?? null,
    ground_area_m2:  seg.stats?.groundAreaMeters2 ?? null,
    sunshine_median: seg.stats?.sunshineQuantiles?.[5] ?? null,
    sunshine_max:    seg.stats?.sunshineQuantiles?.[10] ?? null,
    center_lat:      seg.center?.latitude ?? null,
    center_lon:      seg.center?.longitude ?? null,
  }));

  return { property, segments };
}

// ── Batch upsert helper ───────────────────────────────────────────────────────
async function upsertBatch(table, rows, onConflict) {
  if (!rows.length) return;
  const { error } = await sb.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table} upsert: ${error.message}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
const files = readdirSync(SOL_DIR).filter(f => f.endsWith(".json"));
console.log(`Found ${files.length} local files in data/google_solar/`);

const BATCH = 200;
let propRows = [], segRows = [], done = 0, skipped404 = 0;

for (const f of files) {
  const pid = f.replace(".json", "");
  const raw = JSON.parse(readFileSync(join(SOL_DIR, f), "utf8"));
  const { property, segments } = parseFile(pid, raw);

  if (raw._status === 404) skipped404++;

  propRows.push(property);
  segRows.push(...segments);
  done++;

  if (propRows.length >= BATCH) {
    process.stdout.write(`\r  Upserting ${done}/${files.length}...`);
    await upsertBatch("tcad_properties", propRows, "pid");
    await upsertBatch("tcad_roof_segments", segRows, "pid,segment_index");
    propRows = [];
    segRows  = [];
  }
}

// flush remainder
if (propRows.length) {
  process.stdout.write(`\r  Upserting ${done}/${files.length}...`);
  await upsertBatch("tcad_properties", propRows, "pid");
  await upsertBatch("tcad_roof_segments", segRows, "pid,segment_index");
}

console.log(`\nDone.`);
console.log(`  Properties updated: ${files.length}`);
console.log(`  404s (no building): ${skipped404}`);
console.log(`  Segments inserted:  ${files.length - skipped404} properties × avg segments`);
