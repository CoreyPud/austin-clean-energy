import { useEffect, useState } from "react";
import { X, Sun, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getGoogleMapsApiKey } from "@/lib/google-maps-loader";
import { TYPE_LABEL, TYPE_COLOR } from "@/lib/property-solar";

interface PreviewData {
  pid: string;
  situs_address: string | null;
  situs_zip: string | null;
  property_type: string | null;
  year_built: number | null;
  market_value: number | null;
  has_solar: boolean | null;
  centroid_lat: number | null;
  centroid_lon: number | null;
  solar_panels_layout: { ref: [number, number]; p: number[][] } | null;
}

interface Props {
  pid: string;
  onOpen: () => void;
  onClose: () => void;
}

const IMG_W = 288;
const IMG_H = 160;
// Static Maps URLs have an ~8KB practical limit; capping keeps a large commercial roof's
// panel count from ever blowing that out. Card is a thumbnail, not the precise panel layout
// (that's the full page's job) -- a representative scatter is enough here.
const MAX_PANEL_MARKERS = 200;

const fmtValue = (n: number | null) =>
  n == null ? null : `$${Math.round(n).toLocaleString()}`;

function buildSatelliteUrl(apiKey: string, lat: number, lon: number, layout: PreviewData["solar_panels_layout"]) {
  const params = new URLSearchParams({
    center: `${lat},${lon}`,
    zoom: "20",
    size: `${IMG_W}x${IMG_H}`,
    maptype: "satellite",
    key: apiKey,
  });
  let url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;

  if (layout?.ref && layout.p?.length) {
    const [refLat, refLon] = layout.ref;
    const coords = layout.p
      .slice(0, MAX_PANEL_MARKERS)
      .map(([dLat, dLon]) => `${(refLat + dLat / 1e6).toFixed(6)},${(refLon + dLon / 1e6).toFixed(6)}`)
      .join("|");
    url += `&markers=${encodeURIComponent(`size:tiny|color:0xfacc15|${coords}`)}`;
  }
  return url;
}

export default function PropertyPreviewCard({ pid, onOpen, onClose }: Props) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setImageUrl(null);
    supabase
      .from("tcad_properties")
      .select("pid, situs_address, situs_zip, property_type, year_built, market_value, has_solar, centroid_lat, centroid_lon, solar_panels_layout")
      .eq("pid", pid)
      .maybeSingle()
      .then(({ data: row }) => {
        if (cancelled) return;
        setData(row as PreviewData | null);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [pid]);

  useEffect(() => {
    if (!data?.centroid_lat || !data?.centroid_lon) return;
    let cancelled = false;
    getGoogleMapsApiKey()
      .then((apiKey) => {
        if (cancelled) return;
        setImageUrl(buildSatelliteUrl(apiKey, data.centroid_lat!, data.centroid_lon!, data.solar_panels_layout));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [data?.centroid_lat, data?.centroid_lon, data?.solar_panels_layout]);

  const typeKey = data?.property_type ?? "other";
  const typeColor = TYPE_COLOR[typeKey] ?? TYPE_COLOR.other;
  const typeLabel = TYPE_LABEL[typeKey] ?? TYPE_LABEL.other;

  return (
    <div className="relative w-72">
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md border border-border text-muted-foreground hover:text-foreground"
        aria-label="Close"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div
        onClick={onOpen}
        className="cursor-pointer rounded-xl bg-white shadow-xl border border-border overflow-hidden hover:shadow-2xl transition-shadow"
      >
        {loading ? (
          <div className="p-4 space-y-2 animate-pulse">
            <div className="h-4 w-1/2 bg-muted rounded" />
            <div className="h-5 w-3/4 bg-muted rounded" />
            <div className="h-3 w-2/3 bg-muted rounded" />
          </div>
        ) : !data ? (
          <div className="p-4 text-sm text-muted-foreground">Property not found</div>
        ) : (
          <>
            <div className="relative bg-muted" style={{ height: IMG_H }}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={data.situs_address ?? "Property satellite view"}
                  width={IMG_W}
                  height={IMG_H}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Sun className="h-6 w-6 opacity-30" />
                </div>
              )}
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: typeColor }}
                >
                  {typeLabel}
                </span>
                {data.has_solar && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Sun className="h-3 w-3" /> Solar installed
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold text-foreground leading-snug">
                {data.situs_address ?? "Address unavailable"}
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-x-2 flex-wrap">
                {data.situs_zip && <span>{data.situs_zip}</span>}
                {data.year_built && <span>Built {data.year_built}</span>}
                {fmtValue(data.market_value) && <span>{fmtValue(data.market_value)} value</span>}
              </div>

              <div className="pt-1 flex items-center justify-between text-xs font-medium text-primary">
                <span>View solar assessment</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 h-3 w-3 rotate-45 bg-white border-r border-b border-border" />
    </div>
  );
}
