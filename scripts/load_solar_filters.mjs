/**
 * Loads the canonical solar filter into Node.
 *
 * The implementation lives in supabase/functions/_shared/ so Deno edge functions can
 * import it natively; the app re-exports it via src/lib/solar-filters.ts. This script is
 * the third consumer. Loading the same file — rather than a hand-ported copy that would
 * drift the moment either side is tuned — is what keeps all three in agreement. The
 * module is deliberately import-free, so transpiling it in isolation and importing the
 * result as a data: URL is enough. esbuild ships with Vite, so this needs no install.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { transformSync } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "supabase", "functions", "_shared", "solar-filters.ts");

const { code } = transformSync(readFileSync(SRC, "utf8"), {
  loader: "ts",
  format: "esm",
  target: "node18",
});

export const {
  applySolarFilters,
  applyCommercialFilters,
  SOLAR_FILTER_VERSION,
  BORDER_SMOOTH_M,
} = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
