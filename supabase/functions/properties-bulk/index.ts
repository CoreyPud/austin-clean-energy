// properties-bulk — one-shot bulk export of every Austin Energy-territory parcel.
//
// Why this exists: PostgREST caps every request at 1000 rows, so /explore had to paginate
// ~248 times to build the full-area view (~1 min). This function talks to Postgres directly
// via SUPABASE_DB_URL, so the row cap does not apply, and caches a gzipped payload in Storage.
//
// Payload tuple (compact, matches what the client expands into its own shapes):
//   [pid, lng, lat, typeCode, zip, hasSolar, councilDistrict, marketValue, yearBuilt, roofSqft, solarKw]
// typeCode: 0 single_family | 1 multifamily | 2 condo | 3 commercial | 4 other
//
// Endpoints:
//   GET/POST /properties-bulk              -> gzipped JSON payload
//   GET/POST /properties-bulk?manifest=1   -> tiny JSON freshness descriptor
//   ...?force=1 with x-import-secret       -> force regeneration
import postgres from "npm:postgres@3.4.5";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-import-secret",
};

const BUCKET = "no2-maps";
const PAYLOAD_PATH = "bulk/properties.json.gz";
const MANIFEST_PATH = "bulk/manifest.json";
const TTL_MS = 24 * 60 * 60 * 1000;
// If a regeneration lock is older than this it is assumed dead (function timed out) and
// the next request is allowed to take over.
const LOCK_STALE_MS = 5 * 60 * 1000;

// Order defines the wire codes; the client keeps an identical table.
const TYPE_CODES = ["single_family", "multifamily", "condo", "commercial", "other"] as const;
const TYPE_CODE_BY_NAME = new Map<string, number>(TYPE_CODES.map((t, i) => [t, i]));

interface Manifest {
  generatedAt: string;
  rowCount: number;
  bytes: number;
  typeCodes: readonly string[];
  regenerating?: boolean;
  lockAt?: string | null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function readManifest(sb: ReturnType<typeof admin>): Promise<Manifest | null> {
  const { data, error } = await sb.storage.from(BUCKET).download(MANIFEST_PATH);
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text()) as Manifest;
  } catch {
    return null;
  }
}

async function writeManifest(sb: ReturnType<typeof admin>, m: Manifest) {
  await sb.storage.from(BUCKET).upload(MANIFEST_PATH, new Blob([JSON.stringify(m)], {
    type: "application/json",
  }), { upsert: true, contentType: "application/json" });
}

