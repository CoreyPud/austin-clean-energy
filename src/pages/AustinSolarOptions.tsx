import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import AccountAuthButton from "@/components/AccountAuthButton";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import SatellitePane, { type SolarPanel } from "@/components/SatellitePane";
import { useSolarFilter } from "@/components/SolarFilterPanel";
import BillUpload from "@/components/assessment/BillUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSeo } from "@/hooks/use-seo";
import { edgeFunctionErrorMessage } from "@/lib/edge-function-error";
import { detectAssessmentPropertyType } from "@/lib/assessment-property-type";
import { billToMonthlyKwh } from "@/lib/solar-model";
import { classifyProperty, computeRecommendation, defaultOmPerKwYear, DEFAULT_MONTHLY_BILL, estimateProductionPerKw, fromGoogleSolarInsights, isSsoEligible } from "@/lib/property-solar";
import type { FederalSolarOptions } from "@/lib/solar-federal-incentives";
import OptionResults from "@/features/solar-options/OptionResults";
import { annualizeBillUsage, screenSolarOptions, type BillPayer, type FinanceGoal, type SolarOption } from "@/features/solar-options/screening";

interface RoofAssessment {
  address?: string;
  center?: number[];
  solarCenter?: { lat: number; lon: number };
  solarInsights?: { maxPanels: number; panelCapacityWatts: number; sunshineHours: number; imageryDate?: { year: number; month: number; day: number } };
  solarPanels?: number[][];
  panelDims?: { h: number; w: number };
  roofSegments?: { segmentIndex: number; azimuthDeg: number; pitchDeg: number }[];
}
const STEPS = ["Your building", "Your priorities", "Your electricity bill", "Your solar options"];
const TYPES = [{ value: "single-family", label: "Residential — single family" }, { value: "condo", label: "Residential — condo" }, { value: "commercial", label: "Business / commercial" }, { value: "non-profit", label: "School / nonprofit / public organization" }, { value: "multi-family", label: "Multifamily" }];
const defaultUsage = (type: string) => Math.round(billToMonthlyKwh(DEFAULT_MONTHLY_BILL[type] ?? 150) * 12);

