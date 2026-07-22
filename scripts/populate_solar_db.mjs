/**
 * Reads local data/google_solar/{pid}.json files and pushes solar data
 * to the DB via the solar-data-import edge function.
 *
 * Requires SOLAR_IMPORT_SECRET and VITE_SUPABASE_URL in supabase/.env or .env.local
 *
 * Usage:
 *   node scripts/populate_solar_db.mjs          # push only PIDs in solar_targets.json
 *   node scripts/populate_solar_db.mjs --all    # push all files in data/google_solar/
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { applySolarFilters } from "./load_solar_filters.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = join(__dirname, "..");
const SOL_DIR = join(ROOT, "data", "google_solar");

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
const SUPABASE_URL = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
const SECRET       = env.SOLAR_IMPORT_SECRET;

if (!SUPABASE_URL) { console.error("Missing SUPABASE_URL"); process.exit(1); }
if (!SECRET)       { console.error("Missing SOLAR_IMPORT_SECRET in supabase/.env"); process.exit(1); }

const ENDPOINT = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/solar-data-import`;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Austin NREL TMY reference: south-facing ~30° tilt, peak sun hours/yr
const AUSTIN_REF_HRS = 1950;
const TSRF_MIN = 0.75;

function calcEligibleKw(sp) {
  const configs = sp.solarPanelConfigs;
  if (!configs?.length) return null;
  const panelKw = (sp.panelCapacityWatts ?? 400) / 1000;
  const threshold = panelKw * AUSTIN_REF_HRS * TSRF_MIN; // kWh/yr per panel
  let best = null;
  for (const cfg of configs) {
    if (cfg.yearlyEnergyDcKwh / cfg.panelsCount >= threshold) best = cfg;
  }
  return best ? +(best.panelsCount * panelKw).toFixed(2) : 0;
}

/**
 * Buildable capacity after the derate, using the same supabase/functions/_shared/solar-filters.ts the site
 * runs. Needs property_type because commercial roofs additionally get the perimeter
 * setback and HVAC walkways; everything else is the 75% TSRF cut only.
 */
function calcBuildable(sp, propertyType) {
  const raw = sp.solarPanels ?? [];
  if (!raw.length) return { kw: null };

  const panels = raw.map(p => ({
    lat: p.center.latitude,
    lon: p.center.longitude,
    orientation: p.orientation === "LANDSCAPE" ? "LANDSCAPE" : "PORTRAIT",
    yearlyEnergyDcKwh: p.yearlyEnergyDcKwh,
    segmentIndex: p.segmentIndex,
  }));

  const azimuths = {};
  (sp.roofSegmentStats ?? []).forEach((seg, i) => {
    if (seg.azimuthDegrees != null) azimuths[i] = seg.azimuthDegrees;
  });

  const res = applySolarFilters(panels, { propertyType, azimuths });
  const panelKw = (sp.panelCapacityWatts ?? 400) / 1000;
  return { kw: +(res.panels.length * panelKw).toFixed(2) };
}

