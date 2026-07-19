/**
 * Re-export of the canonical solar filter implementation.
 *
 * The algorithm lives under supabase/functions/_shared/ so the Deno edge functions can
 * import it directly — Deno runs TypeScript natively and the module has no imports of
 * its own. Keeping one copy there, rather than a synced duplicate, means the capacity
 * computed by an edge function, the value written by scripts/populate_solar_db.mjs, and
 * the layout drawn in the UI cannot disagree.
 *
 * App code should keep importing from "@/lib/solar-filters"; this shim keeps that path
 * stable regardless of where the implementation sits.
 */
export * from "../../supabase/functions/_shared/solar-filters";
