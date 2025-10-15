import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching Austin open data APIs...');

    // Fetch data from Austin APIs in parallel
    const [solarPermitsData, auditData] = await Promise.all([
      fetch('https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&$limit=50000')
        .then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=50000')
        .then(r => r.json())
    ]);

    console.log(`Fetched ${solarPermitsData.length} solar permits and ${auditData.length} audit records`);

    // Calculate statistics
    const uniqueZipCodes = new Set(
      solarPermitsData
        .filter((item: any) => item.original_zip)
        .map((item: any) => item.original_zip)
    );
    const solarProperties = solarPermitsData.length;
    const energyAudits = auditData.length;
    const totalAssessments = solarProperties + energyAudits;

    const stats = [
      { stat_type: 'zip_codes', value: `${uniqueZipCodes.size}`, label: 'ZIP Codes with Solar' },
      { stat_type: 'total_projects', value: `${totalAssessments.toLocaleString()}`, label: 'Total Projects Tracked' },
      { stat_type: 'solar_permits', value: `${solarProperties.toLocaleString()}`, label: 'Solar Permits Issued' },
      { stat_type: 'energy_audits', value: `${energyAudits.toLocaleString()}`, label: 'Energy Audits Completed' },
    ];

    console.log('Updating cached stats in database...');

    // Upsert stats into database
    for (const stat of stats) {
      const { error } = await supabase
        .from('cached_stats')
        .upsert(stat, { onConflict: 'stat_type' });
      
      if (error) {
        console.error(`Error upserting stat ${stat.stat_type}:`, error);
      }
    }

    console.log('Successfully updated all cached stats');

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching/caching stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
