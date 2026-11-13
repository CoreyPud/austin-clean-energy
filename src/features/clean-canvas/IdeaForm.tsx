import { useState } from "react";
import { Link2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Json, TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLEAN_CANVAS_TOPICS, IDEA_LEVELS, describeIdea, detailsFromDescription, ideaDetailsSchema, ideaFromRow, ideaSchema, importedIdeaSchema, resourceSchema, type IdeaDetails, type CleanCanvasIdea, type CleanCanvasResource, type CleanCanvasTopic } from "./model";

interface Props {
  userId: string;
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  onSubmitted: (idea: CleanCanvasIdea) => void;
  idea?: CleanCanvasIdea;
}

export function IdeaForm({ userId, displayName, onDisplayNameChange, onSubmitted, idea }: Props) {
  const initialDetails = idea ? detailsFromDescription(idea.description) : {};
  const [title, setTitle] = useState(idea?.title ?? "");
  const [problem, setProblem] = useState(initialDetails.problem ?? "");
  const [solution, setSolution] = useState(initialDetails.solution ?? "");
  const [beneficiaries, setBeneficiaries] = useState(initialDetails.beneficiaries ?? "");
  const [tradeoffs, setTradeoffs] = useState(initialDetails.tradeoffs ?? "");
  const [level, setLevel] = useState<IdeaDetails["level"] | "">(initialDetails.level ?? "");
  const [topics, setTopics] = useState<CleanCanvasTopic[]>(idea ? CLEAN_CANVAS_TOPICS.filter((topic) => idea.topics.includes(topic)) : ["Energy supply"]);
  const [examplesElsewhere, setExamplesElsewhere] = useState(idea?.examples_elsewhere ?? "");
  const [resources, setResources] = useState<CleanCanvasResource[]>(idea?.resources ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  const importUrl = async () => {
    setImportError(null);
    const source = resourceSchema.safeParse({ label: "Source", url: sourceUrl });
    if (!source.success) { setImportError("Enter a complete HTTP or HTTPS webpage or public shared chat URL."); return; }
    if ((title.trim() || problem.trim() || solution.trim() || beneficiaries.trim() || tradeoffs.trim() || level || examplesElsewhere.trim()) && !window.confirm("Replace the title, idea details, level, topics and examples with a draft from this link?")) return;
    setImporting(true);
    try {
      const { data, error: readError } = await supabase.functions.invoke("clean-canvas-import", { body: { url: source.data.url } });
      if (readError) {
        if (readError instanceof FunctionsHttpError) {
          const body = await readError.context.json().catch(() => null);
          throw new Error(typeof body?.error === "string" ? body.error : "The webpage couldn't be read. Try a public share link.");
        }
        throw new Error("The webpage couldn't be read. Your current details have been kept.");
      }
      const draft = importedIdeaSchema.parse(data?.draft);
      const resource = resourceSchema.parse(data?.resource);
      const details = detailsFromDescription(draft.description);
      setTitle(draft.title); setProblem(details.problem ?? ""); setSolution(details.solution ?? "");
      setBeneficiaries(details.beneficiaries ?? ""); setTradeoffs(details.tradeoffs ?? ""); setLevel(details.level ?? "");
      setTopics(draft.topics); setExamplesElsewhere(draft.examples_elsewhere);
      setResources((current) => current.some((r) => r.url === resource.url) ? current : [...current.slice(0, 4), resource]);
      setImported(true);
    } catch (failure) { setImportError(failure instanceof Error ? failure.message : "The webpage couldn't be read."); }
    finally { setImporting(false); }
  };

  const updateResource = (index: number, patch: Partial<CleanCanvasResource>) => {
    setResources((current) => current.map((resource, i) => i === index ? { ...resource, ...patch } : resource));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const details = ideaDetailsSchema.safeParse({ problem, solution, beneficiaries, tradeoffs, level });
    if (!details.success) {
      setError(details.error.issues[0]?.message ?? "Check the idea details");
      return;
    }
    const draft = {
      title,
      description: describeIdea(details.data),
      topics,
      examples_elsewhere: examplesElsewhere,
      author_name: displayName,
      resources: resources.filter((resource) => resource.label.trim() || resource.url.trim()),
    };
    const parsed = ideaSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the idea details");
      return;
    }
    setSaving(true);
    try {
      const payload: TablesInsert<"clean_canvas_ideas"> = {
        author_id: userId,
        author_name: parsed.data.author_name,
        title: parsed.data.title,
        description: parsed.data.description,
        topic: parsed.data.topics[0] ?? "Other",
        topics: parsed.data.topics,
        examples_elsewhere: parsed.data.examples_elsewhere,
        resources: parsed.data.resources as Json,
      };
      const { author_id: _authorId, ...editable } = payload;
      const request = idea
        ? supabase.from("clean_canvas_ideas").update(editable).eq("id", idea.id).eq("author_id", userId)
        : supabase.from("clean_canvas_ideas").insert(payload);
      const { data, error: saveError } = await request.select("*").single();
      if (saveError) throw saveError;
      onSubmitted(ideaFromRow(data));
      toast.success(idea ? "Your idea has been updated" : "Your idea is now on Clean Canvas");
    } catch {
      setError(idea ? "We couldn't save your changes. Please try again." : "We couldn't publish the idea. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="idea-name">Your display name</Label>
          <Input id="idea-name" value={displayName} onChange={(e) => onDisplayNameChange(e.target.value)} maxLength={80} autoComplete="name" required />
          <p className="text-xs text-muted-foreground">Shown with your ideas and comments. Don't use your email address.</p>
        </div>
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Topics</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {CLEAN_CANVAS_TOPICS.map((item, index) => (
            <div key={item} className="flex items-start gap-2">
              <Checkbox id={`idea-topic-${index}`} checked={topics.includes(item)} onCheckedChange={(checked) => setTopics((current) => checked === true ? [...current, item] : current.filter((topic) => topic !== item))} />
              <Label htmlFor={`idea-topic-${index}`} className="min-w-0 leading-5">{item}</Label>
            </div>
          ))}
        </div>
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="idea-title">Idea title</Label>
        <Input id="idea-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="What should Austin try?" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="idea-level">Idea level</Label>
        <Select value={level} onValueChange={(value) => { const selected = IDEA_LEVELS.find((item) => item.value === value); if (selected) setLevel(selected.value); }}>
          <SelectTrigger id="idea-level"><SelectValue placeholder="Select a level" /></SelectTrigger>
          <SelectContent>{IDEA_LEVELS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2 border-b pb-5">
        <Label htmlFor="idea-source">Webpage or public AI chat URL</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="idea-source" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} maxLength={1000} placeholder="https://…" disabled={importing} />
          <Button type="button" variant="outline" disabled={importing || saving || !sourceUrl.trim()} onClick={() => void importUrl()}><Link2 className="mr-2 h-4 w-4" />{importing ? "Reading link…" : "Fill from link"}</Button>
        </div>
        {importError && <p role="alert" className="text-sm text-destructive">{importError}</p>}
        {imported && <p role="status" className="text-xs text-muted-foreground">AI-generated draft from your source. Verify the facts and examples before publishing.</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { id: "problem", label: "What is the problem?", value: problem, set: setProblem },
          { id: "solution", label: "What is the solution?", value: solution, set: setSolution },
          { id: "beneficiaries", label: "Who would it help?", value: beneficiaries, set: setBeneficiaries },
          { id: "tradeoffs", label: "Are there any tradeoffs?", value: tradeoffs, set: setTradeoffs },
        ].map((field) => <div key={field.id} className="space-y-2">
          <Label htmlFor={`idea-${field.id}`}>{field.label}</Label>
          <Textarea id={`idea-${field.id}`} value={field.value} onChange={(e) => field.set(e.target.value)} maxLength={4000} rows={3} required />
        </div>)}
      </div>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="idea-examples">Where else in the country or world is this done? <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Textarea id="idea-examples" value={examplesElsewhere} onChange={(e) => setExamplesElsewhere(e.target.value)} maxLength={4000} rows={3} placeholder="Name the places or programs and describe their experience." />
        </div>
        <div>
          <Label>Supporting resources <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <p className="mt-1 text-xs text-muted-foreground">Add up to five links to research, examples, official documents, or other useful context.</p>
        </div>
        {resources.map((resource, index) => (
          <div key={index} className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[1fr_1.4fr_auto]">
            <Input aria-label={`Resource ${index + 1} label`} value={resource.label} onChange={(e) => updateResource(index, { label: e.target.value })} maxLength={120} placeholder="Resource label" />
            <Input aria-label={`Resource ${index + 1} URL`} type="url" value={resource.url} onChange={(e) => updateResource(index, { url: e.target.value })} maxLength={1000} placeholder="https://example.org/research" />
            <Button type="button" variant="ghost" size="icon" onClick={() => setResources((current) => current.filter((_, i) => i !== index))} aria-label={`Remove resource ${index + 1}`}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {resources.length < 5 && <Button type="button" variant="outline" size="sm" onClick={() => setResources((current) => [...current, { label: "", url: "" }])}><Link2 className="mr-2 h-4 w-4" /><Plus className="mr-1 h-3 w-3" />Add supporting link</Button>}
      </div>
      <p className="rounded-md bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">Post constructively and focus on the idea. Your submission will be public; you can delete it later.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={saving || importing}>{saving ? (idea ? "Saving…" : "Publishing…") : (idea ? "Save changes" : "Publish idea")}</Button>
    </form>
  );
}
