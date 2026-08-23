import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import postgres from "npm:postgres@3.4.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-import-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await sb.storage.from("no2-maps").download("geo_derivation_setup.sql");
    if (error) throw error;
    const text = await data.text();

    const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, {
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 30,
      connection: { statement_timeout: "0" },
    });
    const started = Date.now();

    // Split out the heavy full-table backfill; run the rest as-is, then backfill
    // one district at a time so no single statement runs unbounded.
    const marker = "UPDATE tcad_properties p";
    const idx = text.indexOf(marker);
    const endIdx = text.indexOf(";", text.indexOf("centroid_lon IS NOT NULL", idx));
    if (idx === -1 || endIdx === -1) throw new Error("could not locate backfill statement");
    const before = text.slice(0, idx);
    const after = text.slice(endIdx + 1);

    const step = new URL(req.url).searchParams.get("step") ?? "all";
    if (step === "ddl" || step === "all") {
      await sql.unsafe(before).simple();
      await sql.unsafe(after).simple();
    }

    const only = new URL(req.url).searchParams.get("district");
    const districts = only
      ? [{ district_number: Number(only) }]
      : step === "ddl"
        ? []
        : await sql<{ district_number: number }[]>`
            SELECT district_number FROM council_districts ORDER BY district_number
          `;
    for (const d of districts) {
      await sql`
        UPDATE tcad_properties p
           SET council_district = ${d.district_number}
          FROM council_districts dd
         WHERE dd.district_number = ${d.district_number}
           AND p.centroid_lat IS NOT NULL
           AND p.centroid_lon IS NOT NULL
           AND (p.council_district IS DISTINCT FROM ${d.district_number})
           AND ST_Contains(dd.geom, ST_SetSRID(ST_MakePoint(p.centroid_lon, p.centroid_lat), 4326))
      `;
    }
    const counts = await sql`
      SELECT (SELECT count(*) FROM ae_service_area) AS ae_rows,
             (SELECT count(*) FROM council_districts) AS district_rows,
             (SELECT count(*) FROM tcad_properties WHERE council_district IS NOT NULL) AS with_district,
             (SELECT count(*) FROM tcad_properties WHERE council_district IS NULL) AS without_district
    `;
    await sql.end();
    return new Response(JSON.stringify({ ok: true, ms: Date.now() - started, ...counts[0] }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
