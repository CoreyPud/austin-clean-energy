import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import LifestyleAssessmentForm, { type LifestyleData } from "@/components/LifestyleAssessmentForm";
import RecommendationCards from "@/components/assessment/RecommendationCards";
import { buildRecommendationCards } from "@/lib/clean-energy-plan";
import PageHeader from "@/components/PageHeader";

const CleanEnergyPlan = () => {
  const [cards, setCards] = useState<ReturnType<typeof buildRecommendationCards> | null>(null);

  useSeo({
    title: "Your Austin Clean Energy Plan",
    description: "Answer a few questions about your home and lifestyle to get personalized clean energy recommendations for Austin residents.",
  });

  const handleSubmit = (data: LifestyleData) => {
    const result = buildRecommendationCards({
      propertyType: data.homeType,
      solarInsights: null,
      lifestyleData: data,
      neighborhoodSnapshot: null,
      savings: null,
      recommendedKw: null,
    });
    setCards(result);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const title = cards === null ? "Your Clean Energy Plan" : "Your Recommendations";
  const subtitle = cards === null
    ? "A few questions about your home and lifestyle to surface the highest-impact moves available to you in Austin."
    : "Based on your answers, here are the highest-impact clean energy steps available to you in Austin.";

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {cards === null ? (
          <LifestyleAssessmentForm onSubmit={handleSubmit} />
        ) : (
          <>
            <RecommendationCards cards={cards} />
            <Button
              variant="outline"
              onClick={() => setCards(null)}
              className="mt-6 w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Start over
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CleanEnergyPlan;
