import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Building2, Battery, Leaf } from "lucide-react";
import heroImage from "@/assets/hero-austin-solar.jpg";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import CampaignPopup from "@/components/CampaignPopup";
import { useSeo } from "@/hooks/use-seo";

const Index = () => {
  useSeo({
    title: "Austin Clean Energy Opportunity Dashboard",
    description: "Data-driven insights for solar adoption, energy efficiency, and battery storage in Austin. Empowering residents and policymakers to accelerate clean energy transition.",
  });
  const navigate = useNavigate();
  const [stats, setStats] = useState<Array<{ value: string; label: string; icon: any }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // First, try to get cached stats from database
        const { data: cachedStats, error: cacheError } = await supabase
          .from('cached_stats')
          .select('*')
          .order('stat_type');

        if (!cacheError && cachedStats && cachedStats.length > 0) {
          // Map cached stats to display format (excluding energy_audits)
          const iconMap: Record<string, any> = {
            'zip_codes': BarChart3,
            'total_projects': Building2,
            'solar_permits': Leaf,
          };

          const displayStats = cachedStats
            .filter(stat => stat.stat_type !== 'energy_audits')
            .map(stat => ({
            value: stat.value,
            label: stat.label,
            icon: iconMap[stat.stat_type] || BarChart3
          }));

          setStats(displayStats);
          setIsLoading(false);
        }

        // Stats refresh is now admin-only; public pages read cached data only

      } catch (error) {
        console.error('Error loading stats:', error);
        setStats([
          { value: "Live", label: "Austin Open Data", icon: BarChart3 },
          { value: "Real-time", label: "Solar Permits", icon: Building2 },
          { value: "Verified", label: "Energy Audits", icon: Leaf },
          { value: "Active", label: "Data Sources", icon: Battery },
        ]);
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const modules = [
    {
      icon: Building2,
      title: "My Austin Energy Profile",
      description: "Enter your address to get neighborhood solar trends, your roof's potential, savings estimates, your council member, and tailored next steps — all in one place.",
      features: ["Neighborhood snapshot + map", "Solar savings + payback", "Your council representative", "Optional personalized plan"],
      gradient: "from-primary to-accent",
      route: "/property-assessment",
    },
    {
      icon: BarChart3,
      title: "City-Wide Progress",
      description: "See how Austin is tracking on solar permits, battery storage, and efficiency programs across every ZIP and council district.",
      features: ["Adoption by ZIP code", "Yearly + fiscal trends", "Permit timeline data"],
      gradient: "from-secondary to-accent",
      route: "/city-overview",
    },
  ];

  return (
    <div className="min-h-screen">
      <CampaignPopup />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-secondary/80" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Accelerate Austin's Clean Energy Future
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Data-driven insights for solar adoption, energy efficiency, and battery storage—empowering residents, 
              policymakers, and activists to make informed decisions that cut costs and reduce emissions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/city-overview")}
                className="bg-accent hover:bg-accent/90 text-foreground font-semibold"
              >
                View City-Wide Progress
              </Button>
              <Button 
                size="lg" 
                onClick={() => navigate("/property-assessment")}
                className="bg-accent hover:bg-accent/90 text-foreground font-semibold"
              >
                Get Personalized Plan
              </Button>
              <Button 
                size="lg" 
                onClick={() => navigate("/decarb-dashboard")}
                className="bg-accent hover:bg-accent/90 text-foreground font-semibold"
              >
                Path to Net Zero Simulator
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-12 md:gap-20">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="text-center">
                  <Skeleton className="h-8 w-8 mx-auto mb-3 rounded-full" />
                  <Skeleton className="h-10 w-24 mx-auto mb-2" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              ))
            ) : stats ? (
              stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))
            ) : null}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Three Ways to Get Started
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From broad community insights to property-specific assessments and actionable recommendations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {modules.map((module, index) => (
            <Card
              key={index}
              onClick={() => navigate(module.route)}
              className="group hover:shadow-lg transition-all duration-300 animate-scale-in border-2 hover:border-primary/50 cursor-pointer"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <CardHeader>
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${module.gradient} p-3.5 mb-4 group-hover:scale-110 transition-transform`}>
                  <module.icon className="h-full w-full text-white" />
                </div>
                <CardTitle className="text-xl mb-2">{module.title}</CardTitle>
                <CardDescription className="text-base">{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {module.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-secondary to-accent">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Drive Austin's Clean Energy Transition?
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Start exploring solar, efficiency, and storage opportunities in your neighborhood today
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/property-assessment")}
              className="bg-white text-primary hover:bg-white/90 font-semibold"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Index;
