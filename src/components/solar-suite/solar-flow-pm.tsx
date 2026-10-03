import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, ClipboardList, FileUp, GanttChart, LayoutDashboard, MessageSquare, Ruler, Search, SunMedium } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSharedProject } from "@/lib/shared-project";
import { cn } from "@/lib/utils";

type View = "gantt" | "board" | "milestones";
type Scale = "days" | "weeks" | "months";
type Status = "To Do" | "In Progress" | "Blocked" | "Done";
type Task = { id: string; phase: number; name: string; assignee: string; stakeholders: string; duration: number; start: number; predecessor?: string; critical?: boolean; progress: number; status: Status; comments: string[] };

const phases = ["Origination & Contracting", "Site & Engineering", "Permitting & Interconnection", "Procurement & Logistics", "Construction & Installation", "Commissioning & PTO"];
const taskSeed: Omit<Task, "start" | "progress" | "status" | "comments">[] = [
  { id: "0.1", phase: 0, name: "Sign Letter of Intent (LOI)", assignee: "Business Development", stakeholders: "Property Owner & Developer", duration: 14 },
  { id: "0.2", phase: 0, name: "Sign Investor Contract / Tax Equity Agreement", assignee: "Chief Financial Officer", stakeholders: "Investor & Developer", duration: 21, predecessor: "0.1" },
  { id: "0.3", phase: 0, name: "Sign Turnkey EPC Contract", assignee: "Project Director", stakeholders: "Developer & EPC Contractor", duration: 14, predecessor: "0.2", critical: true },
  { id: "1.1", phase: 1, name: "On-site Structural & Electrical Survey", assignee: "Site Engineer", stakeholders: "Property Owner Representative", duration: 5, predecessor: "0.3" },
  { id: "1.2", phase: 1, name: "Civil & Structural Engineering Analysis", assignee: "Structural PE", stakeholders: "EPC Project Manager", duration: 7, predecessor: "1.1" },
  { id: "1.3", phase: 1, name: "Complete Permit Plan Set PV-0 to PV-5", assignee: "CAD Designer", stakeholders: "Structural PE & Electrical PE", duration: 10, predecessor: "1.2" },
  { id: "2.1", phase: 2, name: "Submit Utility Interconnection Application", assignee: "Project Manager", stakeholders: "Utility Liaison", duration: 2, predecessor: "1.3" },
  { id: "2.2", phase: 2, name: "Submit AHJ Building & Electrical Permits", assignee: "Permit Coordinator", stakeholders: "AHJ Reviewer", duration: 2, predecessor: "1.3" },
  { id: "2.3", phase: 2, name: "Utility Interconnection Approval", assignee: "Utility Liaison", stakeholders: "Utility & Developer", duration: 30, predecessor: "2.1", critical: true },
  { id: "2.4", phase: 2, name: "AHJ Permit Approval", assignee: "Permit Coordinator", stakeholders: "AHJ Reviewer", duration: 20, predecessor: "2.2" },
  { id: "3.1", phase: 3, name: "Order Modules, Inverters & Racking", assignee: "Procurement Lead", stakeholders: "Equipment Vendors", duration: 3, predecessor: "2.4" },
  { id: "3.2", phase: 3, name: "Freight & Delivery to Site", assignee: "Logistics Lead", stakeholders: "EPC Contractor", duration: 21, predecessor: "3.1" },
  { id: "3.3", phase: 3, name: "Roof Membrane Prep & Layout Staging", assignee: "Site Superintendent", stakeholders: "Roofing Contractor", duration: 4, predecessor: "3.2" },
  { id: "4.1", phase: 4, name: "Lay Racking, Ballast Pavers & Slip Sheets", assignee: "Solar Crew Lead", stakeholders: "Site Superintendent", duration: 7, predecessor: "3.3" },
  { id: "4.2", phase: 4, name: "PV Module Mounting & String Cabling", assignee: "Solar Crew Lead", stakeholders: "Electrical Foreman", duration: 10, predecessor: "4.1" },
  { id: "4.3", phase: 4, name: "Inverter & Electrical Switchgear Mounting", assignee: "Master Electrician", stakeholders: "Electrical Inspector", duration: 8, predecessor: "4.1" },
  { id: "4.4", phase: 4, name: "DC/AC Conduit Runs & Wire Pulls", assignee: "Master Electrician", stakeholders: "Electrical Foreman", duration: 10, predecessor: "4.3" },
  { id: "5.1", phase: 5, name: "AHJ Electrical & Building Final Inspection", assignee: "Permit Coordinator", stakeholders: "AHJ Inspector", duration: 5, predecessor: "4.4" },
  { id: "5.2", phase: 5, name: "System Testing & Inverter Commissioning", assignee: "Commissioning Tech", stakeholders: "EPC Project Manager", duration: 3, predecessor: "5.1" },
  { id: "5.3", phase: 5, name: "Utility Witness Test & Net Meter Install", assignee: "Project Manager", stakeholders: "Utility Field Team", duration: 10, predecessor: "5.2" },
  { id: "5.4", phase: 5, name: "Permission to Operate (PTO) Received", assignee: "Project Manager", stakeholders: "Utility & Property Owner", duration: 1, predecessor: "5.3", critical: true },
];

