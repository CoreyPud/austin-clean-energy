import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Zap, Leaf, DollarSign, Car, TrendingUp, Plane, TreePine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSeo } from "@/hooks/use-seo";
import PageHeader from "@/components/PageHeader";
import EVAdoptionChart from "@/components/ev/EVAdoptionChart";
import { Co2ImpactChart } from "@/components/ev/Co2ImpactChart";
import MapTokenLoader from "@/components/MapTokenLoader";
import { No2StaticMap } from "@/components/No2StaticMap";
import { evAdoptionSeries, TRAVIS_COUNTY_VEHICLES } from "@/data/ev-adoption";

// Fleet-level model constants — all sourced
const ANNUAL_MILES         = 16_500;  // Austin metro avg: ~33,000 mi/household ÷ 2.0 vehicles/household (NHTS 2022 / Brookings; Austin ranks 29th nationally for household VMT)
const AVG_GAS_MPG          = 28;      // EPA avg new gas vehicle
const AVG_EV_MI_PER_KWH    = 3.0;    // conservative fleet avg (mix of sedans + trucks)
const GAS_PRICE            = 3.50;   // Austin avg $/gal (GasBuddy, Jun 2026)
const ELEC_RATE            = 0.09;   // Austin Energy residential avg $/kWh
const AE_CO2_KG_PER_MWH    = 200;   // Austin Energy grid intensity (kg CO2/MWh) — ~55% carbon-free (wind, solar, nuclear); Austin Energy 2024 Resource Guide
const CO2_KG_PER_GAL       = 8.89;  // EPA: kg CO2 per gallon gasoline burned
const CO2_KG_PER_TREE_YR   = 21;    // trees absorb ~21 kg CO2/yr
const CO2_KG_PER_FLIGHT    = 255;   // EPA: domestic round-trip per passenger
const TX_GAS_TAX           = 0.20;  // $/gal → Texas highway fund
const FED_GAS_TAX          = 0.184; // $/gal → federal highway trust fund
const GAS_RETAILER_MARGIN  = 0.10;  // $/gal → local gas station (rough retailer margin)

