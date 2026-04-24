import { Link } from "react-router-dom";
import { Home, BarChart3, MapPin, Building2, Database, CalendarDays, Zap, BookOpen } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

const publicPages = [
  {
    path: "/",
    title: "Home",
    description: "Austin's clean energy dashboard — explore solar adoption trends, get personalized recommendations, and track progress.",
    icon: Home,
  },
  {
    path: "/city-overview",
    title: "City Overview",
    description: "City-wide solar installation statistics, year-over-year trends, and quarterly comparisons.",
    icon: BarChart3,
  },
  {
    path: "/property-assessment",
    title: "My Austin Energy Profile",
    description: "Address-driven profile: neighborhood snapshot, solar potential, savings, council member, and recommendations.",
    icon: Home,
  },
  {
    path: "/fiscal-year-stats",
    title: "Fiscal Year Stats",
    description: "Solar permit data broken down by City of Austin fiscal year periods.",
    icon: CalendarDays,
  },
  {
    path: "/guides",
    title: "Clean Energy Guide",
    description: "Your complete guide to Austin's clean energy programs, rebates, and resources.",
    icon: BookOpen,
  },
  {
    path: "/decarb-dashboard",
    title: "Austin's Decarb Dashboard",
    description: "Interactive Austin Energy Power Simulator for exploring decarbonization scenarios.",
    icon: Zap,
  },
  {
    path: "/data-sources",
    title: "Data Sources & Methodology",
    description: "Detailed documentation of data sources, calculation methods, and update frequencies used across the site.",
    icon: Database,
  },
];

const Sitemap = () => {
  useSeo({
    title: "Sitemap",
    description: "Complete list of all pages on the Austin Clean Energy dashboard.",
  });
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Sitemap</h1>
        <p className="text-muted-foreground mb-10">
          All public pages on Austin Clean Energy Tracker.
        </p>

        <div className="grid gap-4">
          {publicPages.map((page) => {
            const Icon = page.icon;
            return (
              <Link
                key={page.path}
                to={page.path}
                className="group flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5 p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {page.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {page.description}
                  </p>
                  <span className="text-xs text-muted-foreground/60 mt-1 block">
                    {page.path}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
