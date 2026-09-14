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
import "./nonprofit-solar-lender.css";

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  inputClassName = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  inputClassName?: string;
}) {
  return (
    <label className="npsl-number-field">
      <span className="block text-[11px] font-medium text-muted-foreground mb-0.5 leading-tight whitespace-nowrap">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`rounded-md border border-input bg-background px-1.5 py-1 text-right text-xs text-foreground ${inputClassName}`}
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
}: {
  label: string;
  display: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="npsl-slider-field">
      <div className="npsl-slider-heading">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-primary whitespace-nowrap">{display}</span>
      </div>
      <div className="npsl-slider-row">
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="accent-primary"
        />
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
    <div className="npsl-kpi">
      <div className="npsl-kpi-label">{label}</div>
      <div className={`npsl-kpi-value ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
      <div className="npsl-kpi-note">{note}</div>
    </div>
  );
}

export default function NonprofitSolarLender({ className = "" }: { className?: string }) {
  const [rawInputs, setInputs] = useState<LenderInputs>(DEFAULT_INPUTS);
  const [offsetPct, setOffsetPct] = useState(100);
  const set = <Key extends keyof LenderInputs>(key: Key) => (v: number) =>
    setInputs((prev) => ({ ...prev, [key]: v }));

  const fullOffsetKw = useMemo(() => {
    const annualKwh = rawInputs.baselineBill / Math.max(rawInputs.utilityRate, 0.01);
    return Math.max(1, Math.round(annualKwh / Math.max(rawInputs.specificYield, 1)));
  }, [rawInputs.baselineBill, rawInputs.utilityRate, rawInputs.specificYield]);

  const systemKw = Math.max(1, Math.round((fullOffsetKw * offsetPct) / 100));
  const inputs = useMemo<LenderInputs>(() => ({ ...rawInputs, systemKw }), [rawInputs, systemKw]);

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
            Start with your annual electric bill. The system size defaults to covering 100% of that
            usage, and you can dial it back if you want a smaller project.
          </p>

          <div className="mt-4 npsl-input-grid">
            <div className="npsl-input-stack">
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
                label="Share of bill covered by solar"
                display={`${offsetPct}% - ${systemKw} kW`}
                value={offsetPct}
                onChange={setOffsetPct}
                min={10}
                max={100}
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
                label="Lender loan interest rate (% APR)"
                display={`${inputs.loanInterestRate.toFixed(2)}%`}
                value={inputs.loanInterestRate}
                onChange={set("loanInterestRate")}
                min={0}
                max={10}
                step={0.25}
              />
            </div>

            <div className="npsl-input-stack">
              <div className="npsl-number-grid">
                <NumberField
                  label="Baseline rate ($/kWh)"
                  value={inputs.utilityRate}
                  onChange={set("utilityRate")}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  inputClassName="w-16"
                />
                <NumberField
                  label="Annual escalator (%)"
                  value={inputs.rateEscalator}
                  onChange={set("rateEscalator")}
                  min={0}
                  max={10}
                  step={0.5}
                  inputClassName="w-14"
                />
                <NumberField
                  label="Yield (kWh/kW)"
                  value={inputs.specificYield}
                  onChange={set("specificYield")}
                  min={900}
                  max={1900}
                  step={25}
                  inputClassName="w-20"
                />
                <NumberField
                  label="Degradation (%)"
                  value={inputs.degradation}
                  onChange={set("degradation")}
                  min={0}
                  max={3}
                  step={0.1}
                  inputClassName="w-16"
                />
                <NumberField
                  label="O and M ($/kW/yr)"
                  value={inputs.omCost}
                  onChange={set("omCost")}
                  min={0}
                  max={50}
                  step={1}
                  inputClassName="w-14"
                />
                <NumberField
                  label="Austin Energy rebate ($/W-ac)"
                  value={inputs.aeRebateRate}
                  onChange={set("aeRebateRate")}
                  min={0}
                  max={3}
                  step={0.05}
                  inputClassName="w-16"
                />
                <NumberField
                  label="IRS Direct Pay (%)"
                  value={inputs.irsCreditRate}
                  onChange={set("irsCreditRate")}
                  min={0}
                  max={70}
                  step={5}
                  inputClassName="w-14"
                />
                <NumberField
                  label="Rebate receipt (month)"
                  value={inputs.aeRebateTiming}
                  onChange={set("aeRebateTiming")}
                  min={1}
                  max={12}
                  inputClassName="w-14"
                />
                <NumberField
                  label="Direct Pay receipt (month)"
                  value={inputs.irsTiming}
                  onChange={set("irsTiming")}
                  min={6}
                  max={24}
                  inputClassName="w-14"
                />
              </div>

              <button
                type="button"
                onClick={() => setInputs(DEFAULT_INPUTS)}
                className="self-start text-xs font-semibold text-primary underline"
              >
                Reset defaults
              </button>
            </div>
          </div>
        </section>

        <section className="ace-section">
          <h2 className="ace-section-heading">What the model shows</h2>
          <div className="mt-3 npsl-kpi-grid">
            <Kpi
              label="25-year net savings"
              value={fmtCurr(result.savings25Yr)}
              accent
              note="Net cash created"
            />
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
              label="Lender interest earned"
              value={fmtCurr(result.totalInterestPaid)}
              note="Recycled mission capital"
            />
          </div>

          <p className="npsl-summary">{summaryText(result, inputs)}</p>
        </section>

        <section className="ace-section">
          <h2 className="ace-section-heading">Cumulative savings and loan balance</h2>
          <p className="ace-section-lede">
            Cumulative net savings against the remaining loan balance over 25 years.
          </p>
          <div className="mt-3 npsl-chart w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
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
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="savings"
                  name="Cumulative net savings"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.12)"
                  strokeWidth={2}
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
          <div className="mt-3 npsl-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timeline event</th>
                  <th className="text-right">Inflow</th>
                  <th className="text-right">Principal paid</th>
                  <th className="text-right">Interest paid</th>
                  <th className="text-right">Ending balance</th>
                  <th>Milestone</th>
                </tr>
              </thead>
              <tbody>
                {result.timeline.map((row, idx) => (
                  <tr key={`${row.month}-${idx}`} className="border-b last:border-0">
                    <td className="font-medium text-foreground">
                      {row.month === 0 ? "Month 0 (close)" : `Month ${row.month}`}
                    </td>
                    <td className="text-right text-muted-foreground">
                      {fmtCurr(row.inflowOutflow)}
                    </td>
                    <td className="text-right font-medium text-primary">
                      {fmtCurr(row.principalPaid)}
                    </td>
                    <td className="text-right text-muted-foreground">
                      {fmtCurr(row.interestPaid)}
                    </td>
                    <td className="text-right font-semibold text-foreground">
                      {fmtCurr(row.endingBalance)}
                    </td>
                    <td className="text-muted-foreground">
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
          <details className="ace-disclosure mt-3">
            <summary>Show 25-year schedule</summary>
            <div className="npsl-table-scroll mt-2">
              <div className="npsl-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th className="text-right">Baseline bill</th>
                      <th className="text-right">Solar gen (kWh)</th>
                      <th className="text-right">Solar value</th>
                      <th className="text-right">O and M</th>
                      <th className="text-right">Incentives</th>
                      <th className="text-right">Debt service</th>
                      <th className="text-right">Net cash flow</th>
                      <th className="text-right">Cumulative savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.years.map((y) => (
                      <tr key={y.year} className="border-b last:border-0">
                        <td className="font-semibold text-foreground">Year {y.year}</td>
                        <td className="text-right text-muted-foreground">
                          {fmtCurr(y.baselineBill)}
                        </td>
                        <td className="text-right text-muted-foreground">
                          {Math.round(y.solarGenKwh).toLocaleString()}
                        </td>
                        <td className="text-right font-medium text-primary">
                          {fmtCurr(y.solarValue)}
                        </td>
                        <td className="text-right text-muted-foreground">
                          {fmtCurr(y.omExpense)}
                        </td>
                        <td className="text-right text-muted-foreground">
                          {y.incentives > 0 ? fmtCurr(y.incentives) : "-"}
                        </td>
                        <td className="text-right text-muted-foreground">
                          {fmtCurr(y.debtService)}
                        </td>
                        <td className="text-right font-medium text-foreground">
                          {fmtCurr(y.netAnnualCashFlow)}
                        </td>
                        <td className="text-right font-semibold text-foreground">
                          {fmtCurr(y.cumulativeNetSavings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>

          <details className="ace-disclosure">
            <summary>Assumptions and caveats</summary>
            <div className="pb-3 text-sm leading-relaxed">
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
