import { test } from "node:test";
import assert from "node:assert/strict";
import { filterAndSortIdeas, ideaSchema, nextVote, type CleanCanvasIdea } from "./model.ts";

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
    ...patch,
  };
}

test("idea submissions accept supporting HTTPS resources", () => {
  const result = ideaSchema.safeParse(validIdea);
  assert.equal(result.success, true);
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
