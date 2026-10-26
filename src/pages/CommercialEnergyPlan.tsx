import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSeo } from "@/hooks/use-seo";
import RecommendationCards from "@/components/assessment/RecommendationCards";
import { buildCommercialCards, type CommercialPlanData } from "@/lib/commercial-energy-plan";
import PageHeader from "@/components/PageHeader";

type Q = { key: keyof CommercialPlanData; label: string; options: [string, string][] };
const QUESTIONS: Q[] = [
  { key: "role", label: "What's your relationship to the building?", options: [["owner", "Owner"], ["manager", "Property manager"], ["tenant", "Tenant"]] },
  { key: "roofType", label: "What kind of roof does it have?", options: [["flat", "Flat or low-slope"], ["pitched", "Pitched / sloped"], ["unsure", "Not sure"]] },
  { key: "roofSurface", label: "What does the roof surface look like?", options: [["dark", "Dark (tar, gravel, dark membrane)"], ["reflective", "Already white or reflective"], ["unsure", "Not sure"]] },
  { key: "insulation", label: "How is the ceiling or roof insulation?", options: [["poor", "Thin, old, or missing"], ["ok", "Recently upgraded"], ["unsure", "Not sure"]] },
  { key: "windows", label: "What are the windows like?", options: [["single", "Single-pane"], ["unshaded", "Double-pane but sun-exposed, no film"], ["efficient", "Efficient, already filmed or shaded"], ["unsure", "Not sure"]] },
];

const CommercialEnergyPlan = () => {
  const [data, setData] = useState<Partial<CommercialPlanData>>({});
  const [roof, setRoof] = useState("");
  const [win, setWin] = useState("");
  const [cards, setCards] = useState<ReturnType<typeof buildCommercialCards> | null>(null);

  useSeo({
    title: "Commercial Clean Energy Plan | Austin",
    description: "Answer a few questions about your commercial building to see which Austin Energy property improvement rebates fit — insulation, reflective roofs, and windows.",
  });

  const complete = QUESTIONS.every(q => data[q.key]);
  const submit = () => {
    setCards(buildCommercialCards({ ...(data as CommercialPlanData), roofSqFt: Number(roof) || undefined, windowSqFt: Number(win) || undefined }));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={cards ? "Your Building's Recommendations" : "Commercial Clean Energy Plan"}
        subtitle={cards
          ? "Based on your answers, here are the Austin Energy property improvement rebates that fit your building."
          : "A few questions about your commercial building to find the Austin Energy rebates that fit."}
      />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {cards ? (
          <>
            <RecommendationCards cards={cards} />
            <p className="text-xs text-muted-foreground mt-4">
              Rebate rates from Austin Energy's commercial Property Improvements page (reviewed 02/18/2026). Estimates are
              rate × the area you entered; final amounts, caps, and eligibility are set by Austin Energy.
            </p>
            <Button variant="outline" onClick={() => setCards(null)} className="mt-6 w-full">
              <RotateCcw className="mr-2 h-4 w-4" /> Start over
            </Button>
          </>
        ) : (
          <Card><CardContent className="pt-6 space-y-6">
            {QUESTIONS.map(q => (
              <div key={q.key} className="space-y-2">
                <Label className="text-base font-semibold">{q.label}</Label>
                <RadioGroup value={(data[q.key] as string) ?? ""} onValueChange={v => setData(d => ({ ...d, [q.key]: v }))}>
                  {q.options.map(([v, l]) => (
                    <div key={v} className="flex items-center gap-2">
                      <RadioGroupItem value={v} id={`${q.key}-${v}`} />
                      <Label htmlFor={`${q.key}-${v}`} className="font-normal cursor-pointer">{l}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="roof">Roof area, sq ft (optional)</Label>
                <Input id="roof" type="number" min={0} value={roof} onChange={e => setRoof(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="win">Window area, sq ft (optional)</Label>
                <Input id="win" type="number" min={0} value={win} onChange={e => setWin(e.target.value)} />
              </div>
            </div>
            <Button className="w-full" disabled={!complete} onClick={submit}>See my recommendations</Button>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
};

export default CommercialEnergyPlan;
