import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useSeo } from '@/hooks/use-seo';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { emptyPermitFilters, equipmentLabels, filterPermits, mergeFilterOptions, type PermitFilters, type SolarPermit } from '@/lib/solar-permits';
import { barThickness, contractorTiming, firstClickAscending, sortContractors, MIN_VALID_APPLIED_TO_FINAL_DAYS, type ContractorSort, type ContractorTiming } from '@/lib/contractor-timing';

const COLS = 'id,project_id,permit_number,address,installed_kw,contractor_company,permit_class,status_current,applied_date,issued_date,completed_date,original_zip,council_district,description,total_job_valuation,link,has_correction';
const sortNames: Record<ContractorSort, string> = { issuedToFinal: 'Issued → final (median days)', appliedToFinal: 'Applied → final (median days)', appliedToIssued: 'Applied → issued (median days)', permits: 'Number of permits', totalKw: 'Total reported kW', contractor: 'Contractor name' };
const tableColumns: [ContractorSort, string][] = [['contractor', 'Contractor'], ['permits', 'Permits'], ['totalKw', 'Total reported kW'], ['appliedToIssued', 'Applied → issued (median days)'], ['appliedToFinal', 'Applied → final (median days)'], ['issuedToFinal', 'Issued → final (median days)']];

type BarGeom = { x?: number; y?: number; width?: number; height?: number; payload?: { permits?: number } };

/** A horizontal bar whose thickness shows how many permits the contractor had, centered in its row. */
function ScaledBar({ x = 0, y = 0, width = 0, height = 0, payload, fill, roundedRight = false, maxPermits }: BarGeom & { fill: string; roundedRight?: boolean; maxPermits: number }) {
  const w = Math.max(0, Number(width) || 0);
  const h = Number(height) || 0;
  const t = barThickness(Number(payload?.permits) || 0, maxPermits);
  const top = y + (h - t) / 2;
  const r = roundedRight ? Math.min(3, t / 2, w / 2) : 0;
  const d = r > 0
    ? `M${x},${top}L${x + w - r},${top}Q${x + w},${top} ${x + w},${top + r}L${x + w},${top + t - r}Q${x + w},${top + t} ${x + w - r},${top + t}L${x},${top + t}Z`
    : `M${x},${top}L${x + w},${top}L${x + w},${top + t}L${x},${top + t}Z`;
  return <path d={d} fill={fill} />;
}

function TimingChart({ title, data, field, count, color }: { title: string; data: ContractorTiming[]; field: 'appliedToIssued' | 'appliedToFinal' | 'issuedToFinal'; count: 'appliedToIssuedCount' | 'appliedToFinalCount' | 'issuedToFinalCount'; color: string }) {
  const [longestFirst, setLongestFirst] = useState(true);
  const rows = data.filter(d => d[field] !== null).sort((a, b) => longestFirst ? (b[field] as number) - (a[field] as number) : (a[field] as number) - (b[field] as number));
  const maxPermits = Math.max(1, ...rows.map(r => r.permits));
  return <section className="border border-border rounded-md p-4 space-y-2">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button variant="outline" size="sm" onClick={() => setLongestFirst(v => !v)} aria-pressed={!longestFirst}>{longestFirst ? 'Longest median times on top' : 'Shortest median times on top'}</Button>
    </div>
    <p className="text-xs text-muted-foreground">Bar length = median days · bar thickness = number of permits (thicker means more permits)</p>
    {rows.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No contractors with this timing match these filters.</p> :
      <div style={{ height: Math.max(200, rows.length * 34 + 40) }}><ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 48, bottom: 12 }}>
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} label={{ value: 'Median days', position: 'insideBottom', offset: -2, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
          <YAxis type="category" dataKey="contractor" width={210} interval={0} tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} tickFormatter={(v: string) => v.length > 32 ? `${v.slice(0, 31)}…` : v} />
          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} formatter={(v: number, _n, item) => [`${v.toLocaleString()} days (median of ${(item.payload as ContractorTiming)[count].toLocaleString()} permits)`, title]} />
          <Bar dataKey={field} fill={color} isAnimationActive={false} shape={(p: BarGeom) => <ScaledBar {...p} fill={color} roundedRight maxPermits={maxPermits} />}><LabelList dataKey={field} position="right" fill="hsl(var(--foreground))" fontSize={11} /></Bar>
        </BarChart>
      </ResponsiveContainer></div>}
  </section>;
}

