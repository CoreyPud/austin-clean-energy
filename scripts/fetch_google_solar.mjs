/**
 * Calls Google Solar buildingInsights for each property in data/solar_targets.json
 * and saves the full raw response to data/google_solar/{pid}.json.
 *
 * Run export_solar_targets.mjs first to generate the target list.
 * Resume-safe: skips any PID where the file already exists.
 *
 * Usage:
 *   node scripts/fetch_google_solar.mjs
 *   node scripts/fetch_google_solar.mjs --concurrency 10
 *   node scripts/fetch_google_solar.mjs --rpm 200
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = join(__dirname, "..");
const SOL_DIR = join(ROOT, "data", "google_solar");
const TARGETS = join(ROOT, "data", "solar_targets.json");

const args = process.argv.slice(2);
const concurrency = (() => {
  const i = args.indexOf("--concurrency");
  return i !== -1 ? parseInt(args[i + 1], 10) : 10;
})();
const RPM = (() => {
  const i = args.indexOf("--rpm");
  return i !== -1 ? parseInt(args[i + 1], 10) : 200;
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
const SOLAR_KEY = env.GOOGLE_SOLAR_API_KEY;
if (!SOLAR_KEY) { console.error("Missing GOOGLE_SOLAR_API_KEY in supabase/.env"); process.exit(1); }

if (!existsSync(TARGETS)) {
  console.error("data/solar_targets.json not found. Run export_solar_targets.mjs first.");
  process.exit(1);
}

mkdirSync(SOL_DIR, { recursive: true });

const allTargets = JSON.parse(readFileSync(TARGETS, "utf8"));
const pending    = allTargets.filter(p => !existsSync(join(SOL_DIR, `${p.pid}.json`)));
const skipped    = allTargets.length - pending.length;

console.log(`Targets: ${allTargets.length.toLocaleString()}`);
console.log(`Cached:  ${skipped.toLocaleString()} (skipped)`);
console.log(`To fetch: ${pending.length.toLocaleString()}`);
console.log(`Concurrency: ${concurrency}, RPM limit: ${RPM}`);
console.log();

if (pending.length === 0) {
  console.log("Nothing to fetch. Done.");
  process.exit(0);
}

async function fetchSolar(pid, lat, lon) {
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&key=${SOLAR_KEY}`;
  const res = await fetch(url);
  if (res.status === 404) return { _status: 404, _pid: pid, _fetched_at: new Date().toISOString() };
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Solar API ${res.status} for ${pid}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  data._pid = pid;
  data._fetched_at = new Date().toISOString();
  return data;
}

// Rate limiter: ensures we don't exceed RPM
const msPerReq = (60 / RPM) * 1000;
let lastTick = Date.now();
async function rateLimit() {
  const now = Date.now();
  const wait = msPerReq - (now - lastTick);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastTick = Date.now();
}

async function runPool(tasks, limit) {
  let idx = 0, done = 0, errors = 0;
  const total = tasks.length;
  const startTime = Date.now();

  async function worker() {
    while (idx < tasks.length) {
      const task = tasks[idx++];
      try {
        await rateLimit();
        await task();
      } catch (e) {
        errors++;
        console.error(`\n  ERROR: ${e.message}`);
      }
      done++;
      if (done % 25 === 0 || done === total) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        const rate = (done / elapsed).toFixed(1);
        process.stdout.write(`\r  ${done}/${total} (${rate}/s, ${errors} errors, ${elapsed}s elapsed)   `);
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  console.log();
  return { done, errors };
}

const tasks = pending.map(p => async () => {
  const data = await fetchSolar(p.pid, p.centroid_lat, p.centroid_lon);
  writeFileSync(join(SOL_DIR, `${p.pid}.json`), JSON.stringify(data));
});

console.log("Fetching...");
const { done, errors } = await runPool(tasks, concurrency);

console.log();
console.log(`Done. ${done - errors} saved, ${errors} errors.`);
console.log(`Files in data/google_solar/: ${done - errors + skipped}`);
console.log();
console.log("Next steps:");
console.log("  node scripts/generate_solar_sql.mjs   # generate DB migration");
