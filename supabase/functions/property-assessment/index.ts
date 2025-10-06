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

    // Fetch relevant Austin data - using Green Building dataset with real addresses
    const [greenBuildingData, auditData] = await Promise.all([
      fetch('https://data.austintexas.gov/resource/ihu3-829r.json?$limit=200').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=100').then(r => r.json())
    ]);

    console.log('Fetched property data - Green Buildings:', greenBuildingData.length, 'Audits:', auditData.length);

    // Create map markers from nearby green buildings with actual addresses
    const nearbyBuildings = greenBuildingData
      .filter((item: any) => item.geocodes?.coordinates)
      .slice(0, 15)
      .map((item: any, idx: number) => {
        const [lng, lat] = item.geocodes.coordinates;
        const addressParts = [
          item.address,
          item.city || 'Austin',
          item.st || 'TX',
          item.zip
        ].filter(Boolean);
        const fullAddress = addressParts.join(', ');
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
          color: '#22c55e'
        };
      });

    const locations = [
      {
        coordinates: [-97.7431, 30.2672] as [number, number],
        title: 'Your Property',
        address: address,
        capacity: 'Assessment Pending',
        programType: propertyType,
        id: 'target-property',
        color: '#3b82f6'
      },
      ...nearbyBuildings
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
- Green Building Examples: ${JSON.stringify(greenBuildingData.slice(0, 5))}
- Energy Audit Examples: ${JSON.stringify(auditData.slice(0, 5))}

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
          cityGreenBuildings: greenBuildingData.length,
          cityEnergyAudits: auditData.length
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
