/**
 * Unified Assessment Edge Function
 *
 * Single address-driven endpoint that powers "My Austin Energy Profile".
 * Returns one structured payload covering:
 *   - Property snapshot (geocoded address, property type, map markers)
 *   - Google Solar roof analysis (panels, sunshine, production, CO2)
 *   - Neighborhood snapshot (nearby installations, ZIP adoption rate)
 *   - Deterministic savings projections (annual + 25-year)
 *   - Council member contact info via ArcGIS + admin-editable markdown
 *   - Card-style general recommendations ranked by impact
 *
 * Two phases:
 *   POST { address, propertyType } -> returns full structured assessment
 *   POST { address, propertyType, lifestyleData } -> also returns personalized AI plan
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { resolveCouncilMember } from "../_shared/councilLookup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: 15 req/hour per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 15;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (record.count >= RATE_LIMIT) return { allowed: false, remaining: 0 };
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

function validateAddress(address: string) {
  if (!address || typeof address !== "string") return { valid: false, error: "Address is required" };
  const t = address.trim();
  if (!t) return { valid: false, error: "Address cannot be empty" };
  if (t.length > 200) return { valid: false, error: "Address too long" };
  if (/[<>{}]/.test(t)) return { valid: false, error: "Invalid characters in address" };
  return { valid: true };
}

// Austin Energy residential rate (approximate blended $/kWh, 2025)
const AE_BLENDED_RATE = 0.117;
// Approximate installed cost per kW
const COST_PER_KW = 2700;
const AE_REBATE_FLAT = 2500;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
      "unknown";
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { address, propertyType, lifestyleData } = body;

    const v = validateAddress(address);
    if (!v.valid) {
      return new Response(JSON.stringify({ error: v.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!propertyType || typeof propertyType !== "string") {
      return new Response(JSON.stringify({ error: "Property type is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GOOGLE_KEY = Deno.env.get("GOOGLE_SOLAR_API_KEY");

    // 1. Geocode
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_KEY}`;
    const geoResp = await fetch(geoUrl);
    const geoData = await geoResp.json();
    if (geoData.status !== "OK" || !geoData.results?.[0]) {
      return new Response(
        JSON.stringify({ error: "Address not found. Please enter a valid Austin, TX address." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const loc = geoData.results[0].geometry.location;
    const standardizedAddress = geoData.results[0].formatted_address;
    const lat = loc.lat;
    const lng = loc.lng;
    const zipMatch = standardizedAddress.match(/\b(\d{5})\b/);
    const zipCode = zipMatch ? zipMatch[1] : null;

    // Load admin-editable knowledge files (council-members may have been edited)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const knowledgeFiles = await supabase.from("knowledge_files").select("name,content");
    const councilOverride = knowledgeFiles.data?.find(
      (k: any) => k.name === "council-members",
    )?.content;

    // 2. Parallel: Solar API, nearby installations, council lookup, ZIP-level db stats
    const [solarApiResp, nearbyDbResp, zipDbResp, councilMember] = await Promise.all([
      GOOGLE_KEY
        ? fetch(
            `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${GOOGLE_KEY}`,
          )
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        : Promise.resolve(null),
      // nearby installations from city open data (same ZIP)
      zipCode
        ? fetch(
            `https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&original_zip=${zipCode}&$limit=2000`,
          )
            .then((r) => r.json())
            .catch(() => [])
        : Promise.resolve([]),
      // ZIP-level adoption count from our DB (deduped, complete view).
      // NOTE: PostgREST caps row results at 1000, so we fetch a sample for markers/avg
      // but use a separate head+count query below for the true total.
      zipCode
        ? supabase
            .from("solar_installations")
            .select("id,installed_kw,latitude,longitude,address,issued_date,completed_date,project_id")
            .eq("original_zip", zipCode)
            .not("latitude", "is", null)
            .not("longitude", "is", null)
            .order("completed_date", { ascending: false, nullsFirst: false })
            .limit(1000)
        : Promise.resolve({ data: [] as any[] }),
      resolveCouncilMember(lat, lng, councilOverride),
    ]);

    // True total installations in ZIP (exact count, not capped by row limit)
    const zipCountResp = zipCode
      ? await supabase
          .from("solar_installations")
          .select("id", { count: "exact", head: true })
          .eq("original_zip", zipCode)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
      : { count: 0 };
    const zipInstallationsTotal = (zipCountResp as any).count ?? 0;

    const dbInstallations = (zipDbResp as any).data || [];
    const cityPermits = Array.isArray(nearbyDbResp) ? nearbyDbResp : [];

    // Build map markers
    const markerLimit = 80;
    const dbMarkers = dbInstallations.slice(0, markerLimit).map((i: any) => ({
      coordinates: [parseFloat(i.longitude), parseFloat(i.latitude)] as [number, number],
      title: (i.address || "").split(",")[0] || "Solar Installation",
      address: i.address || "Address not available",
      capacity: i.installed_kw ? `${parseFloat(i.installed_kw).toFixed(2)} kW` : "Capacity not specified",
      programType: "Existing Installation",
      installDate: i.completed_date || i.issued_date,
      id: i.project_id || i.id,
      color: "#22c55e",
    }));

    const targetMarker = {
      coordinates: [lng, lat] as [number, number],
      title: "📍 Your Property",
      address: standardizedAddress,
      capacity: propertyType,
      programType: "Target Property",
      id: "target-property",
      color: "#ef4444",
    };

    const locations = [targetMarker, ...dbMarkers];

    // 3. Solar insights (deterministic numbers)
    let solarInsights: any = null;
    if (solarApiResp?.solarPotential) {
      const sp = solarApiResp.solarPotential;
      const maxPanels = sp.maxArrayPanelsCount;
      const panelCapacityWatts = sp.panelCapacityWatts || 400;
      const sunshineHours = sp.maxSunshineHoursPerYear || 2000;
      const annualProductionKwh = maxPanels
        ? Math.round((maxPanels * panelCapacityWatts * sunshineHours) / 1000)
        : null;

      solarInsights = {
        maxPanels,
        panelCapacityWatts,
        roofAreaM2: sp.maxArrayAreaMeters2 ? Math.round(sp.maxArrayAreaMeters2) : null,
        sunshineHours: Math.round(sunshineHours),
        annualProductionKwh,
        carbonOffsetKgPerMwh: sp.carbonOffsetFactorKgPerMwh
          ? Math.round(sp.carbonOffsetFactorKgPerMwh)
          : null,
        annualCarbonOffsetKg:
          annualProductionKwh && sp.carbonOffsetFactorKgPerMwh
            ? Math.round((annualProductionKwh / 1000) * sp.carbonOffsetFactorKgPerMwh)
            : null,
        panelLifetimeYears: sp.panelLifetimeYears || 20,
        imageryDate: solarApiResp.imageryDate || null,
        imageryQuality: solarApiResp.imageryQuality || null,
      };
    }

    // 3b. Individual panel layout data + persistence
    let solarCenter: any = null;
    let panelDims: any = null;
    let roofSegments: any = null;
    let solarPanelsCompact: any = null;
    if (solarApiResp?.solarPotential?.solarPanels && solarApiResp?.center) {
      const sp = solarApiResp.solarPotential;
      const refLat = solarApiResp.center.latitude;
      const refLon = solarApiResp.center.longitude;
      solarCenter = { lat: refLat, lon: refLon };
      panelDims = { h: 1.879, w: 1.045 };
      roofSegments = (sp.roofSegmentStats || []).map((seg: any, i: number) => ({
        segmentIndex: i,
        azimuthDeg: seg.azimuthDegrees,
        pitchDeg: seg.pitchDegrees,
      }));
      solarPanelsCompact = sp.solarPanels.map((p: any) => [
        +((p.center.latitude - refLat) * 1e6).toFixed(6),
        +((p.center.longitude - refLon) * 1e6).toFixed(6),
        p.orientation === "LANDSCAPE" ? 1 : 0,
        +p.yearlyEnergyDcKwh.toFixed(1),
        p.segmentIndex,
      ]);

      // Persist to DB if we can match a single TCAD property by street
      try {
        const streetPart = standardizedAddress.split(",")[0].trim();
        const matchResp = await supabase
          .from("tcad_properties")
          .select("pid")
          .ilike("situs_address", streetPart + "%")
          .limit(2);
        if (matchResp.data && matchResp.data.length === 1) {
          const pid = matchResp.data[0].pid;
          const imageryDateStr = solarApiResp.imageryDate
            ? `${solarApiResp.imageryDate.year}-${String(solarApiResp.imageryDate.month).padStart(2, "0")}-${String(solarApiResp.imageryDate.day).padStart(2, "0")}`
            : null;
          const wholeQuantiles = sp.wholeRoofStats?.sunshineQuantiles || [];
          const propertyRow = {
            pid,
            solar_fetched_at: new Date().toISOString(),
            solar_imagery_quality: solarApiResp.imageryQuality ?? null,
            solar_imagery_date: imageryDateStr,
            solar_max_panels: sp.maxArrayPanelsCount ?? null,
            solar_max_area_m2: sp.maxArrayAreaMeters2 ?? null,
            solar_sunshine_hrs: sp.maxSunshineHoursPerYear ?? null,
            solar_sunshine_median: wholeQuantiles[5] ?? null,
            solar_panel_capacity_w: sp.panelCapacityWatts ?? null,
            solar_panels_layout: { ref: [refLat, refLon], p: solarPanelsCompact },
          };
          const propUpsert = await supabase
            .from("tcad_properties")
            .upsert(propertyRow, { onConflict: "pid" });
          if (propUpsert.error) console.error("tcad_properties upsert error:", propUpsert.error);

          const lastConfig = sp.solarPanelConfigs?.at?.(-1);
          const segSummaries: any[] = lastConfig?.roofSegmentSummaries || [];
          const segRows = (sp.roofSegmentStats || []).map((seg: any, i: number) => {
            const summary = segSummaries.find((s: any) => s.segmentIndex === i);
            const q = seg.stats?.sunshineQuantiles || [];
            return {
              pid,
              segment_index: i,
              pitch_deg: seg.pitchDegrees ?? null,
              azimuth_deg: seg.azimuthDegrees ?? null,
              area_m2: seg.stats?.areaMeters2 ?? null,
              sunshine_median: q[5] ?? null,
              sunshine_max: q[10] ?? null,
              center_lat: seg.center?.latitude ?? null,
              center_lon: seg.center?.longitude ?? null,
              max_panels: summary?.panelsCount ?? null,
              max_kw: summary?.yearlyEnergyDcKwh != null && sp.panelCapacityWatts
                ? +((summary.panelsCount * sp.panelCapacityWatts) / 1000).toFixed(3)
                : null,
              yearly_energy_kwh: summary?.yearlyEnergyDcKwh ?? null,
            };
          });
          if (segRows.length > 0) {
            const segUpsert = await supabase
              .from("tcad_roof_segments")
              .upsert(segRows, { onConflict: "pid,segment_index" });
            if (segUpsert.error) console.error("tcad_roof_segments upsert error:", segUpsert.error);
          }
        }
      } catch (persistErr) {
        console.error("solar persistence error (non-fatal):", persistErr);
      }
    }

    // 4. Savings card (deterministic) — rough initial estimate; frontend recomputes with optimised sizing.
    let savings: any = null;
    if (solarInsights?.maxPanels && solarInsights?.panelCapacityWatts) {
      const maxSystemKw = (solarInsights.maxPanels * solarInsights.panelCapacityWatts) / 1000;
      const recommendedKw = Math.min(Math.max(Math.round(maxSystemKw * 0.6 * 10) / 10, 4), 12);
      const annualKwh = Math.round((recommendedKw / maxSystemKw) * (solarInsights.annualProductionKwh || 0));
      const annualSavingsUsd = Math.round(annualKwh * AE_BLENDED_RATE);
      const grossCost = Math.round(recommendedKw * COST_PER_KW);
      const netCostAfterRebate = Math.max(grossCost - AE_REBATE_FLAT, 0);
      const paybackYears = annualSavingsUsd > 0 ? +(netCostAfterRebate / annualSavingsUsd).toFixed(1) : null;
      const lifetimeSavings = annualSavingsUsd * 25 - netCostAfterRebate;

      savings = {
        recommendedSystemKw: recommendedKw,
        annualProductionKwh: annualKwh,
        annualSavingsUsd,
        grossSystemCostUsd: grossCost,
        austinEnergyRebateUsd: AE_REBATE_FLAT,
        netSystemCostUsd: netCostAfterRebate,
        paybackYears,
        twentyFiveYearSavingsUsd: lifetimeSavings,
        blendedRateUsdPerKwh: AE_BLENDED_RATE,
        notes:
          "Estimates use Austin Energy's blended residential rate and current solar rebate. Actual savings depend on usage, financing, and AE program changes. The federal residential solar tax credit is no longer available.",
      };
    }

    // 5. Neighborhood snapshot (deterministic counts)
    const neighborhoodSnapshot = {
      zipCode,
      installationsInZip: zipInstallationsTotal,
      pendingPermitsInZip: cityPermits.length,
      totalSolarActivity: zipInstallationsTotal + cityPermits.length,
      averageSystemKw:
        dbInstallations.length > 0
          ? +(
              dbInstallations.reduce((s: number, i: any) => s + (parseFloat(i.installed_kw) || 0), 0) /
              dbInstallations.length
            ).toFixed(2)
          : null,
      newest:
        dbInstallations
          .map((i: any) => i.issued_date || i.completed_date)
          .filter(Boolean)
          .sort()
          .pop() || null,
    };

    // 6. Deterministic recommendation cards (ranked by impact priorities)
    const recommendationCards = buildRecommendationCards({
      propertyType,
      hasSolarPotential: !!solarInsights?.maxPanels,
      lifestyleData,
      neighborhoodSnapshot,
      savings,
    });

    // 7. Optional personalized AI plan + council outreach script when lifestyle data is provided
    let personalizedPlan: string | null = null;
    let councilOutreachScript: string | null = null;
    if (lifestyleData) {
      councilOutreachScript = generateCouncilOutreachScript({
        standardizedAddress,
        lifestyleData,
        solarInsights,
        savings,
        neighborhoodSnapshot,
        councilMember,
      });
      personalizedPlan = generatePersonalizedPlan({
        standardizedAddress,
        propertyType,
        lifestyleData,
        solarInsights,
        savings,
        neighborhoodSnapshot,
        councilMember,
      });
    }

    return new Response(
      JSON.stringify({
        address: standardizedAddress,
        originalAddress: address,
        propertyType,
        center: [lng, lat],
        zipCode,
        locations,
        solarInsights,
        savings,
        neighborhoodSnapshot,
        councilMember,
        recommendationCards,
        personalizedPlan,
        councilOutreachScript,
        dataPoints: {
          citySolarPermits: cityPermits.length,
          dbInstallationsInZip: dbInstallations.length,
          googleSolarDataUsed: !!solarInsights,
          councilLookupSource: councilMember.lookupSucceeded ? "arcgis" : "fallback",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("unified-assessment error:", err);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

/**
 * Build deterministic, card-friendly recommendations ordered by impact.
 * No AI prose — short structured cards based on property + lifestyle context.
 */
