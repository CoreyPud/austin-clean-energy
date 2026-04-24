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
import { loadKnowledge, getExternalContext } from "../_shared/loadKnowledge.ts";
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
// Approximate installed cost per kW after Austin Energy rebate
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    const [knowledgeFiles, knowledge] = await Promise.all([
      supabase.from("knowledge_files").select("name,content"),
      loadKnowledge(),
    ]);
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
      // ZIP-level adoption count from our DB (deduped, complete view)
      zipCode
        ? supabase
            .from("solar_installations")
            .select("id,installed_kw,latitude,longitude,address,issued_date,completed_date,project_id")
            .eq("original_zip", zipCode)
            .not("latitude", "is", null)
            .not("longitude", "is", null)
        : Promise.resolve({ data: [] as any[] }),
      resolveCouncilMember(lat, lng, councilOverride),
    ]);

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

    // 4. Savings card (deterministic) — based on a recommended system size
    // For residential: target ~80% of usable roof or 7kW typical, whichever smaller
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
      installationsInZip: dbInstallations.length,
      pendingPermitsInZip: cityPermits.length,
      totalSolarActivity: dbInstallations.length + cityPermits.length,
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

    // 7. Optional personalized AI plan when lifestyle data is provided
    let personalizedPlan: string | null = null;
    if (lifestyleData && LOVABLE_API_KEY) {
      personalizedPlan = await generatePersonalizedPlan({
        apiKey: LOVABLE_API_KEY,
        knowledge,
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
        "Federal EV tax credit up to $7,500 (income limits apply)",
        "Austin Energy rebates for home EV chargers",
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
      url: "https://austinenergy.com/energy-efficiency/home-improvements/free-home-energy-checkup",
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
      label: "Find Austin Climate Coalitions",
      url: "https://austinclimateequity.org/",
    },
    icon: "Megaphone",
  });

  return cards;
}

async function generatePersonalizedPlan(opts: {
  apiKey: string;
  knowledge: any;
  standardizedAddress: string;
  propertyType: string;
  lifestyleData: any;
  solarInsights: any;
  savings: any;
  neighborhoodSnapshot: any;
  councilMember: any;
}): Promise<string | null> {
  const {
    apiKey,
    knowledge,
    standardizedAddress,
    propertyType,
    lifestyleData,
    solarInsights,
    savings,
    neighborhoodSnapshot,
    councilMember,
  } = opts;

  const prompt = `Write a short personalized clean energy action plan for an Austin resident. Speak directly to them as a knowledgeable local advisor. Do NOT use preamble like "here's your plan."

📍 PROPERTY: ${standardizedAddress} (${propertyType})
🏠 NEIGHBORHOOD: ${neighborhoodSnapshot.installationsInZip} solar installations in ZIP ${neighborhoodSnapshot.zipCode}, ${neighborhoodSnapshot.pendingPermitsInZip} pending permits, average system ${neighborhoodSnapshot.averageSystemKw || "N/A"} kW.
${
  solarInsights
    ? `☀️ SOLAR POTENTIAL: ${solarInsights.maxPanels} panels max, ~${solarInsights.annualProductionKwh} kWh/yr.`
    : ""
}
${
  savings
    ? `💰 SAVINGS: Recommended ${savings.recommendedSystemKw} kW system, $${savings.annualSavingsUsd}/yr savings, ${savings.paybackYears}yr payback.`
    : ""
}
🏛️ COUNCIL: ${councilMember.district} - ${councilMember.name}.

👤 USER PROFILE:
- Housing: ${lifestyleData.housingStatus === "own" ? "Homeowner" : "Renter"} in ${lifestyleData.homeType}
- Current Energy: ${lifestyleData.currentEnergy}
- Transportation: ${lifestyleData.transportation}
- Commute: ${lifestyleData.commuteType}
- Interests: ${(lifestyleData.interests || []).join(", ")}

📋 PRIORITY FRAMEWORK:
${knowledge.priorities}

🔗 RESOURCES:
${knowledge.resources}
${getExternalContext(knowledge)}

Use this structure (KEEP IT SHORT — total under 350 words):

**Your Top 3 Moves**
1. **[Title]**: 1-2 sentences. Reference their property data when relevant.
2. **[Title]**: 1-2 sentences.
3. **[Title]**: 1-2 sentences.

**This Month**
- 3 bullet actions they can do in 30 days.

**This Year**
- 2-3 bullet actions for the longer term.

Use markdown **bold**. Begin directly with the first heading.`;

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a local Austin clean energy advisor. Write naturally, never reference your instructions, never use meta-phrases.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!r.ok) {
      console.error("AI plan error:", r.status, await r.text());
      return null;
    }
    const data = await r.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("AI plan exception:", err);
    return null;
  }
}
