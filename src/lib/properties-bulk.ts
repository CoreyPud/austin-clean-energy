// Client for the properties-bulk edge function: fetches every AE-territory property in one
// request (direct-Postgres, no PostgREST 1000-row cap) instead of the ~250-page paginated
// loop the /explore background loader used before. See supabase/functions/properties-bulk.
//
// Browsers send Accept-Encoding: gzip on every fetch automatically and decompress
// transparently, so no special handling is needed here for the function's gzip'd response.

import { readCachedBulk, writeCachedBulk } from "@/lib/bulk-properties-cache";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/properties-bulk`;

const AUTH_HEADERS = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

/** [pid, lng, lat, typeCode, zip, hasSolar(0|1)] -- typeCode indexes into the payload's own
 *  typeCodes array (decode against that, not TYPE_CODES below, so a reordered/extended type
 *  list on the server can't silently desync an older cached client). */
export type BulkTuple = [string, number, number, number, string | null, 0 | 1];

export interface BulkPayload {
  generatedAt: string;
  typeCodes: string[];
  points: BulkTuple[];
}

export interface BulkManifest {
  generatedAt: string;
  rowCount: number;
  bytes: number;
  typeCodes: string[];
  regenerating: boolean;
  lockAt: string | null;
}

/** Reference copy of the current type order, for callers that don't have a payload/manifest
 *  handy. Prefer decoding against the payload's own typeCodes when you have one. */
export const TYPE_CODES = ["single_family", "multifamily", "condo", "commercial", "other"];

export function decodeTypeCode(code: number, typeCodes: string[] = TYPE_CODES): string {
  return typeCodes[code] ?? "other";
}

export async function fetchBulkManifest(signal?: AbortSignal): Promise<BulkManifest> {
  const res = await fetch(`${FUNCTION_URL}?manifest=1`, { headers: AUTH_HEADERS, signal });
  if (!res.ok) throw new Error(`properties-bulk manifest failed: ${res.status}`);
  return res.json();
}

export async function fetchBulkProperties(signal?: AbortSignal): Promise<BulkPayload> {
  const res = await fetch(FUNCTION_URL, { headers: AUTH_HEADERS, signal });
  if (!res.ok) throw new Error(`properties-bulk fetch failed: ${res.status}`);
  return res.json();
}

/** Manifest-first: only pays for the ~2.9MB download when the server has actually regenerated
 *  since this browser last cached it. Falls back to a plain fetch if IndexedDB is unavailable. */
export async function loadBulkPropertiesCached(signal?: AbortSignal): Promise<BulkPayload> {
  const [manifest, cached] = await Promise.all([
    fetchBulkManifest(signal),
    readCachedBulk(),
  ]);
  if (cached && cached.generatedAt === manifest.generatedAt) {
    return cached.payload;
  }
  const payload = await fetchBulkProperties(signal);
  writeCachedBulk(payload); // fire-and-forget; a write failure shouldn't block using the data
  return payload;
}
