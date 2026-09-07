import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// One-call council agenda sync for the admin page.
// Phase 1: CIUR history (already-decided items) -> AI classification -> vote outcomes.
// Phase 2: next meeting's draft agenda PDF -> AI Gateway file input (no PDF library).
// Both phases feed one combined array POSTed to import-agenda-items, which owns
// the upsert/reconciliation logic.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-token",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const CIUR = "https://datahub.austintexas.gov/resource/sich-49ay.json";
const VOTES = "https://data.austintexas.gov/resource/3c89-i35a.json";
const CORE_DEPTS = ["Austin Climate Action & Resilience", "Austin Energy"];
const ZONING_CASE = /\b(?:C14|C15|C8|SP|PSP|NPA)-\d{4}[.-]\d+/;
const MAX_PDF_BYTES = 8 * 1024 * 1024;
const CLASSIFY_BATCH = 25;

// Reused verbatim from this project's existing classifier so judgments stay
// consistent across the app.
const SYSTEM_PROMPT =
  'You label Austin City Council agenda items for a climate/energy decisions tracker. For EVERY item given, return JSON {"items":[{item_number, is_climate(bool), topic, significance, summary}]}. is_climate = true if the item substantively concerns energy, electricity/utility, climate, emissions, transportation electrification, water, land use with climate bearing, or sustainability; else false. topic is one word-ish: generation|storage|renewable|efficiency|transport|emissions|land_use|water|climate_policy|other. significance distinguishes actual policy DECISIONS from routine operational business. CRITICAL: the department does NOT determine significance. A contract for Austin Energy or Austin Water is NOT significant just because it is energy/water-related. Judge the NATURE of the action, and ignore dollar size. \'routine\' (most items) = operational business: any contract/amendment/renewal for maintenance, repair, equipment, parts, pumps, supplies, chemicals, monitoring, software, IT, professional/engineering/construction services, insurance, easements, service extensions, revenue-bond issuance for ongoing capital programs, and individual rezoning/zoning/site cases (identifiable by a case number like C14-, C15-, C8-, SP-, PSP-, or NPA- followed by a year and number -- these are always routine regardless of topic, they are case-by-case zoning actions, not policy). Examples that are ROUTINE: \'replace condenser water pumps\', \'SCADA maintenance\', \'meter testing\', an individual property rezoning case. \'major\' = a genuine policy decision: adopt/amend a plan, ordinance, or City Code; set rates; grant a franchise; or newly commit to acquire/build ENERGY RESOURCES. \'notable\' = rare in-between only. When unsure, choose routine. summary: <=22 words, plain language, what the item does. Keep every item; do not drop any.';

// ---------- helpers ----------

const collapse = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();
const ymd = (d: string) => d.slice(0, 10).replace(/-/g, "");
const pad3 = (n: unknown) => String(n ?? "").trim().padStart(3, "0");

function toArray(s: unknown): string[] | null {
  const parts = String(s ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

function parseJsonLoose(text: string): any {
  const cleaned = String(text ?? "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  if (!cleaned) return null;
  return JSON.parse(cleaned);
}

async function validateAdminToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return false;
  try {
    const res = await fetch(`${url}/functions/v1/admin-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${anon}` },
      body: JSON.stringify({ action: "validate", token }),
    });
    const result = await res.json();
    return result.valid === true;
  } catch (err) {
    console.error("admin token validation failed", err);
    return false;
  }
}

