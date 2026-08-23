import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SatellitePane, { type SolarPanel } from "@/components/SatellitePane";
import MapTokenLoader from "@/components/MapTokenLoader";
import { useSolarFilter } from "@/components/SolarFilterPanel";
import NeighborhoodSnapshot from "@/components/assessment/NeighborhoodSnapshot";
import ContactCtaCard from "@/components/assessment/ContactCtaCard";
import SectionHeading from "@/components/assessment/SectionHeading";
import {
  slugifyAddress,
  classifyProperty,
  computeRecommendation,
  fromTcadProperty,
  estimateProductionPerKw,
  getCtaCopy,
  DEFAULT_MONTHLY_BILL,
} from "@/lib/property-solar";
import SolarProgramView, { SolarBillingToggle } from "@/components/assessment/SolarProgramView";
import { formatAssessorAddress } from "@/lib/address-utils";
import { billToMonthlyKwh, SSO_MIN_KW } from "@/lib/solar-model";
import { Slider } from "@/components/ui/slider";

const TYPE_LABEL: Record<string, string> = {
  single_family: "Single Family",
  multifamily:   "Multifamily",
  condo:         "Condo",
  commercial:    "Commercial",
  other:         "Other",
};

const TYPE_COLOR: Record<string, string> = {
  single_family: "#3b82f6",
  multifamily:   "#8b5cf6",
  condo:         "#ec4899",
  commercial:    "#f97316",
  other:         "#6b7280",
};

const fmtKwh = (n: number) => `${Math.round(n).toLocaleString()} kWh`;
// Keep in sync with fetch-property-solar's MAX_AGE_DAYS -- the edge function enforces this
// for real, this is just so the client doesn't invoke it on every view of a fresh property.
const SOLAR_DATA_MAX_AGE_DAYS = 365;


interface PropertyData {
  pid: string;
  situs_address: string | null;
  situs_zip: string | null;
  property_type: string | null;
  year_built: number | null;
  market_value: number | null;
  estimated_roof_sqft: number | null;
  land_type_desc: string | null;
  centroid_lat: number | null;
  centroid_lon: number | null;
  solar_fetched_at: string | null;
  solar_max_panels: number | null;
  solar_panel_capacity_w: number | null;
  solar_sunshine_hrs: number | null;
  solar_sunshine_median: number | null;
  solar_max_area_m2: number | null;
  solar_imagery_quality: string | null;
  solar_imagery_date: string | null;
}

interface NeighborhoodStats {
  installationsInZip: number;
  pendingPermitsInZip: number;
  averageSystemKw: number | null;
  newest: string | null;
}

function useNeighborhoodStats(zip: string | null): NeighborhoodStats | null {
  const [stats, setStats] = useState<NeighborhoodStats | null>(null);
  useEffect(() => {
    if (!zip) return;
    Promise.all([
      supabase
        .from("solar_installations")
        .select("id", { count: "exact", head: true })
        .eq("original_zip", zip),
      supabase
        .from("solar_installations")
        .select("installed_kw, issued_date, completed_date")
        .eq("original_zip", zip)
        .order("completed_date", { ascending: false, nullsFirst: false })
        .limit(1000),
    ]).then(([countResp, dataResp]) => {
      const total = (countResp as any).count ?? 0;
      const rows = (dataResp.data ?? []) as any[];
      const avgKw =
        rows.length > 0
          ? +(rows.reduce((s, r) => s + (parseFloat(r.installed_kw) || 0), 0) / rows.length).toFixed(2)
          : null;
      const newest =
        rows
          .map((r) => r.issued_date || r.completed_date)
          .filter(Boolean)
          .sort()
          .pop() || null;
      setStats({ installationsInZip: total, pendingPermitsInZip: 0, averageSystemKw: avgKw, newest });
    });
  }, [zip]);
  return stats;
}

