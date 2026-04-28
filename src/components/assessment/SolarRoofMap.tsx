import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadGoogleMapsScript } from "@/lib/google-maps-loader";
import { Loader2, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  center: [number, number]; // [lng, lat]
  solarInsights: {
    maxPanels: number;
    panelCapacityWatts: number;
    annualProductionKwh: number;
    sunshineHours: number;
  } | null;
}

const SolarRoofMap = ({ center, solarInsights }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const gmapRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading-key" | "loading-map" | "ready" | "error">("loading-key");

  const [lng, lat] = center;

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-maps-config");
        if (error || !data?.apiKey) throw new Error("Maps API key unavailable");
        if (cancelled) return;

        setStatus("loading-map");

        loadGoogleMapsScript(data.apiKey, () => {
          if (cancelled || !mapRef.current) return;

          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat, lng },
            zoom: 20,
            mapTypeId: "satellite",
            tilt: 0,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "cooperative",
          });

          new window.google.maps.Marker({
            position: { lat, lng },
            map,
            title: "Your property",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#ef4444",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

          gmapRef.current = map;
          setStatus("ready");
        });
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    init();
    return () => { cancelled = true; };
  }, [lat, lng]);

  const maxKw = solarInsights
    ? Math.round((solarInsights.maxPanels * solarInsights.panelCapacityWatts) / 100) / 10
    : null;

  return (
    <div className="relative h-[340px] w-full bg-muted rounded-b-lg overflow-hidden">
      {/* Google Maps container — always in DOM so map can initialize into it */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Loading overlays */}
      {status === "loading-key" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Loading map…</span>
          </div>
        </div>
      )}

      {status === "loading-map" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Initializing satellite view…</span>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center text-muted-foreground px-6">
            <Sun className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Solar roof map not available yet</p>
            <p className="text-xs mt-1 opacity-70">
              Requires Google Maps API — will activate once edge functions are deployed.
            </p>
          </div>
        </div>
      )}

      {/* Stats badge overlay — shown once map is ready */}
      {status === "ready" && solarInsights && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <Badge className="bg-black/70 text-white border-0 text-xs backdrop-blur-sm">
            <Sun className="h-3 w-3 mr-1 text-yellow-400" />
            {solarInsights.sunshineHours?.toLocaleString()} sunshine hrs/yr
          </Badge>
          {maxKw && (
            <Badge className="bg-black/70 text-white border-0 text-xs backdrop-blur-sm">
              ⚡ {maxKw} kW max roof capacity
            </Badge>
          )}
          <Badge className="bg-black/70 text-white border-0 text-xs backdrop-blur-sm">
            🔲 {solarInsights.maxPanels} panels max
          </Badge>
        </div>
      )}

      {/* Flux overlay placeholder — shown once map is ready */}
      {status === "ready" && (
        <div className="absolute bottom-3 right-3 z-10">
          <Badge variant="outline" className="bg-black/60 text-white border-white/20 text-xs backdrop-blur-sm">
            Solar flux overlay — coming soon
          </Badge>
        </div>
      )}
    </div>
  );
};

export default SolarRoofMap;
