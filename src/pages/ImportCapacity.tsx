import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Activity, TrendingDown, ExternalLink } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

// Reference thermal ratings for the major 345-kV and 138-kV tie-lines
// entering the LZ_AUSTIN boundary. These are illustrative continuous
// ratings compiled from ERCOT's Network Operations Model / LTSA and
// should be re-scraped from the ERCOT MIS for production use.
const DEFAULT_TIE_LINES = [
  { name: "Sandow – Austin (345 kV)", mva: 1195, pf: 0.95, kind: "345 kV" },
  { name: "Zorn – Austin (345 kV)", mva: 956, pf: 0.95, kind: "345 kV" },
  { name: "Gonzales – Austin (345 kV)", mva: 956, pf: 0.95, kind: "345 kV" },
  { name: "Marion – Austin (345 kV)", mva: 956, pf: 0.95, kind: "345 kV" },
  { name: "Round Mountain – Austin (138 kV)", mva: 239, pf: 0.95, kind: "138 kV" },
  { name: "Lockhart – Austin (138 kV)", mva: 239, pf: 0.95, kind: "138 kV" },
  { name: "Elgin – Austin (138 kV)", mva: 239, pf: 0.95, kind: "138 kV" },
];

const fmtMW = (n: number) => `${Math.round(n).toLocaleString()} MW`;

