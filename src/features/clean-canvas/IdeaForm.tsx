import { useState } from "react";
import { Link2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json, TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CLEAN_CANVAS_TOPICS, ideaFromRow, ideaSchema, type CleanCanvasIdea, type CleanCanvasResource, type CleanCanvasTopic } from "./model";

interface Props {
  userId: string;
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  onSubmitted: (idea: CleanCanvasIdea) => void;
}

export function IdeaForm({ userId, displayName, onDisplayNameChange, onSubmitted }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState<CleanCanvasTopic[]>(["Energy supply"]);
  const [examplesElsewhere, setExamplesElsewhere] = useState("");
  const [resources, setResources] = useState<CleanCanvasResource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateResource = (index: number, patch: Partial<CleanCanvasResource>) => {
    setResources((current) => current.map((resource, i) => i === index ? { ...resource, ...patch } : resource));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const draft = {
      title,
      description,
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
      const { data, error: saveError } = await supabase
        .from("clean_canvas_ideas")
        .insert(payload)
        .select("*")
        .single();
      if (saveError) throw saveError;
      onSubmitted(ideaFromRow(data));
      toast.success("Your idea is now on Clean Canvas");
    } catch {
      setError("We couldn't publish the idea. Please try again.");
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
        <Label htmlFor="idea-description">Explain the idea</Label>
        <Textarea id="idea-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} rows={6} placeholder="What problem would it solve, who would it help, and what might the tradeoffs be?" required />
        <p className="text-right text-xs text-muted-foreground">{description.length}/4,000</p>
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
      <Button type="submit" className="w-full" disabled={saving}>{saving ? "Publishing…" : "Publish idea"}</Button>
    </form>
  );
}