export default function PropertyPage() {
  const { pid } = useParams<{ pid: string }>();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [monthlyBill, setMonthlyBill] = useState(150);
  const [commercialMonthlyBill, setCommercialMonthlyBill] = useState(DEFAULT_MONTHLY_BILL.commercial);
  // null = follow the default sizing; a number = user has chosen a system size.
  const [systemKwOverride, setSystemKwOverride] = useState<number | null>(null);
  const [costPerWOverride, setCostPerWOverride] = useState<number | null>(null);
  // Only meaningful when ssoEligible; properties too small for SSO always show VoS regardless.
  const [billingMode, setBillingMode] = useState<"sso" | "vos">("sso");
  // undefined = we don't know yet (never checked, or a check is in flight); [] = checked and
  // confirmed no panels; populated = the real layout. SatellitePane renders each distinctly so
  // the marker/loading view doesn't flicker between "unknown" and "confirmed empty".
  const [solarPanels,      setSolarPanels]      = useState<SolarPanel[] | undefined>(undefined);
  const [fetchingSolar,    setFetchingSolar]    = useState(false);
  const [panelDims,        setPanelDims]        = useState<{ h: number; w: number } | null>(null);
  const [segmentAzimuths,  setSegmentAzimuths]  = useState<Record<number, number>>({});
  const [segmentPitches,   setSegmentPitches]   = useState<Record<number, number>>({});


  const loadProperty = async (pid: string) => {
    const [{ data, error }, { data: segs }] = await Promise.all([
      supabase
        .from("tcad_properties")
        .select("pid, situs_address, situs_zip, property_type, year_built, market_value, estimated_roof_sqft, land_type_desc, centroid_lat, centroid_lon, solar_fetched_at, solar_max_panels, solar_panel_capacity_w, solar_sunshine_hrs, solar_sunshine_median, solar_max_area_m2, solar_imagery_quality, solar_imagery_date, solar_panels_layout")
        .eq("pid", pid)
        .single(),
      supabase
        .from("tcad_roof_segments")
        .select("segment_index, azimuth_deg, pitch_deg")
        .eq("pid", pid),
    ]);
    if (error || !data) { setNotFound(true); return; }
    setProperty(data as PropertyData);
    const az: Record<number, number> = {};
    const pt: Record<number, number> = {};
    (segs ?? []).forEach((s: any) => { az[s.segment_index] = s.azimuth_deg; pt[s.segment_index] = s.pitch_deg; });
    setSegmentAzimuths(az);
    setSegmentPitches(pt);
    const layout = (data as any).solar_panels_layout as { ref: [number, number]; p: number[][] } | null;
    if (layout?.p?.length) {
      const [refLat, refLon] = layout.ref;
      setSolarPanels(layout.p.map(([dlat, dlon, o, kwh, si]) => ({
        lat: refLat + dlat / 1e6,
        lon: refLon + dlon / 1e6,
        orientation: o ? "LANDSCAPE" : "PORTRAIT",
        yearlyEnergyDcKwh: kwh,
        segmentIndex: si,
      })));
      setPanelDims({ h: 1.879, w: 1.045 });
    } else if (data.solar_fetched_at) {
      // Checked, confirmed no panels -- distinct from "haven't checked yet" (undefined).
      setSolarPanels([]);
    } else {
      setSolarPanels(undefined);
    }
  };

  useEffect(() => {
    if (!pid) return;
    setLoading(true);
    setSystemKwOverride(null); // a new property starts at its own recommended size
    setBillingMode("sso"); // default to SSO whenever eligible; VoS is a deliberate opt-in
    loadProperty(pid).finally(() => setLoading(false));
  }, [pid]);

  // Never fetched (or fetched over a year ago) Google Solar data for this parcel -- pull it
  // now, same on-demand fetch the calculator already does for arbitrary addresses, just
  // persisted here since it's a known TCAD pid. fetch-property-solar enforces the actual
  // staleness threshold and a global rate limit server-side; this is just the client-side
  // mirror of "is it worth asking" so an up-to-date property doesn't invoke on every view.
  // Re-reads once it lands so panels/charts pick it up.
  useEffect(() => {
    if (!pid || !property) return;
    const fetchedAt = property.solar_fetched_at ? new Date(property.solar_fetched_at).getTime() : null;
    const isStale = fetchedAt == null || Date.now() - fetchedAt > SOLAR_DATA_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (!isStale) return;
    // Only show a loading state for a true first fetch -- a background staleness refresh has
    // perfectly good (if slightly old) data to keep showing while it silently checks for newer.
    const isFirstFetch = fetchedAt == null;
    if (isFirstFetch) setFetchingSolar(true);
    supabase.functions.invoke("fetch-property-solar", { body: { pid } })
      .then(({ data, error }) => {
        if (error || !data?.ok || data.alreadyFetched || data.rateLimited) return;
        return loadProperty(pid);
      })
      .finally(() => { if (isFirstFetch) setFetchingSolar(false); });
  }, [pid, property]);

  const nbStats = useNeighborhoodStats(property?.situs_zip ?? null);

  const solarFilter = useSolarFilter({
    panels:       solarPanels,
    propertyType: property?.property_type,
    azimuths:     segmentAzimuths,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Property not found</p>
        <Link to="/property-viewer" className="text-sm text-primary underline">Browse properties</Link>
      </div>
    );
  }

  const cls      = classifyProperty(property.property_type);
  const isResidential  = cls === "residential";
  const isMultifamily  = cls === "multifamily";
  const isCommercial   = !isResidential && !isMultifamily;

  // Residential sizing tracks the user's bill; commercial (under VoS) tracks its own bill
  // input below; the recommendation reads whichever applies directly.
  const residentialAnnualUsage = billToMonthlyKwh(monthlyBill) * 12;
  const commercialAnnualUsage = billToMonthlyKwh(commercialMonthlyBill) * 12;

  // Size the system off the buildable layout (setbacks, low-TSRF panels and rooftop
  // walkways removed) rather than Google's raw maximum, so every figure downstream
  // (kW, cost, rebate, production, payback, SSO) reflects what can actually be built.
  // Bill and manual override both feed in here so the stat cards stay in sync.
  const buildablePanels = solarFilter.filteredPanelCount ?? property.solar_max_panels;
  const siteInput = fromTcadProperty({ ...property, solar_max_panels: buildablePanels });
  const rec = computeRecommendation(siteInput, {
    annualUsageKwh: isResidential ? residentialAnnualUsage : isCommercial ? commercialAnnualUsage : null,
    systemKwOverride,
    billingMode: isCommercial && billingMode === "sso" ? "sso" : "vos",
    costPerWOverride,
  });
  // The natural default size (no manual override) for the current billing mode -- used only
  // by SolarProgramView's "reset to recommended" comparison link, single-sourced the same way
  // as `rec` but without systemKwOverride.
  const recNatural = computeRecommendation(siteInput, {
    annualUsageKwh: isResidential ? residentialAnnualUsage : isCommercial ? commercialAnnualUsage : null,
    billingMode: isCommercial && billingMode === "sso" ? "sso" : "vos",
  });
  const hasSolar = !!property.solar_fetched_at && property.solar_max_panels != null;
  const address  = formatAssessorAddress(property.situs_address) || `Property ${property.pid}`;
  const typeLabel = TYPE_LABEL[property.property_type ?? ""] ?? "Other";
  const typeColor = TYPE_COLOR[property.property_type ?? ""] ?? "#6b7280";
  const roofSqft  = property.solar_max_area_m2
    ? Math.round(property.solar_max_area_m2 * 10.764)
    : property.estimated_roof_sqft
    ? Math.round(property.estimated_roof_sqft)
    : null;
  const sunshineHrsDisplay = property.solar_sunshine_median != null
    ? `${Math.round(property.solar_sunshine_median).toLocaleString()} hrs/yr`
    : property.solar_sunshine_hrs != null
    ? `${Math.round(property.solar_sunshine_hrs).toLocaleString()} hrs/yr`
    : null;

  // Matches SolarProgramView's own internal ssoEligible formula exactly -- this page's
  // surrounding copy (bill input gating, CTA) needs to agree with what the shared view decides.
  const ssoEligible    = isCommercial && (rec?.maxKw ?? 0) >= SSO_MIN_KW;

  const productionPerKw = estimateProductionPerKw(property.solar_sunshine_hrs);

  // Multifamily has no real bill/usage concept (virtual net metering) -- production is used
  // as a benign proxy purely so downstream charts have a non-zero number to plot against.
  const annualUsageKwh = isResidential
    ? residentialAnnualUsage
    : isCommercial
    ? commercialAnnualUsage
    : (rec?.annualProductionKwh ?? 0);

  const { title: ctaTitle, description: ctaDescription } = getCtaCopy(cls, ssoEligible);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{address}</h1>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full text-white shrink-0"
              style={{ backgroundColor: typeColor }}
            >
              {typeLabel}
            </span>
          </div>
          {property.situs_zip && (
            <p className="text-muted-foreground text-sm">Austin, TX {property.situs_zip}</p>
          )}
        </div>

        {/* Satellite map */}
        {property.centroid_lat != null && property.centroid_lon != null && (
          <div className="relative space-y-3">
            <MapTokenLoader>
              <SatellitePane
                lat={property.centroid_lat}
                lon={property.centroid_lon}
                className="w-full h-[32rem] rounded-lg overflow-hidden border border-border"
                {...solarFilter.paneProps}
                panelHeightM={panelDims?.h}
                panelWidthM={panelDims?.w}
                segmentAzimuths={segmentAzimuths}
                segmentPitches={segmentPitches}
                selectedPanelCount={rec
                  ? Math.round((rec.recommendedKw * 1000) / (property.solar_panel_capacity_w ?? 400))
                  : undefined}
              />
            </MapTokenLoader>
            {fetchingSolar && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 text-white text-xs rounded-full px-3 py-1.5 backdrop-blur-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                Fetching solar data for this roof…
              </div>
            )}
          </div>
        )}

        {/* No solar data states */}
        {!hasSolar && fetchingSolar && (
          <div className="rounded-lg border border-border p-6 text-center space-y-2">
            <p className="font-medium flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching solar data
            </p>
            <p className="text-sm text-muted-foreground">
              Pulling roof and sunshine data for this property from Google Solar.
            </p>
          </div>
        )}
        {!hasSolar && !fetchingSolar && (
          <div className="rounded-lg border border-border p-6 text-center space-y-2">
            <p className="font-medium">No Google Solar data available for this property</p>
            <p className="text-sm text-muted-foreground">
              Google hasn't imaged this roof yet, so we can't estimate solar potential here.
            </p>
          </div>
        )}

        {hasSolar && !rec && (
          <div className="rounded-lg border border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Google Solar found this location but couldn't compute panel placement.
            </p>
          </div>
        )}

        {hasSolar && rec && (
          <>
            <SolarBillingToggle
              rec={rec}
              propertyClass={cls}
              billingMode={billingMode}
              onBillingModeChange={setBillingMode}
              systemKw={rec.recommendedKw}
            />

            {/* Bill input for residential */}
            {isResidential && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-medium">Your monthly electricity bill</p>
                  <span className="text-lg font-bold tabular-nums">${monthlyBill}</span>
                </div>
                <Slider
                  min={50} max={500} step={10}
                  value={[monthlyBill]}
                  onValueChange={([v]) => setMonthlyBill(v)}
                />
                <p className="text-xs text-muted-foreground">
                  ≈ {fmtKwh(Math.round(billToMonthlyKwh(monthlyBill)))} / month · {fmtKwh(Math.round(annualUsageKwh))} / year
                </p>
              </div>
            )}

            {/* Bill input for commercial (VoS only, SSO revenue doesn't depend on usage) */}
            {isCommercial && billingMode === "vos" && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-medium">Monthly electricity bill</p>
                  <span className="text-lg font-bold tabular-nums">${commercialMonthlyBill}</span>
                </div>
                <Slider
                  min={200} max={10000} step={100}
                  value={[commercialMonthlyBill]}
                  onValueChange={([v]) => setCommercialMonthlyBill(v)}
                />
                <p className="text-xs text-muted-foreground">
                  ≈ {fmtKwh(Math.round(billToMonthlyKwh(commercialMonthlyBill)))} / month · {fmtKwh(Math.round(commercialAnnualUsage))} / year
                </p>
              </div>
            )}

            <SolarProgramView
              rec={rec}
              recommendedKw={recNatural?.recommendedKw ?? null}
              propertyClass={cls}
              systemKw={rec.recommendedKw}
              onSystemKwChange={setSystemKwOverride}
              billingMode={billingMode}
              onBillingModeChange={setBillingMode}
              annualUsageKwh={annualUsageKwh}
              productionPerKw={productionPerKw}
              sunshineHrsDisplay={sunshineHrsDisplay}
              roofSqft={roofSqft}
              panelCount={buildablePanels}
              imageryQuality={property.solar_imagery_quality}
              imageryDate={property.solar_imagery_date}
              onCostPerWChange={setCostPerWOverride}
            />
          </>
        )}

        {/* Solar in your neighborhood, residential only */}
        {isResidential && nbStats && property.situs_zip && (
          <>
            <SectionHeading title="Solar in your neighborhood" />
            <NeighborhoodSnapshot
              zipCode={property.situs_zip}
              installationsInZip={nbStats.installationsInZip}
              pendingPermitsInZip={nbStats.pendingPermitsInZip}
              averageSystemKw={nbStats.averageSystemKw}
              newest={nbStats.newest}
            />
          </>
        )}

        {/* CTA */}
        <ContactCtaCard title={ctaTitle} description={ctaDescription} />


      </div>
    </div>
  );
}
