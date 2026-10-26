import { useMemo, useState } from "react";
import { RotateCcw, ArrowLeft, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useSeo } from "@/hooks/use-seo";
import RecommendationCards from "@/components/assessment/RecommendationCards";
import BillUpload from "@/components/assessment/BillUpload";
import { buildCommercialCards, type CommercialPlanData } from "@/lib/commercial-energy-plan";
import {
  buildSavingsModel,
  estimatePeakKw,
  OPERATING_PROFILES,
  DEFAULT_DR_RATE_PER_KW_YEAR,
  DEFAULT_DR_CURTAIL_FRACTION,
  type InitiativeResult,
} from "@/lib/commercial-savings-model";
import PageHeader from "@/components/PageHeader";

type Q = { key: keyof CommercialPlanData; label: string; options: [string, string][] };
const QUESTIONS: Q[] = [
  { key: "role", label: "What's your relationship to the building?", options: [["owner", "Owner"], ["manager", "Property manager"], ["tenant", "Tenant"]] },
  { key: "roofType", label: "What kind of roof does it have?", options: [["flat", "Flat or low-slope"], ["pitched", "Pitched / sloped"], ["unsure", "Not sure"]] },
  { key: "roofSurface", label: "What does the roof surface look like?", options: [["dark", "Dark (tar, gravel, dark membrane)"], ["reflective", "Already white or reflective"], ["unsure", "Not sure"]] },
  { key: "insulation", label: "How is the ceiling or roof insulation?", options: [["poor", "Thin, old, or missing"], ["ok", "Recently upgraded"], ["unsure", "Not sure"]] },
  { key: "windows", label: "What are the windows like?", options: [["single", "Single-pane"], ["unshaded", "Double-pane but sun-exposed, no film"], ["efficient", "Efficient, already filmed or shaded"], ["unsure", "Not sure"]] },
];

