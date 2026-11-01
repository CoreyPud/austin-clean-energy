import { Link } from "react-router-dom";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSharedProject } from "@/lib/shared-project";
import { solarForms } from "../../../supabase/functions/_shared/rebate-form-model";

export function SolarDocumentsBar() {
  const { project } = useSharedProject();
  return (
    <nav aria-label="Austin Energy paperwork" className="no-print flex flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-2 sm:px-6">
      <Dialog>
        <DialogTrigger asChild><Button variant="outline" size="sm"><FileText /> Austin Energy Documents</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Austin Energy solar documents</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {Object.values(solarForms).map(form => <Button key={form.url} asChild variant="outline" className="h-auto w-full justify-between whitespace-normal py-3 text-left"><a href={form.url} target="_blank" rel="noopener noreferrer">{form.label}<ExternalLink className="shrink-0" /></a></Button>)}
          </div>
          <p className="text-sm text-muted-foreground">Official Austin Energy forms. Confirm the current packet, eligibility and signatures with Austin Energy; the private application export is a worksheet, not a submitted or signed form.</p>
        </DialogContent>
      </Dialog>
      <Button asChild variant="outline" size="sm"><Link to={`/rebate-applications${project.savedId ? `?saved=${encodeURIComponent(project.savedId)}` : ""}`} state={{ solarDesign: { service_address: project.address, system_kw_dc: project.systemSizeKw, ...(project.costPerW != null ? { installed_cost: project.systemSizeKw * project.costPerW * 1000 } : {}) } }}>Prepare rebate application</Link></Button>
    </nav>
  );
}