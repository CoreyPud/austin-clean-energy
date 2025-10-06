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
    const { zipCode } = await req.json();
    console.log('Analyzing area for ZIP code:', zipCode);

    // Fetch data from Austin's open data APIs - using Green Building dataset with real addresses
    const [greenBuildingData, auditData, weatherizationData] = await Promise.all([
      fetch('https://data.austintexas.gov/resource/ihu3-829r.json?$limit=500').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=100').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/fnns-rqqh.json?$limit=50').then(r => r.json())
    ]);

    console.log('Fetched data - Green Buildings:', greenBuildingData.length, 'Audits:', auditData.length, 'Weatherization:', weatherizationData.length);

    // Create map markers from Green Building data with actual addresses and coordinates
    const locations = greenBuildingData
      .filter((item: any) => item.geocodes?.coordinates)
      .slice(0, 50)
      .map((item: any, idx: number) => {
        const [lng, lat] = item.geocodes.coordinates;
        
        // Build full address from components
        const addressParts = [
          item.address,
          item.city || 'Austin',
          item.st || 'TX',
          item.zip
        ].filter(Boolean);
        const fullAddress = addressParts.join(', ');
        
        // Create meaningful title
        const title = item.development_or_neighborhood || 
                     item.organization_name || 
                     (item.address ? item.address.split(',')[0] : `Green Building ${idx + 1}`);
        
        return {
          coordinates: [lng, lat] as [number, number],
          title,
          address: fullAddress,
          capacity: item.aegb_rating || 'Green Building',
          programType: `${item.program || 'Green Building'} - ${item.aegb_rating || 'Rated'}`,
          installDate: item.fiscal_year_reported ? `FY ${item.fiscal_year_reported}` : undefined,
          id: item.project_id || `green-${idx}`,
          color: '#22c55e',
          rawData: item
        };
      });

    // Use Lovable AI to analyze the data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `Analyze this Austin energy data for ZIP code ${zipCode}.

Green Building Projects: ${greenBuildingData.length} rated buildings
Energy Audits: ${auditData.length} completed
Weatherization Projects: ${weatherizationData.length} in progress

Provide a brief 3-4 paragraph analysis covering:
- Solar adoption trends and potential
- Energy efficiency opportunities  
- Battery storage recommendations
- Key actionable insights for activists and policymakers

Keep it concise and action-oriented. Use plain text paragraphs, no markdown formatting.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a clean energy expert analyzing urban sustainability data.' },
          { role: 'user', content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate AI analysis');
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        zipCode,
        insights,
        locations,
        dataPoints: {
          greenBuildings: greenBuildingData.length,
          energyAudits: auditData.length,
          weatherizationProjects: weatherizationData.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in area-analysis function:', error);
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
