import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Zap, Calendar, Building, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const InstallationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [installation, setInstallation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstallationDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('installation-detail', {
          body: { id }
        });

        if (error) throw error;

        if (data.installation) {
          setInstallation(data.installation);
        } else {
          toast({
            title: "Installation not found",
            description: "Could not find details for this installation.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching installation details:', error);
        toast({
          title: "Error",
          description: "Failed to load installation details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInstallationDetails();
    }
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!installation) {
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
          <Card className="max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Installation not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const address = installation.service_address || installation.address || 'Address not available';
  const capacity = installation.system_size_kw ? `${installation.system_size_kw} kW` : installation.capacity || 'Not specified';
  const programType = installation.program_type || 'Austin Energy Program';
  const installDate = installation.installation_date || installation.date_completed || installation.install_date;
  const projectName = installation.project_name || address.split(',')[0];

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
            <h1 className="text-4xl font-bold mb-3 text-foreground">{projectName}</h1>
            <p className="text-lg text-muted-foreground">
              Complete installation details from Austin's public records
            </p>
          </div>

          <Card className="shadow-lg border-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5 text-primary" />
                Solar Installation Information
              </CardTitle>
              <CardDescription>
                Verified data from Austin Energy programs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <MapPin className="h-5 w-5 text-accent mr-2" />
                    <span className="font-semibold">Location</span>
                  </div>
                  <p className="text-sm text-foreground">{address}</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Zap className="h-5 w-5 text-primary mr-2" />
                    <span className="font-semibold">System Capacity</span>
                  </div>
                  <p className="text-sm text-foreground">{capacity}</p>
                </div>

                {installDate && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-secondary mr-2" />
                      <span className="font-semibold">Installation Date</span>
                    </div>
                    <p className="text-sm text-foreground">
                      {new Date(installDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Building className="h-5 w-5 text-accent mr-2" />
                    <span className="font-semibold">Program Type</span>
                  </div>
                  <p className="text-sm text-foreground">{programType}</p>
                </div>
              </div>

              {installation.application_id && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <span className="font-semibold text-sm">Application ID: </span>
                  <span className="text-sm text-muted-foreground">{installation.application_id}</span>
                </div>
              )}

              <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-semibold mb-2">About This Installation</h3>
                <p className="text-sm text-muted-foreground">
                  This installation is part of Austin Energy's clean energy initiatives. 
                  The data shown here comes from publicly available city records and demonstrates 
                  the growing adoption of solar energy in the Austin area.
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
