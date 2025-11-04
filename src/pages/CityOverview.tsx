import { useEffect, useState } from "react";
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
  Target, 
  Calendar,
  ArrowRight,
  ExternalLink,
  Leaf,
  Home,
  Car,
  TreePine,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CityOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentInstallations, setRecentInstallations] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingYearly, setIsLoadingYearly] = useState(true);

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

        // Calculate total capacity (convert kW to MW)
        const { data: allInstallations } = await supabase
          .from('solar_installations')
          .select('installed_kw, completed_date, issued_date, calendar_year_issued');

        const totalCapacityKW = allInstallations?.reduce(
          (sum, inst) => sum + (Number(inst.installed_kw) || 0),
          0
        ) || 0;

        const totalCapacityMW = totalCapacityKW / 1000;

        // Calculate this year's installations (permitted or completed)
        const currentYear = new Date().getFullYear();
        const thisYearInstalls = allInstallations?.filter(inst => {
          // Check completed date first
          if (inst.completed_date) {
            const completedYear = new Date(inst.completed_date).getFullYear();
            if (completedYear === currentYear) return true;
          }
          // If not completed this year, check issued date (permitted)
          if (inst.issued_date) {
            const issuedYear = new Date(inst.issued_date).getFullYear();
            return issuedYear === currentYear;
          }
          // Fallback to calendar_year_issued field
          return inst.calendar_year_issued === currentYear;
        }).length || 0;

        setStats({
          cached: cachedStats,
          totalCapacity: totalCapacityMW.toFixed(1),
          thisYearInstalls,
          totalInstalls: allInstallations?.length || 0
        });

        setRecentInstallations(installations || []);
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

  // Austin's climate goals (from Climate Action Plan)
  const goals = [
    {
      title: "Net-Zero by 2040",
      progress: 35,
      description: "Community-wide carbon neutrality target",
      icon: Target,
      source: "Based on Austin's Climate Equity Plan tracking progress toward net-zero community-wide emissions by 2040"
    },
    {
      title: "100% Renewable",
      progress: 42,
      description: "Austin Energy's renewable energy mix",
      icon: Leaf,
      source: "Data from Austin Energy's renewable energy portfolio, tracking progress toward 100% carbon-free energy"
    },
    {
      title: "EV Transition",
      progress: 28,
      description: "Progress toward transportation electrification",
      icon: Car,
      source: "Estimated based on EV registrations and charging infrastructure deployment in Austin metro area"
    },
  ];

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
                      {stats?.totalInstalls?.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Solar Projects Tracked</div>
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
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Solar Installations Across Austin (Sample)</CardTitle>
              <CardDescription>
                Interactive map showing a sample of 100 recent solar installations in our community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MapTokenLoader>
                <Map 
                  className="h-[500px] rounded-lg overflow-hidden"
                  center={[-97.7431, 30.2672]}
                  zoom={10}
                  markers={recentInstallations.slice(0, 100).map(install => ({
                    coordinates: [install.longitude, install.latitude] as [number, number],
                    title: install.address,
                    address: install.address,
                    capacity: `${install.installed_kw} kW`,
                    installDate: install.completed_date || install.issued_date,
                    id: install.id,
                    color: '#22c55e'
                  }))}
                />
              </MapTokenLoader>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Progress Toward Goals */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Progress Toward Climate Goals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tracking Austin's journey to net-zero emissions and 100% renewable energy
            </p>
          </div>

          {/* Yearly Installations Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Solar Installations by Year</CardTitle>
              <CardDescription>
                Annual growth of solar projects in Austin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingYearly ? (
                <Skeleton className="h-[300px] w-full" />
              ) : yearlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yearlyData}>
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

          <div className="grid md:grid-cols-3 gap-8">
            <TooltipProvider>
              {goals.map((goal, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <goal.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{goal.title}</CardTitle>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{goal.source}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          {goal.progress}% Complete
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TooltipProvider>
          </div>
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
