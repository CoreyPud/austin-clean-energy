import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

const EmbedAreaAnalysis = () => {
  const [searchParams] = useSearchParams();
  const zipCode = searchParams.get("zip") || "";
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState("");
  const [dataPoints, setDataPoints] = useState<{
    solarPermits: number;
    energyAudits: number;
    weatherizationProjects: number;
  } | null>(null);

  useEffect(() => {
    if (zipCode) {
      analyzeArea();
    }
  }, [zipCode]);

  const analyzeArea = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("area-analysis", {
        body: { zipCode },
      });

      if (error) throw error;

      setInsights(data.insights);
      setDataPoints(data.dataPoints);
    } catch (error) {
      console.error("Error analyzing area:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!zipCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please provide a ZIP code parameter</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg sm:text-xl">
                Clean Energy Opportunities - {zipCode}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
            </div>
          ) : (
            <>
              {dataPoints && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                  <div className="text-center p-2 sm:p-3 bg-primary/5 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-primary">
                      {dataPoints.solarPermits}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Solar Permits</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-primary/5 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-primary">
                      {dataPoints.energyAudits}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Energy Audits</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-primary/5 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-primary">
                      {dataPoints.weatherizationProjects}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Weatherization</div>
                  </div>
                </div>
              )}

              <div className="prose prose-sm sm:prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
                <ReactMarkdown>{insights}</ReactMarkdown>
              </div>

              <div className="pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => window.open(window.location.origin + "/area-analysis?zip=" + zipCode, "_blank")}
                >
                  Get Full Analysis & Recommendations
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmbedAreaAnalysis;
