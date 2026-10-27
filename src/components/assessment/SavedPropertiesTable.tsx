import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Link, Search, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { propertyTypeName, savedPropertyMetrics, selectSavedProperties, type SavedSortColumn } from "@/lib/saved-property-table";
import type { SavedRow } from "./SavedPropertiesDrawer";

interface Props {
  rows: SavedRow[];
  updatingIds: Set<string>;
  onOpen: (row: SavedRow) => void;
  onLowIncome: (row: SavedRow, checked: boolean) => void;
  onShare: (token: string) => void;
  onSuite: (row: SavedRow) => void;
  onDelete: (id: string) => void;
}
const columns: { key: SavedSortColumn; label: string }[] = [
  { key: "address", label: "Address" }, { key: "type", label: "Property type" },
  { key: "systemKw", label: "Saved size (kW)" }, { key: "ssoKw", label: "Std Offer size (kW)" },
  { key: "lowIncome", label: "Low income (+10%)" }, { key: "creditUsd", label: "Federal benefit" }, { key: "updated_at", label: "Updated" },
];
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export default function SavedPropertiesTable({ rows, updatingIds, onOpen, onLowIncome, onShare, onSuite, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<SavedSortColumn>("updated_at");
  const [ascending, setAscending] = useState(false);
  const types = useMemo(() => [...new Set(rows.map(r => propertyTypeName(r.property_type)))].sort(), [rows]);
  const visible = useMemo(() => selectSavedProperties(rows, search, type, sort, ascending), [rows, search, type, sort, ascending]);
  return <section className="space-y-3" aria-label="Saved properties table">
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input aria-label="Search saved addresses" placeholder="Search address" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-[190px]" aria-label="Filter by property type"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">All property types</SelectItem>{types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground">{visible.length} of {rows.length}</span>
    </div>
    <p className="text-xs text-muted-foreground">Standard Offer size is the estimated maximum roof fit, subject to program eligibility. Federal benefit uses the saved size and program. Low-income bonus requires an awarded allocation; eligibility and tax rules apply. Residential homeowner credits are excluded.</p>
    <div className="rounded-md border border-border">
      <Table className="min-w-[1100px]">
        <TableHeader><TableRow>{columns.map(c => <TableHead key={c.key} aria-sort={sort === c.key ? ascending ? "ascending" : "descending" : "none"}>
          <Button variant="ghost" size="sm" className="px-0 gap-1 whitespace-nowrap" onClick={() => { setSort(c.key); setAscending(sort === c.key ? !ascending : true); }}>
            {c.label}{sort === c.key ? ascending ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3" />}
          </Button>
        </TableHead>)}<TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>{visible.map(row => {
          const metrics = savedPropertyMetrics(row);
          return <TableRow key={row.id}>
            <TableCell className="min-w-[230px] max-w-[300px]"><Button variant="link" className="h-auto p-0 text-left whitespace-normal break-words justify-start" onClick={() => onOpen(row)}>{row.address}</Button></TableCell>
            <TableCell>{propertyTypeName(row.property_type)}</TableCell>
            <TableCell className="tabular-nums">{metrics.systemKw?.toLocaleString() ?? "—"}</TableCell>
            <TableCell className="tabular-nums">{metrics.ssoKw?.toLocaleString() ?? "Not eligible"}</TableCell>
            <TableCell><Checkbox aria-label={`Low income for ${row.address}`} checked={metrics.lowIncome} disabled={updatingIds.has(row.id) || !metrics.canSetLowIncome} onCheckedChange={checked => onLowIncome(row, checked === true)} />{updatingIds.has(row.id) && <span className="ml-2 text-xs text-muted-foreground">Saving…</span>}</TableCell>
            <TableCell className="tabular-nums">{metrics.creditUsd === null ? "—" : usd.format(metrics.creditUsd)}</TableCell>
            <TableCell className="whitespace-nowrap">{new Date(row.updated_at).toLocaleDateString()}</TableCell>
            <TableCell><div className="flex gap-1">
              <Button size="icon" variant="ghost" title="Copy share link" aria-label={`Copy share link for ${row.address}`} onClick={() => onShare(row.share_token)}><Link className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" title="Open in Solar Suite" aria-label={`Open ${row.address} in Solar Suite`} onClick={() => onSuite(row)}><Wrench className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" disabled={updatingIds.has(row.id)} title="Delete property" aria-label={`Delete ${row.address}`} onClick={() => onDelete(row.id)}><Trash2 className="h-4 w-4" /></Button>
            </div></TableCell>
          </TableRow>;
        })}{visible.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{rows.length ? "No matching properties." : "No saved properties yet."}</TableCell></TableRow>}</TableBody>
      </Table>
    </div>
  </section>;
}