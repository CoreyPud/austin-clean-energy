import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useSeo } from '@/hooks/use-seo';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { emptyPermitFilters, equipmentLabels, filterPermits, mergeFilterOptions, type PermitFilters, type SolarPermit } from '@/lib/solar-permits';
import { contractorTiming, sortContractors, MIN_VALID_APPLIED_TO_FINAL_DAYS, type ContractorSort, type ContractorTiming } from '@/lib/contractor-timing';

const COLS = 'id,project_id,permit_number,address,installed_kw,contractor_company,permit_class,status_current,applied_date,issued_date,completed_date,original_zip,council_district,description,total_job_valuation,link,has_correction';
const sortNames: Record<ContractorSort, string> = { issuedToFinal: 'Issued → final (median days)', appliedToIssued: 'Applied → issued (median days)', permits: 'Number of permits', totalKw: 'Total reported kW', contractor: 'Contractor name' };

function TimingChart({ title, data, field, count, color }: { title: string; data: ContractorTiming[]; field: 'appliedToIssued' | 'issuedToFinal'; count: 'appliedToIssuedCount' | 'issuedToFinalCount'; color: string }) {
  const rows = data.filter(d => d[field] !== null);
  return <section className="border border-border rounded-md p-4 space-y-2">
    <h2 className="text-lg font-semibold">{title}</h2>
    {rows.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No contractors with this timing match these filters.</p> :
      <div style={{ height: Math.max(200, rows.length * 28 + 40) }}><ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 48 }}>
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} label={{ value: 'Median days', position: 'insideBottom', offset: -2, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
          <YAxis type="category" dataKey="contractor" width={210} interval={0} tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} tickFormatter={(v: string) => v.length > 32 ? `${v.slice(0, 31)}…` : v} />
          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} formatter={(v: number, _n, item) => [`${v.toLocaleString()} days (median of ${(item.payload as ContractorTiming)[count].toLocaleString()} permits)`, title]} />
          <Bar dataKey={field} fill={color} radius={[0, 3, 3, 0]}><LabelList dataKey={field} position="right" fill="hsl(var(--foreground))" fontSize={11} /></Bar>
        </BarChart>
      </ResponsiveContainer></div>}
  </section>;
}

