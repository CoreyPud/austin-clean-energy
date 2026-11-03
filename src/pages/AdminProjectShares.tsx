import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";

interface Share { id: string; token: string; recipient_name: string; recipient_email: string | null; saved_assessment_id: string; note: string | null; created_at: string; revoked_at: string | null }
interface Ev { share_id: string; event: string; detail: string | null; ip_address: string | null; user_agent: string | null; created_at: string }
interface Proj { id: string; address: string; label: string | null }

export default function AdminProjectShares() {
  const navigate = useNavigate();
  const [shares, setShares] = useState<Share[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [projects, setProjects] = useState<Proj[]>([]);
  const [form, setForm] = useState({ recipient_name: "", recipient_email: "", saved_assessment_id: "", note: "" });
  const [open, setOpen] = useState<string | null>(null);
  const token = sessionStorage.getItem("admin_token");

  const call = useCallback((body: object) => supabase.functions.invoke("project-shares", { body, headers: { "x-admin-token": token ?? "" } }), [token]);
  const load = useCallback(async () => {
    const { data, error } = await call({ action: "list" });
    if (error) { toast.error("Session expired"); navigate("/admin"); return; }
    setShares(data.shares); setEvents(data.events); setProjects(data.projects);
  }, [call, navigate]);

  useEffect(() => {
    const exp = sessionStorage.getItem("admin_token_expires");
    if (!token || !exp || new Date(exp) < new Date()) { navigate("/admin"); return; }
    load();
  }, [token, navigate, load]);

  const linkFor = (t: string) => `${window.location.origin}/p/${t}`;
  const copy = (t: string) => { navigator.clipboard.writeText(linkFor(t)); toast.success("Link copied"); };
  const create = async () => {
    const { data, error } = await call({ action: "create", ...form });
    if (error || !data?.share) return toast.error("Could not create link — name and project are required");
    copy(data.share.token); setForm({ recipient_name: "", recipient_email: "", saved_assessment_id: "", note: "" }); load();
  };
  const revoke = async (id: string) => { await call({ action: "revoke", id }); load(); };
  const projName = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.label || p.address])), [projects]);
  const byShare = useMemo(() => events.reduce<Record<string, Ev[]>>((m, e) => ((m[e.share_id] ??= []).push(e), m), {}), [events]);

  return (
    <main className="container max-w-5xl py-8 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}><ArrowLeft className="h-4 w-4 mr-2" />Back to dashboard</Button>
      <Card>
        <CardHeader><CardTitle>Create a personal project link</CardTitle><CardDescription>Each person gets their own link, so views and downloads show their name.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div><Label>Recipient name</Label><Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} /></div>
          <div><Label>Email (optional)</Label><Input type="email" value={form.recipient_email} onChange={(e) => setForm({ ...form, recipient_email: e.target.value })} /></div>
          <div><Label>Project</Label>
            <Select value={form.saved_assessment_id} onValueChange={(v) => setForm({ ...form, saved_assessment_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose a saved property" /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.label || p.address}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label>Note (optional)</Label><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          <Button className="md:col-span-2" onClick={create}>Create link and copy</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Links and activity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {shares.length === 0 && <p className="text-sm text-muted-foreground">No links yet.</p>}
          {shares.map((s) => {
            const ev = byShare[s.id] ?? [];
            const views = ev.filter((e) => e.event === "view"), dls = ev.filter((e) => e.event === "download");
            return (
              <div key={s.id} className="border rounded-md p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{s.recipient_name}</span>
                  {s.recipient_email && <span className="text-sm text-muted-foreground">{s.recipient_email}</span>}
                  <span className="text-sm">· {projName[s.saved_assessment_id] ?? "Project removed"}</span>
                  {s.revoked_at && <Badge variant="secondary">Turned off</Badge>}
                  <Badge variant="outline">{views.length} views</Badge><Badge variant="outline">{dls.length} downloads</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">Last seen {ev[0] ? new Date(ev[0].created_at).toLocaleString() : "never"}</span>
                </div>
                <div className="flex gap-2">
                  {!s.revoked_at && <Button size="sm" variant="outline" onClick={() => copy(s.token)}><Copy className="h-3 w-3 mr-1" />Copy link</Button>}
                  <Button size="sm" variant="ghost" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? "Hide" : "Show"} activity</Button>
                  {!s.revoked_at && <Button size="sm" variant="ghost" onClick={() => revoke(s.id)}>Turn off link</Button>}
                </div>
                {open === s.id && <ul className="text-xs space-y-1">{ev.length === 0 ? <li className="text-muted-foreground">No activity yet.</li> : ev.map((e, i) =>
                  <li key={i}>{new Date(e.created_at).toLocaleString()} — {e.event === "view" ? "Viewed" : `Downloaded ${e.detail ?? ""}`} <span className="text-muted-foreground">{e.ip_address ?? ""}</span></li>)}</ul>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </main>
  );
}