function buildRecommendationCards(opts: {
  propertyType: string;
  hasSolarPotential: boolean;
  lifestyleData: any;
  neighborhoodSnapshot: any;
  savings: any;
}) {
  const { propertyType, hasSolarPotential, lifestyleData, savings } = opts;
  const isOwner = lifestyleData?.housingStatus !== "rent";
  const hasSolar = lifestyleData?.currentEnergy === "solar-existing";
  const hasEv = lifestyleData?.transportation === "ev";

  const cards: Array<{
    id: string;
    impact: "high" | "medium" | "low";
    category: string;
    title: string;
    summary: string;
    bullets: string[];
    cta: { label: string; url: string };
    icon: string; // lucide icon name
  }> = [];

  // 1. Transportation electrification
  if (!hasEv) {
    cards.push({
      id: "ev",
      impact: "high",
      category: "Transportation",
      title: "Switch to an EV",
      summary: "Replacing one gas car with an EV cuts ~4-6 tons of CO₂/year — the single biggest individual climate action.",
      bullets: [
        "Austin Energy rebates up to $1,200 for home Level 2 chargers",
        "EV-friendly time-of-use electricity rates from Austin Energy",
        "Charge for less than half the cost of gasoline",
      ],
      cta: {
        label: "Austin Energy EV Programs",
        url: "https://austinenergy.com/green-power/plug-in-austin",
      },
      icon: "Car",
    });
  }

  // 2. Solar
  if (!hasSolar && isOwner && hasSolarPotential && savings) {
    cards.push({
      id: "solar",
      impact: "high",
      category: "Home Power",
      title: `Install a ${savings.recommendedSystemKw} kW solar system`,
      summary: `Estimated $${savings.annualSavingsUsd.toLocaleString()}/year savings, payback in ~${savings.paybackYears} years after the Austin Energy rebate.`,
      bullets: [
        `Net cost after $${savings.austinEnergyRebateUsd.toLocaleString()} rebate: ~$${savings.netSystemCostUsd.toLocaleString()}`,
        `25-year savings: ~$${savings.twentyFiveYearSavingsUsd.toLocaleString()}`,
        `Use Austin Energy's Participating Contractor list for the rebate`,
      ],
      cta: {
        label: "Austin Energy Solar Rebate",
        url: "https://austinenergy.com/green-power/solar-solutions/for-your-home",
      },
      icon: "Sun",
    });
  } else if (!isOwner) {
    cards.push({
      id: "green-power",
      impact: "medium",
      category: "Home Power",
      title: "Enroll in GreenChoice",
      summary: "Renters can power their unit with 100% renewable energy via Austin Energy's GreenChoice program.",
      bullets: [
        "No rooftop access required",
        "Lock in renewable energy rates",
        "Counts toward Austin's climate goals",
      ],
      cta: {
        label: "Sign up for GreenChoice",
        url: "https://austinenergy.com/green-power/greenchoice",
      },
      icon: "Leaf",
    });
  }

  // 3. Energy efficiency / weatherization (always relevant in Austin)
  cards.push({
    id: "efficiency",
    impact: "high",
    category: "Efficiency",
    title: "Get a free home energy audit",
    summary: "Austin's heat makes AC efficiency the #1 driver of your bill. A free audit identifies the highest-ROI fixes.",
    bullets: [
      "Free for AE customers — required before some rebates",
      "Typical savings: 15-30% on cooling costs",
      "Rebates for AC tune-ups, attic insulation, smart thermostats",
    ],
    cta: {
      label: "Schedule a Home Energy Audit",
      url: "https://austinenergy.com/energy-efficiency/rebates-incentives/residential/home-improvements/home-energy-savings",
    },
    icon: "Wrench",
  });

  // 4. Battery storage (after solar)
  if (hasSolar || hasSolarPotential) {
    cards.push({
      id: "battery",
      impact: "medium",
      category: "Resilience",
      title: "Add battery storage",
      summary: "Pair a 10 kWh battery with solar to keep critical loads running during outages and shift usage off-peak.",
      bullets: [
        "Austin Energy battery rebate available",
        "Most useful for homes with medical equipment or work-from-home setups",
        "Best installed at the same time as solar",
      ],
      cta: {
        label: "Austin Energy Battery Rebate",
        url: "https://austinenergy.com/green-power/solar-solutions/for-your-home/battery-storage-incentive",
      },
      icon: "Battery",
    });
  }

  // 5. Electrification
  cards.push({
    id: "electrification",
    impact: "medium",
    category: "Appliances",
    title: "Electrify gas appliances",
    summary: "Replace gas water heaters, furnaces, and stoves with heat pumps and induction over time.",
    bullets: [
      "Heat pump water heaters use ~60% less energy",
      "Induction stoves eliminate indoor combustion pollution",
      "Federal IRA rebates may apply",
    ],
    cta: {
      label: "Heat Pump Rebates",
      url: "https://austinenergy.com/energy-efficiency/rebates-incentives",
    },
    icon: "Zap",
  });

  // 6. Civic action
  cards.push({
    id: "advocacy",
    impact: "medium",
    category: "Advocacy",
    title: "Contact your council member",
    summary:
      "Local policy decisions on permitting, rebates, and the Austin Energy Resource Plan shape what's possible at home.",
    bullets: [
      "Show up to City Council on climate budget items",
      "Ask Austin Energy to expand solar + storage rebates",
      "Push for streamlined residential permitting",
    ],
    cta: {
      label: "Get involved with Environment Texas",
      url: "https://environmentamerica.org/texas/",
    },
    icon: "Megaphone",
  });

  return cards;
}