type StackRow = ContractorTiming & { gap: number; over: boolean };
function StackedFinalChart({ data }: { data: ContractorTiming[] }) {
  const [longestFirst, setLongestFirst] = useState(true);
  const rows: StackRow[] = data.filter(d => d.appliedToFinal !== null).map(d => {
    const parts = (d.appliedToIssued ?? 0) + (d.issuedToFinal ?? 0);
    const total = d.appliedToFinal as number;
    return { ...d, gap: Math.max(0, total - parts), over: parts > total };
  }).sort((a, b) => longestFirst ? (b.appliedToFinal as number) - (a.appliedToFinal as number) : (a.appliedToFinal as number) - (b.appliedToFinal as number));
  const maxPermits = Math.max(1, ...rows.map(r => r.permits));
  const tip = ({ active, payload }: { active?: boolean; payload?: { payload: StackRow }[] }) => {
    if (!active || !payload?.length) return null;
    const r = payload[0].payload;
    const fmt = (v: number | null, n: number) => v === null ? 'no data' : `${v.toLocaleString()} days (median of ${n.toLocaleString()} permits)`;
    return <div className="rounded-md border border-border bg-popover text-popover-foreground p-2 text-xs space-y-1">
      <p className="font-semibold">{r.contractor}</p>
      <p><span style={{ color: 'hsl(var(--chart-blue))' }}>■</span> Applied → issued: {fmt(r.appliedToIssued, r.appliedToIssuedCount)}</p>
      <p><span style={{ color: 'hsl(var(--chart-green))' }}>■</span> Issued → final: {fmt(r.issuedToFinal, r.issuedToFinalCount)}</p>
      <p><span style={{ color: 'hsl(var(--accent))' }}>■</span> Applied → final (total): {fmt(r.appliedToFinal, r.appliedToFinalCount)}</p>
      {r.gap > 0 && <p className="text-muted-foreground">Orange segment: {r.gap.toLocaleString()} days the total exceeds the two steps combined.</p>}
      {r.over && <p className="text-muted-foreground">The two steps combined are longer than the total median, so the bar extends past the total.</p>}
    </div>;
  };
  return <section className="border border-border rounded-md p-4 space-y-2">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h2 className="text-lg font-semibold">Applied → final</h2>
      <Button variant="outline" size="sm" onClick={() => setLongestFirst(v => !v)} aria-pressed={!longestFirst}>{longestFirst ? 'Longest median times on top' : 'Shortest median times on top'}</Button>
    </div>
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      <span><span style={{ color: 'hsl(var(--chart-blue))' }}>■</span> Applied → issued</span>
      <span><span style={{ color: 'hsl(var(--chart-green))' }}>■</span> Issued → final</span>
      <span><span style={{ color: 'hsl(var(--accent))' }}>■</span> Rest of applied → final</span>
      <span>Number at the end = applied → final median</span>
      <span>Bar thickness = number of permits</span>
    </div>
    <p className="text-xs text-muted-foreground">Each step is a separate median, so the steps don't add up exactly to the total. Orange shows how much longer the total median is than the two steps combined.</p>
    {rows.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No contractors with this timing match these filters.</p> :
      <div style={{ height: Math.max(200, rows.length * 34 + 40) }}><ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 48, bottom: 12 }}>
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} label={{ value: 'Median days', position: 'insideBottom', offset: -2, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
          <YAxis type="category" dataKey="contractor" width={210} interval={0} tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} tickFormatter={(v: string) => v.length > 32 ? `${v.slice(0, 31)}…` : v} />
          <Tooltip content={tip} />
          <Bar dataKey="appliedToIssued" stackId="t" fill="hsl(var(--chart-blue))" isAnimationActive={false} shape={(p: BarGeom) => <ScaledBar {...p} fill="hsl(var(--chart-blue))" maxPermits={maxPermits} />} />
          <Bar dataKey="issuedToFinal" stackId="t" fill="hsl(var(--chart-green))" isAnimationActive={false} shape={(p: BarGeom) => <ScaledBar {...p} fill="hsl(var(--chart-green))" maxPermits={maxPermits} />} />
          <Bar dataKey="gap" stackId="t" fill="hsl(var(--accent))" isAnimationActive={false} shape={(p: BarGeom) => <ScaledBar {...p} fill="hsl(var(--accent))" roundedRight maxPermits={maxPermits} />}><LabelList dataKey="appliedToFinal" position="right" fill="hsl(var(--foreground))" fontSize={11} /></Bar>
        </BarChart>
      </ResponsiveContainer></div>}
  </section>;
}

