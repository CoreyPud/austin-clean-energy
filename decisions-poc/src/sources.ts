// Source registry — which bodies to crawl. The crawler pulls each board's meeting
// index and returns agenda + minutes docs; add a body by adding its board id.
// (Find ids at austintexas.gov/boards-commissions/meetings/{id}_1.)
import type { SourceDoc } from "./schema.js";
import { crawlBoard } from "./crawl.js";

export const BOARDS: { id: number; body: string }[] = [
  { id: 27, body: "Electric Utility Commission" },
  { id: 140, body: "Joint Sustainability Committee" },
  { id: 28, body: "Environmental Commission" },
  { id: 52, body: "Water and Wastewater Commission" },
  { id: 97, body: "Zero Waste Advisory Commission" },
  // Resource Management Commission: id not yet confirmed (may be renamed/folded into EUC)
];

/** Discover all agenda/minutes docs for the configured boards, optionally by year. */
export async function discoverDocs(year?: string): Promise<SourceDoc[]> {
  const all: SourceDoc[] = [];
  for (const b of BOARDS) {
    const docs = await crawlBoard(b.id, b.body, { year });
    all.push(...docs);
  }
  return all;
}
