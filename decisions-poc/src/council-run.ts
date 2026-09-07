// Council decisions extractor — the complete register.
// minutes (all-item outcomes + snippets) + voting record (per-member votes) +
// closed-session detection/matching + LLM climate classification → data/council/*.
// Hidden decisions are not a separate output — they're records with
// decidedInClosedSession=true. RCA detail enrichment is a planned next layer.
import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { CouncilDecision, SourceRef } from "./schema.js";
import { discoverCouncilMeetings } from "./council-sources.js";
import { extractEdimsText, edimsUrl } from "./extract.js";
import { parseMinutes, type MinuteItem } from "./minutes.js";
import { classifyMeetingItems } from "./classify-council.js";
import { loadVotes, voteKey } from "./voting.js";
import { llmModel, getTotalUsage } from "./llm.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "..", "data", "council");
const dataDir = resolve(here, "..", "data");
const publicDataDir = resolve(here, "..", "..", "public", "data"); // site consumes this
const YEARS = (process.env.YEARS ?? "2026").split(",").map((s) => s.trim());
const THROUGH = Number(process.env.THROUGH_MONTH ?? "12"); // discover skips meetings without posted minutes

const STOP = new Set("the and for with from into that this approve authorize authorizing execution negotiation amount not exceed austin city contract agreement term year funding available operating budget resolution ordinance an of to a on".split(" "));
const toks = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)));
const overlap = (a: Set<string>, b: Set<string>) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n; };

// Deterministic demotion: obvious operational procurement is routine even if the LLM
// over-elevated it — unless the item carries a clear policy verb. Keeps the "major"
// view clean; nothing is dropped (routine is still stored, just filtered by default).
const ROUTINE_RE = /\b(construction services|engineering services|professional services|design services|eminent domain|revenue bond|bond issuance|maintenance|repair|spare parts|supplies|equipment purchase|service extension request|easement|insurance|as-needed|interlocal agreement)\b/i;
const POLICY_RE = /\b(direct(?:ing)? the city manager|resolution (?:establishing|directing|creating|initiating)|adopt|amend(?:ing)? (?:the )?city code|rate (?:increase|change|review)|power purchase|battery storage|storage agreement|franchise|strategic plan|comprehensive plan|climate)\b/i;
const looksRoutine = (text: string) => ROUTINE_RE.test(text) && !POLICY_RE.test(text);

// Plain-language "what actually happened" — synthesized from structured fields, so a
// closed-session item reads as "approved in executive session" rather than just "withdrawn".
function resultSynopsis(d: {
  outcome: string; decidedInClosedSession: boolean;
  closedSession: { itemNumber: string; statutes: string[] } | null;
  vote: { recorded: boolean; tally: string | null; dissenters: string[] };
}): string {
  if (d.decidedInClosedSession && d.closedSession) {
    return `Approved in executive session (item ${d.closedSession.itemNumber}, §${d.closedSession.statutes.join(", ")}); ` +
      `the public item was withdrawn from the open agenda. Cost and terms sealed as competitive information.`;
  }
  const tally = d.vote.recorded && d.vote.tally ? ` ${d.vote.tally}` : "";
  const opposed = d.vote.dissenters.length ? ` — ${d.vote.dissenters.join(", ")} opposed` : "";
  switch (d.outcome) {
    case "approved": return `Approved${tally}${opposed}.`;
    case "approved_on_consent": return `Approved on the consent agenda${tally}${opposed}.`;
    case "conducted_and_approved": return `Approved in executive session.`;
    case "postponed": return `Postponed — no decision yet.`;
    case "withdrawn": return `Withdrawn from the agenda — no action taken.`;
    case "failed": return `Failed${tally}.`;
    case "no_action": return `No action taken.`;
    default: return d.outcome.replace(/_/g, " ");
  }
}

