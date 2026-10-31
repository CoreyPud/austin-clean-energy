import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Download, RefreshCw, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RebateDetailsForm from "@/components/assessment/RebateDetailsForm";
import { rebateRequest, type RebateSummary, type RebateDetails } from "@/lib/rebate-applications";
import { toast } from "sonner";
export default function AdminRebateApplications() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<RebateSummary[]>([]);
  const [selected, setSelected] = useState<(RebateSummary & { details: RebateDetails }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmExport, setConfirmExport] = useState(false);
  const reload = async () => { const data = await rebateRequest({ action: "list" }, true); setRows(data.applications); };
  useEffect(() => { if (!sessionStorage.getItem("admin_token")) { navigate("/admin"); return; } reload().catch(() => toast.error("Unable to load applications. Sign in again if your session expired.")); }, []);
  const open = async (row: RebateSummary) => { setBusy(true); setConfirmExport(false); try { const data = await rebateRequest({ action: "get", id: row.id }, true); setSelected({ ...row, ...data.application }); } catch { toast.error("Unable to open application"); } finally { setBusy(false); } };
  const download = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const token = sessionStorage.getItem("admin_token");
      if (!token) throw new Error("Sign in required");
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rebate-applications`, { method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ action: "export", id: selected.id }) });
      if (!res.ok) throw new Error("Export failed. Reload the application and check its review status.");
      const url = URL.createObjectURL(await res.blob()); const a = document.createElement("a"); a.href = url; a.download = `rebate-application-${selected.id}.csv`; a.click(); URL.revokeObjectURL(url);
      setSelected({ ...selected, status: "exported" }); setConfirmExport(false); await reload(); toast.success("Application worksheet downloaded");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Unable to export"); } finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-background"><div className="max-w-6xl mx-auto px-4 py-8"><Button asChild variant="ghost" className="mb-6"><Link to="/admin/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back to Admin Dashboard</Link></Button><div className="flex flex-wrap items-center justify-between gap-4 mb-6"><h1 className="text-3xl font-bold">Rebate applications</h1><Button variant="outline" disabled={busy} onClick={() => reload().catch(() => toast.error("Unable to refresh"))}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button></div><p className="text-muted-foreground text-sm mb-6 flex gap-2"><LockKeyhole className="h-4 w-4 shrink-0" />Only owner-authorized applications appear. Views and exports are recorded.</p>
    <div className="overflow-x-auto mb-8"><Table><TableHeader><TableRow><TableHead>Program</TableHead><TableHead>Status</TableHead><TableHead>Updated</TableHead><TableHead>Review</TableHead></TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.id}><TableCell>{row.program}</TableCell><TableCell>{row.status.replace(/_/g, " ")}</TableCell><TableCell>{new Date(row.updated_at).toLocaleDateString()}</TableCell><TableCell><Button variant="outline" size="sm" disabled={busy} onClick={() => open(row)}>Review</Button></TableCell></TableRow>)}</TableBody></Table>{rows.length === 0 && <p className="py-8 text-muted-foreground">No authorized applications awaiting review.</p>}</div>
    {selected && <section className="border-t pt-6 space-y-6"><h2 className="text-xl font-semibold">{selected.program} · {selected.status.replace(/_/g, " ")}</h2><RebateDetailsForm value={selected.details} readOnly /><p className="text-sm text-muted-foreground">Verify applicant details against the bill and obtain any required project documents and signatures. CSV is a worksheet, not an official submission. Export does not send anything to Austin Energy.</p><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={busy || selected.status !== "review_requested"} onClick={async () => { try { await rebateRequest({ action: "ready", id: selected.id }, true); setSelected({ ...selected, status: "ready" }); await reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Unable to mark ready"); } }}><CheckCircle className="h-4 w-4 mr-2" />Mark reviewed and ready</Button><Button disabled={busy || !["ready", "exported"].includes(selected.status)} onClick={() => setConfirmExport(true)}><Download className="h-4 w-4 mr-2" />Export application CSV</Button></div>{confirmExport && <div className="border-t pt-4 space-y-3"><p className="text-sm">This download contains names, addresses and account numbers. Store it securely and share only with authorized recipients.</p><div className="flex gap-3"><Button disabled={busy} onClick={download}>Confirm private download</Button><Button variant="ghost" onClick={() => setConfirmExport(false)}>Cancel</Button></div></div>}</section>}
  </div></main>;
}