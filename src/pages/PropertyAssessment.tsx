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
import Map from "@/components/Map";
import MapTokenLoader from "@/components/MapTokenLoader";

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
              <MapTokenLoader>
                <Card className="border-2 border-primary/20 overflow-hidden">
                  <CardHeader>
                    <CardTitle>Property Location</CardTitle>
                    <CardDescription>Nearby solar installations and energy programs</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Map 
                      center={[-97.7431, 30.2672]}
                      zoom={13}
                      markers={results.locations || []}
                      className="h-[400px]"
                      onMarkerClick={(id) => window.open(`/installation/${id}`, '_blank')}
                    />
                  </CardContent>
                </Card>
              </MapTokenLoader>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Property Assessment</CardTitle>
                  <CardDescription>
                    For {results.address} - Analysis based on {results.dataPoints?.citySolarInstallations || 0} city solar installations, {results.dataPoints?.cityEnergyAudits || 0} energy audits, and {results.dataPoints?.cityGreenBuildings || 0} green buildings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-foreground leading-relaxed">
                    {results.assessment.split('\n\n').map((paragraph: string, idx: number) => (
                      <p key={idx} className="text-sm">{paragraph}</p>
                    ))}
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
