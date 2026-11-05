import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, ChevronRight, Download, Link2, LogIn, MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSharedProject } from "@/lib/shared-project";
import { cn } from "@/lib/utils";
import { createSchedule, deleteSchedule, getSchedule, listComments, listSchedules, saveSchedule, type ScheduleRow } from "./api";
import { dayToIso, fromTemplate, insertTask, isContingency, isMilestone, moveTask, parseIso, removeTask, scheduleTasks, toIso } from "./schedule";
import { PERMIT_TEMPLATE } from "./template";
import { TaskPanel } from "./TaskPanel";
import type { GanttComment, GanttTask, ScheduledTask } from "./types";

type Scale = "days" | "weeks" | "months";
const DAY_W: Record<Scale, number> = { days: 26, weeks: 12, months: 4 };
const ROW_H = 32;
const HEAD_H = 40;
const DAY = 86_400_000;
const LAST_KEY = "ace-gantt-last-schedule";
const COLORS = ["bg-gantt-1", "bg-gantt-2", "bg-gantt-3", "bg-gantt-4", "bg-gantt-5"];
const colorFor = (ws: string) => { const n = parseInt(ws, 10); return COLORS[((Number.isFinite(n) ? n : ws.length) - 1 + COLORS.length * 10) % COLORS.length]; };

type Row = { kind: "group"; ws: string; count: number } | { kind: "task"; t: ScheduledTask };
type Drag = { id: string; mode: "move" | "resize"; x0: number; start0: number; days0: number; dx: number };