async function callGateway(content: unknown[], apiKey: string): Promise<any> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${raw.slice(0, 300)}`);
  const payload = JSON.parse(raw);
  return parseJsonLoose(payload.choices?.[0]?.message?.content ?? "");
}

// ---------- phase 1: CIUR history ----------

interface Classified {
  is_climate: boolean;
  topic: string | null;
  significance: string | null;
  summary: string | null;
}

async function classifyRows(rows: any[], apiKey: string): Promise<Map<string, Classified>> {
  const out = new Map<string, Classified>();
  for (let i = 0; i < rows.length; i += CLASSIFY_BATCH) {
    const batch = rows.slice(i, i + CLASSIFY_BATCH);
    const payload = batch.map((r) => ({
      item_number: String(r.item_number ?? ""),
      lead_dept: r.lead_dept ?? null,
      posting_language: collapse(r.posting_language).slice(0, 1200),
    }));
    try {
      const parsed = await callGateway(
        [
          { type: "text", text: SYSTEM_PROMPT },
          { type: "text", text: `Items:\n${JSON.stringify(payload)}` },
        ],
        apiKey,
      );
      for (const it of parsed?.items ?? []) {
        out.set(String(it.item_number ?? "").trim(), {
          is_climate: it.is_climate === true,
          topic: it.topic ? String(it.topic) : null,
          significance: it.significance ? String(it.significance) : null,
          summary: it.summary ? collapse(it.summary) : null,
        });
      }
    } catch (err) {
      console.error("classification batch failed", err);
    }
  }
  return out;
}

async function fetchVoteOutcomes(years: number[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const year of years) {
    const where =
      `meeting_date>='${year}-01-01' AND meeting_date<'${year + 1}-01-01'`;
    const url =
      `${VOTES}?$select=meeting_date,meeting_item_number,item_id,voter_name,vote_cast,action_taken` +
      `&$where=${encodeURIComponent(where)}&$limit=50000`;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`SODA ${res.status}`);
      for (const r of await res.json()) {
        const num = Number(r.meeting_item_number);
        if (!r.meeting_date || !Number.isFinite(num)) continue;
        const key = `${ymd(r.meeting_date)}-${num}`;
        if (r.action_taken && !map.has(key)) map.set(key, String(r.action_taken));
      }
    } catch (err) {
      console.error(`vote fetch failed for ${year}`, err);
    }
  }
  return map;
}

async function runHistory(lookbackDays: number, apiKey: string) {
  const since = new Date(Date.now() - lookbackDays * 86400_000)
    .toISOString()
    .slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const url = `${CIUR}?$where=${encodeURIComponent(`agenda_date>='${since}'`)}&$limit=5000`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`CIUR fetch failed: ${res.status}`);

  const raw: any[] = await res.json();
  const rows = raw.filter(
    (r) =>
      r &&
      r.request_number !== "test" &&
      r.agenda_date &&
      String(r.agenda_date).slice(0, 10) <= today &&
      r.item_number,
  );

  const classified = await classifyRows(rows, apiKey);

  const kept = rows
    .map((r) => ({ r, c: classified.get(String(r.item_number ?? "").trim()) }))
    // The model is not self-consistent between is_climate and significance, so a
    // routine operational item can still come back is_climate:true. Require both.
    .filter(({ c }) => c?.is_climate === true && c?.significance !== "routine")
    .map(({ r, c }) => {
      const deptText = `${r.lead_dept ?? ""} ${r.sub_depts ?? ""}`;
      const isCore = CORE_DEPTS.some((d) => deptText.includes(d));
      return { r, c, visible: isCore };
    });


  const years = [
    ...new Set(kept.map(({ r }) => Number(String(r.agenda_date).slice(0, 4)))),
  ].filter((y) => Number.isFinite(y));
  const outcomes = await fetchVoteOutcomes(years);

  const items = kept.map(({ r, c, visible }) => {
    const meetingDate = String(r.agenda_date).slice(0, 10);
    const itemNumber = pad3(r.item_number);
    const description = collapse(r.posting_language);
    const voteKey = `${ymd(meetingDate)}-${Number(r.item_number)}`;
    return {
      id: `${ymd(meetingDate)}-${itemNumber}`,
      meeting_date: meetingDate,
      meeting_year: Number(meetingDate.slice(0, 4)),
      item_number: itemNumber,
      body: "Austin City Council",
      title: c?.summary || description,
      description,
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
      // CIUR's own `status` is staff implementation progress, not a vote result.
      outcome: outcomes.get(voteKey) ?? "approved",
      decided_at: meetingDate,
      visible,
    };
  });

  return {
    items,
    stats: {
      fetched: rows.length,
      classified_climate: [...classified.values()].filter((c) => c.is_climate).length,
      visible: items.filter((i) => i.visible).length,
      hidden: items.filter((i) => !i.visible).length,
    },
  };
}

// ---------- phase 2: upcoming draft agenda PDF ----------

async function findNextDraftAgenda() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  // Walk to the next Thursday (day 4), then weekly.
  const d = new Date(start);
  d.setUTCDate(d.getUTCDate() + ((4 - d.getUTCDay() + 7) % 7));

  for (let week = 0; week < 5; week++) {
    const date = new Date(d);
    date.setUTCDate(d.getUTCDate() + week * 7);
    const iso = date.toISOString().slice(0, 10);
    const y = iso.slice(0, 4);
    const stamp = ymd(iso);
    const candidates = [
      `https://www.austintexas.gov/council/${y}/${stamp}-reg`,
      `https://www.austintexas.gov/department/city-council/${y}/${stamp}-reg.htm`,
    ];
    for (const pageUrl of candidates) {
      let html = "";
      try {
        const res = await fetch(pageUrl);
        if (!res.ok) continue;
        html = await res.text();
      } catch {
        continue;
      }
      const anchors = html.matchAll(
        /<a\b[^>]*href=["'][^"']*document\.cfm\?id=(\d+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
      );
      for (const m of anchors) {
        const label = m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        if (/draft agenda/i.test(label)) {
          return { meetingDate: iso, docId: m[1], pageUrl };
        }
      }
    }
  }
  return null;
}

// The model's item-boundary detection fails on multi-page PDFs: it can emit the
// same item twice, once clean and once with the next item's text plus a page
// footer bled onto the end. When one item's text is a prefix of another's
// (>=80 identical leading chars), the longer one is the corrupted copy.
const PREFIX_LEN = 80;

