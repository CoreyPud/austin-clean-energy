import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to ensure response is an array
const toArray = (data: any): any[] => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id } = await req.json();
    console.log('Fetching installation details for ID:', id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, try to find in database
    const { data: dbInstallation, error: dbError } = await supabase
      .from('solar_installations')
      .select('*')
      .or(`project_id.eq.${id},id.eq.${id}`)
      .single();

    if (dbInstallation && !dbError) {
      console.log('Found installation in database:', dbInstallation);
      // Transform database format to match expected output
      const installation = {
        permit_number: dbInstallation.project_id,
        original_address_1: dbInstallation.address,
        solar_panel_capacity_output_dc_watts: dbInstallation.installed_kw ? dbInstallation.installed_kw * 1000 : null,
        issued_date: dbInstallation.issued_date,
        completed_date: dbInstallation.completed_date,
        work_class: dbInstallation.permit_class,
        status_current: dbInstallation.status_current,
        application_id: dbInstallation.project_id,
        location: dbInstallation.latitude && dbInstallation.longitude ? {
          latitude: dbInstallation.latitude.toString(),
          longitude: dbInstallation.longitude.toString()
        } : null,
        source: 'database'
      };
      
      return new Response(
        JSON.stringify({ installation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback to API if not in database
    console.log('Installation not in database, checking API...');
    const response = await fetch('https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&$limit=2000');
    const rawData = await response.json();
    const permits = toArray(rawData);
    
    console.log('Fetched permits from API:', permits.length);

    const installation = permits.find((item: any) => 
      item.permit_number === id || `solar-${permits.indexOf(item)}` === id
    );

    if (!installation) {
      console.log('Installation not found with ID:', id);
      return new Response(
        JSON.stringify({ error: 'Installation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found installation in API:', installation);
    installation.source = 'api';

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
