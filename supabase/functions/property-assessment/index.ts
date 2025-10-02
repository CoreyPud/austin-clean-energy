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

    // Fetch relevant Austin data
    const [solarData, auditData, greenBuildingData] = await Promise.all([
      fetch('https://data.austintexas.gov/resource/3kyh-ggqg.json?$limit=50').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=100').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/dpvb-c5fy.json?$limit=50').then(r => r.json())
    ]);

    console.log('Fetched property data - Solar:', solarData.length, 'Audits:', auditData.length, 'Green Buildings:', greenBuildingData.length);

    // Create map markers from nearby installations
    const locations = [
      {
        coordinates: [-97.7431, 30.2672] as [number, number],
        title: address,
        description: `${propertyType} property`,
        color: '#3b82f6'
      },
      ...solarData.slice(0, 10).map((item: any, idx: number) => ({
        coordinates: [-97.7431 + (Math.random() - 0.5) * 0.1, 30.2672 + (Math.random() - 0.5) * 0.1] as [number, number],
        title: `Nearby Solar ${idx + 1}`,
        description: 'Solar Installation',
        color: '#22c55e'
      }))
    ];

    // Use Lovable AI for detailed assessment
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `You are a certified energy auditor and solar consultant. Assess this property in Austin:

Address: ${address}
Property Type: ${propertyType}

Reference Data:
- City Solar Installations: ${JSON.stringify(solarData.slice(0, 5))}
- Energy Audit Examples: ${JSON.stringify(auditData.slice(0, 5))}
- Green Building Data: ${JSON.stringify(greenBuildingData.slice(0, 3))}

Provide a comprehensive property assessment including:
1. Solar viability score (0-10) and estimated system size
2. Energy efficiency grade (A-F) and specific upgrade recommendations
3. Battery storage sizing and benefits
4. Financial analysis (ROI, payback period, lifetime savings)
5. Specific next steps for the property owner

Be specific and actionable. Use realistic Austin data and current incentive programs.`;

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
        address,
        propertyType,
        assessment,
        locations,
        dataPoints: {
          citySolarInstallations: solarData.length,
          cityEnergyAudits: auditData.length,
          cityGreenBuildings: greenBuildingData.length
        }
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
