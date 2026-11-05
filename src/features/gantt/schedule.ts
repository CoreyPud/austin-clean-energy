import type { GanttTask, ScheduledTask, TemplateTask } from "./types";

const DAY = 86_400_000;

/** Rework/exception rows are contingencies: they never push the tasks that follow them. */
export const isContingency = (t: Pick<GanttTask, "type">) => /rework|exception/i.test(t.type);
export const isMilestone = (t: Pick<GanttTask, "days">) => t.days === 0;

/**
 * Same rule as the spreadsheet: a task starts when its latest predecessor ends (or at project start).
 * A manual start can delay a task but never pull it ahead of its predecessors.
 * Durations are calendar days; fractional days are kept.
 */
export function scheduleTasks(tasks: GanttTask[]): ScheduledTask[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const out = new Map<string, ScheduledTask>();
  const visiting = new Set<string>();
  const visit = (t: GanttTask): ScheduledTask => {
    const done = out.get(t.id);
    if (done) return done;
    visiting.add(t.id);
    let earliest = 0;
    for (const pid of t.preds) {
      const p = byId.get(pid);
      if (!p || visiting.has(pid) || isContingency(p)) continue;
      earliest = Math.max(earliest, visit(p).end);
    }
    visiting.delete(t.id);
    const start = Math.max(earliest, t.manualStart ?? 0);
    const s: ScheduledTask = { ...t, row: 0, earliest, start, end: start + Math.max(0, t.days) };
    out.set(t.id, s);
    return s;
  };
  return tasks.map((t, i) => ({ ...visit(t), row: i + 1 }));
}

/** True when making `predId` a predecessor of `taskId` would create a loop. */
export function wouldCycle(tasks: GanttTask[], taskId: string, predId: string): boolean {
  if (taskId === predId) return true;
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const stack = [predId];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (id === taskId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...(byId.get(id)?.preds ?? []));
  }
  return false;
}

/** Moves a bar. Returns the updated tasks and, when the move was earlier than predecessors allow, a reason. */
export function moveTask(tasks: GanttTask[], taskId: string, newStart: number): { tasks: GanttTask[]; blockedBy?: string } {
  const scheduled = scheduleTasks(tasks).find((t) => t.id === taskId);
  if (!scheduled) return { tasks };
  const clamped = Math.max(0, newStart);
  let blockedBy: string | undefined;
  if (clamped < scheduled.earliest) {
    const sched = scheduleTasks(tasks);
    const blocker = sched.filter((t) => scheduled.preds.includes(t.id) && !isContingency(t)).sort((a, b) => b.end - a.end)[0];
    blockedBy = blocker ? `#${blocker.row} ${blocker.name}` : "project start";
  }
  const manualStart = clamped <= scheduled.earliest ? null : clamped;
  return { tasks: tasks.map((t) => (t.id === taskId ? { ...t, manualStart } : t)), blockedBy };
}

export function newTaskId() {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Inserts a task at an index. Links use stable ids, so displayed row numbers renumber without breaking dependencies. */
export function insertTask(tasks: GanttTask[], index: number, base?: Partial<GanttTask>): GanttTask[] {
  const neighbour = tasks[Math.max(0, index - 1)];
  const task: GanttTask = {
    id: newTaskId(), program: "", mount: "", cost: 0, name: "New task",
    workstream: neighbour?.workstream ?? "", phase: neighbour?.phase ?? "", type: "Task", party: "",
    days: 1, preds: neighbour && index > 0 ? [neighbour.id] : [], links: [], ...base,
  };
  return [...tasks.slice(0, index), task, ...tasks.slice(index)];
}

export function removeTask(tasks: GanttTask[], taskId: string): GanttTask[] {
  const removed = tasks.find((t) => t.id === taskId);
  return tasks.filter((t) => t.id !== taskId).map((t) =>
    t.preds.includes(taskId) ? { ...t, preds: [...new Set([...t.preds.filter((p) => p !== taskId), ...(removed?.preds ?? [])])] } : t);
}

export const fromTemplate = (rows: TemplateTask[]): GanttTask[] => rows.map((r) => ({ ...r, preds: [...r.preds], links: [] }));

export const parseIso = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, (m || 1) - 1, d || 1); };
export const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const dayToIso = (startIso: string, day: number) => toIso(parseIso(startIso) + Math.floor(day + 1e-9) * DAY);
export const isoToDay = (startIso: string, iso: string) => Math.round((parseIso(iso) - parseIso(startIso)) / DAY);