function dropBledDuplicates(items: any[]): any[] {
  const texts = items.map((it) => collapse(it?.posting_language));
  const drop = new Set<number>();
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const short = texts[i];
      const long = texts[j];
      if (short.length < PREFIX_LEN || long.length <= short.length) continue;
      if (long.startsWith(short)) drop.add(j);
    }
  }
  return items.filter((_, i) => !drop.has(i));
}

async function runUpcoming(apiKey: string) {

  const found = await findNextDraftAgenda();
  if (!found) return { items: [], info: { found: false } as Record<string, unknown> };

  const pdfRes = await fetch(
    `https://services.austintexas.gov/edims/document.cfm?id=${found.docId}`,
  );
  if (!pdfRes.ok) throw new Error(`Draft agenda PDF fetch failed: ${pdfRes.status}`);
  const bytes = new Uint8Array(await pdfRes.arrayBuffer());
  if (bytes.byteLength > MAX_PDF_BYTES) {
    throw new Error(
      `Draft agenda PDF too large (${Math.round(bytes.byteLength / 1024 / 1024)} MB, max 8 MB).`,
    );
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  const base64 = btoa(binary);

  const prompt = SYSTEM_PROMPT.replace(
    "For EVERY item given",
    "For every item in this agenda PDF",
  ).replace(
    '{"items":[{item_number, is_climate(bool), topic, significance, summary}]}',
    '{"items":[{item_number, posting_language, is_climate(bool), topic, significance, summary}]}',
  );

  const parsed = await callGateway(
    [
      {
        type: "file",
        file: {
          filename: "draft-agenda.pdf",
          file_data: `data:application/pdf;base64,${base64}`,
        },
      },
      {
        type: "text",
        text:
          `${prompt}\n\nReturn one object for EVERY numbered agenda item in this PDF. ` +
          `posting_language must be the exact verbatim text of the item as it appears, including any case number.`,
      },
    ],
    apiKey,
  );

  const raw = Array.isArray(parsed?.items) ? parsed.items : [];
  const meetingDate = found.meetingDate;

  const items = dropBledDuplicates(raw.filter((it: any) => it && it.item_number != null))
    // Enforced in code: the model does not reliably self-apply the zoning-case rule.
    .filter((it: any) => !ZONING_CASE.test(String(it.posting_language ?? "")))
    // is_climate alone is not enough: the model marks routine items climate too.
    .filter((it: any) => it.is_climate === true && it.significance !== "routine")

    .map((it: any) => {
      const description = collapse(it.posting_language);
      const itemNumber = pad3(it.item_number);
      return {
        id: `${ymd(meetingDate)}-${itemNumber}`,
        meeting_date: meetingDate,
        meeting_year: Number(meetingDate.slice(0, 4)),
        item_number: itemNumber,
        body: "Austin City Council",
        title: it.summary ? collapse(it.summary) : description.slice(0, 200),
        description,
        topic: it.topic ? String(it.topic) : null,
        significance: it.significance ? String(it.significance) : null,
        is_climate: true,
        status: "open",
        source_url: found.pageUrl,
        visible: true,
      };
    });

  return {
    items,
    info: { found: true, meeting_date: meetingDate, items_found: items.length },
  };
}

// ---------- handler ----------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  if (!(await validateAdminToken(req.headers.get("x-admin-token")))) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  let body: { lookback_days?: number } = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  const lookbackDays =
    typeof body.lookback_days === "number" && body.lookback_days > 0
      ? Math.floor(body.lookback_days)
      : 183;

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json(500, { ok: false, error: "LOVABLE_API_KEY not configured" });
    const secret = Deno.env.get("SOLAR_IMPORT_SECRET");
    if (!secret) return json(500, { ok: false, error: "SOLAR_IMPORT_SECRET not configured" });

    const history = await runHistory(lookbackDays, apiKey);

    // A PDF-phase failure must not lose the history results.
    let upcoming: { items: any[]; info: Record<string, unknown> };
    try {
      upcoming = await runUpcoming(apiKey);
    } catch (err) {
      console.error("upcoming phase failed", err);
      upcoming = { items: [], info: { found: false, error: String(err) } };
    }

    const items = [...history.items, ...upcoming.items];

    if (items.length) {
      const res = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/import-agenda-items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sync-secret": secret,
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({ items }),
        },
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result?.ok !== true) {
        throw new Error(`import-agenda-items failed: ${result?.error ?? res.status}`);
      }
    }

    // Record successful sync metadata so the admin page can show last-run time.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceRole) {
      const supabase = createClient(supabaseUrl, serviceRole);
      const { error: statsError } = await supabase
        .from("cached_stats")
        .upsert(
          {
            stat_type: "agenda_sync_last_run",
            value: JSON.stringify({ history: history.stats, upcoming: upcoming.info }),
            label: "Last agenda items sync",
          },
          { onConflict: "stat_type" },
        );
      if (statsError) {
        console.error("failed to record agenda sync stats", statsError);
      }
    }

    return json(200, { ok: true, history: history.stats, upcoming: upcoming.info });
  } catch (err) {
    console.error("sync-agenda-items error", err);
    return json(500, { ok: false, error: String(err) });
  }
});
