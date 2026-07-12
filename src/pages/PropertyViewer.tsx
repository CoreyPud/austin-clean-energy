import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Lock, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugifyAddress } from "@/lib/property-solar";
import MapTokenLoader from "@/components/MapTokenLoader";
import SatellitePane from "@/components/SatellitePane";
import {
  PropertyMap,
  type PropertyPoint,
  type GasPlantPoint,
  type ProposedSitePoint,
} from "@/components/PropertyMap";
import { PropertyEditModal } from "@/components/PropertyEditModal";

const PAGE_SIZE   = 1000;
const MAX_RESULTS = 10_000;

const COMPASS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
function azimuthLabel(deg: number): string {
  return COMPASS[Math.round(deg / 22.5) % 16];
}

function haversineMi(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(a));
}
const TABLE_PAGE = 50;

const TYPE_LABEL: Record<string, string> = {
  single_family: "Single Family",
  multifamily:   "Multifamily",
  condo:         "Condo",
  commercial:    "Commercial",
  other:         "Other",
};

const TYPE_COLOR: Record<string, string> = {
  single_family: "#3b82f6",
  multifamily:   "#8b5cf6",
  condo:         "#ec4899",
  commercial:    "#f97316",
  other:         "#6b7280",
};

const ALL_TYPES = ["single_family", "multifamily", "condo", "commercial", "other"] as const;


