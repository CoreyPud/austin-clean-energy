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

    // Fetch data from Austin's open data APIs - using Permits dataset filtered for solar (Auxiliary Power) and ZIP code
    const solarResponse = await fetch(`https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&original_zip=${zipCode}&$limit=5000`);
    
    if (!solarResponse.ok) {
      const errorText = await solarResponse.text();
      console.error('Solar API error:', solarResponse.status, errorText);
      throw new Error(`Solar API returned ${solarResponse.status}: ${errorText}`);
    }
    
    const [solarPermitsData, auditData, weatherizationData] = await Promise.all([
      solarResponse.json(),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=100').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/fnns-rqqh.json?$limit=50').then(r => r.json())
    ]);

    console.log('Fetched data for ZIP', zipCode, '- Solar Permits:', solarPermitsData.length, 'Audits:', auditData.length, 'Weatherization:', weatherizationData.length);

    // Create map markers from Solar Permits data with actual addresses and coordinates
    const locations = solarPermitsData
      .map((item: any, idx: number) => {
        // Prefer top-level lat/lon, then nested location fields, then coordinates array
        let lat: number | undefined;
        let lng: number | undefined;

        if (item.latitude && item.longitude) {
          lat = parseFloat(item.latitude);
          lng = parseFloat(item.longitude);
        } else if (item.location?.latitude && item.location?.longitude) {
          lat = parseFloat(item.location.latitude);
          lng = parseFloat(item.location.longitude);
        } else if (Array.isArray(item.location?.coordinates) && item.location.coordinates.length === 2) {
          const [lngC, latC] = item.location.coordinates;
          lat = Number(latC);
          lng = Number(lngC);
        }

        if (!Number.isFinite(lat as number) || !Number.isFinite(lng as number)) return null;

        const fullAddress = item.original_address1 || item.permit_location || item.street_name || 'Address not available';
        const title = item.original_address1 ? (item.original_address1.split(',')[0]) : `Solar Installation ${idx + 1}`;

        return {
          coordinates: [lng as number, lat as number] as [number, number],
          title,
          address: fullAddress,
          capacity: item.description || item.project_name || 'Solar Installation',
          programType: `${item.work_class || 'Solar'} - Permit #${item.permit_number || 'N/A'}`,
          installDate: item.issue_date ? new Date(item.issue_date).toLocaleDateString() : undefined,
          id: item.permit_number || `solar-${idx}`,
          color: '#f59e0b',
          rawData: item,
        };
      })
      .filter(Boolean)
      .slice(0, 100) as Array<{ coordinates: [number, number]; title: string; address: string; capacity?: string; programType: string; installDate?: string; id: string; color: string; rawData: any }>; 

    console.log('Created markers for ZIP', zipCode, ':', locations.length);

    // Use Lovable AI to analyze the data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `Analyze this Austin energy data for ZIP code ${zipCode}.

Solar Permits Issued: ${solarPermitsData.length} solar installations
Energy Audits: ${auditData.length} completed
Weatherization Projects: ${weatherizationData.length} in progress

Provide a brief 3-4 paragraph analysis covering:
- Solar adoption trends and potential based on permit activity
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
          solarPrograms: solarPermitsData.length,
          solarPermits: solarPermitsData.length,
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
