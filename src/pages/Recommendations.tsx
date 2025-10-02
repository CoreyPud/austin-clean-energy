import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lightbulb, Target, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Map from "@/components/Map";
import MapTokenLoader from "@/components/MapTokenLoader";

const Recommendations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleGenerateRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: {}
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Recommendations Generated",
        description: "Strategic action plan created successfully",
      });
    } catch (error: any) {
      console.error("Recommendations error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate recommendations",
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
            <h1 className="text-4xl font-bold mb-3 text-foreground">Recommendation Engine</h1>
            <p className="text-lg text-muted-foreground">
              Get strategic insights and prioritized action plans for Austin's clean energy transition
            </p>
          </div>

          {!results && (
            <Card className="mb-8 shadow-lg border-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5 text-accent" />
                  Generate Austin-Wide Recommendations
                </CardTitle>
                <CardDescription>
                  Analyze current data to identify high-impact opportunities across the city
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleGenerateRecommendations} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing City Data...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2 h-5 w-5" />
                      Generate Recommendations
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {results && (
            <div className="space-y-6 animate-slide-up">
              <MapTokenLoader>
                <Card className="border-2 border-primary/20 overflow-hidden">
                  <CardHeader>
                    <CardTitle>City-Wide Overview</CardTitle>
                    <CardDescription>Austin clean energy installations and programs</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Map 
                      center={[-97.7431, 30.2672]}
                      zoom={10}
                      markers={results.locations || []}
                      className="h-[500px]"
                      onMarkerClick={(id) => window.open(`/installation/${id}`, '_blank')}
                    />
                  </CardContent>
                </Card>
              </MapTokenLoader>

              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Strategic Recommendations</CardTitle>
                  <CardDescription>
                    Based on {results.dataPoints?.solarPrograms || 0} solar programs, {results.dataPoints?.energyAudits || 0} energy audits, {results.dataPoints?.weatherizationProjects || 0} weatherization projects, {results.dataPoints?.greenBuildings || 0} green buildings, and {results.dataPoints?.commercialBuildings || 0} commercial buildings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-foreground leading-relaxed">
                    {results.overview.split('\n\n').map((paragraph: string, idx: number) => (
                      <p key={idx} className="text-sm">{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button 
                  onClick={handleGenerateRecommendations}
                  variant="outline"
                  disabled={loading}
                >
                  Regenerate Recommendations
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
