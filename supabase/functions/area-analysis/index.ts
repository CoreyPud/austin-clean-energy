import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { loadKnowledge, getExternalContext } from "../_shared/loadKnowledge.ts";

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

    // Load knowledge base configuration
    const knowledge = await loadKnowledge();
    console.log('Knowledge base loaded for area analysis');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query database for existing installations in this ZIP
    const { data: dbInstallations, error: dbError } = await supabase
      .from('solar_installations')
      .select('*')
      .eq('original_zip', zipCode)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (dbError) {
      console.error('Database query error:', dbError);
    }

    console.log(`Found ${dbInstallations?.length || 0} installations in database for ZIP ${zipCode}`);

    // Fetch recent permits from Austin API (last 90 days for supplemental data)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentDate = ninetyDaysAgo.toISOString().split('T')[0];
    
    const [solarPermitsData, auditData, weatherizationData] = await Promise.all([
      fetch(`https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&$where=issued_date>='${recentDate}'&$limit=2000`).then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=100').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/fnns-rqqh.json?$limit=50').then(r => r.json())
    ]);

    // Normalize to arrays to avoid runtime errors when the API returns an object
    const toArray = (v: any) => Array.isArray(v) ? v : (Array.isArray(v?.data) ? v.data : (Array.isArray(v?.results) ? v.results : []));
    const permits = toArray(solarPermitsData);
    const audits = toArray(auditData);
    const weather = toArray(weatherizationData);

    console.log('Fetched recent permits:', permits.length, 'Audits:', audits.length, 'Weatherization:', weather.length);

    // Process database installations (existing installations)
    const dbLocations = (dbInstallations || [])
      .filter((item: any) => item.latitude && item.longitude)
      .slice(0, 80)
      .map((item: any) => ({
        coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)] as [number, number],
        title: item.address.split(',')[0] || 'Solar Installation',
        address: item.address || 'Address not available',
        capacity: item.installed_kw ? `${item.installed_kw.toFixed(2)} kW` : 'Capacity not specified',
        programType: item.permit_class || 'Solar Installation',
        installDate: item.completed_date || item.issued_date,
        id: item.project_id || item.id,
        source: 'existing',
        color: '#22c55e'
      }));

    // Process recent API permits (filter for ZIP and avoid duplicates)
    const dbProjectIds = new Set((dbInstallations || []).map((i: any) => i.project_id).filter(Boolean));
    
    const apiLocations = permits
      .filter((item: any) => {
        const itemZip = item.original_zip_code?.toString().substring(0, 5);
        return itemZip === zipCode && !dbProjectIds.has(item.permit_number);
      })
      .map((item: any, idx: number) => {
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
        const title = item.original_address1 ? (item.original_address1.split(',')[0]) : `Recent Permit ${idx + 1}`;

        return {
          coordinates: [lng as number, lat as number] as [number, number],
          title,
          address: fullAddress,
          capacity: item.description || item.project_name || 'Solar Installation',
          programType: 'Recent Permit',
          installDate: item.issue_date ? new Date(item.issue_date).toLocaleDateString() : undefined,
          id: item.permit_number || `solar-${idx}`,
          source: 'api',
          color: '#f59e0b'
        };
      })
      .filter(Boolean)
      .slice(0, 20);

    // Combine both sources
    const locations = [...dbLocations, ...apiLocations];
    console.log(`Created ${locations.length} markers: ${dbLocations.length} existing, ${apiLocations.length} recent`);

    // Use Lovable AI to analyze the data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `Analyze this Austin energy data for ZIP code ${zipCode}.

📊 DATA SUMMARY:
Total Solar Installations: ${(dbInstallations?.length || 0) + permits.filter((p: any) => p.original_zip_code?.toString().substring(0, 5) === zipCode).length}
- Existing Installations: ${dbInstallations?.length || 0}
- Recent Permits (90 days): ${permits.filter((p: any) => p.original_zip_code?.toString().substring(0, 5) === zipCode).length}
Energy Audits: ${audits.length} completed
Weatherization Projects: ${weather.length} in progress

📋 PRIORITY FRAMEWORK & CONTEXT:
${knowledge.priorities}

💡 EXPERT KNOWLEDGE & BEST PRACTICES:
${knowledge.expertContext}

🔗 AVAILABLE RESOURCES (use specific links in your Take Action section):
${knowledge.resources}
${getExternalContext(knowledge)}

Provide a punchy, scannable analysis using this structure:

**Quick Take**
One sentence summarizing the area's clean energy status.

**Solar Adoption**
2-3 short sentences on solar trends and growth potential.

**Efficiency Gap**
2-3 short sentences on energy audit and weatherization opportunities.

**Battery Storage**
2-3 short sentences on storage recommendations and grid resilience.

**Take Action**
Include 3-4 specific Austin resources with actual links from the AVAILABLE RESOURCES section above.

Format with markdown: Use **bold** for section headers, keep sentences short and punchy. Use bullet points for resources.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a clean energy expert. Write in a punchy, scannable style with short sentences. Use markdown formatting for readability.' },
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
          solarPrograms: (dbInstallations?.length || 0) + permits.filter((p: any) => p.original_zip_code?.toString().substring(0, 5) === zipCode).length,
          solarPermits: (dbInstallations?.length || 0) + permits.filter((p: any) => p.original_zip_code?.toString().substring(0, 5) === zipCode).length,
          energyAudits: audits.length,
          weatherizationProjects: weather.length
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
