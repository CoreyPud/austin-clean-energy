import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export interface LifestyleData {
  housingStatus: string;
  homeType: string;
  currentEnergy: string;
  transportation: string;
  commuteType: string;
  interests: string[];
}

interface LifestyleAssessmentFormProps {
  onSubmit: (data: LifestyleData) => void;
  loading?: boolean;
}

const LifestyleAssessmentForm = ({ onSubmit, loading = false }: LifestyleAssessmentFormProps) => {
  const [housingStatus, setHousingStatus] = useState("");
  const [homeType, setHomeType] = useState("");
  const [currentEnergy, setCurrentEnergy] = useState("");
  const [transportation, setTransportation] = useState("");
  const [commuteType, setCommuteType] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      housingStatus,
      homeType,
      currentEnergy,
      transportation,
      commuteType,
      interests
    });
  };

  const isFormValid = housingStatus && homeType && currentEnergy && transportation && commuteType && interests.length > 0;

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <CardTitle>Quick Lifestyle Assessment</CardTitle>
        <CardDescription>
          Answer a few questions (1-2 mins) to get personalized recommendations based on the highest-impact climate actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Housing Status */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Do you own or rent your home?</Label>
            <RadioGroup value={housingStatus} onValueChange={setHousingStatus}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="own" id="own" />
                <Label htmlFor="own" className="font-normal cursor-pointer">I own my home</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rent" id="rent" />
                <Label htmlFor="rent" className="font-normal cursor-pointer">I rent</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Home Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">What type of home do you live in?</Label>
            <RadioGroup value={homeType} onValueChange={setHomeType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single-family" id="single-family" />
                <Label htmlFor="single-family" className="font-normal cursor-pointer">Single-family house</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="condo-townhouse" id="condo-townhouse" />
                <Label htmlFor="condo-townhouse" className="font-normal cursor-pointer">Condo or townhouse</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="apartment" id="apartment" />
                <Label htmlFor="apartment" className="font-normal cursor-pointer">Apartment</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Current Energy */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Current home energy setup?</Label>
            <RadioGroup value={currentEnergy} onValueChange={setCurrentEnergy}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="solar-existing" id="solar-existing" />
                <Label htmlFor="solar-existing" className="font-normal cursor-pointer">Already have solar panels</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grid-only" id="grid-only" />
                <Label htmlFor="grid-only" className="font-normal cursor-pointer">Grid power only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="green-power" id="green-power" />
                <Label htmlFor="green-power" className="font-normal cursor-pointer">Enrolled in green power program</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Transportation */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Primary transportation?</Label>
            <RadioGroup value={transportation} onValueChange={setTransportation}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gas-car" id="gas-car" />
                <Label htmlFor="gas-car" className="font-normal cursor-pointer">Gas-powered car</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ev" id="ev" />
                <Label htmlFor="ev" className="font-normal cursor-pointer">Electric vehicle (EV)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hybrid" id="hybrid" />
                <Label htmlFor="hybrid" className="font-normal cursor-pointer">Hybrid vehicle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no-car" id="no-car" />
                <Label htmlFor="no-car" className="font-normal cursor-pointer">No car / bike / transit</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Commute Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">How do you typically commute?</Label>
            <RadioGroup value={commuteType} onValueChange={setCommuteType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="drive-alone" id="drive-alone" />
                <Label htmlFor="drive-alone" className="font-normal cursor-pointer">Drive alone</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="carpool" id="carpool" />
                <Label htmlFor="carpool" className="font-normal cursor-pointer">Carpool</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bike-walk-transit" id="bike-walk-transit" />
                <Label htmlFor="bike-walk-transit" className="font-normal cursor-pointer">Bike / walk / public transit</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remote" id="remote" />
                <Label htmlFor="remote" className="font-normal cursor-pointer">Work from home</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">What interests you most? (Select all that apply)</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="interest-ev"
                  checked={interests.includes("ev")}
                  onCheckedChange={() => handleInterestToggle("ev")}
                />
                <Label htmlFor="interest-ev" className="font-normal cursor-pointer">
                  Getting an electric vehicle
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="interest-solar"
                  checked={interests.includes("solar")}
                  onCheckedChange={() => handleInterestToggle("solar")}
                />
                <Label htmlFor="interest-solar" className="font-normal cursor-pointer">
                  Installing solar panels
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="interest-efficiency"
                  checked={interests.includes("efficiency")}
                  onCheckedChange={() => handleInterestToggle("efficiency")}
                />
                <Label htmlFor="interest-efficiency" className="font-normal cursor-pointer">
                  Home energy efficiency upgrades
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="interest-electrification"
                  checked={interests.includes("electrification")}
                  onCheckedChange={() => handleInterestToggle("electrification")}
                />
                <Label htmlFor="interest-electrification" className="font-normal cursor-pointer">
                  Electrifying appliances (heat pumps, induction stoves)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="interest-transit"
                  checked={interests.includes("transit")}
                  onCheckedChange={() => handleInterestToggle("transit")}
                />
                <Label htmlFor="interest-transit" className="font-normal cursor-pointer">
                  Biking / walking / public transit options
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="interest-organizing"
                  checked={interests.includes("organizing")}
                  onCheckedChange={() => handleInterestToggle("organizing")}
                />
                <Label htmlFor="interest-organizing" className="font-normal cursor-pointer">
                  Community organizing and advocacy
                </Label>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90"
            size="lg"
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Personalized Recommendations...
              </>
            ) : (
              "Get My Personalized Recommendations"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LifestyleAssessmentForm;