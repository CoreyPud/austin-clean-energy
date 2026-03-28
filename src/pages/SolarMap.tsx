import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";

const SolarMap = () => {
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
          <h1 className="text-lg font-semibold text-foreground">Austin Decarb Dashboard</h1>
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

      {/* Intro */}
      <div className="bg-muted/50 border-b border-border px-6 py-4 max-w-4xl mx-auto w-full">
        <p className="text-sm text-muted-foreground leading-relaxed">
          This interactive dashboard lets you explore different scenarios for Austin Energy's 10-year resource plan to reach net-zero generation by 2035. Adjust assumptions around solar, wind, storage, and demand response to see how various options compare on cost, reliability, and emissions.
        </p>
      </div>

      {/* Iframe */}
      <div className="flex-1">
        <iframe
          src="https://solar-austin.netlify.app/"
          title="Austin Decarb Dashboard – Simulate net zero generation by 2035"
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 57px)" }}
          allow="geolocation"
        />
      </div>
    </div>
  );
};

export default SolarMap;
