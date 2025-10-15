import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Home, Zap, DollarSign, Leaf, Loader2, CheckCircle2, Sun, Battery, ExternalLink, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Map from "@/components/Map";
import MapTokenLoader from "@/components/MapTokenLoader";
import { Badge } from "@/components/ui/badge";

const PropertyAssessment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAssess = async () => {
    if (!address || !propertyType) {
      toast({
        title: "Missing Information",
        description: "Please enter address and select property type",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('property-assessment', {
        body: { address, propertyType }
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Assessment Complete",
        description: "Property analysis generated successfully",
      });
    } catch (error: any) {
      console.error("Assessment error:", error);
      toast({
        title: "Assessment Failed",
        description: error.message || "Failed to assess property",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-3 text-foreground">Property Assessment</h1>
            <p className="text-lg text-muted-foreground">
              Get a comprehensive clean energy evaluation for your property
            </p>
          </div>

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

          {results && (
            <div className="space-y-6 animate-slide-up">
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

                    {results.solarInsights.financialAnalyses && results.solarInsights.financialAnalyses.length > 0 && (
                      <div className="border-t border-primary/20 pt-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Financial Scenarios for Your Roof
                        </h4>
                        <div className="grid md:grid-cols-3 gap-3">
                          {results.solarInsights.financialAnalyses.map((analysis: any, idx: number) => (
                            <div key={idx} className="p-3 bg-background/60 rounded-lg border border-primary/10">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {analysis.panelConfigIndex ? `Config ${analysis.panelConfigIndex + 1}` : `Scenario ${idx + 1}`}
                              </p>
                              {analysis.monthlyBill?.amount && (
                                <p className="text-sm">
                                  Monthly Bill: <span className="font-semibold">${analysis.monthlyBill.amount}</span>
                                </p>
                              )}
                              {analysis.financialDetails?.initialAcKwhPerYear && (
                                <p className="text-xs text-muted-foreground">
                                  {Math.round(analysis.financialDetails.initialAcKwhPerYear).toLocaleString()} kWh/yr
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                        // Don't try to open detail page for the user's own property
                        if (id !== 'target-property') {
                          window.open(`/installation/${id}`, '_blank');
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </MapTokenLoader>

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyAssessment;
