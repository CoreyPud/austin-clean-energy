import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, Plus, Save, Send, Trash2, ArrowLeft } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import BillUpload from "@/components/assessment/BillUpload";
import RebateDetailsForm from "@/components/assessment/RebateDetailsForm";
import { emptyRebate, rebatePrograms, rebateRequest, type RebateDetails, type RebateSummary } from "@/lib/rebate-applications";
import { useSeo } from "@/hooks/use-seo";
import { toast } from "sonner";
import RebateProjectImport from "@/components/assessment/RebateProjectImport";
import { mergeMissing, solarFormRoute } from "../../supabase/functions/_shared/rebate-form-model";
export default function RebateApplications() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rows, setRows] = useState<RebateSummary[]>([]);
  const [id, setId] = useState<string | null>(null);
  const [program, setProgram] = useState(rebatePrograms[0]);
  const [details, setDetails] = useState<RebateDetails>({ ...emptyRebate });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("draft");
  const updateDetails = (next: RebateDetails) => { setDetails(next); const route = solarFormRoute(next); if (route.program && program !== "Commercial property improvements") setProgram(route.program); };
  const importDetails = (incoming: Partial<RebateDetails>) => setDetails(current => { const next = mergeMissing<RebateDetails>(current, incoming); const route = solarFormRoute(next); if (route.program && program !== "Commercial property improvements") setProgram(route.program); return next; });
  useSeo({ title: "My rebate applications", description: "Private Austin Energy rebate application drafts and authorized review." });
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setAuthLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(current => {
      if (current?.id !== session?.user?.id) { setRows([]); setId(null); setDetails({ ...emptyRebate }); setConsent(false); }
      return session?.user ?? null;
    }); });
    return () => data.subscription.unsubscribe();
  }, []);
  const reload = async () => { const data = await rebateRequest({ action: "list" }); setRows(data.applications); };
  useEffect(() => { if (user) reload().catch(() => toast.error("Unable to load applications")); }, [user?.id]);
  const reset = () => { setId(null); setDetails({ ...emptyRebate }); setConsent(false); setStatus("draft"); };
  const save = async (review: boolean) => {
    setBusy(true);
    try { const result = await rebateRequest({ action: "save", id, program, details, request_review: review, consent }); setId(result.id); setStatus(review ? "review_requested" : "draft"); await reload(); toast.success(review ? "Review requested. Not yet submitted to Austin Energy." : "Private draft saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Unable to save"); } finally { setBusy(false); }
  };
  const open = async (row: RebateSummary) => {
    setBusy(true);
    try { const data = await rebateRequest({ action: "get", id: row.id }); setId(row.id); setProgram(data.application.program); setStatus(data.application.status); setDetails(data.application.details); setConsent(false); }
    catch { toast.error("Unable to open application"); } finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-background"><header className="bg-primary text-primary-foreground"><div className="max-w-6xl mx-auto px-4 py-7"><Button asChild variant="ghost" className="mb-4"><Link to="/property-assessment"><ArrowLeft className="h-4 w-4 mr-2" />Property assessment</Link></Button><h1 className="text-3xl font-bold">My rebate applications</h1></div></header>
    <div className="max-w-6xl mx-auto px-4 py-8">
      <p className="flex gap-2 text-sm text-muted-foreground mb-6"><LockKeyhole className="h-4 w-4 shrink-0" />Personal details are encrypted and excluded from public property shares. Original bill PDFs are not saved.</p>
      {authLoading ? <p>Loading…</p> : !user ? <div className="py-10"><h2 className="text-xl font-semibold mb-4">Sign in to save a private application</h2><Button onClick={async () => { const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/rebate-applications` }); if (result.error) toast.error("Unable to sign in"); }}>Continue with Google</Button></div> : <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside><div className="flex justify-between items-center mb-4"><h2 className="font-semibold">Saved applications</h2><Button variant="ghost" size="icon" title="New application" onClick={reset}><Plus className="h-4 w-4" /></Button></div>{rows.length === 0 && <p className="text-sm text-muted-foreground">No applications saved yet.</p>}<div className="space-y-2">{rows.map(row => <Button key={row.id} variant={id === row.id ? "secondary" : "outline"} className="w-full h-auto py-3 text-left justify-start whitespace-normal" disabled={busy} onClick={() => open(row)}><span>{row.program}<span className="block text-xs text-muted-foreground mt-1">{row.status.replace(/_/g, " ")} · {new Date(row.created_at).toLocaleDateString()}</span></span></Button>)}</div></aside>
        <section className="min-w-0 space-y-6"><div className="flex justify-between gap-3"><h2 className="text-xl font-semibold">{id ? "Application details" : "New application"}</h2><span className="text-sm text-muted-foreground">{status.replace(/_/g, " ")}</span></div>
          <div><Label>Rebate program</Label><Select value={program} onValueChange={setProgram}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{rebatePrograms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-3"><h3 className="font-medium">Austin Energy bill</h3><p className="text-sm text-muted-foreground">Optional: read your PDF to fill applicant details and usage. Check every extracted field before saving.</p><BillUpload key={`${id ?? "new"}-${user.id}`} applicationMode onResult={() => {}} onApplicationResult={data => setDetails(current => ({ ...current, ...Object.fromEntries(Object.entries(data.applicant ?? {}).filter(([, v]) => v)), months: data.raw_months ?? [], source: data.source }))} /></div>
          <RebateProjectImport key={user.id} address={details.service_address} onImport={importDetails} />
          <RebateDetailsForm value={details} onChange={updateDetails} />
          <div className="flex gap-3 items-start"><Checkbox id="rebate-consent" checked={consent} onCheckedChange={v => setConsent(v === true)} /><Label htmlFor="rebate-consent" className="leading-relaxed">I verified these details and authorize Austin Clean Energy administrators to review and export them for my Austin Energy application.</Label></div>
          <p className="text-sm text-muted-foreground">This is an application worksheet, not an official Austin Energy form. Program-specific documents, signatures and submission must be completed separately. Downloaded exports contain personal information.</p>
          <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={busy} onClick={() => save(false)}><Save className="h-4 w-4 mr-2" />Save private draft</Button><Button disabled={busy || !consent} onClick={() => save(true)}><Send className="h-4 w-4 mr-2" />Request admin review</Button>{id && <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" disabled={busy}><Trash2 className="h-4 w-4 mr-2" />Delete</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this application?</AlertDialogTitle><AlertDialogDescription>Saved applicant details will be deleted. Previously downloaded exports cannot be recalled.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={async () => { try { await rebateRequest({ action: "delete", id }); reset(); await reload(); toast.success("Application deleted"); } catch { toast.error("Unable to delete application"); } }}>Delete application</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}</div>
        </section></div>}
    </div></main>;
}