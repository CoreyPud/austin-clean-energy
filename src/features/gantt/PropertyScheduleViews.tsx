import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronRight, CircleAlert, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { dayToIso, isContingency, isMilestone, scheduleProgress } from "./schedule";
import type { GanttTask, ScheduledTask } from "./types";

type Status = NonNullable<GanttTask["status"]>;
const STATUSES: Status[] = ["To Do", "In Progress", "Blocked", "Done"];
const statusOf = (t: Pick<GanttTask, "status">): Status => t.status ?? "To Do";
const progressOf = (s: Status) => (s === "Done" ? 100 : s === "In Progress" ? 50 : 0);

export function PropertyBoardView({
  tasks, startIso, canEdit, onOpen, onStatus,
}: {
  tasks: ScheduledTask[];
  startIso: string;
  canEdit: boolean;
  onOpen: (id: string) => void;
  onStatus: (id: string, status: Status) => void;
}) {
  const [search, setSearch] = useState("");
  const [party, setParty] = useState("All assignees");
  const [statusFilter, setStatusFilter] = useState("All statuses");

  const parties = useMemo(() => [...new Set(tasks.map((t) => t.party).filter(Boolean))].sort(), [tasks]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !(t.name + " " + t.party + " " + t.workstream + " " + t.phase).toLowerCase().includes(q)) return false;
      if (party !== "All assignees" && t.party !== party) return false;
      if (statusFilter !== "All statuses" && statusOf(t) !== statusFilter) return false;
      return true;
    });
  }, [tasks, search, party, statusFilter]);

  return (
    <div className="space-y-4 px-4">
      <div className="grid gap-2 rounded-md border border-border bg-background p-3 sm:grid-cols-[minmax(220px,1fr)_220px_160px]">
        <label className="flex items-center gap-2 rounded-md border border-input px-3">
          <Search className="size-4 text-muted-foreground" />
          <input aria-label="Search tasks" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" placeholder="Search tasks, workstreams, or responsible party" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <select aria-label="Filter by responsible party" className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={party} onChange={(e) => setParty(e.target.value)}>
          <option>All assignees</option>
          {parties.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select aria-label="Filter by status" className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map((status, column) => {
          const colTasks = filtered.filter((t) => statusOf(t) === status);
          return (
            <section key={status} className="min-w-0">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display font-bold">{status}</h3>
                <Badge variant={status === "Blocked" ? "destructive" : "outline"}>{colTasks.length}</Badge>
              </div>
              <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
                {colTasks.map((t) => (
                  <article key={t.id} className="rounded-sm border border-border bg-card p-3">
                    <button type="button" className="w-full text-left" onClick={() => onOpen(t.id)}>
                      <p className="font-mono text-[9px] uppercase text-primary">#{t.row} · {t.workstream || t.phase || "General"}</p>
                      <h4 className="mt-1 text-sm font-semibold">{t.name}</h4>
                      <p className="mt-1.5 text-xs text-muted-foreground">{t.party || "Unassigned"} · {dayToIso(startIso, t.start)}</p>
                      <Progress className="mt-2.5" value={progressOf(status)} />
                    </button>
                    {canEdit && (
                      <div className="mt-2.5 flex justify-between">
                        <Button size="icon" variant="ghost" disabled={column === 0} aria-label="Move task backward" onClick={() => onStatus(t.id, STATUSES[column - 1] ?? status)}>
                          <ChevronRight className="rotate-180" />
                        </Button>
                        <Button size="icon" variant="ghost" disabled={column === STATUSES.length - 1} aria-label="Move task forward" onClick={() => onStatus(t.id, STATUSES[column + 1] ?? status)}>
                          <ChevronRight />
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
                {colTasks.length === 0 && <p className="rounded-sm border border-dashed border-border p-4 text-center text-xs text-muted-foreground">No tasks</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function PropertyMilestonesView({
  tasks, startIso, finishDay, onOpen,
}: {
  tasks: ScheduledTask[];
  startIso: string;
  finishDay: number;
  onOpen: (id: string) => void;
}) {
  const { overall, blockedCount } = scheduleProgress(tasks);
  const workstreams = useMemo(() => {
    const order: string[] = [];
    const grouped = new Map<string, ScheduledTask[]>();
    for (const t of tasks) {
      if (isContingency(t)) continue;
      const key = t.workstream || "General";
      if (!grouped.has(key)) { order.push(key); grouped.set(key, []); }
      grouped.get(key)!.push(t);
    }
    return order.map((name) => {
      const items = grouped.get(name)!;
      const done = items.filter((t) => statusOf(t) === "Done").length;
      const pct = scheduleProgress(items).overall;
      return { name, items, done, pct };
    });
  }, [tasks]);

  const gates = useMemo(
    () => tasks.filter((t) => !isContingency(t) && (isMilestone(t) || /milestone|decision/i.test(t.type))),
    [tasks],
  );

  return (
    <div className="space-y-6 px-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi icon={<CheckCircle2 />} label="Overall complete" value={`${overall}%`} />
        <Kpi icon={<CalendarDays />} label="Forecast completion" value={dayToIso(startIso, finishDay)} />
        <Kpi icon={<CircleAlert />} label="Blocked tasks" value={String(blockedCount)} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-sm border border-border bg-card">
          <div className="border-b border-border p-4"><h3 className="font-display text-lg font-bold">Workstream health</h3></div>
          {workstreams.length === 0 && <p className="p-4 text-sm text-muted-foreground">No tasks in this schedule yet.</p>}
          {workstreams.map((ws) => (
            <div key={ws.name} className="grid grid-cols-[minmax(0,1fr)_100px_45px] items-center gap-3 border-b border-border p-3 last:border-0">
              <div>
                <p className="text-sm font-semibold">{ws.name}</p>
                <p className="text-[10px] text-muted-foreground">{ws.done} of {ws.items.length} tasks complete</p>
              </div>
              <Progress value={ws.pct} />
              <span className="font-mono text-xs">{ws.pct}%</span>
            </div>
          ))}
        </section>
        <section className="rounded-sm border border-border bg-card">
          <div className="border-b border-border p-4"><h3 className="font-display text-lg font-bold">Milestones &amp; decision gates</h3></div>
          {gates.length === 0 && <p className="p-4 text-sm text-muted-foreground">No milestones defined in this schedule yet.</p>}
          <div className="max-h-[55vh] overflow-y-auto">
            {gates.map((t) => (
              <button key={t.id} type="button" onClick={() => onOpen(t.id)} className="flex w-full items-center justify-between gap-3 border-b border-border p-3.5 text-left hover:bg-muted/40 last:border-0">
                <span>
                  <span className="font-mono text-[9px] uppercase text-primary">#{t.row} · {dayToIso(startIso, t.start)}</span>
                  <span className="block text-sm font-semibold">{t.name}</span>
                </span>
                <Badge variant={statusOf(t) === "Blocked" ? "destructive" : "outline"}>{statusOf(t)}</Badge>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-primary [&_svg]:size-4">
        <span>{icon}</span>
        <span className="font-mono text-[9px] uppercase">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}