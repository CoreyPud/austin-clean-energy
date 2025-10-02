import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Home, Zap, DollarSign, Leaf, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-2 border-accent/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Zap className="mr-2 h-5 w-5 text-accent" />
                      Solar Viability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-accent">{results.solarScore || "8.5/10"}</p>
                    <p className="text-sm text-muted-foreground mt-1">{results.solarEstimate || "~12kW system"}</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Leaf className="mr-2 h-5 w-5 text-primary" />
                      Efficiency Grade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{results.efficiencyGrade || "B+"}</p>
                    <p className="text-sm text-muted-foreground mt-1">{results.savingsPotential || "$850/yr potential"}</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-secondary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <DollarSign className="mr-2 h-5 w-5 text-secondary" />
                      ROI Estimate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-secondary">{results.roiYears || "7-9 yrs"}</p>
                    <p className="text-sm text-muted-foreground mt-1">{results.totalSavings || "$45k lifetime"}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Detailed Assessment</CardTitle>
                  <CardDescription>AI-powered recommendations for your property</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground whitespace-pre-wrap">{results.assessment}</p>
                  </div>
                </CardContent>
              </Card>

              {results.recommendations && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {results.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="font-bold text-primary mr-3">{idx + 1}.</span>
                          <span className="text-foreground">{rec}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyAssessment;