export default function PropertyViewer() {
  const navigate = useNavigate();

  const [maxDistMi,       setMaxDistMi]       = useState(0.5);
  const [includeGas,      setIncludeGas]      = useState(true);
  const [includeProposed, setIncludeProposed] = useState(true);
  const [selectedTypes,   setSelectedTypes]   = useState<string[]>([...ALL_TYPES]);
  const [onlyWithSolar,   setOnlyWithSolar]   = useState(false);
  const [proximityOn,     setProximityOn]     = useState(true);

  const [properties,    setProperties]    = useState<PropertyPoint[]>([]);
  const [gasPlants,     setGasPlants]     = useState<GasPlantPoint[]>([]);
  const [proposedSites, setProposedSites] = useState<ProposedSitePoint[]>([]);

  const [loading,    setLoading]    = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [focusPid,   setFocusPid]   = useState<string | null>(null);
  const [tablePage,  setTablePage]  = useState(0);

  const [segments, setSegments] = useState<{
    segment_index: number; pitch_deg: number; azimuth_deg: number;
    area_m2: number; sunshine_median: number; sunshine_max: number;
  }[]>([]);

  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isAdmin,        setIsAdmin]        = useState(false);
  const [editPid,        setEditPid]        = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword,  setAdminPassword]  = useState("");
  const [adminLogging,   setAdminLogging]   = useState(false);

  useEffect(() => {
    const token   = sessionStorage.getItem('admin_token');
    const expires = sessionStorage.getItem('admin_token_expires');
    setIsAdmin(!!token && !!expires && new Date(expires) > new Date());
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) return;
    setAdminLogging(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'login', password: adminPassword },
      });
      if (error) throw error;
      if (data?.success && data?.token) {
        sessionStorage.setItem('admin_token', data.token);
        sessionStorage.setItem('admin_token_expires', data.expiresAt);
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminPassword("");
        toast.success("Logged in as admin");
      } else {
        toast.error(data?.error || "Invalid password");
      }
    } catch {
      toast.error("Login failed");
    } finally {
      setAdminLogging(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token_expires');
    setIsAdmin(false);
  };

  useEffect(() => {
    if (focusPid) setRightPanelOpen(true);
    if (!focusPid) { setSegments([]); return; }
    supabase
      .from("tcad_roof_segments")
      .select("segment_index, pitch_deg, azimuth_deg, area_m2, sunshine_median, sunshine_max")
      .eq("pid", focusPid)
      .order("segment_index")
      .then(({ data }) => setSegments(data ?? []));
  }, [focusPid]);

  // Static data: gas plants + proposed sites
  useEffect(() => {
    supabase
      .from("power_plants")
      .select("plantid, plant_name, latitude, longitude, capacity_mw")
      .eq("fuel", "gas")
      .then(({ data }) => {
        if (!data) return;
        setGasPlants(data.map(p => ({
          id: p.plantid,
          name: p.plant_name ?? "Unknown",
          lat: p.latitude ?? 0,
          lon: p.longitude ?? 0,
          capacity_mw: p.capacity_mw,
        })));
      });

    supabase
      .from("proposed_peaker_sites")
      .select("id, name, latitude, longitude")
      .order("id")
      .then(({ data }) => {
        if (!data) return;
        setProposedSites(data.map(p => ({
          id: p.id,
          name: p.name,
          lat: p.latitude,
          lon: p.longitude,
        })));
      });
  }, []);

  const SOLAR_SELECT = "*, solar_installations(id, permit_number, issued_date, completed_date, installed_kw, contractor_company, total_job_valuation, status_current, link)";

  const mapRow = (p: any): PropertyPoint => {
    const permits: any[] = (p.solar_installations ?? [])
      .sort((a: any, b: any) => (b.issued_date ?? "").localeCompare(a.issued_date ?? ""));
    const solar_kw = permits.reduce((s: number, r: any) => s + (r.installed_kw ?? 0), 0) || null;
    return {
      pid:                   p.pid,
      address:               p.situs_address,
      zip:                   p.situs_zip ?? null,
      lat:                   p.centroid_lat,
      lon:                   p.centroid_lon,
      dist_gas:              p.dist_nearest_gas_plant_mi,
      dist_peaker:           p.dist_proposed_peaker_mi,
      property_type:         p.property_type,
      has_solar:             p.has_solar,
      owner:                 p.py_owner_name ?? null,
      year_built:            p.year_built ?? null,
      market_value:          p.market_value ?? null,
      roof_sqft:             p.estimated_roof_sqft ?? null,
      land_type_desc:        p.land_type_desc ?? null,
      county:                p.county ?? null,
      solar_kw,
      solar_permits:         permits,
      solar_fetched_at:       p.solar_fetched_at ?? null,
      solar_max_panels:       p.solar_max_panels ?? null,
      solar_sunshine_median:  p.solar_sunshine_median ?? null,
      solar_max_area_m2:      p.solar_max_area_m2 ?? null,
      solar_panel_capacity_w: p.solar_panel_capacity_w ?? null,
      solar_imagery_quality:  p.solar_imagery_quality ?? null,
      solar_imagery_date:     p.solar_imagery_date ?? null,
      solar_eligible_kw:      p.solar_eligible_kw ?? null,
      comment:                p.comment ?? null,
      roof_type:              p.roof_type ?? null,
      optimal_system_size_kw:     p.optimal_system_size_kw ?? null,
      owner_contact:          p.owner_contact ?? null,
      owned_or_rented:        p.owned_or_rented ?? null,
    };
  };

  // Single paginated fetch — all active filters applied as query params
  const fetchPage = async (
    distCol: "dist_proposed_peaker_mi" | "dist_nearest_gas_plant_mi" | null,
    opts: { maxMi: number; types: string[]; withSolar: boolean; maxRows?: number },
    onProgress: (rows: PropertyPoint[]) => void,
  ): Promise<PropertyPoint[] | null> => {
    const rows: PropertyPoint[] = [];
    const limit = opts.maxRows ?? MAX_RESULTS;
    let from = 0;
    while (true) {
      let data: any[] | null = null;
      let error: { message: string } | null = null;
      try {
        let q = supabase
          .from("tcad_properties")
          .select(SOLAR_SELECT)
          .not("centroid_lat", "is", null)
          .eq("in_ae", true)
          .range(from, from + PAGE_SIZE - 1);
        if (distCol) {
          q = q.lte(distCol, opts.maxMi).order(distCol, { ascending: true });
        } else {
          q = q.order("solar_sunshine_median", { ascending: false });
        }
        if (opts.types.length < ALL_TYPES.length) q = q.in("property_type", opts.types);
        if (opts.withSolar) q = q.not("solar_fetched_at", "is", null);
        ({ data, error } = await q);
      } catch (e: any) {
        error = { message: e?.message ?? "Failed to fetch" };
      }
      if (error) { setQueryError(error.message); return null; }
      if (!data?.length) break;
      rows.push(...data.map(mapRow));
      onProgress(rows);
      if (rows.length >= limit) break;
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return rows;
  };

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setQueryError(null);
    setTablePage(0);
    setProperties([]);

    const seen = new Set<string>();
    const merged: PropertyPoint[] = [];
    const merge = (rows: PropertyPoint[]) => {
      for (const r of rows) {
        if (!seen.has(r.pid)) { seen.add(r.pid); merged.push(r); }
      }
      setProperties([...merged]);
    };

    const baseOpts = { maxMi: maxDistMi, types: selectedTypes, withSolar: onlyWithSolar };

    if (!proximityOn) {
      const rows = await fetchPage(null, { ...baseOpts, maxRows: MAX_RESULTS }, merge);
      if (!rows) { setLoading(false); return; }
    } else {
      if (includeProposed) {
        const rows = await fetchPage("dist_proposed_peaker_mi", { ...baseOpts, maxRows: MAX_RESULTS - merged.length }, merge);
        if (!rows) { setLoading(false); return; }
      }
      if (includeGas && merged.length < MAX_RESULTS) {
        const rows = await fetchPage("dist_nearest_gas_plant_mi", { ...baseOpts, maxRows: MAX_RESULTS - merged.length }, merge);
        if (!rows) { setLoading(false); return; }
      }
    }

    setLoading(false);
  }, [maxDistMi, includeGas, includeProposed, selectedTypes, onlyWithSolar, proximityOn]);


  const siteCounts = useMemo(() => {
    const out: Record<number, number> = {};
    proposedSites.forEach(s => {
      out[s.id] = properties.filter(p => haversineMi(p.lat, p.lon, s.lat, s.lon) <= maxDistMi).length;
    });
    return out;
  }, [properties, proposedSites, maxDistMi]);

  const plantCounts = useMemo(() => {
    const out: Record<number, number> = {};
    gasPlants.forEach(g => {
      out[g.id] = properties.filter(p => haversineMi(p.lat, p.lon, g.lat, g.lon) <= maxDistMi).length;
    });
    return out;
  }, [properties, gasPlants, maxDistMi]);

  const [searchQuery, setSearchQuery] = useState("");

  type SortKey = "address" | "owner" | "zip" | "property_type" | "year_built" | "market_value" | "roof_sqft" | "solar_kw" | "solar_sunshine_median" | "solar_max_panels" | "solar_max_area_m2" | "solar_eligible_kw" | "dist_gas" | "dist_peaker";
  const [sortKey, setSortKey]   = useState<SortKey>("dist_peaker");
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("asc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setTablePage(0);
  };

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...properties].sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [properties, sortKey, sortDir]);

  const filteredSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(p =>
      p.address?.toLowerCase().includes(q) ||
      p.owner?.toLowerCase().includes(q) ||
      p.pid?.toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const exportCsv = () => {
    const headers = ["Address","Owner","ZIP","Type","Land use","Built","Market value","Roof sqft","Solar kW","Sun score","Max system kW","Dist peaker mi","Dist gas mi"];
    const rows = filteredSorted.map(p => [
      p.address ?? "",
      p.owner ?? "",
      p.zip ?? "",
      TYPE_LABEL[p.property_type ?? ""] ?? "Other",
      p.land_type_desc ?? "",
      p.year_built ?? "",
      p.market_value ?? "",
      p.roof_sqft ?? "",
      p.solar_kw ?? "",
      p.solar_sunshine_median != null ? Math.round(p.solar_sunshine_median) : "",
      p.solar_max_panels != null && p.solar_panel_capacity_w != null
        ? ((p.solar_max_panels * p.solar_panel_capacity_w) / 1000).toFixed(1)
        : "",
      p.dist_peaker ?? "",
      p.dist_gas ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "property-viewer-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(filteredSorted.length / TABLE_PAGE);
  const tableRows  = filteredSorted.slice(tablePage * TABLE_PAGE, (tablePage + 1) * TABLE_PAGE);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Home
        </Button>
        <div className="h-5 w-px bg-border" />
        <h1 className="text-base font-semibold text-foreground">Property Viewer — Peaker Proximity</h1>
        {!queryError && (
          <span className="text-sm text-muted-foreground ml-2">
            {loading
              ? `Loading… (${properties.length.toLocaleString()} so far)`
              : `${properties.length.toLocaleString()} propert${properties.length === 1 ? "y" : "ies"}`}
          </span>
        )}
        {queryError && <span className="text-sm text-red-600 ml-2 font-medium">{queryError}</span>}
        <div className="ml-auto flex items-center gap-2">
          {properties.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                className="h-7 pl-7 pr-3 text-sm w-48"
                placeholder="Search address / owner…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setTablePage(0); }}
              />
            </div>
          )}
          {filteredSorted.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCsv} className="h-7 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Admin
              </span>
              <Button variant="ghost" size="sm" onClick={handleAdminLogout}>Log out</Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setShowAdminLogin(true)}>
              <Lock className="h-3.5 w-3.5 mr-1" />
              Admin login
            </Button>
          )}
        </div>
      </header>

      {/* Body: left (map+table) + right panel */}
      <div className="flex flex-1 min-h-0">

      {/* Left column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

      {/* Map + filters row */}
      <div className="flex flex-shrink-0" style={{ height: "52vh" }}>

        {/* Filter panel */}
        <aside className="w-72 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
          <div className="p-4 space-y-5">

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={proximityOn}
                  onChange={e => setProximityOn(e.target.checked)}
                  className="rounded accent-foreground" />
                <span className="text-sm font-medium text-foreground">Gas plant proximity</span>
              </label>
              {proximityOn && (
                <div className="pl-5 space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-muted-foreground">Max distance</span>
                      <span className="text-xs font-semibold">{maxDistMi} mi</span>
                    </div>
                    <input type="range" min={0.1} max={5} step={0.1}
                      value={maxDistMi} onChange={e => setMaxDistMi(Number(e.target.value))}
                      className="w-full accent-foreground" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                      <span>0.1 mi</span><span>5 mi</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={includeProposed}
                      onChange={e => setIncludeProposed(e.target.checked)}
                      className="rounded accent-foreground" />
                    <span className="text-sm text-foreground">Proposed peaker sites</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={includeGas}
                      onChange={e => setIncludeGas(e.target.checked)}
                      className="rounded accent-foreground" />
                    <span className="text-sm text-foreground">Existing gas plants</span>
                  </label>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={onlyWithSolar}
                onChange={e => setOnlyWithSolar(e.target.checked)}
                className="rounded accent-foreground" />
              <span className="text-sm font-medium text-foreground">Has Google Solar data</span>
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Property type</p>
                <button
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setSelectedTypes(
                    selectedTypes.length === ALL_TYPES.length ? [] : [...ALL_TYPES]
                  )}
                >
                  {selectedTypes.length === ALL_TYPES.length ? "none" : "all"}
                </button>
              </div>
              {ALL_TYPES.map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(t)}
                    onChange={e => setSelectedTypes(prev =>
                      e.target.checked ? [...prev, t] : prev.filter(x => x !== t)
                    )}
                    className="rounded accent-foreground"
                  />
                  <span className="text-sm text-foreground">{TYPE_LABEL[t]}</span>
                </label>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={fetchProperties}
              disabled={loading || (proximityOn && !includeGas && !includeProposed) || selectedTypes.length === 0}
            >
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading…</> : "Run Query"}
            </Button>

            <div className="pt-2 border-t border-border space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground mb-1">Map legend</p>
              {ALL_TYPES.map(t => (
                <div key={t} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TYPE_COLOR[t] }} />
                  <span className="text-xs text-foreground">{TYPE_LABEL[t]}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-yellow-400 bg-transparent" />
                <span className="text-xs text-foreground">Yellow ring = has solar</span>
              </div>
              {proximityOn && includeGas && (
                <div className="flex items-center gap-2 pt-1.5 mt-1.5 border-t border-border">
                  <span className="w-3 h-3 rounded-full flex-shrink-0 bg-[#7f1d1d]" />
                  <span className="text-xs text-foreground">Existing gas plant</span>
                </div>
              )}
              {proximityOn && includeProposed && (
                <div className={`flex items-center gap-2 ${proximityOn && includeGas ? "" : "pt-1.5 mt-1.5 border-t border-border"}`}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0 bg-amber-600" />
                  <span className="text-xs text-foreground">Proposed peaker site</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          <MapTokenLoader>
            <PropertyMap
              properties={properties}
              gasPlants={proximityOn && includeGas ? gasPlants : []}
              proposedSites={proximityOn && includeProposed ? proposedSites : []}
              siteCounts={proximityOn ? siteCounts : {}}
              plantCounts={proximityOn ? plantCounts : {}}
              radiusMi={proximityOn ? maxDistMi : 0}
              focusPid={focusPid}
              onSelect={setFocusPid}
            />
          </MapTokenLoader>
        </div>

      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border-t border-border bg-background">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-card border-b border-border z-10">
            <tr>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs w-8">#</th>
              {([
                { key: "address",      label: "Address",      align: "left"  },
                { key: "owner",        label: "Owner",        align: "left"  },
                { key: "zip",          label: "ZIP",          align: "left"  },
                { key: "property_type",label: "Type",         align: "left"  },
                { key: null,           label: "Land use",     align: "left"  },
                { key: "year_built",   label: "Built",        align: "right" },
                { key: "market_value", label: "Market value", align: "right" },
                { key: "roof_sqft",    label: "Roof sqft",    align: "right" },
                { key: "solar_kw",              label: "Solar kW",       align: "right" },
                { key: "solar_sunshine_median", label: "Sun score",      align: "right" },
                { key: "solar_max_panels",      label: "Max system",     align: "right" },
                { key: "solar_eligible_kw",     label: "75% TSRF kW",    align: "right" },
                { key: "solar_max_area_m2",     label: "Roof area",      align: "right" },
              ] as { key: SortKey | null; label: string; align: string }[]).map(col => (
                <th
                  key={col.label}
                  className={`px-3 py-2.5 font-medium text-muted-foreground text-xs ${col.align === "right" ? "text-right" : "text-left"} ${col.key ? "cursor-pointer select-none hover:text-foreground" : ""}`}
                  onClick={() => col.key && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.key && sortKey === col.key
                      ? sortDir === "asc"
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />
                      : col.key ? <span className="w-3 h-3 opacity-0 group-hover:opacity-30">↕</span> : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((p, i) => {
              const rowNum = tablePage * TABLE_PAGE + i + 1;
              return (
                <tr
                  key={p.pid}
                  onClick={() => setFocusPid(p.pid)}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground">{rowNum}</td>
                  <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                    {p.address ?? <span className="text-muted-foreground italic">No address</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap max-w-[160px] truncate">
                    {p.owner ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{p.zip ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap"
                      style={{
                        background: (TYPE_COLOR[p.property_type ?? ""] ?? "#6b7280") + "22",
                        color: TYPE_COLOR[p.property_type ?? ""] ?? "#6b7280",
                      }}
                    >
                      {TYPE_LABEL[p.property_type ?? ""] ?? "Other"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground max-w-[140px] truncate">
                    {p.land_type_desc ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {p.year_built ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-foreground whitespace-nowrap">
                    {p.market_value != null
                      ? `$${p.market_value.toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {p.roof_sqft != null ? p.roof_sqft.toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {p.solar_kw != null
                      ? <span className="text-emerald-600 font-medium">{p.solar_kw} kW</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {p.solar_sunshine_median != null ? `${Math.round(p.solar_sunshine_median).toLocaleString()} h` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {p.solar_max_panels != null && p.solar_panel_capacity_w != null
                      ? `${((p.solar_max_panels * p.solar_panel_capacity_w) / 1000).toFixed(1)} kW`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {p.solar_eligible_kw != null
                      ? <span className={p.solar_eligible_kw >= 3 ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>{p.solar_eligible_kw.toFixed(1)} kW</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {p.solar_max_area_m2 != null ? `${Math.round(p.solar_max_area_m2 * 10.764).toLocaleString()} sqft` : "—"}
                  </td>
                </tr>
              );
            })}
            {!loading && properties.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No properties match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card sticky bottom-0">
            <span className="text-xs text-muted-foreground">
              {tablePage * TABLE_PAGE + 1}–{Math.min((tablePage + 1) * TABLE_PAGE, sorted.length)} of {sorted.length.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                disabled={tablePage === 0}
                onClick={() => setTablePage(p => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {tablePage + 1} of {totalPages}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={tablePage >= totalPages - 1}
                onClick={() => setTablePage(p => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      </div> {/* end left column */}

      {/* Right panel: satellite + property info (full height) */}
      {focusPid && (() => {
        const sel = properties.find(p => p.pid === focusPid);
        if (!sel) return null;

        if (!rightPanelOpen) {
          return (
            <div className="w-8 flex-shrink-0 border-l border-border bg-card flex flex-col items-center pt-2 gap-2">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setRightPanelOpen(true)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          );
        }

        return (
          <div className="w-[36rem] flex-shrink-0 border-l border-border flex flex-col min-h-0">
            {/* Satellite map */}
            <div className="flex-shrink-0" style={{ height: "21vh" }}>
              <SatellitePane lat={sel.lat} lon={sel.lon} className="w-full h-full" />
            </div>
            {/* Property info */}
            <div className="flex-1 overflow-auto bg-card p-4 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-foreground leading-snug">
                    {sel.address ?? <span className="italic text-muted-foreground">No address</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sel.zip ?? ""}{sel.county ? ` · ${sel.county}` : ""}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isAdmin && (
                    <Button size="sm" variant="outline" onClick={() => setEditPid(focusPid)}>
                      Edit
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setRightPanelOpen(false)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: (TYPE_COLOR[sel.property_type ?? ""] ?? "#6b7280") + "22", color: TYPE_COLOR[sel.property_type ?? ""] ?? "#6b7280" }}>
                  {TYPE_LABEL[sel.property_type ?? ""] ?? "Other"}
                </span>
                {sel.has_solar && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">Solar</span>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[
                  { label: "Owner",        value: sel.owner },
                  { label: "Year built",   value: sel.year_built },
                  { label: "Market value", value: sel.market_value != null ? `$${sel.market_value.toLocaleString()}` : null },
                  { label: "Roof sqft",    value: sel.roof_sqft != null ? sel.roof_sqft.toLocaleString() : null },
                  { label: "Land use",     value: sel.land_type_desc },
                  { label: "PID",          value: sel.pid },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium text-foreground mt-0.5 break-words">{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Plant proximity</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Proposed peaker</span>
                  <span className="font-medium">{sel.dist_peaker != null ? `${sel.dist_peaker.toFixed(2)} mi` : "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gas plant</span>
                  <span className="font-medium">{sel.dist_gas != null ? `${sel.dist_gas.toFixed(2)} mi` : "—"}</span>
                </div>
              </div>

              {sel.solar_fetched_at && (
                <div className="border-t border-border pt-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Google Solar</p>
                  {sel.solar_max_panels == null ? (
                    <p className="text-xs text-muted-foreground italic">No building found in Solar API</p>
                  ) : (
                    <>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Roof sun score</dt>
                          <dd className="text-sm font-medium text-foreground mt-0.5">
                            {sel.solar_sunshine_median != null
                              ? `${Math.round(sel.solar_sunshine_median).toLocaleString()} hrs/yr`
                              : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Max system size</dt>
                          <dd className="text-sm font-medium text-foreground mt-0.5">
                            {sel.solar_max_panels != null && sel.solar_panel_capacity_w != null
                              ? `${((sel.solar_max_panels * sel.solar_panel_capacity_w) / 1000).toFixed(1)} kW`
                              : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Eligible (75% TSRF)</dt>
                          <dd className="text-sm font-medium mt-0.5">
                            {sel.solar_eligible_kw != null
                              ? <span className={sel.solar_eligible_kw >= 3 ? "text-emerald-600" : "text-amber-600"}>{sel.solar_eligible_kw.toFixed(1)} kW{sel.solar_eligible_kw < 3 ? " — below AE 3 kW min" : ""}</span>
                              : <span className="text-foreground">—</span>}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Max panels</dt>
                          <dd className="text-sm font-medium text-foreground mt-0.5">
                            {sel.solar_max_panels ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Usable roof area</dt>
                          <dd className="text-sm font-medium text-foreground mt-0.5">
                            {sel.solar_max_area_m2 != null ? `${Math.round(sel.solar_max_area_m2 * 10.764).toLocaleString()} sqft` : "—"}
                          </dd>
                        </div>
                      </dl>
                      {segments.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Roof segments</p>
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left font-normal pb-1">Face</th>
                                <th className="text-right font-normal pb-1">Pitch</th>
                                <th className="text-right font-normal pb-1">Area</th>
                                <th className="text-right font-normal pb-1">Sun hrs</th>
                              </tr>
                            </thead>
                            <tbody>
                              {segments.map(s => (
                                <tr key={s.segment_index} className="border-t border-border/50">
                                  <td className="py-0.5 font-medium">{azimuthLabel(s.azimuth_deg)} <span className="text-muted-foreground font-normal">{Math.round(s.azimuth_deg)}°</span></td>
                                  <td className="text-right py-0.5">{Math.round(s.pitch_deg)}°</td>
                                  <td className="text-right py-0.5">{Math.round(s.area_m2 * 10.764)} sqft</td>
                                  <td className="text-right py-0.5">{Math.round(s.sunshine_median).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Imagery: {sel.solar_imagery_quality ?? "—"} · {sel.solar_imagery_date ?? "—"}
                      </p>
                      <Link
                        to={`/property/${sel.pid}/${slugifyAddress(sel.address ?? "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline underline-offset-2"
                      >
                        View property solar page ↗
                      </Link>
                    </>
                  )}
                </div>
              )}

              {(sel.solar_permits ?? []).length > 0 && (
                <div className="border-t border-border pt-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {(() => { const n = (sel.solar_permits ?? []).length; return `Solar permit${n > 1 ? `s (${n})` : ""}`; })()}
                  </p>
                  {(sel.solar_permits ?? []).map((permit, i) => (
                    <div key={i} className="bg-background rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {permit.installed_kw != null ? `${permit.installed_kw} kW` : "Size unknown"}
                        </span>
                        {permit.status_current && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            permit.status_current.toLowerCase().includes("final") || permit.status_current.toLowerCase().includes("complet")
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {permit.status_current}
                          </span>
                        )}
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        {permit.issued_date    && <><dt className="text-muted-foreground">Issued</dt><dd className="font-medium">{permit.issued_date.slice(0, 10)}</dd></>}
                        {permit.completed_date && <><dt className="text-muted-foreground">Completed</dt><dd className="font-medium">{permit.completed_date.slice(0, 10)}</dd></>}
                        {permit.contractor_company && <><dt className="text-muted-foreground">Contractor</dt><dd className="font-medium col-span-1 truncate" title={permit.contractor_company}>{permit.contractor_company}</dd></>}
                        {permit.total_job_valuation && <><dt className="text-muted-foreground">Valuation</dt><dd className="font-medium">${permit.total_job_valuation.toLocaleString()}</dd></>}
                        {permit.permit_number && <><dt className="text-muted-foreground">Permit #</dt><dd className="font-medium">{permit.permit_number}</dd></>}
                      </dl>
                      {permit.link && (
                        <a href={permit.link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline">
                          View permit ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      </div> {/* end body */}

      <Dialog open={showAdminLogin} onOpenChange={open => { setShowAdminLogin(open); setAdminPassword(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Admin login
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-pw">Password</Label>
              <Input
                id="admin-pw"
                type="password"
                autoFocus
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                disabled={adminLogging}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdminLogin(false)} disabled={adminLogging}>
                Cancel
              </Button>
              <Button type="submit" disabled={adminLogging || !adminPassword.trim()}>
                {adminLogging ? "Logging in…" : "Log in"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {editPid && (() => {
        const sel = properties.find(p => p.pid === editPid);
        if (!sel) return null;
        return (
          <PropertyEditModal
            property={sel}
            onClose={() => setEditPid(null)}
            onSave={(updated) => {
              setProperties(prev => prev.map(p => p.pid === updated.pid ? updated : p));
              setEditPid(null);
            }}
          />
        );
      })()}
    </div>
  );
}
