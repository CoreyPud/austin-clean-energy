import { test } from "node:test";
import assert from "node:assert/strict";
import { IDEA_LEVELS, describeIdea, detailsFromDescription, ideaDetailsSchema, filterAndSortIdeas, hotIdeas, ideaSchema, ideaDisplayDate, nextVote, type CleanCanvasIdea } from "./model.ts";

const validIdea = {
  title: "Shade bus stops with solar canopies",
  description: "Install solar canopies at busy bus stops to provide shade and power lighting.",
  topics: ["Energy supply"],
  author_name: "Austin Neighbor",
  resources: [{ label: "Capital Metro", url: "https://www.capmetro.org/" }],
} as const;

function idea(patch: Partial<CleanCanvasIdea>): CleanCanvasIdea {
  return {
    id: "one",
    author_id: "author",
    author_name: "Neighbor",
    title: "First idea",
    description: "A sufficiently detailed community idea.",
    topic: "Other",
    topics: ["Other"],
    examples_elsewhere: "",
    resources: [],
    support_count: 0,
    oppose_count: 0,
    comment_count: 0,
    visible: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    edit_count: 0,
    edited_at: null,
    ...patch,
  };
}

test("idea submissions accept supporting HTTPS resources", () => {
  const result = ideaSchema.safeParse(validIdea);
  assert.equal(result.success, true);
});

test("idea date uses the latest authored edit, not vote or comment activity", () => {
  const original = idea({ updated_at: "2026-11-13T12:55:00Z" });
  assert.equal(ideaDisplayDate(original), "2026-01-01T00:00:00Z");
  assert.equal(ideaDisplayDate(idea({ edit_count: 2, edited_at: "2026-11-13T12:50:00Z", updated_at: "2026-11-13T12:55:00Z" })), "2026-11-13T12:50:00Z");
});

test("four idea answers survive storage and reading back independently", () => {
  const details = ideaDetailsSchema.parse({ problem: "Unshaded stops", solution: "Solar canopies", beneficiaries: "Bus riders", tradeoffs: "Installation costs", level: "local" });
  const description = ideaSchema.parse({ ...validIdea, description: describeIdea(details) }).description;
  assert.deepEqual(detailsFromDescription(description), details);
  for (const field of ["problem", "solution", "beneficiaries", "tradeoffs"]) {
    assert.equal(ideaDetailsSchema.safeParse({ ...details, [field]: " " }).success, false);
  }
});

test("idea levels map Austin to Local, Texas to State and United States to Federal", () => {
  assert.deepEqual(IDEA_LEVELS, [{ value: "local", label: "Local — Austin" }, { value: "state", label: "State — Texas" }, { value: "federal", label: "Federal — United States" }]);
  for (const level of ["local", "state", "federal"]) {
    const parsed = ideaDetailsSchema.parse({ problem: "Problem", solution: "Solution", beneficiaries: "Residents", tradeoffs: "None known", level });
    assert.equal(detailsFromDescription(describeIdea(parsed)).level, level);
  }
  assert.equal(ideaDetailsSchema.safeParse({ problem: "Problem", solution: "Solution", beneficiaries: "Residents", tradeoffs: "None", level: "global" }).success, false);
});

test("existing free-text ideas remain unchanged and are not assigned a scope", () => {
  assert.deepEqual(detailsFromDescription(validIdea.description), { problem: validIdea.description });
});

test("supporting resources reject non-web links and more than five links", () => {
  assert.equal(ideaSchema.safeParse({ ...validIdea, resources: [{ label: "Bad", url: "javascript:alert(1)" }] }).success, false);
  const six = Array.from({ length: 6 }, (_, index) => ({ label: `Source ${index}`, url: `https://example.com/${index}` }));
  assert.equal(ideaSchema.safeParse({ ...validIdea, resources: six }).success, false);
});

test("idea search checks titles and resource labels, with net support as the default rank", () => {
  const ideas = [
    idea({ id: "solar", title: "Solar libraries", support_count: 4, oppose_count: 1 }),
    idea({ id: "transit", title: "Better buses", support_count: 8, oppose_count: 0, resources: [{ label: "CapMetro plan", url: "https://example.com" }] }),
    idea({ id: "trees", title: "More trees", support_count: 2, oppose_count: 2 }),
  ];
  assert.deepEqual(filterAndSortIdeas(ideas, { query: "", topic: "", sort: "supported" }).map((i) => i.id), ["transit", "solar", "trees"]);
  assert.deepEqual(filterAndSortIdeas(ideas, { query: "capmetro", topic: "", sort: "supported" }).map((i) => i.id), ["transit"]);
});

test("a person can change a vote or withdraw it by selecting it again", () => {
  assert.equal(nextVote(null, "support"), "support");
  assert.equal(nextVote("support", "oppose"), "oppose");
  assert.equal(nextVote("oppose", "oppose"), null);
});

test("ideas accept multiple topics including Policy, strategy, personnel", () => {
  const parsed = ideaSchema.parse({ ...validIdea, topics: ["Energy supply", "Policy, strategy, personnel"] });
  assert.deepEqual(parsed.topics, ["Energy supply", "Policy, strategy, personnel"]);
  assert.equal(ideaSchema.safeParse({ ...validIdea, topics: [] }).success, false);
  assert.equal(ideaSchema.safeParse({ ...validIdea, topics: ["Unknown"] }).success, false);
});

test("topic filters match any selected topic", () => {
  const row = idea({ topics: ["Energy supply", "Policy, strategy, personnel"] });
  assert.deepEqual(filterAndSortIdeas([row], { query: "", topic: "Policy, strategy, personnel", sort: "newest" }).map((i) => i.id), ["one"]);
  assert.equal(filterAndSortIdeas([row], { query: "", topic: "Transportation", sort: "newest" }).length, 0);
});

test("examples elsewhere are preserved and searchable", () => {
  const parsed = ideaSchema.parse({ ...validIdea, examples_elsewhere: "  Copenhagen district heating  " });
  assert.equal(parsed.examples_elsewhere, "Copenhagen district heating");
  assert.equal(filterAndSortIdeas([idea({ examples_elsewhere: parsed.examples_elsewhere })], { query: "Copenhagen", topic: "", sort: "newest" }).length, 1);
  assert.equal(ideaSchema.parse(validIdea).examples_elsewhere, "");
});

test("hot topics shows the five highest support counts, not net support", () => {
  const rows = Array.from({ length: 7 }, (_, i) => idea({ id: String(i), support_count: i, oppose_count: i * 10 }));
  assert.deepEqual(hotIdeas(rows, "support").map((i) => i.id), ["6", "5", "4", "3", "2"]);
});
test("hot topics shows the five highest oppose counts and excludes hidden or unvoted ideas", () => {
  const rows = Array.from({ length: 7 }, (_, i) => idea({ id: String(i), oppose_count: i }));
  assert.deepEqual(hotIdeas([...rows, idea({ id: "hidden", visible: false, oppose_count: 99 })], "oppose").map((i) => i.id), ["6", "5", "4", "3", "2"]);
  assert.deepEqual(hotIdeas([idea({})], "support"), []);
});