function generatePersonalizedPlan(opts: {
  standardizedAddress: string;
  propertyType: string;
  lifestyleData: any;
  solarInsights: any;
  savings: any;
  neighborhoodSnapshot: any;
  councilMember: any;
}): string {
  const { lifestyleData, solarInsights, savings, neighborhoodSnapshot, councilMember } = opts;

  const isOwner = lifestyleData?.housingStatus === "own";
  const hasSolar = lifestyleData?.currentEnergy === "solar-existing";
  const hasEv = lifestyleData?.transportation === "ev";
  const interests: string[] = lifestyleData?.interests || [];
  const hasSolarPotential = !!solarInsights?.maxPanels;

  const moves: Array<{ title: string; description: string }> = [];

  if (isOwner && !hasSolar && hasSolarPotential && savings) {
    const kw = savings.recommendedSystemKw;
    const savingsStr = savings.annualSavingsUsd
      ? `$${Math.round(savings.annualSavingsUsd).toLocaleString()}/yr`
      : "";
    const payback = savings.paybackYears ? `~${savings.paybackYears} yr payback` : "";
    moves.push({
      title: `Install a ${kw} kW solar system`,
      description: `Your roof can support it${savingsStr ? `, saving roughly ${savingsStr}` : ""}. After Austin Energy's $2,500 rebate${payback ? `, ${payback}` : ""}.`,
    });
  }

  if (!hasEv) {
    moves.push({
      title: "Switch to an electric vehicle",
      description:
        "Replacing one gas car cuts 4–6 tons of CO₂/year — the biggest single lifestyle change. Austin Energy offers up to $1,200 for a home Level 2 charger.",
    });
  }

  moves.push({
    title: "Get a free home energy audit",
    description:
      "Austin's heat makes AC efficiency your #1 bill driver. A free AE audit identifies the highest-ROI fixes — typical savings are 15–30% on cooling costs.",
  });

  if (!isOwner && moves.length < 3) {
    moves.push({
      title: "Enroll in GreenChoice",
      description:
        "Power your unit with 100% renewable energy through Austin Energy's GreenChoice program. No rooftop access required.",
    });
  }

  if (moves.length < 3 && hasSolarPotential) {
    moves.push({
      title: "Pair solar with battery storage",
      description:
        "A 10 kWh battery keeps critical loads on during outages and shifts usage off-peak. Best installed at the same time as your solar panels.",
    });
  }

  if (moves.length < 3) {
    moves.push({
      title: "Electrify your gas appliances",
      description:
        "Heat pump water heaters use ~60% less energy than gas. Induction stoves eliminate indoor combustion pollution. Federal IRA rebates may apply.",
    });
  }

  const top3 = moves.slice(0, 3);

  // This Month — quick 30-day actions
  const thisMonth: string[] = [];
  if (isOwner && !hasSolar && hasSolarPotential) {
    thisMonth.push("Get 2–3 quotes from Austin Energy's participating solar contractors");
  } else if (!isOwner) {
    thisMonth.push("Sign up for Austin Energy's GreenChoice program online — takes 5 minutes");
  }
  thisMonth.push("Schedule your free Austin Energy home energy audit at austinenergy.com");
  if (!hasEv && (interests.includes("ev") || interests.includes("transit"))) {
    thisMonth.push("Compare EV models and check AE's Level 2 charger rebate (up to $1,200)");
  }
  if (councilMember?.name && councilMember?.email) {
    thisMonth.push(
      `Email ${councilMember.district} representative ${councilMember.name} about expanding Austin's solar and EV rebates`,
    );
  } else {
    thisMonth.push("Review your Austin Energy account for current rebates and incentives");
  }

  // This Year — longer-term commitments
  const thisYear: string[] = [];
  if (isOwner && !hasSolar && hasSolarPotential && savings) {
    thisYear.push(
      `Install your ${savings.recommendedSystemKw} kW system and lock in the $2,500 Austin Energy rebate`,
    );
  }
  if (!hasEv) {
    thisYear.push("Budget for or lease your first EV — home charging costs less than half of gasoline");
  }
  thisYear.push(
    "Replace your oldest gas appliance with an electric or heat pump model when it needs replacement",
  );
  if (isOwner && hasSolarPotential) {
    thisYear.push("Get a battery storage quote — AE offers a rebate and it pairs best with solar");
  }

  const movesText = top3
    .map((m, i) => `${i + 1}. **${m.title}**: ${m.description}`)
    .join("\n");
  const monthText = thisMonth
    .slice(0, 3)
    .map((b) => `- ${b}`)
    .join("\n");
  const yearText = thisYear
    .slice(0, 3)
    .map((b) => `- ${b}`)
    .join("\n");

  return `**Your Top 3 Moves**\n${movesText}\n\n**This Month**\n${monthText}\n\n**This Year**\n${yearText}`;
}

