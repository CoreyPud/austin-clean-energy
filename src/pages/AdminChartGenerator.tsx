import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ChartGenerator } from "@/components/chart-generator/ChartGenerator";

// Internal, admin-gated chart generator: prompt -> LLM picks one of the
// stats_* views -> real rows -> Chart.js spec. See
// supabase/functions/chart-generator/index.ts. Same session-token gate as
// the rest of /admin (AdminDashboard, PIRImport, CouncilVote admin mode).
export default function AdminChartGenerator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    const expires = sessionStorage.getItem("admin_token_expires");

    if (!token || !expires) {
      navigate("/admin");
      return;
    }
    if (new Date(expires) < new Date()) {
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_token_expires");
      toast.error("Session expired. Please login again.");
      navigate("/admin");
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto mb-4 flex max-w-7xl items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
        </Button>
        <h1 className="text-sm font-semibold text-muted-foreground">Chart Generator (internal)</h1>
      </div>
      <ChartGenerator />
    </div>
  );
}
