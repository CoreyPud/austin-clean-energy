import { useState, useRef, useEffect } from "react";
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
import LifestyleAssessmentForm, { LifestyleData } from "@/components/LifestyleAssessmentForm";
import NeighborhoodSnapshot from "@/components/assessment/NeighborhoodSnapshot";
import SolarPotentialCard from "@/components/assessment/SolarPotentialCard";
import CouncilMemberCard from "@/components/assessment/CouncilMemberCard";
import RecommendationCards from "@/components/assessment/RecommendationCards";
import SectionHeading from "@/components/assessment/SectionHeading";
import SolarCalculator from "@/components/assessment/SolarCalculator";
import SolarRoofMap from "@/components/assessment/SolarRoofMap";
import { Slider } from "@/components/ui/slider";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  billToMonthlyKwh,
  calculateAustinEnergyUsageBill,
  buildYearModel,
  buildThirtyYearModel,
  AUSTIN_INSTALL_COST_PER_KW,
  austinEnergyRebate,
} from "@/lib/solar-model";
import CouncilOutreachCard from "@/components/assessment/CouncilOutreachCard";
import ShareAssessmentCard from "@/components/assessment/ShareAssessmentCard";
import ContactCtaCard from "@/components/assessment/ContactCtaCard";

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

  // Derived solar values — recomputed on every render when bill/results change
  const si = results?.solarInsights ?? null;
  const solarMaxKw = si ? Math.round((si.maxPanels * si.panelCapacityWatts) / 100) / 10 : 0;
  const solarProdPerKw = si && si.annualProductionKwh > 0 && solarMaxKw > 0
    ? si.annualProductionKwh / solarMaxKw : 1500;
  const annualUsageKwh = (billViewMode === "bill" && uploadedKwh)
    ? uploadedKwh.reduce((s, v) => s + v, 0)
    : billToMonthlyKwh(monthlyBill) * 12;
  const unconstrainedKw = solarProdPerKw > 0 ? annualUsageKwh / solarProdPerKw : 0;
  const recommendedKw = solarMaxKw > 0
    ? Math.round(Math.min(Math.max(unconstrainedKw, 2), solarMaxKw) * 2) / 2
    : null;

  const [systemKw, setSystemKw] = useState<number>(4);
  const [batteryKwh, setBatteryKwh] = useState<number>(0);
  // Reset to recommended only when a fresh assessment result loads
  useEffect(() => {
    if (recommendedKw != null) setSystemKw(recommendedKw);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  const liveSummary = (() => {
    if (!si || systemKw <= 0) return null;
    const inputs = {
      annualUsageKwh,
      systemKw,
      batteryKwh,
      loanTermYears: 0,
      loanInterestRate: 0,
      productionPerKw: solarProdPerKw,
    };
    const cost = Math.max(0, systemKw * AUSTIN_INSTALL_COST_PER_KW + batteryKwh * 1000 - austinEnergyRebate(systemKw, propertyType));
    const yr1 = buildYearModel(inputs, 0);
    const yr30 = buildThirtyYearModel(inputs, cost);
    const net25 = yr30.cumulativeByYear[24]?.cumulative ?? 0;
    return {
      monthlySavings: yr1.savings / 12,
      paybackYear: yr30.paybackYear ?? null,
      roi: cost > 0 ? Math.round((net25 / cost) * 100) : null,
      billOffsetPct: yr1.billWithoutSolar > 0
        ? Math.round((yr1.savings / yr1.billWithoutSolar) * 100)
        : 0,
      co2TonsPerYear: Math.round(yr1.solarTotal * 0.000386 * 10) / 10,
    };
  })();

  useSeo({
    title: sharedAddress
      ? `Clean energy options for ${sharedAddress} — Austin Clean Energy`
      : "My Austin Energy Profile — Property + Neighborhood Insights",
    description: sharedAddress
      ? `See solar potential, neighborhood adoption, savings estimates and personalized clean energy actions for ${sharedAddress}.`
      : "Enter your Austin address to see your neighborhood's solar adoption, your roof's solar potential, projected savings, your city council representative, and personalized clean energy actions.",
  });

  const [showLifestyleForm, setShowLifestyleForm] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [personalizedPlan, setPersonalizedPlan] = useState<string | null>(null);
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
    if (!/austin|ATX|787\d{2}/i.test(t))
      return "This tool is for Austin, TX properties. Include 'Austin' or an Austin ZIP (787xx).";
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
    setPersonalizedPlan(null);
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
      setResults(data);
      setPersonalizedPlan(data.personalizedPlan || null);
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

  const handleStartOver = () => {
    setResults(null);
    setPersonalizedPlan(null);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-5xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-3 text-foreground">My Austin Energy Profile</h1>
            <p className="text-lg text-muted-foreground">
              Solar potential, estimated savings, neighborhood adoption, and your council representative — based on your Austin address.
            </p>
          </div>

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
                      <Slider
                        min={50}
                        max={propertyType === "commercial" ? 10000 : propertyType === "non-profit" ? 5000 : 600}
                        step={propertyType === "commercial" ? 100 : propertyType === "non-profit" ? 50 : 10}
                        value={[monthlyBill]}
                        onValueChange={([v]) => { setMonthlyBill(v); setBillViewMode("estimate"); }}
                      />
                      {billParseState === "error" && (
                        <p className="text-xs text-destructive mt-1">{billParseError}</p>
                      )}
                    </>
                  )}
                </div>
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
                    Build my profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <div className="space-y-6 animate-slide-up">
              {/* ☀️ Recommended System */}
              {si && (
                <>
                  <SectionHeading emoji="☀️" title="Solar Overview" />

                  {/* Control card — recommended + sliders */}
                  <div className="sticky top-0 z-20 -mx-4 px-4">
                    <Card className="rounded-t-none rounded-b-xl border-2 border-primary/20 shadow-md bg-background/95 backdrop-blur">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-6">
                          {/* System size slider */}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground mb-1">System size</div>
                            <div className="text-2xl font-bold tabular-nums mb-3">{systemKw.toFixed(1)} kW</div>
                            <Slider
                              min={1}
                              max={Math.max(solarMaxKw, 16)}
                              step={0.5}
                              value={[systemKw]}
                              onValueChange={([v]) => setSystemKw(v)}
                            />
                            {recommendedKw != null && (
                              <div className="flex justify-end text-[10px] text-muted-foreground mt-1.5">
                                <button
                                  onClick={() => setSystemKw(recommendedKw)}
                                  disabled={systemKw === recommendedKw}
                                  className="tabular-nums transition-colors disabled:cursor-default hover:text-primary disabled:hover:text-muted-foreground"
                                >
                                  {recommendedKw.toFixed(1)} kW recommended
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="h-16 w-px bg-border shrink-0" />

                          {/* Battery slider */}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground mb-1">Battery backup</div>
                            <div className="text-2xl font-bold tabular-nums mb-3">{batteryKwh === 0 ? "None" : `${batteryKwh} kWh`}</div>
                            <Slider
                              min={0} max={30} step={1}
                              value={[batteryKwh]}
                              onValueChange={([v]) => setBatteryKwh(v)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Metrics card + map */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <SolarPotentialCard
                      solarInsights={si}
                      billOffsetPct={liveSummary?.billOffsetPct ?? null}
                      monthlySavings={liveSummary?.monthlySavings ?? null}
                      co2TonsPerYear={liveSummary?.co2TonsPerYear ?? null}
                    />
                    <Card className="border-2 border-primary/20 overflow-hidden">
                      <CardContent className="p-0">
                        <SolarRoofMap center={results.center || [-97.7431, 30.2672]} solarInsights={si} />
                      </CardContent>
                    </Card>
                  </div>

                  <SolarCalculator
                    solarInsights={si}
                    annualUsageKwh={annualUsageKwh}
                    uploadedKwh={uploadedKwh}
                    propertyType={propertyType}
                    systemKw={systemKw}
                    batteryKwh={batteryKwh}
                  />
                </>
              )}

              {/* 🏘️ Your Block */}
              <SectionHeading emoji="🏘️" title="Your Block" />
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

              {/* Contact CTA */}
              <ContactCtaCard />

              {/* Quiz gate → form → post-quiz results */}
              {!personalizedPlan ? (
                <>
                  {!showLifestyleForm ? (
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
                  )}
                </>
              ) : (
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
                        setPersonalizedPlan(null);
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
                  Any AI-generated recommendations or personalized plan content are estimates based on
                  available data — for a precise, certified energy efficiency rating, schedule a
                  professional audit through Austin Energy's Home Performance program.{" "}
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