export default function AustinSolarOptions() {
  const [params] = useSearchParams();
  const [address, setAddress] = useState(params.get("address") ?? "");
  const [assessedAddress, setAssessedAddress] = useState("");
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<RoofAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const [propertyType, setPropertyType] = useState("single-family");
  const [typeMatched, setTypeMatched] = useState(false);
  const [payer, setPayer] = useState<BillPayer | "">("");
  const [goal, setGoal] = useState<FinanceGoal | "">("");
  const [estimatedUsage, setEstimatedUsage] = useState<number | "">(defaultUsage("single-family"));
  const [billMonths, setBillMonths] = useState<number[] | null>(null);
  const [useBill, setUseBill] = useState(false);
  const [billKey, setBillKey] = useState(0);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<SolarOption>("loan");
  const [sizeOverride, setSizeOverride] = useState<number | null>(null);
  const [costOverride, setCostOverride] = useState<number | null>(null);
  const [om, setOm] = useState(defaultOmPerKwYear("single-family"));
  const [loanRate, setLoanRate] = useState(6);
  const [loanYears, setLoanYears] = useState(20);
  const [leasePercent, setLeasePercent] = useState<number | null>(null);
  const [federal, setFederal] = useState<FederalSolarOptions>({ eligible: true, lowIncome: false, domesticContent: false, rebateReducesBasis: false });
  useSeo({ title: "Austin Solar Options | Austin Clean Energy", description: "Confirm your Austin building, share your electricity needs, and compare solar ownership, Standard Offer, and an illustrative equipment lease one step at a time." });

  const panels = useMemo<SolarPanel[] | undefined>(() => {
    const center = results?.solarCenter;
    if (!center || !results?.solarPanels?.length) return undefined;
    return results.solarPanels.map(([dlat, dlon, orientation, kwh, segmentIndex]) => ({ lat: center.lat + dlat / 1e6, lon: center.lon + dlon / 1e6, orientation: orientation ? "LANDSCAPE" : "PORTRAIT", yearlyEnergyDcKwh: kwh, segmentIndex }));
  }, [results]);
  const { azimuths, pitches } = useMemo(() => {
    const azimuths: Record<number, number> = {}, pitches: Record<number, number> = {};
    results?.roofSegments?.forEach(segment => { azimuths[segment.segmentIndex] = segment.azimuthDeg; pitches[segment.segmentIndex] = segment.pitchDeg; });
    return { azimuths, pitches };
  }, [results]);
  const surfaces = useMemo(() => [...new Set(panels?.map(panel => panel.segmentIndex) ?? [])], [panels]);
  const chosenPanels = useMemo(() => panels?.filter(panel => !excluded.has(panel.segmentIndex)), [panels, excluded]);
  const filter = useSolarFilter({ panels: chosenPanels, propertyType, azimuths });
  const si = results?.solarInsights;
  const count = filter.filteredPanelCount ?? si?.maxPanels ?? 0;
  const site = si && count > 0 ? fromGoogleSolarInsights({ ...si, maxPanels: count }, propertyType) : null;
  const annualBillUsage = billMonths ? annualizeBillUsage(billMonths) : null;
  const annualUsage = useBill && annualBillUsage != null ? annualBillUsage : Number(estimatedUsage);
  const vos = computeRecommendation(site, { annualUsageKwh: annualUsage, billingMode: "vos", systemKwOverride: sizeOverride, costPerWOverride: costOverride, federalOptions: federal });
  const sso = computeRecommendation(site, { billingMode: "sso", federalOptions: federal });
  const eligible = !!sso && isSsoEligible(sso, classifyProperty(propertyType), propertyType === "non-profit");
  const recommendation = screenSolarOptions(propertyType, payer || "unknown", goal || "unsure", eligible);
  const activeOption = selected === "sso" && !eligible ? recommendation.option : selected;
  const mapLat = results?.solarCenter?.lat ?? results?.center?.[1];
  const mapLon = results?.solarCenter?.lon ?? results?.center?.[0];
  const hasMap = mapLat != null && mapLon != null && Number.isFinite(mapLat) && Number.isFinite(mapLon);
  const residential = classifyProperty(propertyType) === "residential";

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  const changeType = (type: string) => {
    setPropertyType(type); setOm(defaultOmPerKwYear(type)); setEstimatedUsage(defaultUsage(type)); setSizeOverride(null); setCostOverride(null);
  };
  const assess = async (location?: { lat: number; lng: number }) => {
    const fullAddress = address.trim();
    if (!/^\d+\s+\S/.test(fullAddress)) { setError("Enter a complete street address, including the street number."); return; }
    const id = ++requestId.current;
    setLoading(true); setError(null);
    try {
      let type = propertyType;
      let detected: string | null = null;
      if (!location) {
        detected = await detectAssessmentPropertyType(fullAddress, async match => {
          let query = supabase.from("tcad_properties").select("property_type").ilike("situs_address", match.pattern);
          if (match.zip) query = query.eq("situs_zip", match.zip);
          const { data, error } = await query.limit(2);
          return error ? null : data;
        }).catch(() => null);
        type = detected ?? "single-family";
      }
      const { data, error: responseError } = await supabase.functions.invoke("unified-assessment", { body: { address: fullAddress, propertyType: type, location } });
      if (id !== requestId.current) return;
      if (responseError) throw new Error(await edgeFunctionErrorMessage(responseError));
      if (data?.error) throw new Error(data.error);
      if (!data?.center && !data?.solarCenter) throw new Error("No building location was returned. Try a more complete address.");
      if (assessedAddress !== fullAddress) {
        setBillMonths(null); setUseBill(false); setBillKey(key => key + 1); setPayer(""); setGoal(""); setLeasePercent(null);
      }
      if (!location) { changeType(type); setTypeMatched(!!detected); }
      setAssessedAddress(fullAddress); setResults(data); setExcluded(new Set()); setSizeOverride(null); setCostOverride(null); setStep(0);
    } catch (failure) {
      if (id === requestId.current) setError(failure instanceof Error ? failure.message : "Could not check that building. Please try again.");
    } finally { if (id === requestId.current) setLoading(false); }
  };
  const toggleSurface = (segment: number) => {
    setExcluded(previous => { const next = new Set(previous); if (next.has(segment)) next.delete(segment); else next.add(segment); return next; });
    setSizeOverride(null);
  };

  return <div className="min-h-screen bg-background text-foreground">
    <PageHeader title="Austin Solar Options" action={<AccountAuthButton />} />
    <main className="max-w-5xl mx-auto px-4 py-7 space-y-7">
      <nav aria-label="Solar options steps" className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-border pb-5">
        {STEPS.map((name, index) => <Button key={name} variant={index === step ? "default" : "ghost"} disabled={index > step || loading} onClick={() => goTo(index)} aria-current={index === step ? "step" : undefined} className="h-auto min-h-12 justify-start whitespace-normal text-left gap-2 px-3">
          <span className="shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">{index < step ? <Check className="h-3 w-3" /> : index + 1}</span><span>{name}</span>
        </Button>)}
      </nav>
      <div className="space-y-1"><p className="text-sm text-muted-foreground">Step {step + 1} of 4</p><h2 className="text-2xl md:text-3xl font-bold">{["Confirm your building", "What matters for this property?", "Your Austin Energy bill", "Your layout & financial options"][step]}</h2>{step > 0 && <p className="text-sm text-muted-foreground break-words flex gap-2 items-start"><MapPin className="h-4 w-4 shrink-0 mt-0.5" />{assessedAddress}</p>}</div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {loading && <p role="status" className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking your building…</p>}

      {step === 0 && <section className="space-y-5">
        <form className="flex flex-col md:flex-row gap-3 md:items-end" onSubmit={event => { event.preventDefault(); void assess(); }}>
          <div className="flex-1 space-y-2"><Label htmlFor="options-address">Property address</Label><AddressAutocomplete id="options-address" value={address} onChange={value => { ++requestId.current; setLoading(false); setAddress(value); setResults(null); setError(null); }} /></div>
          <Button type="submit" disabled={loading || !address.trim()}><MapPin className="h-4 w-4 mr-2" />Find building</Button>
        </form>
        {hasMap && <SatellitePane key={`confirm-${assessedAddress}-${mapLat}-${mapLon}`} lat={mapLat} lon={mapLon} panels={[]} fitKey={`${mapLat},${mapLon}`} className="w-full h-[420px] md:h-[480px] overflow-hidden border-y border-border" onPickLocation={loading ? undefined : (lat, lng) => void assess({ lat, lng })} />}
        {results && !si && <Alert><AlertDescription>Solar roof data is unavailable for this location. Confirm the building, then try another roof on the map; no layout or financial estimate will be invented.</AlertDescription></Alert>}
        <div className="flex justify-end"><Button disabled={!results || !hasMap || loading || !!error} onClick={() => goTo(1)}>This is my building<Check className="ml-2 h-4 w-4" /></Button></div>
      </section>}

      {step === 1 && <section className="max-w-2xl space-y-7">
        <div className="space-y-2"><Label htmlFor="organization-type">What type of property or organization is this?</Label>
          <Select value={propertyType} onValueChange={changeType}><SelectTrigger id="organization-type"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select>
          <p className="text-xs text-muted-foreground">{typeMatched ? "Initial type matched from TCAD. Confirm the organization type; nonprofit ownership must be selected manually." : "No unique TCAD classification was found. Please confirm the property type."}</p>
        </div>
        <div className="space-y-2"><Label htmlFor="bill-payer">Who pays the electricity bill?</Label>
          <Select value={payer} onValueChange={value => setPayer(value as BillPayer)}><SelectTrigger id="bill-payer"><SelectValue placeholder="Choose the bill payer" /></SelectTrigger><SelectContent><SelectItem value="owner">We / the property owner pay it</SelectItem><SelectItem value="tenant">The tenant or tenants pay it</SelectItem><SelectItem value="shared">Shared or multiple meters</SelectItem><SelectItem value="unknown">Not sure yet</SelectItem></SelectContent></Select>
        </div>
        <div className="space-y-2"><Label htmlFor="finance-priority">What is your financial preference?</Label>
          <Select value={goal} onValueChange={value => setGoal(value as FinanceGoal)}><SelectTrigger id="finance-priority"><SelectValue placeholder="Choose your preference" /></SelectTrigger><SelectContent><SelectItem value="own">Own the solar; open to a loan</SelectItem><SelectItem value="avoid-loan">Avoid a loan and upfront ownership</SelectItem><SelectItem value="unsure">Not sure — compare the options</SelectItem></SelectContent></Select>
        </div>
        <div className="flex justify-between gap-3"><Button variant="outline" onClick={() => goTo(0)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button><Button disabled={!payer || !goal} onClick={() => goTo(2)}>Continue<ArrowRight className="h-4 w-4 ml-2" /></Button></div>
      </section>}

      {step === 2 && <section className="max-w-2xl space-y-6">
        <BillUpload key={billKey} onResult={months => { if (annualizeBillUsage(months) == null) { setError("The bill returned invalid usage. Please try another PDF."); return; } setError(null); setBillMonths(months); setUseBill(true); }} onClear={() => { setBillMonths(null); setUseBill(false); }} />
        <p className="text-sm text-muted-foreground">Optional Austin Energy PDF, up to 5 MB. The existing private bill reader extracts usage; this page does not store the uploaded file or put account details in links.</p>
        {annualBillUsage != null && <div className="space-y-2"><p className="text-sm">{billMonths?.length} months read · {Math.round(annualBillUsage).toLocaleString()} kWh/year {billMonths && billMonths.length < 12 ? "annualized from the available months" : "from your bill"}.</p><Button variant={useBill ? "default" : "outline"} onClick={() => setUseBill(value => !value)}>{useBill ? "Using bill usage" : "Use bill usage"}</Button></div>}
        <div className="space-y-2 border-t border-border pt-5"><Label htmlFor="annual-kwh">Annual electricity usage (kWh) — estimate without a bill</Label><Input id="annual-kwh" type="number" min={1} value={estimatedUsage} disabled={useBill} onChange={event => setEstimatedUsage(event.target.value === "" ? "" : Math.max(0, Number(event.target.value)))} /><p className="text-xs text-muted-foreground">The starting value is the existing calculator’s property-type assumption, not measured usage. Replace it if you know your annual kWh. Standard Offer does not depend on your bill.</p></div>
        <div className="flex flex-wrap justify-between gap-3"><Button variant="outline" onClick={() => goTo(1)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button><div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!Number(estimatedUsage)} onClick={() => { setUseBill(false); setSelected(recommendation.option); goTo(3); }}>Skip bill — use estimate</Button>
          <Button disabled={!(annualUsage > 0)} onClick={() => { setSelected(recommendation.option); goTo(3); }}>See my options<ArrowRight className="h-4 w-4 ml-2" /></Button>
        </div></div>
      </section>}

      {step === 3 && <section className="space-y-7">
        {hasMap && <SatellitePane key={`layout-${assessedAddress}`} lat={mapLat} lon={mapLon} {...filter.paneProps} panels={filter.paneProps.panels ?? []} panelHeightM={results?.panelDims?.h} panelWidthM={results?.panelDims?.w} segmentAzimuths={azimuths} segmentPitches={pitches} className="w-full h-[420px] md:h-[480px] overflow-hidden border-y border-border" fitKey={`${mapLat},${mapLon}`} onPickLocation={loading ? undefined : (lat, lng) => void assess({ lat, lng })} onSegmentClick={toggleSurface} selectedPanelCount={si?.panelCapacityWatts && vos && sso ? Math.round((activeOption === "sso" ? sso : vos).recommendedKw * 1000 / si.panelCapacityWatts) : undefined} />}
        {surfaces.length > 1 && <div className="flex flex-wrap gap-2" aria-label="Roof surfaces">{surfaces.map(segment => <Button key={segment} variant={excluded.has(segment) ? "outline" : "default"} size="sm" aria-pressed={!excluded.has(segment)} onClick={() => toggleSurface(segment)}>Roof surface {segment + 1}{!excluded.has(segment) && <Check className="ml-2 h-3 w-3" />}</Button>)}</div>}
        <p className="text-sm text-muted-foreground">Usage: {Math.round(annualUsage).toLocaleString()} kWh/year ({useBill ? "from bill; annualized if fewer than 12 months" : "unverified estimate"}). Layout uses the existing high-sunlight and buildable-roof filters. Roof selections and option changes do not request new Google lookups.</p>
        {vos && sso ? <OptionResults propertyType={propertyType} recommendation={recommendation} selected={residential ? "loan" : activeOption} onSelect={setSelected} vos={vos} sso={sso} eligible={eligible} annualUsageKwh={annualUsage} productionPerKw={estimateProductionPerKw(si?.sunshineHours ?? null)} om={om} onOmChange={setOm} loanRate={loanRate} onLoanRateChange={setLoanRate} loanYears={loanYears} onLoanYearsChange={setLoanYears} leasePercent={leasePercent} onLeasePercentChange={setLeasePercent} onSizeChange={setSizeOverride} onCostChange={setCostOverride} federalOptions={federal} onFederalChange={setFederal} /> : <Alert><AlertDescription>{si ? "No buildable panels remain in the selected roof surfaces. Select another surface or check a different building." : "No Google Solar roof data is available for this building. Financial options require a verified roof size; try a different building."}</AlertDescription></Alert>}
        <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-5"><Button variant="outline" onClick={() => goTo(2)}><ArrowLeft className="h-4 w-4 mr-2" />Back to my bill</Button><Button asChild variant="link"><Link to={`/solar-savings-austin?address=${encodeURIComponent(assessedAddress)}&type=${propertyType}`}>Original solar potential page<ArrowRight className="h-4 w-4 ml-2" /></Link></Button></div>
      </section>}
    </main>
  </div>;
}