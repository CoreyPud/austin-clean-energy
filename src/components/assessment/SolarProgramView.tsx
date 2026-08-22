import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import EnvironmentalImpactCard from "@/components/assessment/EnvironmentalImpactCard";
import SsoProForma from "@/components/assessment/SsoProForma";
import PbiBreakdown from "@/components/assessment/PbiBreakdown";
import {
  SSO_RATE_UNDER_1MW,
  SSO_RATE_OVER_1MW,
  SSO_RATE_STEP,
  SSO_RATE_STEP_YEARS,
  SSO_OM_PER_KW_YEAR,
  SSO_OM_ESCALATION,
  SSO_INVERTER_REPLACEMENT_PER_KW,
  SSO_INVERTER_REPLACEMENT_YEAR,
  SSO_MIN_KW,
  AUSTIN_ENERGY_RATES,
  ssoRate,
} from "@/lib/solar-model";
import { buildProgramFinancials, type SolarRecommendation, type PropertyClass } from "@/lib/property-solar";

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtKwh = (n: number) => `${Math.round(n).toLocaleString()} kWh`;
const VOS_RATE_DISPLAY = `$${AUSTIN_ENERGY_RATES.vosRate.toFixed(3)}/kWh`;

const StickyKpi = ({
  label, value, href, highlight,
}: { label: string; value: string; href?: string; highlight?: boolean }) => {
  const cls = `px-2 py-1 rounded border bg-background/50 ${highlight ? "border-primary/40" : ""} ${href ? "hover:border-primary/50 transition-colors cursor-pointer" : ""}`;
  const inner = (
    <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2 md:gap-0">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide leading-tight">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
  return href ? <a href={href} className={cls}>{inner}</a> : <div className={cls}>{inner}</div>;
};

interface SolarProgramViewProps {
  rec: SolarRecommendation;
  /** The natural default size (no manual override) for the current billing mode --
   *  independent of `rec.recommendedKw`, which already reflects any override. Used only for
   *  the VoS "reset to recommended" comparison link; pass null when not known or not VoS. */
  recommendedKw: number | null;
  propertyClass: PropertyClass;
  isNonProfit?: boolean;
  systemKw: number;
  onSystemKwChange: (v: number) => void;
  billingMode: "vos" | "sso";
  onBillingModeChange: (m: "vos" | "sso") => void;
  annualUsageKwh: number;
  productionPerKw: number;
  loanTermYears?: number;
  loanInterestRate?: number;
  monthlyUsageKwh?: number[];
  carbonOffsetKgPerMwh?: number | null;
  /** Pre-formatted roof-info strings/numbers -- each caller derives these from its own data
   *  shape (TCAD row vs Google Solar response); this view only displays them. */
  sunshineHrsDisplay: string | null;
  roofSqft: number | null;
  panelCount: number | null;
  imageryQuality?: string | null;
  imageryDate?: string | null;
  /** Presence enables an interactive installer-quote slider bound to rec.costPerW; the
   *  caller owns the state and re-derives `rec` with computeRecommendation's
   *  costPerWOverride. Omit for a static, data-derived cost-per-watt display. */
  onCostPerWChange?: (v: number) => void;
  /** Calculator-only financing controls (cash/finance tabs, loan sliders), rendered between
   *  the cost breakdown and the charts -- a page-specific control this view doesn't own. */
  financingSlot?: React.ReactNode;
}

export default function SolarProgramView({
  rec,
  recommendedKw,
  propertyClass,
  isNonProfit = false,
  systemKw,
  onSystemKwChange,
  billingMode,
  onBillingModeChange,
  annualUsageKwh,
  productionPerKw,
  loanTermYears,
  loanInterestRate,
  monthlyUsageKwh,
  carbonOffsetKgPerMwh,
  sunshineHrsDisplay,
  roofSqft,
  panelCount,
  imageryQuality,
  imageryDate,
  onCostPerWChange,
  financingSlot,
}: SolarProgramViewProps) {
  const [showCalcDetails, setShowCalcDetails] = useState(false);
  const [batteryKwh, setBatteryKwh] = useState(0);
  const isResidential = propertyClass === "residential";
  const isMultifamily = propertyClass === "multifamily";
  const isCommercial = propertyClass === "commercial";
  const ssoEligible = isCommercial && !isNonProfit && rec.maxKw >= SSO_MIN_KW;
  const isSSO = ssoEligible && billingMode === "sso";
  // Only residential and commercial-VoS reflect a real bill/usage figure -- multifamily's
  // annualUsageKwh is a production proxy (virtual net metering has no per-unit bill), and SSO
  // revenue doesn't depend on usage at all. Showing a "vs. consumption" chart in either case
  // would compare production against a number that isn't really consumption.
  const hasRealUsage = !isMultifamily && !isSSO;

  const financials = buildProgramFinancials(rec, {
    annualUsageKwh,
    productionPerKw,
    isSSO,
    batteryKwh,
    loanTermYears,
    loanInterestRate,
    monthlyUsageKwh,
  });
  const { yearOne, sso, net25, paybackYear, annualAmount } = financials;

  const installCost = isSSO ? rec.grossCost : rec.netCost;
  const billOffsetPct = yearOne.billWithoutSolar > 0
    ? Math.round((yearOne.savings / yearOne.billWithoutSolar) * 100)
    : 0;
  const co2TonsPerYear = Math.round(
    rec.recommendedKw * productionPerKw * (carbonOffsetKgPerMwh ? carbonOffsetKgPerMwh / 1_000_000 : 0.000400) * 10,
  ) / 10;

  const billData = yearOne.monthlyRows.map(r => ({
    month: r.month,
    "Without solar": Math.round(r.billWithoutSolar),
    "With solar": Math.round(r.billWithSolar),
  }));

  const productionData = isSSO
    ? sso.monthlyRevenue.map(r => ({ month: r.month, "Revenue": r.revenue }))
    : yearOne.monthlyRows.map(r => ({
        month: r.month,
        "Production": Math.round(r.solar),
        "Consumption": Math.round(r.usage),
      }));

  const cumulativeSource = isSSO ? sso.cumulativeByYear : financials.thirtyYear.cumulativeByYear;
  const cumulativeKey = isSSO ? "Net revenue" : "Net savings";
  const cumulativeData = cumulativeSource.map(d => ({
    year: `Yr ${d.year}`,
    [cumulativeKey]: d.cumulative,
  }));

  const ssoRateSteps = [1, ...SSO_RATE_STEP_YEARS].map((year, i) => ({
    year,
    rate: SSO_RATE_UNDER_1MW + i * SSO_RATE_STEP,
  }));

  const hasRoofInfo = sunshineHrsDisplay || roofSqft || panelCount || imageryQuality;

  return (
    <div className="space-y-8">
      {/* Non-sticky comparison blurb -- scrolls away normally, unlike the control card below */}
      {ssoEligible && (
        <p className="text-sm text-muted-foreground">
          This roof qualifies for two different Austin Energy commercial solar programs. Standard Offer pays a locked-in rate for every kilowatt-hour produced, as a standalone revenue stream with your electricity bill unaffected. Value of Solar instead credits production against your own bill, and (for systems 100 kW and up) can also stack a 5-year Performance-Based Incentive on top. Pick one below to see the numbers.
        </p>
      )}

      {/* Sticky control card: toggle, system/battery sliders, KPI strip */}
      <div className="sticky top-0 z-20 -mx-4 px-4">
        <Card className="rounded-t-none rounded-b-xl border-2 border-primary/20 shadow-md bg-background/95 backdrop-blur">
          <CardContent className="p-4">
            {ssoEligible && (
              <div className="mb-3 pb-3 border-b space-y-2">
                <div className="flex rounded-md border overflow-hidden text-xs font-medium w-full">
                  <button
                    onClick={() => onBillingModeChange("sso")}
                    className={`flex-1 py-1.5 transition-colors ${billingMode === "sso" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Standard Offer
                  </button>
                  <button
                    onClick={() => onBillingModeChange("vos")}
                    className={`flex-1 py-1.5 transition-colors ${billingMode === "vos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Value of Solar
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isSSO ? (
                    <>
                      Under Austin Energy's{" "}
                      <a href="https://austinenergy.com/green-power/solar-solutions/solar-standard-offer-program" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Standard Offer program</a>
                      , AE pays a locked-in rate for every kilowatt-hour produced, starting at {(ssoRate(systemKw) * 100).toFixed(2)}¢/kWh. Your electricity bill stays unchanged -- this is a standalone revenue stream on top of it. Minimum system size is {SSO_MIN_KW} kW.
                    </>
                  ) : (
                    <>
                      Austin Energy's{" "}
                      <a href="https://austinenergy.com/green-power/solar-solutions/value-of-solar-rate" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Value of Solar program</a>
                      {" "}credits your production at {VOS_RATE_DISPLAY} against your own bill -- you're only credited up to what you actually use each month; production beyond your usage isn't credited or paid out.{rec.pbiEligible ? " This system size also qualifies for the Performance-Based Incentive, a 5-year credit on top of Value of Solar -- see below." : ""}
                    </>
                  )}
                </p>
              </div>
            )}

            {isResidential && (
              <div className="mb-3 pb-3 border-b">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Austin Energy's{" "}
                  <a href="https://austinenergy.com/green-power/solar-solutions/value-of-solar-rate" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Value of Solar program</a>
                  {" "}credits all your production at {VOS_RATE_DISPLAY} against your bill. Once credits cover your bill, additional production doesn't improve payback -- so we size to match your consumption.
                </p>
              </div>
            )}
            {isMultifamily && (
              <div className="mb-3 pb-3 border-b">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Austin Energy offers solar rebates and incentives for multifamily properties. See{" "}
                  <a href="https://austinenergy.com/green-power/solar-solutions/for-your-multifamily" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">AE's multifamily solar page</a>
                  {" "}for current program options -- availability and eligibility change frequently.
                </p>
              </div>
            )}
            {isCommercial && !ssoEligible && (
              <div className="mb-3 pb-3 border-b">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Austin Energy's{" "}
                  <a href="https://austinenergy.com/green-power/solar-solutions/value-of-solar-rate" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Value of Solar program</a>
                  {" "}credits your production at {VOS_RATE_DISPLAY} against your own bill -- you're only credited up to what you actually use each month; production beyond your usage isn't credited or paid out.{isNonProfit ? "" : ` Your system is under the ${SSO_MIN_KW} kW minimum for the Standard Offer program, but the economics of VoS are still favorable at larger sizes.`}
                </p>
              </div>
            )}

            <div className="flex items-start gap-6">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1">Solar system size</div>
                <div className="text-2xl font-bold tabular-nums mb-3">{systemKw.toFixed(1)} kW</div>
                <Slider
                  min={1}
                  max={Math.max(rec.maxKw, 16)}
                  step={rec.maxKw > 50 ? 1 : 0.5}
                  value={[systemKw]}
                  onValueChange={([v]) => onSystemKwChange(v)}
                />
                {recommendedKw != null && billingMode === "vos" && systemKw !== recommendedKw && (
                  <div className="flex justify-end mt-1.5">
                    <button
                      onClick={() => onSystemKwChange(recommendedKw)}
                      className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums transition-colors hover:text-primary"
                    >
                      <RotateCcw className="h-3 w-3 shrink-0" />
                      {recommendedKw.toFixed(1)} kW recommended
                    </button>
                  </div>
                )}
              </div>

              <div className="h-16 w-px bg-border shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1">Battery system size</div>
                <div className="text-2xl font-bold tabular-nums mb-3">{batteryKwh === 0 ? "None" : `${batteryKwh} kWh`}</div>
                <Slider
                  min={0} max={30} step={1}
                  value={[batteryKwh]}
                  onValueChange={([v]) => setBatteryKwh(v)}
                />
              </div>
            </div>

            <div className={`${ssoEligible ? "mt-2" : "border-t mt-3"} pt-3 grid grid-cols-1 md:grid-cols-5 gap-1.5`}>
              <StickyKpi label="install cost" value={fmt$(installCost)} href="#section-install" />
              <StickyKpi
                label={isSSO ? "monthly revenue" : "monthly savings"}
                value={fmt$(annualAmount / 12)}
                href="#section-savings"
                highlight
              />
              <StickyKpi
                label="payback"
                value={paybackYear ? `${paybackYear} years` : "> 30 years"}
                href="#section-payback"
              />
              {isSSO ? (
                <StickyKpi label="SSO rate" value={`${(ssoRate(systemKw) * 100).toFixed(1)}¢/kWh`} href="#section-savings" />
              ) : (
                <StickyKpi label="bill offset" value={`${billOffsetPct}%`} href="#section-production" />
              )}
              <StickyKpi label="yearly CO₂ offset" value={`${co2TonsPerYear} tons`} href="#section-environmental" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost breakdown */}
      <div id="section-install" className="rounded-lg border border-border bg-card p-4 space-y-3 scroll-mt-52">
        <div className="flex justify-between items-baseline">
          <p className="text-sm font-medium">Cost breakdown</p>
          <span className="text-xs text-muted-foreground tabular-nums">${rec.costPerW.toFixed(2)}/W</span>
        </div>
        {onCostPerWChange && (
          <Slider
            min={1.5} max={5.0} step={0.05}
            value={[rec.costPerW]}
            onValueChange={([v]) => onCostPerWChange(v)}
          />
        )}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Gross install cost</dt>
            <dd>{fmt$(rec.grossCost)}</dd>
          </div>
          {!isSSO && rec.aeRebate > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <dt>Austin Energy rebate</dt>
              <dd>−{fmt$(rec.aeRebate)}</dd>
            </div>
          )}
          {isSSO && (
            <p className="text-xs text-muted-foreground">
              Standard Offer systems don't qualify for Austin Energy's commercial capacity rebate. That rebate is only available to Value of Solar-billed systems.
            </p>
          )}
          <div className="flex justify-between font-medium border-t border-border pt-2">
            <dt>Net cost</dt>
            <dd>{fmt$(installCost)}</dd>
          </div>
        </dl>
      </div>

      {financingSlot}

      {/* Charts */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-8">
        {hasRealUsage && (
          <div id="section-savings" className="space-y-2 scroll-mt-52">
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

        <div id={hasRealUsage ? "section-production" : "section-savings"} className="space-y-2 scroll-mt-52">
          <p className="text-sm font-medium">
            {isSSO
              ? "Estimated monthly revenue"
              : hasRealUsage
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
                    {hasRealUsage && <Bar dataKey="Consumption" fill="hsl(var(--muted-foreground) / 0.4)" radius={[3, 3, 0, 0]} />}
                  </>
              }
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div id="section-payback" className="space-y-2 scroll-mt-52">
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
          {paybackYear && (
            <p className="text-xs text-center text-muted-foreground">
              System pays for itself in year {paybackYear}
            </p>
          )}
        </div>
      </div>

      {/* Performance-Based Incentive -- for-profit commercial >= PBI_MIN_KW on VoS billing.
          Rendered here (not as a page-level sibling) so the sticky control card's scope
          extends through it instead of releasing before it. */}
      {isCommercial && !isSSO && rec.pbiEligible && (
        <PbiBreakdown systemKw={rec.recommendedKw} productionPerKw={productionPerKw} />
      )}

      {/* Third-party-owner pro forma -- same reasoning: kept inside the sticky scope. */}
      {isCommercial && isSSO && (
        <SsoProForma systemKw={rec.recommendedKw} />
      )}

      {/* Solar potential */}
      {hasRoofInfo && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Solar potential</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {sunshineHrsDisplay && (
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-muted-foreground">Sun score</dt>
                <dd className="font-medium">{sunshineHrsDisplay}</dd>
                <dd className="text-xs text-muted-foreground mt-0.5">
                  Peak sun-hours adjusted for this roof's orientation, tilt, shading from trees and nearby structures, and Austin's solar path. Not a generic city-wide average.
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Max system</dt>
              <dd className="font-medium">{rec.maxKw} kW{panelCount ? ` (${panelCount.toLocaleString()} panels)` : ""}</dd>
            </div>
            {roofSqft && (
              <div>
                <dt className="text-muted-foreground">Usable roof area</dt>
                <dd className="font-medium">{roofSqft.toLocaleString()} sqft</dd>
              </div>
            )}
            {imageryDate && (
              <div>
                <dt className="text-muted-foreground">Imagery</dt>
                <dd className="font-medium">{imageryQuality} · {imageryDate}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <EnvironmentalImpactCard annualSolarKwh={yearOne.solarTotal} carbonOffsetKgPerMwh={carbonOffsetKgPerMwh} />

      {/* Assumptions, kept as the very last thing in the component, after everything else
          (residential/multifamily get a fixed list; commercial gets the richer, expandable
          version below with SSO/VoS/PBI rate details and the CBI-threshold explanation). */}
      {!isCommercial && (
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">How we calculated this</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Install cost: $2,950/kW (Berkeley Lab 2024 Austin average, get real quotes to verify)</li>
            <li>Production: Google Solar peak-sun-hours × 0.86 performance ratio (NREL PVWatts standard; accounts for inverter losses, wiring, soiling, and heat derating)</li>
            {isResidential && <li>Savings rate: Austin Energy Value of Solar ({VOS_RATE_DISPLAY} on all production)</li>}
            {isResidential && <li>System sized to offset estimated annual usage; AE residential rebate ($4,000 for systems &gt;3 kW) applied</li>}
            {isMultifamily && <li>System sized to maximum roof capacity; check AE's current multifamily rebate program for incentives</li>}
          </ul>
        </div>
      )}

      {isCommercial && (
        <div className="rounded-lg border border-border bg-card p-4">
          <button
            type="button"
            onClick={() => setShowCalcDetails(v => !v)}
            className="flex items-center gap-1.5 text-sm font-medium w-full text-left"
          >
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${showCalcDetails ? "rotate-180" : ""}`} />
            Commercial calculation details
          </button>
          {showCalcDetails && (
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Cost</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>
                    Install cost: ${(rec.costPerW * 1000).toLocaleString()}/kW (${rec.costPerW.toFixed(2)}/W,{" "}
                    {isNonProfit
                      ? "Berkeley Lab's 2024 Tracking the Sun report for Austin installs"
                      : "from the Standard Offer pro forma's tiered rate; systems 1,300 kW and above use a slightly higher rate"}
                    . Get real quotes to verify.)
                  </li>
                  {isNonProfit ? (
                    <li>Austin Energy non-profit solar rebate: $1.00/W, capped at 200 kW</li>
                  ) : isSSO ? (
                    <li>Standard Offer systems don't qualify for Austin Energy's commercial capacity rebate. That rebate is only available to Value of Solar-billed systems.</li>
                  ) : rec.pbiEligible ? (
                    <li>Not eligible for Austin Energy's upfront commercial capacity rebate (CBI). That program is only for systems under 100 kW. Qualifies for the Performance-Based Incentive instead; see below.</li>
                  ) : (
                    <li>Austin Energy commercial capacity rebate: $0.70/W, capped at 100 kW</li>
                  )}
                </ul>
              </div>
              {isSSO ? (
                <div>
                  <p className="font-medium text-foreground mb-1">Standard Offer revenue</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>
                      Rate: {ssoRateSteps.map(s => `${(s.rate * 100).toFixed(2)}¢/kWh from year ${s.year}`).join(" → ")}, then holds through year 25. Systems 1 MW-AC and above start at {(SSO_RATE_OVER_1MW * 100).toFixed(2)}¢/kWh instead, with the same step schedule. This step-up is our own simplifying assumption, not a rate Austin Energy has committed to. The actual tariff resets the rate every 3 years based on trailing ERCOT market prices, which can rise or fall.
                    </li>
                    <li>Ongoing operations and maintenance: ${SSO_OM_PER_KW_YEAR} per kilowatt per year, increasing {(SSO_OM_ESCALATION * 100).toFixed(0)}% annually (covers insurance, monitoring, and maintenance)</li>
                    <li>Inverter replacement: about ${SSO_INVERTER_REPLACEMENT_PER_KW.toFixed(2)} per kilowatt, a one-time cost in year {SSO_INVERTER_REPLACEMENT_YEAR}</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-foreground mb-1">Value of Solar revenue</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Rate: {VOS_RATE_DISPLAY} on all production, credited against your bill up to what you use each month -- production beyond your usage isn't credited or paid out</li>
                    {!ssoEligible && !isNonProfit && <li>Below the {SSO_MIN_KW} kW Standard Offer program minimum, so billed under Value of Solar instead</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
