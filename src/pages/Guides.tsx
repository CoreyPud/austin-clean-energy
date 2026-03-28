import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Sun, Zap, Car, Bike, Building2, DollarSign,
  ExternalLink, Lightbulb, RefreshCw, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Program {
  title: string;
  provider: string;
  description: string;
  incentive: string | null;
  eligibility: string | null;
  url: string;
  tip: string | null;
}

interface Category {
  id: string;
  title: string;
  icon: string;
  description: string;
  programs: Program[];
}

interface GuideData {
  categories: Category[];
  quickTips: string[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  zap: Zap,
  car: Car,
  bike: Bike,
  building: Building2,
  dollar: DollarSign,
};

function getIcon(iconName: string) {
  // Map common icon names
  const normalized = iconName.toLowerCase();
  if (normalized.includes("sun") || normalized.includes("solar")) return Sun;
  if (normalized.includes("zap") || normalized.includes("energy") || normalized.includes("efficiency")) return Zap;
  if (normalized.includes("car") || normalized.includes("ev") || normalized.includes("vehicle")) return Car;
  if (normalized.includes("bike") || normalized.includes("transport")) return Bike;
  if (normalized.includes("building") || normalized.includes("green")) return Building2;
  if (normalized.includes("dollar") || normalized.includes("financ")) return DollarSign;
  return Lightbulb;
}

export default function Guides() {
  const [guideData, setGuideData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGuide();
  }, []);

  const loadGuide = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-guide');
      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);
      setGuideData(data.guide);
    } catch (err) {
      console.error("Error loading guide:", err);
      setError("Unable to load guide content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <Link to="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mb-6">
            <ArrowLeft className="h-3 w-3" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Austin Clean Energy Guide
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Your complete guide to Austin's clean energy programs, rebates, and resources. 
            Save money while reducing your carbon footprint.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-40" />
                  <Skeleton className="h-40" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadGuide} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : guideData ? (
          <>
            {/* Quick Tips */}
            {guideData.quickTips && guideData.quickTips.length > 0 && (
              <Card className="mb-10 border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Quick Tips to Get Started
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {guideData.quickTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            <div className="space-y-12">
              {guideData.categories.map((category) => {
                const Icon = getIcon(category.icon);
                return (
                  <section key={category.id} id={category.id}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{category.title}</h2>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-6 ml-14">{category.description}</p>

                    <div className="grid gap-4 md:grid-cols-2">
                      {category.programs.map((program, i) => (
                        <Card key={i} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <CardTitle className="text-base">{program.title}</CardTitle>
                                <CardDescription className="text-xs">{program.provider}</CardDescription>
                              </div>
                              {program.incentive && (
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  {program.incentive}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">{program.description}</p>
                            
                            {program.eligibility && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Who qualifies:</span> {program.eligibility}
                              </p>
                            )}

                            {program.tip && (
                              <div className="text-xs bg-accent/50 rounded-md px-3 py-2 text-muted-foreground">
                                <span className="font-medium text-foreground">💡 Tip:</span> {program.tip}
                              </div>
                            )}

                            <a
                              href={program.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
                            >
                              Learn More
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* CTA */}
            <Card className="mt-12 text-center border-primary/20">
              <CardContent className="py-8">
                <h3 className="text-xl font-bold text-foreground mb-2">Want a Personalized Plan?</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Tell us about your home, transportation, and interests and we'll create a 
                  custom clean energy action plan just for you.
                </p>
                <Button asChild>
                  <Link to="/recommendations">Get Your Personalized Plan</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
