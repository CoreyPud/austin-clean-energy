/**
 * Reads local data/google_solar/{pid}.json files and generates a SQL migration
 * that populates tcad_properties solar columns and tcad_roof_segments.
 *
 * Output: supabase/migrations/20260619220000_solar_data.sql
 * Usage:  node scripts/generate_solar_sql.mjs
 */

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = join(__dirname, "..");
const SOL_DIR = join(ROOT, "data", "google_solar");
const OUT     = join(ROOT, "supabase", "migrations", "20260619220000_solar_data.sql");

function esc(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return `'${String(v).replace(/'/g, "''")}'`;
}

const files = readdirSync(SOL_DIR).filter(f => f.endsWith(".json"));
console.log(`Processing ${files.length} files...`);

const propUpdates = [];
const segInserts  = [];

for (const f of files) {
  const pid = f.replace(".json", "");
  const raw = JSON.parse(readFileSync(join(SOL_DIR, f), "utf8"));

  if (raw._status === 404) {
    propUpdates.push(
      `UPDATE tcad_properties SET solar_fetched_at=${esc(raw._fetched_at ?? new Date().toISOString())} WHERE pid=${esc(pid)};`
    );
    continue;
  }

  const sp = raw.solarPotential ?? {};
  const id = raw.imageryDate;
  const imageryDate = id?.year
    ? `${id.year}-${String(id.month).padStart(2,"0")}-${String(id.day).padStart(2,"0")}`
    : null;

  const sunshineMedian = sp.wholeRoofStats?.sunshineQuantiles?.[5] ?? null;

  propUpdates.push(
    `UPDATE tcad_properties SET ` +
    `solar_fetched_at=${esc(raw._fetched_at ?? new Date().toISOString())}, ` +
    `solar_imagery_quality=${esc(raw.imageryQuality ?? null)}, ` +
    `solar_imagery_date=${esc(imageryDate)}, ` +
    `solar_max_panels=${esc(sp.maxArrayPanelsCount ?? null)}, ` +
    `solar_max_area_m2=${esc(sp.maxArrayAreaMeters2 ?? null)}, ` +
    `solar_sunshine_hrs=${esc(sp.maxSunshineHoursPerYear ?? null)}, ` +
    `solar_sunshine_median=${esc(sunshineMedian)}, ` +
    `solar_panel_capacity_w=${esc(sp.panelCapacityWatts ?? null)} ` +
    `WHERE pid=${esc(pid)};`
  );

  (sp.roofSegmentStats ?? []).forEach((seg, i) => {
    const q = seg.stats?.sunshineQuantiles ?? [];
    segInserts.push(
      `(${esc(pid)}, ${i}, ${esc(seg.pitchDegrees ?? null)}, ${esc(seg.azimuthDegrees ?? null)}, ` +
      `${esc(seg.stats?.areaMeters2 ?? null)}, ${esc(seg.stats?.groundAreaMeters2 ?? null)}, ` +
      `${esc(q[5] ?? null)}, ${esc(q[10] ?? null)}, ` +
      `${esc(seg.center?.latitude ?? null)}, ${esc(seg.center?.longitude ?? null)})`
    );
  });
}

const CHUNK = 500;
const segLines = [];
for (let i = 0; i < segInserts.length; i += CHUNK) {
  const chunk = segInserts.slice(i, i + CHUNK);
  segLines.push(
    `INSERT INTO tcad_roof_segments (pid, segment_index, pitch_deg, azimuth_deg, area_m2, ground_area_m2, sunshine_median, sunshine_max, center_lat, center_lon)\nVALUES\n` +
    chunk.join(",\n") +
    `\nON CONFLICT (pid, segment_index) DO UPDATE SET\n` +
    `  pitch_deg=EXCLUDED.pitch_deg, azimuth_deg=EXCLUDED.azimuth_deg,\n` +
    `  area_m2=EXCLUDED.area_m2, ground_area_m2=EXCLUDED.ground_area_m2,\n` +
    `  sunshine_median=EXCLUDED.sunshine_median, sunshine_max=EXCLUDED.sunshine_max,\n` +
    `  center_lat=EXCLUDED.center_lat, center_lon=EXCLUDED.center_lon;`
  );
}

const sql = [
  "-- Auto-generated from data/google_solar/ — do not edit by hand",
  "-- Populates Google Solar scalar fields and roof segments for fetched properties",
  "",
  "-- Property scalar updates",
  ...propUpdates,
  "",
  "-- Roof segment inserts",
  ...segLines,
].join("\n");

writeFileSync(OUT, sql);
console.log(`Written to: supabase/migrations/20260619220000_solar_data.sql`);
console.log(`  ${propUpdates.length} property updates`);
console.log(`  ${segInserts.length} segment rows`);
