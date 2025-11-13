import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import Map from "@/components/Map";
import MapTokenLoader from "@/components/MapTokenLoader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
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
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentInstallations, setRecentInstallations] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingYearly, setIsLoadingYearly] = useState(true);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [isLoadingMapData, setIsLoadingMapData] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(10);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load cached stats
        const { data: cachedStats } = await supabase
          .from('cached_stats')
          .select('*');

        // Load installations for map (more than just recent)
        const { data: installations } = await supabase
          .from('solar_installations')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('completed_date', { ascending: false })
          .limit(200);

        console.log('Loaded installations for map:', installations?.length || 0);

        // Calculate capacity for this year only
        const yearForCapacity = new Date().getFullYear();
        const { data: thisYearInstallations } = await supabase
          .from('solar_installations')
          .select('installed_kw')
          .gte('completed_date', `${yearForCapacity}-01-01`)
          .lt('completed_date', `${yearForCapacity + 1}-01-01`);

        const thisYearCapacityKW = thisYearInstallations?.reduce(
          (sum, inst) => sum + (Number(inst.installed_kw) || 0),
          0
        ) || 0;

        // Get accurate total count of all installations
        const { count: totalProjectsCount, error: totalCountError } = await supabase
          .from('solar_installations')
          .select('id', { head: true, count: 'exact' });

        if (totalCountError) {
          console.error('Error counting total installations:', totalCountError);
        }

        // Calculate this year's installations (permitted or completed)
        const currentYear = new Date().getFullYear();
        const startOfYear = `${currentYear}-01-01`;
        const startOfNextYear = `${currentYear + 1}-01-01`;

        // Use a count query to avoid row limits and align with "completed installations"
        const { count: completedThisYear, error: countError } = await supabase
          .from('solar_installations')
          .select('id', { head: true, count: 'exact' })
          .gte('completed_date', startOfYear)
          .lt('completed_date', startOfNextYear);

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
        // Set initial map markers
        const initialMarkers = (installations || []).slice(0, 100).map(install => ({
          coordinates: [install.longitude, install.latitude] as [number, number],
          title: install.address,
          address: install.address,
          capacity: install.installed_kw ? `${install.installed_kw} kW` : 'Capacity unknown',
          installDate: install.completed_date || install.issued_date,
          id: install.id,
          color: '#22c55e'
        }));
        console.log('Setting initial map markers:', initialMarkers.length);
        setMapMarkers(initialMarkers);
        setIsLoading(false);

        // Background refresh from data sources, then update cached stats
        supabase.functions.invoke('fetch-stats').then(async () => {
          const { data: refreshed } = await supabase
            .from('cached_stats')
            .select('*');
          setStats((prev: any) => ({ ...prev, cached: refreshed || prev?.cached }));
        }).catch((e) => console.error('Failed to refresh stats', e));
      } catch (error) {
        console.error('Error loading city data:', error);
        setIsLoading(false);
      }
    };

    const loadYearlyData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('yearly-stats');
        if (error) throw error;
        setYearlyData(data.data || []);
        setIsLoadingYearly(false);
      } catch (error) {
        console.error('Error loading yearly data:', error);
        setIsLoadingYearly(false);
      }
    };

    loadData();
    loadYearlyData();
  }, []);

  const handleMapBoundsChange = async (bounds: { north: number; south: number; east: number; west: number; zoom: number }) => {
    // Debounce to prevent rapid repeated calls
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    setCurrentZoom(bounds.zoom);

    loadingTimeoutRef.current = setTimeout(async () => {
      setIsLoadingMapData(true);
      console.log('Fetching installations for bounds:', bounds);

      try {
        // Query installations within the visible bounds
        const { data: boundedInstallations, error } = await supabase
          .from('solar_installations')
          .select('*')
          .gte('latitude', bounds.south)
          .lte('latitude', bounds.north)
          .gte('longitude', bounds.west)
          .lte('longitude', bounds.east)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('completed_date', { ascending: false })
          .limit(200); // Load up to 200 installations in the zoomed area

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
            color: '#22c55e'
          }));
          console.log('Updating map with new markers:', newMarkers.length);
          setMapMarkers(newMarkers);
        } else {
          console.log('No installations found in bounds, keeping existing markers');
        }
      } catch (error) {
        console.error('Error loading installations for bounds:', error);
      } finally {
        setIsLoadingMapData(false);
      }
    }, 500); // 500ms debounce
  };


  const resources = [
    {
      title: "Solar Rebate Program",
      description: "Up to $2,500 for residential solar installations",
      link: "https://austinenergy.com/rebates/solar",
      icon: Zap,
    },
    {
      title: "Free Home Energy Audit",
      description: "Professional assessment identifying $300-800 in annual savings",
      link: "https://austinenergy.com/energy-efficiency/home-energy-audit",
      icon: Home,
    },
    {
      title: "Climate Action Plan",
      description: "Track Austin's progress toward net-zero emissions",
      link: "https://austin-climate-equity-plan-implementation-dashboard-austin.hub.arcgis.com/pages/database",
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
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Real-time insights into our city's solar adoption, energy efficiency, and path to net-zero emissions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/area-analysis")}
                className="bg-white text-primary hover:bg-white/90"
              >
                Analyze Your Neighborhood
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/property-assessment")}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                Assess Your Property
              </Button>
            </div>
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
                    <div className="text-sm text-muted-foreground">kW This Year</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <TrendingUp className="h-8 w-8 text-primary mb-3" />
                    <div className="text-3xl font-bold text-primary mb-1">
                      {stats?.thisYearInstalls}
                    </div>
                    <div className="text-sm text-muted-foreground">Installations This Year</div>
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
                    zoom={10}
                    markers={mapMarkers}
                    enableDynamicLoading={true}
                    onBoundsChange={handleMapBoundsChange}
                    isLoadingMapData={isLoadingMapData}
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

          {/* Yearly Installations Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Solar Installations by Year</CardTitle>
              <CardDescription>
                Annual growth of solar projects in Austin (2014-present)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingYearly ? (
                <Skeleton className="h-[300px] w-full" />
              ) : yearlyData.filter((d: any) => Number(d.year) >= 2014).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yearlyData.filter((d: any) => Number(d.year) >= 2014)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No yearly data available
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
              Explore opportunities in your neighborhood or get a personalized assessment for your property
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate("/area-analysis")}
                className="bg-white text-primary hover:bg-white/90"
              >
                Analyze Your Neighborhood
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                onClick={() => navigate("/property-assessment")}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                variant="outline"
              >
                Assess Your Property
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CityOverview;