async function gzip(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Build a single wire tuple from a DB row. */
function buildTuple(r: {
  pid: string;
  lon: number;
  lat: number;
  property_type: string | null;
  situs_zip: string | null;
  has_solar: boolean | null;
  council_district: number | null;
  market_value: number | null;
  estimated_roof_sqft: number | null;
  year_built: number | null;
  solar_kw: number | null;
}) {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return [
    r.pid,
    Number(r.lon),
    Number(r.lat),
    // Unknown/NULL property_type falls into "other" (code 4) so the client's type filter
    // still has a bucket for it rather than dropping the row.
    TYPE_CODE_BY_NAME.get(r.property_type ?? "") ?? 4,
    r.situs_zip,
    r.has_solar ? 1 : 0,
    // Already computed server-side by the geo trigger; raw district integer 1-10, NULL outside city limits.
    num(r.council_district),
    num(r.market_value),
    num(r.year_built),
    num(r.estimated_roof_sqft),
    // Sum of permitted kW across all installations on this parcel; NULL when none.
    num(r.solar_kw),
  ];
}

/** Full-table read over a direct Postgres connection — no PostgREST row cap involved.
 *  Streams rows through chunked queries and gzip to keep memory well under the
 *  Supabase Edge Function worker limit (~247k rows with all their fields). */
async function regenerate(sb: ReturnType<typeof admin>): Promise<Manifest> {
  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, {
    max: 2,
    prepare: false,
    idle_timeout: 20,
  });
  try {
    const t0 = Date.now();
    const generatedAt = new Date().toISOString();
    const encoder = new TextEncoder();

    // Build a streaming JSON object: { generatedAt, typeCodes, points: [...] }
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();

    const writeTask = (async () => {
      await writer.write(encoder.encode(`{"generatedAt":"${generatedAt}","typeCodes":${JSON.stringify(TYPE_CODES)},"points":[`));

      let first = true;
      let totalRows = 0;
      let lastPid = "";
      const chunkSize = 40000;

      while (true) {
        const rows = await sql<
          { pid: string; lon: number; lat: number; property_type: string | null; situs_zip: string | null; has_solar: boolean | null; council_district: number | null; market_value: number | null; estimated_roof_sqft: number | null; year_built: number | null; solar_kw: number | null }[]
        >`
          SELECT p.pid,
                 p.centroid_lon AS lon,
                 p.centroid_lat AS lat,
                 p.property_type,
                 p.situs_zip,
                 p.has_solar,
                 p.council_district,
                 p.market_value,
                 p.estimated_roof_sqft,
                 p.year_built,
                 s.solar_kw
            FROM tcad_properties p
            LEFT JOIN (
                  SELECT tcad_pid, SUM(installed_kw) AS solar_kw
                    FROM solar_installations
                   WHERE tcad_pid IS NOT NULL
                   GROUP BY tcad_pid
                  ) s ON s.tcad_pid = p.pid_int
           WHERE p.in_ae = true
             AND p.centroid_lat IS NOT NULL
             AND p.centroid_lon IS NOT NULL
             AND p.pid > ${lastPid}
           ORDER BY p.pid
           LIMIT ${chunkSize}
        `;
        if (rows.length === 0) break;

        for (const r of rows) {
          const prefix = first ? "" : ",";
          await writer.write(encoder.encode(prefix + JSON.stringify(buildTuple(r))));
          first = false;
        }

        totalRows += rows.length;
        lastPid = rows[rows.length - 1].pid;
        console.log(`properties-bulk: streamed ${rows.length} rows (total ${totalRows})`);
      }

      await writer.write(encoder.encode("]}"));
      await writer.close();
    })();

    // Read the JSON stream and compress it; collect the gzipped chunks.
    const compressed = readable.pipeThrough(new CompressionStream("gzip"));
    const reader = compressed.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalBytes += value.length;
    }

    await writeTask;

    const gz = new Uint8Array(totalBytes);
    let pos = 0;
    for (const chunk of chunks) {
      gz.set(chunk, pos);
      pos += chunk.length;
    }

    console.log(`properties-bulk: queried ${totalRows} rows, gzip ${totalBytes} bytes in ${Date.now() - t0}ms`);

    const { error } = await sb.storage.from(BUCKET).upload(PAYLOAD_PATH, new Blob([gz]), {
      upsert: true,
      contentType: "application/json",
    });
    if (error) throw new Error(`storage upload failed: ${error.message}`);

    const manifest: Manifest = {
      generatedAt,
      rowCount: totalRows,
      bytes: totalBytes,
      typeCodes: TYPE_CODES,
      regenerating: false,
      lockAt: null,
    };
    await writeManifest(sb, manifest);
    console.log(`properties-bulk: wrote ${totalBytes} bytes in ${Date.now() - t0}ms total`);
    return manifest;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function servePayload(sb: ReturnType<typeof admin>) {
  const { data, error } = await sb.storage.from(BUCKET).download(PAYLOAD_PATH);
  if (error || !data) return json({ error: "Cached payload unavailable." }, 503);
  // Bytes on disk are already gzipped, so the encoding header has to be set explicitly —
  // the runtime will not add it for pre-compressed bodies.
  return new Response(await data.arrayBuffer(), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Content-Encoding": "gzip",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const sb = admin();
    const wantManifest = url.searchParams.get("manifest") === "1";

    const forced = url.searchParams.get("force") === "1";
    if (forced) {
      const secret = req.headers.get("x-import-secret");
      if (!secret || secret !== Deno.env.get("SOLAR_IMPORT_SECRET")) {
        return json({ error: "Unauthorized" }, 401);
      }
      const m = await regenerate(sb);
      return wantManifest ? json(m) : await servePayload(sb);
    }

    const manifest = await readManifest(sb);
    const age = manifest ? Date.now() - new Date(manifest.generatedAt).getTime() : Infinity;
    const lockAge = manifest?.lockAt ? Date.now() - new Date(manifest.lockAt).getTime() : Infinity;
    const locked = manifest?.regenerating === true && lockAge < LOCK_STALE_MS;

    if (age > TTL_MS && !locked) {
      // Take the lock before the expensive work so concurrent requests keep serving the
      // stale copy instead of all regenerating the same payload at once.
      if (manifest) {
        await writeManifest(sb, { ...manifest, regenerating: true, lockAt: new Date().toISOString() });
      }
      try {
        const fresh = await regenerate(sb);
        return wantManifest ? json(fresh) : await servePayload(sb);
      } catch (e) {
        console.error("properties-bulk: regeneration failed", e);
        if (manifest) {
          // Release the lock so the next request can retry rather than waiting out LOCK_STALE_MS.
          await writeManifest(sb, { ...manifest, regenerating: false, lockAt: null });
          // Fall through and serve stale data — better than failing the map load.
        } else {
          return json({ error: "An internal error occurred." }, 500);
        }
      }
    }

    if (!manifest) return json({ error: "An internal error occurred." }, 500);
    return wantManifest ? json(manifest) : await servePayload(sb);
  } catch (error) {
    console.error("properties-bulk error:", error);
    return json({ error: "An internal error occurred." }, 500);
  }
});
