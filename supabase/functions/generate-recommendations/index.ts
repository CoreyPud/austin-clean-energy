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

    // Fetch comprehensive Austin energy data - using Solar Permits dataset
    const [solarPermitsData, auditData, weatherizationData] = await Promise.all([
      fetch('https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&$limit=500').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=200').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/fnns-rqqh.json?$limit=100').then(r => r.json())
    ]);

    console.log('Fetched comprehensive data:', {
      solarPermits: solarPermitsData.length,
      audits: auditData.length,
      weatherization: weatherizationData.length
    });

    // Create city-wide map markers with actual addresses from Solar Permits data
    const locations = solarPermitsData
      .filter((item: any) => item.location?.coordinates)
      .slice(0, 50)
      .map((item: any, idx: number) => {
        const [lng, lat] = item.location.coordinates;
        const fullAddress = item.original_address1 || item.street_name || 'Address not available';
        const title = item.original_address1 ? 
                     item.original_address1.split(',')[0] : 
                     `Solar Installation ${idx + 1}`;
        
        return {
          coordinates: [lng, lat] as [number, number],
          title,
          address: fullAddress,
          capacity: item.project_name || 'Solar Installation',
          programType: `${item.work_class || 'Solar'} - Permit #${item.permit_number || 'N/A'}`,
          installDate: item.issue_date ? new Date(item.issue_date).toLocaleDateString() : undefined,
          id: item.permit_number || `solar-${idx}`,
          color: '#f59e0b'
        };
      });

    // Use Lovable AI to generate strategic recommendations
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `You are a climate policy strategist and clean energy advisor for Austin, Texas. Analyze this comprehensive city data:

Solar Permits: ${JSON.stringify(solarPermitsData.slice(0, 20))}
Energy Audits: ${JSON.stringify(auditData.slice(0, 20))}
Weatherization Projects: ${JSON.stringify(weatherizationData.slice(0, 10))}

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
          solarPermits: solarPermitsData.length,
          energyAudits: auditData.length,
          weatherizationProjects: weatherizationData.length
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
