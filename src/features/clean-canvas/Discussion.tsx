import { useState } from "react";
import { CornerDownRight, LogIn, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { commentSchema, type CleanCanvasComment } from "./model";

interface Props {
  ideaId: string;
  comments: CleanCanvasComment[];
  currentUserId: string | null;
  displayName: string;
  onRequireAuth: () => void;
  onChanged: () => Promise<void>;
}

export function Discussion({ ideaId, comments, currentUserId, displayName, onRequireAuth, onChanged }: Props) {
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    try {
      await action();
      await onChanged();
    } catch {
      toast.error("We couldn't save that discussion change. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const post = (body: string, parentId: string | null) => {
    if (!currentUserId) return onRequireAuth();
    const parsed = commentSchema.safeParse({ body, author_name: displayName });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Check the comment");
    return run(async () => {
      const { error } = await supabase.from("clean_canvas_comments").insert({
        idea_id: ideaId,
        parent_id: parentId,
        author_id: currentUserId,
        author_name: parsed.data.author_name,
        body: parsed.data.body,
      });
      if (error) throw error;
      if (parentId) {
        setReplyDraft("");
        setReplyTo(null);
      } else {
        setDraft("");
      }
    });
  };

  const saveEdit = (id: string) => run(async () => {
    const parsed = commentSchema.safeParse({ body: editDraft, author_name: displayName });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
    const { error } = await supabase.from("clean_canvas_comments").update({ body: parsed.data.body }).eq("id", id);
    if (error) throw error;
    setEditingId(null);
  });

  const remove = (comment: CleanCanvasComment) => {
    const message = comment.parent_id ? "Delete this reply?" : "Delete this comment and all of its replies?";
    if (!window.confirm(message)) return;
    return run(async () => {
      const { error } = await supabase.from("clean_canvas_comments").delete().eq("id", comment.id);
      if (error) throw error;
    });
  };

  const roots = comments.filter((comment) => !comment.parent_id);
  const renderComment = (comment: CleanCanvasComment, isReply = false) => {
    const mine = comment.author_id === currentUserId;
    return (
      <div key={comment.id} className={isReply ? "ml-4 border-l pl-4 sm:ml-7" : ""}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">{comment.author_name}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {comment.updated_at !== comment.created_at ? " · edited" : ""}
          </p>
        </div>
        {editingId === comment.id ? (
          <div className="mt-2 space-y-2">
            <Textarea aria-label="Edit comment" value={editDraft} onChange={(e) => setEditDraft(e.target.value)} maxLength={2000} rows={3} />
            <div className="flex gap-2">
              <Button size="sm" disabled={saving || !editDraft.trim()} onClick={() => void saveEdit(comment.id)}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
            </div>
          </div>
        ) : <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{comment.body}</p>}
        {currentUserId && editingId !== comment.id && (
          <div className="mt-1 flex flex-wrap gap-1">
            {!isReply && <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyDraft(""); }}><CornerDownRight className="mr-1 h-3 w-3" />Reply</Button>}
            {mine && <Button size="sm" variant="ghost" className="h-7 px-2" aria-label="Edit comment" onClick={() => { setEditingId(comment.id); setEditDraft(comment.body); }}><Pencil className="h-3 w-3" /></Button>}
            {mine && <Button size="sm" variant="ghost" className="h-7 px-2" aria-label="Delete comment" disabled={saving} onClick={() => void remove(comment)}><Trash2 className="h-3 w-3" /></Button>}
          </div>
        )}
        {!isReply && replyTo === comment.id && (
          <div className="mt-3 space-y-2 rounded-md bg-muted/40 p-3">
            <Textarea aria-label={`Reply to ${comment.author_name}`} value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} maxLength={2000} rows={3} placeholder="Add a constructive reply…" />
            <div className="flex gap-2">
              <Button size="sm" disabled={saving || !replyDraft.trim()} onClick={() => void post(replyDraft, comment.id)}>Post reply</Button>
              <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {roots.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet. Start the discussion.</p> : roots.map((root) => (
        <div key={root.id} className="space-y-4 rounded-lg border bg-background p-4">
          {renderComment(root)}
          {comments.filter((comment) => comment.parent_id === root.id).map((reply) => renderComment(reply, true))}
        </div>
      ))}
      {currentUserId ? (
        <div className="space-y-2">
          <Textarea aria-label="Add a comment" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} rows={3} placeholder="Ask a question, add context, or share a tradeoff…" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Commenting as {displayName}</p>
            <Button size="sm" disabled={saving || !draft.trim()} onClick={() => void post(draft, null)}>Post comment</Button>
          </div>
        </div>
      ) : <Button size="sm" variant="outline" onClick={onRequireAuth}><LogIn className="mr-2 h-4 w-4" />Sign in to join the discussion</Button>}
    </div>
  );
}
