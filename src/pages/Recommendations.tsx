import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lightbulb, Target, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-6 w-6 text-primary" />
                    Strategic Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">
                    {results.overview}
                  </p>
                </CardContent>
              </Card>

              {results.priorities && results.priorities.length > 0 && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Priority Opportunities</CardTitle>
                    <CardDescription>Highest ROI and climate impact initiatives</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.priorities.map((priority: any, idx: number) => (
                        <div key={idx} className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                          <h3 className="font-bold text-lg mb-2 text-primary">{priority.title}</h3>
                          <p className="text-foreground mb-2">{priority.description}</p>
                          {priority.impact && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Impact:</strong> {priority.impact}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.actionPlan && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Action Plan</CardTitle>
                    <CardDescription>Phased implementation strategy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {results.actionPlan.immediate && (
                        <div>
                          <h3 className="font-bold text-accent mb-3">Immediate Actions (0-3 months)</h3>
                          <ul className="space-y-2">
                            {results.actionPlan.immediate.map((action: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <div className="h-2 w-2 rounded-full bg-accent mt-2 mr-3 flex-shrink-0" />
                                <span className="text-foreground">{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {results.actionPlan.mediumTerm && (
                        <div>
                          <h3 className="font-bold text-secondary mb-3">Medium-Term Goals (3-12 months)</h3>
                          <ul className="space-y-2">
                            {results.actionPlan.mediumTerm.map((action: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <div className="h-2 w-2 rounded-full bg-secondary mt-2 mr-3 flex-shrink-0" />
                                <span className="text-foreground">{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {results.actionPlan.advocacy && (
                        <div>
                          <h3 className="font-bold text-primary mb-3">Advocacy Strategies</h3>
                          <ul className="space-y-2">
                            {results.actionPlan.advocacy.map((action: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 mr-3 flex-shrink-0" />
                                <span className="text-foreground">{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

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
