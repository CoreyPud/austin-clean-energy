import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import Map from "@/components/Map";
import MapTokenLoader from "@/components/MapTokenLoader";
import { useSeo } from "@/hooks/use-seo";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { 
  TrendingUp, 
  Building2, 
  Zap, 
  Calendar,
  ArrowRight,
  ExternalLink,
  Home,
  Car,
  TreePine
} from "lucide-react";

const CityOverview = () => {
  useSeo({
    title: "City Overview",
    description: "Track Austin's clean energy progress with real-time solar permit data, installation trends, and city-wide adoption metrics.",
  });
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentInstallations, setRecentInstallations] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [chartView, setChartView] = useState<'yearly' | 'quarterly'>('yearly');
  const [quarterlyData, setQuarterlyData] = useState<any[]>([]);
  const [quarterlyYears, setQuarterlyYears] = useState<number[]>([]);
  const [isLoadingQuarterly, setIsLoadingQuarterly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingYearly, setIsLoadingYearly] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  const [builtRows, setBuiltRows] = useState<Array<{ year: number; property_type: string; zip: string; built_count: number }>>([]);
  const [solarRows, setSolarRows] = useState<Array<{ year: number; permit_class: string; zip: string; solar_count: number }>>([]);
  const [isLoadingAdoption, setIsLoadingAdoption] = useState(true);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'all' | 'residential' | 'commercial'>('all');
  const [zipFilter, setZipFilter] = useState<string>('all');
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapFitKey, setMapFitKey] = useState<string | undefined>(undefined);
  const [isLoadingMapData, setIsLoadingMapData] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(10);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  const QUARTER_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(142, 76%, 36%)',
    'hsl(280, 65%, 60%)',
    'hsl(25, 95%, 53%)',
    'hsl(199, 89%, 48%)',
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load cached stats
        const { data: cachedStats } = await supabase
          .from('cached_stats')
          .select('*');

        // Load installations for map (using view for corrections)
        const { data: installations } = await supabase
          .from('solar_installations_view')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('completed_date', { ascending: false })
          .limit(200);

        console.log('Loaded installations for map:', installations?.length || 0);

        // Calculate capacity for rolling 12 months
        const now = new Date();
        const twelveMonthsAgoForCapacity = new Date(now);
        twelveMonthsAgoForCapacity.setMonth(now.getMonth() - 12);
        const startDateForCapacity = twelveMonthsAgoForCapacity.toISOString().split('T')[0];
        
        const { data: thisYearInstallations } = await supabase
          .from('solar_installations_view')
          .select('installed_kw')
          .gte('completed_date', startDateForCapacity);

        const thisYearCapacityKW = thisYearInstallations?.reduce(
          (sum, inst) => sum + (Number(inst.installed_kw) || 0),
          0
        ) || 0;

        // Get accurate total count of all installations
        const { count: totalProjectsCount, error: totalCountError } = await supabase
          .from('solar_installations_view')
          .select('id', { head: true, count: 'exact' });

        if (totalCountError) {
          console.error('Error counting total installations:', totalCountError);
        }

        // Calculate rolling 12 months installations
        const today = new Date();
        const twelveMonthsAgo = new Date(today);
        twelveMonthsAgo.setMonth(today.getMonth() - 12);
        const startDate = twelveMonthsAgo.toISOString().split('T')[0];

        // Use a count query to avoid row limits and align with "completed installations"
        const { count: completedThisYear, error: countError } = await supabase
          .from('solar_installations_view')
          .select('id', { head: true, count: 'exact' })
          .gte('completed_date', startDate);

        if (countError) {
          console.error('Error counting completed installations this year:', countError);
        }

        const thisYearInstalls = typeof completedThisYear === 'number' ? completedThisYear : 0;

        setStats({
          cached: cachedStats,
          thisYearCapacityKW: thisYearCapacityKW,
          thisYearInstalls,
          totalInstalls: typeof totalProjectsCount === 'number' ? totalProjectsCount : 0
        });

        setRecentInstallations(installations || []);
        // Set initial map markers (commercial = blue, residential/other = green)
        const initialMarkers = (installations || []).slice(0, 100).map(install => ({
          coordinates: [install.longitude, install.latitude] as [number, number],
          title: install.address,
          address: install.address,
          capacity: install.installed_kw ? `${install.installed_kw} kW` : 'Capacity unknown',
          installDate: install.completed_date || install.issued_date,
          id: install.id,
          color: String(install.permit_class || '').toLowerCase() === 'commercial' ? '#2563eb' : '#22c55e'
        }));
        console.log('Setting initial map markers:', initialMarkers.length);
        setMapMarkers(initialMarkers);
        setIsLoading(false);

        // Data sync is now admin-only; public pages read cached data only
      } catch (error) {
        console.error('Error loading city data:', error);
        setIsLoading(false);
      }
    };

    const loadYearlyData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('yearly-stats');
        if (error) throw error;
        // Transform data to separate solar-only from battery installations
        const transformedData = (data.data || []).map((item: any) => ({
          ...item,
          solarOnly: item.count - item.batteryCount
        }));
        setYearlyData(transformedData);
        setIsLoadingYearly(false);
      } catch (error) {
        console.error('Error loading yearly data:', error);
        setIsLoadingYearly(false);
      }
    };

    const loadTimelineData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('permit-timeline-stats');
        if (error) throw error;
        setTimelineData(data.data || []);
        setIsLoadingTimeline(false);
      } catch (error) {
        console.error('Error loading timeline data:', error);
        setIsLoadingTimeline(false);
      }
    };

    const loadAdoptionData = async () => {
      try {
        // Paginate both aggregated views
        const fetchAll = async <T,>(table: string, columns: string): Promise<T[]> => {
          const pageSize = 1000;
          let from = 0;
          const out: T[] = [];
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { data, error } = await (supabase as any)
              .from(table)
              .select(columns)
              .range(from, from + pageSize - 1);
            if (error) throw error;
            if (!data || data.length === 0) break;
            out.push(...(data as T[]));
            if (data.length < pageSize) break;
            from += pageSize;
          }
          return out;
        };

        const [built, solar] = await Promise.all([
          fetchAll<any>('tcad_built_by_year_type_zip', 'year, property_type, zip, built_count'),
          fetchAll<any>('solar_permits_by_year_class_zip', 'year, permit_class, zip, solar_count'),
        ]);

        setBuiltRows(
          built
            .filter((r) => r.year != null)
            .map((r) => ({
              year: Number(r.year),
              property_type: String(r.property_type || 'unknown'),
              zip: String(r.zip || 'unknown'),
              built_count: Number(r.built_count) || 0,
            }))
        );
        setSolarRows(
          solar
            .filter((r) => r.year != null)
            .map((r) => ({
              year: Number(r.year),
              permit_class: String(r.permit_class || 'unknown').toLowerCase(),
              zip: String(r.zip || 'unknown'),
              solar_count: Number(r.solar_count) || 0,
            }))
        );
      } catch (err) {
        console.error('Error loading adoption data:', err);
      } finally {
        setIsLoadingAdoption(false);
      }
    };

    loadData();
    loadYearlyData();
    loadTimelineData();
    loadAdoptionData();
  }, []);

  // Load quarterly data when user switches to quarterly view
  useEffect(() => {
    if (chartView !== 'quarterly' || quarterlyData.length > 0) return;
    
    const loadQuarterlyData = async () => {
      setIsLoadingQuarterly(true);
      try {
        const { data: result, error } = await supabase.functions.invoke('quarterly-stats');
        if (error) throw error;
        
        setQuarterlyData(result.data || []);
        setQuarterlyYears(result.years || []);
      } catch (error) {
        console.error('Error loading quarterly data:', error);
      } finally {
        setIsLoadingQuarterly(false);
      }
    };

    loadQuarterlyData();
  }, [chartView, quarterlyData.length]);

  // Refresh map markers when filters change (silently — no loading spinner after initial load).
  const didMountFiltersRef = useRef(false);
  useEffect(() => {
    if (!didMountFiltersRef.current) {
      didMountFiltersRef.current = true;
      return;
    }
    let cancelled = false;
    const loadFilteredMarkers = async () => {
      try {
        let query = supabase
          .from('solar_installations_view')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);
        if (zipFilter !== 'all') query = query.eq('original_zip', zipFilter);
        if (propertyTypeFilter !== 'all') query = query.ilike('permit_class', propertyTypeFilter);
        const { data, error } = await query
          .order('completed_date', { ascending: false })
          .limit(100);
        if (error) throw error;
        if (cancelled) return;
        const newMarkers = (data || []).map((install: any) => ({
          coordinates: [install.longitude, install.latitude] as [number, number],
          title: install.address,
          address: install.address,
          capacity: install.installed_kw ? `${install.installed_kw} kW` : 'Capacity unknown',
          installDate: install.completed_date || install.issued_date,
          id: install.id,
          color: String(install.permit_class || '').toLowerCase() === 'commercial' ? '#2563eb' : '#22c55e',
        }));
        setMapMarkers(newMarkers);
        if ((zipFilter !== 'all' || propertyTypeFilter !== 'all') && newMarkers.length > 0) {
          setMapFitKey(`${zipFilter}-${propertyTypeFilter}-${Date.now()}`);
        }
      } catch (err) {
        console.error('Error loading filtered installations:', err);
      }
    };
    loadFilteredMarkers();
    return () => { cancelled = true; };
  }, [zipFilter, propertyTypeFilter]);

  const handleMapBoundsChange = async (bounds: { north: number; south: number; east: number; west: number; zoom: number }) => {
    // Debounce to prevent rapid repeated calls
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    setCurrentZoom(bounds.zoom);

    loadingTimeoutRef.current = setTimeout(async () => {
      // Silent reload — no loading overlay after initial map load
      console.log('Fetching installations for bounds:', bounds);

      try {
        // Query installations within the visible bounds (using view for corrections)
        let query = supabase
          .from('solar_installations_view')
          .select('*')
          .gte('latitude', bounds.south)
          .lte('latitude', bounds.north)
          .gte('longitude', bounds.west)
          .lte('longitude', bounds.east)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);
        if (zipFilter !== 'all') query = query.eq('original_zip', zipFilter);
        if (propertyTypeFilter !== 'all') query = query.ilike('permit_class', propertyTypeFilter);
        const { data: boundedInstallations, error } = await query
          .order('completed_date', { ascending: false })
          .limit(200);

        if (error) {
          console.error('Error querying installations:', error);
          return;
        }

        console.log('Bounded installations found:', boundedInstallations?.length || 0);

        // Only update markers if we have results
        if (boundedInstallations && boundedInstallations.length > 0) {
          const newMarkers = boundedInstallations.map(install => ({
            coordinates: [install.longitude, install.latitude] as [number, number],
            title: install.address,
            address: install.address,
            capacity: install.installed_kw ? `${install.installed_kw} kW` : 'Capacity unknown',
            installDate: install.completed_date || install.issued_date,
            id: install.id,
            color: String(install.permit_class || '').toLowerCase() === 'commercial' ? '#2563eb' : '#22c55e'
          }));
          console.log('Updating map with new markers:', newMarkers.length);
          setMapMarkers(newMarkers);
        } else {
          console.log('No installations found in bounds, keeping existing markers');
        }
      } catch (error) {
        console.error('Error loading installations for bounds:', error);
      }
    }, 500); // 500ms debounce
  };


  const resources = [
    {
      title: "Solar Rebate Program",
      description: "Up to $2,500 for residential solar installations",
      link: "https://austinenergy.com/green-power/solar-solutions",
      icon: Zap,
    },
    {
      title: "Free Home Energy Audit",
      description: "Professional assessment identifying $300-800 in annual savings",
      link: "https://austinenergy.com/energy-efficiency/rebates-incentives/residential/home-improvements/home-energy-savings",
      icon: Home,
    },
    {
      title: "Climate Action Plan",
      description: "Track Austin's progress toward net-zero emissions",
      link: "https://www.austintexas.gov/climate",
      icon: TreePine,
    },
    {
      title: "EV Charging Rebates",
      description: "Up to $1,200 for home Level 2 charger installation",
      link: "https://austinenergy.com/ev",
      icon: Car,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-secondary to-accent py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-6 text-white hover:bg-white/10"
            >
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              Back to Home
            </Button>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Austin's Clean Energy Progress
            </h1>
            <p className="text-xl md:text-2xl text-white/90">
              Real-time insights into our city's solar adoption, energy efficiency, and path to net-zero emissions
            </p>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-8 w-8 mb-3" />
                    <Skeleton className="h-10 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <Building2 className="h-8 w-8 text-primary mb-3" />
                    <div className="text-3xl font-bold text-primary mb-1">
                      {(stats?.cached?.find((s: any) => s.stat_type === 'solar_permits')?.value || stats?.totalInstalls)?.toString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Solar Installations</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Zap className="h-8 w-8 text-primary mb-3" />
                    <div className="text-3xl font-bold text-primary mb-1">
                      {stats?.thisYearCapacityKW?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-muted-foreground">kW in the Last 12 Months</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <TrendingUp className="h-8 w-8 text-primary mb-3" />
                    <div className="text-3xl font-bold text-primary mb-1">
                      {stats?.thisYearInstalls}
                    </div>
                    <div className="text-sm text-muted-foreground">In the Last 12 Months</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Calendar className="h-8 w-8 text-primary mb-3" />
                    <div className="text-3xl font-bold text-primary mb-1">
                      {stats?.cached?.find((s: any) => s.stat_type === 'zip_codes')?.value || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Zip Codes with Solar</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/data-sources')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Learn more about our data sources and how these metrics are calculated →
            </button>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Solar Installations Across Austin</CardTitle>
              <CardDescription>
                {currentZoom <= 11 
                  ? "Interactive map showing 100 recent solar installations. Zoom in to see more installations in specific areas."
                  : `Showing ${mapMarkers.length} installations in the zoomed area${isLoadingMapData ? ' (loading...)' : ''}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Loading map data...</span>
                  </div>
                </div>
              ) : (
                <MapTokenLoader>
                  <Map 
                    className="h-[500px] rounded-lg overflow-hidden"
                    center={[-97.7431, 30.2672]}
                    zoom={9}
                    markers={mapMarkers}
                    fitMarkersKey={mapFitKey}
                    enableDynamicLoading={true}
                    onBoundsChange={handleMapBoundsChange}
                    isLoadingMapData={isLoadingMapData}
                    showLegend={true}
                  />
                </MapTokenLoader>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Solar Growth Trends */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Solar Installation Growth
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tracking verified solar adoption trends in Austin based on city permit data
            </p>
          </div>

          {/* Cumulative property count vs cumulative solar permits, filterable by property type + ZIP */}
          {(() => {
            const currentYear = new Date().getFullYear();
            const years: number[] = [];
            for (let y = 2014; y <= currentYear; y++) years.push(y);

            const RES_TCAD_TYPES = new Set(['single_family', 'condo', 'multifamily']);
            const COM_TCAD_TYPES = new Set(['commercial']);

            const tcadTypeMatches = (pt: string) => {
              if (propertyTypeFilter === 'all') return RES_TCAD_TYPES.has(pt) || COM_TCAD_TYPES.has(pt);
              if (propertyTypeFilter === 'residential') return RES_TCAD_TYPES.has(pt);
              return COM_TCAD_TYPES.has(pt);
            };
            const permitClassMatches = (cls: string) => {
              if (propertyTypeFilter === 'all') return cls === 'residential' || cls === 'commercial';
              return cls === propertyTypeFilter;
            };
            const zipMatches = (z: string) => zipFilter === 'all' || z === zipFilter;

            // ZIP options: rank by total built (filtered by current property type), include current solar % when non-zero
            const builtByZip: Record<string, number> = {};
            const solarByZip: Record<string, number> = {};
            builtRows.forEach((r) => {
              if (!r.zip || r.zip === 'unknown') return;
              if (!tcadTypeMatches(r.property_type)) return;
              builtByZip[r.zip] = (builtByZip[r.zip] || 0) + r.built_count;
            });
            solarRows.forEach((r) => {
              if (!r.zip || r.zip === 'unknown') return;
              if (!permitClassMatches(r.permit_class)) return;
              solarByZip[r.zip] = (solarByZip[r.zip] || 0) + r.solar_count;
            });
            const fmtInt = (n: number) => n.toLocaleString('en-US');
            const zipOptions = Object.keys(builtByZip)
              .map((z) => {
                const built = builtByZip[z] || 0;
                const solar = Math.min(solarByZip[z] || 0, built);
                const pct = built > 0 ? (100 * solar) / built : 0;
                return { value: z, built, pct };
              })
              .sort((a, b) => b.pct - a.pct || b.built - a.built)
              .map(({ value, built, pct }) => ({
                value,
                label: `${value} — ${fmtInt(built)} buildings, ${pct.toFixed(1)}% solar coverage`,
              }));

            // Aggregate filtered built-counts and solar-counts by year
            const builtByYear: Record<number, number> = {};
            builtRows.forEach((r) => {
              if (!tcadTypeMatches(r.property_type)) return;
              if (!zipMatches(r.zip)) return;
              builtByYear[r.year] = (builtByYear[r.year] || 0) + r.built_count;
            });
            const solarByYear: Record<number, number> = {};
            solarRows.forEach((r) => {
              if (!permitClassMatches(r.permit_class)) return;
              if (!zipMatches(r.zip)) return;
              solarByYear[r.year] = (solarByYear[r.year] || 0) + r.solar_count;
            });

            // Monotonic cumulative built (by year_built)
            const builtYearsSorted = Object.keys(builtByYear).map(Number).sort((a, b) => a - b);
            const cumulativeBuiltByYear: Record<number, number> = {};
            let runningBuilt = 0;
            builtYearsSorted.forEach((y) => {
              runningBuilt += builtByYear[y];
              cumulativeBuiltByYear[y] = runningBuilt;
            });

            let lastTotal = 0;
            const presetYears = builtYearsSorted.filter((y) => y <= 2013);
            if (presetYears.length) lastTotal = cumulativeBuiltByYear[presetYears[presetYears.length - 1]];

            let runningPermits = 0;
            const chartData = years.map((y) => {
              runningPermits += solarByYear[y] || 0;
              if (cumulativeBuiltByYear[y] !== undefined) lastTotal = cumulativeBuiltByYear[y];
              const solar = Math.min(runningPermits, lastTotal);
              const remaining = Math.max(0, lastTotal - solar);
              return {
                year: y,
                solar_count: solar,
                remaining_count: remaining,
                total_count: lastTotal,
              };
            });

            const isLoading = isLoadingAdoption;
            const fmtCompact = (v: number) => {
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
              if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
              return `${v}`;
            };
            const label =
              propertyTypeFilter === 'all' ? 'All properties'
              : propertyTypeFilter === 'residential' ? 'Residential'
              : 'Commercial';

            return (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">Solar Adoption Over Time</CardTitle>
                      <CardDescription>
                        Portion of properties with rooftop solar over time.
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Select value={propertyTypeFilter} onValueChange={(v) => setPropertyTypeFilter(v as any)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All property types</SelectItem>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={zipFilter} onValueChange={setZipFilter}>
                        <SelectTrigger className="w-full sm:w-[340px]">
                          <SelectValue placeholder="ZIP code" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="all">All ZIP codes</SelectItem>
                          {zipOptions.map((z) => (
                            <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={fmtCompact} />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              const pct = d.total_count > 0 ? (d.solar_count / d.total_count) * 100 : 0;
                              return (
                                <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                                  <p className="font-medium text-sm mb-1">Through {d.year} — {label}{zipFilter !== 'all' ? ` · ${zipFilter}` : ''}</p>
                                  <p className="text-sm">
                                    <span style={{ color: 'hsl(var(--primary))' }}>With solar:</span>{' '}
                                    {Number(d.solar_count).toLocaleString()}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Total properties: {Number(d.total_count).toLocaleString()}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {pct.toFixed(2)}% adoption
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="solar_count" stackId="a" fill="hsl(var(--primary))" name="With solar" />
                        <Bar dataKey="remaining_count" stackId="a" fill="hsl(var(--muted-foreground) / 0.3)" name="Without solar" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Sources: City of Austin solar permits (2014–present) and TCAD property records.
                  </p>
                </CardContent>
              </Card>
            );
          })()}

          {/* Yearly / Quarterly Installations Chart */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">
                    {chartView === 'yearly' ? 'Solar Installations by Year' : 'Quarterly Year-over-Year Comparison'}
                  </CardTitle>
                  <CardDescription>
                    {chartView === 'yearly' 
                      ? 'Annual growth of solar projects in Austin (2014-present)'
                      : 'Compare installation counts by quarter across years'}
                  </CardDescription>
                </div>
                <Tabs value={chartView} onValueChange={(v) => setChartView(v as 'yearly' | 'quarterly')}>
                  <TabsList>
                    <TabsTrigger value="yearly">By Year</TabsTrigger>
                    <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {chartView === 'yearly' ? (
                <>
                  {isLoadingYearly ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : yearlyData.filter((d: any) => Number(d.year) >= 2014).length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={yearlyData.filter((d: any) => Number(d.year) >= 2014)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Legend 
                          verticalAlign="top" 
                          align="right"
                          iconType="square"
                          wrapperStyle={{ paddingBottom: '20px' }}
                        />
                        <RechartsTooltip
                          labelFormatter={() => ''}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                                  <p className="text-sm"><span className="text-primary">Solar Only:</span> {data.solarOnly}</p>
                                  <p className="text-sm"><span className="text-secondary">With Battery:</span> {data.batteryCount}</p>
                                  <p className="text-sm font-semibold mt-1"><span className="text-muted-foreground">Total kW:</span> {data.totalKW?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="batteryCount" stackId="a" fill="hsl(var(--secondary))" name="With Battery" />
                        <Bar dataKey="solarOnly" stackId="a" fill="hsl(var(--primary))" name="Solar Only" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No yearly data available
                    </div>
                  )}
                </>
              ) : (
                <>
                  {isLoadingQuarterly ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : quarterlyData.length > 0 ? (
                    (() => {
                      // Show last 5 years for readability
                      const displayYears = quarterlyYears.slice(-5);
                      return (
                        <>
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={quarterlyData} barCategoryGap="15%">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="quarter" />
                              <YAxis />
                              <Legend 
                                verticalAlign="top" 
                                align="center"
                                iconType="square"
                                wrapperStyle={{ paddingBottom: '20px' }}
                              />
                              <RechartsTooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                                        <p className="font-medium text-sm mb-2">{label}</p>
                                        {payload.map((entry: any, idx: number) => (
                                          <p key={idx} className="text-sm" style={{ color: entry.color }}>
                                            {entry.name}: {entry.value?.toLocaleString()}
                                          </p>
                                        ))}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              {displayYears.map((year, idx) => (
                                <Bar 
                                  key={year} 
                                  dataKey={`y${year}`} 
                                  name={String(year)} 
                                  fill={QUARTER_COLORS[idx % QUARTER_COLORS.length]}
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Showing {displayYears[0]}–{displayYears[displayYears.length - 1]}. Based on permit completion dates.
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      No quarterly data available
                    </div>
                  )}
                </>
              )}
              <div className="mt-4 text-xs text-muted-foreground italic px-2">
                Note: kW capacity values are based on permit records and may not represent total installed capacity in all cases.
              </div>
            </CardContent>
          </Card>

          {/* Permit Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Average Permit to Completion Time</CardTitle>
              <CardDescription>
                Average days between permit application and completion by year (2014-present)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTimeline ? (
                <Skeleton className="h-[300px] w-full" />
              ) : timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'averageDays') return [`${value} days`, 'Average Processing Time'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="averageDays" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No timeline data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Available Programs & Resources
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Take advantage of local incentives and programs to accelerate your clean energy transition
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {resources.map((resource, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <resource.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{resource.title}</CardTitle>
                      <CardDescription className="text-sm">{resource.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(resource.link, '_blank')}
                  >
                    Learn More
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join Austin's Clean Energy Movement
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Get a personalized assessment for your property and see what's possible
            </p>
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/property-assessment")}
                className="bg-white text-primary hover:bg-white/90"
              >
                Assess Your Property
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CityOverview;
