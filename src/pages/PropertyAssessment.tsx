import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Home,
  Loader2,
  AlertCircle,
  ArrowDown,
  Printer,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Map from "@/components/Map";
import MapTokenLoader from "@/components/MapTokenLoader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSeo } from "@/hooks/use-seo";
import LifestyleAssessmentForm, { LifestyleData } from "@/components/LifestyleAssessmentForm";
import NeighborhoodSnapshot from "@/components/assessment/NeighborhoodSnapshot";
import SolarPotentialCard from "@/components/assessment/SolarPotentialCard";
import SavingsCards from "@/components/assessment/SavingsCards";
import CouncilMemberCard from "@/components/assessment/CouncilMemberCard";
import RecommendationCards from "@/components/assessment/RecommendationCards";
import CleanEnergyScoreCard from "@/components/assessment/CleanEnergyScoreCard";
import SectionHeading from "@/components/assessment/SectionHeading";
import PersonalizedPlanDisplay from "@/components/assessment/PersonalizedPlanDisplay";

const PropertyAssessment = () => {
  useSeo({
    title: "My Austin Energy Profile — Property + Neighborhood Insights",
    description:
      "Enter your Austin address to see your neighborhood's solar adoption, your roof's solar potential, projected savings, your city council representative, and personalized clean energy actions.",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [showLifestyleForm, setShowLifestyleForm] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [personalizedPlan, setPersonalizedPlan] = useState<string | null>(null);
  const lifestyleRef = useRef<HTMLDivElement>(null);
  const planRef = useRef<HTMLDivElement>(null);

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
    try {
      const data = await callUnified();
      setResults(data);
      toast({ title: "Profile ready", description: "Scroll down to explore your insights." });
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
      setShowLifestyleForm(false);
      setTimeout(() => planRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
    setShowLifestyleForm(false);
    setAddress("");
    setPropertyType("");
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
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="mr-2 h-5 w-5 text-primary" />
                Start with your address
              </CardTitle>
              <CardDescription>
                We'll pull live data on your neighborhood, your roof, and your council district.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-[1fr_220px_auto] gap-3 items-end">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Main St, Austin, TX"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1"
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleAssess()}
                  />
                </div>
                <div>
                  <Label htmlFor="propertyType">Property type</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger id="propertyType" className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-family">Single family</SelectItem>
                      <SelectItem value="multi-family">Multi-family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAssess}
                  disabled={loading}
                  className="bg-gradient-to-r from-secondary to-accent hover:opacity-90 h-10"
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
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <div className="space-y-6 animate-slide-up">
              {/* Hero score */}
              <CleanEnergyScoreCard
                address={results.address}
                district={results.councilMember.district}
                zipCode={results.zipCode}
                propertyType={propertyType}
                solarViability={
                  results.solarInsights
                    ? Math.min(
                        10,
                        Math.max(1, Math.round((results.solarInsights.sunshineHours / 2000) * 7)),
                      )
                    : null
                }
                neighborInstalls={results.neighborhoodSnapshot.installationsInZip}
                paybackYears={results.savings?.paybackYears ?? null}
              />

              {/* ☀️ Your Roof */}
              {results.solarInsights && (
                <>
                  <SectionHeading emoji="☀️" title="Your Roof" subtitle="What the satellite sees up there" />
                  <SolarPotentialCard
                    solarInsights={results.solarInsights}
                    center={results.center}
                  />
                </>
              )}

              {/* 💰 The Money */}
              {results.savings && (
                <>
                  <SectionHeading emoji="💰" title="The Money" subtitle="What going solar would cost and save" />
                  <SavingsCards savings={results.savings} />
                </>
              )}

              {/* 🏘️ Your Block */}
              <SectionHeading emoji="🏘️" title="Your Block" subtitle="How your neighborhood is going clean" />
              <NeighborhoodSnapshot
                zipCode={results.zipCode}
                installationsInZip={results.neighborhoodSnapshot.installationsInZip}
                pendingPermitsInZip={results.neighborhoodSnapshot.pendingPermitsInZip}
                averageSystemKw={results.neighborhoodSnapshot.averageSystemKw}
                newest={results.neighborhoodSnapshot.newest}
              />

              {/* Map */}
              <MapTokenLoader>
                <Card className="border-2 border-primary/20 overflow-hidden">
                  <CardHeader>
                    <CardTitle>Property & nearby installations</CardTitle>
                    <CardDescription>
                      Red pin = your address • Green pins = nearby solar installations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Map
                      center={results.center || [-97.7431, 30.2672]}
                      zoom={14}
                      markers={results.locations || []}
                      className="h-[400px]"
                      onMarkerClick={(id) => {
                        if (id !== "target-property") window.open(`/installation/${id}`, "_blank");
                      }}
                    />
                  </CardContent>
                </Card>
              </MapTokenLoader>

              {/* 🏛️ Your Rep */}
              <SectionHeading emoji="🏛️" title="Your Rep" subtitle="Local advocacy starts here" />
              <CouncilMemberCard
                councilMember={{
                  ...results.councilMember,
                  lookupSucceeded: results.dataPoints.councilLookupSource === "arcgis",
                }}
              />

              {/* ✅ Smart Next Moves */}
              <SectionHeading emoji="✅" title="Smart Next Moves" subtitle="Ranked by climate impact for your property" />
              <RecommendationCards cards={results.recommendationCards || []} />


              {/* Data caveat moved to bottom of page */}
              {/* Personalized plan CTA */}
              {!showLifestyleForm && !personalizedPlan && (
                <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 shadow-lg">
                  <CardContent className="py-8 text-center">
                    <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2 text-foreground">
                      Want a personalized action plan?
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                      Answer a few quick lifestyle questions and we'll combine your property data with a
                      step-by-step plan written for your specific situation.
                    </p>
                    <Button
                      size="lg"
                      onClick={handleGetPersonalizedPlan}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      <ArrowDown className="mr-2 h-5 w-5" />
                      Get my personalized plan
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Lifestyle form */}
              {showLifestyleForm && !personalizedPlan && (
                <div ref={lifestyleRef} className="animate-slide-up">
                  <LifestyleAssessmentForm
                    onSubmit={handleGeneratePlan}
                    loading={planLoading}
                    initialHomeType={propertyType}
                  />
                </div>
              )}

              {/* Personalized plan */}
              {personalizedPlan && (
                <div ref={planRef} className="space-y-4 animate-slide-up">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Your Personalized Plan</h2>
                  </div>
                  <Card className="border-2 border-primary/30">
                    <CardContent className="p-6">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          components={{
                            a: (p) => (
                              <a {...p} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />
                            ),
                            strong: (p) => <strong {...p} className="text-foreground font-semibold" />,
                            ul: (p) => <ul {...p} className="list-disc pl-5 space-y-1 my-3" />,
                            ol: (p) => <ol {...p} className="list-decimal pl-5 space-y-1 my-3" />,
                            p: (p) => <p {...p} className="mb-3 text-foreground/90 leading-relaxed" />,
                            h2: (p) => <h2 {...p} className="text-xl font-bold mt-5 mb-2" />,
                            h3: (p) => <h3 {...p} className="text-lg font-semibold mt-4 mb-2" />,
                          }}
                        >
                          {personalizedPlan}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center gap-3 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPersonalizedPlan(null);
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
