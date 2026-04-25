import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const GOOGLE_SOLAR_BUILDING_URL = "https://solar.googleapis.com/v1/buildingInsights:findClosest";

function toNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function jsonResponse(status: number, body: unknown, cache = false) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cache
        ? "public, s-maxage=86400, stale-while-revalidate=3600"
        : "no-store",
    },
  });
}

async function geocodeAddress(apiKey: string, address: string) {
  const url = new URL(GOOGLE_GEOCODE_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const payload = await res.json();

  if (!res.ok) throw new Error(`Geocoding request failed with ${res.status}`);
  if (payload.status !== "OK" || !Array.isArray(payload.results) || payload.results.length === 0) {
    throw new Error(payload.error_message || `Geocoding failed: ${payload.status}`);
  }

  const first = payload.results[0];
  const components: any[] = Array.isArray(first.address_components) ? first.address_components : [];
  const pick = (type: string) =>
    components.find((c) => Array.isArray(c.types) && c.types.includes(type)) ?? null;

  return {
    formattedAddress: first.formatted_address as string,
    latitude: first.geometry?.location?.lat as number,
    longitude: first.geometry?.location?.lng as number,
    city: pick("locality")?.long_name ?? pick("postal_town")?.long_name ?? null,
    stateCode: pick("administrative_area_level_1")?.short_name ?? null,
    postalCode: pick("postal_code")?.long_name ?? null,
  };
}

async function fetchBuildingInsights(
  apiKey: string,
  latitude: number,
  longitude: number,
  quality: string,
) {
  const url = new URL(GOOGLE_SOLAR_BUILDING_URL);
  url.searchParams.set("location.latitude", String(latitude));
  url.searchParams.set("location.longitude", String(longitude));
  url.searchParams.set("requiredQuality", quality);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const payload = await res.json();

  if (!res.ok) {
    throw new Error(payload.error?.message || `Solar API failed with ${res.status}`);
  }
  return payload;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("GOOGLE_SOLAR_API_KEY");
  if (!apiKey) return jsonResponse(500, { error: "Google API key not configured." });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());

    const address = String(body.address ?? params.address ?? "").trim();
    const quality = String(body.requiredQuality ?? params.requiredQuality ?? "HIGH")
      .trim()
      .toUpperCase();

    let latitude = toNumber(body.latitude ?? params.latitude);
    let longitude = toNumber(body.longitude ?? params.longitude);
    let formattedAddress: string | null = null;
    let city: string | null = null;
    let stateCode: string | null = null;
    let postalCode: string | null = null;

    if (address && (latitude === null || longitude === null)) {
      const geo = await geocodeAddress(apiKey, address);
      latitude = geo.latitude;
      longitude = geo.longitude;
      formattedAddress = geo.formattedAddress;
      city = geo.city;
      stateCode = geo.stateCode;
      postalCode = geo.postalCode;
    }

    if (latitude === null || longitude === null) {
      return jsonResponse(400, { error: "Provide either an address or both latitude and longitude." });
    }

    const insights = await fetchBuildingInsights(apiKey, latitude, longitude, quality);
    const solarPotential = insights.solarPotential ?? {};
    const financialAnalyses: any[] = Array.isArray(solarPotential.financialAnalyses)
      ? solarPotential.financialAnalyses
      : [];
    const cashPurchase = financialAnalyses.find((a) => a.financingOption === "CASH_PURCHASE") ?? null;
    const solarPanelConfigs: any[] = Array.isArray(solarPotential.solarPanelConfigs)
      ? solarPotential.solarPanelConfigs
      : [];
    const bestConfig = solarPanelConfigs.reduce<any>((best, cur) => {
      if (!best) return cur;
      return (cur.yearlyEnergyDcKwh ?? 0) > (best.yearlyEnergyDcKwh ?? 0) ? cur : best;
    }, null);

    return jsonResponse(
      200,
      {
        request: { latitude, longitude, requiredQuality: quality, address: address || formattedAddress, city, stateCode, postalCode },
        summary: {
          formattedAddress,
          name: insights.name ?? null,
          imageryQuality: insights.imageryQuality ?? null,
          maxArrayPanelsCount: solarPotential.maxArrayPanelsCount ?? null,
          maxArrayAreaMeters2: solarPotential.maxArrayAreaMeters2 ?? null,
          maxSunshineHoursPerYear: solarPotential.maxSunshineHoursPerYear ?? null,
          panelCapacityWatts: solarPotential.panelCapacityWatts ?? null,
          carbonOffsetFactorKgPerMwh: solarPotential.carbonOffsetFactorKgPerMwh ?? null,
          wholeRoofStats: solarPotential.wholeRoofStats ?? null,
          solarPanelConfigsCount: solarPanelConfigs.length,
          bestConfig: bestConfig
            ? { panelsCount: bestConfig.panelsCount ?? null, yearlyEnergyDcKwh: bestConfig.yearlyEnergyDcKwh ?? null }
            : null,
          cashPurchaseSavings: cashPurchase,
        },
        raw: insights,
      },
      true, // 24hr cache
    );
  } catch (err: any) {
    console.error("solar-insights error:", err);
    return jsonResponse(500, { error: err.message ?? "Unknown error fetching solar data." });
  }
});
