import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Zap, Calendar, Building, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InstallationDetailModalProps {
  installationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InstallationDetailModal = ({ installationId, open, onOpenChange }: InstallationDetailModalProps) => {
  const { toast } = useToast();
  const [installation, setInstallation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInstallationDetails = async () => {
      if (!installationId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('installation-detail', {
          body: { id: installationId }
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
          onOpenChange(false);
        }
      } catch (error) {
        console.error('Error fetching installation details:', error);
        toast({
          title: "Error",
          description: "Failed to load installation details.",
          variant: "destructive",
        });
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    };

    if (open && installationId) {
      fetchInstallationDetails();
    }
  }, [installationId, open, toast, onOpenChange]);

  const address = installation?.service_address || installation?.address || installation?.original_address_1 || 'Address not available';
  const capacity = installation?.system_size_kw 
    ? `${installation.system_size_kw} kW` 
    : (installation?.solar_panel_capacity_output_dc_watts 
      ? `${(installation.solar_panel_capacity_output_dc_watts / 1000).toFixed(1)} kW`
      : installation?.capacity || 'Not specified');
  const programType = installation?.program_type || installation?.work_class || 'Austin Energy Program';
  const installDate = installation?.installation_date || installation?.completed_date || installation?.issued_date || installation?.date_completed || installation?.install_date;
  const projectName = installation?.project_name || address.split(',')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <Building className="mr-2 h-6 w-6 text-primary" />
            {loading ? "Loading..." : projectName}
          </DialogTitle>
          <DialogDescription>
            Verified data from Austin Energy programs
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : installation ? (
          <div className="space-y-6">
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

            {(installation.application_id || installation.permit_number) && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <span className="font-semibold text-sm">
                  {installation.permit_number ? 'Permit Number: ' : 'Application ID: '}
                </span>
                <span className="text-sm text-muted-foreground">
                  {installation.permit_number || installation.application_id}
                </span>
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
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
