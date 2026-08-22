import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Home,
  Loader2,
  AlertCircle,
  Printer,
  Sparkles,
  Upload,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Map from "@/components/Map";
import MapTokenLoader from "@/components/MapTokenLoader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSeo } from "@/hooks/use-seo";
import PageHeader from "@/components/PageHeader";
import LifestyleAssessmentForm, { LifestyleData } from "@/components/LifestyleAssessmentForm";
import NeighborhoodSnapshot from "@/components/assessment/NeighborhoodSnapshot";
import ZipSolarAdoptionTrend from "@/components/assessment/ZipSolarAdoptionTrend";
import CouncilMemberCard from "@/components/assessment/CouncilMemberCard";
import RecommendationCards from "@/components/assessment/RecommendationCards";
import SectionHeading from "@/components/assessment/SectionHeading";
import SolarProgramView from "@/components/assessment/SolarProgramView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SsoProForma from "@/components/assessment/SsoProForma";
import PbiBreakdown from "@/components/assessment/PbiBreakdown";
import { pickSsoScenario } from "@/lib/sso-proforma";

import SatellitePane, { SolarPanel } from "@/components/SatellitePane";
import { useSolarFilter } from "@/components/SolarFilterPanel";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  billToMonthlyKwh,
  calculateAustinEnergyUsageBill,
  SSO_SHOW_THRESHOLD_KW,
} from "@/lib/solar-model";
import { computeRecommendation, fromGoogleSolarInsights, estimateProductionPerKw, classifyProperty, getCtaCopy, DEFAULT_MONTHLY_BILL } from "@/lib/property-solar";
import CouncilOutreachCard from "@/components/assessment/CouncilOutreachCard";
import ShareAssessmentCard from "@/components/assessment/ShareAssessmentCard";
import ContactCtaCard from "@/components/assessment/ContactCtaCard";
import { buildRecommendationCards, computeRecommendedKw } from "@/lib/clean-energy-plan";

