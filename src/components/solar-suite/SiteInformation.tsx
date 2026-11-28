import { useEffect, useRef, useState } from "react";
import { Camera, Check, Download, FileText, Loader2, LogIn, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useCourseAuth } from "@/hooks/use-course-auth";
import { useSharedProject } from "@/lib/shared-project";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE_BUCKET, SITE_CATEGORIES, SITE_FILE_TYPES, readSiteNotes, siteFolder, validateSiteFile, type SiteCategory } from "./site-intake-model";
import { loadSiteFiles, loadSiteNotes, saveSiteNotes, type SiteFile } from "./site-intake-api";

function SiteForm({ userId, savedId }: { userId: string | null; savedId: string | null }) {
  const [notes, setNotes] = useState(() => readSiteNotes(null));
  const [files, setFiles] = useState<SiteFile[]>([]);
  const [loading, setLoading] = useState(Boolean(userId && savedId));
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputs = useRef<Partial<Record<SiteCategory, HTMLInputElement | null>>>({});
  const canEdit = Boolean(userId && savedId && !loading && !error);

  useEffect(() => {
    if (!userId || !savedId) return;
    let cancelled = false;
    Promise.all([loadSiteNotes(savedId), loadSiteFiles(userId, savedId)])
      .then(([nextNotes, nextFiles]) => { if (!cancelled) { setNotes(nextNotes); setFiles(nextFiles); } })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, savedId]);

  async function save() {
    if (!userId || !savedId || !canEdit) return;
    setBusy("save");
    try {
      await saveSiteNotes(userId, savedId, notes);
      setDirty(false); setSaved(true);
      toast.success("Site notes saved");
    } catch { toast.error("Site notes could not be saved. Your entries are still here; please try again."); }
    finally { setBusy(null); }
  }

  async function upload(category: SiteCategory, selected: FileList | null) {
    if (!userId || !savedId || !selected?.length || !canEdit) return;
    const chosen = Array.from(selected);
    const invalid = chosen.map(validateSiteFile).find(Boolean);
    if (invalid) { toast.error(invalid); return; }
    setBusy(category);
    let completed = 0;
    try {
      for (const file of chosen) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(-150);
        const path = `${siteFolder(userId, savedId, category)}/${crypto.randomUUID()}_${cleanName}`;
        const { error } = await supabase.storage.from(SITE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        completed++;
      }
      toast.success(`${completed} ${completed === 1 ? "file" : "files"} uploaded privately`);
    } catch { toast.error(`Upload interrupted. ${completed} ${completed === 1 ? "file was" : "files were"} saved; please retry the remaining files.`); }
    finally {
      try { setFiles(await loadSiteFiles(userId, savedId)); }
      catch { toast.error("Could not refresh uploaded files. Close and reopen site information to try again."); }
      setBusy(null);
    }
  }

  async function remove(file: SiteFile) {
    setBusy(file.path);
    try {
      const { error } = await supabase.storage.from(SITE_BUCKET).remove([file.path]);
      if (error) throw error;
      setFiles(current => current.filter(f => f.path !== file.path));
      toast.success("File removed");
    } catch { toast.error("Could not remove this file. Please try again."); }
    finally { setBusy(null); }
  }

  async function download(file: SiteFile) {
    setBusy(file.path);
    try {
      const { data, error } = await supabase.storage.from(SITE_BUCKET).download(file.path);
      if (error || !data) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast.error("Could not download this file. Please try again."); }
    finally { setBusy(null); }
  }

  return <>
    {!savedId && <p className="rounded-md border border-border bg-muted p-3 text-sm">Open Solar Suite from <Link className="text-primary underline" to="/solar-savings-austin">My saved properties on Solar Potential</Link> to attach site information to a property.</p>}
    {!userId && savedId && <div className="flex flex-wrap items-center gap-3 text-sm"><span>Sign in to save private site information.</span><Button variant="outline" size="sm" onClick={async () => { try { const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.href }); if (result.error) toast.error("Unable to sign in right now."); } catch { toast.error("Unable to sign in right now."); } }}><LogIn /> Sign in</Button></div>}
    {loading && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading site information…</p>}
    {error && <p role="alert" className="text-sm text-destructive">Site information could not be loaded. Check that you own this saved property, then close and reopen this window.</p>}
    <div className="divide-y divide-border">
      {SITE_CATEGORIES.map(({ key, label, question }) => <section key={key} className="space-y-3 py-5">
        <h3 className="font-semibold">{label}</h3>
        <Label htmlFor={`site-${key}`} className="block text-sm font-normal leading-relaxed">{question}</Label>
        <Textarea id={`site-${key}`} value={notes[key]} disabled={!canEdit || Boolean(busy)} maxLength={10000} rows={3} onChange={event => { setNotes(current => ({ ...current, [key]: event.target.value })); setDirty(true); setSaved(false); }} />
        <input ref={element => { inputs.current[key] = element; }} type="file" accept={SITE_FILE_TYPES.join(",")} multiple className="hidden" aria-label={`Upload ${label.toLowerCase()}`} onChange={event => { void upload(key, event.target.files); event.target.value = ""; }} />
        <Button variant="outline" size="sm" disabled={!canEdit || Boolean(busy)} onClick={() => inputs.current[key]?.click()}>{busy === key ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {key === "bill" ? "Upload utility bill" : `Upload ${label.toLowerCase()} photos`}</Button>
        <div className="grid gap-2 sm:grid-cols-2">
          {files.filter(f => f.category === key).map(file => <div key={file.path} className="flex min-w-0 items-center gap-2 rounded-md border border-border p-2">
            {file.isImage && file.url ? <img src={file.url} alt={`${label} photo`} className="h-14 w-14 shrink-0 rounded object-cover" /> : <FileText className="size-8 shrink-0 text-muted-foreground" />}
            <span className="min-w-0 flex-1 break-all text-xs">{file.name}</span>
            <Button variant="ghost" size="icon" title={`Download ${file.name}`} aria-label={`Download ${file.name}`} disabled={Boolean(busy)} onClick={() => void download(file)}><Download className="size-4" /></Button>
            <Button variant="ghost" size="icon" title={`Remove ${file.name}`} aria-label={`Remove ${file.name}`} disabled={Boolean(busy)} onClick={() => void remove(file)}><Trash2 className="size-4" /></Button>
          </div>)}
        </div>
      </section>)}
    </div>
    <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background py-3">
      <span role="status" className="text-xs text-muted-foreground">{dirty ? "Unsaved notes" : saved ? "Notes saved" : "Private • Photos and PDFs • 20 MB per file"}</span>
      <Button disabled={!canEdit || Boolean(busy) || !dirty} onClick={() => void save()}>{busy === "save" ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : <Save className="size-4" />} Save site notes</Button>
    </div>
  </>;
}

export function SiteInformation() {
  const { project } = useSharedProject();
  const { user, loading } = useCourseAuth();
  return <Dialog>
    <DialogTrigger asChild><Button variant="outline" size="sm"><Camera className="size-4" /> Site information &amp; photos</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>Site information &amp; photos</DialogTitle><DialogDescription>{project.address} · Private to your account; not included in public property shares.</DialogDescription></DialogHeader>
      {!loading && <SiteForm key={`${user?.id ?? "guest"}:${project.savedId ?? "unlinked"}`} userId={user?.id ?? null} savedId={project.savedId} />}
    </DialogContent>
  </Dialog>;
}