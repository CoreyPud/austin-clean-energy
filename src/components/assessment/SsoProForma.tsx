import { useMemo, useState } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import {
  buildSsoProForma,
  SSO_PROFORMA_TERM_YEARS,
  SSO_OM_PER_KW_YEAR,
  SSO_OM_ESCALATION,
  SSO_DEGRADATION_RATE,
  SSO_ITC_RATE,
  SSO_DEPRECIATION_CREDIT_RATE,
  SSO_INVERTER_REPLACEMENT_YEAR,
  SSO_INCENTIVE_YEAR,
} from "@/lib/sso-proforma";

const fmt$ = (n: number) =>
  n < 0
    ? `-$${Math.abs(Math.round(n)).toLocaleString()}`
    : `$${Math.round(n).toLocaleString()}`;

const fmtK = (n: number) => `${Math.round(n).toLocaleString()}`;

interface Props {
  systemKw: number;
}

const SsoProForma = ({ systemKw }: Props) => {
  const model = useMemo(() => buildSsoProForma(systemKw), [systemKw]);
  const [showTable, setShowTable] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);

  const chartData = model.rows.map(r => ({ year: r.year, "Cumulative cash flow": Math.round(r.cumulative) }));

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <h3 className="text-lg font-semibold">Standard Offer pro forma (third-party owner)</h3>
            <p className="text-sm text-muted-foreground">
              Investor-side economics if a third party owns the system and leases your roof or land.
            </p>
          </div>
        </div>

        <p className="text-xs text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-2.5 py-1.5 mb-4">
          The 30% federal Investment Tax Credit modeled below has a commissioning-deadline eligibility that has changed since this model was built. Confirm current federal rules before relying on the incentive, net cost, or IRR figures.
        </p>

        {/* Headline metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Metric
            label="IRR to owner/investor"
            value={model.irr === null ? "n/a" : `${(model.irr * 100).toFixed(1)}%`}
            sub={`${SSO_PROFORMA_TERM_YEARS}-year term`}
            highlight
            icon={<TrendingUp className="h-3 w-3" />}
          />
          <Metric label="Total system cost" value={fmt$(model.systemCost)} sub={`$${model.scenario.costPerWatt.toFixed(2)}/W · ${fmtK(model.systemKw)} kWdc`} />
          <Metric label="Net cost after incentives" value={fmt$(model.netCostUsd)} sub={`${fmt$(model.itcUsd)} ITC + ${fmt$(model.depreciationCreditUsd)} depreciation`} />
          <Metric label="Year 1 revenue" value={fmt$(model.year1RevenueUsd)} sub={`${fmtK(model.year1ProductionKwh)} kWh @ $${model.scenario.baseRate.toFixed(2)}/kWh`} />
          <Metric label="Lease to property owner" value={`${fmt$(model.annualLeaseUsd)}/yr`} sub={`${fmt$(model.annualLeaseUsd * SSO_PROFORMA_TERM_YEARS)} over the term`} />
          <Metric
            label={`${SSO_PROFORMA_TERM_YEARS}-yr net cash flow`}
            value={fmt$(model.totalNetCashFlow)}
            sub={model.paybackYear ? `break-even year ${model.paybackYear}` : "no break-even in term"}
          />
        </div>

        {/* Cumulative cash flow chart */}
        <div className="h-64 mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={62} tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => fmt$(v)} labelFormatter={(l) => `Year ${l}`} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              {model.paybackYear && (
                <ReferenceLine
                  x={model.paybackYear}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="4 4"
                  label={{ value: "break-even", fontSize: 10, fill: "hsl(var(--primary))", position: "insideTopRight" }}
                />
              )}
              <Line
                type="monotone"
                dataKey="Cumulative cash flow"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cash flow table */}
        <button
          onClick={() => setShowTable(v => !v)}
          className="flex items-center gap-1 text-sm text-primary hover:underline mt-2"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showTable ? "rotate-180" : ""}`} />
          {showTable ? "Hide" : "Show"} year-by-year cash flow
        </button>

        {showTable && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <Th>Year</Th>
                  <Th right>kWh-ac</Th>
                  <Th right>Rate</Th>
                  <Th right>Revenue</Th>
                  <Th right>Lease</Th>
                  <Th right>O&amp;M</Th>
                  <Th right>Expenses</Th>
                  <Th right>Incentives</Th>
                  <Th right>Net cash flow</Th>
                  <Th right>Cumulative</Th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {model.rows.map(r => (
                  <tr key={r.year} className="border-b border-border/50">
                    <Td>{r.year}</Td>
                    <Td right>{fmtK(r.productionKwh)}</Td>
                    <Td right>${r.rate.toFixed(2)}</Td>
                    <Td right>{fmt$(r.revenue)}</Td>
                    <Td right>{fmt$(r.lease)}</Td>
                    <Td right>{fmt$(r.om)}</Td>
                    <Td right>{fmt$(r.expenses)}</Td>
                    <Td right>{r.incentives ? fmt$(r.incentives) : "—"}</Td>
                    <Td right className={r.netCashFlow < 0 ? "text-destructive" : ""}>{fmt$(r.netCashFlow)}</Td>
                    <Td right className={r.cumulative < 0 ? "text-destructive" : "text-primary font-medium"}>{fmt$(r.cumulative)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-muted-foreground mt-2">
              Year 1 net cash flow includes the full {fmt$(model.systemCost)} capital outlay. The {fmt$(model.itcUsd + model.depreciationCreditUsd)} of
              tax benefits are received in year {SSO_INCENTIVE_YEAR}.
            </p>
          </div>
        )}

        {/* Assumptions */}
        <button
          onClick={() => setShowAssumptions(v => !v)}
          className="flex items-center gap-1 text-sm text-primary hover:underline mt-3"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showAssumptions ? "rotate-180" : ""}`} />
          {showAssumptions ? "Hide" : "Show"} assumptions &amp; methodology
        </button>

        {showAssumptions && (
          <div className="mt-3 rounded-lg border bg-muted/30 p-4 text-xs space-y-1.5">
            <p className="font-semibold text-sm mb-2">
              Scenario: {model.scenario.label} ({fmtK(model.systemKw)} kWdc, {model.panels.toLocaleString()} panels @ {model.scenario.wattsPerPanel} W)
            </p>
            <Row k="System cost" v={`$${model.scenario.costPerWatt.toFixed(2)} per Wdc`} />
            <Row k="Production" v={`${model.scenario.yieldKwhPerKw.toLocaleString()} kWh-ac per kWdc-year, ${(SSO_DEGRADATION_RATE * 100).toFixed(1)}% annual degradation`} />
            <Row k="Standard Offer rate" v={`$${model.scenario.baseRate.toFixed(2)}/kWh, stepping up $0.02 in year 6, $0.04 in year 11, $0.06 in year 16`} />
            <Row k="Lease payment" v={`${fmt$(model.annualLeaseUsd)} per year to the property owner — 20% of year-1 solar revenue, held flat for all ${SSO_PROFORMA_TERM_YEARS} years`} />
            <Row k="O&M" v={`$${SSO_OM_PER_KW_YEAR}/kWdc-year for insurance, monitoring and maintenance, escalating ${(SSO_OM_ESCALATION * 100).toFixed(0)}% per year`} />
            <Row k="Inverter replacement" v={`${fmt$(model.inverterReplacementUsd)} in year ${SSO_INVERTER_REPLACEMENT_YEAR} ($8,000 per 125 kW block)`} />
            <Row k="Property taxes" v="Modeled as $0 — treatment for third-party-owned solar is unresolved, so this is a known omission" />
            <Row k="Investment Tax Credit" v={`${(SSO_ITC_RATE * 100).toFixed(0)}% of system cost, only if commissioned before 12/31/2027. This is the commercial/business ITC — it does not apply to homeowners.`} />
            <Row k="Depreciation" v={`Simplified credit of ${(SSO_DEPRECIATION_CREDIT_RATE * 100).toFixed(0)}% of cost net of the ITC, taken in year ${SSO_INCENTIVE_YEAR} — a stand-in for the present value of MACRS depreciation, not a year-by-year schedule`} />
            <Row k="IRR" v={`Computed on the ${SSO_PROFORMA_TERM_YEARS} annual net cash flows, with year 1 treated as time zero (matching Excel's IRR function)`} />
            <p className="pt-2 border-t text-muted-foreground">
              Source: Austin Clean Energy Standard Offer stand-alone financial model (Standard_offer_financial_model_stand_alone.xlsx),
              two-scenario version. O&amp;M escalation is applied at a consistent 2% per year; the source workbook mixes 2% and 4% steps in
              a handful of later rows. These are planning estimates, not tax, legal, or investment advice — confirm all incentive and lease
              terms with Austin Energy and a qualified advisor.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Metric = ({
  label, value, sub, highlight, icon,
}: { label: string; value: string; sub?: string; highlight?: boolean; icon?: React.ReactNode }) => (
  <div className={`px-3 py-2.5 rounded-lg border bg-background/70 ${highlight ? "border-primary/40 ring-1 ring-primary/20" : ""}`}>
    <div className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
      {icon} {label}
    </div>
    <div className={`text-xl font-bold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
  </div>
);

const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th className={`py-1.5 px-2 font-medium whitespace-nowrap ${right ? "text-right" : "text-left"}`}>{children}</th>
);

const Td = ({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) => (
  <td className={`py-1 px-2 whitespace-nowrap ${right ? "text-right" : "text-left"} ${className}`}>{children}</td>
);

const Row = ({ k, v }: { k: string; v: string }) => (
  <p className="text-muted-foreground">
    <span className="font-medium text-foreground">{k}:</span> {v}
  </p>
);

export default SsoProForma;
