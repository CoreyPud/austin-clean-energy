// Eval harness — runs the parser against fixture documents and scores per-field
// accuracy vs hand-labeled ground truth. This is the loop for tuning the prompt:
// change the prompt, run `npm run eval`, see which fields regressed.
//
// Fields are scored individually (not exact-JSON match) because LLM output is
// nondeterministic. Exit code is nonzero if anything fails, so it can gate CI.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { SourceDoc } from "./src/schema.js";
import { extractEdimsText, edimsUrl } from "./src/extract.js";
import { harvestFacts } from "./src/deterministic.js";
import { extractDecisionItems } from "./src/classify.js";
import { toRawItems } from "./src/validate.js";

const here = dirname(fileURLToPath(import.meta.url));
const expectedDir = resolve(here, "fixtures", "expected");

interface Expect {
  match: string;
  is_climate?: boolean;
  dollar_amount?: number | null;
  vote_tally?: string | null;
  dissenters?: string[];
}
interface Fixture {
  edimsId: string;
  docType: SourceDoc["docType"];
  body: string;
  meetingDate: string;
  expect: Expect[];
}

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const setEq = (a: string[] = [], b: string[] = []) =>
  eq([...a].sort(), [...b].sort());

async function main() {
  let pass = 0;
  let fail = 0;

  for (const file of readdirSync(expectedDir).filter((f) => f.endsWith(".json"))) {
    const fx = JSON.parse(readFileSync(resolve(expectedDir, file), "utf8")) as Fixture;
    const doc: SourceDoc = {
      docId: `edims:${fx.edimsId}`,
      docType: fx.docType,
      body: fx.body,
      meetingDate: fx.meetingDate,
      edimsId: fx.edimsId,
      url: edimsUrl(fx.edimsId),
    };
    console.log(`\n# ${file}`);
    const text = await extractEdimsText(fx.edimsId);
    const facts = harvestFacts(text);
    const llmItems = await extractDecisionItems(`${fx.docType} — ${fx.body}`, text);
    const { items } = toRawItems(doc, llmItems, facts);

    for (const exp of fx.expect) {
      const hay = (it: (typeof items)[number]) =>
        `${it.title} ${it.summary} ${it.postingLanguage ?? ""}`.toLowerCase();
      const found = items.find((it) => hay(it).includes(exp.match.toLowerCase()));
      if (!found) {
        console.log(`  ✗ [${exp.match}] NOT FOUND among ${items.length} items`);
        fail++;
        continue;
      }
      const checks: [string, boolean][] = [];
      if (exp.is_climate !== undefined) checks.push(["is_climate", found.isClimate === exp.is_climate]);
      if (exp.dollar_amount !== undefined) checks.push(["dollar_amount", found.dollarAmount === exp.dollar_amount]);
      if (exp.vote_tally !== undefined) checks.push(["vote_tally", (found.vote?.tally ?? null) === exp.vote_tally]);
      if (exp.dissenters !== undefined) checks.push(["dissenters", setEq(found.vote?.dissenters, exp.dissenters)]);
      const bad = checks.filter(([, ok]) => !ok);
      if (bad.length === 0) {
        console.log(`  ✓ [${exp.match}] ${checks.map(([k]) => k).join(", ")}`);
        pass += checks.length;
      } else {
        for (const [k, ok] of checks) {
          if (ok) { pass++; continue; }
          fail++;
          const got =
            k === "dollar_amount" ? found.dollarAmount :
            k === "vote_tally" ? found.vote?.tally :
            k === "dissenters" ? found.vote?.dissenters :
            found.isClimate;
          console.log(`  ✗ [${exp.match}] ${k}: got ${JSON.stringify(got)}`);
        }
      }
    }
  }

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error("eval FAILED:", e.message);
  process.exit(1);
});
