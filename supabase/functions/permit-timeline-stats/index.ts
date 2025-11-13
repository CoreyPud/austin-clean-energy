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
    console.log('Calculating permit timeline statistics');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      throw new Error('Missing backend environment configuration');
    }
    
    const client = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Fetch all installations with both applied_date and completed_date
    const { data: installations, error } = await client
      .from('solar_installations')
      .select('applied_date, completed_date, calendar_year_issued')
      .not('applied_date', 'is', null)
      .not('completed_date', 'is', null)
      .gte('calendar_year_issued', 2014);

    if (error) {
      console.error('Error fetching installations:', error);
      throw error;
    }

    console.log(`Fetched ${installations?.length || 0} installations with both dates`);

    // Group by year and calculate average days
    const yearStats = new Map<number, { totalDays: number; count: number }>();

    installations?.forEach(install => {
      const appliedDate = new Date(install.applied_date);
      const completedDate = new Date(install.completed_date);
      const year = appliedDate.getFullYear();

      // Calculate days between dates
      const daysDiff = Math.round((completedDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));

      // Only include valid positive differences (completed after applied)
      if (daysDiff > 0 && year >= 2014) {
        const existing = yearStats.get(year) || { totalDays: 0, count: 0 };
        yearStats.set(year, {
          totalDays: existing.totalDays + daysDiff,
          count: existing.count + 1
        });
      }
    });

    // Calculate averages and format results
    const results = Array.from(yearStats.entries())
      .map(([year, stats]) => ({
        year,
        averageDays: Math.round(stats.totalDays / stats.count),
        count: stats.count
      }))
      .sort((a, b) => a.year - b.year);

    console.log('Calculated timeline stats for years:', results.map(r => r.year));

    return new Response(
      JSON.stringify({ data: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error calculating permit timeline stats:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