function generateCouncilOutreachScript(opts: {
  standardizedAddress: string;
  lifestyleData: any;
  solarInsights: any;
  savings: any;
  neighborhoodSnapshot: any;
  councilMember: any;
}): string {
  const { standardizedAddress, lifestyleData, solarInsights, savings, neighborhoodSnapshot, councilMember } = opts;

  const lastName = (councilMember.name || "").split(" ").slice(-1)[0] || "Representative";
  const isMayor = councilMember.district === "Mayor";
  const salutation = isMayor ? `Mayor ${lastName}` : `Councilmember ${lastName}`;
  const district = councilMember.district || "your district";
  const interests: string[] = lifestyleData.interests || [];
  const isOwner = lifestyleData.housingStatus === "own";
  const zip = neighborhoodSnapshot?.zipCode || "";
  const installCount: number = neighborhoodSnapshot?.installationsInZip || 0;
  const pendingCount: number = neighborhoodSnapshot?.pendingPermitsInZip || 0;

  const ASK_MAP: Record<string, string> = {
    solar: "expanding Austin Energy's solar rebate program and reducing permit processing times",
    ev: "expanding public EV charging infrastructure and protecting Austin Energy's residential charger rebates",
    efficiency: "protecting funding for Austin Energy's home energy audit and weatherization programs",
    electrification: "supporting incentives for heat pump and induction appliance upgrades",
    transit: "investing in CapMetro's electric fleet expansion and improving transit coverage in our area",
    organizing: "ensuring equitable access to clean energy programs for all Austin residents, including renters and lower-income households",
  };

  const matchedAsks = interests.map(i => ASK_MAP[i]).filter(Boolean).slice(0, 2);
  const ask = matchedAsks.length > 0
    ? matchedAsks.join(", and ")
    : "protecting Austin Energy's clean energy programs and expanding local solar incentives";

  const intro = `Dear ${salutation},\n\nI am a ${isOwner ? "homeowner" : "resident"} in ${district} writing from ${standardizedAddress}.`;

  let solarContext = "";
  if (isOwner && solarInsights && savings) {
    const kw = savings.recommendedSystemKw ?? "";
    const annualSavings = savings.annualSavingsUsd ? `$${Math.round(savings.annualSavingsUsd).toLocaleString()}` : "";
    if (kw) {
      solarContext = `My home's roof could support a ${kw} kW solar system${annualSavings ? ` that would save roughly ${annualSavings} per year` : ""}, but upfront costs and permit timelines remain real barriers for many neighbors.`;
    }
  } else if (!isOwner) {
    solarContext = `As a renter I can't install solar directly, which is why programs that expand community solar access and green building standards for rental properties matter to me.`;
  }

  let neighborhoodContext = "";
  if (installCount > 0 && zip) {
    neighborhoodContext = `My ZIP code (${zip}) already has ${installCount.toLocaleString()} solar installations${pendingCount > 0 ? ` with ${pendingCount} more in progress` : ""}, showing clear community interest in clean energy.`;
  }

  const body = `I'm writing to encourage your support for ${ask}.`;
  const closing = `I would welcome the chance to hear your position on Austin's clean energy goals and would appreciate any support you can offer. Thank you for your time.\n\n[Your name]`;

  return [intro, solarContext, neighborhoodContext, body, closing].filter(s => s.trim()).join(" ");
}
