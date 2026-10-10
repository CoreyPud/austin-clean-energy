import {
  MapPin,
  Zap,
  History,
  Landmark,
  TrendingUp,
  Gauge,
  BatteryCharging,
  GraduationCap,
  Network,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { evAdoptionSeries } from "@/data/ev-adoption";
import FeatureCard from "@/components/FeatureCard";
import { PAGES as COUNCIL_PAGES, COUNCIL_PAGE_KEYS, CouncilIconPreview } from "@/components/CouncilPageCards";
import { ImagePreview } from "@/components/FeaturePreviews";
import { loadPowerMoney, FUEL_META, FUEL_ORDER, type FuelKey } from "@/lib/power-money";
import { Input } from "@/components/ui/input";

// Page sections, in order; ids are the jump-link anchors.
const SECTIONS = [
  { id: "solar-ev", title: "Solar & EV Adoption" },
  { id: "austin-energy", title: "Austin Energy & Your Bill" },
  { id: "grid-tools", title: "Grid Planning Tools" },
  { id: "city-council", title: "City Council" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

interface ToolCard {
  key: string;
  to: string;
  title: string;
  description: string;
  cta: string;
  preview: React.ReactNode;
}

const PRI = "hsl(var(--primary))";
const BLUE = "#3b82f6";

const BUILDING_ENERGY_TYPES = [
  "Office",
  "Multifamily",
  "Retail",
  "Warehouse",
  "Hotel",
  "Hospital",
  "School",
  "Grocery",
] as const;
const BUILDING_ENERGY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];
const buildingEnergyPreview = [
  {
    year: 2023,
    Office: 42,
    Multifamily: 58,
    Retail: 18,
    Warehouse: 22,
    Hotel: 24,
    Hospital: 30,
    School: 14,
    Grocery: 20,
  },
  {
    year: 2024,
    Office: 48,
    Multifamily: 72,
    Retail: 22,
    Warehouse: 30,
    Hotel: 28,
    Hospital: 36,
    School: 18,
    Grocery: 24,
  },
  {
    year: 2025,
    Office: 55,
    Multifamily: 84,
    Retail: 26,
    Warehouse: 34,
    Hotel: 32,
    Hospital: 42,
    School: 20,
    Grocery: 28,
  },
];

function austinPopEst(year: number) {
  return 1_273_000 + (year - 2019) * 21_000;
}
function texasPopEst(year: number) {
  return 29_000_000 + (year - 2019) * 230_000;
}

const AustinAtGlance = () => {
  useSeo({
    title: "Austin at a Glance | Austin Clean Energy",
    description:
      "Track Austin’s solar buildout, EV adoption, energy spending, utility decisions, and clean energy progress.",
  });
  // Real fuel-spending snapshot used by the Power Money card preview.
  const [powerMoneyPreview, setPowerMoneyPreview] = useState<Record<string, number>[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    loadPowerMoney()
      .then((d) => {
        const rows = d.years
          .filter((y) => !y.partial)
          .slice(-8)
          .map((y) => {
            const row: Record<string, number> = { year: y.year };
            for (const f of FUEL_ORDER) row[f] = Math.round((y.fuels[f]?.totalUsd ?? 0) / 1_000_000);
            return row;
          });
        setPowerMoneyPreview(rows);
      })
      .catch(() => setPowerMoneyPreview([]));
  }, []);


  const evAdoptionPreview = useMemo(
    () =>
      evAdoptionSeries.map((row) => {
        const d = new Date(row.date + "T12:00:00Z");
        const yr = d.getUTCFullYear() + d.getUTCMonth() / 12;
        return {
          t: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
          austin: +((row.austin / austinPopEst(yr)) * 1000).toFixed(2),
          texas: +((row.texas / texasPopEst(yr)) * 1000).toFixed(2),
        };
      }),
    [],
  );

  // All tools in one place so the search box can filter across every section.
  const cardsBySection = useMemo<Record<SectionId, ToolCard[]>>(() => {
    const councilCards: ToolCard[] = COUNCIL_PAGE_KEYS.map((key) => {
      const p = COUNCIL_PAGES[key];
      return {
        key,
        to: p.to,
        title: p.title,
        description: p.description,
        cta: p.cta,
        preview: <CouncilIconPreview icon={p.icon} className="h-[226px]" />,
      };
    });

    return {
      "solar-ev": [
        {
          key: "city-overview",
          to: "/city-overview",
          title: "Austin Rooftop Solar Trends",
          description:
            "See how Austin is trending on new solar and battery installs, and which areas are adopting solar the fastest.",
          cta: "Learn More",
          preview: (
            <ImagePreview
              src="/city-map-preview.png"
              alt="Austin solar installations map"
              placeholder={<><MapPin className="h-8 w-8 opacity-30" /><span className="text-xs opacity-40">Map preview</span></>}
            />
          ),
        },
        {
          key: "explore",
          to: "/explore",
          title: "Austin Property Explorer",
          description:
            "Zoom into any Austin property to check its solar status and potential, and filter by value, year built, or council district.",
          cta: "Explore the Map",
          preview: (
            <ImagePreview
              src="/explore-preview.png"
              alt="Austin property explorer map"
              placeholder={<><MapPin className="h-8 w-8 opacity-30" /><span className="text-xs opacity-40">Map preview</span></>}
            />
          ),
        },
        {
          key: "ev-progress",
          to: "/ev-progress",
          title: "Austin EV Adoption",
          description:
            "Track Austin's EV growth, CO₂ avoided, and the economic impact of keeping fuel dollars local.",
          cta: "Learn More",
          preview: (
            <div className="pointer-events-none bg-muted/10 px-3 pt-4 pb-1 border-b">
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={evAdoptionPreview} margin={{ left: 0, right: 4, top: 2, bottom: 0 }}>
                  <XAxis
                    dataKey="t"
                    scale="time"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(v) => new Date(v).getUTCFullYear().toString()}
                    ticks={[2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((y) => Date.UTC(y, 0, 1))}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Line
                    type="monotone"
                    dataKey="austin"
                    stroke={PRI}
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="texas"
                    stroke={BLUE}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    strokeDasharray="5 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ),
        },
        {
          key: "building-energy-usage",
          to: "/building-energy-usage",
          title: "Building Demand Growth 2020-2025 based on permits",
          description:
            "Estimated annual electricity load of newly permitted Austin buildings, stacked by property type using ECAD and third-party benchmarks.",
          cta: "Learn More",
          preview: (
            <div className="pointer-events-none bg-muted/10 px-3 pt-4 pb-1 border-b">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={buildingEnergyPreview} margin={{ left: 0, right: 4, top: 2, bottom: 0 }}>
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  {BUILDING_ENERGY_TYPES.map((t, i) => (
                    <Area
                      key={t}
                      type="monotone"
                      dataKey={t}
                      stackId="1"
                      stroke={BUILDING_ENERGY_COLORS[i]}
                      fill={BUILDING_ENERGY_COLORS[i]}
                      fillOpacity={0.55}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ),
        },
      ],
      "austin-energy": [
        {
          key: "power-money",
          to: "/power-money",
          title: "Price of electricity at different stages from different sources",
          description:
            "How many dollars Austin Energy customers spend on coal, gas, nuclear, wind and solar each year, as system totals and per household.",
          cta: "See the Spending",
          preview: (
            <div className="pointer-events-none bg-muted/10 px-3 pt-4 pb-1 border-b">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={powerMoneyPreview} margin={{ left: 0, right: 4, top: 2, bottom: 0 }}>
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                    tickFormatter={(v) => `$${v}M`}
                  />
                  {FUEL_ORDER.map((f) => (
                    <Bar key={f} dataKey={f} stackId="money" fill={FUEL_META[f as FuelKey].color} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ),
        },
        {
          key: "kwh-cost",
          to: "/kwh-cost",
          title: "kWh Cost",
          description:
            "Explore Austin electricity price spreads and the daily arbitrage window batteries use to charge low and discharge high.",
          cta: "Explore the Spread",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground text-center px-6">
                Battery arbitrage spreads for Austin's load zone
              </span>
            </div>
          ),
        },
        {
          key: "pricing-pressure",
          to: "/pricing-pressure",
          title: "Pricing Pressure",
          description:
            "See how Austin Energy's adverse basis costs have changed since 2018 and where current trends could lead next.",
          cta: "Explore the Data",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-accent/15 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-accent-foreground" />
              </div>
              <span className="text-xs text-muted-foreground text-center px-6">
                Austin load-zone costs and forward projection
              </span>
            </div>
          ),
        },
        {
          key: "case-for-austin-energy",
          to: "/case-for-austin-energy",
          title: "The Case for Austin Energy",
          description:
            "Compare Austin's city-owned utility with deregulated Texas markets on prices, reliability, energy mix, and city revenue.",
          cta: "Read the Case",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Landmark className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground text-center px-6">
                Public power compared with Texas retail choice
              </span>
            </div>
          ),
        },
        {
          key: "energy-timeline",
          to: "/energy-timeline",
          title: "Austin Energy Timeline",
          description:
            "Key decisions, contracts, retirements, and clean-energy milestones that shaped Austin Energy's electricity mix.",
          cta: "View Timeline",
          preview: (
            <div
              className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3"
              style={{ height: 226 }}
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <History className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground text-center px-6">
                From first wind contracts to battery tolling agreements
              </span>
            </div>
          ),
        },
      ],
      "grid-tools": [
        {
          key: "load-estimator",
          to: "/load-estimator",
          title: "Austin Load Growth Estimator",
          description:
            "Build a scenario for how housing, data centers, industry, EV fleets, and planned development affect peak demand.",
          cta: "Build a Scenario",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-secondary/15 flex items-center justify-center">
                <Gauge className="h-7 w-7 text-secondary" />
              </div>
              <span className="text-xs text-muted-foreground text-center px-6">
                Test the forces changing Austin's peak demand
              </span>
            </div>
          ),
        },
        {
          key: "peaker-vs-battery",
          to: "/peaker-vs-battery",
          title: "Peaker vs. Battery",
          description:
            "Compare the estimated capacity cost of customer batteries with a gas peaker, using Austin program and permit data.",
          cta: "Compare Costs",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <BatteryCharging className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground text-center px-6">
                Distributed storage compared with gas capacity
              </span>
            </div>
          ),
        },
        {
          key: "nonprofit-solar-lender",
          to: "/nonprofit-solar-lender",
          title: "Non-Profit Solar Bridge Loan Calculator",
          description:
            "Model a 25-year solar pro forma for a non-profit using the Austin Energy rebate, IRS Direct Pay, and a bridge loan repaid from bill savings.",
          cta: "Run the Numbers",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Landmark className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground text-center px-6">
                Bridge financing for non-profit solar projects
              </span>
            </div>
          ),
        },
        {
          key: "course",
          to: "/course",
          title: "The Grid Primer Course",
          description:
            "A short, interactive course on how the Texas grid, electricity prices, and Austin's energy decisions actually work.",
          cta: "Start the Course",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-accent/15 flex items-center justify-center">
                <GraduationCap className="h-7 w-7 text-accent-foreground" />
              </div>
              <span className="text-xs text-muted-foreground text-center px-6">
                Learn the grid, prices, and Austin's choices
              </span>
            </div>
          ),
        },
        {
          key: "atb-options",
          to: "/atb-options",
          title: "NREL Technology Database (ATB)",
          description:
            "Browse NREL's projected costs for new solar, wind, storage, gas, nuclear and more through 2050, and filter by technology.",
          cta: "Compare Technologies",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground text-center px-6">
                NREL Annual Technology Baseline, 2022–2050
              </span>
            </div>
          ),
        },
        {
          key: "demand-distribution",
          to: "/demand-distribution",
          title: "Demand Distribution",
          description: "Map of where Austin's electricity demand sits, by building type and size.",
          cta: "Explore map",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-7 w-7 text-primary" />
              </div>
            </div>
          ),
        },
        {
          key: "peak-shave",
          to: "/peak-shave",
          title: "Peak Shave Calculator",
          description: "Estimate how a battery can shave building peak demand and cut demand charges.",
          cta: "Calculate",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-secondary/15 flex items-center justify-center">
                <Network className="h-7 w-7 text-secondary" />
              </div>
            </div>
          ),
        },
        {
          key: "gets",
          to: "/gets",
          title: "GETs vs. Peaker",
          description:
            "Can grid-enhancing technologies do the job of a new gas peaker? Compare advanced inverters, dynamic line ratings, and storage against new gas capacity.",
          cta: "Compare",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-secondary/15 flex items-center justify-center">
                <Network className="h-7 w-7 text-secondary" />
              </div>
              <span className="text-xs text-muted-foreground text-center px-6">
                Grid software and hardware vs. new gas capacity
              </span>
            </div>
          ),
        },
        {
          key: "peaker-proforma",
          to: "/peaker-proforma",
          title: "Gas Peaker Proforma",
          description:
            "Interactive 20-year financial model for a new natural gas peaker in ERCOT South: IRR, NPV, equity returns, and payback from adjustable assumptions.",
          cta: "Model it",
          preview: (
            <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[226px]">
              <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground text-center px-6">
                Peaker plant IRR, NPV and cash flow
              </span>
            </div>
          ),
        },
        {
          key: "decarb-dashboard",
          to: "/decarb-dashboard",
          title: "Path to Zero Emissions by 2035",
          description:
            "Model what it would take for Austin to reach zero emissions by 2035. Adjust solar buildout, EV adoption, and efficiency targets to see the emissions impact.",
          cta: "Learn More",
          preview: (
            <ImagePreview
              src="/2035-zero-calc-preview.png"
              alt="Path to 2035 net zero simulator"
              position="top"
              placeholder={<span className="text-xs opacity-40">Preview</span>}
            />
          ),
        },
      ],
      "city-council": councilCards,
    };
  }, [evAdoptionPreview, powerMoneyPreview]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleSections = useMemo(() => {
    const all = SECTIONS.map((s) => ({ ...s, cards: cardsBySection[s.id] ?? [] }));
    if (!normalizedQuery) return all;
    return all
      .map((s) => ({
        ...s,
        cards: s.cards.filter(
          (c) =>
            c.title.toLowerCase().includes(normalizedQuery) ||
            c.description.toLowerCase().includes(normalizedQuery),
        ),
      }))
      .filter((s) => s.cards.length > 0);
  }, [cardsBySection, normalizedQuery]);

  const matchCount =
    normalizedQuery ? visibleSections.reduce((n, s) => n + s.cards.length, 0) : 0;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Austin at a Glance"
        subtitle="How Austin’s solar buildout, EV adoption, spending, and energy decisions are trending."
      />


      {/* Feature cards */}
      <section className="py-20 container mx-auto px-4">
        <div className="space-y-16 max-w-5xl mx-auto">
          {/* Search across all tools, with jump links attached right below */}
          <div>
            <div className="max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools — try solar, EV, or bills"
              aria-label="Search tools"
              className="pl-9 pr-9"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {normalizedQuery && (
              <p className="mt-2 text-sm text-muted-foreground" role="status">
                {matchCount} {matchCount === 1 ? "tool matches" : "tools match"} “{query.trim()}”
              </p>
            )}
            </div>

            {/* Jump links to each visible section */}
            {visibleSections.length > 0 && (
              <nav aria-label="Sections" className="mt-6 flex flex-wrap gap-2">
                {visibleSections.map(({ id, title }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {title}
                  </a>
                ))}
              </nav>
            )}
          </div>

          {visibleSections.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <p className="text-lg font-medium">No tools match “{query.trim()}”</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different word — for example “solar”, “EV”, or “council”.
              </p>
            </div>
          ) : (
            <>
              {visibleSections.map(({ id, title, cards }) => (
                <div key={id} id={id} className="scroll-mt-8">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">{title}</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {cards.map((card) => (
                      <FeatureCard
                        key={card.key}
                        to={card.to}
                        title={card.title}
                        description={card.description}
                        cta={card.cta}
                        preview={card.preview}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </section>
    </div>
  );
};

export default AustinAtGlance;
