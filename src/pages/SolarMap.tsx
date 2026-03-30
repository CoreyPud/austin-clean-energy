import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

const SolarMap = () => {
  useSeo({
    title: "Austin's Decarb Dashboard",
    description: "Explore Austin Energy's path to net-zero generation by 2035. Interactive dashboard simulating solar, wind, storage, and demand response scenarios.",
  });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Home
          </Button>
          <div className="h-5 w-px bg-border" />
          <h1 className="text-lg font-semibold text-foreground">Austin's 2035 Zero Emissions Energy Simulator</h1>
        </div>
        <a
          href="https://solar-austin.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Open Full Dashboard
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </header>



      {/* Iframe */}
      <div className="flex-1">
        <iframe
          src="https://solar-austin.netlify.app/"
          title="Austin's Decarb Dashboard – Simulate net zero generation by 2035"
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 57px)" }}
          allow="geolocation"
        />
      </div>
    </div>
  );
};

export default SolarMap;