const PropertyAssessment = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sharedAddress = searchParams.get("address") || "";
  const { toast } = useToast();
  const [address, setAddress] = useState(sharedAddress);
  const [propertyType, setPropertyType] = useState("single-family");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [autoRanFromUrl, setAutoRanFromUrl] = useState(false);
  const [monthlyBill, setMonthlyBill] = useState(150);
  const [uploadedKwh, setUploadedKwh] = useState<number[] | null>(null);
  const [uploadedBillData, setUploadedBillData] = useState<{ label: string; kwh: number; bill: number }[] | null>(null);
  const billInputRef = useRef<HTMLInputElement>(null);
  const [billParseState, setBillParseState] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [billParseSummary, setBillParseSummary] = useState<{ months: number; avgBill: number; avgKwh: number } | null>(null);
  const [billParseError, setBillParseError] = useState<string | null>(null);
  const [billViewMode, setBillViewMode] = useState<"estimate" | "bill">("estimate");
  const [costPerW, setCostPerW] = useState<number>(2.95);

  // Derived solar values — recomputed on every render when bill/results change
  const si = results?.solarInsights ?? null;

  const assessmentPanels = useMemo<SolarPanel[] | undefined>(() => {
    const sc = results?.solarCenter;
    const sp = results?.solarPanels as number[][] | undefined;
    if (!sc || !sp?.length) return undefined;
    return sp.map(([dlat, dlon, o, kwh, seg]) => ({
      lat: sc.lat + dlat / 1e6,
      lon: sc.lon + dlon / 1e6,
      orientation: (o ? "LANDSCAPE" : "PORTRAIT") as "LANDSCAPE" | "PORTRAIT",
      yearlyEnergyDcKwh: kwh,
      segmentIndex: seg,
    }));
  }, [results]);

  const [assessmentAzimuths, assessmentPitches] = useMemo(() => {
    const az: Record<number, number> = {};
    const pt: Record<number, number> = {};
    (results?.roofSegments ?? []).forEach((s: any) => {
      az[s.segmentIndex] = s.azimuthDeg;
      pt[s.segmentIndex] = s.pitchDeg;
    });
    return [az, pt];
  }, [results]);
  const annualUsageKwh = (billViewMode === "bill" && uploadedKwh)
    ? uploadedKwh.reduce((s, v) => s + v, 0)
    : billToMonthlyKwh(monthlyBill) * 12;

  // Same buildable-layout derate (setbacks, low-TSRF panels, rooftop walkways removed) that
  // PropertyPage.tsx applies -- without this, every downstream number here is sized off
  // Google's raw maximum instead of what can actually be built, and the two pages disagree.
  const solarFilter = useSolarFilter({
    panels: assessmentPanels,
    propertyType,
    azimuths: assessmentAzimuths,
  });
  const buildablePanels = solarFilter.filteredPanelCount ?? si?.maxPanels ?? null;

  // Single-sourced with PropertyPage.tsx via computeRecommendation: same sizing, rebate/PBI
  // eligibility, and production-per-kW (including the 0.86 NREL PVWatts derate) logic either
  // way, adapted from the live Google Solar response instead of a TCAD row.
  const siteInput = (si && buildablePanels)
    ? fromGoogleSolarInsights({ ...si, maxPanels: buildablePanels }, propertyType)
    : null;
  const recVos = computeRecommendation(siteInput, { annualUsageKwh, billingMode: "vos" });
  const recSso = computeRecommendation(siteInput, { billingMode: "sso" });
  const solarMaxKw = recVos?.maxKw ?? recSso?.maxKw ?? 0; // identical either way -- doesn't vary by billing mode
  const recommendedKw = recVos?.recommendedKw ?? null;
  const productionPerKw = estimateProductionPerKw(si?.sunshineHours ?? null);
  const sunshineHrsDisplay = si?.sunshineHours != null
    ? `${Math.round(si.sunshineHours).toLocaleString()} hrs/yr`
    : null;
  const roofSqft = si?.roofAreaM2 ? Math.round(si.roofAreaM2 * 10.764) : null;
  const imageryDateStr = si?.imageryDate
    ? `${si.imageryDate.year}-${String(si.imageryDate.month).padStart(2, "0")}-${String(si.imageryDate.day).padStart(2, "0")}`
    : null;

  const [systemKw, setSystemKw] = useState<number>(4);
  const [billingMode, setBillingMode] = useState<"vos" | "sso">("vos");
  const [financeMode, setFinanceMode] = useState<"cash" | "finance">("cash");
  const [loanTermYears, setLoanTermYears] = useState(20);
  const [loanRate, setLoanRate] = useState(6);
  const effectiveLoanTerm = financeMode === "cash" ? 0 : loanTermYears;
  const ssoEligible = propertyType === "commercial" && solarMaxKw >= SSO_SHOW_THRESHOLD_KW;

  // Reset to recommended only when a fresh assessment result loads
  useEffect(() => {
    const nextKw = propertyType === "commercial" ? recSso?.recommendedKw ?? null : recommendedKw;
    if (nextKw != null) setSystemKw(nextKw);
    setBillingMode(propertyType === "commercial" ? "sso" : "vos");
    if (propertyType === "commercial" && nextKw != null) setCostPerW(pickSsoScenario(nextKw).costPerWatt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  // Switching to SSO maximizes system size; switching back restores VoS recommended
  useEffect(() => {
    if (billingMode === "sso" && recSso?.recommendedKw != null) {
      setSystemKw(recSso.recommendedKw);
      if (propertyType === "commercial") setCostPerW(recSso.costPerW);
    } else if (billingMode === "vos" && recommendedKw != null) {
      setSystemKw(recommendedKw);
      if (propertyType === "commercial" && recVos) setCostPerW(recVos.costPerW);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingMode]);

  useEffect(() => {
    setMonthlyBill(DEFAULT_MONTHLY_BILL[propertyType] ?? 150);
    setBillingMode(propertyType === "commercial" ? "sso" : "vos");
    // Real system size isn't known yet at this point (results haven't loaded) -- seed with
    // the smaller-tier rate; the [results] effect above refines it once size is known.
    setCostPerW(propertyType === "commercial" ? pickSsoScenario(0).costPerWatt : 2.95);
  }, [propertyType]);

  // The single recommendation for whatever's currently selected (billing mode, manual size
  // override, and cost-per-watt override, if any) -- single-sourced with PropertyPage.tsx.
  // SolarProgramView derives all summary numbers (KPI strip, environmental impact) from this
  // directly, so no separate liveSummary calc is needed here.
  const rec = computeRecommendation(siteInput, {
    annualUsageKwh, systemKwOverride: systemKw, billingMode, costPerWOverride: costPerW,
  });

  useSeo({
    title: sharedAddress
      ? `Clean energy options for ${sharedAddress} — Austin Clean Energy`
      : "Calculate Solar Savings in Austin — Austin Clean Energy",
    description: sharedAddress
      ? `See solar potential, neighborhood adoption, savings estimates and personalized clean energy actions for ${sharedAddress}.`
      : "Enter your Austin address to see your neighborhood's solar adoption, your roof's solar potential, projected savings, your city council representative, and personalized clean energy actions.",
  });

  const [showLifestyleForm, setShowLifestyleForm] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [councilOutreachScript, setCouncilOutreachScript] = useState<string | null>(null);
  const lifestyleRef = useRef<HTMLDivElement>(null);
  const postQuizRef = useRef<HTMLDivElement>(null);

  const processBillFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setBillParseError("Please upload a PDF file.");
      setBillParseState("error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBillParseError("File too large — maximum 5 MB.");
      setBillParseState("error");
      return;
    }
    setBillParseState("parsing");
    setBillParseError(null);
    try {
      const arrayBuf = await file.arrayBuffer();
      const hashBuf = await crypto.subtle.digest("SHA-256", arrayBuf);
      const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
      const cacheKey = `bill-parse-v2-${hash}`;

      let months: { label: string; kwh: number }[];

      // Try cache — validate shape before trusting it
      let fromCache = false;
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0]?.kwh === "number") {
            months = parsed;
            fromCache = true;
          }
        }
      } catch {}

      if (!fromCache) {
        // Chunked base64 — avoids both call-stack overflow and O(n²) string growth
        const bytes = new Uint8Array(arrayBuf);
        const CHUNK = 8192;
        let binary = "";
        for (let i = 0; i < bytes.length; i += CHUNK) {
          binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
        }
        const base64 = btoa(binary);
        const { data, error: fnError } = await supabase.functions.invoke("parse-bill", {
          body: { file: base64, filename: file.name },
        });
        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);
        if (!Array.isArray(data?.months) || data.months.length === 0)
          throw new Error("No monthly usage data found.");
        months = data.months;
        try { localStorage.setItem(cacheKey, JSON.stringify(months)); } catch {}
      }

      // months is already Jan-Dec averaged by the edge function
      const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const billData = months.map((m: { label: string; kwh: number }) => ({
        label: m.label,
        kwh: m.kwh,
        bill: Math.round(calculateAustinEnergyUsageBill(m.kwh).total),
      }));
      const avgBill = Math.round(billData.reduce((s, m) => s + m.bill, 0) / billData.length);
      const avgKwh = Math.round(months.reduce((s: number, m: { kwh: number }) => s + m.kwh, 0) / months.length);
      setBillParseSummary({ months: months.length, avgBill, avgKwh });
      setUploadedBillData(billData);

      // Build a 12-element Jan-Dec indexed array for the solar model (missing months use the average)
      const kwhByMonth: number[] = MONTH_NAMES.map(name => {
        const found = months.find((m: { label: string; kwh: number }) => m.label === name);
        return found ? found.kwh : avgKwh;
      });

      setBillParseState("done");
      setBillViewMode("bill");
      setUploadedKwh(kwhByMonth);
    } catch (err: any) {
      setBillParseError(err.message || "Failed to parse bill.");
      setBillParseState("error");
    }
  };

  const validateForm = () => {
    const t = address.trim();
    if (!t) return "Please enter your property address";
    if (t.length > 200) return "Address must be less than 200 characters";
    if (/[<>{}]/.test(t)) return "Address contains invalid characters";
    if (!/^\d+\s+\S/.test(t)) return "Please enter a full street address (e.g. 123 Main St, Austin, TX)";
    if (!propertyType) return "Please select a property type";
    return null;
  };

  const callUnified = async (lifestyleData?: LifestyleData) => {
    const { data, error } = await supabase.functions.invoke("unified-assessment", {
      body: { address: address.trim(), propertyType, lifestyleData },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleAssess = async () => {
    const err = validateForm();
    if (err) {
      toast({ title: "Check your input", description: err, variant: "destructive" });
      return;
    }
    setLoading(true);
    setShowLifestyleForm(false);
    setQuizCompleted(false);
    setCouncilOutreachScript(null);
    // Sync the URL so this view is shareable
    const trimmed = address.trim();
    if (trimmed && searchParams.get("address") !== trimmed) {
      const next = new URLSearchParams(searchParams);
      next.set("address", trimmed);
      setSearchParams(next, { replace: true });
    }
    try {
      const data = await callUnified();
      setResults(data);
      
    } catch (e: any) {
      console.error("Assessment error:", e);
      toast({
        title: "Couldn't build your profile",
        description: e.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-run when arriving via shared link (?address=...). Defaults propertyType to single-family.
  useEffect(() => {
    if (!sharedAddress || autoRanFromUrl || results || loading) return;
    setAutoRanFromUrl(true);
    if (!propertyType) setPropertyType("single-family");
    // Defer to next tick so state settles
    setTimeout(() => {
      handleAssess();
    }, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedAddress]);

  const handleGetPersonalizedPlan = () => {
    setShowLifestyleForm(true);
    setTimeout(() => lifestyleRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleGeneratePlan = async (lifestyleData: LifestyleData) => {
    setPlanLoading(true);
    try {
      const data = await callUnified(lifestyleData);

      // Derive recommendedKw from fresh solar data and current bill inputs —
      // same formula the tool uses, so both plan and cards stay in sync.
      const usage = (billViewMode === "bill" && uploadedKwh)
        ? uploadedKwh.reduce((s, v) => s + v, 0)
        : billToMonthlyKwh(monthlyBill) * 12;
      const localRecommendedKw = computeRecommendedKw(data.solarInsights, usage);

      const cardOpts = { propertyType, solarInsights: data.solarInsights, lifestyleData, neighborhoodSnapshot: data.neighborhoodSnapshot, savings: data.savings, recommendedKw: localRecommendedKw };

      setResults({ ...data, recommendationCards: buildRecommendationCards(cardOpts) });
      setQuizCompleted(true);
      setCouncilOutreachScript(data.councilOutreachScript || null);
      setShowLifestyleForm(false);
      setTimeout(() => postQuizRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      toast({ title: "Personalized plan ready", description: "Your tailored next steps are below." });
    } catch (e: any) {
      console.error("Plan error:", e);
      toast({
        title: "Couldn't generate plan",
        description: e.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPlanLoading(false);
    }
  };

  const DB_TYPE_MAP: Record<string, string> = {
    single_family:  "single-family",
    multifamily:    "multi-family",
    condo:          "condo",
    commercial:     "commercial",
    non_profit:     "non-profit",
  };

  const handlePlaceSelected = async (fullAddress: string) => {
    const streetPart = fullAddress.split(",")[0].trim();
    if (!streetPart) return;
    const { data } = await supabase
      .from("tcad_properties")
      .select("property_type")
      .ilike("situs_address", streetPart + "%")
      .limit(2);
    if (data?.length === 1 && data[0].property_type) {
      const mapped = DB_TYPE_MAP[data[0].property_type];
      if (mapped) setPropertyType(mapped);
    }
  };

  const handleStartOver = () => {
    setResults(null);
    setQuizCompleted(false);
    setCouncilOutreachScript(null);
    setShowLifestyleForm(false);
    setAddress("");
    setPropertyType("single-family");
    if (searchParams.get("address")) {
      const next = new URLSearchParams(searchParams);
      next.delete("address");
      setSearchParams(next, { replace: true });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Calculate Solar Savings in Austin"
        subtitle="Find out your solar potential and estimated savings based on Austin's energy and solar buyback policies."
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">

          {/* Address Form */}
          <Card className="mb-8 shadow-lg border-2">
            <CardContent className="pt-6 space-y-4">
              {/* Address full width */}
              <div>
                <Label htmlFor="address" className="text-xs text-muted-foreground mb-1.5 block">Address</Label>
                <AddressAutocomplete
                  id="address"
                  value={address}
                  onChange={setAddress}
                  onPlaceSelected={handlePlaceSelected}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleAssess()}
                />
              </div>

              {/* Property type + Bill side by side */}
              <div className="grid md:grid-cols-2 gap-4 items-start">
                <div>
                  <Label htmlFor="propertyType" className="text-xs text-muted-foreground mb-1.5 block">Property type</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger id="propertyType" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-family">Single family</SelectItem>
                      <SelectItem value="multi-family">Multi-family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="non-profit">Non-profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(propertyType === "commercial" || propertyType === "non-profit") ? (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <Label className="text-xs text-muted-foreground">Monthly bill</Label>
                      <span className="text-xs text-muted-foreground">~{billToMonthlyKwh(monthlyBill).toLocaleString()} kWh/mo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        step={propertyType === "commercial" ? 100 : 50}
                        value={monthlyBill}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v) && v >= 0) { setMonthlyBill(v); setBillViewMode("estimate"); }
                        }}
                        className="h-10 flex-1 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={billInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processBillFile(file);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title={billParseState === "done"
                            ? billViewMode === "bill" ? "Switch to estimate" : "Switch to uploaded bill"
                            : "Upload your Austin Energy bill PDF"}
                          onClick={() => {
                            if (billParseState === "done") {
                              setBillViewMode(billViewMode === "bill" ? "estimate" : "bill");
                            } else {
                              billInputRef.current?.click();
                            }
                          }}
                          disabled={billParseState === "parsing"}
                          className={`h-6 w-6 flex items-center justify-center rounded transition-colors ${
                            billParseState === "done" && billViewMode === "bill"
                              ? "bg-primary/10 text-primary hover:bg-primary/20"
                              : billParseState === "done"
                              ? "text-primary/50 hover:bg-primary/10 hover:text-primary"
                              : billParseState === "error"
                              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                          }`}
                        >
                          {billParseState === "parsing" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : billParseState === "done" ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : billParseState === "error" ? (
                            <XCircle className="h-3.5 w-3.5" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <Label className="text-xs text-muted-foreground">Monthly bill</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {billViewMode === "bill" && billParseSummary ? (
                          <span className="tabular-nums text-sm">
                            <span className="font-semibold">${billParseSummary.avgBill}</span>
                            <span className="text-muted-foreground"> · {billParseSummary.avgKwh} kWh/mo</span>
                          </span>
                        ) : (
                          <span className="tabular-nums text-sm">
                            <span className="font-semibold">${monthlyBill}</span>
                            <span className="text-muted-foreground"> · ~{billToMonthlyKwh(monthlyBill).toLocaleString()} kWh/mo</span>
                          </span>
                        )}
                        {billParseState === "done" && billViewMode === "bill" && (
                          <button
                            type="button"
                            title="Clear uploaded bill"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBillParseState("idle");
                              setBillParseSummary(null);
                              setBillParseError(null);
                              setUploadedKwh(null);
                              setUploadedBillData(null);
                              setBillViewMode("estimate");
                              if (billInputRef.current) billInputRef.current.value = "";
                            }}
                            className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {billViewMode === "bill" && billParseState === "done" ? (
                      <div className="text-xs text-muted-foreground py-1">
                        {billParseSummary?.months} months of data · using real usage for calculations
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center h-10">
                          <Slider
                            min={50}
                            max={600}
                            step={10}
                            value={[monthlyBill]}
                            onValueChange={([v]) => { setMonthlyBill(v); setBillViewMode("estimate"); }}
                          />
                        </div>
                        {billParseState === "error" && (
                          <p className="text-xs text-destructive mt-1">{billParseError}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Bill history chart — shown inside the card when bill is uploaded */}
              {uploadedBillData && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Average monthly usage from your bill (kWh)</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={uploadedBillData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} width={36} />
                      <Tooltip formatter={(v: number) => [`${v} kWh`, "Usage"]} />
                      <Bar dataKey="kwh" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Build button full width */}
              <Button
                onClick={handleAssess}
                disabled={loading}
                className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Building…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    See my solar potential
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <div className="space-y-6 animate-slide-up">
              {/* Sticky scope — sticky control card is contained within this div and won't persist past it */}
              <div className="space-y-6">
                {/* ☀️ Solar Overview */}
                {si && (
                  <>
                    <SectionHeading emoji="☀️" title="Solar Overview" />

                    {/* Roof map — full width */}
                    <Card className="border-2 border-primary/20 overflow-hidden">
                      <CardContent className="p-0">
                        <MapTokenLoader>
                          <SatellitePane
                            lat={results.solarCenter?.lat ?? results.center?.[1] ?? 30.2672}
                            lon={results.solarCenter?.lon ?? results.center?.[0] ?? -97.7431}
                            className="w-full h-[480px]"
                            {...solarFilter.paneProps}
                            panelHeightM={results.panelDims?.h}
                            panelWidthM={results.panelDims?.w}
                            segmentAzimuths={assessmentAzimuths}
                            segmentPitches={assessmentPitches}
                            selectedPanelCount={
                              assessmentPanels && si?.panelCapacityWatts
                                ? Math.round(systemKw * 1000 / si.panelCapacityWatts)
                                : undefined
                            }
                          />
                        </MapTokenLoader>
                      </CardContent>
                    </Card>

                    {rec && (
                      <SolarProgramView
                        rec={rec}
                        recommendedKw={recommendedKw}
                        propertyClass={classifyProperty(propertyType)}
                        isNonProfit={propertyType === "non-profit"}
                        systemKw={systemKw}
                        onSystemKwChange={setSystemKw}
                        billingMode={billingMode}
                        onBillingModeChange={setBillingMode}
                        annualUsageKwh={annualUsageKwh}
                        productionPerKw={productionPerKw}
                        loanTermYears={effectiveLoanTerm}
                        loanInterestRate={loanRate / 100}
                        monthlyUsageKwh={uploadedKwh ?? undefined}
                        carbonOffsetKgPerMwh={si.carbonOffsetKgPerMwh}
                        sunshineHrsDisplay={sunshineHrsDisplay}
                        roofSqft={roofSqft}
                        panelCount={buildablePanels}
                        imageryQuality={si.imageryQuality}
                        imageryDate={imageryDateStr}
                        onCostPerWChange={setCostPerW}
                        financingSlot={billingMode === "vos" && (
                          <div className="rounded-lg border border-border bg-card p-4">
                            <Tabs value={financeMode} onValueChange={(v) => setFinanceMode(v as "cash" | "finance")}>
                              <div className="flex items-center gap-3 mb-4">
                                <span className="text-sm text-muted-foreground shrink-0">Financing</span>
                                <TabsList className="h-7">
                                  <TabsTrigger value="cash" className="text-xs px-3 h-6">Cash</TabsTrigger>
                                  <TabsTrigger value="finance" className="text-xs px-3 h-6">Finance</TabsTrigger>
                                </TabsList>
                              </div>
                              <TabsContent value="finance" className="mt-0 space-y-4">
                                <div>
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Loan term</span>
                                    <span className="font-semibold">{loanTermYears} year</span>
                                  </div>
                                  <Slider min={5} max={30} step={5} value={[loanTermYears]} onValueChange={([v]) => setLoanTermYears(v)} />
                                </div>
                                <div>
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Interest rate</span>
                                    <span className="font-semibold">{loanRate}%</span>
                                  </div>
                                  <Slider min={3} max={12} step={0.5} value={[loanRate]} onValueChange={([v]) => setLoanRate(v)} />
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      />
                    )}

                    {ssoEligible && billingMode === "sso" && (
                      <SsoProForma systemKw={systemKw} />
                    )}

                    {billingMode === "vos" && rec?.pbiEligible && (
                      <PbiBreakdown systemKw={systemKw} productionPerKw={productionPerKw} />
                    )}

                  </>
                )}

                {/* 🏘️ Your Block */}
                <SectionHeading emoji="🏘️" title="Solar in your neighborhood" />
                <div className="grid md:grid-cols-2 gap-4">
                  <NeighborhoodSnapshot
                    zipCode={results.zipCode}
                    installationsInZip={results.neighborhoodSnapshot.installationsInZip}
                    pendingPermitsInZip={results.neighborhoodSnapshot.pendingPermitsInZip}
                    averageSystemKw={results.neighborhoodSnapshot.averageSystemKw}
                    newest={results.neighborhoodSnapshot.newest}
                  />
                  <MapTokenLoader>
                    <Card className="border-2 border-primary/20 overflow-hidden">
                      <CardContent className="p-0">
                        <Map
                          center={results.center || [-97.7431, 30.2672]}
                          zoom={14}
                          markers={results.locations || []}
                          className="h-[340px]"
                          onMarkerClick={(id) => {
                            if (id !== "target-property") window.open(`/installation/${id}`, "_blank");
                          }}
                        />
                      </CardContent>
                    </Card>
                  </MapTokenLoader>
                </div>

                <ZipSolarAdoptionTrend zipCode={results.zipCode} />



                {/* Contact CTA */}
                <ContactCtaCard {...getCtaCopy(classifyProperty(propertyType), ssoEligible)} />

                {/* Quiz gate / lifestyle form — while quiz not yet completed */}
                {!quizCompleted && (
                  !showLifestyleForm ? (
                    <Card className="border-2 border-primary/30 shadow-md bg-gradient-to-br from-primary/5 via-background to-background">
                      <CardContent className="py-6 flex flex-col items-center text-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-foreground">What else can you do beyond solar?</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            EVs, home electrification, efficiency upgrades, community action — a 1-minute quiz surfaces the highest-impact moves for your specific situation.
                          </p>
                        </div>
                        <Button
                          onClick={handleGetPersonalizedPlan}
                          size="lg"
                          className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Find out
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div ref={lifestyleRef} className="animate-slide-up">
                      <LifestyleAssessmentForm
                        onSubmit={handleGeneratePlan}
                        loading={planLoading}
                        initialHomeType={propertyType}
                      />
                    </div>
                  )
                )}
              </div>

              {/* Next Steps — outside sticky scope so control card scrolls away on arrival */}
              {quizCompleted && (
                <div ref={postQuizRef} className="space-y-6 animate-slide-up">
                  <SectionHeading emoji="✅" title="Next Steps" />
                  <RecommendationCards cards={results.recommendationCards || []} />

                  <SectionHeading emoji="🏛️" title="Your council representative" />
                  <CouncilMemberCard
                    councilMember={{
                      ...results.councilMember,
                      lookupSucceeded: results.dataPoints.councilLookupSource === "arcgis",
                    }}
                  />
                  {councilOutreachScript && (
                    <CouncilOutreachCard
                      script={councilOutreachScript}
                      councilName={results.councilMember.name}
                      councilEmail={results.councilMember.email}
                      district={results.councilMember.district}
                    />
                  )}

                  <div className="flex justify-center gap-3 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuizCompleted(false);
                        setCouncilOutreachScript(null);
                        setShowLifestyleForm(true);
                        setTimeout(
                          () => lifestyleRef.current?.scrollIntoView({ behavior: "smooth" }),
                          100,
                        );
                      }}
                    >
                      Retake lifestyle assessment
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print / Save as PDF
                    </Button>
                  </div>
                </div>
              )}

              {/* Share card — placed after recommendations & plan */}
              <ShareAssessmentCard address={results.address || address} />

              <div className="flex justify-center">
                <Button variant="ghost" onClick={handleStartOver}>
                  Start over with a new address
                </Button>
              </div>

              {/* AI / data disclaimer — bottom of page */}
              <Alert className="border-primary/30 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertTitle>How we built this</AlertTitle>
                <AlertDescription>
                  Solar potential comes from Google Solar API. Neighborhood counts come from Austin's
                  open permit data. Council district is resolved live from Austin's ArcGIS service.
                  All recommendations and savings estimates are calculated from your property data —
                  for a precise, certified energy efficiency rating, schedule a professional audit
                  through Austin Energy's Home Performance program.{" "}
                  <button
                    onClick={() => navigate("/data-sources")}
                    className="text-primary font-medium hover:underline"
                  >
                    See full methodology
                  </button>
                  .
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyAssessment;
