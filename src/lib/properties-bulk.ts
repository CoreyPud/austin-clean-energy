/**
 * Client for the `properties-bulk` edge function: the whole Austin Energy-territory parcel set
 * (~247k rows) in a single gzipped request, instead of ~248 paginated PostgREST calls.
 *
 * The wire format is deliberately compact tuples. `typeCodes` is echoed in the payload so the
 * decode table can never silently drift from whatever the server encoded with, but the local
 * TYPE_CODES below is the fallback and the canonical ordering.
 */

/** Index === wire code. Must stay in sync with the edge function's TYPE_CODES. */
export const TYPE_CODES = ["single_family", "multifamily", "condo", "commercial", "other"] as const;

export type BulkTuple = [
  pid: string,
  lng: number,
  lat: number,
  typeCode: number,
  zip: string | null,
  hasSolar: 0 | 1,
];

export interface BulkPayload {
  generatedAt: string;
  typeCodes?: readonly string[];
  points: BulkTuple[];
}

/** Tiny freshness descriptor — cheap to fetch before deciding to re-download the payload. */
export interface BulkManifest {
  generatedAt: string;
  rowCount: number;
  bytes: number;
  typeCodes: readonly string[];
}

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/properties-bulk`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function call(path: string, signal?: AbortSignal) {
  const res = await fetch(`${FUNCTIONS_BASE}${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `properties-bulk failed (${res.status})`);
  }
  return res;
}

export async function fetchBulkManifest(signal?: AbortSignal): Promise<BulkManifest> {
  return (await call("?manifest=1", signal)).json();
}

/** Browser handles the gzip transparently — this is a plain JSON response as far as fetch cares. */
export async function fetchBulkProperties(signal?: AbortSignal): Promise<BulkPayload> {
  return (await call("", signal)).json();
}

/** Wire code -> the same `property_type` strings the filters and classifyProperty expect. */
export function decodeTypeCode(code: number, typeCodes: readonly string[] = TYPE_CODES): string {
  return typeCodes[code] ?? "other";
}