function makeTasks() {
  const starts = new Map<string, number>();
  return taskSeed.map((task) => {
    const predecessor = task.predecessor ? taskSeed.find((item) => item.id === task.predecessor) : undefined;
    const start = predecessor ? (starts.get(predecessor.id) ?? 0) + predecessor.duration : task.phase === 0 ? 0 : Math.max(0, task.phase * 21);
    starts.set(task.id, start);
    return { ...task, start, progress: 0, status: "To Do" as Status, comments: [] };
  });
}

const TASK_KEY = "ace-solar-flow-tasks-v1";
const dayMs = 86_400_000;

export function SolarFlowPm() {
  const { project, updateProject } = useSharedProject();
  const [view, setView] = useState<View>("gantt");
  const [scale, setScale] = useState<Scale>("weeks");
  const [tasks, setTasks] = useState<Task[]>(makeTasks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState("All assignees");
  const [status, setStatus] = useState("All statuses");
  const [comment, setComment] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(TASK_KEY);
    if (raw) try { setTasks(JSON.parse(raw) as Task[]); } catch { /* retain defaults */ }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem(TASK_KEY, JSON.stringify(tasks)); }, [hydrated, tasks]);

  const selected = tasks.find((task) => task.id === selectedId) ?? null;
  const assignees = [...new Set(tasks.map((task) => task.assignee))].sort();
  const filtered = tasks.filter((task) => (task.name + task.assignee + task.stakeholders).toLowerCase().includes(search.toLowerCase()) && (assignee === "All assignees" || task.assignee === assignee) && (status === "All statuses" || task.status === status));
  const overall = Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length);
  const finishDay = Math.max(...tasks.map((task) => task.start + task.duration));
  const startDate = useMemo(() => { const date = new Date(); date.setHours(12, 0, 0, 0); return date; }, []);
  const finishDate = new Date(startDate.getTime() + finishDay * dayMs);
  const criticalBlockers = tasks.filter((task) => task.critical && task.status === "Blocked").length;

  const patchTask = (id: string, patch: Partial<Task>, cascade = false) => setTasks((current) => {
    const before = current.find((task) => task.id === id);
    if (!before) return current;
    const next = current.map((task) => task.id === id ? { ...task, ...patch } : task);
    if (!cascade) return next;
    const changed = next.find((task) => task.id === id);
    if (!changed) return next;
    const delta = changed.start + changed.duration - (before.start + before.duration);
    if (delta === 0) return next;
    const descendants = new Set([id]);
    let added = true;
    while (added) {
      added = false;
      next.forEach((task) => { if (task.predecessor && descendants.has(task.predecessor) && !descendants.has(task.id)) { descendants.add(task.id); added = true; } });
    }
    return next.map((task) => task.id !== id && descendants.has(task.id) ? { ...task, start: Math.max(0, task.start + delta) } : task);
  });

  const updateStatus = (id: string, nextStatus: Status) => patchTask(id, { status: nextStatus, progress: nextStatus === "Done" ? 100 : nextStatus === "To Do" ? 0 : tasks.find((task) => task.id === id)?.progress ?? 0 });
  const dragTask = (task: Task, startX: number) => (event: React.DragEvent) => {
    const dayWidth = scale === "days" ? 22 : scale === "weeks" ? 7 : 3;
    const shift = Math.round((event.clientX - startX) / dayWidth);
    if (shift) patchTask(task.id, { start: Math.max(0, task.start + shift) }, true);
  };

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <header className="border-b border-primary-foreground/15 bg-primary text-primary-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3"><SunMedium className="size-7 text-accent" /><div><h1 className="font-display text-xl font-bold">SolarFlow PM</h1><p className="font-mono text-[9px] uppercase opacity-70">Austin Clean Energy · Project controls</p></div></div>
          <div className="flex gap-2"><Button asChild size="sm" variant="outline" className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/solar-suite/bom"><ClipboardList /> BOM</Link></Button><Button asChild size="sm" variant="outline" className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/solar-suite/draft"><Ruler /> Plans</Link></Button></div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-61px)] lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-background p-4 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] uppercase text-primary">Project workspace</p>
          <div className="mt-3 space-y-2"><SharedField label="Project name" value={project.projectName} onChange={(value) => updateProject({ projectName: value })} /><SharedField label="Address" value={project.address} onChange={(value) => updateProject({ address: value })} /><SharedField label="System size (kW DC)" value={String(project.systemSizeKw)} type="number" onChange={(value) => updateProject({ systemSizeKw: Math.max(0, Number(value)) })} /></div>
          <nav className="mt-6 space-y-1">{([{ id: "gantt", label: "Gantt Chart", icon: GanttChart }, { id: "board", label: "Task Board", icon: LayoutDashboard }, { id: "milestones", label: "Milestones & KPIs", icon: BarChart3 }] as const).map((item) => <Button key={item.id} variant={view === item.id ? "default" : "ghost"} className="w-full justify-start" onClick={() => setView(item.id)}><item.icon /> {item.label}</Button>)}</nav>
          <div className="mt-6 border-t border-border pt-4"><p className="text-xs text-muted-foreground">Overall completion</p><div className="mt-2 flex items-center gap-3"><Progress value={overall} /><strong className="font-mono text-sm">{overall}%</strong></div></div>
        </aside>

        <section className="min-w-0">
          <div className="border-b border-border bg-background px-4 py-4 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase text-primary">{project.systemSizeKw} kW DC · {project.address}</p><h2 className="font-display text-2xl font-bold">{view === "gantt" ? "Delivery schedule" : view === "board" ? "Task board" : "Project milestones"}</h2></div>{view === "gantt" && <div className="flex rounded-md border border-border p-1">{(["days", "weeks", "months"] as Scale[]).map((item) => <Button key={item} size="sm" variant={scale === item ? "default" : "ghost"} onClick={() => setScale(item)} className="capitalize">{item}</Button>)}</div>}</div></div>
          <Filters search={search} setSearch={setSearch} assignee={assignee} setAssignee={setAssignee} status={status} setStatus={setStatus} assignees={assignees} />
          <div className="p-3 sm:p-6">
            {view === "gantt" && <GanttView tasks={filtered} scale={scale} finishDay={finishDay} onOpen={setSelectedId} onDrag={dragTask} />}
            {view === "board" && <BoardView tasks={filtered} onOpen={setSelectedId} onStatus={updateStatus} />}
            {view === "milestones" && <MilestonesView tasks={tasks} overall={overall} finishDate={finishDate} criticalBlockers={criticalBlockers} onOpen={setSelectedId} />}
          </div>
        </section>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelectedId(null); }}><SheetContent className="w-full overflow-y-auto sm:max-w-lg">{selected && <><SheetHeader><SheetTitle>{selected.id} · {selected.name}</SheetTitle><SheetDescription>{phases[selected.phase]} · predecessor {selected.predecessor ?? "none"}</SheetDescription></SheetHeader><div className="mt-6 space-y-5"><SharedField label="Assignee" value={selected.assignee} onChange={(value) => patchTask(selected.id, { assignee: value })} /><SharedField label="Stakeholders" value={selected.stakeholders} onChange={(value) => patchTask(selected.id, { stakeholders: value })} /><div className="grid grid-cols-2 gap-3"><SharedField label="Start day" type="number" value={String(selected.start)} onChange={(value) => patchTask(selected.id, { start: Math.max(0, Number(value)) }, true)} /><SharedField label="Duration (days)" type="number" value={String(selected.duration)} onChange={(value) => patchTask(selected.id, { duration: Math.max(1, Number(value)) }, true)} /></div><label className="block text-xs font-semibold">Completion · {selected.progress}%<input className="mt-2 w-full accent-primary" type="range" min="0" max="100" step="5" value={selected.progress} onChange={(event) => patchTask(selected.id, { progress: Number(event.target.value), status: Number(event.target.value) === 100 ? "Done" : Number(event.target.value) > 0 ? "In Progress" : "To Do" })} /></label><label className="block text-xs font-semibold">Status<select className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selected.status} onChange={(event) => updateStatus(selected.id, event.target.value as Status)}>{(["To Do", "In Progress", "Blocked", "Done"] as Status[]).map((item) => <option key={item}>{item}</option>)}</select></label><label className="grid cursor-pointer place-items-center border border-dashed border-border bg-muted p-6 text-center text-sm text-muted-foreground"><FileUp className="mb-2 size-5 text-primary" />Attach execution draft, executed PDF, or redline<input type="file" className="sr-only" onChange={(event) => { if (event.target.files?.[0]) patchTask(selected.id, { comments: [...selected.comments, `Attached: ${event.target.files[0].name}`] }); }} /></label><div><h3 className="flex items-center gap-2 text-sm font-semibold"><MessageSquare className="size-4" /> Comments</h3><div className="mt-2 space-y-2">{selected.comments.map((item, index) => <p key={`${item}-${index}`} className="rounded-md bg-muted p-2 text-xs">{item}</p>)}</div><textarea className="mt-2 min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm" placeholder="Comment, @mention, or blocker note" value={comment} onChange={(event) => setComment(event.target.value)} /><Button className="mt-2" size="sm" onClick={() => { if (!comment.trim()) return; patchTask(selected.id, { comments: [...selected.comments, comment.trim()] }); setComment(""); }}>Add comment</Button></div></div></>}</SheetContent></Sheet>
    </main>
  );
}

