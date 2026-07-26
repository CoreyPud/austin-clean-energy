import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Building2, FileText, ExternalLink, AlertCircle, Gauge, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSeo } from "@/hooks/use-seo";
import PageHeader from "@/components/PageHeader";

const propertyTypeEuiBenchmarks = [
  { type: "Office", medianEui: 52, unit: "kBtu/sq ft/yr" },
  { type: "K-12 School", medianEui: 45, unit: "kBtu/sq ft/yr" },
  { type: "Retail Store", medianEui: 42, unit: "kBtu/sq ft/yr" },
  { type: "Hotel", medianEui: 74, unit: "kBtu/sq ft/yr" },
  { type: "Hospital", medianEui: 196, unit: "kBtu/sq ft/yr" },
  { type: "Multifamily Housing", medianEui: 51, unit: "kBtu/sq ft/yr" },
  { type: "Supermarket / Grocery", medianEui: 195, unit: "kBtu/sq ft/yr" },
  { type: "Warehouse (non-refrigerated)", medianEui: 24, unit: "kBtu/sq ft/yr" },
];

const BuildingEnergyUse = () => {
  useSeo({
    title: "Commercial Building Energy Use in Austin",
    description:
      "How Austin tracks commercial building energy use through the ECAD ordinance — benchmarking, audits, and how commercial buildings compare.",
  });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Commercial Building Energy Use"
        subtitle="Buildings are Austin's largest source of electricity consumption. Here's how the city tracks and discloses commercial energy performance through the ECAD ordinance."
        backTo="/"
        backLabel="Back to Home"
      />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Context */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Why commercial buildings matter</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Commercial and multifamily buildings account for roughly half of Austin's electricity
            use. Because they're long-lived assets with concentrated loads (HVAC, lighting, plug
            loads, and — increasingly — data infrastructure), improving their efficiency is one of
            the highest-leverage moves the city can make toward its clean energy goals.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            To make that performance visible, Austin adopted the{" "}
            <strong className="text-foreground">
              Energy Conservation Audit &amp; Disclosure (ECAD) ordinance
            </strong>{" "}
            in 2008 — one of the earliest such programs in the U.S.
          </p>
        </section>

        {/* ECAD */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">The ECAD ordinance</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Commercial (≥ 10,000 sq ft)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Must benchmark annual energy use in ENERGY STAR Portfolio Manager and report the
                property's ENERGY STAR score and site EUI to Austin Energy each year.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Multifamily</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Properties five units or larger receive an energy audit at least once every ten
                years; results are disclosed to tenants and prospective renters.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Single-family (at sale)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Homes 10+ years old must have an energy audit performed within 10 years prior to
                sale; the report is provided to the buyer.
              </CardContent>
            </Card>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>What's disclosed</AlertTitle>
            <AlertDescription>
              For commercial properties, Austin Energy publishes an annual ECAD report summarizing
              median site EUI, median ENERGY STAR score, and year-over-year change by property
              type. Property-level records exist but are not currently published as an open
              dataset on data.austintexas.gov.
            </AlertDescription>
          </Alert>
        </section>

        {/* EUI benchmarks */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Typical site EUI by property type</h2>
          </div>
          <p className="text-muted-foreground">
            Site EUI (Energy Use Intensity) normalizes a building's total annual energy consumption
            by its floor area. Lower is better. Values below reflect national ENERGY STAR Portfolio
            Manager medians and are useful as a rough yardstick when comparing a specific building.
          </p>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {propertyTypeEuiBenchmarks.map((row) => (
                  <div
                    key={row.type}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="font-medium text-foreground">{row.type}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {row.medianEui} <span className="text-xs">{row.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            Source: EPA ENERGY STAR Portfolio Manager, "U.S. Energy Use Intensity by Property
            Type" technical reference. National medians; Austin-specific medians for a few property
            types are published in Austin Energy's annual ECAD report.
          </p>
        </section>

        {/* Data gap */}
        <section className="space-y-4">
          <Alert variant="default" className="border-amber-500/40 bg-amber-500/5">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Data availability note</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Unlike New York, Chicago, San Francisco, and other benchmarking cities, Austin does
              not currently publish property-level ECAD benchmarking data on its open data portal.
              We link to Austin Energy's published summaries below; if the raw dataset becomes
              available we'll add charts here directly.
            </AlertDescription>
          </Alert>
        </section>

        {/* Resources */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Official resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Austin Energy ECAD program",
                desc: "Program overview, compliance requirements, and reporting portal.",
                url: "https://austinenergy.com/energy-efficiency/ecad-ordinance",
              },
              {
                title: "ECAD annual reports",
                desc: "Aggregate benchmarking results and trends by property type.",
                url: "https://austinenergy.com/energy-efficiency/ecad-ordinance/ecad-reports",
              },
              {
                title: "ENERGY STAR Portfolio Manager",
                desc: "The EPA tool used to benchmark and score commercial buildings.",
                url: "https://www.energystar.gov/buildings/benchmark",
              },
              {
                title: "Austin Energy Green Building",
                desc: "Voluntary ratings program for new commercial and multifamily projects.",
                url: "https://austinenergy.com/energy-efficiency/green-building",
              },
            ].map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:bg-accent/40 transition-colors"
              >
                <ExternalLink className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {r.title}
                  </div>
                  <div className="text-sm text-muted-foreground">{r.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        <div className="pt-4">
          <Button variant="outline" onClick={() => navigate("/data-sources")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            See all data sources
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuildingEnergyUse;
