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
    console.log('Fetching yearly installation statistics from Austin Open Data API');

    // Try SODA API first
    try {
      const baseUrl = "https://data.austintexas.gov/resource/3syk-w9eu.json";
      const params = new URLSearchParams({
        '$select': 'date_extract_y(issued_date) as year, count(issued_date) as ct',
        '$where': "work_class='Auxiliary Power' AND upper(description) like '%KW%' AND issued_date is not null",
        '$group': 'year',
        '$order': 'year'
      });
      const apiUrl = `${baseUrl}?${params.toString()}`;
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        const body = await response.text();
        console.error('SODA response error body:', body);
        throw new Error(`SODA API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched yearly data from SODA:', data);

      const transformedData = data
        .map((item: any) => ({ year: parseInt(item.year), count: parseInt(item.ct) }))
        .filter((item: any) => Number.isFinite(item.year) && Number.isFinite(item.count))
        .filter((item: any) => item.year >= 2014);

      return new Response(
        JSON.stringify({ data: transformedData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (sodaError) {
      console.warn('SODA query failed, falling back to backend DB aggregation:', sodaError);
    }

    // Fallback: aggregate from our database to ensure the UI still works
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
      // Primary: count by issued_date within the year, where description mentions KW
      const { count: byIssued, error: errIssued } = await client
        .from('solar_installations')
        .select('id', { head: true, count: 'exact' })
        .gte('issued_date', `${y}-01-01`)
        .lt('issued_date', `${y + 1}-01-01`)
        .ilike('description', '%KW%');

      let total = (typeof byIssued === 'number' ? byIssued : 0);

      // Fallback for years with no issued_date: use calendar_year_issued
      if (total === 0) {
        const { count: byCalYear, error: errCal } = await client
          .from('solar_installations')
          .select('id', { head: true, count: 'exact' })
          .eq('calendar_year_issued', y)
          .ilike('description', '%KW%');
        if (!errCal && typeof byCalYear === 'number') {
          total = byCalYear;
        }
      }

      return { year: y, count: total };
    }));

    const data = results.filter(r => Number.isFinite(r.count));

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