const EVProgress = () => {
  const navigate = useNavigate();

  useSeo({
    title: "Austin EV Progress — City-Wide Electric Vehicle Impact",
    description:
      "Track Austin's EV growth, CO₂ avoided, and the economic benefit of local EV charging vs. gas spending leaving the city.",
  });

  const s = useMemo(() => {
    const latest = evAdoptionSeries[evAdoptionSeries.length - 1];
    const evCount = latest.austin;
    const fleetPct = (evCount / TRAVIS_COUNTY_VEHICLES) * 100;

    // Per-vehicle fuel math
    const gasGalsPerYr    = ANNUAL_MILES / AVG_GAS_MPG;
    const gasFuelCost     = gasGalsPerYr * GAS_PRICE;
    const gasTxTax        = gasGalsPerYr * TX_GAS_TAX;
    const gasFedTax       = gasGalsPerYr * FED_GAS_TAX;
    const gasRetailer     = gasGalsPerYr * GAS_RETAILER_MARGIN;
    const gasOilCo        = gasFuelCost - gasTxTax - gasFedTax - gasRetailer;
    const evKwhPerYr      = ANNUAL_MILES / AVG_EV_MI_PER_KWH;
    const evFuelCost      = evKwhPerYr * ELEC_RATE;

    // CO2 per vehicle per year
    const gasCo2          = gasGalsPerYr * CO2_KG_PER_GAL;
    const evCo2           = evKwhPerYr * (AE_CO2_KG_PER_MWH / 1000);
    const co2AvoidedPerEv = gasCo2 - evCo2;

    // Fleet-wide
    const fleetCo2Kg      = evCount * co2AvoidedPerEv;
    const fleetCo2Mt      = fleetCo2Kg / 1000;
    const fleetTrees      = Math.round(fleetCo2Kg / CO2_KG_PER_TREE_YR);
    const fleetFlights    = Math.round(fleetCo2Kg / CO2_KG_PER_FLIGHT);
    const fleetAeRevenue  = evCount * evFuelCost;
    const fleetLocalGas   = evCount * gasRetailer;
    const localMultiple   = Math.round(evFuelCost / gasRetailer);

    return {
      evCount, fleetPct,
      gasGalsPerYr, gasFuelCost, gasTxTax, gasFedTax, gasRetailer, gasOilCo,
      evKwhPerYr, evFuelCost,
      gasCo2, evCo2, co2AvoidedPerEv,
      fleetCo2Mt, fleetTrees, fleetFlights,
      fleetAeRevenue, fleetLocalGas, localMultiple,
    };
  }, []);

  const fmt$ = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const fmtM = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Austin EV Progress"
        subtitle={`Austin has ${s.evCount.toLocaleString()} registered electric vehicles in Travis County as of March 2026. This page tracks what those registered EVs mean for CO₂ emissions, electricity spending, and air quality.`}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-10">

          {/* Hero KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              icon={<Car className="h-4 w-4 text-primary" />}
              label="EVs registered"
              value={s.evCount.toLocaleString()}
              sub="Travis County, Mar 2026"
            />
            <KpiCard
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              label="EV share"
              value={`${s.fleetPct.toFixed(1)}%`}
              sub={`of ${(TRAVIS_COUNTY_VEHICLES / 1_000).toFixed(0)}K registered vehicles`}
            />
            <KpiCard
              icon={<Leaf className="h-4 w-4 text-primary" />}
              label="CO₂ avoided/yr"
              value={`${Math.round(s.fleetCo2Mt).toLocaleString()} t`}
              sub="metric tons CO₂ avoided · est. 2026"
            />
            <KpiCard
              icon={<DollarSign className="h-4 w-4 text-primary" />}
              label="Annual AE revenue"
              value={fmtM(s.fleetAeRevenue)}
              sub="from EV charging (stays in Austin)"
            />
          </div>

          {/* Adoption trend */}
          <section>
            <h2 className="text-2xl font-bold mb-1">EV Adoption Trend</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Registered EVs per 1,000 residents — Austin vs. Texas vs. US national rate
            </p>
            <EVAdoptionChart />
          </section>

          {/* Money flow */}
          <section>
            <h2 className="text-2xl font-bold mb-1">Where the Money Goes</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Gas fuel costs are split between oil companies, refiners, distributors, and state/federal highway taxes,
              with a small retailer margin staying local. EV charging costs go to Austin Energy, a city-owned utility
              whose net revenue is partially transferred to the City of Austin's general fund.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Gas card */}
              <Card className="border-amber-200/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                      <Car className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Gas Vehicle</CardTitle>
                      <CardDescription>{fmt$(s.gasFuelCost)}/yr in fuel · {Math.round(s.gasGalsPerYr)} gal</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <MoneyRow
                    label="Oil company / refinery / distribution"
                    amount={s.gasOilCo}
                    pct={s.gasOilCo / s.gasFuelCost}
                    sentiment="bad"
                    note="leaves Austin"
                  />
                  <MoneyRow
                    label="Federal highway tax"
                    amount={s.gasFedTax}
                    pct={s.gasFedTax / s.gasFuelCost}
                    sentiment="neutral"
                    note="federal fund"
                  />
                  <MoneyRow
                    label="Texas highway tax"
                    amount={s.gasTxTax}
                    pct={s.gasTxTax / s.gasFuelCost}
                    sentiment="neutral"
                    note="state fund"
                  />
                  <MoneyRow
                    label="Local gas station margin"
                    amount={s.gasRetailer}
                    pct={s.gasRetailer / s.gasFuelCost}
                    sentiment="good"
                    note="stays in Austin"
                  />
                  <div className="border-t pt-2 mt-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Stays in Austin</span>
                    <span className="font-semibold text-amber-600">
                      {fmt$(s.gasRetailer)}/yr (~{Math.round(s.gasRetailer / s.gasFuelCost * 100)}%)
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* EV card */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Electric Vehicle</CardTitle>
                      <CardDescription>{fmt$(s.evFuelCost)}/yr in electricity · {Math.round(s.evKwhPerYr).toLocaleString()} kWh</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <MoneyRow
                    label="Austin Energy (city-owned utility)"
                    amount={s.evFuelCost}
                    pct={1}
                    sentiment="good"
                    note="stays in Austin"
                  />
                  <div className="rounded-md bg-primary/10 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
                    Austin Energy is owned by the City of Austin. A portion of its annual revenue is transferred
                    directly to the City's general fund, supporting parks, libraries, and city services.
                  </div>
                  <div className="border-t pt-2 mt-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Stays in Austin</span>
                    <span className="font-semibold text-primary">{fmt$(s.evFuelCost)}/yr (~100%)</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AE revenue highlight */}
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Estimated AE Revenue from Austin EVs</p>
                <p className="text-4xl font-bold text-primary tabular-nums">{fmtM(s.fleetAeRevenue)}<span className="text-lg font-medium text-muted-foreground">/yr</span></p>
                <p className="text-sm text-muted-foreground mt-1">
                  {s.evCount.toLocaleString()} EVs × {fmt$(s.evFuelCost)}/yr per vehicle in electricity — all paid to Austin Energy, a city-owned utility.
                </p>
              </div>
              <div className="text-center sm:text-right shrink-0 space-y-1">
                <p className="text-2xl font-bold text-foreground tabular-nums">{s.localMultiple}×</p>
                <p className="text-xs text-muted-foreground">more local than equivalent<br/>gas station purchases</p>
              </div>
            </div>

            {/* Fleet-wide footnote */}
            <p className="text-xs text-muted-foreground leading-relaxed px-1">
              Gas estimate: {Math.round(s.gasGalsPerYr)} gal/yr × $3.50 = {fmt$(s.gasFuelCost)}, of which ~{Math.round(GAS_RETAILER_MARGIN / GAS_PRICE * 100)}% stays local (retailer margin).
              EV estimate: {Math.round(s.evKwhPerYr).toLocaleString()} kWh/yr × $0.09 = {fmt$(s.evFuelCost)}, all to Austin Energy.
              Sources: EIA gas price breakdown, TxDOT, Austin Energy rate schedule.
            </p>
          </section>

          {/* Climate impact */}
          <section>
            <h2 className="text-2xl font-bold mb-1">Climate Impact</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Estimates based on {s.evCount.toLocaleString()} Travis County EVs, each driving {ANNUAL_MILES.toLocaleString()} miles/yr
              (NHTS 2022 Austin average) at {AVG_GAS_MPG} MPG equivalent for gas and {AVG_EV_MI_PER_KWH} mi/kWh for electric.
              Austin Energy's grid intensity is {AE_CO2_KG_PER_MWH} kg CO₂/MWh (~55% carbon-free: wind, solar, nuclear).
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <Card className="border border-border/50 text-center">
                <CardContent className="pt-6 pb-5 space-y-1">
                  <Leaf className="h-7 w-7 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-primary tabular-nums">
                    {Math.round(s.fleetCo2Mt).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">metric tons CO₂ avoided · est. 2026</p>
                </CardContent>
              </Card>
              <Card className="border border-border/50 text-center">
                <CardContent className="pt-6 pb-5 space-y-1">
                  <TreePine className="h-7 w-7 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-primary tabular-nums">
                    {s.fleetTrees.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">equivalent trees' annual absorption · est. 2026</p>
                </CardContent>
              </Card>
              <Card className="border border-border/50 text-center">
                <CardContent className="pt-6 pb-5 space-y-1">
                  <Plane className="h-7 w-7 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-primary tabular-nums">
                    {s.fleetFlights.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">equivalent domestic round trips · est. 2026</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-border/50 mb-4">
              <CardContent className="pt-5 pb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  CO₂ avoided per year · metric tons (annualized by registered EV count)
                </p>
                <Co2ImpactChart />
                <p className="text-[10px] text-muted-foreground text-center pt-2">
                  Each bar uses the Jan 1 registered count for that year · 2026 uses Mar count (lighter bar = estimate)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/40 border-border/40">
              <CardContent className="pt-4 pb-4">
                <div className="grid sm:grid-cols-2 gap-5 text-sm">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Per vehicle, per year</p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gas CO₂</span>
                      <span className="font-medium">{Math.round(s.gasCo2).toLocaleString()} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EV CO₂ (Austin Energy mix)</span>
                      <span className="font-medium">{Math.round(s.evCo2).toLocaleString()} kg</span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5">
                      <span className="text-muted-foreground">CO₂ avoided per EV</span>
                      <span className="font-semibold text-primary">{Math.round(s.co2AvoidedPerEv).toLocaleString()} kg</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Methodology</p>
                    <p>
                      Gas: EPA 8.89 kg CO₂/gal × {Math.round(s.gasGalsPerYr)} gal/yr
                      ({ANNUAL_MILES.toLocaleString()} mi ÷ {AVG_GAS_MPG} MPG avg).
                    </p>
                    <p>
                      EV: Austin Energy {AE_CO2_KG_PER_MWH} kg CO₂/MWh × {Math.round(s.evKwhPerYr).toLocaleString()} kWh/yr
                      ({ANNUAL_MILES.toLocaleString()} mi ÷ {AVG_EV_MI_PER_KWH} mi/kWh avg).
                    </p>
                    <p>
                      Total: {s.evCount.toLocaleString()} EVs registered in Travis County
                      (Atlas EV Hub / TxDMV, Mar 2026).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* NO2 satellite image */}
          <section>
            <h2 className="text-2xl font-bold mb-1">NO₂ Concentrations</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Monthly average tropospheric NO₂ column density over Texas from ESA's Sentinel-5P TROPOMI instrument.
              Elevated concentrations appear along major highway corridors including I-35, Mopac, and SH-183,
              consistent with vehicle traffic as a significant NO₂ source in urban areas.
            </p>
            <Card className="overflow-hidden border border-border/50">
              <MapTokenLoader>
                <No2StaticMap imageSrc="/no2_2026_05.png" height={460} opacity={0.45} />
              </MapTokenLoader>
              <div className="px-4 py-2.5 bg-muted/30 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                  Source: ESA Sentinel-5P TROPOMI · May 2026 monthly average · NO₂ tropospheric column density · Ctrl+scroll to zoom
                </p>
              </div>
            </Card>
          </section>

          {/* CTA */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-7 pb-7 text-center space-y-3">
              <Zap className="h-8 w-8 text-primary mx-auto" />
              <h3 className="text-xl font-bold">Calculate your personal savings</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Compare the real cost of going electric for your specific situation — purchase price,
                fuel costs, maintenance, and break-even timeline using Austin Energy rates.
              </p>
              <Button onClick={() => navigate("/ev-comparison")} size="lg">
                EV vs. Gas Calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

const KpiCard = ({
  icon, label, value, sub,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string;
}) => (
  <Card className="border border-border/50">
    <CardContent className="pt-4 pb-4">
      <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums text-primary leading-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{sub}</div>
    </CardContent>
  </Card>
);

const SENTIMENT_COLORS = {
  good:    "text-primary",
  neutral: "text-muted-foreground",
  bad:     "text-red-500",
};

const MoneyRow = ({
  label, amount, pct, sentiment, note,
}: {
  label: string; amount: number; pct: number; sentiment: "good" | "neutral" | "bad"; note: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between items-baseline text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`font-medium tabular-nums text-xs ${SENTIMENT_COLORS[sentiment]}`}>
        ${Math.round(amount).toLocaleString()} <span className="opacity-60">({Math.round(pct * 100)}%)</span>
      </span>
    </div>
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full ${
          sentiment === "good" ? "bg-primary" : sentiment === "bad" ? "bg-red-400" : "bg-muted-foreground/40"
        }`}
        style={{ width: `${Math.round(pct * 100)}%` }}
      />
    </div>
    <p className="text-[10px] text-muted-foreground">{note}</p>
  </div>
);

export default EVProgress;
