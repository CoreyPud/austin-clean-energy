import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BREAKDOWN_YEARS, buildSolarFinancialBreakdown } from "@/lib/solar-financial-breakdown";

const money = (value: number) => value < 0
  ? `−$${Math.round(Math.abs(value)).toLocaleString()}` : `$${Math.round(value).toLocaleString()}`;

export default function SolarFinancialBreakdown({ model }: { model: ReturnType<typeof buildSolarFinancialBreakdown> }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const hasPbi = model.rows.some(row => row.programPayment > 0);
  const hasFederal = model.rows.some(row => row.federalReceipt > 0);
  const totalBenefit = model.rows.reduce((sum, row) => sum + row.benefit, 0);
  const lastRow = model.rows[model.rows.length - 1];
  return (
    <section className="min-w-0 border-t border-border pt-4">
      <Button type="button" variant="ghost" aria-expanded={open} aria-controls={id}
        onClick={() => setOpen(value => !value)} className="h-auto w-full justify-start gap-2 whitespace-normal px-0 text-left hover:bg-transparent">
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        {open ? "Hide" : "Show"} {BREAKDOWN_YEARS}-year financial breakdown
      </Button>
      {open && (
        <div id={id} className="mt-4 min-w-0 space-y-4">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><dt className="text-muted-foreground">Gross installation</dt><dd className="font-semibold tabular-nums">{money(model.grossCost)}</dd></div>
            <div><dt className="text-muted-foreground">Upfront Austin Energy rebate</dt><dd className="font-semibold tabular-nums">{money(model.rebate)}</dd></div>
            <div><dt className="text-muted-foreground">Initial cash paid</dt><dd className="font-semibold tabular-nums">{money(model.initialCash)}</dd></div>
            <div><dt className="text-muted-foreground">Loan principal</dt><dd className="font-semibold tabular-nums">{money(model.loanPrincipal)}</dd></div>
          </dl>
          {model.tenantCredits && <p className="text-xs text-muted-foreground">Tenant bill credits are not owner income. Owner maintenance costs are shown separately; no owner payback is calculated. The multifamily rebate is not modeled because unit count and eligibility need verification.</p>}
          <Table aria-label="25-year solar financial breakdown" className="whitespace-nowrap tabular-nums text-xs">
            <TableHeader><TableRow>
              <TableHead>Year</TableHead><TableHead className="text-right">Production (kWh)</TableHead>
              <TableHead className="text-right">{model.isSSO ? "SSO revenue" : model.tenantCredits ? "Tenant credits" : "Bill savings"}</TableHead>
              {hasPbi && <TableHead className="text-right">PBI credit</TableHead>}
              {hasFederal && <TableHead className="text-right">{model.federalKind}</TableHead>}
              <TableHead className="text-right">O&amp;M</TableHead><TableHead className="text-right">Inverter</TableHead>
              <TableHead className="text-right">Loan payment</TableHead>
              {!model.tenantCredits && <><TableHead className="text-right">Net cash flow</TableHead><TableHead className="text-right">Cumulative net</TableHead></>}
            </TableRow></TableHeader>
            <TableBody>{model.rows.map(row => (
              <TableRow key={row.year}>
                <TableCell className="font-medium">{row.year}</TableCell>
                <TableCell className="text-right">{Math.round(row.production).toLocaleString()}</TableCell>
                <TableCell className="text-right">{money(row.benefit)}</TableCell>
                {hasPbi && <TableCell className="text-right">{money(row.programPayment)}</TableCell>}
                {hasFederal && <TableCell className="text-right">{money(row.federalReceipt)}</TableCell>}
                <TableCell className="text-right">{money(row.maintenance)}</TableCell>
                <TableCell className="text-right">{money(row.inverter)}</TableCell>
                <TableCell className="text-right">{money(row.loanPayment)}</TableCell>
                {!model.tenantCredits && <>
                  <TableCell className="text-right font-medium">{money(row.netCashFlow ?? 0)}</TableCell>
                  <TableCell className="text-right font-medium">{money(row.cumulative ?? 0)}</TableCell>
                </>}
              </TableRow>
            ))}</TableBody>
          </Table>
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3 text-sm">
            <span>{model.tenantCredits ? "25-year tenant credits" : model.isSSO ? "25-year gross revenue" : "25-year bill savings"}: <strong>{money(totalBenefit)}</strong></span>
            {!model.tenantCredits && <span>Net position at year 25: <strong>{money(lastRow?.cumulative ?? 0)}</strong></span>}
          </div>
          <p className="text-xs text-muted-foreground">
            Planning estimates, not guaranteed payments. These are the first 25 years of the same 30-year assessment model used in the chart.
            Upfront rebates reduce installation cost once; conditional federal benefits arrive in year 2 and do not reduce loan principal.
            {hasPbi && " PBI credits stop after year 5."}
            {model.isSSO && " Standard Offer rate escalation is a planning assumption, not an Austin Energy commitment. This is the property-owner scenario, separate from the investor pro forma."}
            {!model.isSSO && " O&M beyond the modeled inverter replacement is not included."}
            {" "}Annual amounts are rounded for display.
          </p>
        </div>
      )}
    </section>
  );
}