function SharedField({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) { return <label className="block"><span className="font-mono text-[9px] uppercase text-muted-foreground">{label}</span><input type={type} min={type === "number" ? 0 : undefined} className="mt-1 w-full rounded-md border border-input bg-card px-2.5 py-2 text-sm outline-none focus:ring-1 focus:ring-ring" value={value} onChange={(event) => onChange(event.target.value)} /></label>; }

function Filters({ search, setSearch, assignee, setAssignee, status, setStatus, assignees }: { search: string; setSearch: (v: string) => void; assignee: string; setAssignee: (v: string) => void; status: string; setStatus: (v: string) => void; assignees: string[] }) { return <div className="grid gap-2 border-b border-border bg-background px-4 py-3 sm:grid-cols-[minmax(220px,1fr)_220px_160px] sm:px-6"><label className="flex items-center gap-2 rounded-md border border-input px-3"><Search className="size-4 text-muted-foreground" /><input aria-label="Search tasks" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" placeholder="Search tasks or stakeholders" value={search} onChange={(e) => setSearch(e.target.value)} /></label><select aria-label="Filter by assignee" className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={assignee} onChange={(e) => setAssignee(e.target.value)}><option>All assignees</option>{assignees.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by status" className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option>All statuses</option>{["To Do", "In Progress", "Blocked", "Done"].map((item) => <option key={item}>{item}</option>)}</select></div>; }

function GanttView({ tasks, scale, finishDay, onOpen, onDrag }: { tasks: Task[]; scale: Scale; finishDay: number; onOpen: (id: string) => void; onDrag: (task: Task, startX: number) => (event: React.DragEvent) => void }) {
  const dayWidth = scale === "days" ? 22 : scale === "weeks" ? 7 : 3;
  const width = Math.max(760, (finishDay + 15) * dayWidth);
  return <div className="overflow-hidden border border-border bg-card"><div className="grid grid-cols-[260px_minmax(0,1fr)] border-b border-border bg-primary text-primary-foreground"><div className="p-3 font-mono text-[10px] uppercase">Task / owner</div><div className="overflow-hidden p-3 font-mono text-[10px] uppercase">Timeline · {scale}</div></div><div className="max-h-[680px] overflow-auto">{phases.map((phase, phaseIndex) => { const phaseTasks = tasks.filter((task) => task.phase === phaseIndex); if (!phaseTasks.length) return null; return <div key={phase}><div className="sticky left-0 z-10 border-b border-border bg-muted px-3 py-2 font-display text-sm font-bold">Phase {phaseIndex} · {phase}</div>{phaseTasks.map((task) => <div key={task.id} className="grid min-h-14 grid-cols-[260px_minmax(0,1fr)] border-b border-border last:border-b-0"><button className="flex min-w-0 items-center gap-2 border-r border-border p-3 text-left" onClick={() => onOpen(task.id)}><span className="font-mono text-[10px] text-primary">{task.id}</span><span className="min-w-0"><span className="block truncate text-xs font-semibold">{task.name}</span><span className="block truncate text-[10px] text-muted-foreground">{task.assignee}</span></span></button><div className="relative overflow-hidden" style={{ minWidth: width }}><div className="absolute inset-0 opacity-50" style={{ backgroundImage: "linear-gradient(to right, var(--color-border) 1px, transparent 1px)", backgroundSize: `${dayWidth * (scale === "months" ? 30 : scale === "weeks" ? 7 : 1)}px 100%` }} /><div draggable onDragStart={(event) => event.dataTransfer.setData("startX", String(event.clientX))} onDragEnd={(event) => onDrag(task, Number(event.dataTransfer.getData("startX")))(event)} onClick={() => onOpen(task.id)} className={cn("absolute top-3 h-8 cursor-grab overflow-hidden rounded-sm border text-left text-[10px] font-semibold text-primary-foreground active:cursor-grabbing", task.status === "Blocked" ? "border-destructive bg-destructive" : task.status === "Done" ? "border-primary bg-primary" : task.critical ? "border-destructive bg-secondary" : "border-secondary bg-secondary")} style={{ left: task.start * dayWidth, width: Math.max(30, task.duration * dayWidth) }}><span className="absolute inset-y-0 left-0 bg-primary/40" style={{ width: `${task.progress}%` }} /><span className="relative block truncate px-2 py-1.5">{task.id} · {task.duration}d</span></div></div></div>)}</div>; })}</div></div>;
}

function BoardView({ tasks, onOpen, onStatus }: { tasks: Task[]; onOpen: (id: string) => void; onStatus: (id: string, status: Status) => void }) { const statuses: Status[] = ["To Do", "In Progress", "Blocked", "Done"]; return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{statuses.map((status, column) => <section key={status} className="min-w-0"><div className="mb-2 flex items-center justify-between"><h3 className="font-display font-bold">{status}</h3><Badge variant={status === "Blocked" ? "destructive" : "outline"}>{tasks.filter((task) => task.status === status).length}</Badge></div><div className="space-y-2">{tasks.filter((task) => task.status === status).map((task) => <article key={task.id} className="border border-border bg-card p-3"><button className="w-full text-left" onClick={() => onOpen(task.id)}><p className="font-mono text-[9px] uppercase text-primary">{task.id} · Phase {task.phase}</p><h4 className="mt-1 text-sm font-semibold">{task.name}</h4><p className="mt-2 text-xs text-muted-foreground">{task.assignee}</p><Progress className="mt-3" value={task.progress} /></button><div className="mt-3 flex justify-between"><Button size="icon" variant="ghost" disabled={column === 0} aria-label="Move task backward" onClick={() => onStatus(task.id, statuses[column - 1] ?? status)}><ChevronRight className="rotate-180" /></Button><Button size="icon" variant="ghost" disabled={column === statuses.length - 1} aria-label="Move task forward" onClick={() => onStatus(task.id, statuses[column + 1] ?? status)}><ChevronRight /></Button></div></article>)}</div></section>)}</div>; }

function MilestonesView({ tasks, overall, finishDate, criticalBlockers, onOpen }: { tasks: Task[]; overall: number; finishDate: Date; criticalBlockers: number; onOpen: (id: string) => void }) { return <div className="space-y-6"><div className="grid gap-3 sm:grid-cols-3"><Kpi icon={<CheckCircle2 />} label="Overall complete" value={`${overall}%`} /><Kpi icon={<CalendarDays />} label="Forecast PTO" value={finishDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} /><Kpi icon={<CircleAlert />} label="Critical blockers" value={String(criticalBlockers)} /></div><div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><section className="border border-border bg-card"><div className="border-b border-border p-4"><h3 className="font-display text-lg font-bold">Phase health</h3></div>{phases.map((phase, index) => { const items = tasks.filter((task) => task.phase === index); const progress = Math.round(items.reduce((sum, task) => sum + task.progress, 0) / items.length); return <div key={phase} className="grid grid-cols-[minmax(0,1fr)_100px_45px] items-center gap-3 border-b border-border p-3 last:border-0"><div><p className="text-sm font-semibold">Phase {index} · {phase}</p><p className="text-[10px] text-muted-foreground">{items.filter((task) => task.status === "Done").length} of {items.length} tasks complete</p></div><Progress value={progress} /><span className="font-mono text-xs">{progress}%</span></div>; })}</section><section className="border border-border bg-card"><div className="border-b border-border p-4"><h3 className="font-display text-lg font-bold">Critical path gates</h3></div>{tasks.filter((task) => task.critical).map((task) => <button key={task.id} onClick={() => onOpen(task.id)} className="flex w-full items-center justify-between gap-3 border-b border-border p-4 text-left last:border-0"><span><span className="font-mono text-[9px] uppercase text-destructive">Gate {task.id}</span><span className="block text-sm font-semibold">{task.name}</span></span><Badge variant={task.status === "Blocked" ? "destructive" : "outline"}>{task.status}</Badge></button>)}</section></div></div>; }

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="border border-border bg-card p-4"><div className="flex items-center gap-2 text-primary [&_svg]:size-4"><span>{icon}</span><span className="font-mono text-[9px] uppercase">{label}</span></div><p className="mt-2 font-display text-2xl font-bold">{value}</p></div>; }