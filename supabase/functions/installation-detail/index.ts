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
    const { id } = await req.json();
    console.log('Fetching installation details for ID:', id);

    // Fetch data from Austin's open data APIs
    const [solarData, auditData, weatherizationData] = await Promise.all([
      fetch('https://data.austintexas.gov/resource/vxq2-zjmn.json?$limit=1000').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=1000').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/fnns-rqqh.json?$limit=500').then(r => r.json())
    ]);

    // Find the installation by ID in the datasets
    let installation = solarData.find((item: any) => 
      item.application_id === id || `solar-${solarData.indexOf(item)}` === id
    );

    if (!installation) {
      installation = auditData.find((item: any) => 
        item.application_id === id || `audit-${auditData.indexOf(item)}` === id
      );
    }

    if (!installation) {
      installation = weatherizationData.find((item: any) => 
        item.application_id === id || `weatherization-${weatherizationData.indexOf(item)}` === id
      );
    }

    if (!installation) {
      return new Response(
        JSON.stringify({ error: 'Installation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found installation:', installation);

    return new Response(
      JSON.stringify({ installation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in installation-detail function:', error);
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
