import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching yearly installation statistics with battery counts from database');

    // Use database aggregation to include battery counts
    // (SODA API doesn't provide individual descriptions needed for battery detection)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      throw new Error('Missing backend environment configuration');
    }
    const client = createClient(SUPABASE_URL, SERVICE_ROLE);

    const currentYear = new Date().getFullYear();
    const startYear = 2014; // Filter to show only recent years with substantial data

    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
    const results = await Promise.all(years.map(async (y) => {
      // Count by completed_date to match the "Installations This Year" card metric
      const { data: completedInstalls, error: errCompleted, count: completedCount } = await client
        .from('solar_installations')
        .select('id, description', { count: 'exact' })
        .gte('completed_date', `${y}-01-01`)
        .lt('completed_date', `${y + 1}-01-01`);

      let total = completedCount || 0;
      let batteryCount = 0;

      // Count installations with battery mentions
      if (completedInstalls && completedInstalls.length > 0 && total > 0) {
        const batteryTerms = ['bess', 'battery', 'batteries', 'energy storage', 'powerwall', 'backup'];
        batteryCount = completedInstalls.filter(install => {
          const desc = (install.description || '').toLowerCase();
          return batteryTerms.some(term => desc.includes(term));
        }).length;
      }

      // Fallback: if no completed_date, check issued_date
      if (total === 0) {
        const { data: issuedInstalls, error: errIssued, count: issuedCount } = await client
          .from('solar_installations')
          .select('id, description', { count: 'exact' })
          .gte('issued_date', `${y}-01-01`)
          .lt('issued_date', `${y + 1}-01-01`);
        
        if (!errIssued && issuedInstalls) {
          total = issuedCount || 0;
          const batteryTerms = ['bess', 'battery', 'batteries', 'energy storage', 'powerwall', 'backup'];
          batteryCount = issuedInstalls.filter(install => {
            const desc = (install.description || '').toLowerCase();
            return batteryTerms.some(term => desc.includes(term));
          }).length;
        }
      }

      // Final fallback: use calendar_year_issued
      if (total === 0) {
        const { data: calYearInstalls, error: errCal, count: calYearCount } = await client
          .from('solar_installations')
          .select('id, description', { count: 'exact' })
          .eq('calendar_year_issued', y);
        
        if (!errCal && calYearInstalls) {
          total = calYearCount || 0;
          const batteryTerms = ['bess', 'battery', 'batteries', 'energy storage', 'powerwall', 'backup'];
          batteryCount = calYearInstalls.filter(install => {
            const desc = (install.description || '').toLowerCase();
            return batteryTerms.some(term => desc.includes(term));
          }).length;
        }
      }

      return { year: y, count: total, batteryCount };
    }));

    const data = results.filter(r => Number.isFinite(r.count) && Number.isFinite(r.batteryCount));

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error fetching yearly stats:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
