import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RebateDetails } from "@/lib/rebate-applications";
import RebateSolarFields from "./RebateSolarFields";
const fields = [["customer_name", "Customer name"], ["service_address", "Service address"], ["account_number", "Austin Energy account number"], ["email", "Contact email"], ["phone", "Phone"]] as const;
export default function RebateDetailsForm({ value, onChange, readOnly = false }: { value: RebateDetails; onChange?: (v: RebateDetails) => void; readOnly?: boolean }) {
  return <div className="space-y-5">
    <div className="grid sm:grid-cols-2 gap-4">{fields.map(([key, label]) => <div key={key} className="space-y-2">
      <Label htmlFor={`rebate-${key}`}>{label}{key !== "phone" && " *"}</Label>
      <Input id={`rebate-${key}`} type={key === "email" ? "email" : "text"} value={value[key]} readOnly={readOnly} autoComplete="off" maxLength={2000} onChange={e => onChange?.({ ...value, [key]: e.target.value })} />
    </div>)}</div>
    <div className="space-y-2"><Label htmlFor="rebate-project_description">Project description *</Label><Textarea id="rebate-project_description" value={value.project_description} readOnly={readOnly} maxLength={2000} onChange={e => onChange?.({ ...value, project_description: e.target.value })} /></div>
    {value.months.length > 0 && <div><h3 className="font-medium mb-2">Bill usage · {value.source}</h3><p className="text-sm text-muted-foreground mb-2">Bill reading can be approximate. Verify these values against the original statement.</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{value.months.map((month, i) => <div key={i}><Label htmlFor={`rebate-month-${i}`} className="text-xs">{month.label} · kWh</Label><Input id={`rebate-month-${i}`} type="number" min={0} value={month.kwh} readOnly={readOnly} onChange={e => { const months = value.months.map((m, j) => j === i ? { ...m, kwh: Number(e.target.value) } : m); onChange?.({ ...value, months }); }} /></div>)}</div></div>}
    <RebateSolarFields value={value} onChange={onChange} readOnly={readOnly} />
  </div>;
}