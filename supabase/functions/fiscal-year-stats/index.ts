import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Austin fiscal year runs Oct 1 - Sept 30
// FY 2024 = Oct 1, 2023 - Sept 30, 2024
function getFiscalYearRange(fy: number) {
  const startDate = `${fy - 1}-10-01`;
  const endDate = `${fy}-09-30`;
  return { startDate, endDate };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching fiscal year installation statistics');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      throw new Error('Missing backend environment configuration');
    }
    const client = createClient(SUPABASE_URL, SERVICE_ROLE);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    // Determine current fiscal year
    // If we're in Oct-Dec, we're in FY of next calendar year
    // If we're in Jan-Sept, we're in FY of current calendar year
    const currentFY = currentMonth >= 10 ? currentYear + 1 : currentYear;
    
    const startFY = 2015; // Start from FY 2015 (Oct 2014 - Sept 2015)
    
    const fiscalYears = Array.from({ length: currentFY - startFY + 1 }, (_, i) => startFY + i);
    
    const results = await Promise.all(fiscalYears.map(async (fy) => {
      const { startDate, endDate } = getFiscalYearRange(fy);
      
      // Query by completed_date for fiscal year range
      const { data: completedInstalls, error: errCompleted, count: completedCount } = await client
        .from('solar_installations')
        .select('id, description, installed_kw', { count: 'exact' })
        .gte('completed_date', startDate)
        .lte('completed_date', endDate);

      let total = completedCount || 0;
      let batteryCount = 0;
      let totalKW = 0;

      if (completedInstalls && completedInstalls.length > 0 && total > 0) {
        const batteryTerms = ['bess', 'battery', 'batteries', 'energy storage', 'powerwall', 'backup'];
        batteryCount = completedInstalls.filter(install => {
          const desc = (install.description || '').toLowerCase();
          return batteryTerms.some(term => desc.includes(term));
        }).length;
        totalKW = completedInstalls.reduce((sum, install) => sum + (Number(install.installed_kw) || 0), 0);
      }

      // Fallback to issued_date if no completed_date data
      if (total === 0) {
        const { data: issuedInstalls, error: errIssued, count: issuedCount } = await client
          .from('solar_installations')
          .select('id, description, installed_kw', { count: 'exact' })
          .gte('issued_date', startDate)
          .lte('issued_date', endDate);
        
        if (!errIssued && issuedInstalls) {
          total = issuedCount || 0;
          const batteryTerms = ['bess', 'battery', 'batteries', 'energy storage', 'powerwall', 'backup'];
          batteryCount = issuedInstalls.filter(install => {
            const desc = (install.description || '').toLowerCase();
            return batteryTerms.some(term => desc.includes(term));
          }).length;
          totalKW = issuedInstalls.reduce((sum, install) => sum + (Number(install.installed_kw) || 0), 0);
        }
      }

      return { 
        fiscalYear: fy, 
        label: `FY ${fy}`,
        count: total, 
        batteryCount, 
        totalKW 
      };
    }));

    const data = results.filter(r => Number.isFinite(r.count) && Number.isFinite(r.batteryCount) && Number.isFinite(r.totalKW));
    console.log('Returning fiscal year data:', data.map(d => ({ fy: d.fiscalYear, count: d.count, totalKW: d.totalKW })));

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error fetching fiscal year stats:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