export default function ContractorPermitTiming() {
  useSeo({ title: 'Austin Solar Permit Timing by Contractor', description: 'Compare how long Austin solar and battery permits take from application to issuance and issuance to final inspection, by contractor.' });
  const [rows, setRows] = useState<SolarPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState<PermitFilters>({ ...emptyPermitFilters });
  const [sort, setSort] = useState<ContractorSort>('permits');
  const [ascending, setAscending] = useState(false);
  const [minPermits, setMinPermits] = useState('10');
  const [limit, setLimit] = useState('25');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    (async () => {
      const permits: SolarPermit[] = [];
      const hosts = new Map<string, { name: string | null; pid: string }>();
      const loadPermits = async () => {
        for (let o = 0; !cancelled; o += 1000) {
          const { data, error } = await supabase.from('solar_installations_view').select(COLS).order('id').range(o, o + 999);
          if (error) throw error;
          for (const r of data || []) if (r.id) permits.push({ ...r, id: r.id, host: null, host_pid: null } as SolarPermit);
          if (!data || data.length < 1000) break;
        }
      };
      const loadHosts = async () => {
        try {
          for (let o = 0; !cancelled; o += 1000) {
            const { data, error } = await supabase.from('solar_installations').select('id,tcad_properties!fk_solar_tcad_pid(pid,py_owner_name)').not('tcad_pid', 'is', null).order('id').range(o, o + 999);
            if (error) throw error;
            for (const r of data || []) if (r.tcad_properties) hosts.set(r.id, { name: r.tcad_properties.py_owner_name, pid: r.tcad_properties.pid });
            if (!data || data.length < 1000) break;
          }
        } catch { /* owner filter just matches nothing */ }
      };
      await Promise.all([loadPermits(), loadHosts()]);
      if (!cancelled) setRows(permits.map(r => ({ ...r, host: hosts.get(r.id)?.name || null, host_pid: hosts.get(r.id)?.pid || null })));
    })().catch(() => { if (!cancelled) setError('Permit records could not be loaded. Please try again.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);

  const filtered = useMemo(() => filterPermits(rows, filters), [rows, filters]);
  const { contractors, excluded } = useMemo(() => contractorTiming(filtered), [filtered]);
  const shown = useMemo(() => sortContractors(contractors.filter(c => c.permits >= (Number(minPermits) || 0)), sort, ascending).slice(0, Number(limit)), [contractors, minPermits, sort, ascending, limit]);
  const statuses = useMemo(() => mergeFilterOptions([], rows.map(r => r.status_current)), [rows]);
  const classes = useMemo(() => mergeFilterOptions([], rows.map(r => r.permit_class)), [rows]);
  const update = (k: keyof PermitFilters, v: string) => setFilters(f => ({ ...f, [k]: v }));
  const text = (k: keyof PermitFilters, label: string, type = 'text', ph?: string) => <div className="space-y-1.5"><Label htmlFor={`ct-${k}`}>{label}</Label><Input id={`ct-${k}`} type={type} min={type === 'number' ? 0 : undefined} value={filters[k]} onChange={e => update(k, e.target.value)} placeholder={ph} /></div>;
  const opt = (k: 'status' | 'type' | 'equipment', label: string, options: string[], names: Record<string, string> = {}) => <div className="space-y-1.5"><Label htmlFor={`ct-${k}`}>{label}</Label><Select value={filters[k]} onValueChange={v => update(k, v)}><SelectTrigger id={`ct-${k}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All {label.toLowerCase()}</SelectItem>{options.map(s => <SelectItem key={s} value={s}>{names[s] || s}</SelectItem>)}</SelectContent></Select></div>;

  return <div className="min-h-screen bg-background text-foreground">
    <PageHeader title="Permit Timing by Contractor" backTo="/solar-permits" backLabel="Back to Permit Deep Dive" subtitle="Median days from application to issuance, and issuance to final, for each contractor." contentClassName="max-w-7xl mx-auto px-4" />
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <p className="text-sm text-muted-foreground">Uses the same City permit records and filters as the <Link to="/solar-permits" className="text-primary underline">permit deep dive</Link>. Bars show the median (middle) permit for each contractor. Applied → issued counts any permit with both dates; issued → final counts only permits the City marks Final. Permits under {MIN_VALID_APPLIED_TO_FINAL_DAYS} days from application to final are treated as data errors and left out.</p>
      <section aria-label="Filters" className="border-y border-border py-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {text('search', 'Address, permit, ZIP or description')}{text('host', 'Host / owner')}{text('contractor', 'Contractor')}
        {opt('status', 'Status', statuses)}{opt('type', 'Permit class', classes)}{opt('equipment', 'Equipment', Object.keys(equipmentLabels), equipmentLabels)}
        {text('minKw', 'Minimum kW', 'number')}{text('maxKw', 'Maximum kW', 'number')}{text('minDays', 'Issued → final, at least (days)', 'number')}{text('maxDays', 'Issued → final, at most (days)', 'number')}{text('from', 'From date', 'date')}{text('to', 'Through date', 'date')}
        <div className="space-y-1.5"><Label htmlFor="ct-sort">Sort contractors by</Label><Select value={sort} onValueChange={v => setSort(v as ContractorSort)}><SelectTrigger id="ct-sort"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(sortNames).map(([k, n]) => <SelectItem key={k} value={k}>{n}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label htmlFor="ct-dir">Order</Label><Select value={ascending ? 'asc' : 'desc'} onValueChange={v => setAscending(v === 'asc')}><SelectTrigger id="ct-dir"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desc">Highest / Z first</SelectItem><SelectItem value="asc">Lowest / A first</SelectItem></SelectContent></Select></div>
        <div className="space-y-1.5"><Label htmlFor="ct-min">Contractors with at least (permits)</Label><Input id="ct-min" type="number" min={1} value={minPermits} onChange={e => setMinPermits(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="ct-limit">Show</Label><Select value={limit} onValueChange={setLimit}><SelectTrigger id="ct-limit"><SelectValue /></SelectTrigger><SelectContent>{['10', '25', '50', '100'].map(n => <SelectItem key={n} value={n}>Top {n} contractors</SelectItem>)}</SelectContent></Select></div>
        <div className="flex items-end"><Button variant="ghost" onClick={() => setFilters({ ...emptyPermitFilters })}><X className="h-4 w-4 mr-2" />Clear filters</Button></div>
      </section>
      {loading ? <div className="flex items-center gap-3 py-16 justify-center" role="status"><Loader2 className="h-5 w-5 animate-spin" />Loading permit records…</div>
        : error ? <div role="alert" className="py-10 space-y-4"><p className="text-destructive">{error}</p><Button onClick={() => setAttempt(a => a + 1)}>Try again</Button></div>
        : <>
          <p className="text-sm text-muted-foreground">{filtered.length.toLocaleString()} matching permits · {contractors.length.toLocaleString()} contractors · showing {shown.length} · {excluded.toLocaleString()} permits left out as likely data errors</p>
          <div className="grid gap-6 lg:grid-cols-2">
            <TimingChart title="Applied → issued" data={shown} field="appliedToIssued" count="appliedToIssuedCount" color="hsl(var(--primary))" />
            <TimingChart title="Issued → final" data={shown} field="issuedToFinal" count="issuedToFinalCount" color="hsl(var(--accent-foreground))" />
          </div>
        </>}
    </main>
  </div>;
}
