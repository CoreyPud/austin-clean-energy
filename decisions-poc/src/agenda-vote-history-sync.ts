// Syncs the past ~6 months of already-decided climate/energy items from CIUR (Socrata sich-49ay)
// into decisions-poc/data/agenda-vote-history.json, in the shape import-agenda-items expects.
// Clean structured data, no PDF parsing -- these become status='decided' council_decisions rows
// for the public voting page's history section.
//
// Relevance is judged by the LLM classifier over EVERY item in the window (not just the two core
// climate/energy departments), since plenty of genuinely climate-relevant items are led by other
// departments (water conservation, watershed/drainage, transit-oriented land use, EV/transportation
// policy, etc.) and a department-only filter would silently miss them. Confident core-department
// items are imported visible; anything else the classifier flags as climate-relevant is imported
// too, but hidden (visible=false) pending a human review in the admin editor -- borderline
// relevance shouldn't either get buried forever or show up on the public page unreviewed.
//
// CIUR's own `status` field means staff implementation progress, not vote outcome -- every row
// here has already been voted on, so `status` is hardcoded to 'decided'. Actual `outcome` comes
// from a cross-reference against the per-member vote record (3c89-i35a, via voting.ts), falling
// back to CIUR's own status text when no vote record matches.
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { loadVotes, voteKey } from "./voting.js";
import { classifyMeetingItems } from "./classify-council.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "..", "data");

const SODA = "https://datahub.austintexas.gov/resource/sich-49ay.json";
const CLIMATE_DEPTS = ["Austin Climate Action & Resilience", "Austin Energy"];
const LOOKBACK_DAYS = Number(process.env.LOOKBACK_DAYS ?? "183");

interface CiurRow {
  status: string;
  agenda_date: string;
  item_number: string;
  request_number: string;
  posting_language: string;
  lead_dept: string;
  sub_depts?: string;
  sponsor?: string;
  co_sponsor?: string;
  tags?: string;
  attachments?: { url?: string };
}

const isClimateDept = (r: CiurRow) =>
  CLIMATE_DEPTS.some((d) => `${r.lead_dept ?? ""} ${r.sub_depts ?? ""}`.includes(d));

// CIUR's sub_depts/tags are comma-separated strings (e.g. ",Austin Climate Action & Resilience"
// or "Transportation,Equity"); council_decisions stores them as text[].
const toArray = (s: string | undefined | null): string[] | null => {
  if (!s) return null;
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : null;
};

async function fetchHistory(): Promise<CiurRow[]> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    "$where": `agenda_date>='${since}'`,
    "$limit": "5000",
  });
  const rows = (await (await fetch(`${SODA}?${params.toString()}`)).json()) as CiurRow[];
  // request_number 'test' is a seeded training/dummy row in the live dataset (agenda_date 2050) -- exclude it,
  // and defensively drop anything not actually in the past (this pipeline is history-only by design).
  const now = Date.now();
  return rows.filter((r) => r.request_number !== "test" && new Date(r.agenda_date).getTime() <= now);
}

async function main() {
  const all = await fetchHistory();
  console.log(`${all.length} total CIUR items in the past ${LOOKBACK_DAYS} days, classifying all of them`);

  // Classify every item (not just the two core departments) so climate-relevant items led by
  // other departments aren't silently missed. One batched call for the whole window.
  const cls = all.length
    ? await classifyMeetingItems(
        "History sync (various meetings)",
        all.map((r) => ({ itemNumber: `${r.agenda_date.slice(0, 10)}-${r.item_number}`, description: r.posting_language })),
      )
    : new Map();

  const rows = all.filter((r) => {
    const c = cls.get(`${r.agenda_date.slice(0, 10)}-${r.item_number}`);
    // is_climate alone isn't enough -- confirmed live (via the Lovable-built edge function
    // version of this same pipeline) that the model isn't self-consistent between is_climate
    // and significance, so a routine operational item can still come back is_climate:true.
    // Require both, even for core departments -- a routine Austin Energy maintenance contract
    // shouldn't be a public vote item just because of its department.
    return c?.significance !== "routine" && (isClimateDept(r) || c?.is_climate);
  });
  const coreCount = rows.filter(isClimateDept).length;
  console.log(`${rows.length} climate-relevant (${coreCount} core dept, ${rows.length - coreCount} borderline -- imported hidden for review)`);

  const years = [...new Set(rows.map((r) => r.agenda_date.slice(0, 4)))];
  const votesByYear = new Map(await Promise.all(years.map(async (y) => [y, await loadVotes(y)] as const)));

  const items = rows.map((r) => {
    const meetingDate = r.agenda_date.slice(0, 10);
    const ymd = meetingDate.replace(/-/g, "");
    const itemNumber = r.item_number.padStart(3, "0");
    const vr = votesByYear.get(meetingDate.slice(0, 4))?.get(voteKey(ymd, r.item_number));
    const c = cls.get(`${meetingDate}-${r.item_number}`);
    return {
      id: `${ymd}-${itemNumber}`,
      meeting_date: meetingDate,
      meeting_year: Number(meetingDate.slice(0, 4)),
      item_number: itemNumber,
      body: "Austin City Council",
      title: c?.summary || (r.posting_language || "").replace(/\s+/g, " ").trim(),
      description: (r.posting_language || "").replace(/\s+/g, " ").trim(),
      topic: c?.topic ?? null,
      significance: c?.significance ?? null,
      sponsor: r.sponsor ?? null,
      co_sponsor: r.co_sponsor ?? null,
      lead_dept: r.lead_dept ?? null,
      sub_depts: toArray(r.sub_depts),
      tags: toArray(r.tags),
      source_url: r.attachments?.url ?? null,
      is_climate: true,
      status: "decided",
      // CIUR's own `status` field is staff implementation progress (Open/Closed), not a vote
      // result -- never use it as an outcome. Fall back to "approved" when no per-member vote
      // record matched (the common case: most items pass on unanimous consent, so 3c89-i35a
      // never logs an individual vote for them), since CIUR only ever contains items Council
      // has already adopted.
      outcome: vr?.actionTaken ?? "approved",
      decided_at: meetingDate,
      // Confident core-department items go straight to the public page; anything else the
      // classifier still flagged as climate-relevant is imported hidden, pending admin review.
      visible: isClimateDept(r),
    };
  });

  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  const outPath = resolve(dataDir, "agenda-vote-history.json");
  writeFileSync(outPath, JSON.stringify({ items }, null, 2), "utf8");
  console.log(`wrote ${items.length} items -> ${outPath}`);
  console.log(`Next: POST this file's { items } as the body to import-agenda-items (see decisions-poc/SUPABASE.md).`);
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
