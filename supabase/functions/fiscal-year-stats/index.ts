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
    const requestBody = await req.json().catch(() => ({}));
    const { fiscalYear: requestedFY, includeDetails } = requestBody;

    console.log('Fetching fiscal year installation statistics', { requestedFY, includeDetails });

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
    
    // If requesting details for a specific fiscal year
    if (requestedFY && includeDetails) {
      const { startDate, endDate } = getFiscalYearRange(requestedFY);
      
      // Fetch detailed records with deduplication by project_id
      const { data: installations, error } = await client
        .from('solar_installations')
        .select('id, project_id, address, description, installed_kw, applied_date, issued_date, completed_date, status_current, contractor_company')
        .gte('completed_date', startDate)
        .lte('completed_date', endDate)
        .order('completed_date', { ascending: false });

      if (error) throw error;

      // Deduplicate by project_id - keep the first occurrence (most recent by completed_date)
      const seenProjectIds = new Set<string>();
      const dedupedInstallations = (installations || []).filter(install => {
        if (!install.project_id) return true; // Keep records without project_id
        if (seenProjectIds.has(install.project_id)) {
          console.log(`Duplicate found for project_id: ${install.project_id}`);
          return false;
        }
        seenProjectIds.add(install.project_id);
        return true;
      });

      const duplicatesRemoved = (installations?.length || 0) - dedupedInstallations.length;
      console.log(`Returning ${dedupedInstallations.length} records for FY ${requestedFY} (${duplicatesRemoved} duplicates removed)`);

      return new Response(
        JSON.stringify({ 
          installations: dedupedInstallations,
          duplicatesRemoved,
          fiscalYear: requestedFY,
          dateRange: { startDate, endDate }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    const startFY = 2015; // Start from FY 2015 (Oct 2014 - Sept 2015)
    
    const fiscalYears = Array.from({ length: currentFY - startFY + 1 }, (_, i) => startFY + i);
    
    const results = await Promise.all(fiscalYears.map(async (fy) => {
      const { startDate, endDate } = getFiscalYearRange(fy);
      
      // Query by completed_date for fiscal year range
      const { data: completedInstalls, error: errCompleted } = await client
        .from('solar_installations')
        .select('id, project_id, description, installed_kw')
        .gte('completed_date', startDate)
        .lte('completed_date', endDate);

      // Deduplicate by project_id
      const seenProjectIds = new Set<string>();
      const dedupedCompleted = (completedInstalls || []).filter(install => {
        if (!install.project_id) return true;
        if (seenProjectIds.has(install.project_id)) return false;
        seenProjectIds.add(install.project_id);
        return true;
      });

      let total = dedupedCompleted.length;
      let batteryCount = 0;
      let totalKW = 0;
      let duplicatesRemoved = (completedInstalls?.length || 0) - dedupedCompleted.length;

      if (dedupedCompleted.length > 0) {
        const batteryTerms = ['bess', 'battery', 'batteries', 'energy storage', 'powerwall', 'backup'];
        batteryCount = dedupedCompleted.filter(install => {
          const desc = (install.description || '').toLowerCase();
          return batteryTerms.some(term => desc.includes(term));
        }).length;
        totalKW = dedupedCompleted.reduce((sum, install) => sum + (Number(install.installed_kw) || 0), 0);
      }

      // Fallback to issued_date if no completed_date data
      if (total === 0) {
        const { data: issuedInstalls, error: errIssued } = await client
          .from('solar_installations')
          .select('id, project_id, description, installed_kw')
          .gte('issued_date', startDate)
          .lte('issued_date', endDate);
        
        if (!errIssued && issuedInstalls) {
          const seenIssuedIds = new Set<string>();
          const dedupedIssued = issuedInstalls.filter(install => {
            if (!install.project_id) return true;
            if (seenIssuedIds.has(install.project_id)) return false;
            seenIssuedIds.add(install.project_id);
            return true;
          });
          
          total = dedupedIssued.length;
          duplicatesRemoved = issuedInstalls.length - dedupedIssued.length;
          
          const batteryTerms = ['bess', 'battery', 'batteries', 'energy storage', 'powerwall', 'backup'];
          batteryCount = dedupedIssued.filter(install => {
            const desc = (install.description || '').toLowerCase();
            return batteryTerms.some(term => desc.includes(term));
          }).length;
          totalKW = dedupedIssued.reduce((sum, install) => sum + (Number(install.installed_kw) || 0), 0);
        }
      }

      return { 
        fiscalYear: fy, 
        label: `FY ${fy}`,
        count: total, 
        batteryCount, 
        totalKW,
        duplicatesRemoved
      };
    }));

    const data = results.filter(r => Number.isFinite(r.count) && Number.isFinite(r.batteryCount) && Number.isFinite(r.totalKW));
    console.log('Returning fiscal year data:', data.map(d => ({ fy: d.fiscalYear, count: d.count, totalKW: d.totalKW, dupes: d.duplicatesRemoved })));

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