/** pid -> property_type, needed to pick the right derate. */
async function fetchPropertyTypes(pids) {
  const map = new Map();
  const key = ANON_KEY;
  if (!key) {
    console.warn("No anon key found — every property will be derated as non-commercial.");
    return map;
  }
  const CHUNK = 200;
  for (let i = 0; i < pids.length; i += CHUNK) {
    const slice = pids.slice(i, i + CHUNK);
    const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/tcad_properties`
      + `?select=pid,property_type&pid=in.(${slice.map(p => `"${p}"`).join(",")})`;
    const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!res.ok) {
      console.warn(`property_type lookup failed (${res.status}) — treating chunk as non-commercial`);
      continue;
    }
    for (const row of await res.json()) map.set(row.pid, row.property_type);
  }
  return map;
}

function parseFile(pid, raw, propertyType) {
  if (raw._status === 404) {
    return { property: { pid, solar_fetched_at: raw._fetched_at ?? new Date().toISOString() }, segments: [] };
  }

  const sp = raw.solarPotential ?? {};
  const id = raw.imageryDate;
  const imageryDate = id?.year
    ? `${id.year}-${String(id.month).padStart(2,"0")}-${String(id.day).padStart(2,"0")}`
    : null;

  const refLat = raw.center?.latitude ?? null;
  const refLon = raw.center?.longitude ?? null;
  const solarPanels = (refLat != null && (sp.solarPanels ?? []).length)
    ? {
        ref: [refLat, refLon],
        p: sp.solarPanels.map(p => [
          +((p.center.latitude  - refLat) * 1e6).toFixed(6),
          +((p.center.longitude - refLon) * 1e6).toFixed(6),
          p.orientation === "LANDSCAPE" ? 1 : 0,
          +p.yearlyEnergyDcKwh.toFixed(1),
          p.segmentIndex,
        ]),
      }
    : null;

  const buildable = calcBuildable(sp, propertyType);

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
    solar_eligible_kw:      calcEligibleKw(sp),
    solar_panels_layout:    solarPanels,
    solar_buildable_kw:     buildable.kw,
  };

  const panelKw = (sp.panelCapacityWatts ?? 400) / 1000;
  const maxConfig = (sp.solarPanelConfigs ?? []).at(-1);
  const segSummaryMap = new Map(
    (maxConfig?.roofSegmentSummaries ?? []).map(s => [s.segmentIndex, s])
  );

  const segments = (sp.roofSegmentStats ?? []).map((seg, i) => {
    const summary = segSummaryMap.get(i);
    return {
      pid,
      segment_index:       i,
      pitch_deg:           seg.pitchDegrees ?? null,
      azimuth_deg:         seg.azimuthDegrees ?? null,
      area_m2:             seg.stats?.areaMeters2 ?? null,
      ground_area_m2:      seg.stats?.groundAreaMeters2 ?? null,
      sunshine_median:     seg.stats?.sunshineQuantiles?.[5] ?? null,
      sunshine_max:        seg.stats?.sunshineQuantiles?.[10] ?? null,
      sunshine_quantiles:  seg.stats?.sunshineQuantiles ?? null,
      center_lat:          seg.center?.latitude ?? null,
      center_lon:          seg.center?.longitude ?? null,
      max_panels:          summary?.panelsCount ?? null,
      max_kw:              summary ? +(summary.panelsCount * panelKw).toFixed(2) : null,
      yearly_energy_kwh:   summary ? +summary.yearlyEnergyDcKwh.toFixed(1) : null,
    };
  });

  return { property, segments };
}

async function pushBatch(properties, segments) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SECRET}`,
      ...(ANON_KEY ? { "apikey": ANON_KEY } : {}),
    },
    body: JSON.stringify({ properties, segments }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(JSON.stringify(data));
  return data;
}

const pushAll     = process.argv.includes("--all");
const TARGETS_FILE = join(ROOT, "data", "solar_targets.json");

let files;
if (pushAll) {
  files = readdirSync(SOL_DIR).filter(f => f.endsWith(".json"));
  console.log(`Mode: --all (${files.length} files in data/google_solar/)`);
} else {
  if (!existsSync(TARGETS_FILE)) {
    console.error("data/solar_targets.json not found. Run export_solar_targets.mjs first, or use --all.");
    process.exit(1);
  }
  const targets = JSON.parse(readFileSync(TARGETS_FILE, "utf8"));
  files = targets.map(t => `${t.pid}.json`).filter(f => existsSync(join(SOL_DIR, f)));
  console.log(`Mode: targets only (${files.length} of ${targets.length} targets have local files)`);
}

const typeMap = await fetchPropertyTypes(files.map(f => f.replace(".json", "")));
console.log(`Loaded property_type for ${typeMap.size} of ${files.length} pids`);

const BATCH = 200;
let propBatch = [], segBatch = [], done = 0, skipped404 = 0;

for (const f of files) {
  const pid = f.replace(".json", "");
  const raw = JSON.parse(readFileSync(join(SOL_DIR, f), "utf8"));
  const { property, segments } = parseFile(pid, raw, typeMap.get(pid) ?? null);

  if (raw._status === 404) skipped404++;
  propBatch.push(property);
  segBatch.push(...segments);
  done++;

  if (propBatch.length >= BATCH) {
    process.stdout.write(`\r  Pushing ${done}/${files.length}...`);
    await pushBatch(propBatch, segBatch);
    propBatch = []; segBatch = [];
  }
}

if (propBatch.length) {
  process.stdout.write(`\r  Pushing ${done}/${files.length}...`);
  await pushBatch(propBatch, segBatch);
}

console.log(`\nDone.`);
console.log(`  Properties updated: ${files.length}`);
console.log(`  404s (no building): ${skipped404}`);
