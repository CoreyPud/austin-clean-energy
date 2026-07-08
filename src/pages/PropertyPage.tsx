import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import SatellitePane from "@/components/SatellitePane";
import NeighborhoodSnapshot from "@/components/assessment/NeighborhoodSnapshot";
import ContactCtaCard from "@/components/assessment/ContactCtaCard";
import SectionHeading from "@/components/assessment/SectionHeading";
import {
  slugifyAddress,
  classifyProperty,
  computeRecommendation,
  type SolarRecommendation,
} from "@/lib/property-solar";
import { formatAssessorAddress } from "@/lib/address-utils";
import {
  buildYearModel,
  buildThirtyYearModel,
  buildSsoModel,
  billToMonthlyKwh,
  type CalcInputs,
  DEFAULT_MONTHLY_USAGE_KWH,
  SSO_RATE_UNDER_1MW,
  SSO_MIN_KW,
} from "@/lib/solar-model";
import { Slider } from "@/components/ui/slider";

const TYPE_LABEL: Record<string, string> = {
  single_family: "Single Family",
  multifamily:   "Multifamily",
  condo:         "Condo",
  commercial:    "Commercial",
  other:         "Other",
};

const TYPE_COLOR: Record<string, string> = {
  single_family: "#3b82f6",
  multifamily:   "#8b5cf6",
  condo:         "#ec4899",
  commercial:    "#f97316",
  other:         "#6b7280",
};

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtKwh = (n: number) => `${Math.round(n).toLocaleString()} kWh`;


interface PropertyData {
  pid: string;
  situs_address: string | null;
  situs_zip: string | null;
  property_type: string | null;
  year_built: number | null;
  market_value: number | null;
  estimated_roof_sqft: number | null;
  land_type_desc: string | null;
  centroid_lat: number | null;
  centroid_lon: number | null;
  solar_fetched_at: string | null;
  solar_max_panels: number | null;
  solar_panel_capacity_w: number | null;
  solar_sunshine_hrs: number | null;
  solar_sunshine_median: number | null;
  solar_max_area_m2: number | null;
  solar_imagery_quality: string | null;
  solar_imagery_date: string | null;
}

interface NeighborhoodStats {
  installationsInZip: number;
  pendingPermitsInZip: number;
  averageSystemKw: number | null;
  newest: string | null;
}

function useNeighborhoodStats(zip: string | null): NeighborhoodStats | null {
  const [stats, setStats] = useState<NeighborhoodStats | null>(null);
  useEffect(() => {
    if (!zip) return;
    Promise.all([
      supabase
        .from("solar_installations")
        .select("id", { count: "exact", head: true })
        .eq("original_zip", zip),
      supabase
        .from("solar_installations")
        .select("installed_kw, issued_date, completed_date")
        .eq("original_zip", zip)
        .order("completed_date", { ascending: false, nullsFirst: false })
        .limit(1000),
    ]).then(([countResp, dataResp]) => {
      const total = (countResp as any).count ?? 0;
      const rows = (dataResp.data ?? []) as any[];
      const avgKw =
        rows.length > 0
          ? +(rows.reduce((s, r) => s + (parseFloat(r.installed_kw) || 0), 0) / rows.length).toFixed(2)
          : null;
      const newest =
        rows
          .map((r) => r.issued_date || r.completed_date)
          .filter(Boolean)
          .sort()
          .pop() || null;
      setStats({ installationsInZip: total, pendingPermitsInZip: 0, averageSystemKw: avgKw, newest });
    });
  }, [zip]);
  return stats;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function CostBreakdown({ rec }: { rec: SolarRecommendation }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <p className="text-sm font-medium">Cost breakdown</p>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Gross install cost</dt>
          <dd>{fmt$(rec.grossCost)}</dd>
        </div>
        {rec.aeRebate > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <dt>Austin Energy rebate</dt>
            <dd>−{fmt$(rec.aeRebate)}</dd>
          </div>
        )}
        <div className="flex justify-between font-medium border-t border-border pt-2">
          <dt>Net cost</dt>
          <dd>{fmt$(rec.netCost)}</dd>
        </div>
      </dl>
    </div>
  );
}

