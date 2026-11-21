import { test } from "node:test";
import assert from "node:assert/strict";
import { fromTemplate, initialPropertyTasks, insertTask, moveTask, removeTask, scheduleTasks, wouldCycle, dayToIso, filterSchedulesForProperty, scheduleProgress } from "./schedule";
import { PERMIT_TEMPLATE } from "./template";
import type { GanttTask } from "./types";

const t = (id: string, days: number, preds: string[] = [], type = "Task"): GanttTask =>
  ({ id, program: "", mount: "", cost: 0, name: id, workstream: "", phase: "", type, party: "", days, preds, links: [] });

test("a task starts when its latest predecessor ends", () => {
  const s = scheduleTasks([t("a", 2), t("b", 5), t("c", 1, ["a", "b"])]);
  assert.equal(s[2].start, 5);
  assert.equal(s[2].end, 6);
});

test("lengthening a task pushes every dependent task", () => {
  const base = [t("a", 2), t("b", 3, ["a"]), t("c", 1, ["b"])];
  const longer = base.map((x) => (x.id === "a" ? { ...x, days: 10 } : x));
  assert.equal(scheduleTasks(longer)[2].start, 13);
});

test("dragging earlier than predecessors snaps back and names the blocker", () => {
  const r = moveTask([t("a", 4), t("b", 1, ["a"])], "b", 1);
  assert.equal(scheduleTasks(r.tasks)[1].start, 4);
  assert.match(r.blockedBy ?? "", /#1 a/);
});

test("dragging later keeps a manual delay that dependents follow", () => {
  const r = moveTask([t("a", 4), t("b", 1, ["a"]), t("c", 2, ["b"])], "b", 9);
  const s = scheduleTasks(r.tasks);
  assert.equal(s[1].start, 9);
  assert.equal(s[2].start, 10);
});

test("rework/exception rows do not push the schedule", () => {
  const s = scheduleTasks([t("a", 2), t("x", 30, ["a"], "Rework/Exception"), t("b", 1, ["a", "x"])]);
  assert.equal(s[2].start, 2);
});

test("inserting a task renumbers rows but keeps links", () => {
  const base = [t("a", 2), t("b", 3, ["a"])];
  const next = insertTask(base, 1);
  const s = scheduleTasks(next);
  assert.equal(s[2].id, "b");
  assert.equal(s[2].row, 3);
  assert.deepEqual(s[2].preds, ["a"]);
});

test("removing a task hands its predecessors to its dependents", () => {
  const next = removeTask([t("a", 2), t("b", 3, ["a"]), t("c", 1, ["b"])], "b");
  assert.deepEqual(next[1].preds, ["a"]);
});

test("circular links are detected", () => {
  const base = [t("a", 1), t("b", 1, ["a"]), t("c", 1, ["b"])];
  assert.equal(wouldCycle(base, "a", "c"), true);
  assert.equal(wouldCycle(base, "c", "a"), false);
});

test("spreadsheet template has 108 tasks with first start on project start", () => {
  const s = scheduleTasks(fromTemplate(PERMIT_TEMPLATE));
  assert.equal(s.length, 108);
  assert.equal(s[0].start, 0);
  assert.equal(dayToIso("2026-11-10", s[0].start), "2026-11-10");
  assert.ok(s.every((x) => Number.isFinite(x.end)));
});

test("every property automatically gets an independent 108-task permit template", () => {
  const first = initialPropertyTasks(null, PERMIT_TEMPLATE);
  const second = initialPropertyTasks(null, PERMIT_TEMPLATE);
  assert.equal(first.length, 108);
  assert.equal(second.length, 108);
  const originalDays = second[0].days;
  first[0].days = originalDays + 10;
  first[0].preds.push("other-property-task");
  assert.equal(second[0].days, originalDays);
  assert.equal(second[0].preds.includes("other-property-task"), false);
});

test("automatic template loading never overwrites an existing or intentionally blank schedule", () => {
  const saved = [t("saved-task", 23)];
  assert.equal(initialPropertyTasks(saved, PERMIT_TEMPLATE)[0].days, 23);
  assert.deepEqual(initialPropertyTasks([], PERMIT_TEMPLATE), []);
});

test("schedules are strictly filtered to the active property and never leak across properties", () => {
  const all = [
    { id: "s1", saved_assessment_id: "prop-a" },
    { id: "s2", saved_assessment_id: "prop-b" },
    { id: "s3", saved_assessment_id: null },
  ];
  assert.deepEqual(filterSchedulesForProperty(all, "prop-a").map((s) => s.id), ["s1"]);
  assert.deepEqual(filterSchedulesForProperty(all, "prop-b").map((s) => s.id), ["s2"]);
  assert.deepEqual(filterSchedulesForProperty(all, "prop-c").map((s) => s.id), []);
  assert.deepEqual(filterSchedulesForProperty(all, null).map((s) => s.id), ["s3"]);
});

test("scheduleProgress summarizes completion and blocked tasks while ignoring contingency rows", () => {
  const tasks: GanttTask[] = [
    { ...t("a", 2), status: "Done" },
    { ...t("b", 2), status: "In Progress" },
    { ...t("c", 2), status: "Blocked" },
    { ...t("d", 2), status: "To Do" },
    { ...t("x", 10, [], "Rework/Exception"), status: "Blocked" },
  ];
  const p = scheduleProgress(tasks);
  assert.equal(p.overall, 38);
  assert.equal(p.doneCount, 1);
  assert.equal(p.blockedCount, 1);
  assert.equal(p.totalCount, 4);
});
