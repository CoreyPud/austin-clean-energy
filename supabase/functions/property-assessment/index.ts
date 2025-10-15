import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, propertyType } = await req.json();
    console.log('Assessing property:', address, 'Type:', propertyType);

    // Step 1: Geocode the address to get coordinates and standardized address
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${Deno.env.get('GOOGLE_SOLAR_API_KEY')}`;
    const geocodeResponse = await fetch(geocodeUrl);
    
    if (!geocodeResponse.ok) {
      throw new Error('Failed to validate address');
    }
    
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      throw new Error('Address not found. Please enter a valid address in Austin, TX.');
    }
    
    const location = geocodeData.results[0].geometry.location;
    const standardizedAddress = geocodeData.results[0].formatted_address;
    const lat = location.lat;
    const lng = location.lng;
    
    console.log('Geocoded address:', standardizedAddress, 'Coords:', lat, lng);

    // Step 2: Google Solar API integration with actual coordinates
    const GOOGLE_SOLAR_API_KEY = Deno.env.get('GOOGLE_SOLAR_API_KEY');
    let solarInsights = null;
    
    if (GOOGLE_SOLAR_API_KEY) {
      try {
        const buildingInsightsUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${GOOGLE_SOLAR_API_KEY}`;
        
        const solarResponse = await fetch(buildingInsightsUrl);
        
        if (solarResponse.ok) {
          solarInsights = await solarResponse.json();
          console.log('Google Solar API data retrieved successfully');
        } else {
          const errorText = await solarResponse.text();
          console.warn('Google Solar API error:', solarResponse.status, errorText);
          
          if (solarResponse.status === 429 || solarResponse.status === 403) {
            console.warn('⚠️ Google Solar API quota reached - falling back to Austin data only');
          }
        }
      } catch (solarError) {
        console.warn('Failed to fetch Google Solar data:', solarError);
      }
    }

    // Step 3: Fetch nearby solar installations from Austin data (same method as Area Analysis)
    const zipMatch = standardizedAddress.match(/\b(\d{5})\b/);
    const zipCode = zipMatch ? zipMatch[1] : '78701';
    
    const [solarPermitsData, auditData] = await Promise.all([
      fetch(`https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&original_zip=${zipCode}&$limit=5000`).then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=100').then(r => r.json())
    ]);

    console.log('Fetched property data - Solar Permits:', solarPermitsData.length, 'Audits:', auditData.length);

    // Create map markers using same method as Area Analysis
    const nearbyInstallations = solarPermitsData
      .map((item: any, idx: number) => {
        let itemLat: number | undefined;
        let itemLng: number | undefined;

        if (item.latitude && item.longitude) {
          itemLat = parseFloat(item.latitude);
          itemLng = parseFloat(item.longitude);
        } else if (item.location?.latitude && item.location?.longitude) {
          itemLat = parseFloat(item.location.latitude);
          itemLng = parseFloat(item.location.longitude);
        } else if (Array.isArray(item.location?.coordinates) && item.location.coordinates.length === 2) {
          const [lngC, latC] = item.location.coordinates;
          itemLat = Number(latC);
          itemLng = Number(lngC);
        }

        if (!Number.isFinite(itemLat as number) || !Number.isFinite(itemLng as number)) return null;

        const fullAddress = item.original_address1 || item.permit_location || item.street_name || 'Address not available';
        const title = item.original_address1 ? (item.original_address1.split(',')[0]) : `Solar Installation ${idx + 1}`;

        return {
          coordinates: [itemLng as number, itemLat as number] as [number, number],
          title,
          address: fullAddress,
          capacity: item.description || item.project_name || 'Solar Installation',
          programType: `${item.work_class || 'Solar'} - Permit #${item.permit_number || 'N/A'}`,
          installDate: item.issue_date ? new Date(item.issue_date).toLocaleDateString() : undefined,
          id: item.permit_number || `solar-${idx}`,
          color: '#f59e0b'
        };
      })
      .filter(Boolean)
      .slice(0, 50);

    const locations = [
      {
        coordinates: [lng, lat] as [number, number],
        title: '📍 Your Property',
        address: standardizedAddress,
        capacity: propertyType,
        programType: 'Target Assessment Property',
        id: 'target-property',
        color: '#ef4444' // Bright red to stand out from amber installations
      },
      ...nearbyInstallations
    ];

    // Use Lovable AI for detailed assessment
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build enhanced prompt with Google Solar data if available
    let googleSolarSection = '';
    if (solarInsights) {
      googleSolarSection = `
🎯 GOOGLE SOLAR API DATA (Precise roof-specific analysis):
- Maximum Solar Panels: ${solarInsights.solarPotential?.maxArrayPanelsCount || 'N/A'} panels
- Available Roof Area: ${solarInsights.solarPotential?.maxArrayAreaMeters2 || 'N/A'} m²
- Annual Sunshine Hours: ${solarInsights.solarPotential?.maxSunshineHoursPerYear || 'N/A'} hours
- Carbon Offset: ${solarInsights.solarPotential?.carbonOffsetFactorKgPerMwh || 'N/A'} kg CO₂/MWh
`;
    }

    const aiPrompt = `You are a certified energy auditor. Provide a CONCISE, actionable assessment for this Austin property.

Address: ${standardizedAddress}
Property Type: ${propertyType}
Nearby Solar Installations in ZIP: ${solarPermitsData.length}

${googleSolarSection}

Write a punchy, scannable assessment using this structure:

**Solar Potential** (2-3 sentences)
- Viability score (X/10) ${solarInsights ? 'based on Google Solar roof analysis' : ''}
- Recommended system size with specific kW
- Expected annual production

**Energy Efficiency** (2-3 sentences)
- Grade (A-F)
- Top 3 specific upgrades prioritized by ROI

**Battery Storage** (2-3 sentences)
- Recommended size (kWh)
- Primary benefits for this property

**Financial Summary** (3-4 sentences)
- Total system cost estimate
- Federal + Austin Energy incentives
- Payback period
- 25-year savings projection

**Next Steps** (bullet points)
- 3-4 specific actions with Austin Energy links

Keep it SHORT and ACTIONABLE. No fluff. Use markdown **bold** for section headers.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert energy auditor and solar consultant with deep knowledge of Austin Energy programs.' },
          { role: 'user', content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate property assessment');
    }

    const aiData = await aiResponse.json();
    const assessment = aiData.choices[0].message.content;
    
    return new Response(
      JSON.stringify({
        address: standardizedAddress,
        originalAddress: address,
        propertyType,
        assessment,
        locations,
        center: [lng, lat],
        dataPoints: {
          citySolarPermits: solarPermitsData.length,
          cityEnergyAudits: auditData.length,
          googleSolarDataUsed: !!solarInsights
        },
        solarInsights: solarInsights ? {
          maxPanels: solarInsights.solarPotential?.maxArrayPanelsCount,
          roofArea: solarInsights.solarPotential?.maxArrayAreaMeters2,
          sunshineHours: solarInsights.solarPotential?.maxSunshineHoursPerYear,
          carbonOffset: solarInsights.solarPotential?.carbonOffsetFactorKgPerMwh,
          annualProduction: solarInsights.solarPotential?.maxArrayPanelsCount ? 
            Math.round(solarInsights.solarPotential.maxArrayPanelsCount * 350 * (solarInsights.solarPotential.maxSunshineHoursPerYear || 2000) / 1000) : null
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in property-assessment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
