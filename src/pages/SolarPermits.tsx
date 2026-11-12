import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, Loader2, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSeo } from '@/hooks/use-seo';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { emptyPermitFilters, filterPermits, sortPermits, type PermitFilters, type PermitSort, type SolarPermit, daysAppliedToFinal } from '@/lib/solar-permits';

const PAGE_SIZE = 50;
const dateLabel = (value: string | null) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not reported';
const columns: [PermitSort, string][] = [['address', 'Address'], ['installed_kw', 'kW'], ['host', 'Host / owner'], ['contractor_company', 'Contractor'], ['status_current', 'Status'], ['issued_date', 'Issued'], ['completed_date', 'Final']];

export default function SolarPermits() {
  useSeo({ title: 'Austin Solar Permits', description: 'Search and compare Austin solar permit addresses, reported system sizes, property owners, contractors, and permit details.' });
  const [rows, setRows] = useState<SolarPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ownerWarning, setOwnerWarning] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState<PermitFilters>({ ...emptyPermitFilters });
  const [sort, setSort] = useState<PermitSort>('completed_date');
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<SolarPermit | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(''); setOwnerWarning(false);
    async function load() {
      const permits: SolarPermit[] = [];
      const hosts = new Map<string, { name: string | null; pid: string }>();
      const loadPermits = async () => {
        for (let offset = 0; !cancelled; offset += 1000) {
          const { data, error } = await supabase.from('solar_installations_view')
            .select('id,project_id,permit_number,address,installed_kw,contractor_company,permit_class,status_current,applied_date,issued_date,completed_date,original_zip,council_district,description,total_job_valuation,link,has_correction')
            .order('id').range(offset, offset + 999);
          if (error) throw error;
          for (const row of data || []) if (row.id) permits.push({ ...row, id: row.id, host: null, host_pid: null });
          if (!data || data.length < 1000) break;
        }
      };
      const loadHosts = async () => {
        try {
          for (let offset = 0; !cancelled; offset += 1000) {
            const { data, error } = await supabase.from('solar_installations')
              .select('id,tcad_properties!fk_solar_tcad_pid(pid,py_owner_name)')
              .not('tcad_pid', 'is', null).order('id').range(offset, offset + 999);
            if (error) throw error;
            for (const row of data || []) {
              const owner = row.tcad_properties;
              if (owner) hosts.set(row.id, { name: owner.py_owner_name, pid: owner.pid });
            }
            if (!data || data.length < 1000) break;
          }
        } catch {
          if (!cancelled) setOwnerWarning(true);
        }
      };
      try {
        await Promise.all([loadPermits(), loadHosts()]);
        if (!cancelled) setRows(permits.map(row => ({ ...row, host: hosts.get(row.id)?.name || null, host_pid: hosts.get(row.id)?.pid || null })));
      } catch {
        if (!cancelled) setError('Permit records could not be loaded. Please try again.');
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [attempt]);

  const results = useMemo(() => sortPermits(filterPermits(rows, filters), sort, ascending), [rows, filters, sort, ascending]);
  const statuses = useMemo(() => [...new Set(rows.map(r => r.status_current).filter((s): s is string => Boolean(s)))].sort(), [rows]);
  const classes = useMemo(() => [...new Set(rows.map(r => r.permit_class).filter((s): s is string => Boolean(s)))].sort(), [rows]);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const update = (key: keyof PermitFilters, value: string) => { setFilters(f => ({ ...f, [key]: value })); setPage(0); };
  const changeSort = (field: PermitSort) => { setAscending(sort === field ? !ascending : true); setSort(field); setPage(0); };
  const textFilter = (key: keyof PermitFilters, label: string, type = 'text', placeholder?: string) => <div className="space-y-1.5"><Label htmlFor={`permit-${key}`}>{label}</Label><Input id={`permit-${key}`} type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 'any' : undefined} value={filters[key]} onChange={e => update(key, e.target.value)} placeholder={placeholder} /></div>;
  const optionFilter = (key: 'status' | 'type', label: string, options: string[]) => <div className="space-y-1.5"><Label htmlFor={`permit-${key}`}>{label}</Label><Select value={filters[key]} onValueChange={v => update(key, v)}><SelectTrigger id={`permit-${key}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All {label.toLowerCase()}</SelectItem>{options.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>;

  return <div className="min-h-screen bg-background text-foreground">
    <PageHeader title="Austin Solar Permits" backTo="/city-overview" backLabel="Back to Solar Progress" subtitle="City permit records and matched property information." contentClassName="max-w-7xl mx-auto px-4" />
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="text-sm text-muted-foreground space-y-2">
        <p>Source: <a href="https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu" target="_blank" rel="noopener noreferrer" className="text-primary underline">City of Austin permit records</a>, with site corrections and flagged duplicates/exclusions removed. Size is as reported; missing kW does not mean zero.</p>
        <p>Host / owner is the TCAD recorded property owner when a parcel is linked, not a verified solar-system host or current account holder. Unmatched owners are not reported. Dates filter by final, then issuance, then application.</p>
        {ownerWarning && <p role="status" className="text-destructive">Property-owner data is temporarily unavailable. Permit records remain available.</p>}
      </div>
      <section aria-label="Permit filters" className="border-y border-border py-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="permit-search">Address, permit number, ZIP or description</Label><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="permit-search" className="pl-9" value={filters.search} onChange={e => update('search', e.target.value)} placeholder="Search permits" /></div></div>
          {textFilter('host', 'Host / owner', 'text', 'Owner name')}{textFilter('contractor', 'Contractor', 'text', 'Contractor name')}
          {optionFilter('status', 'Status', statuses)}{optionFilter('type', 'Permit class', classes)}{textFilter('minKw', 'Minimum kW', 'number')}{textFilter('maxKw', 'Maximum kW', 'number')}
          {textFilter('from', 'From date', 'date')}{textFilter('to', 'Through date', 'date')}
          <div className="flex items-end"><Button variant="ghost" onClick={() => { setFilters({ ...emptyPermitFilters }); setPage(0); }}><X className="h-4 w-4 mr-2" />Clear filters</Button></div>
        </div>
      </section>
      {loading ? <div className="flex items-center gap-3 py-16 justify-center" role="status"><Loader2 className="h-5 w-5 animate-spin" />Loading permit records…</div> : error ? <div role="alert" className="py-10 space-y-4"><p className="text-destructive">{error}</p><Button onClick={() => setAttempt(a => a + 1)}>Try again</Button></div> : <>
        <div className="flex flex-wrap gap-3 justify-between items-center"><p className="text-sm text-muted-foreground">{results.length.toLocaleString()} matching permit records · {rows.length.toLocaleString()} available</p><span className="text-sm text-muted-foreground">Page {page + 1} of {pageCount}</span></div>
        <div className="border border-border rounded-md overflow-hidden">
          <Table><TableHeader><TableRow>{columns.map(([field, title]) => <TableHead key={field} aria-sort={sort === field ? ascending ? 'ascending' : 'descending' : 'none'}><Button variant="ghost" size="sm" onClick={() => changeSort(field)} className="px-1 whitespace-nowrap text-xs">{title}{sort === field ? ascending ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUpDown className="ml-1 h-3 w-3" />}</Button></TableHead>)}</TableRow></TableHeader>
            <TableBody>{results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(row => <TableRow key={row.id}>
              <TableCell className="max-w-48 text-sm"><Button variant="link" className="h-auto p-0 text-left whitespace-normal justify-start" onClick={() => setSelected(row)}>{row.address || 'Address not reported'}</Button>{row.has_correction && <span className="block text-xs text-muted-foreground mt-1">Corrected record</span>}{row.permit_class && <span className="block text-xs text-muted-foreground">{row.permit_class}</span>}</TableCell>
              <TableCell className="tabular-nums whitespace-nowrap text-sm">{row.installed_kw === null ? '—' : row.installed_kw.toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
              <TableCell className="max-w-40 text-sm break-words">{row.host || <span className="text-muted-foreground">Not reported</span>}</TableCell>
              <TableCell className="max-w-40 text-sm break-words">{row.contractor_company || <span className="text-muted-foreground">Not reported</span>}</TableCell>
              <TableCell className="text-sm">{row.status_current || '—'}</TableCell><TableCell className="whitespace-nowrap text-sm">{dateLabel(row.issued_date)}</TableCell><TableCell className="whitespace-nowrap text-sm">{dateLabel(row.completed_date)}</TableCell>
            </TableRow>)}{results.length === 0 && <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No permits match these filters.</TableCell></TableRow>}</TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between gap-2"><Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4 mr-1" />Previous</Button><span className="text-sm tabular-nums">{results.length ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, results.length)} of {results.length.toLocaleString()}</span><Button variant="outline" disabled={page + 1 >= pageCount} onClick={() => setPage(p => p + 1)}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button></div>
      </>}
    </main>
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle className="pr-6">{selected?.address || 'Permit details'}</DialogTitle></DialogHeader>{selected && <div className="space-y-5">
      <Badge variant="secondary">{selected.permit_number || selected.project_id || 'Permit record'}</Badge>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">{[
        ['System size', selected.installed_kw === null ? null : `${selected.installed_kw.toLocaleString()} kW`], ['Host / owner (TCAD)', selected.host], ['Contractor', selected.contractor_company], ['Permit class', selected.permit_class], ['Status', selected.status_current], ['Project ID', selected.project_id], ['Applied', dateLabel(selected.applied_date)], ['Issued', dateLabel(selected.issued_date)], ['Final', dateLabel(selected.completed_date)], ['Applied to final', (() => { const d = daysAppliedToFinal(selected); return d === null ? null : `${d.toLocaleString()} days (${dateLabel(selected.applied_date)} → ${dateLabel(selected.completed_date)})`; })()], ['Permit number', selected.permit_number], ['ZIP', selected.original_zip], ['Council district', selected.council_district], ['Reported job valuation', selected.total_job_valuation === null ? null : selected.total_job_valuation.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })],
      ].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-medium break-words mt-1">{value || 'Not reported'}</dd></div>)}</dl>
      <div><h3 className="text-sm text-muted-foreground mb-1">Permit description</h3><p className="text-sm whitespace-pre-wrap break-words">{selected.description || 'Not reported'}</p></div>
      <div className="flex gap-3 flex-wrap">{selected.link && /^https?:\/\//i.test(selected.link) && <Button variant="outline" asChild><a href={selected.link} target="_blank" rel="noopener noreferrer">Official permit<ExternalLink className="h-4 w-4 ml-2" /></a></Button>}{selected.address && <Button variant="outline" asChild><Link to={`/solar-savings-austin?address=${encodeURIComponent(selected.address)}`}>Map & solar layout<ChevronRight className="h-4 w-4 ml-2" /></Link></Button>}{selected.host_pid && <Button variant="outline" asChild><Link to={`/property/${selected.host_pid}`}>Property details<ChevronRight className="h-4 w-4 ml-2" /></Link></Button>}</div>
    </div>}</DialogContent></Dialog>
  </div>;
}