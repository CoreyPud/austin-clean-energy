import { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { RebateDetails } from "@/lib/rebate-applications";
import { assessmentRebatePrefill } from "@/lib/rebate-prefill";
import { tcadAddressMatch } from "../../../supabase/functions/_shared/tcad-address";
import { normalizeSolarType } from "../../../supabase/functions/_shared/rebate-form-model";
import { toast } from "sonner";
export default function RebateProjectImport({ onImport, address }: { onImport: (v: Partial<RebateDetails>) => void; address: string }) {
  const [params] = useSearchParams();
  const location = useLocation();
  const design = location.state?.solarDesign as Partial<RebateDetails> | undefined;
  const [rows, setRows] = useState<{ id: string; address: string; property_type: string; calculator_state: unknown; results: unknown }[]>([]);
  const [selected, setSelected] = useState(params.get("saved") ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; supabase.auth.getUser().then(async ({ data: auth }) => {
    if (!auth.user) return;
    const { data, error } = await supabase.from("saved_assessments").select("id,address,property_type,calculator_state,results").eq("user_id", auth.user.id).order("updated_at", { ascending: false }).limit(100);
    if (active && !error) setRows(data ?? []);
  }); return () => { active = false; }; }, []);
  const applied = useRef<{ design: boolean; saved: string; tcad: string }>({ design: false, saved: "", tcad: "" });
  useEffect(() => {
    if (!design || applied.current.design) return;
    applied.current.design = true;
    const clean = Object.fromEntries(Object.entries(design).filter(([, v]) => v != null && v !== "" && v !== "Austin, Texas"));
    onImport(clean as Partial<RebateDetails>);
    toast.success("Solar layout details added to empty fields. Verify against the final design.");
  }, [design, onImport]);
  useEffect(() => {
    if (!selected || applied.current.saved === selected) return;
    const row = rows.find(r => r.id === selected);
    if (!row) return;
    applied.current.saved = selected;
    onImport(assessmentRebatePrefill(row));
    toast.success("Saved property details added to empty fields");
  }, [selected, rows, onImport]);
  useEffect(() => {
    const key = address.trim().toLowerCase();
    if (!key || applied.current.tcad === key || !tcadAddressMatch(address)) return;
    const t = setTimeout(() => { applied.current.tcad = key; void tcad(true); }, 800);
    return () => clearTimeout(t);
  }, [address]);
  const tcad = async (auto = false) => {
    const match = tcadAddressMatch(address);
    if (!match) { if (!auto) toast.error("Enter a complete service address first"); return; }
    setBusy(true);
    try {
      let q = supabase.from("tcad_properties").select("pid,property_type,py_owner_name").ilike("situs_address", match.pattern).limit(2);
      if (match.zip) q = q.eq("situs_zip", match.zip);
      const { data, error } = await q;
      if (error || data?.length !== 1) { if (!auto) toast.error("No unique TCAD match. Enter property details manually."); return; }
      onImport({ tcad_pid: data[0].pid, property_owner: data[0].py_owner_name ?? "", property_type: normalizeSolarType(data[0].property_type ?? "") });
      toast.success("TCAD details added to empty fields. Confirm the current owner.");
    } finally { setBusy(false); }
  };
  return <section className="border-t pt-5 space-y-3"><h3 className="font-semibold">Property and solar design</h3><div className="flex flex-col sm:flex-row gap-3 sm:items-end"><div className="flex-1 min-w-0"><Label>Saved property</Label><Select value={selected} onValueChange={setSelected}><SelectTrigger className="mt-2"><SelectValue placeholder="Choose a saved property" /></SelectTrigger><SelectContent>{rows.map(row => <SelectItem key={row.id} value={row.id}>{row.address}</SelectItem>)}</SelectContent></Select></div></div><Button variant="outline" disabled={!address || busy} onClick={() => tcad()}>Look up TCAD details again</Button><p className="text-xs text-muted-foreground">Assessment costs and production are estimates, not contractor quotes. TCAD cannot establish nonprofit status or account ownership.</p></section>;
}