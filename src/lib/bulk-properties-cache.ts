// Local (IndexedDB, not localStorage -- the payload is a few MB, well past localStorage's
// ~5-10MB origin quota) cache for the properties-bulk payload. Freshness is anchored to the
// server's own generatedAt, not a separate client-side clock: the caller fetches the ~180-byte
// manifest first, and only re-downloads the full payload if its generatedAt doesn't match what's
// cached here. That naturally tracks the edge function's own 24h regeneration cadence without
// this module needing to know or enforce a TTL itself.

import type { BulkPayload } from "@/lib/properties-bulk";

const DB_NAME = "explore-cache";
const DB_VERSION = 1;
const STORE = "bulk-properties";
const CACHE_KEY = "current";

interface CachedBulk {
  key: string;
  generatedAt: string;
  payload: BulkPayload;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Returns null on any failure (IndexedDB unavailable in private browsing, quota issues,
 *  corrupt entry, etc.) -- this is a cache, callers should always be able to fall back to a
 *  network fetch rather than treating a read failure as fatal. */
export async function readCachedBulk(): Promise<CachedBulk | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(CACHE_KEY);
      req.onsuccess = () => resolve((req.result as CachedBulk | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/** Best-effort; a write failure just means next load re-downloads, not a user-facing error. */
export async function writeCachedBulk(payload: BulkPayload): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ key: CACHE_KEY, generatedAt: payload.generatedAt, payload } satisfies CachedBulk);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore -- quota exceeded, private browsing, etc. Not worth surfacing to the user.
  }
}
