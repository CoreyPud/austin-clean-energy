import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Sun, Zap, Car, Bike, Building2, DollarSign,
  Lightbulb, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GuidePage {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  category: string;
  icon: string;
  summary: string;
  sort_order: number;
}

function getIcon(iconName: string) {
  const normalized = iconName.toLowerCase();
  if (normalized.includes("sun")) return Sun;
  if (normalized.includes("zap")) return Zap;
  if (normalized.includes("car")) return Car;
  if (normalized.includes("bike")) return Bike;
  if (normalized.includes("building")) return Building2;
  if (normalized.includes("dollar")) return DollarSign;
  return Lightbulb;
}

// Category colors using semantic tokens
const CATEGORY_COLORS: Record<string, string> = {
  "Solar Energy": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "Energy Efficiency": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "Electric Vehicles": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "Transportation": "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  "Green Building": "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  "Financial Assistance": "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export default function Guides() {
  const [guides, setGuides] = useState<GuidePage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('guide_pages')
        .select('id, slug, title, meta_description, category, icon, summary, sort_order')
        .eq('published', true)
        .order('sort_order');

      if (error) throw error;
      setGuides(data || []);
    } catch (err) {
      console.error("Error loading guides:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group by category
  const categories = guides.reduce<Record<string, GuidePage[]>>((acc, guide) => {
    if (!acc[guide.category]) acc[guide.category] = [];
    acc[guide.category].push(guide);
    return acc;
  }, {});

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
            Everything Austin residents need to know about solar, EVs, energy efficiency, 
            and local programs that save money and reduce emissions.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              </div>
            ))}
          </div>
        ) : guides.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Guide content is being prepared. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {Object.entries(categories).map(([category, categoryGuides]) => {
              const Icon = getIcon(categoryGuides[0]?.icon || "");
              const colorClass = CATEGORY_COLORS[category] || "bg-primary/10 text-primary";
              return (
                <section key={category}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${colorClass.split(' ')[0]}`}>
                      <Icon className={`h-6 w-6 ${colorClass.split(' ').slice(1).join(' ')}`} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{category}</h2>
                    <Badge variant="outline" className="text-xs font-normal">
                      {categoryGuides.length} {categoryGuides.length === 1 ? 'guide' : 'guides'}
                    </Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryGuides.map((guide) => (
                      <Link key={guide.id} to={`/guides/${guide.slug}`}>
                        <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base group-hover:text-primary transition-colors leading-snug">
                              {guide.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-sm mb-3 line-clamp-3">
                              {guide.summary}
                            </CardDescription>
                            <span className="text-sm text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                              Read Guide
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
