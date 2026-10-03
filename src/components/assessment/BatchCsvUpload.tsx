import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileUp, Loader2, Square } from "lucide-react";
import { toast } from "sonner";

const MAX_ROWS = 100;
const DELAY_MS = 10_000;

type BatchRow = {
  address: string;
  propertyType: string; // single-family | commercial | non-profit
  billingMode: "sso" | "vos";
};

type RowStatus = { address: string; state: "pending" | "running" | "done" | "error"; message?: string };

/** Minimal CSV parser with quoted-field support. */
function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.trim())) out.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim())) out.push(row);
  return out;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function toBatchRows(table: string[][]): { rows: BatchRow[]; skipped: number } {
  if (table.length === 0) return { rows: [], skipped: 0 };
  const header = table[0].map(norm);
  const find = (...keys: string[]) => header.findIndex((h) => keys.some((k) => h.includes(k)));
  let addrIdx = find("address", "addr");
  const hasHeader = addrIdx !== -1;
  if (!hasHeader) addrIdx = 0;
  const billIdx = hasHeader ? find("billing", "program", "offer", "valueofsolar", "vos", "sso", "rate") : -1;
  const typeIdx = hasHeader ? find("propertytype", "type", "commercial", "residential", "sector") : -1;
  const orgIdx = hasHeader ? find("profit", "nonprofit", "org", "taxstatus") : -1;

  const body = hasHeader ? table.slice(1) : table;
  const rows: BatchRow[] = [];
  let skipped = 0;
  for (const r of body) {
    const address = (r[addrIdx] ?? "").trim();
    if (!/^\d+\s+\S/.test(address) || address.length > 200 || /[<>{}]/.test(address)) { skipped++; continue; }
    const bill = norm(r[billIdx] ?? "");
    const billingMode: "sso" | "vos" = /vos|value/.test(bill) ? "vos" : "sso";
    const type = norm(r[typeIdx] ?? "");
    const org = norm(r[orgIdx] ?? "");
    const isNonprofit = /nonprofit|notforprofit/.test(org) || /nonprofit/.test(type);
    const isCommercial = /comm|business/.test(type);
    const propertyType = isNonprofit ? "non-profit" : isCommercial ? "commercial" : "single-family";
    rows.push({ address: /austin|tx|\b7\d{4}\b/i.test(address) ? address : `${address}, Austin, TX`, propertyType, billingMode });
  }
  return { rows, skipped };
}

interface Props {
  userId: string;
  onFinished: () => void;
}

const BatchCsvUpload = ({ userId, onFinished }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const stopRef = useRef(false);
  const [statuses, setStatuses] = useState<RowStatus[]>([]);
  const [running, setRunning] = useState(false);

  const setStatus = (i: number, s: Partial<RowStatus>) =>
    setStatuses((prev) => prev.map((p, j) => (j === i ? { ...p, ...s } : p)));

  const run = async (rows: BatchRow[]) => {
    stopRef.current = false;
    setRunning(true);
    setStatuses(rows.map((r) => ({ address: r.address, state: "pending" })));
    for (let i = 0; i < rows.length; i++) {
      if (stopRef.current) break;
      if (i > 0) {
        await new Promise((res) => setTimeout(res, DELAY_MS));
        if (stopRef.current) break;
      }
      const row = rows[i];
      setStatus(i, { state: "running" });
      try {
        const { data, error } = await supabase.functions.invoke("unified-assessment", {
          body: { address: row.address, propertyType: row.propertyType },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        const address: string = data?.address || row.address;
        const calculator_state = { billingMode: row.billingMode, maxFit: true, financeMode: "cash", billViewMode: "estimate" };
        const { data: existing } = await supabase
          .from("saved_assessments").select("id").ilike("address", address).limit(1);
        const payload = { address, property_type: row.propertyType, calculator_state, results: data };
        const { error: saveErr } = existing?.[0]
          ? await supabase.from("saved_assessments").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", existing[0].id)
          : await supabase.from("saved_assessments").insert({ ...payload, user_id: userId });
        if (saveErr) throw new Error(saveErr.message);
        setStatus(i, { state: "done" });
      } catch (e: any) {
        setStatus(i, { state: "error", message: e?.message || "Failed" });
      }
    }
    setRunning(false);
    onFinished();
    toast.success(stopRef.current ? "Batch stopped" : "Batch finished");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const { rows, skipped } = toBatchRows(parseCsv(await file.text()));
    if (rows.length === 0) return toast.error("No valid street addresses found in that file.");
    if (rows.length > MAX_ROWS) toast(`Only the first ${MAX_ROWS} addresses will be run.`);
    if (skipped) toast(`${skipped} row${skipped === 1 ? "" : "s"} skipped (not a full street address).`);
    run(rows.slice(0, MAX_ROWS));
  };

  const done = statuses.filter((s) => s.state === "done" || s.state === "error").length;
  const errors = statuses.filter((s) => s.state === "error");

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="text-sm font-medium text-foreground">Upload a list of addresses</div>
      <p className="text-xs text-muted-foreground">
        CSV with an <b>address</b> column (up to {MAX_ROWS}). Optional columns: <b>billing</b> (Standard Offer or
        Value of Solar — defaults to Standard Offer), <b>type</b> (residential or commercial), and{" "}
        <b>profit</b> (for-profit or nonprofit). Each is sized to the most solar that fits the roof and saved
        here. Runs about one address every 10 seconds — keep this tab open.
      </p>
      <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
      {!running ? (
        <Button variant="outline" size="sm" className="gap-2" onClick={() => inputRef.current?.click()}>
          <FileUp className="h-4 w-4" /> Upload CSV
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="gap-2" onClick={() => { stopRef.current = true; }}>
          <Square className="h-3.5 w-3.5" /> Stop after current
        </Button>
      )}
      {statuses.length > 0 && (
        <div className="space-y-1.5">
          <Progress value={(done / statuses.length) * 100} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {running && <Loader2 className="h-3 w-3 animate-spin" />}
            {done} of {statuses.length} done{errors.length ? ` · ${errors.length} failed` : ""}
          </div>
          {errors.length > 0 && (
            <ul className="max-h-28 overflow-y-auto text-xs text-destructive space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e.address}: {e.message}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchCsvUpload;
