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

    // Fetch data from Austin's open data APIs
    const [solarData, auditData, weatherizationData] = await Promise.all([
      fetch('https://data.austintexas.gov/resource/vxq2-zjmn.json?$limit=100').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=100').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/fnns-rqqh.json?$limit=50').then(r => r.json())
    ]);

    console.log('Fetched data - Solar:', solarData.length, 'Audits:', auditData.length, 'Weatherization:', weatherizationData.length);

    // Use Lovable AI to analyze the data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `You are an expert in clean energy policy and urban sustainability. Analyze this Austin energy data for ZIP code ${zipCode}:

Solar Programs Data: ${JSON.stringify(solarData.slice(0, 10))}
Energy Audit Data: ${JSON.stringify(auditData.slice(0, 10))}
Weatherization Data: ${JSON.stringify(weatherizationData.slice(0, 5))}

Provide a comprehensive area analysis including:
1. Solar adoption potential and current status
2. Energy efficiency opportunities
3. Battery storage recommendations
4. Top 3-5 specific opportunities for this area
5. Community engagement strategies

Format your response as detailed insights that climate activists and policymakers can act on.`;

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

    // Calculate basic metrics
    const solarPotential = solarData.length > 20 ? "High" : solarData.length > 10 ? "Medium" : "Moderate";
    const efficiencyScore = `${Math.min(10, 5 + (auditData.length / 10)).toFixed(1)}/10`;
    const storageAdoption = `${Math.min(25, Math.round((solarData.length / 100) * 15))}%`;

    return new Response(
      JSON.stringify({
        zipCode,
        solarPotential,
        efficiencyScore,
        storageAdoption,
        insights,
        topOpportunities: [
          "Residential solar installations with Austin Energy rebates",
          "Community-wide energy efficiency upgrade programs",
          "Battery storage integration for grid resilience",
          "Green building certification initiatives",
          "Weatherization assistance for low-income households"
        ],
        dataPoints: {
          solarPrograms: solarData.length,
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