const $ = (n: number) => `$${Math.round(n).toLocaleString()}`;
const num = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const CommercialEnergyPlan = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<CommercialPlanData>>({});
  const [roof, setRoof] = useState("");
  const [win, setWin] = useState("");

  // Step 2: energy usage
  const [monthlyKwh, setMonthlyKwh] = useState<number[] | null>(null);
  const [manualAnnualKwh, setManualAnnualKwh] = useState("");
  const [annualCost, setAnnualCost] = useState("");
  const [ratePerKwh, setRatePerKwh] = useState("");
  const [demandCharge, setDemandCharge] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("70");

  // Step 3: costs + DR
  const [costInsulation, setCostInsulation] = useState("");
  const [costRoof, setCostRoof] = useState("");
  const [costWindows, setCostWindows] = useState("");
  const [drKw, setDrKw] = useState("");
  const [drRate, setDrRate] = useState(String(DEFAULT_DR_RATE_PER_KW_YEAR));

  const [results, setResults] = useState<InitiativeResult[] | null>(null);
  const [cards, setCards] = useState<ReturnType<typeof buildCommercialCards> | null>(null);

  useSeo({
    title: "Commercial Clean Energy Plan | Austin",
    description: "Upload your Austin Energy bill, answer a few questions about your commercial building, and see estimated savings, rebates, and payback for demand response, insulation, reflective roofs, and windows.",
  });

  const annualKwh = useMemo(() => {
    if (monthlyKwh && monthlyKwh.length > 0) {
      const sum = monthlyKwh.reduce((s, v) => s + v, 0);
      return Math.round((sum / monthlyKwh.length) * 12);
    }
    return num(manualAnnualKwh);
  }, [monthlyKwh, manualAnnualKwh]);

  const blendedRate = useMemo(() => {
    if (num(ratePerKwh) > 0) return num(ratePerKwh);
    if (annualKwh > 0 && num(annualCost) > 0) return num(annualCost) / annualKwh;
    return 0;
  }, [ratePerKwh, annualCost, annualKwh]);

  const estPeakKw = useMemo(
    () => (annualKwh > 0 ? estimatePeakKw(annualKwh, num(hoursPerWeek) || 70) : 0),
    [annualKwh, hoursPerWeek],
  );

  const effectiveDrKw = num(drKw) > 0 ? num(drKw) : Math.round(estPeakKw * DEFAULT_DR_CURTAIL_FRACTION);

  const step1Complete = QUESTIONS.every((q) => data[q.key]);
  const step2Complete = annualKwh > 0 && num(hoursPerWeek) > 0 && blendedRate > 0;

  const submit = () => {
    const planData: CommercialPlanData = {
      ...(data as CommercialPlanData),
      roofSqFt: num(roof) || undefined,
      windowSqFt: num(win) || undefined,
    };
    setCards(buildCommercialCards(planData));
    setResults(
      buildSavingsModel({
        annualKwh,
        ratePerKwh: blendedRate,
        demandChargePerKwMonth: num(demandCharge),
        hoursPerWeek: num(hoursPerWeek) || 70,
        drCurtailKw: effectiveDrKw,
        drRatePerKwYear: num(drRate) || DEFAULT_DR_RATE_PER_KW_YEAR,
        costs: {
          insulation: num(costInsulation),
          reflectiveRoof: num(costRoof),
          windows: num(costWindows),
        },
        roofSqFt: num(roof),
        windowSqFt: num(win),
        applicable: {
          insulation: data.insulation !== "ok",
          reflectiveRoof: data.roofSurface !== "reflective" && data.roofType !== "pitched",
          windows:
            data.windows === "single" ? "single" : data.windows === "unshaded" ? "unshaded" : null,
        },
      }),
    );
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const reset = () => {
    setResults(null);
    setCards(null);
    setStep(0);
  };

  const totalAnnual = results?.reduce((s, r) => s + r.annualSavingsUsd, 0) ?? 0;
  const totalNetCost = results?.reduce((s, r) => s + r.netCostUsd, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={results ? "Your Building's Returns" : "Commercial Clean Energy Plan"}
        subtitle={results
          ? "Estimated savings, rebates, and payback for each initiative, based on your bill and building."
          : "Upload your bill, answer a few questions, and see what each improvement returns."}
      />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {results && cards ? (
          <>
            {/* Per-line-item returns table */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-1">Returns by initiative</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Before improvements: {annualKwh.toLocaleString()} kWh/yr at ${(blendedRate).toFixed(3)}/kWh
                  {num(demandCharge) > 0 ? ` and $${num(demandCharge)}/kW-mo demand charges` : ""}.
                  {" "}Annual energy charges: {$(annualKwh * blendedRate)} (excluding demand and fixed charges).
                  Estimated peak demand: {Math.round(estPeakKw)} kW.
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Initiative</TableHead>
                        <TableHead className="text-right">kWh saved / yr</TableHead>
                        <TableHead className="text-right">kW reduced</TableHead>
                        <TableHead className="text-right">Lower bill / yr</TableHead>
                        <TableHead className="text-right">Program payment / yr</TableHead>
                        <TableHead className="text-right">Total return / yr</TableHead>
                        <TableHead className="text-right">Rebate</TableHead>
                        <TableHead className="text-right">Your cost</TableHead>
                        <TableHead className="text-right">Net cost</TableHead>
                        <TableHead className="text-right">Payback</TableHead>
                        <TableHead className="text-right">10-yr net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            <div>{r.title}</div>
                            <div className="text-xs text-muted-foreground font-normal max-w-[220px]">{r.basis}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            {r.annualKwhSaved > 0 ? r.annualKwhSaved.toLocaleString() : "—"}
                            <div className="text-xs text-muted-foreground whitespace-nowrap">{r.annualKwhAfter.toLocaleString()} after</div>
                          </TableCell>
                          <TableCell className="text-right">{r.peakKwReduced > 0 ? r.peakKwReduced.toLocaleString() : "—"}</TableCell>
                          <TableCell className="text-right">
                            {$(r.annualEnergySavingsUsd + r.annualDemandSavingsUsd)}
                            <div className="text-xs text-muted-foreground whitespace-nowrap">Energy: {$(r.annualEnergySavingsUsd)}</div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">Demand: {$(r.annualDemandSavingsUsd)}</div>
                          </TableCell>
                          <TableCell className="text-right">{r.annualProgramPaymentUsd > 0 ? $(r.annualProgramPaymentUsd) : "—"}</TableCell>
                          <TableCell className="text-right">{$(r.annualSavingsUsd)}</TableCell>
                          <TableCell className="text-right">{r.rebateUsd > 0 ? $(r.rebateUsd) : "—"}</TableCell>
                          <TableCell className="text-right">{r.installedCostUsd > 0 ? $(r.installedCostUsd) : "—"}</TableCell>
                          <TableCell className="text-right">{r.installedCostUsd > 0 ? $(r.netCostUsd) : "—"}</TableCell>
                          <TableCell className="text-right">
                            {r.paybackYears !== null ? `${r.paybackYears.toFixed(1)} yrs` : "Immediate"}
                          </TableCell>
                          <TableCell className="text-right">{$(r.tenYearNetUsd)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold border-t-2">
                        <TableCell>Sum of standalone estimates</TableCell>
                        <TableCell className="text-right">{results.reduce((s, r) => s + r.annualKwhSaved, 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{Math.round(results.reduce((s, r) => s + r.peakKwReduced, 0) * 10) / 10}</TableCell>
                        <TableCell className="text-right">{$(results.reduce((s, r) => s + r.annualEnergySavingsUsd + r.annualDemandSavingsUsd, 0))}</TableCell>
                        <TableCell className="text-right">{$(results.reduce((s, r) => s + r.annualProgramPaymentUsd, 0))}</TableCell>
                        <TableCell className="text-right">{$(totalAnnual)}</TableCell>
                        <TableCell className="text-right">{$(results.reduce((s, r) => s + r.rebateUsd, 0))}</TableCell>
                        <TableCell className="text-right">{$(results.reduce((s, r) => s + r.installedCostUsd, 0))}</TableCell>
                        <TableCell className="text-right">{$(totalNetCost)}</TableCell>
                        <TableCell className="text-right">
                          {totalAnnual > 0 && totalNetCost > 0 ? `${(totalNetCost / totalAnnual).toFixed(1)} yrs` : "—"}
                        </TableCell>
                        <TableCell className="text-right">{$(totalAnnual * 10 - totalNetCost)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground mt-4 flex gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Each improvement is estimated independently against your current usage. Lower energy charges =
                    kWh saved × your energy rate; estimated demand-charge savings are shown separately.
                    Payback and 10-year net include both bill savings and any program payment, with rebates reducing upfront cost only.
                    Savings can overlap when improvements are combined; the sum is not a combined-building forecast.
                    Planning estimates, not engineering calculations. Cooling is assumed to be 35% of annual kWh;
                    savings assumptions are 8% of cooling for insulation, 15% for roof coating, and 20% or 12% for windows.
                    Rebate rates from Austin Energy's commercial Property Improvements page (reviewed 02/18/2026);
                    demand response payments are custom-quoted by Austin Energy — the $/kW-yr figure above is your
                    input. Final amounts, caps, and eligibility are set by Austin Energy.
                  </span>
                </p>
              </CardContent>
            </Card>

            <h2 className="text-lg font-semibold mt-8 mb-3">Program details & next steps</h2>
            <RecommendationCards cards={cards} />

            <Button variant="outline" onClick={reset} className="mt-6 w-full">
              <RotateCcw className="mr-2 h-4 w-4" /> Start over
            </Button>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {["Building", "Energy use", "Costs"].map((label, i) => (
                  <span key={label} className="flex items-center gap-2">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${i === step ? "bg-primary text-primary-foreground border-primary" : i < step ? "bg-primary/15 text-primary border-primary/30" : "border-border"}`}>
                      {i + 1}
                    </span>
                    <span className={i === step ? "text-foreground font-medium" : ""}>{label}</span>
                    {i < 2 && <span className="text-border">—</span>}
                  </span>
                ))}
              </div>

              {step === 0 && (
                <>
                  {QUESTIONS.map((q) => (
                    <div key={q.key} className="space-y-2">
                      <Label className="text-base font-semibold">{q.label}</Label>
                      <RadioGroup value={(data[q.key] as string) ?? ""} onValueChange={(v) => setData((d) => ({ ...d, [q.key]: v }))}>
                        {q.options.map(([v, l]) => (
                          <div key={v} className="flex items-center gap-2">
                            <RadioGroupItem value={v} id={`${q.key}-${v}`} />
                            <Label htmlFor={`${q.key}-${v}`} className="font-normal cursor-pointer">{l}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="roof">Roof area, sq ft</Label>
                      <Input id="roof" type="number" min={0} value={roof} onChange={(e) => setRoof(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="win">Window area, sq ft</Label>
                      <Input id="win" type="number" min={0} value={win} onChange={(e) => setWin(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full" disabled={!step1Complete} onClick={() => setStep(1)}>
                    Next: energy use <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Upload your Austin Energy bill (PDF)</Label>
                    <p className="text-sm text-muted-foreground">
                      We'll read your monthly kWh from the bill. Nothing is stored — the file is only used to extract usage.
                    </p>
                    <BillUpload onResult={(months) => setMonthlyKwh(months)} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="annual-kwh">Annual electricity use, kWh {monthlyKwh ? "(from bill)" : ""}</Label>
                      <Input
                        id="annual-kwh"
                        type="number"
                        min={0}
                        value={monthlyKwh ? String(annualKwh) : manualAnnualKwh}
                        disabled={!!monthlyKwh}
                        onChange={(e) => setManualAnnualKwh(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="annual-cost">Annual energy charges, $ (optional)</Label>
                      <Input id="annual-cost" type="number" min={0} value={annualCost} onChange={(e) => setAnnualCost(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Exclude demand charges, fixed fees, and taxes. Used to calculate your energy rate if not entered below.</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rate">Energy rate, $/kWh</Label>
                      <Input id="rate" type="number" min={0} step="0.001" value={ratePerKwh} onChange={(e) => setRatePerKwh(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Enter your variable electricity rate, excluding demand and fixed charges, or provide annual energy charges above.</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="demand">Demand charge, $/kW-month (optional)</Label>
                      <Input id="demand" type="number" min={0} step="0.01" value={demandCharge} onChange={(e) => setDemandCharge(e.target.value)} />
                      <p className="text-xs text-muted-foreground">On your bill as "Demand" or "kW" charge. Leave 0 if unsure.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Primary hours of operation</Label>
                    <RadioGroup value={hoursPerWeek} onValueChange={setHoursPerWeek}>
                      {OPERATING_PROFILES.map((p) => (
                        <div key={p.hoursPerWeek} className="flex items-center gap-2">
                          <RadioGroupItem value={String(p.hoursPerWeek)} id={`hrs-${p.hoursPerWeek}`} />
                          <Label htmlFor={`hrs-${p.hoursPerWeek}`} className="font-normal cursor-pointer">{p.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {annualKwh > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Estimated peak demand: <span className="font-medium text-foreground">{Math.round(estPeakKw)} kW</span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(0)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button className="flex-1" disabled={!step2Complete} onClick={() => setStep(2)}>
                      Next: improvement costs <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Enter your estimated installed cost for each improvement (a contractor quote if you have one,
                    or your best guess). Leave blank to skip that initiative.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {data.insulation !== "ok" && (
                      <div className="space-y-1">
                        <Label htmlFor="cost-ins">Insulation cost, $</Label>
                        <Input id="cost-ins" type="number" min={0} value={costInsulation} onChange={(e) => setCostInsulation(e.target.value)} />
                      </div>
                    )}
                    {data.roofSurface !== "reflective" && data.roofType !== "pitched" && (
                      <div className="space-y-1">
                        <Label htmlFor="cost-roof">Roof coating cost, $</Label>
                        <Input id="cost-roof" type="number" min={0} value={costRoof} onChange={(e) => setCostRoof(e.target.value)} />
                      </div>
                    )}
                    {(data.windows === "single" || data.windows === "unshaded") && (
                      <div className="space-y-1">
                        <Label htmlFor="cost-win">Window treatment cost, $</Label>
                        <Input id="cost-win" type="number" min={0} value={costWindows} onChange={(e) => setCostWindows(e.target.value)} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                    <Label className="text-base font-semibold">Demand response (no upfront cost)</Label>
                    <p className="text-sm text-muted-foreground">
                      Austin Energy pays businesses to curtail load during grid events. How many kW could your
                      building shed for a few hours (HVAC setback, lighting, equipment)?
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="dr-kw">Curtailable load, kW</Label>
                        <Input id="dr-kw" type="number" min={0} placeholder={String(effectiveDrKw)} value={drKw} onChange={(e) => setDrKw(e.target.value)} />
                        <p className="text-xs text-muted-foreground">Default: 10% of your estimated peak ({Math.round(estPeakKw * DEFAULT_DR_CURTAIL_FRACTION)} kW)</p>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dr-rate">Program payment, $/kW-year</Label>
                        <Input id="dr-rate" type="number" min={0} value={drRate} onChange={(e) => setDrRate(e.target.value)} />
                        <p className="text-xs text-muted-foreground">Austin Energy custom-quotes this; ${DEFAULT_DR_RATE_PER_KW_YEAR}/kW-yr is a conservative planning figure.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button className="flex-1" onClick={submit}>See my returns</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CommercialEnergyPlan;
