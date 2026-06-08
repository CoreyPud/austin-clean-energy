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

const BATTERY_TERMS = ['bess', 'battery', 'batteries', 'energy storage', 'powerwall', 'backup'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE) throw new Error('Missing backend environment configuration');
    const client = createClient(SUPABASE_URL, SERVICE_ROLE);

    const currentYear = new Date().getFullYear();
    const startYear = 2014;

    const rows = await fetchAllRows(
      client,
      'project_id, completed_date, issued_date, installed_kw, description',
      'completed_date',
      `${startYear}-01-01`,
      `${currentYear}-12-31`
    );

    // Deduplicate by project_id
    const seen = new Set<string>();
    const deduped = rows.filter((r: any) => {
      if (!r.project_id) return true;
      if (seen.has(r.project_id)) return false;
      seen.add(r.project_id);
      return true;
    });

    type Bucket = { count: number; batteryCount: number; totalKW: number };
    const buckets: Record<string, Bucket> = {};

    deduped.forEach((r: any) => {
      const dateStr = r.completed_date || r.issued_date;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const year = d.getFullYear();
      if (year < startYear) return;
      const quarter = Math.floor(d.getMonth() / 3) + 1;
      const key = `${year}-${quarter}`;
      if (!buckets[key]) buckets[key] = { count: 0, batteryCount: 0, totalKW: 0 };
      buckets[key].count += 1;
      buckets[key].totalKW += Number(r.installed_kw) || 0;
      const desc = (r.description || '').toLowerCase();
      if (BATTERY_TERMS.some((t) => desc.includes(t))) buckets[key].batteryCount += 1;
    });

    const data: any[] = [];
    for (let y = startYear; y <= currentYear; y++) {
      for (let q = 1; q <= 4; q++) {
        const b = buckets[`${y}-${q}`] || { count: 0, batteryCount: 0, totalKW: 0 };
        data.push({
          period: `${y} Q${q}`,
          year: y,
          quarter: q,
          count: b.count,
          batteryCount: b.batteryCount,
          solarOnly: b.count - b.batteryCount,
          totalKW: Math.round(b.totalKW),
        });
      }
    }

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error fetching quarterly stats:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred. Please try again.', data: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