async function main() {
  const all: CouncilDecision[] = [];
  let meetingCount = 0;
  for (const year of YEARS) {
   console.log(`Discovering ${year} council meetings…`);
   const meetings = await discoverCouncilMeetings(Number(year), THROUGH);
   console.log(`  ${meetings.length} meetings with posted minutes`);
   const votes = await loadVotes(year);
   meetingCount += meetings.length;
   for (const mtg of meetings) {
    let items: MinuteItem[];
    try {
      items = parseMinutes(await extractEdimsText(mtg.minutesId));
    } catch (e) {
      console.log(`  ! ${mtg.date}: minutes parse failed (${(e as Error).message})`);
      continue;
    }
    if (!items.length) continue;
    const cls = await classifyMeetingItems(`Austin City Council, ${mtg.date}`, items);

    const pub = items.filter((i) => !i.isExec);
    const execApproved = items.filter((i) => i.isExec && i.outcome === "conducted_and_approved");
    // match each closed-session approval to the withdrawn public item it replaced
    const closedFor = new Map<string, MinuteItem>(); // publicItemNo -> exec item
    for (const ex of execApproved) {
      const et = toks(ex.description);
      const cand = pub
        .filter((p) => p.outcome === "withdrawn")
        .map((p) => ({ p, score: overlap(et, toks(p.description)) }))
        .sort((a, b) => b.score - a.score)[0];
      if (cand && cand.score > 0) closedFor.set(cand.p.itemNumber, ex);
    }

    const minUrl = edimsUrl(mtg.minutesId);
    for (const it of pub) {
      const c = cls.get(it.itemNumber);
      const ex = closedFor.get(it.itemNumber) ?? null;
      const vr = votes.get(voteKey(mtg.ymd, it.itemNumber));

      const refs: SourceRef[] = [{
        docType: "council_minutes", edimsId: mtg.minutesId, url: minUrl,
        locator: `item ${it.itemNumber}`, quote: it.dispositionQuote || it.description,
      }];
      if (vr) refs.push({
        docType: "socrata_vote", url: "https://data.austintexas.gov/resource/3c89-i35a.json",
        locator: `${mtg.ymd} item ${it.itemNumber}`, quote: `${vr.tally ?? "?"} — ${vr.actionTaken}`,
      });
      if (ex) refs.push({
        docType: "council_minutes", edimsId: mtg.minutesId, url: minUrl,
        locator: `item ${ex.itemNumber} (executive session)`, quote: ex.dispositionQuote,
      });

      const recorded = !!(vr || it.tally);
      const dissenters = vr ? vr.perMember.filter((v) => /^no$/i.test(v.vote)).map((v) => v.name) : it.dissenters;
      // significance: LLM's call, with guardrails so important items can't be filtered away
      let significance: "major" | "notable" | "routine" = c?.significance ?? "routine";
      if (!ex && dissenters.length === 0 && looksRoutine(it.description)) significance = "routine"; // demote obvious procurement
      if (ex) significance = "major"; // an executive-session action is never routine
      else if (dissenters.length > 0 && significance === "routine") significance = "notable"; // contested never routine
      const result = resultSynopsis({
        outcome: it.outcome, decidedInClosedSession: !!ex,
        closedSession: ex ? { itemNumber: ex.itemNumber, statutes: ex.statutes } : null,
        vote: { recorded, tally: vr?.tally ?? it.tally ?? null, dissenters },
      });
      all.push({
        id: `${mtg.ymd}-${it.itemNumber.padStart(3, "0")}`,
        meetingDate: mtg.date, itemNumber: it.itemNumber, body: "Austin City Council",
        // title = the clean LLM summary (short, complete); full posting language goes in summary (untruncated)
        title: c?.summary || it.description || `Item ${it.itemNumber}`,
        topic: c?.topic ?? "other", isClimate: c?.is_climate ?? false, significance,
        summary: it.description,
        outcome: it.outcome,
        result,
        decidedInClosedSession: !!ex,
        closedSession: ex ? { itemNumber: ex.itemNumber, statutes: ex.statutes, disposition: ex.dispositionQuote } : null,
        vote: {
          recorded,
          tally: vr?.tally ?? it.tally ?? null,
          dissenters,
          reason: recorded ? undefined : ex ? "executive_session" : it.outcome,
          _source: vr ? "regex" : "regex",
          _verified: recorded,
        },
        detail: {}, // RCA enrichment = next layer
        verification: ex ? "sealed" : "official",
        flags: ex ? ["approved_in_executive_session"] : [],
        references: refs,
      });
    }
   }
  }

  // --- merge with already-processed years so we never re-pull them ---
  const ndjsonPath = resolve(dataDir, "council.ndjson");
  let merged = all;
  if (existsSync(ndjsonPath)) {
    const prior = readFileSync(ndjsonPath, "utf8").trim().split("\n").filter(Boolean)
      .map((l) => JSON.parse(l) as CouncilDecision)
      .filter((d) => !YEARS.includes(d.meetingDate.slice(0, 4))); // keep other years untouched
    merged = [...prior, ...all].sort((a, b) => b.meetingDate.localeCompare(a.meetingDate) || Number(a.itemNumber) - Number(b.itemNumber));
    console.log(`  merged: ${all.length} new (${YEARS.join(",")}) + ${prior.length} preserved from prior years`);
  }

  // --- write output (poc data/ + site public/data/) ---
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const climate = merged.filter((d) => d.isClimate);
  for (const d of climate) writeFileSync(resolve(outDir, `${d.id}.json`), JSON.stringify(d, null, 2), "utf8");
  writeFileSync(ndjsonPath, merged.map((d) => JSON.stringify(d)).join("\n") + "\n", "utf8");
  const meta = {
    generatedAt: new Date().toISOString(), llmModel,
    years: [...new Set(merged.map((d) => d.meetingDate.slice(0, 4)))].sort(),
    counts: {
      meetings: new Set(merged.map((d) => d.meetingDate)).size, // distinct dates across all merged years
      decisions: merged.length, climate: climate.length,
      closedSession: merged.filter((d) => d.decidedInClosedSession).length,
    },
  };
  writeFileSync(resolve(dataDir, "council_meta.json"), JSON.stringify(meta, null, 2), "utf8");
  // site payload: full register + meta in one file, fetched from /data/council-decisions.json
  mkdirSync(publicDataDir, { recursive: true });
  writeFileSync(resolve(publicDataDir, "council-decisions.json"),
    JSON.stringify({ meta, decisions: merged }), "utf8");

  const u = getTotalUsage();
  console.log(`\n=== ${merged.length} council decisions (${climate.length} climate) across ${meta.years.join(", ")} ===`);
  for (const d of merged.filter((d) => d.decidedInClosedSession).slice(0, 25)) {
    console.log(`  ${d.meetingDate} item ${d.itemNumber} [${d.topic}] ${d.outcome}${d.decidedInClosedSession ? " (CLOSED §" + d.closedSession!.statutes.join(",") + ")" : ""} — ${d.title.slice(0, 55)}`);
  }
  console.log(`\nclimate files → data/council/ | full register → data/council.ndjson`);
  console.log(`tokens: ${u.promptTokens}+${u.completionTokens} (${llmModel})`);
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
