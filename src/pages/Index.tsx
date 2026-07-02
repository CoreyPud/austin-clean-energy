import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Zap, Car, Wrench, Leaf } from "lucide-react";
import heroImage from "@/assets/hero-austin-solar.jpg";
import { useMemo } from "react";
import CampaignPopup from "@/components/CampaignPopup";
import { useSeo } from "@/hooks/use-seo";
import {
  BarChart, Bar, Cell,
  LineChart, Line,
  XAxis, YAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  buildThirtyYearModel,
  austinEnergyRebate,
  DEFAULT_MONTHLY_USAGE_KWH,
  DEFAULT_PRODUCTION_PER_KW,
  type CalcInputs,
} from "@/lib/solar-model";
import { calcEVResults, DEFAULT_EV_INPUTS } from "@/lib/ev-model";
import { evAdoptionSeries } from "@/data/ev-adoption";
import FeatureCard from "@/components/FeatureCard";

const PRI  = "hsl(var(--primary))";
const BLUE = "#3b82f6";
const ORNG = "#f59e0b";

function austinPopEst(year: number) { return 1_273_000 + (year - 2019) * 21_000; }
function texasPopEst(year: number)  { return 29_000_000 + (year - 2019) * 230_000; }

const Index = () => {
  useSeo({
    title: "Austin Clean Energy Opportunity Dashboard",
    description: "Data-driven insights for solar adoption, energy efficiency, and battery storage in Austin. Empowering residents and policymakers to accelerate clean energy transition.",
  });
  const navigate = useNavigate();

  const solarCumulative = useMemo(() => {
    const SAMPLE_KW = 8;
    const inputs: CalcInputs = {
      annualUsageKwh: DEFAULT_MONTHLY_USAGE_KWH * 12,
      systemKw: SAMPLE_KW,
      batteryKwh: 0,
      loanTermYears: 0,
      loanInterestRate: 0,
      productionPerKw: DEFAULT_PRODUCTION_PER_KW,
    };
    return buildThirtyYearModel(inputs, SAMPLE_KW * 2950 - austinEnergyRebate(SAMPLE_KW, "single_family"))
      .cumulativeByYear.slice(0, 25);
  }, []);

  const evAnnualCostData = useMemo(() => {
    const r = calcEVResults(DEFAULT_EV_INPUTS);
    return [
      { vehicle: "Gas Vehicle",      fuel: Math.round(r.gasAnnualFuel), maintenance: Math.round(r.gasAnnualMaintenance), registration: r.gasRegistrationFee },
      { vehicle: "Electric Vehicle", fuel: Math.round(r.evAnnualFuel),  maintenance: Math.round(r.evAnnualMaintenance),  registration: r.evRegistrationSurcharge },
    ];
  }, []);

  const evAdoptionPreview = useMemo(() =>
    evAdoptionSeries.map(row => {
      const d = new Date(row.date + "T12:00:00Z");
      const yr = d.getUTCFullYear() + d.getUTCMonth() / 12;
      return {
        t: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
        austin: +((row.austin / austinPopEst(yr)) * 1000).toFixed(2),
        texas:  +((row.texas  / texasPopEst(yr))  * 1000).toFixed(2),
      };
    }),
  []);

  return (
    <div className="min-h-screen">
      <CampaignPopup />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-secondary/80" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-14 md:py-20">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Help Build Austin's Clean Energy Future
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-4 leading-relaxed">
              Austin is in the middle of a clean energy shift. We make the underlying data accessible so anyone can follow the city's progress, understand the trends, and figure out what it means for their household and their community.
            </p>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Pick a place to start: track how Austin is doing, or calculate what clean energy would mean for your home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:w-fit">
              <Button
                size="lg"
                onClick={() => document.getElementById("city-trends")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="bg-accent hover:bg-accent/90 text-foreground font-semibold w-full sm:w-48"
              >
                Austin Trends
              </Button>
              <Button
                size="lg"
                onClick={() => document.getElementById("personal-picture")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="bg-accent hover:bg-accent/90 text-foreground font-semibold w-full sm:w-48"
              >
                Run the Numbers
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-20 container mx-auto px-4">
        <div className="space-y-16 max-w-5xl mx-auto">

          {/* ── City-Wide ── */}
          <div id="city-trends" className="scroll-mt-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Austin at a Glance</h2>
              <p className="text-muted-foreground max-w-2xl">How the city's solar buildout and EV adoption have grown over time, broken down by ZIP code and district.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">

              <FeatureCard
                to="/city-overview"
                title="Austin Rooftop Solar"
                description="See how Austin is trending on new solar and battery installs, and which areas are adopting solar the fastest."
                cta="Learn More"
                preview={
                  <div className="relative border-b overflow-hidden bg-muted/20" style={{ height: "232px" }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground select-none">
                      <MapPin className="h-8 w-8 opacity-30" />
                      <span className="text-xs opacity-40">Map preview</span>
                    </div>
                    <img
                      src="/city-map-preview.png"
                      alt="Austin solar installations map"
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                }
              />

              <FeatureCard
                to="/ev-progress"
                title="Austin EV Adoption"
                description="Track Austin's EV growth, CO₂ avoided, and the economic impact of keeping fuel dollars local."
                cta="Learn More"
                preview={
                  <div className="pointer-events-none bg-muted/10 px-3 pt-4 pb-1 border-b">
                    <ResponsiveContainer width="100%" height={210}>
                      <LineChart data={evAdoptionPreview} margin={{ left: 0, right: 4, top: 2, bottom: 0 }}>
                        <XAxis
                          dataKey="t"
                          scale="time"
                          type="number"
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={v => new Date(v).getUTCFullYear().toString()}
                          ticks={[2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => Date.UTC(y, 0, 1))}
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
                        <Line type="monotone" dataKey="austin" stroke={PRI}  strokeWidth={2.5} dot={false} connectNulls />
                        <Line type="monotone" dataKey="texas"  stroke={BLUE} strokeWidth={2}   dot={false} connectNulls strokeDasharray="5 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                }
              />

              <FeatureCard
                to="/decarb-dashboard"
                title="Path to Net Zero by 2035"
                description="Model what it would take for Austin to reach net zero by 2035 — adjust solar buildout, EV adoption, and efficiency targets to see the emissions impact."
                cta="Learn More"
                preview={
                  <div className="relative border-b overflow-hidden bg-muted/20" style={{ height: "232px" }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground select-none">
                      <span className="text-xs opacity-40">Preview</span>
                    </div>
                    <img
                      src="/2035-zero-calc-preview.png"
                      alt="Path to 2035 net zero simulator"
                      className="absolute inset-0 w-full h-full object-cover object-top"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                }
              />

            </div>
          </div>

          {/* ── Personal ── */}
          <div id="personal-picture" className="scroll-mt-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Run the Numbers</h2>
              <p className="text-muted-foreground max-w-2xl">Solar payback periods and EV cost comparisons vary a lot by household. Run the numbers using Austin's real rates and incentives to see what the math looks like for your situation.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">

              <FeatureCard
                to="/property-assessment"
                title="Calculate Solar Savings in Austin"
                description="Enter your address to get neighborhood solar trends, your roof's potential, savings estimates, your council member, and tailored next steps — all in one place."
                cta="Calculate Savings"
                preview={
                  <div className="pointer-events-none bg-muted/10 px-3 pt-4 pb-1 border-b">
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={solarCumulative} margin={{ left: 0, right: 4, top: 2, bottom: 0 }}>
                        <XAxis
                          dataKey="year"
                          tickFormatter={v => v % 5 === 0 ? `Yr ${v}` : ""}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Bar dataKey="cumulative" radius={[2, 2, 0, 0]}>
                          {solarCumulative.map((entry, i) => (
                            <Cell key={i} fill={entry.cumulative >= 0 ? "#047857" : "#b91c1c"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                }
              />

              <FeatureCard
                to="/ev-comparison"
                title="EV vs. Gas Calculator"
                description="Compare the real cost of going electric using Austin Energy rates, local gas prices, and Austin-specific incentives."
                cta="Compare Costs"
                preview={
                  <div className="pointer-events-none bg-muted/10 px-3 pt-4 pb-1 border-b">
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={evAnnualCostData} margin={{ left: 0, right: 4, top: 2, bottom: 0 }} barSize={56}>
                        <XAxis
                          dataKey="vehicle"
                          tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={v => `$${v}`}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Legend
                          iconType="square"
                          iconSize={8}
                          formatter={v => <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>{v}</span>}
                        />
                        <Bar dataKey="fuel"         stackId="c" fill={PRI}  name="Fuel"         radius={[0, 0, 0, 0]} />
                        <Bar dataKey="maintenance"  stackId="c" fill={BLUE} name="Maintenance"  radius={[0, 0, 0, 0]} />
                        <Bar dataKey="registration" stackId="c" fill={ORNG} name="Registration" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                }
              />

              <FeatureCard
                to="/clean-energy-plan"
                title="Your Clean Energy Plan"
                description="Answer a few questions about your home and lifestyle to get personalized recommendations across solar, EVs, efficiency, and more."
                cta="Build My Plan"
                preview={
                  <div className="pointer-events-none bg-muted/10 px-3 pt-4 pb-1 border-b flex items-center justify-center" style={{ height: 226 }}>
                    <div className="grid grid-cols-2 gap-4 w-full px-8">
                      {[
                        { icon: Car,    label: "Transportation", color: "text-primary",      bg: "bg-primary/10" },
                        { icon: Zap,    label: "Electrification", color: "text-blue-500",    bg: "bg-blue-500/10" },
                        { icon: Leaf,   label: "Home Power",      color: "text-emerald-600", bg: "bg-emerald-500/10" },
                        { icon: Wrench, label: "Efficiency",      color: "text-amber-600",   bg: "bg-amber-500/10" },
                      ].map(({ icon: Icon, label, color, bg }) => (
                        <div key={label} className="flex flex-col items-center gap-2">
                          <div className={`h-12 w-12 rounded-full ${bg} flex items-center justify-center`}>
                            <Icon className={`h-5 w-5 ${color}`} />
                          </div>
                          <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              />

            </div>
          </div>

        </div>
      </section>

      {/* CTA */}
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
