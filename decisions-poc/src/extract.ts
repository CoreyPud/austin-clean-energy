// Document fetch + PDF text extraction. Deterministic, no LLM.
// Caches raw PDFs and extracted text under decisions-poc/cache to keep re-runs cheap
// and to give the eval harness stable fixtures.
import { extractText, getDocumentProxy } from "unpdf";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cacheDir = resolve(here, "..", "cache");
if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

export const edimsUrl = (id: string) => `https://services.austintexas.gov/edims/document.cfm?id=${id}`;

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status} for ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Extract text from an EDIMS PDF, cached by id. */
export async function extractEdimsText(edimsId: string): Promise<string> {
  const txtCache = resolve(cacheDir, `edims_${edimsId}.txt`);
  if (existsSync(txtCache)) return readFileSync(txtCache, "utf8");
  const bytes = await fetchBytes(edimsUrl(edimsId));
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  const clean = normalizeText(text);
  writeFileSync(txtCache, clean, "utf8");
  return clean;
}

/** Collapse runaway whitespace but preserve line breaks (item boundaries matter). */
export function normalizeText(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ /g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