function SolarCharts({
  rec,
  property,
  annualUsageKwh,
  isSSO,
}: {
  rec: SolarRecommendation;
  property: PropertyData;
  annualUsageKwh: number;
  isSSO: boolean;
}) {
  const cls = classifyProperty(property.property_type);
  const isResidential = cls === "residential";

  const productionPerKw = property.solar_sunshine_hrs
    ? property.solar_sunshine_hrs * 0.86
    : 1500;

  const inputs: CalcInputs = useMemo(() => ({
    annualUsageKwh,
    systemKw: rec.recommendedKw,
    batteryKwh: 0,
    loanTermYears: 0,
    loanInterestRate: 0,
    productionPerKw,
  }), [annualUsageKwh, rec.recommendedKw, productionPerKw]);

  const yearOne    = useMemo(() => buildYearModel(inputs, 0), [inputs]);
  const thirtyYear = useMemo(() => buildThirtyYearModel(inputs, rec.netCost), [inputs, rec.netCost]);
  const sso        = useMemo(() => buildSsoModel(rec.recommendedKw, productionPerKw, rec.netCost), [rec.recommendedKw, productionPerKw, rec.netCost]);

  const billData = yearOne.monthlyRows.map(r => ({
    month: r.month,
    "Without solar": Math.round(r.billWithoutSolar),
    "With solar":    Math.round(r.billWithSolar),
  }));

  const productionData = isSSO
    ? sso.monthlyRevenue.map(r => ({ month: r.month, "Revenue": r.revenue }))
    : yearOne.monthlyRows.map(r => ({
        month: r.month,
        "Production":  Math.round(r.solar),
        "Consumption": Math.round(r.usage),
      }));

  const cumulativeSource = isSSO ? sso.cumulativeByYear : thirtyYear.cumulativeByYear;
  const cumulativeKey    = isSSO ? "Net revenue" : "Net savings";
  const cumulativeData   = cumulativeSource.map(d => ({
    year: `Yr ${d.year}`,
    [cumulativeKey]: d.cumulative,
  }));

  const net25      = cumulativeSource[24]?.cumulative ?? 0;
  const paybackYr  = isSSO ? sso.paybackYear : thirtyYear.paybackYear;

  return (
    <div className="space-y-8">
      {/* Bill comparison — residential only (irrelevant under SSO) */}
      {isResidential && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Monthly bill: with vs. without solar</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={billData} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} width={44} />
              <Tooltip formatter={(v: number) => `$${v}`} />
              <Legend />
              <Bar dataKey="Without solar" fill="hsl(var(--secondary))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="With solar"    fill="hsl(var(--primary))"   radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly production / revenue */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          {isSSO
            ? "Estimated monthly revenue"
            : isResidential
            ? "Monthly production vs. consumption"
            : "Estimated monthly production"}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={productionData} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={isSSO ? v => `$${v}` : undefined} width={44} />
            <Tooltip formatter={(v: number) => isSSO ? `$${Math.round(v)}` : `${Math.round(v)} kWh`} />
            <Legend />
            {isSSO
              ? <Bar dataKey="Revenue" fill="#047857" radius={[3, 3, 0, 0]} />
              : <>
                  <Bar dataKey="Production"  fill="hsl(var(--primary))"              radius={[3, 3, 0, 0]} />
                  {isResidential && <Bar dataKey="Consumption" fill="hsl(var(--muted-foreground) / 0.4)" radius={[3, 3, 0, 0]} />}
                </>
            }
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 30-year cumulative */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold tabular-nums ${net25 >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {fmt$(net25)}
          </span>
          <span className="text-sm text-muted-foreground">
            {isSSO ? "25-year net revenue" : "25-year net savings"}
          </span>
        </div>
        <p className="text-sm font-medium">
          {isSSO ? "Cumulative net revenue over 30 years" : "Cumulative net savings over 30 years"}
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={48} />
            <Tooltip formatter={(v: number) => fmt$(v)} />
            <Bar dataKey={cumulativeKey} radius={[3, 3, 0, 0]}>
              {cumulativeData.map((entry, i) => (
                <Cell key={i} fill={Number(entry[cumulativeKey]) >= 0 ? "#047857" : "#b91c1c"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {paybackYr && (
          <p className="text-xs text-center text-muted-foreground">
            System pays for itself in year {paybackYr}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PropertyPage() {
  const { pid } = useParams<{ pid: string }>();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [monthlyBill, setMonthlyBill] = useState(150);

  useEffect(() => {
    if (!pid) return;
    setLoading(true);
    supabase
      .from("tcad_properties")
      .select(
        "pid, situs_address, situs_zip, property_type, year_built, market_value, estimated_roof_sqft, land_type_desc, centroid_lat, centroid_lon, solar_fetched_at, solar_max_panels, solar_panel_capacity_w, solar_sunshine_hrs, solar_sunshine_median, solar_max_area_m2, solar_imagery_quality, solar_imagery_date"
      )
      .eq("pid", pid)
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) { setNotFound(true); return; }
        setProperty(data as PropertyData);
      });
  }, [pid]);

  const nbStats = useNeighborhoodStats(property?.situs_zip ?? null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Property not found</p>
        <Link to="/property-viewer" className="text-sm text-primary underline">Browse properties</Link>
      </div>
    );
  }

  const cls      = classifyProperty(property.property_type);
  const rec      = computeRecommendation(property);
  const hasSolar = !!property.solar_fetched_at && property.solar_max_panels != null;
  const address  = formatAssessorAddress(property.situs_address) || `Property ${property.pid}`;
  const typeLabel = TYPE_LABEL[property.property_type ?? ""] ?? "Other";
  const typeColor = TYPE_COLOR[property.property_type ?? ""] ?? "#6b7280";
  const roofSqft  = property.solar_max_area_m2
    ? Math.round(property.solar_max_area_m2 * 10.764).toLocaleString()
    : property.estimated_roof_sqft
    ? Math.round(property.estimated_roof_sqft).toLocaleString()
    : null;

  const isResidential  = cls === "residential";
  const isMultifamily  = cls === "multifamily";
  const isCommercial   = !isResidential && !isMultifamily;
  const ssoEligible    = isCommercial && (rec?.maxKw ?? 0) >= SSO_MIN_KW;

  const annualUsageKwh = isResidential
    ? billToMonthlyKwh(monthlyBill) * 12
    : (rec?.annualProductionKwh ?? DEFAULT_MONTHLY_USAGE_KWH * 12);

  const ctaTitle = isResidential
    ? "Want help navigating your solar options?"
    : isMultifamily
    ? "Questions about multifamily solar in Austin?"
    : ssoEligible
    ? "Want help evaluating the Standard Offer for your property?"
    : "Want help evaluating solar for your commercial property?";

  const ctaDescription = isResidential
    ? "We're an independent resource, not a solar installer. We help Austin homeowners understand rebates, what questions to ask installers, and whether solar actually pencils out for their situation."
    : isMultifamily
    ? "We're not a solar company — we're an independent resource. Austin Energy's multifamily programs change frequently and eligibility can be complicated. We can help you figure out what's currently available and whether it makes sense for your building."
    : ssoEligible
    ? "We're not a solar installer — we're an independent resource. The Standard Offer is compelling for large commercial properties, but navigating AE's interconnection process and finding the right installer takes work. We can help you ask the right questions."
    : "We're not a solar installer — we're an independent resource. We can help you evaluate whether solar makes financial sense for your property and what to ask commercial installers about sizing, rates, and AE's rebate process.";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{address}</h1>
          {property.situs_zip && (
            <p className="text-muted-foreground text-sm">Austin, TX {property.situs_zip}</p>
          )}
        </div>

        {/* Satellite map */}
        {property.centroid_lat != null && property.centroid_lon != null && (
          <SatellitePane
            lat={property.centroid_lat}
            lon={property.centroid_lon}
            className="w-full h-[32rem] rounded-lg overflow-hidden border border-border"
          />
        )}

        {/* No solar data states */}
        {!hasSolar && (
          <div className="rounded-lg border border-border p-6 text-center space-y-2">
            <p className="font-medium">No Google Solar data available for this property</p>
            <p className="text-sm text-muted-foreground">
              Solar potential data hasn't been fetched for this address yet.
            </p>
          </div>
        )}

        {hasSolar && !rec && (
          <div className="rounded-lg border border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Google Solar found this location but couldn't compute panel placement.
            </p>
          </div>
        )}

        {hasSolar && rec && (
          <>
            {/* Bill input for residential */}
            {isResidential && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-medium">Your monthly electricity bill</p>
                  <span className="text-lg font-bold tabular-nums">${monthlyBill}</span>
                </div>
                <Slider
                  min={50} max={500} step={10}
                  value={[monthlyBill]}
                  onValueChange={([v]) => setMonthlyBill(v)}
                />
                <p className="text-xs text-muted-foreground">
                  ≈ {fmtKwh(Math.round(billToMonthlyKwh(monthlyBill)))} / month · {fmtKwh(Math.round(annualUsageKwh))} / year
                </p>
              </div>
            )}

            {/* Recommended system hero */}
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">
                  Recommended system
                  <span className="text-muted-foreground font-normal text-sm ml-2">
                    {isResidential
                      ? "sized to offset your bill"
                      : isMultifamily
                      ? "maximum roof capacity"
                      : ssoEligible
                      ? "maximum roof capacity · Standard Offer"
                      : "maximum roof capacity"}
                  </span>
                </h2>
                {isResidential && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Austin Energy's{" "}
                    <a href="https://austinenergy.com/green-power/solar-solutions/value-of-solar-rate" target="_blank" rel="noopener noreferrer" className="underline">Value of Solar program</a>
                    {" "}credits all your production at $0.126/kWh against your bill. Once credits cover your bill, additional production doesn't improve payback — so we size to match your consumption.
                  </p>
                )}
                {isMultifamily && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Austin Energy offers solar rebates and incentives for multifamily properties. See{" "}
                    <a href="https://austinenergy.com/green-power/solar-solutions/for-your-multifamily" target="_blank" rel="noopener noreferrer" className="underline">AE's multifamily solar page</a>
                    {" "}for current program options — availability and eligibility change frequently.
                  </p>
                )}
                {isCommercial && ssoEligible && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Under Austin Energy's{" "}
                    <a href="https://austinenergy.com/green-power/solar-solutions/solar-standard-offer-program" target="_blank" rel="noopener noreferrer" className="underline">Standard Offer program</a>
                    , AE pays you a fixed rate ({(SSO_RATE_UNDER_1MW * 100).toFixed(2)}¢/kWh) for every kilowatt-hour your system produces — regardless of what you consume. Unlike bill-offset solar, this is a standalone revenue stream: your electricity bill stays the same and you simply earn on top of it. Because revenue scales directly with output, there's no ceiling on useful system size — maximum roof capacity is the right starting point. Minimum system size is {SSO_MIN_KW} kW.
                  </p>
                )}
                {isCommercial && !ssoEligible && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Austin Energy's{" "}
                    <a href="https://austinenergy.com/green-power/solar-solutions/value-of-solar-rate" target="_blank" rel="noopener noreferrer" className="underline">Value of Solar program</a>
                    {" "}credits all your production at $0.126/kWh regardless of how much you consume — unused monthly credits carry forward, and AE pays out any remaining balance. Maximum roof capacity is a reasonable starting point. Your system is under the {SSO_MIN_KW} kW minimum for the Standard Offer program, but the economics of VoS are still favorable at larger sizes.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="System size"
                  value={`${rec.recommendedKw} kW`}
                  sub={`of ${rec.maxKw} kW max`}
                />
                <StatCard
                  label="Net cost"
                  value={fmt$(rec.netCost)}
                  sub={rec.aeRebate > 0 ? "after AE rebate" : undefined}
                />
                <StatCard
                  label={ssoEligible ? "Annual revenue (est.)" : "Annual production"}
                  value={ssoEligible
                    ? fmt$(rec.annualProductionKwh * SSO_RATE_UNDER_1MW)
                    : fmtKwh(rec.annualProductionKwh)}
                />
                <StatCard
                  label="Est. payback"
                  value={`${rec.paybackYears} yr`}
                  sub={ssoEligible
                    ? `${fmt$(rec.annualSavings)}/yr revenue`
                    : `${fmt$(rec.annualSavings)}/yr savings`}
                />
              </div>
            </div>

            <CostBreakdown rec={rec} />

            {/* Charts */}
            <div className="rounded-lg border border-border bg-card p-6">
              <SolarCharts rec={rec} property={property} annualUsageKwh={annualUsageKwh} isSSO={ssoEligible} />
            </div>

            {/* Solar potential */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold">Solar potential</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="col-span-2 sm:col-span-1">
                  <dt className="text-muted-foreground">Sun score</dt>
                  <dd className="font-medium">
                    {property.solar_sunshine_median != null
                      ? `${Math.round(property.solar_sunshine_median).toLocaleString()} hrs/yr`
                      : property.solar_sunshine_hrs != null
                      ? `${Math.round(property.solar_sunshine_hrs).toLocaleString()} hrs/yr`
                      : "—"}
                  </dd>
                  <dd className="text-xs text-muted-foreground mt-0.5">
                    Peak sun-hours adjusted for this roof's orientation, tilt, shading from trees and nearby structures, and Austin's solar path — not a generic city-wide average.
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Max system</dt>
                  <dd className="font-medium">{rec.maxKw} kW ({property.solar_max_panels?.toLocaleString()} panels)</dd>
                </div>
                {roofSqft && (
                  <div>
                    <dt className="text-muted-foreground">Usable roof area</dt>
                    <dd className="font-medium">{roofSqft} sqft</dd>
                  </div>
                )}
                {property.solar_imagery_date && (
                  <div>
                    <dt className="text-muted-foreground">Imagery</dt>
                    <dd className="font-medium">
                      {property.solar_imagery_quality} · {property.solar_imagery_date}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Assumptions */}
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">How we calculated this</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Install cost: $2,950/kW (Berkeley Lab 2024 Austin average — get real quotes to verify)</li>
                <li>Production: Google Solar peak-sun-hours × 0.86 performance ratio (NREL PVWatts standard; accounts for inverter losses, wiring, soiling, and heat derating)</li>
                {isResidential && <li>Savings rate: Austin Energy Value of Solar ($0.126/kWh on all production)</li>}
                {isResidential && <li>System sized to offset estimated annual usage; AE residential rebate ($4,000 for systems &gt;3 kW) applied</li>}
                {isMultifamily && <li>System sized to maximum roof capacity; check AE's current multifamily rebate program for incentives</li>}
                {isCommercial && ssoEligible && <li>Revenue rate: Austin Energy Standard Offer ({(SSO_RATE_UNDER_1MW * 100).toFixed(2)}¢/kWh, systems under 1 MW)</li>}
                {isCommercial && ssoEligible && <li>System sized to maximum roof capacity; AE commercial capacity rebate ($0.70/W, up to 100 kW) applied</li>}
                {isCommercial && !ssoEligible && <li>Rate: Austin Energy Value of Solar ($0.126/kWh on all production, unused credits carry forward); AE commercial capacity rebate ($0.70/W, up to 100 kW) applied</li>}
                {isCommercial && !ssoEligible && <li>System sized to maximum roof capacity</li>}
              </ul>
            </div>
          </>
        )}

        {/* Solar in your neighborhood — residential only */}
        {isResidential && nbStats && property.situs_zip && (
          <>
            <SectionHeading title="Solar in your neighborhood" />
            <NeighborhoodSnapshot
              zipCode={property.situs_zip}
              installationsInZip={nbStats.installationsInZip}
              pendingPermitsInZip={nbStats.pendingPermitsInZip}
              averageSystemKw={nbStats.averageSystemKw}
              newest={nbStats.newest}
            />
          </>
        )}

        {/* CTA */}
        <ContactCtaCard title={ctaTitle} description={ctaDescription} />


      </div>
    </div>
  );
}
