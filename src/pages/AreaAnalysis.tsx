import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, TrendingUp, Zap, Battery, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AreaAnalysis = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!zipCode || zipCode.length !== 5) {
      toast({
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('area-analysis', {
        body: { zipCode }
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Analysis Complete",
        description: "Community insights generated successfully",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze area",
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
            <h1 className="text-4xl font-bold mb-3 text-foreground">Area Opportunity Analysis</h1>
            <p className="text-lg text-muted-foreground">
              Discover solar, efficiency, and storage opportunities across Austin neighborhoods
            </p>
          </div>

          <Card className="mb-8 shadow-lg border-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Enter Location
              </CardTitle>
              <CardDescription>
                Analyze clean energy opportunities by ZIP code or neighborhood
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    placeholder="78701"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    maxLength={5}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Area"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {results && (
            <div className="space-y-6 animate-slide-up">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Zap className="h-5 w-5 text-accent mr-2" />
                        <span className="font-semibold">Solar Potential</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{results.solarPotential || "High"}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="h-5 w-5 text-secondary mr-2" />
                        <span className="font-semibold">Efficiency Score</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{results.efficiencyScore || "7.5/10"}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Battery className="h-5 w-5 text-primary mr-2" />
                        <span className="font-semibold">Storage Adoption</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{results.storageAdoption || "12%"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                  <CardDescription>Data-driven recommendations for this area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground whitespace-pre-wrap">{results.insights}</p>
                  </div>
                </CardContent>
              </Card>

              {results.topOpportunities && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Top Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {results.topOpportunities.map((opp: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 mr-3 flex-shrink-0" />
                          <span className="text-foreground">{opp}</span>
                        </li>
                      ))}
                    </ul>
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

export default AreaAnalysis;
