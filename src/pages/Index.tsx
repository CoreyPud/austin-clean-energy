import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Building2, Battery, Leaf } from "lucide-react";
import heroImage from "@/assets/hero-solar.jpg";

const Index = () => {
  const navigate = useNavigate();
  const modules = [
    {
      icon: BarChart3,
      title: "Area Opportunity Analysis",
      description: "Analyze neighborhoods and zip codes for solar, efficiency, and storage potential across Austin.",
      features: ["Community-level insights", "Adoption momentum tracking", "Incentive opportunities"],
      gradient: "from-primary to-secondary",
    },
    {
      icon: Building2,
      title: "Property Assessment",
      description: "Get tailored clean energy recommendations for individual properties with detailed ROI analysis.",
      features: ["Solar viability scores", "Efficiency upgrades", "Battery storage fit"],
      gradient: "from-secondary to-accent",
    },
    {
      icon: Battery,
      title: "Recommendation Engine",
      description: "Prioritized action plans combining solar, efficiency, and storage for maximum impact.",
      features: ["Strategic insights", "Financial overview", "Next steps guidance"],
      gradient: "from-accent to-primary",
    },
  ];

  const stats = [
    { value: "250+", label: "Neighborhoods Analyzed", icon: BarChart3 },
    { value: "15k+", label: "Properties Assessed", icon: Building2 },
    { value: "$8M", label: "Estimated Savings", icon: Leaf },
    { value: "45%", label: "Avg. Energy Reduction", icon: Battery },
  ];

  return (
    <div className="min-h-screen">
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
                onClick={() => navigate("/area-analysis")}
                className="bg-accent hover:bg-accent/90 text-foreground font-semibold group"
              >
                Explore Opportunities
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate("/recommendations")}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                View Sample Analysis
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Three Powerful Modules
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From broad community insights to property-specific assessments and actionable recommendations
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {modules.map((module, index) => {
            const routes = ["/area-analysis", "/property-assessment", "/recommendations"];
            return (
              <Card 
                key={index} 
                onClick={() => navigate(routes[index])}
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
            );
          })}
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
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">About</h3>
              <p className="text-white/70 text-sm">
                Empowering Austin's climate action through data-driven clean energy insights
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Austin Energy Programs</li>
                <li>Federal Tax Credits</li>
                <li>Installation Partners</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Data Sources</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>City of Austin Open Data</li>
                <li>Energy Audit Records</li>
                <li>Solar Installation Data</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/60">
            © 2025 Austin Clean Energy Dashboard. Supporting climate action through data.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
