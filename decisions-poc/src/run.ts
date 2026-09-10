// Orchestrator — sources -> extract -> harvest facts -> LLM classify -> validate ->
// resolve -> write local JSON dataset. No Supabase; output is decisions-poc/data/.
import { writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { Decision, RawItem, RunMeta, SourceDoc } from "./schema.js";
import { discoverDocs } from "./sources.js";
import { extractEdimsText } from "./extract.js";
import { harvestFacts } from "./deterministic.js";
import { extractDecisionItems } from "./classify.js";
import { toRawItems } from "./validate.js";
import { resolveDecisions } from "./resolve.js";
import { llmModel, getTotalUsage } from "./llm.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "..", "data");
const decisionsDir = resolve(dataDir, "decisions");

const YEAR = process.env.YEAR ?? "2026";

async function main() {
  console.log(`Discovering ${YEAR} commission documents…`);
  const docs: SourceDoc[] = await discoverDocs(YEAR);
  console.log(`  found ${docs.length} agenda/minutes docs across configured boards`);
  const docMap = new Map(docs.map((d) => [d.docId, d]));
  const allRaw: RawItem[] = [];
  const reviewQueue: RunMeta["reviewQueue"] = [];

  for (const doc of docs) {
    process.stdout.write(`\n· ${doc.docType} ${doc.body} ${doc.meetingDate} (${doc.edimsId}) … `);
    const text = await extractEdimsText(doc.edimsId!);
    const facts = harvestFacts(text);
    const llmItems = await extractDecisionItems(`${doc.docType} — ${doc.body}, ${doc.meetingDate}`, text);
    const { items, review } = toRawItems(doc, llmItems, facts);
    allRaw.push(...items);
    reviewQueue.push(...review);
    process.stdout.write(
      `${items.length} climate/energy items (${facts.dollarAmounts.length} $ facts, ${facts.tallies.length} tallies)`,
    );
  }

  const decisions = resolveDecisions(allRaw, docMap);

  // --- write output (clear prior run so the dataset reflects only this run) ---
  rmSync(decisionsDir, { recursive: true, force: true });
  mkdirSync(decisionsDir, { recursive: true });
  const usedIds = new Map<string, number>(); // disambiguate colliding slugs so none are lost
  for (const d of decisions) {
    const n = (usedIds.get(d.id) ?? 0) + 1;
    usedIds.set(d.id, n);
    if (n > 1) d.id = `${d.id}-${n}`;
    writeFileSync(resolve(decisionsDir, `${d.id}.json`), JSON.stringify(d, null, 2), "utf8");
  }
  writeFileSync(
    resolve(dataDir, "decisions.ndjson"),
    decisions.map((d) => JSON.stringify(d)).join("\n") + "\n",
    "utf8",
  );

  const meta: RunMeta = {
    generatedAt: new Date().toISOString(),
    llmModel,
    counts: {
      documents: docs.length,
      rawItems: allRaw.length,
      decisions: decisions.length,
      climateDecisions: decisions.filter((d) => d.isClimate).length,
    },
    reviewQueue,
  };
  writeFileSync(resolve(dataDir, "_meta.json"), JSON.stringify(meta, null, 2), "utf8");

  // --- console summary ---
  const usage = getTotalUsage();
  console.log("\n\n=== decisions ===");
  for (const d of decisions) {
    const v = d.votes.map((x) => `${x.body.split(" ").slice(-2).join(" ")} ${x.tally ?? x.result}`).join("; ");
    console.log(
      `  • [${d.topic}] ${d.title.slice(0, 62)}\n      $${d.dollarAmount ?? "—"} | votes: ${v || "—"} | ${d.verification}${d.flags.length ? " | flags: " + d.flags.join(",") : ""}`,
    );
  }
  console.log(
    `\nwrote ${decisions.length} decisions (${meta.counts.climateDecisions} climate) from ${allRaw.length} raw items → data/`,
  );
  console.log(`review queue: ${reviewQueue.length} | tokens: ${usage.promptTokens}+${usage.completionTokens} (${llmModel})`);
}

main().catch((e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});
