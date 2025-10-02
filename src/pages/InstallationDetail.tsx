import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Zap, Calendar, Building } from "lucide-react";

const InstallationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-3 text-foreground">Installation Details</h1>
            <p className="text-lg text-muted-foreground">
              Detailed information about installation {id}
            </p>
          </div>

          <Card className="shadow-lg border-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5 text-primary" />
                Solar Installation Information
              </CardTitle>
              <CardDescription>
                Complete data from Austin's public records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <MapPin className="h-5 w-5 text-accent mr-2" />
                    <span className="font-semibold">Location</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Installation location details</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Zap className="h-5 w-5 text-primary mr-2" />
                    <span className="font-semibold">System Capacity</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Solar system specifications</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-secondary mr-2" />
                    <span className="font-semibold">Installation Date</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Project timeline information</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Building className="h-5 w-5 text-accent mr-2" />
                    <span className="font-semibold">Program Type</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Austin Energy program details</p>
                </div>
              </div>

              <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-semibold mb-2">About This Installation</h3>
                <p className="text-sm text-muted-foreground">
                  This installation is part of Austin Energy's clean energy initiatives. 
                  For complete details and similar opportunities in your area, explore the Area Analysis tool.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InstallationDetail;
