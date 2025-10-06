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

    // Fetch relevant Austin data - using Solar Permits dataset
    const [solarPermitsData, auditData] = await Promise.all([
      fetch('https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&$limit=200').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=100').then(r => r.json())
    ]);

    console.log('Fetched property data - Solar Permits:', solarPermitsData.length, 'Audits:', auditData.length);

    // Create map markers from nearby solar installations with actual addresses
    const nearbyInstallations = solarPermitsData
      .filter((item: any) => item.location?.coordinates)
      .slice(0, 15)
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
      ...nearbyInstallations
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
- Nearby Solar Installations: ${JSON.stringify(solarPermitsData.slice(0, 5))}
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
          citySolarPermits: solarPermitsData.length,
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
