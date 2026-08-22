import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SatellitePane, { type SolarPanel } from "@/components/SatellitePane";
import MapTokenLoader from "@/components/MapTokenLoader";
import { useSolarFilter } from "@/components/SolarFilterPanel";
import NeighborhoodSnapshot from "@/components/assessment/NeighborhoodSnapshot";
import ContactCtaCard from "@/components/assessment/ContactCtaCard";
import SsoProForma from "@/components/assessment/SsoProForma";
import PbiBreakdown from "@/components/assessment/PbiBreakdown";
import SectionHeading from "@/components/assessment/SectionHeading";
import {
  slugifyAddress,
  classifyProperty,
  computeRecommendation,
  fromTcadProperty,
  estimateProductionPerKw,
  DEFAULT_MONTHLY_BILL,
} from "@/lib/property-solar";
import SolarProgramView from "@/components/assessment/SolarProgramView";
import { formatAssessorAddress } from "@/lib/address-utils";
import { billToMonthlyKwh, SSO_MIN_KW, SSO_RATE_UNDER_1MW } from "@/lib/solar-model";
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

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtKwh = (n: number) => `${Math.round(n).toLocaleString()} kWh`;


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
  // Only meaningful when ssoEligible; properties too small for SSO always show VoS regardless.
  const [billingMode, setBillingMode] = useState<"sso" | "vos">("sso");
  const [solarPanels,      setSolarPanels]      = useState<SolarPanel[]>([]);
  const [panelDims,        setPanelDims]        = useState<{ h: number; w: number } | null>(null);
  const [segmentAzimuths,  setSegmentAzimuths]  = useState<Record<number, number>>({});
  const [segmentPitches,   setSegmentPitches]   = useState<Record<number, number>>({});


  useEffect(() => {
    if (!pid) return;
    setLoading(true);
    setSystemKwOverride(null); // a new property starts at its own recommended size
    setBillingMode("sso"); // default to SSO whenever eligible; VoS is a deliberate opt-in
    Promise.all([
      supabase
        .from("tcad_properties")
        .select("pid, situs_address, situs_zip, property_type, year_built, market_value, estimated_roof_sqft, land_type_desc, centroid_lat, centroid_lon, solar_fetched_at, solar_max_panels, solar_panel_capacity_w, solar_sunshine_hrs, solar_sunshine_median, solar_max_area_m2, solar_imagery_quality, solar_imagery_date, solar_panels_layout")
        .eq("pid", pid)
        .single(),
      supabase
        .from("tcad_roof_segments")
        .select("segment_index, azimuth_deg, pitch_deg")
        .eq("pid", pid),
    ]).then(([{ data, error }, { data: segs }]) => {
      setLoading(false);
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
      }
    });
  }, [pid]);

  const nbStats = useNeighborhoodStats(property?.situs_zip ?? null);

  const solarFilter = useSolarFilter({
    panels:       solarPanels.length ? solarPanels : undefined,
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
  // walkways removed) rather than Google's raw maximum, so every figure downstream —
  // kW, cost, rebate, production, payback, SSO — reflects what can actually be built.
  // Bill and manual override both feed in here so the stat cards stay in sync.
  const buildablePanels = solarFilter.filteredPanelCount ?? property.solar_max_panels;
  const rec = computeRecommendation(
    fromTcadProperty({ ...property, solar_max_panels: buildablePanels }),
    {
      annualUsageKwh: isResidential ? residentialAnnualUsage : isCommercial ? commercialAnnualUsage : null,
      systemKwOverride,
      billingMode: isCommercial && billingMode === "sso" ? "sso" : "vos",
    },
  );
  const hasSolar = !!property.solar_fetched_at && property.solar_max_panels != null;
  const address  = formatAssessorAddress(property.situs_address) || `Property ${property.pid}`;
  const typeLabel = TYPE_LABEL[property.property_type ?? ""] ?? "Other";
  const typeColor = TYPE_COLOR[property.property_type ?? ""] ?? "#6b7280";
  const roofSqft  = property.solar_max_area_m2
    ? Math.round(property.solar_max_area_m2 * 10.764).toLocaleString()
    : property.estimated_roof_sqft
    ? Math.round(property.estimated_roof_sqft).toLocaleString()
    : null;

  const ssoEligible    = isCommercial && (rec?.maxKw ?? 0) >= SSO_MIN_KW;
  // ssoEligible = the roof qualifies for SSO at all; showSso = actually display SSO right now.
  // Properties too small for SSO always show VoS (billingMode is only a meaningful choice
  // once ssoEligible is true).
  const showSso        = ssoEligible && billingMode === "sso";

  const productionPerKw = estimateProductionPerKw(property.solar_sunshine_hrs);

  // Multifamily has no real bill/usage concept (virtual net metering) -- production is used
  // as a benign proxy purely so downstream charts have a non-zero number to plot against.
  const annualUsageKwh = isResidential
    ? residentialAnnualUsage
    : isCommercial
    ? commercialAnnualUsage
    : (rec?.annualProductionKwh ?? 0);

  const ctaTitle = isResidential
    ? "Want help navigating your solar options?"
    : isMultifamily
    ? "Questions about multifamily solar in Austin?"
    : ssoEligible
    ? "Want help evaluating the Standard Offer for your property?"
    : "Want help evaluating solar for your commercial property?";

  const ctaDescription = isResidential
    ? "We're an independent resource, not a solar installer. We help Austin homeowners understand rebates, what questions to ask installers, and whether solar actually pencils out for their situation."
    : isMultifamily
    ? "We're not a solar company — we're an independent resource. Austin Energy's multifamily programs change frequently and eligibility can be complicated. We can help you figure out what's currently available and whether it makes sense for your building."
    : ssoEligible
    ? "We're not a solar installer — we're an independent resource. The Standard Offer is compelling for large commercial properties, but navigating AE's interconnection process and finding the right installer takes work. We can help you ask the right questions."
    : "We're not a solar installer — we're an independent resource. We can help you evaluate whether solar makes financial sense for your property and what to ask commercial installers about sizing, rates, and AE's rebate process.";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{address}</h1>
          {property.situs_zip && (
            <p className="text-muted-foreground text-sm">Austin, TX {property.situs_zip}</p>
          )}
        </div>

        {/* Satellite map */}
        {property.centroid_lat != null && property.centroid_lon != null && (
          <div className="space-y-3">
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
          </div>
        )}

        {/* No solar data states */}
        {!hasSolar && (
          <div className="rounded-lg border border-border p-6 text-center space-y-2">
            <p className="font-medium">No Google Solar data available for this property</p>
            <p className="text-sm text-muted-foreground">
              Solar potential data hasn't been fetched for this address yet.
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

            {/* Recommended system hero */}
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">
                  Recommended system
                  <span className="text-muted-foreground font-normal text-sm ml-2">
                    {isResidential
                      ? "sized to offset your bill"
                      : isMultifamily
                      ? "maximum roof capacity"
                      : showSso
                      ? "maximum roof capacity · Standard Offer"
                      : "maximum roof capacity"}
                  </span>
                </h2>
                {isResidential && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Austin Energy's{" "}
                    <a href="https://austinenergy.com/green-power/solar-solutions/value-of-solar-rate" target="_blank" rel="noopener noreferrer" className="underline">Value of Solar program</a>
                    {" "}credits all your production at $0.126/kWh against your bill. Once credits cover your bill, additional production doesn't improve payback — so we size to match your consumption.
                  </p>
                )}
                {isMultifamily && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Austin Energy offers solar rebates and incentives for multifamily properties. See{" "}
                    <a href="https://austinenergy.com/green-power/solar-solutions/for-your-multifamily" target="_blank" rel="noopener noreferrer" className="underline">AE's multifamily solar page</a>
                    {" "}for current program options — availability and eligibility change frequently.
                  </p>
                )}
                {isCommercial && ssoEligible && (
                  <div className="mt-2 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This roof qualifies for two different Austin Energy commercial solar programs. Standard Offer pays a locked-in rate for every kilowatt-hour produced, as a standalone revenue stream with your electricity bill unaffected. Value of Solar instead credits production against your own bill, and (for systems 100 kW and up) can also stack a 5-year Performance-Based Incentive on top. Pick one below to see the numbers.
                    </p>
                    <div className="flex rounded-md border overflow-hidden text-xs font-medium w-full max-w-xs">
                      <button
                        type="button"
                        onClick={() => setBillingMode("sso")}
                        className={`flex-1 py-1.5 transition-colors ${billingMode === "sso" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        Standard Offer
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingMode("vos")}
                        className={`flex-1 py-1.5 transition-colors ${billingMode === "vos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        Value of Solar
                      </button>
                    </div>
                    {showSso ? (
                      <p className="text-sm text-muted-foreground">
                        Under Austin Energy's{" "}
                        <a href="https://austinenergy.com/green-power/solar-solutions/solar-standard-offer-program" target="_blank" rel="noopener noreferrer" className="underline">Standard Offer program</a>
                        , AE pays you a locked-in rate for every kilowatt-hour your system produces, regardless of what you consume. The rate starts at {(SSO_RATE_UNDER_1MW * 100).toFixed(2)}¢/kWh and steps up roughly every 5 years. Your electricity bill stays the same; this is a standalone revenue stream on top of it. Because revenue scales directly with output, there's no ceiling on useful system size, so maximum roof capacity is the right starting point. Minimum system size is {SSO_MIN_KW} kW.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Austin Energy's{" "}
                        <a href="https://austinenergy.com/green-power/solar-solutions/value-of-solar-rate" target="_blank" rel="noopener noreferrer" className="underline">Value of Solar program</a>
                        {" "}credits all your production at $0.126/kWh regardless of how much you consume — unused monthly credits carry forward, and AE pays out any remaining balance.{rec.pbiEligible ? " This system size also qualifies for the Performance-Based Incentive, a 5-year credit on top of Value of Solar — see below." : ""}
                      </p>
                    )}
                  </div>
                )}
                {isCommercial && !ssoEligible && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Austin Energy's{" "}
                    <a href="https://austinenergy.com/green-power/solar-solutions/value-of-solar-rate" target="_blank" rel="noopener noreferrer" className="underline">Value of Solar program</a>
                    {" "}credits all your production at $0.126/kWh regardless of how much you consume — unused monthly credits carry forward, and AE pays out any remaining balance. Maximum roof capacity is a reasonable starting point. Your system is under the {SSO_MIN_KW} kW minimum for the Standard Offer program, but the economics of VoS are still favorable at larger sizes.
                  </p>
                )}
              </div>

              {/* Bill input for commercial (VoS only — SSO revenue doesn't depend on usage) */}
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
                    ≈ {fmtKwh(Math.round(billToMonthlyKwh(commercialMonthlyBill)))} / month · {fmtKwh(Math.round(commercialAnnualUsage))} / year. Determines how large a system Value of Solar sizes to offset — Standard Offer doesn't depend on your bill.
                  </p>
                </div>
              )}

              {/* Adjust system size away from the default */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-medium">System size</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold tabular-nums">{rec.recommendedKw} kW</span>
                    {systemKwOverride != null && (
                      <button
                        type="button"
                        onClick={() => setSystemKwOverride(null)}
                        className="text-xs text-primary underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <Slider
                  min={1}
                  max={Math.max(1, Math.ceil(rec.maxKw))}
                  step={rec.maxKw > 50 ? 1 : 0.5}
                  value={[rec.recommendedKw]}
                  onValueChange={([v]) => setSystemKwOverride(v)}
                />
                <p className="text-xs text-muted-foreground">
                  {systemKwOverride != null
                    ? `Custom size · up to ${rec.maxKw} kW buildable`
                    : isResidential
                    ? `Sized to your bill · up to ${rec.maxKw} kW buildable`
                    : `Maximum buildable roof capacity (${rec.maxKw} kW)`}
                </p>
              </div>
            </div>

            <SolarProgramView
              rec={rec}
              propertyClass={cls}
              isSSO={showSso}
              ssoEligible={ssoEligible}
              annualUsageKwh={annualUsageKwh}
              productionPerKw={productionPerKw}
            />

            {/* Solar potential */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold">Solar potential</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="col-span-2 sm:col-span-1">
                  <dt className="text-muted-foreground">Sun score</dt>
                  <dd className="font-medium">
                    {property.solar_sunshine_median != null
                      ? `${Math.round(property.solar_sunshine_median).toLocaleString()} hrs/yr`
                      : property.solar_sunshine_hrs != null
                      ? `${Math.round(property.solar_sunshine_hrs).toLocaleString()} hrs/yr`
                      : "—"}
                  </dd>
                  <dd className="text-xs text-muted-foreground mt-0.5">
                    Peak sun-hours adjusted for this roof's orientation, tilt, shading from trees and nearby structures, and Austin's solar path — not a generic city-wide average.
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Max system</dt>
                  <dd className="font-medium">{rec.maxKw} kW ({buildablePanels?.toLocaleString()} panels)</dd>
                </div>
                {roofSqft && (
                  <div>
                    <dt className="text-muted-foreground">Usable roof area</dt>
                    <dd className="font-medium">{roofSqft} sqft</dd>
                  </div>
                )}
                {property.solar_imagery_date && (
                  <div>
                    <dt className="text-muted-foreground">Imagery</dt>
                    <dd className="font-medium">
                      {property.solar_imagery_quality} · {property.solar_imagery_date}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Performance-Based Incentive — for-profit commercial >= PBI_MIN_KW on VoS billing */}
            {isCommercial && !showSso && rec.pbiEligible && (
              <PbiBreakdown systemKw={rec.recommendedKw} productionPerKw={productionPerKw} />
            )}

            {/* Third-party-owner pro forma — same investor-side view shown on the calculator */}
            {isCommercial && showSso && (
              <SsoProForma systemKw={rec.recommendedKw} />
            )}
          </>
        )}

        {/* Solar in your neighborhood — residential only */}
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
