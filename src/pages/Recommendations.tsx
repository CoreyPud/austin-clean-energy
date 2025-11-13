import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Map from "@/components/Map";
import MapTokenLoader from "@/components/MapTokenLoader";
import ReactMarkdown from 'react-markdown';
import LifestyleAssessmentForm, { LifestyleData } from "@/components/LifestyleAssessmentForm";

const Recommendations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showForm, setShowForm] = useState(true);

  const handleGenerateRecommendations = async (lifestyleData: LifestyleData) => {
    setLoading(true);
    setShowForm(false);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: { lifestyleData }
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Personalized Recommendations Generated",
        description: "Your customized action plan is ready",
      });
    } catch (error: any) {
      console.error("Recommendations error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive",
      });
      setShowForm(true);
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

          {showForm && !results && (
            <LifestyleAssessmentForm 
              onSubmit={handleGenerateRecommendations}
              loading={loading}
            />
          )}

          {results && (
            <div className="space-y-6 animate-slide-up">
              <MapTokenLoader>
                <Card className="border-2 border-primary/20 overflow-hidden">
                  <CardHeader>
                    <CardTitle>Austin Solar Activity Heatmap</CardTitle>
                    <CardDescription>Permit density by ZIP code - darker areas show higher solar adoption</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Map 
                      center={[-97.7431, 30.2672]}
                      zoom={10}
                      heatmapData={results.heatmapData}
                      className="h-[500px]"
                    />
                  </CardContent>
                </Card>
              </MapTokenLoader>

              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Strategic Recommendations</CardTitle>
                  <CardDescription>
                    Based on {results.dataPoints?.solarPermits || 0} solar permits, {results.dataPoints?.energyAudits || 0} energy audits, {results.dataPoints?.weatherizationProjects || 0} weatherization projects, and {results.dataPoints?.greenBuildings || 0} green buildings (avg {results.dataPoints?.avgGreenBuildingRating || 'N/A'} stars).{" "}
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
                        a: ({node, ...props}) => (
                          <a {...props} className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer" />
                        ),
                        strong: ({node, ...props}) => (
                          <strong {...props} className="font-bold text-foreground" />
                        ),
                        ul: ({node, ...props}) => (
                          <ul {...props} className="list-disc list-inside space-y-1 my-3" />
                        ),
                        ol: ({node, ...props}) => (
                          <ol {...props} className="list-decimal list-inside space-y-1 my-3" />
                        ),
                        p: ({node, ...props}) => (
                          <p {...props} className="mb-3 leading-relaxed" />
                        ),
                        h2: ({node, ...props}) => (
                          <h2 {...props} className="text-xl font-bold mt-6 mb-3" />
                        ),
                        h3: ({node, ...props}) => (
                          <h3 {...props} className="text-lg font-semibold mt-4 mb-2" />
                        ),
                      }}
                    >
                      {results.overview}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button 
                  onClick={() => {
                    setResults(null);
                    setShowForm(true);
                  }}
                  variant="outline"
                >
                  Start Over
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
