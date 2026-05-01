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
import CleanEnergyScoreCard from "@/components/assessment/CleanEnergyScoreCard";
import SectionHeading from "@/components/assessment/SectionHeading";
import SolarCalculator from "@/components/assessment/SolarCalculator";
import SolarRoofMap from "@/components/assessment/SolarRoofMap";
import { Slider } from "@/components/ui/slider";
import {
  billToMonthlyKwh,
  buildYearModel,
  buildThirtyYearModel,
  austinInstallCost,
  AUSTIN_ENERGY_SOLAR_REBATE,
} from "@/lib/solar-model";
import CouncilOutreachCard from "@/components/assessment/CouncilOutreachCard";
import ShareAssessmentCard from "@/components/assessment/ShareAssessmentCard";

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
  const billInputRef = useRef<HTMLInputElement>(null);
  const [billParseState, setBillParseState] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [billParseSummary, setBillParseSummary] = useState<{ months: number; avgKwh: number } | null>(null);
  const [billParseError, setBillParseError] = useState<string | null>(null);

  // Derived solar values — recomputed on every render when bill/results change
  const si = results?.solarInsights ?? null;
  const solarMaxKw = si ? Math.round((si.maxPanels * si.panelCapacityWatts) / 100) / 10 : 0;
  const solarProdPerKw = si && si.annualProductionKwh > 0 && solarMaxKw > 0
    ? si.annualProductionKwh / solarMaxKw : 1500;
  const annualUsageKwh = uploadedKwh
    ? uploadedKwh.reduce((s, v) => s + v, 0)
    : billToMonthlyKwh(monthlyBill) * 12;
  const unconstrainedKw = solarProdPerKw > 0 ? annualUsageKwh / solarProdPerKw : 0;
  const recommendedKw = solarMaxKw > 0
    ? Math.round(Math.min(Math.max(unconstrainedKw, 2), solarMaxKw) * 2) / 2
    : null;
  const liveSummary = (() => {
    if (!si || !recommendedKw) return null;
    const inputs = {
      annualUsageKwh,
      systemKw: recommendedKw,
      batteryKwh: 0,
      loanTermYears: 0,
      loanInterestRate: 0,
      productionPerKw: solarProdPerKw,
    };
    const cost = Math.max(0, austinInstallCost(recommendedKw, 0) - AUSTIN_ENERGY_SOLAR_REBATE);
    const yr1 = buildYearModel(inputs, 0);
    const yr30 = buildThirtyYearModel(inputs, cost);
    const net25 = yr30.cumulativeByYear[24]?.cumulative ?? 0;
    return {
      monthlySavings: yr1.savings / 12,
      paybackYear: yr30.paybackYear ?? null,
      roi: cost > 0 ? Math.round((net25 / cost) * 100) : null,
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
    setBillParseState("parsing");
    setBillParseError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error: fnError } = await supabase.functions.invoke("parse-bill", {
        body: { file: base64, filename: file.name },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!Array.isArray(data?.months) || data.months.length === 0)
        throw new Error("No monthly usage data found.");
      const monthlyKwh = (data.months.slice(-12) as { kwh: number }[]).map((m) => m.kwh);
      setBillParseSummary({
        months: monthlyKwh.length,
        avgKwh: Math.round(monthlyKwh.reduce((s, v) => s + v, 0) / monthlyKwh.length),
      });
      setBillParseState("done");
      setUploadedKwh(monthlyKwh);
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
              One address. Your neighborhood snapshot, roof solar potential, savings estimate, council
              representative, and concrete next steps — all in one place.
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
              <div className="grid md:grid-cols-[200px_1fr] gap-4 items-start">
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
                        title={billParseState === "done" ? "Upload a different bill" : "Upload your Austin Energy bill PDF"}
                        onClick={() => {
                          if (billParseState === "done" || billParseState === "error") {
                            setBillParseState("idle");
                            setBillParseSummary(null);
                            setBillParseError(null);
                            setUploadedKwh(null);
                          }
                          billInputRef.current?.click();
                        }}
                        disabled={billParseState === "parsing"}
                        className={`h-6 w-6 flex items-center justify-center rounded transition-colors ${
                          billParseState === "done"
                            ? "bg-primary/10 text-primary hover:bg-primary/20"
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
                    <span className="font-semibold tabular-nums text-sm">
                      {billParseState === "done" && billParseSummary
                        ? `avg ${billParseSummary.avgKwh} kWh / mo`
                        : `$${monthlyBill} / mo`}
                    </span>
                  </div>
                  <Slider
                    min={50} max={600} step={10}
                    value={[monthlyBill]}
                    onValueChange={([v]) => { setMonthlyBill(v); setUploadedKwh(null); setBillParseState("idle"); setBillParseSummary(null); }}
                    className={billParseState === "done" ? "opacity-40" : ""}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span>$50</span>
                    {billParseState === "error" && (
                      <span className="text-destructive">{billParseError}</span>
                    )}
                    <span>$600</span>
                  </div>
                </div>
              </div>

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
              {/* Summary tile */}
              <CleanEnergyScoreCard
                address={results.address}
                district={results.councilMember.district}
                zipCode={results.zipCode}
                propertyType={propertyType}
                recommendedKw={recommendedKw}
                monthlySavings={liveSummary?.monthlySavings ?? null}
                paybackYears={liveSummary?.paybackYear ?? null}
              />

              {/* ☀️ Your Roof + 🔧 Run the Numbers */}
              {si && recommendedKw && (
                <>
                  <SectionHeading emoji="☀️" title="Your Roof" />
                  <div className="grid md:grid-cols-2 gap-4">
                    <SolarPotentialCard solarInsights={si} recommendedSystemKw={recommendedKw} />
                    <Card className="border-2 border-primary/20 overflow-hidden">
                      <CardContent className="p-0">
                        <SolarRoofMap center={results.center || [-97.7431, 30.2672]} solarInsights={si} />
                      </CardContent>
                    </Card>
                  </div>

                  <SectionHeading emoji="🔧" title="Run the Numbers" />
                  <SolarCalculator
                    solarInsights={si}
                    annualUsageKwh={annualUsageKwh}
                    uploadedKwh={uploadedKwh}
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
                          className="bg-gradient-to-r from-secondary to-accent hover:opacity-90"
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