export default function ImportCapacity() {
  useSeo({
    title: "Austin Energy Import Capacity Calculator",
    description:
      "Model Austin Energy's Total Transfer Capability (TTC) — how much power can be imported into LZ_AUSTIN before ERCOT price separation triggers.",
  });

  const [lines, setLines] = useState(DEFAULT_TIE_LINES);
  const [gtcDerate, setGtcDerate] = useState(30); // % clamp vs thermal
  const [localDemand, setLocalDemand] = useState(2800); // MW real-time load
  const [localGen, setLocalGen] = useState(900); // MW inside-zone generation

  // 1. Thermal boundary = Σ (MVA × PF)
  const thermalBoundary = useMemo(
    () => lines.reduce((s, l) => s + l.mva * l.pf, 0),
    [lines]
  );

  // 2. GTC / stability limit = thermal × (1 − derate)
  const gtcLimit = useMemo(
    () => thermalBoundary * (1 - gtcDerate / 100),
    [thermalBoundary, gtcDerate]
  );

  // Effective import capacity is the binding (smaller) of the two.
  const importCapacity = Math.min(thermalBoundary, gtcLimit);
  const binding =
    gtcLimit < thermalBoundary ? "GTC / Stability" : "Thermal";

  // 3. PSA imbalance = Demand − (Import Capacity + Local Gen)
  const imbalance = localDemand - (importCapacity + localGen);
  const priceSeparation = imbalance > 0;

  const updateLine = (idx: number, patch: Partial<(typeof lines)[number]>) => {
    setLines((cur) => cur.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Austin Energy Import Capacity"
        subtitle="Modeling Total Transfer Capability (TTC) — the threshold before ERCOT price separation"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Intro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Why this matters
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
            <p>
              Austin sits down-funnel from major West Texas wind and solar
              generation. Its ability to import cheap clean power isn't a
              single number stamped on a transformer — it's a dynamic threshold
              set by <strong>Thermal Line Limits</strong> and{" "}
              <strong>Generic Transmission Constraints (GTCs)</strong> managed
              by ERCOT. When flows exceed that threshold, ERCOT's SCED engine
              clamps transfers, LZ_AUSTIN prices separate from the hub, and
              Austin Energy must dispatch expensive local generation.
            </p>
            <p className="font-mono text-xs bg-muted p-3 rounded">
              Max Import Capacity = Σ Limit(Lᵢ) − Local Generation
            </p>
          </CardContent>
        </Card>

        {/* 1. Thermal Boundary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              1. Thermal Import Limit (Asset Boundary)
            </CardTitle>
            <CardDescription>
              Sum of continuous MW ratings on every 345-kV and 138-kV tie-line
              physically entering Austin Energy substations.{" "}
              <span className="font-mono">Thermal = Σ (MVA × Power Factor)</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Tie-line</th>
                    <th className="py-2 pr-4">Voltage</th>
                    <th className="py-2 pr-4">MVA rating</th>
                    <th className="py-2 pr-4">Power factor</th>
                    <th className="py-2">MW contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={l.name} className="border-b last:border-0">
                      <td className="py-2 pr-4">{l.name}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="secondary">{l.kind}</Badge>
                      </td>
                      <td className="py-2 pr-4">
                        <Input
                          type="number"
                          className="w-24 h-8"
                          value={l.mva}
                          onChange={(e) =>
                            updateLine(i, { mva: Number(e.target.value) || 0 })
                          }
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <Input
                          type="number"
                          step="0.01"
                          className="w-20 h-8"
                          value={l.pf}
                          onChange={(e) =>
                            updateLine(i, { pf: Number(e.target.value) || 0 })
                          }
                        />
                      </td>
                      <td className="py-2 font-mono">
                        {fmtMW(l.mva * l.pf)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td colSpan={4} className="py-3 pr-4 text-right">
                      Thermal boundary
                    </td>
                    <td className="py-3 font-mono text-primary">
                      {fmtMW(thermalBoundary)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Default values are illustrative. Replace with the current
              continuous MW ratings from ERCOT's Network Operations Model /
              Long-Term System Assessment (LTSA).
            </p>
          </CardContent>
        </Card>

        {/* 2. GTC */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              2. GTC / Stability Limit (Real-Time Choke)
            </CardTitle>
            <CardDescription>
              Even when wires aren't overheating, ERCOT clamps flows to prevent
              voltage collapse using Generic Transmission Constraints. Shift
              factors on LZ_AUSTIN determine how much a remote generator's
              output loads congested Central Texas corridor lines — when
              shadow prices bind, allowable transfer drops below the thermal
              boundary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">
                GTC derate vs thermal boundary: {gtcDerate}%
              </Label>
              <Slider
                value={[gtcDerate]}
                onValueChange={(v) => setGtcDerate(v[0])}
                min={0}
                max={80}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Set from ERCOT's published shift factors and Hourly Emergency
                Constraint Product. 0% = no stability derate, 80% = severe
                Central Texas corridor congestion.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">
                  Thermal boundary
                </div>
                <div className="text-2xl font-mono">
                  {fmtMW(thermalBoundary)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-xs text-muted-foreground">
                  GTC-clamped limit
                </div>
                <div className="text-2xl font-mono text-primary">
                  {fmtMW(gtcLimit)}
                </div>
              </div>
            </div>
            <Alert>
              <AlertTitle>Binding constraint: {binding}</AlertTitle>
              <AlertDescription>
                Effective import capacity ={" "}
                <span className="font-mono">{fmtMW(importCapacity)}</span> — the
                lower of the thermal and stability limits.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* 3. PSA */}
        <Card>
          <CardHeader>
            <CardTitle>
              3. Power Supply Adjustment (PSA) Imbalance
            </CardTitle>
            <CardDescription>
              <span className="font-mono">
                Imbalance = Local Demand − (Import Capacity + Local Generation)
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Austin local demand (MW)</Label>
                <Input
                  type="number"
                  value={localDemand}
                  onChange={(e) =>
                    setLocalDemand(Number(e.target.value) || 0)
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  From ERCOT Hourly Load Profile for LZ_AUSTIN.
                </p>
              </div>
              <div>
                <Label>Local generation inside zone (MW)</Label>
                <Input
                  type="number"
                  value={localGen}
                  onChange={(e) => setLocalGen(Number(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sand Hill, Decker, Fayette share, distributed solar, etc.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Demand</div>
                <div className="font-mono text-lg">{fmtMW(localDemand)}</div>
              </div>
              <div className="p-3 rounded bg-muted">
                <div className="text-xs text-muted-foreground">
                  Import + Local Gen
                </div>
                <div className="font-mono text-lg">
                  {fmtMW(importCapacity + localGen)}
                </div>
              </div>
              <div
                className={`p-3 rounded border ${
                  priceSeparation
                    ? "bg-destructive/10 border-destructive/40"
                    : "bg-primary/10 border-primary/30"
                }`}
              >
                <div className="text-xs text-muted-foreground">Imbalance</div>
                <div
                  className={`font-mono text-lg ${
                    priceSeparation ? "text-destructive" : "text-primary"
                  }`}
                >
                  {imbalance >= 0 ? "+" : ""}
                  {fmtMW(imbalance)}
                </div>
              </div>
            </div>

            {priceSeparation ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Price separation triggered</AlertTitle>
                <AlertDescription>
                  Import capacity is breached by{" "}
                  <strong>{fmtMW(imbalance)}</strong>. Cheap West Texas power
                  can't reach the load — Austin Energy must dispatch expensive
                  local generation and LZ_AUSTIN LMP separates upward from the
                  ERCOT hub.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTitle>Within import capacity</AlertTitle>
                <AlertDescription>
                  Austin can serve load with{" "}
                  <strong>{fmtMW(Math.abs(imbalance))}</strong> of headroom
                  using imported clean power plus local generation. No forced
                  price separation this hour.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Data blueprint */}
        <Card>
          <CardHeader>
            <CardTitle>Data source blueprint</CardTitle>
            <CardDescription>
              Wire these ERCOT MIS feeds in to move from illustrative to
              live-hour numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <a
              href="https://www.ercot.com/mp/data-products/data-product-details?id=NP6-86-CD"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 hover:text-primary"
            >
              <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Hourly Emergency Constraint Product</strong> — active
                transmission limits, current flow, and contingency limits.
              </span>
            </a>
            <a
              href="https://www.ercot.com/gridinfo/load"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 hover:text-primary"
            >
              <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Hourly Load Profile — LZ_AUSTIN</strong> — real-time
                demand curve for the load zone.
              </span>
            </a>
            <a
              href="https://www.ercot.com/gridinfo/transmission"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 hover:text-primary"
            >
              <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>State Estimator Daily Reports</strong> — historical MW
                flows across utility-zone boundaries.
              </span>
            </a>
            <a
              href="https://www.ercot.com/gridinfo/planning"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 hover:text-primary"
            >
              <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Network Operations Model / LTSA</strong> — physical
                line ratings for the tie-line table above.
              </span>
            </a>
            <a
              href="https://www.ercot.com/mp/data-products/data-product-details?id=NP6-86-CD"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 hover:text-primary"
            >
              <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Shift factors for LZ_AUSTIN</strong> — daily
                sensitivities used to compute the GTC derate slider.
              </span>
            </a>
          </CardContent>
        </Card>

        {/* Formula details */}
        <Card>
          <CardContent className="pt-6">
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-foreground">
                <span>Details — formulas &amp; calculations</span>
                <span className="text-muted-foreground text-sm group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="mt-4 space-y-6 text-sm">
                <section>
                  <h4 className="font-semibold mb-1">1. Thermal Import Limit</h4>
                  <p className="text-muted-foreground mb-2">
                    Sum of the real-power carrying capacity of every tie-line
                    entering LZ_AUSTIN. MVA is apparent power; multiplying by
                    the power factor converts it to real MW.
                  </p>
                  <pre className="font-mono text-xs bg-muted p-3 rounded overflow-x-auto">
{`Thermal_boundary (MW) = Σᵢ ( MVAᵢ × PFᵢ )

Current values:
${lines.map((l) => `  ${l.name}: ${l.mva} MVA × ${l.pf} = ${(l.mva * l.pf).toFixed(0)} MW`).join("\n")}
  ────────────────────────────
  Σ = ${thermalBoundary.toFixed(0)} MW`}
                  </pre>
                </section>

                <section>
                  <h4 className="font-semibold mb-1">2. GTC / Stability Limit</h4>
                  <p className="text-muted-foreground mb-2">
                    ERCOT clamps flows below the thermal boundary when a
                    Generic Transmission Constraint binds. The derate slider
                    represents the effective reduction from all binding
                    shadow-priced constraints on the LZ_AUSTIN corridor.
                  </p>
                  <pre className="font-mono text-xs bg-muted p-3 rounded overflow-x-auto">
{`GTC_limit (MW) = Thermal_boundary × ( 1 − derate% / 100 )

  = ${thermalBoundary.toFixed(0)} × ( 1 − ${gtcDerate} / 100 )
  = ${thermalBoundary.toFixed(0)} × ${(1 - gtcDerate / 100).toFixed(2)}
  = ${gtcLimit.toFixed(0)} MW

Effective_import_capacity = min( Thermal_boundary, GTC_limit )
                          = min( ${thermalBoundary.toFixed(0)}, ${gtcLimit.toFixed(0)} )
                          = ${importCapacity.toFixed(0)} MW   [binding: ${binding}]`}
                  </pre>
                </section>

                <section>
                  <h4 className="font-semibold mb-1">3. PSA Imbalance</h4>
                  <p className="text-muted-foreground mb-2">
                    Whether cheap imported power can serve Austin's load this
                    hour, or whether local generation must be dispatched and
                    LZ_AUSTIN price separates from the ERCOT hub.
                  </p>
                  <pre className="font-mono text-xs bg-muted p-3 rounded overflow-x-auto">
{`Imbalance (MW) = Local_demand − ( Import_capacity + Local_generation )

  = ${localDemand} − ( ${importCapacity.toFixed(0)} + ${localGen} )
  = ${localDemand} − ${(importCapacity + localGen).toFixed(0)}
  = ${imbalance >= 0 ? "+" : ""}${imbalance.toFixed(0)} MW

Price separation triggers when Imbalance > 0.
Current status: ${priceSeparation ? "TRIGGERED" : "within capacity"}.`}
                  </pre>
                </section>

                <section>
                  <h4 className="font-semibold mb-1">Notation</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li><span className="font-mono">MVA</span> — nameplate apparent power rating of a tie-line.</li>
                    <li><span className="font-mono">PF</span> — power factor; ratio of real power (MW) to apparent power (MVA).</li>
                    <li><span className="font-mono">GTC derate</span> — % reduction from thermal capacity imposed by binding stability constraints (from ERCOT shift factors and shadow prices).</li>
                    <li><span className="font-mono">Local generation</span> — MW dispatched from plants inside LZ_AUSTIN (Sand Hill, Decker, Austin's Fayette share, distributed solar, etc.).</li>
                    <li><span className="font-mono">Local demand</span> — real-time MW load in LZ_AUSTIN from ERCOT's Hourly Load Profile.</li>
                  </ul>
                </section>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
