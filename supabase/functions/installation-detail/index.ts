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

    // Fetch Green Building data with actual addresses
    const greenBuildingData = await fetch('https://data.austintexas.gov/resource/ihu3-829r.json?$limit=2000').then(r => r.json());

    // Find the installation by ID
    const installation = greenBuildingData.find((item: any) => 
      item.project_id === id || `green-${greenBuildingData.indexOf(item)}` === id
    );

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
