import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchAllRows(
  client: SupabaseClient,
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
      .from('solar_installations_view')
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
    console.log('Fetching quarterly installation statistics');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      throw new Error('Missing backend environment configuration');
    }
    const client = createClient(SUPABASE_URL, SERVICE_ROLE);

    const currentYear = new Date().getFullYear();
    const startYear = 2014;

    // Fetch all records from startYear to now in one paginated sweep
    const allInstalls = await fetchAllRows(
      client,
      'completed_date, issued_date, installed_kw, project_id',
      'completed_date',
      `${startYear}-01-01`,
      `${currentYear}-12-31`
    );

    // Deduplicate by project_id
    const seenProjectIds = new Set<string>();
    const dedupedInstalls = allInstalls.filter((install: any) => {
      if (!install.project_id) return true;
      if (seenProjectIds.has(install.project_id)) return false;
      seenProjectIds.add(install.project_id);
      return true;
    });

    // Aggregate by year and quarter
    const yearQuarterMap: Record<string, { count: number; kw: number }> = {};
    const years = new Set<number>();

    dedupedInstalls.forEach((inst: any) => {
      const dateStr = inst.completed_date || inst.issued_date;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const year = date.getFullYear();
      if (year < startYear) return;
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      years.add(year);
      const key = `${year}-Q${quarter}`;
      if (!yearQuarterMap[key]) yearQuarterMap[key] = { count: 0, kw: 0 };
      yearQuarterMap[key].count += 1;
      yearQuarterMap[key].kw += Number(inst.installed_kw) || 0;
    });

    const sortedYears = Array.from(years).sort();
    const quarterLabels = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];

    const quarterlyData = [1, 2, 3, 4].map((q, idx) => {
      const row: Record<string, any> = { quarter: quarterLabels[idx] };
      sortedYears.forEach(year => {
        const key = `${year}-Q${q}`;
        row[`y${year}`] = yearQuarterMap[key]?.count || 0;
        row[`kw${year}`] = yearQuarterMap[key]?.kw || 0;
      });
      return row;
    });

    console.log(`Returning quarterly data for ${sortedYears.length} years, ${dedupedInstalls.length} records`);

    return new Response(
      JSON.stringify({ data: quarterlyData, years: sortedYears }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error fetching quarterly stats:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        years: [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
