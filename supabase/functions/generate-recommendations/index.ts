import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { loadKnowledge } from "../_shared/loadKnowledge.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lifestyleData } = await req.json();
    console.log('Generating personalized recommendations with lifestyle data:', lifestyleData);

    // Load knowledge base configuration
    const knowledge = await loadKnowledge();
    console.log('Knowledge base loaded for recommendations');

    // Fetch comprehensive Austin energy data
    const [solarPermitsData, auditData, weatherizationData, greenBuildingData] = await Promise.all([
      fetch('https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&$limit=5000').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=500').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/fnns-rqqh.json?$limit=500').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/dpvb-c5fy.json?$limit=1000').then(r => r.json())
    ]);

    console.log('Fetched comprehensive data:', {
      solarPermits: solarPermitsData.length,
      audits: auditData.length,
      weatherization: weatherizationData.length,
      greenBuildings: greenBuildingData.length
    });

    // Aggregate data for heatmap instead of individual pins
    const permitsByZip: { [key: string]: number } = {};
    const coordinatesByZip: { [key: string]: [number, number] } = {};
    
    solarPermitsData.forEach((item: any) => {
      // Try multiple possible zip field names from the dataset
      const zip = item.original_zip || item.zip || item.zip_code || item.zipcode || item.customer_zip || item.customer_zip_code;
      if (!zip) return;

      // Increment permit count per ZIP
      permitsByZip[zip] = (permitsByZip[zip] || 0) + 1;

      // Extract coordinates from common Socrata shapes
      if (!coordinatesByZip[zip]) {
        let lng: number | undefined;
        let lat: number | undefined;

        if (item.location?.coordinates && Array.isArray(item.location.coordinates) && item.location.coordinates.length === 2) {
          // Some geojson-like shapes expose [lng, lat]
          lng = Number(item.location.coordinates[0]);
          lat = Number(item.location.coordinates[1]);
        } else if (item.location?.longitude && item.location?.latitude) {
          // Typical Socrata geo_point_2d shape with string fields
          lng = Number(item.location.longitude);
          lat = Number(item.location.latitude);
        } else if (item.longitude && item.latitude) {
          // Flat fields on the record
          lng = Number(item.longitude);
          lat = Number(item.latitude);
        }

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          coordinatesByZip[zip] = [lng as number, lat as number];
        }
      }
    });

    // Create heatmap-friendly data
    const heatmapData = Object.entries(permitsByZip)
      .filter(([zip]) => coordinatesByZip[zip])
      .map(([zip, count]) => ({
        zip,
        count,
        coordinates: coordinatesByZip[zip],
        intensity: Math.min((count as number) / 10, 1) // Normalize intensity (0-1 scale)
      }))
      .sort((a, b) => b.count - a.count);

    console.log('Heatmap aggregation:', {
      zipsWithPermits: Object.keys(permitsByZip).length,
      zipsWithCoordinates: Object.keys(coordinatesByZip).length,
      heatmapPoints: heatmapData.length,
      sample: heatmapData.slice(0, 3)
    });

    // Use Lovable AI to generate strategic recommendations
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Aggregate statistics for AI prompt
    const totalSolarPermits = solarPermitsData.length;
    const totalAudits = auditData.reduce((sum: number, a: any) => sum + (parseInt(a.all_homes_audited) || 0), 0);
    const totalWeatherization = weatherizationData.length;
    const avgGreenBuildingRating = greenBuildingData.length > 0
      ? (greenBuildingData.reduce((sum: number, b: any) => sum + (parseFloat(b.star_rating) || 0), 0) / greenBuildingData.length).toFixed(1)
      : 'N/A';

    // Build personalized context from lifestyle data
    let personalContext = '';
    if (lifestyleData) {
      personalContext = `

👤 USER PROFILE:
- Housing: ${lifestyleData.housingStatus === 'own' ? 'Homeowner' : 'Renter'} in ${lifestyleData.homeType}
- Current Energy: ${lifestyleData.currentEnergy}
- Transportation: ${lifestyleData.transportation}
- Commute: ${lifestyleData.commuteType}
- Interests: ${lifestyleData.interests.join(', ')}

PERSONALIZATION REQUIREMENTS:
- Tailor recommendations to their housing situation (renters have different options than owners)
- Acknowledge their current setup and suggest next logical steps
- Prioritize their stated interests while still following the impact framework
- Provide specific, actionable advice they can take based on their circumstances`;
    }

    const aiPrompt = `You are a clean energy strategist for Austin, Texas. Write a CONCISE ${lifestyleData ? 'PERSONALIZED' : ''} strategic overview based on this data:

📊 AUSTIN CLEAN ENERGY SNAPSHOT:
- Total Solar Permits: ${totalSolarPermits}
- Total Energy Audits: ${totalAudits}
- Weatherization Projects: ${totalWeatherization}
- Green Building Avg Rating: ${avgGreenBuildingRating} stars
- Top Solar ZIP Codes: ${heatmapData.slice(0, 5).map(d => `${d.zip} (${d.count} permits)`).join(', ')}
${personalContext}

📋 PRIORITY FRAMEWORK & EXPERT CONTEXT:
${knowledge.priorities}

💡 EXPERT KNOWLEDGE & BEST PRACTICES:
${knowledge.expertContext}

🔗 AVAILABLE RESOURCES (use specific links in recommendations):
${knowledge.resources}

Write a punchy, scannable ${lifestyleData ? 'personalized ' : ''}strategic plan using this EXACT structure:

**${lifestyleData ? 'Your Personalized Overview' : 'Executive Summary'}** (3-4 sentences)
${lifestyleData ? 'Address their specific situation and acknowledge what they\'re already doing right. Then highlight their top opportunity aligned with impact priorities.' : 'Brief snapshot of Austin\'s clean energy momentum and top opportunity aligned with impact priorities.'}

**Priority Actions${lifestyleData ? ' For You' : ''}** (3 items max, 2-3 sentences each)
${lifestyleData ? 'Customized to their housing, transportation, and interests. Focus on highest-impact areas they can actually act on.' : 'Focus on the highest-impact areas from the framework above. Include specific actions.'}
1. **[Title]**: [What + Expected Impact${lifestyleData ? ' + Why it fits their situation' : ' + Connection to top priorities'}]
2. **[Title]**: [What + Expected Impact${lifestyleData ? ' + Why it fits their situation' : ' + Connection to top priorities'}]  
3. **[Title]**: [What + Expected Impact${lifestyleData ? ' + Why it fits their situation' : ' + Connection to top priorities'}]

**Quick Wins** (3-4 bullet points)
${lifestyleData ? 'Immediate actions THEY can take in the next 30-90 days based on their situation.' : 'Immediate actions the city can take in the next 90 days that align with impact priorities.'}

**Next Steps** (3-4 bullet points)
${lifestyleData ? 'Specific resources, programs, and actions for their situation (e.g., "Check Austin Energy rebates for...", "Join a local climate action group...", "Schedule a free energy audit...").' : 'Specific actions with responsible parties (e.g., "Austin Energy should expand EV charging...", "City Council could fast-track heat pump rebates...").'}

Keep it SHORT, ACTIONABLE, and SPECIFIC. ${lifestyleData ? 'Make it feel personally relevant without being preachy.' : 'Emphasize high-impact actions over lower-impact ones.'} Use markdown **bold** for emphasis.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a strategic climate policy advisor with expertise in urban clean energy transitions, community organizing, and data-driven decision making.' },
          { role: 'user', content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate recommendations');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        overview: content,
        heatmapData,
        dataPoints: {
          solarPermits: solarPermitsData.length,
          energyAudits: totalAudits,
          weatherizationProjects: weatherizationData.length,
          greenBuildings: greenBuildingData.length,
          avgGreenBuildingRating
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-recommendations function:', error);
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
