import { useState } from "react";
import { ArrowDownToLine, ArrowUpToLine, ExternalLink, Link2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { dayToIso, isoToDay, wouldCycle } from "./schedule";
import { TaskComments } from "./TaskComments";
import type { GanttComment, GanttTask, ScheduledTask } from "./types";

type Props = {
  task: ScheduledTask | null;
  all: ScheduledTask[];
  startIso: string;
  canEdit: boolean;
  scheduleId: string;
  comments: GanttComment[];
  userId: string | null;
  authorName: string;
  onClose: () => void;
  onPatch: (id: string, patch: Partial<GanttTask>) => void;
  onMove: (id: string, day: number) => void;
  onInsert: (id: string, where: "above" | "below") => void;
  onRemove: (id: string) => void;
  onCommentsChanged: () => void;
};

const TYPES = ["Task", "Decision", "Milestone", "Rework/Exception", "Rework/Branch", "Task (automated)"];
const STATUSES = ["To Do", "In Progress", "Blocked", "Done"] as const;

export function TaskPanel(p: Props) {
  const { task } = p;
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  if (!task) return null;
  const set = (patch: Partial<GanttTask>) => p.onPatch(task.id, patch);
  const text = (label: string, key: "name" | "workstream" | "phase" | "party" | "program" | "mount") => (
    <div className="space-y-1"><Label className="text-xs">{label}</Label><Input value={task[key]} disabled={!p.canEdit} onChange={(e) => set({ [key]: e.target.value } as Partial<GanttTask>)} /></div>
  );
  const candidates = p.all.filter((t) => t.id !== task.id && !task.preds.includes(t.id));
  const addLink = () => {
    const url = linkUrl.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) { toast.error("Enter a full web address starting with https://"); return; }
    set({ links: [...task.links, { label: linkLabel.trim() || url, url }] });
    setLinkLabel(""); setLinkUrl("");
  };

  return (
    <Sheet open onOpenChange={(o) => !o && p.onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>#{task.row} {task.name}</SheetTitle>
          <SheetDescription>{dayToIso(p.startIso, task.start)} → {dayToIso(p.startIso, task.end)} · {task.days} day{task.days === 1 ? "" : "s"}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">{text("Task name", "name")}</div>
          {text("Workstream", "workstream")}
          {text("Phase", "phase")}
          <div className="space-y-1"><Label className="text-xs">Type</Label>
            <Select value={task.type} disabled={!p.canEdit} onValueChange={(v) => set({ type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[...new Set([task.type, ...TYPES])].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Status</Label>
            <Select value={task.status ?? "To Do"} disabled={!p.canEdit} onValueChange={(v) => set({ status: v as GanttTask["status"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
          {text("Responsible party", "party")}
          {text("Program", "program")}
          {text("Mount", "mount")}
          <div className="space-y-1"><Label className="text-xs">Estimated cost ($)</Label><Input type="number" min={0} value={task.cost} disabled={!p.canEdit} onChange={(e) => set({ cost: Math.max(0, Number(e.target.value) || 0) })} /></div>
          <div className="space-y-1"><Label className="text-xs">Estimated days (0 = milestone ◆)</Label><Input type="number" min={0} step={0.5} value={task.days} disabled={!p.canEdit} onChange={(e) => set({ days: Math.max(0, Number(e.target.value) || 0) })} /></div>
          <div className="space-y-1"><Label className="text-xs">Start date</Label><Input type="date" value={dayToIso(p.startIso, task.start)} disabled={!p.canEdit} onChange={(e) => e.target.value && p.onMove(task.id, isoToDay(p.startIso, e.target.value))} />
            {task.manualStart != null && <button className="text-xs text-primary underline" disabled={!p.canEdit} onClick={() => set({ manualStart: null })}>Clear manual delay (follow predecessors)</button>}
          </div>
        </div>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Predecessors</h3>
          <p className="text-xs text-muted-foreground">This task starts when all of these finish.</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {task.preds.length === 0 && <span className="text-xs text-muted-foreground">None — starts on the project start date.</span>}
            {task.preds.map((id) => { const pr = p.all.find((t) => t.id === id); return pr ? <Badge key={id} variant="secondary" className="gap-1">#{pr.row} {pr.name.slice(0, 40)}{p.canEdit && <button aria-label="Remove predecessor" onClick={() => set({ preds: task.preds.filter((x) => x !== id) })}><X className="size-3" /></button>}</Badge> : null; })}
          </div>
          {p.canEdit && (
            <Select value="" onValueChange={(id) => { if (wouldCycle(p.all, task.id, id)) { toast.error("That link would create a loop."); return; } set({ preds: [...task.preds, id] }); }}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Add predecessor…" /></SelectTrigger>
              <SelectContent className="max-h-72">{candidates.map((t) => <SelectItem key={t.id} value={t.id} disabled={wouldCycle(p.all, task.id, t.id)}>#{t.row} {t.name.slice(0, 70)}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </section>

        <section className="mt-6">
          <h3 className="flex items-center gap-1 text-sm font-semibold"><Link2 className="size-4" /> Reference links</h3>
          <ul className="mt-2 space-y-1">
            {task.links.length === 0 && <li className="text-xs text-muted-foreground">No links yet.</li>}
            {task.links.map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-1 text-primary underline"><ExternalLink className="size-3 shrink-0" /><span className="truncate">{l.label}</span></a>
                {p.canEdit && <Button size="sm" variant="ghost" className="h-7 px-2" aria-label="Remove link" onClick={() => set({ links: task.links.filter((_, j) => j !== i) })}><X /></Button>}
              </li>
            ))}
          </ul>
          {p.canEdit && (
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
              <Input placeholder="Label (e.g. AE CBI form)" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
              <Input placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              <Button size="sm" onClick={addLink} disabled={!linkUrl.trim()}>Add</Button>
            </div>
          )}
        </section>

        {p.canEdit && (
          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => p.onInsert(task.id, "above")}><ArrowUpToLine /> Insert task above</Button>
            <Button size="sm" variant="outline" onClick={() => p.onInsert(task.id, "below")}><ArrowDownToLine /> Insert task below</Button>
            <Button size="sm" variant="destructive" onClick={() => { if (window.confirm(`Delete "${task.name}"? Tasks that depended on it will follow its predecessors instead.`)) p.onRemove(task.id); }}><Trash2 /> Delete task</Button>
          </div>
        )}

        <section className="mt-8 border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold">Comments</h3>
          <TaskComments scheduleId={p.scheduleId} taskId={task.id} comments={p.comments.filter((c) => c.task_id === task.id)} userId={p.userId} authorName={p.authorName} onChanged={p.onCommentsChanged} />
        </section>
      </SheetContent>
    </Sheet>
  );
}
