import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, ClipboardList, FileUp, GanttChart, LayoutDashboard, MessageSquare, Ruler, Search, SunMedium } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSharedProject } from "@/lib/shared-project";
import { GanttWorkspace } from "@/features/gantt/GanttWorkspace";
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
const START_KEY = "ace-solar-flow-start-v1";
const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1, 12); };
const shortDate = (iso: string) => fromIso(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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
  const [startIso, setStartIso] = useState<string>(() => window.localStorage.getItem(START_KEY) ?? toIso(new Date()));
  useEffect(() => { window.localStorage.setItem(START_KEY, startIso); }, [startIso]);
  const startDate = useMemo(() => fromIso(startIso), [startIso]);
  const dateForDay = (day: number) => toIso(new Date(startDate.getTime() + day * dayMs));
  const dayForDate = (iso: string) => Math.round((fromIso(iso).getTime() - startDate.getTime()) / dayMs);
  const firstTaskId = tasks[0]?.id;
  // The first task anchors the schedule: moving it moves the project start, and every other task follows.
  const setTaskStartDate = (task: Task, iso: string) => {
    if (!iso) return;
    if (task.id === firstTaskId) { setStartIso(toIso(new Date(fromIso(iso).getTime() - task.start * dayMs))); return; }
    patchTask(task.id, { start: Math.max(0, dayForDate(iso)) }, true);
  };
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
          <div className="flex gap-2"><Button asChild size="sm" variant="outline" className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/solar-bom"><ClipboardList /> BOM</Link></Button><Button asChild size="sm" variant="outline" className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/solar-draft"><Ruler /> Plans</Link></Button></div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-61px)] lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-background p-4 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] uppercase text-primary">Project workspace</p>
          <div className="mt-3 space-y-2"><SharedField label="Project name" value={project.projectName} onChange={(value) => updateProject({ projectName: value })} /><SharedField label="Address" value={project.address} onChange={(value) => updateProject({ address: value })} /><SharedField label="System size (kW DC)" value={String(project.systemSizeKw)} type="number" onChange={(value) => updateProject({ systemSizeKw: Math.max(0, Number(value)) })} /><SharedField label="First task start date" type="date" value={startIso} onChange={(value) => { if (value) setStartIso(value); }} /><p className="text-[10px] text-muted-foreground">Every other task follows from this date. Forecast PTO: {shortDate(toIso(finishDate))}</p></div>
          <nav className="mt-6 space-y-1">{([{ id: "gantt", label: "Gantt Chart", icon: GanttChart }, { id: "board", label: "Task Board", icon: LayoutDashboard }, { id: "milestones", label: "Milestones & KPIs", icon: BarChart3 }] as const).map((item) => <Button key={item.id} variant={view === item.id ? "default" : "ghost"} className="w-full justify-start" onClick={() => setView(item.id)}><item.icon /> {item.label}</Button>)}</nav>
          <div className="mt-6 border-t border-border pt-4"><p className="text-xs text-muted-foreground">Overall completion</p><div className="mt-2 flex items-center gap-3"><Progress value={overall} /><strong className="font-mono text-sm">{overall}%</strong></div></div>
        </aside>

        <section className="min-w-0">
          <div className="border-b border-border bg-background px-4 py-4 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase text-primary">{project.systemSizeKw} kW DC · {project.address}</p><h2 className="font-display text-2xl font-bold">{view === "gantt" ? "Delivery schedule" : view === "board" ? "Task board" : "Project milestones"}</h2></div>{view === "gantt" && <div className="flex rounded-md border border-border p-1">{(["days", "weeks", "months"] as Scale[]).map((item) => <Button key={item} size="sm" variant={scale === item ? "default" : "ghost"} onClick={() => setScale(item)} className="capitalize">{item}</Button>)}</div>}</div></div>
          {view !== "gantt" && <Filters search={search} setSearch={setSearch} assignee={assignee} setAssignee={setAssignee} status={status} setStatus={setStatus} assignees={assignees} />