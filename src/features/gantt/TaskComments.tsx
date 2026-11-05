import { useState } from "react";
import { Check, CornerDownRight, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment, deleteComment, updateComment } from "./api";
import type { GanttComment } from "./types";

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

type Props = { scheduleId: string; taskId: string; comments: GanttComment[]; userId: string | null; authorName: string; onChanged: () => void };

export function TaskComments({ scheduleId, taskId, comments, userId, authorName, onChanged }: Props) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const roots = comments.filter((c) => !c.parent_id);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); onChanged(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save comment"); } finally { setBusy(false); }
  };
  const post = (body: string, parent_id: string | null) => run(() => addComment({ schedule_id: scheduleId, task_id: taskId, parent_id, author_name: authorName, body: body.trim() }));

  return (
    <div className="space-y-3">
      {roots.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
      {roots.map((c) => (
        <Thread key={c.id} root={c} replies={comments.filter((r) => r.parent_id === c.id)} userId={userId} busy={busy} run={run} post={post} />
      ))}
      {userId ? (
        <div className="space-y-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="What's happening with this task?" rows={3} maxLength={5000} />
          <Button size="sm" disabled={busy || !draft.trim()} onClick={async () => { await post(draft, null); setDraft(""); }}>Comment as {authorName}</Button>
        </div>
      ) : <p className="text-sm text-muted-foreground">Sign in to add comments.</p>}
    </div>
  );
}

function Thread({ root, replies, userId, busy, run, post }: { root: GanttComment; replies: GanttComment[]; userId: string | null; busy: boolean; run: (fn: () => Promise<void>) => Promise<void>; post: (b: string, p: string | null) => Promise<void> }) {
  const [reply, setReply] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-md border p-3 ${root.resolved ? "border-border bg-muted/50 opacity-75" : "border-accent/50 bg-background"}`}>
      <Comment c={root} userId={userId} busy={busy} run={run} />
      {replies.map((r) => <div key={r.id} className="ml-4 mt-2 border-l border-border pl-3"><Comment c={r} userId={userId} busy={busy} run={run} /></div>)}
      {userId && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}><CornerDownRight /> Reply</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => updateComment(root.id, { resolved: !root.resolved }))}>{root.resolved ? <><RotateCcw /> Re-open</> : <><Check /> Resolve</>}</Button>
        </div>
      )}
      {open && (
        <div className="mt-2 space-y-2">
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} maxLength={5000} />
          <Button size="sm" disabled={busy || !reply.trim()} onClick={async () => { await post(reply, root.id); setReply(""); setOpen(false); }}>Reply</Button>
        </div>
      )}
    </div>
  );
}

function Comment({ c, userId, busy, run }: { c: GanttComment; userId: string | null; busy: boolean; run: (fn: () => Promise<void>) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.body);
  const mine = userId === c.author_id;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">{c.author_name}</p>
        <p className="text-xs text-muted-foreground">{when(c.created_at)}{c.edited_at ? " · edited" : ""}{c.resolved && !c.parent_id ? " · resolved" : ""}</p>
      </div>
      {editing ? (
        <div className="mt-1 space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={5000} />
          <div className="flex gap-2"><Button size="sm" disabled={busy || !text.trim()} onClick={async () => { await run(() => updateComment(c.id, { body: text.trim() })); setEditing(false); }}>Save</Button><Button size="sm" variant="ghost" onClick={() => { setText(c.body); setEditing(false); }}>Cancel</Button></div>
        </div>
      ) : <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>}
      {mine && !editing && (
        <div className="mt-1 flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(true)} aria-label="Edit comment"><Pencil /></Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" disabled={busy} onClick={() => { if (window.confirm("Delete this comment?")) void run(() => deleteComment(c.id)); }} aria-label="Delete comment"><Trash2 /></Button>
        </div>
      )}
    </div>
  );
}
