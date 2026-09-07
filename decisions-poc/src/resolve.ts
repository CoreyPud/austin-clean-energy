// Resolution — merge staging RawItems into canonical Decisions.
//
// Join hierarchy (validated against 2023-2026 data):
//   1. same (body, meetingDate, itemNo)         -> deterministic (agenda <-> minutes)
//   2. high title-token overlap across docs/bodies -> fuzzy (e.g. EUC rec <-> council item)
// Deterministic keys do most of the work; fuzzy overlap covers the residue.
import type { Decision, RawItem, SourceDoc, Vote } from "./schema.js";

const STOP = new Set([
  "the", "and", "for", "with", "from", "into", "that", "this", "approve", "authorize",
  "authorizing", "execution", "negotiation", "recommend", "approval", "amount", "not",
  "exceed", "austin", "energy", "city", "contract", "agreement", "term", "years", "year",
  "funding", "available", "operating", "budget", "resolution", "ordinance",
]);

function signature(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

const AUTHORITY: Record<string, number> = { "Austin City Council": 3 };
const bodyRank = (b: string) => AUTHORITY[b] ?? 1;

export function slugify(title: string, date: string): string {
  const year = date.slice(0, 4);
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .slice(0, 5)
    .join("-");
  return `${year}-${words}`;
}

export function resolveDecisions(rawItems: RawItem[], docs: Map<string, SourceDoc>): Decision[] {
  // greedy clustering
  type Cluster = { items: RawItem[]; sig: Set<string> };
  const clusters: Cluster[] = [];

  for (const it of rawItems) {
    const sig = signature(it.title);
    let placed = false;
    for (const c of clusters) {
      const sameItem = c.items.some(
        (o) => o.body === it.body && o.meetingDate === it.meetingDate && o.itemNo != null && o.itemNo === it.itemNo,
      );
      if (sameItem || jaccard(sig, c.sig) >= 0.5) {
        c.items.push(it);
        for (const t of sig) c.sig.add(t);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push({ items: [it], sig });
  }

  return clusters.map((c) => buildDecision(c.items, docs));
}

function buildDecision(items: RawItem[], docs: Map<string, SourceDoc>): Decision {
  // most authoritative + latest action leads
  const lead = [...items].sort(
    (a, b) => bodyRank(b.body) - bodyRank(a.body) || b.meetingDate.localeCompare(a.meetingDate),
  )[0]!;

  const votes: Vote[] = [];
  for (const it of items) if (it.vote) votes.push(it.vote);

  const documents = items.map((it) => {
    const d = docs.get(it.docId);
    return {
      docType: d?.docType ?? "commission_agenda",
      body: it.body,
      meetingDate: it.meetingDate,
      edimsId: d?.edimsId,
      url: d?.url ?? "",
      itemNo: it.itemNo,
    };
  });

  const dollarAmount =
    items.find((it) => it.fieldSources.dollarAmount === "regex")?.dollarAmount ??
    items.find((it) => it.dollarAmount != null)?.dollarAmount ??
    null;

  const flags = [...new Set(items.flatMap((it) => it.flags))];
  const sealed = votes.some((v) => v.isClosedSession);
  const links = [...new Set(items.flatMap((it) => it.crossRefs))].map((toKey) => ({
    relation: "references",
    toKey,
  }));

  return {
    id: slugify(lead.title, lead.meetingDate),
    title: lead.title,
    date: lead.meetingDate,
    body: lead.body,
    decisionType: lead.decisionType,
    topic: lead.topic,
    isClimate: items.some((it) => it.isClimate),
    significance: lead.significance,
    dollarAmount,
    status: votes.find((v) => v.body === lead.body)?.result ?? lead.decisionType,
    verification: sealed ? "sealed" : "official",
    summary: lead.summary,
    canonicalKey: lead.itemNo ? `${lead.meetingDate.replace(/-/g, "")}-${lead.itemNo.padStart(3, "0")}` : null,
    votes,
    documents,
    links,
    flags,
    rawItemIds: items.map((it) => it.rawItemId),
  };
}
