import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Home, Zap, Leaf, Loader2, CheckCircle2, Sun, Battery, ExternalLink, Camera, AlertCircle, TrendingUp, Building2, Lightbulb, ArrowDown, Printer, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Map from "@/components/Map";
import MapTokenLoader from "@/components/MapTokenLoader";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSeo } from "@/hooks/use-seo";
import LifestyleAssessmentForm, { LifestyleData } from "@/components/LifestyleAssessmentForm";

const PropertyAssessment = () => {
  useSeo({
    title: "Property Assessment & Personalized Plan",
    description: "Get a personalized solar and energy efficiency assessment for your Austin property, then dive deeper with a customized action plan.",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Step 2 state
  const [showLifestyleForm, setShowLifestyleForm] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const lifestyleRef = useRef<HTMLDivElement>(null);

  const handleAssess = async () => {
    const trimmedAddress = address.trim();
    
    if (!trimmedAddress) {
      toast({ title: "Missing Information", description: "Please enter your property address", variant: "destructive" });
      return;
    }
    if (trimmedAddress.length > 200) {
      toast({ title: "Invalid Address", description: "Address must be less than 200 characters", variant: "destructive" });
      return;
    }
    if (/[<>{}]/.test(trimmedAddress)) {
      toast({ title: "Invalid Address", description: "Address contains invalid characters", variant: "destructive" });
      return;
    }
    // Require a street number + street name pattern
    if (!/^\d+\s+\S/.test(trimmedAddress)) {
      toast({ title: "Incomplete Address", description: "Please enter a full street address (e.g. 123 Main St, Austin, TX)", variant: "destructive" });
      return;
    }
    // Must reference Austin, TX area
    const austinPattern = /austin|ATX|787\d{2}/i;
    if (!austinPattern.test(trimmedAddress)) {
      toast({ title: "Austin Addresses Only", description: "This tool is designed for Austin, TX properties. Please include 'Austin' or an Austin ZIP code (787xx) in your address.", variant: "destructive" });
      return;
    }
    if (!propertyType) {
      toast({ title: "Missing Information", description: "Please select a property type", variant: "destructive" });
      return;
    }

    setLoading(true);
    setShowLifestyleForm(false);
    setRecommendations(null);
    try {
      const { data, error } = await supabase.functions.invoke('property-assessment', {
        body: { address: trimmedAddress, propertyType }
      });
      if (error) throw error;
      setResults(data);
      toast({ title: "Assessment Complete", description: "Property analysis generated successfully" });
    } catch (error: any) {
      console.error("Assessment error:", error);
      toast({ title: "Assessment Failed", description: error.message || "Failed to assess property", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGetPersonalizedPlan = () => {
    setShowLifestyleForm(true);
    setTimeout(() => {
      lifestyleRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleGenerateRecommendations = async (lifestyleData: LifestyleData) => {
    setRecommendationsLoading(true);
    try {
      // Build propertyData from Step 1 results
      const propertyData = results ? {
        address: results.address,
        propertyType,
        solarInsights: results.solarInsights || null,
        greenBuildingContext: results.dataPoints?.greenBuildingAverages || null,
        nearbyPermitCount: results.dataPoints?.citySolarPermits || null,
      } : undefined;

      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: { lifestyleData, propertyData }
      });
      if (error) throw error;
      setRecommendations(data);
      setShowLifestyleForm(false);
      toast({ title: "Personalized Plan Generated", description: "Your customized action plan is ready" });
    } catch (error: any) {
      console.error("Recommendations error:", error);
      toast({ title: "Generation Failed", description: error.message || "Failed to generate recommendations", variant: "destructive" });
    } finally {
      setRecommendationsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-3 text-foreground">Property Assessment</h1>
            <p className="text-lg text-muted-foreground">
              Get a comprehensive clean energy evaluation for your property, then optionally dive deeper with a personalized action plan
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${results ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}>
                {results ? <CheckCircle2 className="h-5 w-5" /> : '1'}
              </div>
              <span className="text-sm font-medium">Property Analysis</span>
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${recommendations ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {recommendations ? <CheckCircle2 className="h-5 w-5" /> : '2'}
              </div>
              <span className={`text-sm font-medium ${recommendations ? 'text-foreground' : 'text-muted-foreground'}`}>Personalized Plan</span>
            </div>
          </div>

          {/* Step 1: Property Form */}
          <Card className="mb-8 shadow-lg border-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="mr-2 h-5 w-5 text-primary" />
                Property Details
              </CardTitle>
              <CardDescription>
                Enter your property information for a tailored assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Main St, Austin, TX"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-family">Single Family</SelectItem>
                      <SelectItem value="multi-family">Multi-Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAssess} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assessing...
                    </>
                  ) : (
                    "Assess Property"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 1 Results */}
          {results && (
            <div className="space-y-6 animate-slide-up">
              <Alert className="border-primary/30 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertTitle>AI-Generated Assessment</AlertTitle>
                <AlertDescription>
                  The Energy Efficiency rating and recommendations below are AI-generated estimates based on available data. 
                  For a precise, certified energy efficiency rating, we recommend scheduling a professional energy audit through{" "}
                  <a 
                    href="https://austinenergy.com/energy-efficiency/ecad-ordinance/ecad-for-residential-customers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline"
                  >
                    Austin Energy's Home Performance program
                  </a>.
                  {" "}Learn more about{" "}
                  <button
                    onClick={() => navigate('/data-sources')}
                    className="text-primary font-medium hover:underline"
                  >
                    our data sources and methodology
                  </button>.
                </AlertDescription>
              </Alert>

              {results.dataPoints.googleSolarDataUsed && results.solarInsights && (
                <Card className="border-2 border-primary shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 mb-2">
                          <Sun className="h-5 w-5 text-primary" />
                          Google Solar Analysis
                          <Badge variant="secondary" className="ml-2">
                            <Camera className="h-3 w-3 mr-1" />
                            Personalized for Your Roof
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Precise measurements for {results.address}
                          {results.solarInsights.imageryDate && (
                            <span className="block text-xs mt-1">
                              Based on satellite imagery from {new Date(results.solarInsights.imageryDate.year, results.solarInsights.imageryDate.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const lat = results.center[1];
                          const lng = results.center[0];
                          window.open(`https://sunroof.withgoogle.com/building/${lat}/${lng}`, '_blank');
                        }}
                        className="shrink-0"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Explore on Google Sunroof
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 bg-background/80 rounded-lg border border-primary/20">
                        <div className="flex items-center mb-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                          <span className="text-sm font-medium">Max Panels</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">{results.solarInsights.maxPanels || 'N/A'}</p>
                        {results.solarInsights.panelCapacityWatts && (
                          <p className="text-xs text-muted-foreground mt-1">{results.solarInsights.panelCapacityWatts}W each</p>
                        )}
                      </div>
                      <div className="p-4 bg-background/80 rounded-lg border border-primary/20">
                        <div className="flex items-center mb-2">
                          <Home className="h-4 w-4 text-primary mr-2" />
                          <span className="text-sm font-medium">Roof Area</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">{results.solarInsights.roofArea ? `${Math.round(results.solarInsights.roofArea)}m²` : 'N/A'}</p>
                        {results.solarInsights.buildingStats?.areaMeters2 && (
                          <p className="text-xs text-muted-foreground mt-1">Total: {Math.round(results.solarInsights.buildingStats.areaMeters2)}m²</p>
                        )}
                      </div>
                      <div className="p-4 bg-background/80 rounded-lg border border-primary/20">
                        <div className="flex items-center mb-2">
                          <Sun className="h-4 w-4 text-primary mr-2" />
                          <span className="text-sm font-medium">Annual Sunshine</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">{results.solarInsights.sunshineHours ? `${Math.round(results.solarInsights.sunshineHours)}hrs` : 'N/A'}</p>
                        {results.solarInsights.annualProduction && (
                          <p className="text-xs text-muted-foreground mt-1">~{results.solarInsights.annualProduction} kWh/yr</p>
                        )}
                      </div>
                      <div className="p-4 bg-background/80 rounded-lg border border-primary/20">
                        <div className="flex items-center mb-2">
                          <Leaf className="h-4 w-4 text-primary mr-2" />
                          <span className="text-sm font-medium">CO₂ Offset</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">{results.solarInsights.carbonOffset ? `${Math.round(results.solarInsights.carbonOffset)}kg` : 'N/A'}</p>
                        {results.solarInsights.panelLifetimeYears && (
                          <p className="text-xs text-muted-foreground mt-1">{results.solarInsights.panelLifetimeYears}yr lifespan</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <MapTokenLoader>
                <Card className="border-2 border-primary/20 overflow-hidden">
                  <CardHeader>
                    <CardTitle>Property Location</CardTitle>
                    <CardDescription>Your property and {results.dataPoints.citySolarPermits} nearby solar installations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Map 
                      center={results.center || [-97.7431, 30.2672]}
                      zoom={14}
                      markers={results.locations || []}
                      className="h-[400px]"
                      onMarkerClick={(id) => {
                        if (id !== 'target-property') {
                          window.open(`/installation/${id}`, '_blank');
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </MapTokenLoader>

              {results.dataPoints.greenBuildingAverages && (
                <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-background">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-accent" />
                      Austin Green Building Comparison
                    </CardTitle>
                    <CardDescription>
                      How this property compares to {results.dataPoints.greenBuildingCount} certified green buildings in Austin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-background/80 rounded-lg border border-accent/20">
                        <div className="flex items-center mb-2">
                          <Building2 className="h-4 w-4 text-accent mr-2" />
                          <span className="text-sm font-medium">Average Star Rating</span>
                        </div>
                        <p className="text-2xl font-bold text-accent">
                          {results.dataPoints.greenBuildingAverages.avgStarRating} 
                          <span className="text-sm text-muted-foreground ml-1">stars</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Austin certified buildings</p>
                      </div>
                      <div className="p-4 bg-background/80 rounded-lg border border-accent/20">
                        <div className="flex items-center mb-2">
                          <Zap className="h-4 w-4 text-accent mr-2" />
                          <span className="text-sm font-medium">Avg Energy Savings</span>
                        </div>
                        <p className="text-2xl font-bold text-accent">
                          {results.dataPoints.greenBuildingAverages.avgEnergySavings}
                          <span className="text-sm text-muted-foreground ml-1">%</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Compared to standard buildings</p>
                      </div>
                      <div className="p-4 bg-background/80 rounded-lg border border-accent/20">
                        <div className="flex items-center mb-2">
                          <Leaf className="h-4 w-4 text-accent mr-2" />
                          <span className="text-sm font-medium">Avg Water Savings</span>
                        </div>
                        <p className="text-2xl font-bold text-accent">
                          {results.dataPoints.greenBuildingAverages.avgWaterSavings}
                          <span className="text-sm text-muted-foreground ml-1">%</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Compared to standard buildings</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      These benchmarks help contextualize your property's potential. The AI assessment considers these averages 
                      when generating recommendations for your specific situation.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Property Assessment</CardTitle>
                  <CardDescription>
                    For {results.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong {...props} className="text-foreground font-semibold" />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul {...props} className="list-disc pl-5 space-y-1" />
                        ),
                        p: ({ node, ...props }) => (
                          <p {...props} className="mb-3 text-foreground/90" />
                        ),
                      }}
                    >
                      {results.assessment}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2 CTA */}
              {!showLifestyleForm && !recommendations && (
                <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 shadow-lg">
                  <CardContent className="py-8 text-center">
                    <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2 text-foreground">Want a Personalized Action Plan?</h3>
                    <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                      Answer a few quick questions about your lifestyle and we'll combine your property data with personalized recommendations for maximum impact.
                    </p>
                    <Button 
                      size="lg" 
                      onClick={handleGetPersonalizedPlan}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      <ArrowDown className="mr-2 h-5 w-5" />
                      Get My Personalized Plan
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Lifestyle Form */}
              {showLifestyleForm && !recommendations && (
                <div ref={lifestyleRef} className="animate-slide-up">
                  <LifestyleAssessmentForm 
                    onSubmit={handleGenerateRecommendations}
                    loading={recommendationsLoading}
                    initialHomeType={propertyType}
                  />
                </div>
                </div>
              )}

              {/* Step 2 Results */}
              {recommendations && (
                <div className="space-y-6 animate-slide-up">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Your Personalized Action Plan</h2>
                  </div>

                  <MapTokenLoader>
                    <Card className="border-2 border-primary/20 overflow-hidden">
                      <CardHeader>
                        <CardTitle>Austin Solar Activity Heatmap</CardTitle>
                        <CardDescription>Permit density by ZIP code - darker areas show higher solar adoption</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Map 
                          center={results?.center || [-97.7431, 30.2672]}
                          zoom={10}
                          heatmapData={recommendations.heatmapData}
                          className="h-[500px]"
                        />
                      </CardContent>
                    </Card>
                  </MapTokenLoader>

                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle>Strategic Recommendations</CardTitle>
                      <CardDescription>
                        Based on your property at {results?.address} and {recommendations.dataPoints?.solarPermits || 0} solar permits, {recommendations.dataPoints?.energyAudits || 0} energy audits, {recommendations.dataPoints?.weatherizationProjects || 0} weatherization projects, and {recommendations.dataPoints?.greenBuildings || 0} green buildings.{" "}
                        <button
                          onClick={() => navigate('/data-sources')}
                          className="text-primary hover:underline font-medium"
                        >
                          Learn about our data sources
                        </button>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a {...props} className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer" />
                            ),
                            strong: ({ node, ...props }) => (
                              <strong {...props} className="font-bold text-foreground" />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul {...props} className="list-disc list-inside space-y-1 my-3" />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol {...props} className="list-decimal list-inside space-y-1 my-3" />
                            ),
                            p: ({ node, ...props }) => (
                              <p {...props} className="mb-3 leading-relaxed" />
                            ),
                            h2: ({ node, ...props }) => (
                              <h2 {...props} className="text-xl font-bold mt-6 mb-3" />
                            ),
                            h3: ({ node, ...props }) => (
                              <h3 {...props} className="text-lg font-semibold mt-4 mb-2" />
                            ),
                          }}
                        >
                          {recommendations.overview}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center gap-4 flex-wrap">
                    <Button 
                      onClick={() => {
                        setRecommendations(null);
                        setShowLifestyleForm(true);
                        setTimeout(() => {
                          lifestyleRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      variant="outline"
                    >
                      Retake Lifestyle Assessment
                    </Button>
                    <Button 
                      onClick={() => {
                        setResults(null);
                        setRecommendations(null);
                        setShowLifestyleForm(false);
                        setAddress("");
                        setPropertyType("");
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      variant="outline"
                    >
                      Start Over
                    </Button>
                    <Button 
                      onClick={() => window.print()}
                      variant="outline"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print / Save as PDF
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyAssessment;
