import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, ExternalLink, Lightbulb, LogIn, LogOut, MessageSquare, Pencil, Plus, Search, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useSeo } from "@/hooks/use-seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Discussion } from "@/features/clean-canvas/Discussion";
import { IdeaForm } from "@/features/clean-canvas/IdeaForm";
import { HotTopics } from "@/features/clean-canvas/HotTopics";
import { CLEAN_CANVAS_TOPICS, filterAndSortIdeas, ideaFromRow, ideaDisplayDate, nextVote, type CleanCanvasComment, type CleanCanvasIdea, type IdeaSort, type VoteChoice } from "@/features/clean-canvas/model";

function defaultDisplayName(user: User): string {
  const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
  const candidate = String(metadataName || user.email?.split("@")[0] || "Neighbor").trim();
  return candidate.length >= 2 ? candidate.slice(0, 80) : "Neighbor";
}

export default function CleanCanvas() {
  useSeo({
    title: "Clean Canvas — Community Ideas for Austin",
    description: "Share clean energy ideas for Austin, add supporting resources, vote on proposals, and join constructive community discussions.",
  });

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("Neighbor");
  const [ideas, setIdeas] = useState<CleanCanvasIdea[]>([]);
  const [hotSupported, setHotSupported] = useState<CleanCanvasIdea[]>([]);
  const [hotOpposed, setHotOpposed] = useState<CleanCanvasIdea[]>([]);
  const [comments, setComments] = useState<CleanCanvasComment[]>([]);
  const [votes, setVotes] = useState<Record<string, VoteChoice>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [sort, setSort] = useState<IdeaSort>("supported");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<CleanCanvasIdea | null>(null);
  const [openDiscussions, setOpenDiscussions] = useState<Set<string>>(new Set());
  const [pendingVote, setPendingVote] = useState<string | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) setDisplayName(defaultDisplayName(user));
    else {
      setVotes({});
      setComposerOpen(false);
      setEditingIdea(null);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPage = useCallback(async () => {
    setLoadError(null);
    try {
      const { data: rows, error } = await supabase
        .from("clean_canvas_ideas")
        .select("*")
        .eq("visible", true)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const nextIdeas = (rows ?? []).map(ideaFromRow);
      const ids = nextIdeas.map((idea) => idea.id);
      const [commentResult, voteResult] = await Promise.all([
        ids.length
          ? supabase.from("clean_canvas_comments").select("*").in("idea_id", ids).order("created_at", { ascending: true }).limit(2000)
          : Promise.resolve({ data: [] as CleanCanvasComment[], error: null }),
        userId
          ? supabase.from("clean_canvas_votes").select("idea_id, choice")
          : Promise.resolve({ data: [] as { idea_id: string; choice: string }[], error: null }),
      ]);
      if (commentResult.error) throw commentResult.error;
      if (voteResult.error) throw voteResult.error;
      setIdeas(nextIdeas);
      const [supported, opposed] = await Promise.all([
        supabase.from("clean_canvas_ideas").select("*").eq("visible", true).gt("support_count", 0).order("support_count", { ascending: false }).order("created_at", { ascending: false }).order("id").limit(5),
        supabase.from("clean_canvas_ideas").select("*").eq("visible", true).gt("oppose_count", 0).order("oppose_count", { ascending: false }).order("created_at", { ascending: false }).order("id").limit(5),
      ]);
      if (supported.error || opposed.error) throw supported.error ?? opposed.error;
      setHotSupported((supported.data ?? []).map(ideaFromRow));
      setHotOpposed((opposed.data ?? []).map(ideaFromRow));
      setComments(commentResult.data ?? []);
      setVotes(Object.fromEntries((voteResult.data ?? []).map((vote) => [vote.idea_id, vote.choice === "support" ? "support" : "oppose"])));
    } catch {
      setLoadError("Clean Canvas couldn't load right now. Please refresh to try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void loadPage(); }, [loadPage]);

  const signIn = useCallback(async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/clean-canvas` });
    if (result.error) toast.error("Unable to sign in with Google right now");
  }, []);

  const openComposer = () => {
    if (!userId) return void signIn();
    setEditingIdea(null);
    setComposerOpen(true);
  };

  const castVote = async (idea: CleanCanvasIdea, choice: VoteChoice) => {
    if (!userId) return void signIn();
    const previous = votes[idea.id] ?? null;
    const next = nextVote(previous, choice);
    setPendingVote(idea.id);
    try {
      if (next) {
        const { error } = await supabase.from("clean_canvas_votes").upsert({ idea_id: idea.id, user_id: userId, choice: next });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clean_canvas_votes").delete().match({ idea_id: idea.id, user_id: userId });
        if (error) throw error;
      }
      const { data, error } = await supabase.from("clean_canvas_ideas").select("support_count, oppose_count").eq("id", idea.id).single();
      if (error) throw error;
      setVotes((current) => {
        const updated = { ...current };
        if (next) updated[idea.id] = next;
        else delete updated[idea.id];
        return updated;
      });
      setIdeas((current) => current.map((item) => item.id === idea.id ? { ...item, ...data } : item));
      void loadPage();
    } catch {
      toast.error("Your vote couldn't be saved. Please try again.");
    } finally {
      setPendingVote(null);
    }
  };

  const refreshDiscussion = async (ideaId: string) => {
    const [commentResult, ideaResult] = await Promise.all([
      supabase.from("clean_canvas_comments").select("*").eq("idea_id", ideaId).order("created_at", { ascending: true }),
      supabase.from("clean_canvas_ideas").select("comment_count").eq("id", ideaId).single(),
    ]);
    if (commentResult.error) throw commentResult.error;
    if (ideaResult.error) throw ideaResult.error;
    setComments((current) => [...current.filter((comment) => comment.idea_id !== ideaId), ...(commentResult.data ?? [])]);
    setIdeas((current) => current.map((idea) => idea.id === ideaId ? { ...idea, comment_count: ideaResult.data.comment_count } : idea));
  };

  const deleteIdea = async (idea: CleanCanvasIdea) => {
    if (!window.confirm(`Delete "${idea.title}"? Its votes and discussion will also be deleted.`)) return;
    const { error } = await supabase.from("clean_canvas_ideas").delete().eq("id", idea.id);
    if (error) return toast.error("The idea couldn't be deleted");
    setIdeas((current) => current.filter((item) => item.id !== idea.id));
    setComments((current) => current.filter((comment) => comment.idea_id !== idea.id));
    toast.success("Idea deleted");
    void loadPage();
  };

  const visibleIdeas = useMemo(() => filterAndSortIdeas(ideas, { query, topic, sort }), [ideas, query, topic, sort]);
  const totalComments = ideas.reduce((sum, idea) => sum + idea.comment_count, 0);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="ghost" className="-ml-3 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/austin-at-a-glance"><ArrowLeft className="mr-2 h-4 w-4" />Austin at a Glance</Link>
            </Button>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-primary-foreground/80 sm:inline">Signed in as {displayName}</span>
                <Button variant="outline" size="sm" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => void supabase.auth.signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
              </div>
            ) : <Button variant="outline" size="sm" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => void signIn()}><LogIn className="mr-2 h-4 w-4" />Sign in to participate</Button>}
          </div>
          <div className="mt-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">A community idea exchange</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Clean Canvas</h1>
            <p className="mt-4 text-lg leading-relaxed text-primary-foreground/85">Sketch a better clean energy future for Austin. Share an idea, back it with useful resources, and learn from the discussion.</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 lg:py-12">
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20 text-accent-foreground"><Lightbulb className="h-5 w-5" /></div>
            <h2 className="mt-4 text-xl font-semibold">Add your perspective</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Propose a program, policy, pilot, or practical improvement. Explain the tradeoffs and include sources when you can.</p>
            <Button className="mt-5 w-full" onClick={openComposer}><Plus className="mr-2 h-4 w-4" />{userId ? "Share an idea" : "Sign in to share an idea"}</Button>
          </section>
          <section className="grid grid-cols-2 gap-3" aria-label="Community activity">
            <div className="rounded-lg border bg-muted/30 p-4"><p className="text-2xl font-bold">{ideas.length}</p><p className="text-xs text-muted-foreground">Ideas shared</p></div>
            <div className="rounded-lg border bg-muted/30 p-4"><p className="text-2xl font-bold">{totalComments}</p><p className="text-xs text-muted-foreground">Discussion posts</p></div>
          </section>
          <p className="text-xs leading-relaxed text-muted-foreground">Community votes are a conversation aid, not a scientific survey or an official City of Austin ballot. Individual votes are private; totals are public.</p>
        </aside>

        <section className="min-w-0">
          {!loading && !loadError && <HotTopics supported={hotSupported} opposed={hotOpposed} onSelect={(idea) => {
            setIdeas((current) => current.some((item) => item.id === idea.id) ? current : [idea, ...current]);
            setQuery(""); setTopic("");
            setOpenDiscussions((current) => new Set([...current, idea.id]));
            void refreshDiscussion(idea.id).catch(() => toast.error("Discussion couldn't be loaded."));
            requestAnimationFrame(() => document.getElementById(`idea-${idea.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
          }} />}
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ideas and resources" aria-label="Search ideas and resources" className="pl-9" />
            </div>
            <Select value={topic || "all"} onValueChange={(value) => setTopic(value === "all" ? "" : value)}>
              <SelectTrigger className="min-w-0 md:w-64" aria-label="Filter by topic"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All topics</SelectItem>{CLEAN_CANVAS_TOPICS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as IdeaSort)}>
              <SelectTrigger className="md:w-48" aria-label="Sort ideas"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="supported">Most supported</SelectItem><SelectItem value="newest">Newest first</SelectItem><SelectItem value="discussed">Most discussed</SelectItem></SelectContent>
            </Select>
          </div>

          {loadError && <div role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">{loadError}</div>}
          {loading ? <p className="py-16 text-center text-sm text-muted-foreground">Loading community ideas…</p> : !loadError && visibleIdeas.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed px-6 py-16 text-center">
              <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">{ideas.length ? "No ideas match these filters" : "The canvas is ready for its first idea"}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{ideas.length ? "Try a different search or topic." : "Start with a specific proposal, explain why it matters, and add a resource others can explore."}</p>
              {!ideas.length && <Button className="mt-5" onClick={openComposer}>Share the first idea</Button>}
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {visibleIdeas.map((idea) => {
                const currentVote = votes[idea.id] ?? null;
                const discussionOpen = openDiscussions.has(idea.id);
                return (
                  <article id={`idea-${idea.id}`} key={idea.id} className="scroll-mt-6 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap gap-2">{idea.topics.map((item) => <Badge key={item} variant="outline" className="whitespace-normal border-primary/25 bg-primary/5 text-primary">{item}</Badge>)}</div>
                      {idea.author_id === userId && <div className="flex shrink-0 items-center gap-1">
                        <Button variant="ghost" size="sm" aria-label={`Edit ${idea.title}`} onClick={() => { setEditingIdea(idea); setDisplayName(idea.author_name); setComposerOpen(true); }}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label={`Delete ${idea.title}`} onClick={() => void deleteIdea(idea)}><Trash2 className="h-4 w-4" /></Button>
                      </div>}
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight">{idea.title}</h2>
                    <p className="mt-2 text-xs text-muted-foreground">Shared by {idea.author_name} · {idea.edit_count > 0 ? "Updated " : ""}{new Date(ideaDisplayDate(idea)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {idea.edit_count} {idea.edit_count === 1 ? "edit" : "edits"}</p>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{idea.description}</p>
                    {idea.examples_elsewhere && <div className="mt-4">
                      <h3 className="text-sm font-semibold">Where else in the country or world is this done?</h3>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-foreground/90">{idea.examples_elsewhere}</p>
                    </div>}
                    {idea.resources.length > 0 && (
                      <div className="mt-5 rounded-lg bg-muted/40 p-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Supporting resources</h3>
                        <ul className="mt-2 space-y-2">
                          {idea.resources.map((resource) => <li key={resource.url}><a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-start gap-2 text-sm font-medium text-primary hover:underline"><ExternalLink className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-words">{resource.label}</span></a></li>)}
                        </ul>
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
                      <Button size="sm" variant={currentVote === "support" ? "default" : "outline"} aria-pressed={currentVote === "support"} disabled={pendingVote === idea.id} onClick={() => void castVote(idea, "support")}><ThumbsUp className="mr-2 h-4 w-4" />Support <span className="ml-1 font-semibold">{idea.support_count}</span></Button>
                      <Button size="sm" variant={currentVote === "oppose" ? "secondary" : "outline"} aria-pressed={currentVote === "oppose"} disabled={pendingVote === idea.id} onClick={() => void castVote(idea, "oppose")}><ThumbsDown className="mr-2 h-4 w-4" />Oppose <span className="ml-1 font-semibold">{idea.oppose_count}</span></Button>
                      <Button size="sm" variant="ghost" aria-expanded={discussionOpen} onClick={() => setOpenDiscussions((current) => { const next = new Set(current); if (next.has(idea.id)) next.delete(idea.id); else next.add(idea.id); return next; })}><MessageSquare className="mr-2 h-4 w-4" />{idea.comment_count} {idea.comment_count === 1 ? "comment" : "comments"}</Button>
                    </div>
                    {discussionOpen && (
                      <div className="mt-5 border-t pt-5">
                        <h3 className="mb-4 text-sm font-semibold">Discussion</h3>
                        <Discussion ideaId={idea.id} comments={comments.filter((comment) => comment.idea_id === idea.id)} currentUserId={userId} displayName={displayName} onRequireAuth={() => void signIn()} onChanged={() => refreshDiscussion(idea.id)} />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editingIdea ? "Edit idea" : "Share an idea"}</DialogTitle>
            <DialogDescription>Give the community enough detail to understand, evaluate, and discuss your proposal.</DialogDescription>
          </DialogHeader>
          {userId && <IdeaForm key={editingIdea?.id ?? "new"} idea={editingIdea ?? undefined} userId={userId} displayName={displayName} onDisplayNameChange={setDisplayName} onSubmitted={(idea) => { setIdeas((current) => editingIdea ? current.map((item) => item.id === idea.id ? idea : item) : [idea, ...current]); setComposerOpen(false); setEditingIdea(null); void loadPage(); }} />}
        </DialogContent>
      </Dialog>
    </main>
  );
}
