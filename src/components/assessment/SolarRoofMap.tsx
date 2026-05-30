import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadGoogleMapsScript } from "@/lib/google-maps-loader";
import { Loader2, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fromArrayBuffer } from "geotiff";
import proj4 from "proj4";

interface Props {
  center: [number, number]; // [lng, lat]
  solarInsights: {
    maxPanels: number;
    panelCapacityWatts: number;
    annualProductionKwh: number;
    sunshineHours: number;
    roofAreaM2?: number | null;
  } | null;
}

const IRON_PALETTE = ["00000A", "91009C", "E64616", "FEB400", "FFFFF6"];

function utmProj4ForLng(lng: number): string {
  const zone = Math.floor((lng + 180) / 6) + 1;
  return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`;
}

function paletteColor(value: number) {
  const stops = IRON_PALETTE.map((hex) => ({
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  }));
  const n = stops.length - 1;
  const scaled = Math.max(0, Math.min(1, value)) * n;
  const lo = Math.floor(scaled);
  const hi = Math.min(n, lo + 1);
  const t = scaled - lo;
  return {
    r: Math.round(stops[lo].r + t * (stops[hi].r - stops[lo].r)),
    g: Math.round(stops[lo].g + t * (stops[hi].g - stops[lo].g)),
    b: Math.round(stops[lo].b + t * (stops[hi].b - stops[lo].b)),
  };
}

function renderSingleBand(band: ArrayLike<number>, width: number, height: number, fixedMin: number, fixedMax: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(width, height);
  const range = (fixedMax - fixedMin) || 1;
  for (let i = 0; i < band.length; i++) {
    const color = paletteColor(((band[i] as number) - fixedMin) / range);
    const px = i * 4;
    imgData.data[px] = color.r;
    imgData.data[px + 1] = color.g;
    imgData.data[px + 2] = color.b;
    imgData.data[px + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function renderRgb(rasters: ArrayLike<number>[], width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(width, height);
  const [r, g, b] = rasters;
  for (let i = 0; i < r.length; i++) {
    const px = i * 4;
    imgData.data[px] = r[i] as number;
    imgData.data[px + 1] = g[i] as number;
    imgData.data[px + 2] = b[i] as number;
    imgData.data[px + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function renderMaskBand(band: ArrayLike<number>, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(width, height);
  for (let i = 0; i < band.length; i++) {
    const px = i * 4;
    imgData.data[px] = 255;
    imgData.data[px + 1] = 255;
    imgData.data[px + 2] = 255;
    imgData.data[px + 3] = (band[i] as number) > 0 ? 255 : 0;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function applyMask(fluxCanvas: HTMLCanvasElement, maskCanvas: HTMLCanvasElement): void {
  const w = fluxCanvas.width;
  const h = fluxCanvas.height;
  const scaled = document.createElement("canvas");
  scaled.width = w;
  scaled.height = h;
  const sCtx = scaled.getContext("2d")!;
  sCtx.drawImage(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height, 0, 0, w, h);
  const fluxCtx = fluxCanvas.getContext("2d")!;
  const fluxData = fluxCtx.getImageData(0, 0, w, h);
  const maskData = sCtx.getImageData(0, 0, w, h);
  for (let i = 0; i < fluxData.data.length; i += 4) {
    fluxData.data[i + 3] = maskData.data[i];
  }
  fluxCtx.putImageData(fluxData, 0, 0);
}

async function fetchGeoTiff(url: string) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`GeoTIFF fetch failed: ${resp.status}`);
  const buf = await resp.arrayBuffer();
  const tiff = await fromArrayBuffer(buf);
  const image = await tiff.getImage();
  const rasters = await image.readRasters() as ArrayLike<number>[];
  return {
    rasters,
    bbox: image.getBoundingBox(),
    geoKeys: image.getGeoKeys() as Record<string, number>,
    width: image.getWidth(),
    height: image.getHeight(),
  };
}

function bboxToLatLngBounds(bbox: number[], lng: number, geoKeys: Record<string, number>): google.maps.LatLngBounds {
  const modelType = geoKeys?.GTModelTypeGeoKey;
  if (modelType === 2) {
    return new google.maps.LatLngBounds(
      new google.maps.LatLng(bbox[1], bbox[0]),
      new google.maps.LatLng(bbox[3], bbox[2]),
    );
  }
  const proj4str = utmProj4ForLng(lng);
  const sw = proj4(proj4str, "EPSG:4326", [bbox[0], bbox[1]]) as [number, number];
  const ne = proj4(proj4str, "EPSG:4326", [bbox[2], bbox[3]]) as [number, number];
  return new google.maps.LatLngBounds(
    new google.maps.LatLng(sw[1], sw[0]),
    new google.maps.LatLng(ne[1], ne[0]),
  );
}

const SolarRoofMap = ({ center, solarInsights }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const gmapRef = useRef<google.maps.Map | null>(null);
  const overlayRefs = useRef<google.maps.GroundOverlay[]>([]);
  const apiKeyRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  const [status, setStatus] = useState<"loading-key" | "loading-map" | "ready" | "error">("loading-key");
  const [overlayLoading, setOverlayLoading] = useState(false);

  const [lng, lat] = center;

  const maxKw = solarInsights
    ? Math.round((solarInsights.maxPanels * solarInsights.panelCapacityWatts) / 100) / 10
    : null;

  useEffect(() => {
    cancelledRef.current = false;

    const init = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-maps-config");
        if (error || !data?.apiKey) throw new Error("Maps API key unavailable");
        if (cancelledRef.current) return;

        apiKeyRef.current = data.apiKey;
        setStatus("loading-map");

        loadGoogleMapsScript(data.apiKey, () => {
          if (cancelledRef.current || !mapRef.current) return;

          // Dynamic zoom based on roof area
          const roofAreaM2 = solarInsights?.roofAreaM2 ?? 0;
          const roofDiagonal = roofAreaM2 > 0 ? Math.sqrt(roofAreaM2) * 1.41 : 20;
          const targetVisibleMeters = Math.max(50, Math.min(130, roofDiagonal * 3));
          const mapPx = mapRef.current.offsetWidth || 500;
          const rawZoom = Math.log2((156543 * Math.cos((lat * Math.PI) / 180) * mapPx) / targetVisibleMeters);
          const zoom = Math.max(17, Math.min(21, Math.round(rawZoom)));

          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat, lng },
            zoom,
            mapTypeId: "satellite",
            tilt: 0,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "cooperative",
          });

          gmapRef.current = map;
          setStatus("ready");

          // Load solar flux overlay
          const apiKey = apiKeyRef.current!;
          setOverlayLoading(true);
          loadFluxOverlay(map, lat, lng, apiKey, overlayRefs, cancelledRef).finally(() => {
            if (!cancelledRef.current) setOverlayLoading(false);
          });
        });
      } catch {
        if (!cancelledRef.current) setStatus("error");
      }
    };

    init();
    return () => {
      cancelledRef.current = true;
      overlayRefs.current.forEach((o) => o.setMap(null));
      overlayRefs.current = [];
    };
  }, [lat, lng]);

  return (
    <div className="relative h-[480px] w-full bg-muted rounded-b-lg overflow-hidden">
      <div ref={mapRef} className="absolute inset-0" />

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
            <p className="text-sm font-medium">Solar roof map unavailable</p>
            <p className="text-xs mt-1 opacity-70">Requires Google Maps API.</p>
          </div>
        </div>
      )}

      {status === "ready" && solarInsights && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-black/70 text-white border-0 text-xs backdrop-blur-sm">
            <Sun className="h-3 w-3 mr-1 text-yellow-400" />
            {solarInsights.sunshineHours?.toLocaleString()} sunshine hours/year
          </Badge>
        </div>
      )}

      {status === "ready" && overlayLoading && (
        <div className="absolute bottom-3 right-3 z-10">
          <Badge variant="outline" className="bg-black/60 text-white border-white/20 text-xs backdrop-blur-sm">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Loading solar flux…
          </Badge>
        </div>
      )}
    </div>
  );
};

async function loadFluxOverlay(
  map: google.maps.Map,
  lat: number,
  lng: number,
  apiKey: string,
  overlayRefs: React.MutableRefObject<google.maps.GroundOverlay[]>,
  cancelledRef: React.MutableRefObject<boolean>,
): Promise<void> {
  try {
    const layerUrl = new URL("https://solar.googleapis.com/v1/dataLayers:get");
    layerUrl.searchParams.set("location.latitude", String(lat));
    layerUrl.searchParams.set("location.longitude", String(lng));
    layerUrl.searchParams.set("radiusMeters", "100");
    layerUrl.searchParams.set("view", "IMAGERY_AND_ANNUAL_FLUX_LAYERS");
    layerUrl.searchParams.set("requiredQuality", "HIGH");
    layerUrl.searchParams.set("pixelSizeMeters", "0.25");
    layerUrl.searchParams.set("key", apiKey);

    const resp = await fetch(layerUrl.toString());
    if (!resp.ok || cancelledRef.current) return;
    const layers = await resp.json();
    if (!layers.rgbUrl || !layers.annualFluxUrl || !layers.maskUrl) return;

    const addKey = (rawUrl: string) => {
      const u = new URL(rawUrl);
      u.searchParams.set("key", apiKey);
      return u.toString();
    };

    const [rgbData, fluxData, maskData] = await Promise.all([
      fetchGeoTiff(addKey(layers.rgbUrl)),
      fetchGeoTiff(addKey(layers.annualFluxUrl)),
      fetchGeoTiff(addKey(layers.maskUrl)),
    ]);

    if (cancelledRef.current) return;

    // RGB base layer
    const rgbCanvas = renderRgb(rgbData.rasters, rgbData.width, rgbData.height);
    const rgbBounds = bboxToLatLngBounds(rgbData.bbox, lng, rgbData.geoKeys);
    const rgbOverlay = new google.maps.GroundOverlay(rgbCanvas.toDataURL(), rgbBounds, { opacity: 1.0 });
    rgbOverlay.setMap(map);
    overlayRefs.current.push(rgbOverlay);

    // Annual flux — iron palette, masked to roof pixels
    const fluxCanvas = renderSingleBand(fluxData.rasters[0], fluxData.width, fluxData.height, 0, 1800);
    const maskCanvas = renderMaskBand(maskData.rasters[0], maskData.width, maskData.height);
    applyMask(fluxCanvas, maskCanvas);
    const fluxBounds = bboxToLatLngBounds(fluxData.bbox, lng, fluxData.geoKeys);
    const fluxOverlay = new google.maps.GroundOverlay(fluxCanvas.toDataURL(), fluxBounds, { opacity: 0.8 });
    fluxOverlay.setMap(map);
    overlayRefs.current.push(fluxOverlay);
  } catch (err) {
    console.error("Solar flux overlay error:", err);
  }
}

export default SolarRoofMap;
