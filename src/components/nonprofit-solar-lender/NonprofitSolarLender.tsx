import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateProforma,
  DEFAULT_INPUTS,
  fmtCurr,
  summaryText,
  type LenderInputs,
} from "./nonprofit-solar-lender-model";

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-right text-sm text-foreground"
      />
    </label>
  );
}

function SliderField({
  label,
  display,
  value,
  onChange,
  min,
  max,
  step,
  showNumber = true,
}: {
  label: string;
  display: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  showNumber?: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-primary">{display}</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        {showNumber && (
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24 rounded-md border border-input bg-background px-2 py-1 text-right text-xs text-foreground"
          />
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className="border-t pt-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{note}</div>
    </div>
  );
}

export default function NonprofitSolarLender({ className = "" }: { className?: string }) {
  const [inputs, setInputs] = useState<LenderInputs>(DEFAULT_INPUTS);
  const set = <K extends keyof LenderInputs>(key: K) => (v: number) =>
    setInputs((prev) => ({ ...prev, [key]: v }));

  const result = useMemo(() => calculateProforma(inputs), [inputs]);

  const chartData = result.years.map((y) => ({
    year: `Yr ${y.year}`,
    savings: Math.round(y.cumulativeNetSavings),
    balance: Math.round(y.endBalance),
  }));

  return (
    <div className={`nonprofit-solar-lender ace-research-page ${className}`}>
      <div className="ace-page-shell">
        <section className="ace-section">
          <h2 className="ace-section-heading">Project and system inputs</h2>
          <p className="ace-section-lede">
            Adjust the system, utility baseline, incentives, and loan terms. Every number below
            updates as you change these.
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <SliderField
                label="System size (kW DC)"
                display={`${inputs.systemKw} kW`}
                value={inputs.systemKw}
                onChange={set("systemKw")}
                min={10}
                max={500}
                step={5}
              />
              <SliderField
                label="Turnkey install cost ($/W)"
                display={`$${inputs.costPerWatt.toFixed(2)} / W`}
                value={inputs.costPerWatt}
                onChange={set("costPerWatt")}
                min={1}
                max={4}
                step={0.05}
              />
              <SliderField
                label="Annual electric bill"
                display={fmtCurr(inputs.baselineBill)}
                value={inputs.baselineBill}
                onChange={set("baselineBill")}
                min={5000}
                max={200000}
                step={1000}
              />
              <SliderField
                label="Lender loan interest rate (% APR)"
                display={`${inputs.loanInterestRate.toFixed(2)}%`}
                value={inputs.loanInterestRate}
                onChange={set("loanInterestRate")}
                min={0}
                max={10}
                step={0.25}
                showNumber={false}
              />
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Baseline rate ($/kWh)"
                  value={inputs.utilityRate}
                  onChange={set("utilityRate")}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                />
                <NumberField
                  label="Annual escalator (%)"
                  value={inputs.rateEscalator}
                  onChange={set("rateEscalator")}
                  min={0}
                  max={10}
                  step={0.5}
                />
                <NumberField
                  label="Yield (kWh/kW)"
                  value={inputs.specificYield}
                  onChange={set("specificYield")}
                  min={900}
                  max={1900}
                  step={25}
                />
                <NumberField
                  label="Degradation (%)"
                  value={inputs.degradation}
                  onChange={set("degradation")}
                  min={0}
                  max={3}
                  step={0.1}
                />
                <NumberField
                  label="Operations and maintenance ($/kW/yr)"
                  value={inputs.omCost}
                  onChange={set("omCost")}
                  min={0}
                  max={50}
                  step={1}
                />
                <NumberField
                  label="Austin Energy rebate ($/W-ac)"
                  value={inputs.aeRebateRate}
                  onChange={set("aeRebateRate")}
                  min={0}
                  max={3}
                  step={0.05}
                />
                <NumberField
                  label="IRS Direct Pay (%)"
                  value={inputs.irsCreditRate}
                  onChange={set("irsCreditRate")}
                  min={0}
                  max={70}
                  step={5}
                />
                <NumberField
                  label="Rebate receipt (month)"
                  value={inputs.aeRebateTiming}
                  onChange={set("aeRebateTiming")}
                  min={1}
                  max={12}
                />
                <NumberField
                  label="Direct Pay receipt (month)"
                  value={inputs.irsTiming}
                  onChange={set("irsTiming")}
                  min={6}
                  max={24}
                />
              </div>
              <button
                type="button"
                onClick={() => setInputs(DEFAULT_INPUTS)}
                className="text-xs font-semibold text-primary underline"
              >
                Reset defaults
              </button>
            </div>
          </div>
        </section>

        <section className="ace-section">
          <h2 className="ace-section-heading">What the model shows</h2>
          <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi
              label="Total project cost"
              value={fmtCurr(result.totalProjectCost)}
              note="Covered upfront by the loan"
            />
            <Kpi
              label="Total incentives"
              value={fmtCurr(result.totalIncentives)}
              accent
              note={`${((result.totalIncentives / result.totalProjectCost) * 100).toFixed(0)}% of cost`}
            />
            <Kpi
              label="Net remaining debt"
              value={fmtCurr(result.residualDebtBalance)}
              note="Repaid from bill savings"
            />
            <Kpi
              label="Debt payoff time"
              value={`${(result.payoffMonth / 12).toFixed(1)} years`}
              note={`${result.payoffMonth} months total`}
            />
            <Kpi
              label="25-year net savings"
              value={fmtCurr(result.savings25Yr)}
              accent
              note="Net cash created"
            />
            <Kpi
              label="Lender interest earned"
              value={fmtCurr(result.totalInterestPaid)}
              note="Recycled mission capital"
            />
          </div>

          <p className="ace-section-lede mt-8">{summaryText(result, inputs)}</p>
        </section>

        <section className="ace-section">
          <h2 className="ace-section-heading">Cumulative savings and loan balance</h2>
          <p className="ace-section-lede">
            Cumulative net savings against the remaining loan balance over 25 years.
          </p>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v: number) => fmtCurr(v)}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="savings"
                  name="Cumulative net savings"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.12)"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Remaining loan balance"
                  stroke="hsl(var(--foreground))"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="ace-section">
          <h2 className="ace-section-heading">Bridge loan repayment milestones</h2>
          <p className="ace-section-lede">
            Loan draws, rebate paydowns, and the Direct Pay lump sum.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Timeline event</th>
                  <th className="py-2 px-3 text-right font-semibold">Inflow</th>
                  <th className="py-2 px-3 text-right font-semibold">Principal paid</th>
                  <th className="py-2 px-3 text-right font-semibold">Interest paid</th>
                  <th className="py-2 px-3 text-right font-semibold">Ending balance</th>
                  <th className="py-2 pl-3 font-semibold">Milestone</th>
                </tr>
              </thead>
              <tbody>
                {result.timeline.map((row, idx) => (
                  <tr key={`${row.month}-${idx}`} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium text-foreground">
                      {row.month === 0 ? "Month 0 (close)" : `Month ${row.month}`}
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground">
                      {fmtCurr(row.inflowOutflow)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-primary">
                      {fmtCurr(row.principalPaid)}
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground">
                      {fmtCurr(row.interestPaid)}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-foreground">
                      {fmtCurr(row.endingBalance)}
                    </td>
                    <td className="py-2 pl-3 text-muted-foreground">
                      {row.endingBalance === 0 ? "Paid off" : row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ace-section">
          <h2 className="ace-section-heading">25-year pro forma schedule</h2>
          <p className="ace-section-lede">Annual detail from year 1 through year 25, in dollars.</p>
          <div className="mt-6 max-h-[560px] overflow-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Year</th>
                  <th className="py-2 px-3 text-right font-semibold">Baseline bill</th>
                  <th className="py-2 px-3 text-right font-semibold">Solar gen (kWh)</th>
                  <th className="py-2 px-3 text-right font-semibold">Solar value</th>
                  <th className="py-2 px-3 text-right font-semibold">O and M</th>
                  <th className="py-2 px-3 text-right font-semibold">Incentives</th>
                  <th className="py-2 px-3 text-right font-semibold">Debt service</th>
                  <th className="py-2 px-3 text-right font-semibold">Net cash flow</th>
                  <th className="py-2 pl-3 text-right font-semibold">Cumulative savings</th>
                </tr>
              </thead>
              <tbody>
                {result.years.map((y) => (
                  <tr key={y.year} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-semibold text-foreground">Year {y.year}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">
                      {fmtCurr(y.baselineBill)}
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground">
                      {Math.round(y.solarGenKwh).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-primary">
                      {fmtCurr(y.solarValue)}
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground">
                      {fmtCurr(y.omExpense)}
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground">
                      {y.incentives > 0 ? fmtCurr(y.incentives) : "-"}
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground">
                      {fmtCurr(y.debtService)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-foreground">
                      {fmtCurr(y.netAnnualCashFlow)}
                    </td>
                    <td className="py-2 pl-3 text-right font-semibold text-foreground">
                      {fmtCurr(y.cumulativeNetSavings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="ace-disclosure">
            <summary>Assumptions and caveats</summary>
            <div className="pb-4 text-sm leading-relaxed">
              <p>
                The model assumes the lender funds 100% of construction at close, the Austin Energy
                commercial rebate and IRS Direct Pay under Section 6417 are applied directly to loan
                principal when received, and the remaining balance is repaid from avoided utility
                costs. Operations and maintenance inflates at 2% a year. Actual rebate levels,
                Direct Pay timing, interest, and production vary by project, so treat results as a
                planning estimate rather than a financing commitment.
              </p>
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}
