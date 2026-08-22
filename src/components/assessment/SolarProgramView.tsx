import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Slider } from "@/components/ui/slider";
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
} from "@/lib/solar-model";
import { buildProgramFinancials, type SolarRecommendation, type PropertyClass } from "@/lib/property-solar";

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtKwh = (n: number) => `${Math.round(n).toLocaleString()} kWh`;

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

interface SolarProgramViewProps {
  rec: SolarRecommendation;
  propertyClass: PropertyClass;
  isSSO: boolean;
  ssoEligible: boolean;
  annualUsageKwh: number;
  productionPerKw: number;
  batteryKwh?: number;
  loanTermYears?: number;
  loanInterestRate?: number;
  monthlyUsageKwh?: number[];
  /** True only for the calculator's "non-profit" property type -- TCAD data (PropertyPage.tsx)
   *  has no such distinction, so this only ever comes from PropertyAssessment.tsx. Non-profits
   *  classify as propertyClass "commercial" (same detailed calc-details view) but get a
   *  different rebate ($1.00/W capped at 200 kW, not the for-profit $0.70/W/100 kW or PBI) and
   *  the flat residential-style install-cost rate, not the Standard Offer pro forma's tiered one. */
  isNonProfit?: boolean;
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
  propertyClass,
  isSSO,
  ssoEligible,
  annualUsageKwh,
  productionPerKw,
  batteryKwh,
  loanTermYears,
  loanInterestRate,
  monthlyUsageKwh,
  isNonProfit = false,
  onCostPerWChange,
  financingSlot,
}: SolarProgramViewProps) {
  const [showCalcDetails, setShowCalcDetails] = useState(false);
  const isResidential = propertyClass === "residential";
  const isMultifamily = propertyClass === "multifamily";
  const isCommercial = propertyClass === "commercial";
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

  return (
    <div className="space-y-8">
      {/* Stat row */}
      <div id="section-savings" className="grid grid-cols-2 sm:grid-cols-4 gap-3 scroll-mt-52">
        <StatCard label="System size" value={`${rec.recommendedKw} kW`} sub={`of ${rec.maxKw} kW max`} />
        <StatCard
          label="Net cost"
          value={fmt$(isSSO ? rec.grossCost : rec.netCost)}
          sub={!isSSO && rec.aeRebate > 0 ? "after AE rebate" : undefined}
        />
        <StatCard
          label={isSSO ? "Annual revenue (est.)" : "Annual production"}
          value={isSSO ? fmt$(annualAmount) : fmtKwh(rec.annualProductionKwh)}
        />
        <StatCard
          label="Est. payback"
          value={`${paybackYear ?? "30+"} yr`}
          sub={isSSO
            ? `${fmt$(annualAmount)}/yr revenue`
            : rec.pbiEligible
            ? `${fmt$(annualAmount)}/yr (yr 1, incl. PBI)`
            : `${fmt$(annualAmount)}/yr savings`}
        />
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
            <dd>{fmt$(isSSO ? rec.grossCost : rec.netCost)}</dd>
          </div>
        </dl>
      </div>

      {financingSlot}

      {/* Charts */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-8">
        {hasRealUsage && (
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

        <div id="section-production" className="space-y-2 scroll-mt-52">
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

      {/* Assumptions — residential/multifamily get a fixed list; commercial gets the richer,
          expandable version below (SSO/VoS/PBI rate details, CBI-threshold explanation). */}
      {!isCommercial && (
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">How we calculated this</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Install cost: $2,950/kW (Berkeley Lab 2024 Austin average — get real quotes to verify)</li>
            <li>Production: Google Solar peak-sun-hours × 0.86 performance ratio (NREL PVWatts standard; accounts for inverter losses, wiring, soiling, and heat derating)</li>
            {isResidential && <li>Savings rate: Austin Energy Value of Solar ($0.126/kWh on all production)</li>}
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
                    <li>Not eligible for Austin Energy's upfront commercial capacity rebate (CBI) — that program is only for systems under 100 kW. Qualifies for the Performance-Based Incentive instead; see below.</li>
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
                    <li>Rate: $0.126/kWh on all production; unused monthly credits carry forward and AE pays out any remaining balance</li>
                    {!ssoEligible && <li>Below the {SSO_MIN_KW} kW Standard Offer program minimum, so billed under Value of Solar instead</li>}
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