export default function ContractorPermitTiming() {
  useSeo({ title: 'Austin Solar Permit Timing by Contractor', description: 'Compare how long Austin solar and battery permits take from application to issuance, application to final, and issuance to final inspection, by contractor.' });
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
  const clickSort = (field: ContractorSort) => { if (sort === field) setAscending(a => !a); else { setSort(field); setAscending(firstClickAscending(field)); } };
  const text = (k: keyof PermitFilters, label: string, type = 'text', ph?: string) => <div className="space-y-1.5"><Label htmlFor={`ct-${k}`}>{label}</Label><Input id={`ct-${k}`} type={type} min={type === 'number' ? 0 : undefined} value={filters[k]} onChange={e => update(k, e.target.value)} placeholder={ph} /></div>;
  const opt = (k: 'status' | 'type' | 'equipment', label: string, options: string[], names: Record<string, string> = {}) => <div className="space-y-1.5"><Label htmlFor={`ct-${k}`}>{label}</Label><Select value={filters[k]} onValueChange={v => update(k, v)}><SelectTrigger id={`ct-${k}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All {label.toLowerCase()}</SelectItem>{options.map(s => <SelectItem key={s} value={s}>{names[s] || s}</SelectItem>)}</SelectContent></Select></div>;

  return <div className="min-h-screen bg-background text-foreground">
    <PageHeader title="Permit Timing by Contractor" backTo="/solar-permits" backLabel="Back to Permit Deep Dive" subtitle="Median days from application to issuance, and issuance to final, for each contractor." contentClassName="max-w-7xl mx-auto px-4" />
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <p className="text-sm text-muted-foreground">Uses the same City permit records and filters as the <Link to="/solar-permits" className="text-primary underline">permit deep dive</Link>. Bars show the median (middle) permit for each contractor, and the thickness of each bar shows how many permits that contractor had — thicker means more permits. Applied → issued counts any permit with both dates; applied → final and issued → final count only permits the City marks Final. Permits under {MIN_VALID_APPLIED_TO_FINAL_DAYS} days from application to final are treated as data errors and left out. Filters plus <strong>Sort contractors by</strong> and <strong>Show</strong> choose which contractors appear; each chart then orders its own bars by its own median time — use the button in a chart's corner to flip it.</p>
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
            <TimingChart title="Applied → issued" data={shown} field="appliedToIssued" count="appliedToIssuedCount" color="hsl(var(--chart-blue))" />
            <TimingChart title="Issued → final" data={shown} field="issuedToFinal" count="issuedToFinalCount" color="hsl(var(--chart-green))" />
          </div>
          <StackedFinalChart data={shown} />
          <section aria-label="Contractor timing table" className="border border-border rounded-md overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Contractor details</h2>
              <p className="text-sm text-muted-foreground mt-1">Click a column heading to sort it. The first click puts the largest numbers on top; click the same heading again to put them on the bottom.</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>{tableColumns.map(([field, title]) => <TableHead key={field} aria-sort={sort === field ? ascending ? 'ascending' : 'descending' : 'none'}><Button variant="ghost" size="sm" onClick={() => clickSort(field)} className="px-1 whitespace-nowrap text-xs">{title}{sort === field ? ascending ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUpDown className="ml-1 h-3 w-3" />}</Button></TableHead>)}</TableRow></TableHeader>
                <TableBody>{shown.map(c => <TableRow key={c.contractor}>
                  <TableCell className="max-w-64 text-sm break-words">{c.contractor}</TableCell>
                  <TableCell className="tabular-nums text-sm text-right">{c.permits.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums text-sm text-right">{c.totalKw.toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
                  <TableCell className="tabular-nums text-sm text-right whitespace-nowrap">{c.appliedToIssued === null ? '—' : <>{c.appliedToIssued.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-muted-foreground">· {c.appliedToIssuedCount.toLocaleString()} permits</span></>}</TableCell>
                  <TableCell className="tabular-nums text-sm text-right whitespace-nowrap">{c.issuedToFinal === null ? '—' : <>{c.issuedToFinal.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-muted-foreground">· {c.issuedToFinalCount.toLocaleString()} permits</span></>}</TableCell>
                </TableRow>)}{shown.length === 0 && <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No contractors match these filters.</TableCell></TableRow>}</TableBody>
              </Table>
            </div>
          </section>
        </>}
    </main>
  </div>;
}
