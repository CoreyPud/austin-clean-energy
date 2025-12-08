import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Helper to fetch all rows with pagination (Supabase default limit is 1000)
async function fetchAllRows(
  client: SupabaseClient,
  tableName: string,
  columns: string,
  dateColumn: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  const allRows: any[] = [];
  const pageSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await client
      .from(tableName)
      .select(columns)
      .gte(dateColumn, startDate)
      .lte(dateColumn, endDate)
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    
    if (data && data.length > 0) {
      allRows.push(...data);
      offset += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json().catch(() => ({}));
    const { fiscalYear: requestedFY, includeDetails, sortByKW } = requestBody;

    console.log('Fetching fiscal year installation statistics', { requestedFY, includeDetails, sortByKW });

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
      
      // Fetch all detailed records with pagination
      const installations = await fetchAllRows(
        client,
        'solar_installations',
        'id, project_id, address, description, installed_kw, applied_date, issued_date, completed_date, status_current, contractor_company',
        'completed_date',
        startDate,
        endDate
      );

      // Sort based on request - by kW descending if sortByKW, otherwise by completed_date descending
      if (sortByKW) {
        installations.sort((a, b) => {
          const kwA = Number(a.installed_kw) || 0;
          const kwB = Number(b.installed_kw) || 0;
          return kwB - kwA;
        });
      } else {
        installations.sort((a, b) => {
          const dateA = new Date(a.completed_date || 0).getTime();
          const dateB = new Date(b.completed_date || 0).getTime();
          return dateB - dateA;
        });
      }

      // Deduplicate by project_id - keep the first occurrence (most recent by completed_date)
      const seenProjectIds = new Set<string>();
      const dedupedInstallations = installations.filter((install: any) => {
        if (!install.project_id) return true; // Keep records without project_id
        if (seenProjectIds.has(install.project_id)) {
          return false;
        }
        seenProjectIds.add(install.project_id);
        return true;
      });

      const duplicatesRemoved = installations.length - dedupedInstallations.length;
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
      
      // Fetch all records with pagination for this fiscal year
      let allInstalls = await fetchAllRows(
        client,
        'solar_installations',
        'id, project_id, description, installed_kw',
        'completed_date',
        startDate,
        endDate
      );

      // If no completed_date results, try issued_date
      if (allInstalls.length === 0) {
        allInstalls = await fetchAllRows(
          client,
          'solar_installations',
          'id, project_id, description, installed_kw',
          'issued_date',
          startDate,
          endDate
        );
      }

      // Deduplicate by project_id
      const seenProjectIds = new Set<string>();
      const dedupedInstalls = allInstalls.filter((install: any) => {
        if (!install.project_id) return true;
        if (seenProjectIds.has(install.project_id)) return false;
        seenProjectIds.add(install.project_id);
        return true;
      });

      const total = dedupedInstalls.length;
      const duplicatesRemoved = allInstalls.length - dedupedInstalls.length;

      const batteryTerms = ['bess', 'battery', 'batteries', 'energy storage', 'powerwall', 'backup'];
      const batteryCount = dedupedInstalls.filter((install: any) => {
        const desc = (install.description || '').toLowerCase();
        return batteryTerms.some(term => desc.includes(term));
      }).length;
      
      const totalKW = dedupedInstalls.reduce((sum: number, install: any) => sum + (Number(install.installed_kw) || 0), 0);

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
    console.log('Returning fiscal year data:', data.map(d => ({ fy: d.fiscalYear, count: d.count, totalKW: Math.round(d.totalKW), dupes: d.duplicatesRemoved })));

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