export function GanttWorkspace() {
  const { project } = useSharedProject();
  const [user, setUser] = useState<User | null>(null);
  const [list, setList] = useState<Awaited<ReturnType<typeof listSchedules>>>([]);
  const [sched, setSched] = useState<ScheduleRow | null>(null);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [comments, setComments] = useState<GanttComment[]>([]);
  const [scale, setScale] = useState<Scale>("weeks");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [allCols, setAllCols] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [saving, setSaving] = useState<"idle" | "pending" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(true);
  const dirty = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  const canEdit = !!user;
  const authorName = (user?.user_metadata?.full_name as string | undefined) || (user?.user_metadata?.name as string | undefined) || user?.email || "Unknown";

  const open = useCallback(async (id: string) => {
    const row = await getSchedule(id);
    if (!row) return;
    dirty.current = false;
    setSched(row); setTasks(row.tasks ?? []); setSelected(null);
    window.localStorage.setItem(LAST_KEY, id);
    setComments(await listComments(id));
  }, []);

  const refreshList = useCallback(async () => { const l = await listSchedules(); setList(l); return l; }, []);
  useEffect(() => {
    (async () => {
      try {
        const l = await refreshList();
        const last = window.localStorage.getItem(LAST_KEY);
        const pick = l.find((s) => project.savedId && s.saved_assessment_id === project.savedId) ?? l.find((s) => s.id === last) ?? l[0];
        if (pick) await open(pick.id);
      } catch { toast.error("Could not load schedules"); } finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save of every edit.
  useEffect(() => {
    if (!sched || !dirty.current || !canEdit) return;
    setSaving("pending");
    const h = window.setTimeout(async () => {
      try { await saveSchedule(sched.id, { tasks, start_date: sched.start_date, name: sched.name }); setSaving("saved"); dirty.current = false; }
      catch { setSaving("error"); toast.error("Changes not saved — check you are signed in."); }
    }, 700);
    return () => window.clearTimeout(h);
  }, [tasks, sched, canEdit]);

  const edit = (next: GanttTask[] | ((t: GanttTask[]) => GanttTask[])) => { if (!canEdit) return; dirty.current = true; setTasks(next); };
  const editSched = (patch: Partial<ScheduleRow>) => { if (!canEdit || !sched) return; dirty.current = true; setSched({ ...sched, ...patch }); };

  const scheduled = useMemo(() => scheduleTasks(tasks), [tasks]);
  const byId = useMemo(() => new Map(scheduled.map((t) => [t.id, t])), [scheduled]);
  const startIso = sched?.start_date ?? toIso(Date.now());
  const finish = scheduled.reduce((m, t) => Math.max(m, isContingency(t) ? 0 : t.end), 0);
  const totalCost = tasks.reduce((s, t) => s + (Number(t.cost) || 0), 0);
  const openCounts = useMemo(() => { const m = new Map<string, number>(); comments.forEach((c) => { if (!c.parent_id && !c.resolved) m.set(c.task_id, (m.get(c.task_id) ?? 0) + 1); }); return m; }, [comments]);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    let prev: string | null = null;
    for (const t of scheduled) {
      if (t.workstream !== prev) { out.push({ kind: "group", ws: t.workstream, count: scheduled.filter((x) => x.workstream === t.workstream).length }); prev = t.workstream; }
      if (!collapsed.has(t.workstream)) out.push({ kind: "task", t });
    }
    return out;
  }, [scheduled, collapsed]);
  const rowIndex = useMemo(() => { const m = new Map<string, number>(); rows.forEach((r, i) => r.kind === "task" && m.set(r.t.id, i)); return m; }, [rows]);

  // Timeline starts on the Monday of the project start week, like the spreadsheet.
  const startMs = parseIso(startIso);
  const weekday = (new Date(startMs).getUTCDay() + 6) % 7;
  const offsetDays = weekday;
  const totalDays = Math.max(70, Math.ceil(finish) + offsetDays + 21);
  const dw = DAY_W[scale];
  const width = totalDays * dw;
  const xOf = (day: number) => (day + offsetDays) * dw;
  const todayX = xOf((Date.now() - startMs) / DAY);

  const ticks = useMemo(() => {
    const out: { x: number; label: string }[] = [];
    const base = startMs - offsetDays * DAY;
    for (let d = 0; d < totalDays; d++) {
      const date = new Date(base + d * DAY);
      if (scale === "days") out.push({ x: d * dw, label: `${date.getUTCMonth() + 1}/${date.getUTCDate()}` });
      else if (scale === "weeks" && d % 7 === 0) out.push({ x: d * dw, label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) });
      else if (scale === "months" && date.getUTCDate() === 1) out.push({ x: d * dw, label: date.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }) });
    }
    return out;
  }, [startMs, offsetDays, totalDays, scale, dw]);

  const shownDrag = (t: ScheduledTask) => {
    if (!drag || drag.id !== t.id) return { start: t.start, days: t.days };
    const delta = Math.round(drag.dx / dw * 2) / 2;
    return drag.mode === "move" ? { start: Math.max(0, drag.start0 + delta), days: t.days } : { start: t.start, days: Math.max(0, drag.days0 + delta) };
  };

  const onPointerDown = (t: ScheduledTask, mode: Drag["mode"]) => (e: React.PointerEvent) => {
    if (!canEdit) return;
    e.preventDefault(); e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({ id: t.id, mode, x0: e.clientX, start0: t.start, days0: t.days, dx: 0 });
  };
  const onPointerMove = (e: React.PointerEvent) => { if (drag) setDrag({ ...drag, dx: e.clientX - drag.x0 }); };
  const onPointerUp = () => {
    if (!drag) return;
    const d = drag; setDrag(null);
    const delta = Math.round(d.dx / dw * 2) / 2;
    if (Math.abs(d.dx) < 3) { setSelected(d.id); return; }
    if (!delta) return;
    if (d.mode === "resize") edit((ts) => ts.map((t) => (t.id === d.id ? { ...t, days: Math.max(0, d.days0 + delta) } : t)));
    else moveTo(d.id, d.start0 + delta);
  };
  const moveTo = (id: string, day: number) => {
    const r = moveTask(tasks, id, day);
    if (r.blockedBy) toast.warning(`Can't start earlier — waiting on ${r.blockedBy}.`);
    edit(r.tasks);
  };

  const insertAt = (id: string, where: "above" | "below") => {
    const i = tasks.findIndex((t) => t.id === id);
    const next = insertTask(tasks, where === "above" ? i : i + 1, { workstream: tasks[i].workstream, phase: tasks[i].phase });
    edit(next);
    setSelected(next[where === "above" ? i : i + 1].id);
  };

  const create = async (template: boolean) => {
    if (!canEdit) return;
    const name = window.prompt("Schedule name", project.projectName || project.address || "New solar project");
    if (!name) return;
    try {
      const row = await createSchedule({ name, start_date: toIso(Date.now()), saved_assessment_id: project.savedId, tasks: template ? fromTemplate(PERMIT_TEMPLATE) : insertTask([], 0) });
      await refreshList(); await open(row.id);
    } catch { toast.error("Could not create schedule"); }
  };

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["ID", "Program", "Mount", "Estimated Cost", "Task Name", "Workstream", "Phase", "Type", "Responsible Party", "Estimated Days", "Start Date", "End Date", "Predecessors", "Status", "Links", "Open comments"];
    const lines = scheduled.map((t) => [t.row, t.program, t.mount, t.cost, t.name, t.workstream, t.phase, t.type, t.party, t.days, dayToIso(startIso, t.start), dayToIso(startIso, t.end), t.preds.map((p) => byId.get(p)?.row).filter(Boolean).join(", "), t.status ?? "To Do", t.links.map((l) => `${l.label} <${l.url}>`).join("; "), openCounts.get(t.id) ?? 0].map(esc).join(","));
    const blob = new Blob([[head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${sched?.name ?? "schedule"}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  const signIn = async () => { const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/solar-flow` }); if (r.error) toast.error("Unable to sign in"); };

  const leftCols = allCols
    ? "grid-cols-[40px_70px_60px_70px_minmax(260px,1fr)_150px_120px_100px_150px_60px_92px_92px_70px]"
    : "grid-cols-[40px_minmax(260px,1fr)_130px_60px_92px_92px_70px]";
  const leftW = allCols ? 1400 : 790;

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Loading schedules…</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 border-b border-border bg-background px-4 py-3">
        <div className="space-y-1"><Label className="text-xs">Schedule</Label>
          <Select value={sched?.id ?? ""} onValueChange={(id) => void open(id)}>
            <SelectTrigger className="w-64"><SelectValue placeholder="No schedules yet" /></SelectTrigger>
            <SelectContent>{list.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}{project.savedId && s.saved_assessment_id === project.savedId ? " (this property)" : ""}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {sched && <div className="space-y-1"><Label className="text-xs">Name</Label><Input className="w-56" value={sched.name} disabled={!canEdit} onChange={(e) => editSched({ name: e.target.value })} /></div>}
        {sched && <div className="space-y-1"><Label className="text-xs">Project start date (edit)</Label><Input type="date" className="w-40" value={startIso} disabled={!canEdit} onChange={(e) => e.target.value && editSched({ start_date: e.target.value })} /></div>}
        {sched && <div className="text-xs"><p className="text-muted-foreground">Estimated end date</p><p className="font-mono text-sm font-semibold">{dayToIso(startIso, finish)}</p></div>}
        {sched && <div className="text-xs"><p className="text-muted-foreground">Estimated costs</p><p className="font-mono text-sm font-semibold">${totalCost.toLocaleString()}</p></div>}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canEdit ? <>
            <Button size="sm" onClick={() => void create(true)}><Plus /> New from permit template</Button>
            <Button size="sm" variant="outline" onClick={() => void create(false)}>Blank schedule</Button>
          </> : <Button size="sm" onClick={() => void signIn()}><LogIn /> Sign in to edit & comment</Button>}
          {sched && <Button size="sm" variant="outline" onClick={exportCsv}><Download /> CSV</Button>}
          {sched && canEdit && sched.created_by === user?.id && <Button size="sm" variant="ghost" aria-label="Delete schedule" onClick={async () => { if (!window.confirm(`Delete schedule "${sched.name}" and all its comments?`)) return; await deleteSchedule(sched.id); setSched(null); setTasks([]); const l = await refreshList(); if (l[0]) await open(l[0].id); }}><Trash2 /></Button>}
        </div>
      </div>

      {!sched ? (
        <div className="p-8 text-center text-sm text-muted-foreground">{canEdit ? "Create a schedule from the permit template to get started." : "Sign in to create the first schedule."}</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 px-4 text-xs">
            {(["days", "weeks", "months"] as Scale[]).map((s) => <Button key={s} size="sm" variant={scale === s ? "default" : "outline"} onClick={() => setScale(s)} className="capitalize">{s}</Button>)}
            <Button size="sm" variant="outline" onClick={() => setAllCols((v) => !v)}>{allCols ? "Fewer columns" : "All spreadsheet columns"}</Button>
            <span className="text-muted-foreground">Drag a bar to move it · drag its right edge to change duration · click a row for details, links & comments. ◆ = zero-length milestone/decision.</span>
            <span className="ml-auto text-muted-foreground">{!canEdit ? "View only" : saving === "pending" ? "Saving…" : saving === "saved" ? "All changes saved" : saving === "error" ? "Not saved" : ""}</span>
          </div>

          <div className="relative mx-4 max-h-[75vh] overflow-auto rounded-md border border-border bg-background" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
            <div className="flex" style={{ width: leftW + width }}>
              {/* Task table */}
              <div className="sticky left-0 z-20 shrink-0 border-r border-border bg-background" style={{ width: leftW }}>
                <div className={cn("sticky top-0 z-10 grid items-center gap-2 border-b border-border bg-muted px-2 text-[11px] font-semibold uppercase text-muted-foreground", leftCols)} style={{ height: HEAD_H }}>
                  <span>ID</span>{allCols && <><span>Program</span><span>Mount</span><span>Cost</span></>}<span>Task name</span>{allCols && <><span>Workstream</span><span>Phase</span><span>Type</span></>}<span>Responsible</span><span>Days</span><span>Start</span><span>End</span><span>Pred.</span>
                </div>
                {rows.map((r) => r.kind === "group" ? (
                  <button key={`g-${r.ws}-${rowIndex.size}-${r.count}`} className="flex w-full items-center gap-2 border-b border-border bg-muted/60 px-2 text-left text-xs font-semibold" style={{ height: ROW_H }} onClick={() => setCollapsed((c) => { const n = new Set(c); n.has(r.ws) ? n.delete(r.ws) : n.add(r.ws); return n; })}>
                    {collapsed.has(r.ws) ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}<span className={cn("size-2.5 rounded-full", colorFor(r.ws))} />{r.ws || "No workstream"}<span className="font-normal text-muted-foreground">({r.count})</span>
                  </button>
                ) : (
                  <TaskRow key={r.t.id} t={r.t} cols={leftCols} allCols={allCols} startIso={startIso} canEdit={canEdit} selected={selected === r.t.id} openComments={openCounts.get(r.t.id) ?? 0} predLabel={r.t.preds.map((p) => byId.get(p)?.row).filter(Boolean).join(",")}
                    onSelect={() => setSelected(r.t.id)} onName={(name) => edit((ts) => ts.map((x) => (x.id === r.t.id ? { ...x, name } : x)))} onDays={(days) => edit((ts) => ts.map((x) => (x.id === r.t.id ? { ...x, days } : x)))} onInsert={() => insertAt(r.t.id, "below")} />
                ))}
              </div>

              {/* Timeline */}
              <div className="relative shrink-0" style={{ width, height: HEAD_H + rows.length * ROW_H }}>
                <div className="sticky top-0 z-10 border-b border-border bg-muted" style={{ height: HEAD_H }}>
                  {ticks.map((tk) => <span key={tk.x} className="absolute top-0 h-full border-l border-border pl-1 pt-3 text-[10px] text-muted-foreground" style={{ left: tk.x }}>{tk.label}</span>)}
                </div>
                {ticks.map((tk) => <div key={`l${tk.x}`} className="absolute bottom-0 border-l border-border/50" style={{ left: tk.x, top: HEAD_H }} />)}
                {todayX > 0 && todayX < width && <div className="absolute bottom-0 z-[5] w-px bg-destructive" style={{ left: todayX, top: HEAD_H }} title="Today" />}

                <svg className="pointer-events-none absolute left-0 z-[6] text-muted-foreground" style={{ top: HEAD_H }} width={width} height={rows.length * ROW_H}>
                  <defs><marker id="gantt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="currentColor" /></marker></defs>
                  {scheduled.flatMap((t) => t.preds.map((pid) => {
                    const p = byId.get(pid); const ti = rowIndex.get(t.id); const pi = rowIndex.get(pid);
                    if (!p || ti == null || pi == null) return null;
                    const x1 = xOf(shownDrag(p).start + shownDrag(p).days); const y1 = pi * ROW_H + ROW_H / 2;
                    const x2 = xOf(shownDrag(t).start); const y2 = ti * ROW_H + ROW_H / 2;
                    const mx = Math.max(x1 + 6, Math.min(x2 - 6, x1 + 6));
                    return <path key={`${pid}-${t.id}`} d={`M${x1},${y1} H${mx} V${y2} H${x2 - 1}`} fill="none" stroke="currentColor" strokeOpacity={isContingency(p) ? 0.25 : 0.55} strokeDasharray={isContingency(p) ? "3 3" : undefined} markerEnd="url(#gantt-arrow)" />;
                  }))}
                </svg>

                {rows.map((r, i) => {
                  const top = HEAD_H + i * ROW_H;
                  if (r.kind === "group") return <div key={`gb-${r.ws}-${i}`} className="absolute left-0 right-0 border-b border-border bg-muted/40" style={{ top, height: ROW_H }} />;
                  const t = r.t; const v = shownDrag(t);
                  const left = xOf(v.start);
                  const rework = isContingency(t);
                  const done = t.status === "Done";
                  if (isMilestone({ days: v.days })) return (
                    <div key={t.id} className={cn("absolute z-[7] flex items-center", selected === t.id && "bg-accent/10")} style={{ top, height: ROW_H, left: 0, right: 0 }} onClick={() => setSelected(t.id)}>
                      <button aria-label={`${t.name} milestone`} title={`${t.name} · ${dayToIso(startIso, v.start)}`} onPointerDown={onPointerDown(t, "move")} className={cn("absolute size-3.5 rotate-45 border border-background", rework ? "bg-muted-foreground/40" : colorFor(t.workstream), canEdit && "cursor-grab")} style={{ left: left - 7 }} />
                    </div>
                  );
                  return (
                    <div key={t.id} className={cn("absolute left-0 right-0", selected === t.id && "bg-accent/10")} style={{ top, height: ROW_H }}>
                      <div title={`${t.name}\n${dayToIso(startIso, v.start)} → ${dayToIso(startIso, v.start + v.days)} (${v.days} d)`} onPointerDown={onPointerDown(t, "move")}
                        className={cn("absolute top-1.5 z-[7] flex h-5 items-center overflow-hidden rounded-sm text-[10px] font-medium text-primary-foreground shadow-sm", colorFor(t.workstream), rework && "opacity-40 [background-image:repeating-linear-gradient(45deg,transparent_0_4px,hsl(var(--background)/.4)_4px_8px)]", done && "opacity-60", canEdit && "cursor-grab active:cursor-grabbing", drag?.id === t.id && "ring-2 ring-ring")}
                        style={{ left, width: Math.max(4, v.days * dw) }}>
                        <span className="truncate px-1">{v.days * dw > 40 ? t.name : ""}</span>
                        {canEdit && <span aria-label="Change duration" onPointerDown={onPointerDown(t, "resize")} className="absolute right-0 top-0 h-full w-2 cursor-ew-resize bg-foreground/20" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="px-4 text-xs text-muted-foreground">Durations are calendar days, as in the spreadsheet. Hatched bars are rework/exception paths and don't push later tasks. Edits from two people at once: the last save wins, so refresh before big changes.</p>
        </>
      )}

      {sched && selected && byId.get(selected) && (
        <TaskPanel task={byId.get(selected)!} all={scheduled} startIso={startIso} canEdit={canEdit} scheduleId={sched.id} comments={comments} userId={user?.id ?? null} authorName={authorName}
          onClose={() => setSelected(null)}
          onPatch={(id, patch) => edit((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))}
          onMove={moveTo} onInsert={insertAt}
          onRemove={(id) => { edit((ts) => removeTask(ts, id)); setSelected(null); }}
          onCommentsChanged={async () => setComments(await listComments(sched.id))} />
      )}
    </div>
  );
}

function TaskRow({ t, cols, allCols, startIso, canEdit, selected, openComments, predLabel, onSelect, onName, onDays, onInsert }: {
  t: ScheduledTask; cols: string; allCols: boolean; startIso: string; canEdit: boolean; selected: boolean; openComments: number; predLabel: string;
  onSelect: () => void; onName: (v: string) => void; onDays: (v: number) => void; onInsert: () => void;
}) {
  return (
    <div className={cn("group relative grid cursor-pointer items-center gap-2 border-b border-border px-2 text-xs hover:bg-muted/50", cols, selected && "bg-accent/10", isContingency(t) && "text-muted-foreground")} style={{ height: ROW_H }} onClick={onSelect}>
      <span className="font-mono">{t.row}</span>
      {allCols && <><span className="truncate">{t.program}</span><span className="truncate">{t.mount}</span><span className="font-mono">{t.cost ? `$${t.cost}` : ""}</span></>}
      <span className="flex min-w-0 items-center gap-1">
        {canEdit ? <input className="min-w-0 flex-1 truncate bg-transparent outline-none focus:bg-background focus:ring-1 focus:ring-ring" value={t.name} onClick={(e) => e.stopPropagation()} onChange={(e) => onName(e.target.value)} aria-label="Task name" /> : <span className="truncate">{t.name}</span>}
        {t.links.length > 0 && <Link2 className="size-3 shrink-0 text-primary" aria-label={`${t.links.length} links`} />}
        {openComments > 0 && <span className="flex shrink-0 items-center gap-0.5 rounded bg-accent px-1 text-[10px] text-accent-foreground"><MessageSquare className="size-3" />{openComments}</span>}
      </span>
      {allCols && <><span className="truncate">{t.workstream}</span><span className="truncate">{t.phase}</span><span className="truncate">{t.type}</span></>}
      <span className="truncate">{t.party}</span>
      {canEdit ? <input type="number" min={0} step={0.5} className="w-full bg-transparent font-mono outline-none focus:bg-background focus:ring-1 focus:ring-ring" value={t.days} onClick={(e) => e.stopPropagation()} onChange={(e) => onDays(Math.max(0, Number(e.target.value) || 0))} aria-label="Estimated days" /> : <span className="font-mono">{t.days}</span>}
      <span className="font-mono">{dayToIso(startIso, t.start).slice(5)}</span>
      <span className="font-mono">{dayToIso(startIso, t.end).slice(5)}</span>
      <span className="truncate font-mono">{predLabel}</span>
      {canEdit && <button aria-label="Insert task below" title="Insert task below" className="absolute -bottom-2 left-1 z-10 hidden size-4 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:flex" onClick={(e) => { e.stopPropagation(); onInsert(); }}><Plus className="size-3" /></button>}
    </div>
  );
}
