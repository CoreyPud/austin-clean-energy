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
    console.log('Generating city-wide recommendations');

    // Fetch comprehensive Austin energy data
    const [solarData, auditData, weatherizationData, greenBuildingData, commercialData] = await Promise.all([
      fetch('https://data.austintexas.gov/resource/vxq2-zjmn.json?$limit=200').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=200').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/fnns-rqqh.json?$limit=100').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/dpvb-c5fy.json?$limit=100').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/b49u-qucc.json?$limit=100').then(r => r.json())
    ]);

    console.log('Fetched comprehensive data:', {
      solar: solarData.length,
      audits: auditData.length,
      weatherization: weatherizationData.length,
      greenBuilding: greenBuildingData.length,
      commercial: commercialData.length
    });

    // Create city-wide map markers with detailed information
    const locations = [
      ...solarData.slice(0, 30).map((item: any, idx: number) => ({
        coordinates: [
          parseFloat(item.longitude) || -97.7431 + (Math.random() - 0.5) * 0.3,
          parseFloat(item.latitude) || 30.2672 + (Math.random() - 0.5) * 0.3
        ] as [number, number],
        title: item.project_name || `Solar Program ${idx + 1}`,
        address: item.service_address || item.address || 'Address not available',
        capacity: item.system_size_kw ? `${item.system_size_kw} kW` : 'Capacity data unavailable',
        programType: item.program_type || 'Austin Energy Solar',
        installDate: item.installation_date || item.date_completed,
        id: item.application_id || `solar-${idx}`,
        color: '#22c55e'
      })),
      ...greenBuildingData.slice(0, 15).map((item: any, idx: number) => ({
        coordinates: [
          parseFloat(item.longitude) || -97.7431 + (Math.random() - 0.5) * 0.3,
          parseFloat(item.latitude) || 30.2672 + (Math.random() - 0.5) * 0.3
        ] as [number, number],
        title: item.building_name || `Green Building ${idx + 1}`,
        address: item.address || 'Address not available',
        capacity: item.certification_level || 'LEED Certified',
        programType: item.certification_type || 'Green Building',
        installDate: item.certification_date,
        id: item.building_id || `green-${idx}`,
        color: '#10b981'
      }))
    ];

    // Use Lovable AI to generate strategic recommendations
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `You are a climate policy strategist and clean energy advisor for Austin, Texas. Analyze this comprehensive city data:

Solar Programs: ${JSON.stringify(solarData.slice(0, 20))}
Energy Audits: ${JSON.stringify(auditData.slice(0, 20))}
Weatherization Projects: ${JSON.stringify(weatherizationData.slice(0, 10))}
Green Buildings: ${JSON.stringify(greenBuildingData.slice(0, 10))}
Commercial Buildings: ${JSON.stringify(commercialData.slice(0, 10))}

Generate strategic recommendations for Austin's clean energy transition including:

1. **Strategic Overview**: High-level assessment of current state and biggest opportunities

2. **Priority Opportunities** (3-5 items): Specific initiatives with highest ROI and climate impact. For each include:
   - Title
   - Description
   - Expected impact

3. **Action Plan**:
   - Immediate Actions (0-3 months): Data collection, stakeholder engagement, quick wins
   - Medium-Term Goals (3-12 months): Program launches, partnerships, infrastructure
   - Advocacy Strategies: Policy recommendations, community organizing, communications

Focus on actionable, data-driven strategies that balance solar adoption, energy efficiency, and battery storage for maximum community benefit.`;

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
        locations,
        dataPoints: {
          solarPrograms: solarData.length,
          energyAudits: auditData.length,
          weatherizationProjects: weatherizationData.length,
          greenBuildings: greenBuildingData.length,
          commercialBuildings: commercialData.length
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
