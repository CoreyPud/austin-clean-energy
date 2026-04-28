import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function countSince(supabase: any, dateCol: string, sinceIso: string, extra?: { col: string; val: string }) {
  let q = supabase.from('solar_installations').select('*', { count: 'exact', head: true }).gte(dateCol, sinceIso);
  if (extra) q = q.eq(extra.col, extra.val);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function sumKwSince(supabase: any, dateCol: string, sinceIso: string) {
  // Pull only installed_kw within window (paginated, capped)
  let total = 0;
  let offset = 0;
  const pageSize = 1000;
  for (let i = 0; i < 10; i++) {
    const { data, error } = await supabase
      .from('solar_installations')
      .select('installed_kw')
      .gte(dateCol, sinceIso)
      .not('installed_kw', 'is', null)
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    total += data.reduce((s: number, r: any) => s + (Number(r.installed_kw) || 0), 0);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return Math.round(total);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const district = (url.searchParams.get('district') || '').trim();
    const safeDistrict = /^[0-9]{1,2}$/.test(district) ? district : '';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const cacheKey = safeDistrict ? `momentum_district_${safeDistrict}` : 'momentum_global';

    // Try cache first
    const { data: cached } = await supabase
      .from('cached_stats')
      .select('value, updated_at')
      .eq('stat_type', cacheKey)
      .maybeSingle();

    if (cached?.updated_at && Date.now() - new Date(cached.updated_at).getTime() < CACHE_TTL_MS) {
      try {
        const parsed = JSON.parse(cached.value);
        return new Response(JSON.stringify({ ...parsed, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        // fall through to recompute
      }
    }

    const sevenDaysAgo = isoDaysAgo(7);
    const thirtyDaysAgo = isoDaysAgo(30);
    const yearAgo = isoDaysAgo(365);

    const [weekCount, monthCount, monthKw] = await Promise.all([
      countSince(supabase, 'issued_date', sevenDaysAgo),
      countSince(supabase, 'issued_date', thirtyDaysAgo),
      sumKwSince(supabase, 'issued_date', thirtyDaysAgo),
    ]);

    let districtCount: number | null = null;
    if (safeDistrict) {
      districtCount = await countSince(supabase, 'issued_date', yearAgo, {
        col: 'council_district',
        val: safeDistrict,
      });
    }

    const payload = {
      weekCount,
      monthCount,
      monthKw,
      district: safeDistrict || null,
      districtCount,
      generatedAt: new Date().toISOString(),
    };

    // Upsert cache (insert if missing, update if exists)
    const { data: existing } = await supabase
      .from('cached_stats')
      .select('id')
      .eq('stat_type', cacheKey)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('cached_stats')
        .update({ value: JSON.stringify(payload), label: cacheKey, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('cached_stats')
        .insert({ stat_type: cacheKey, label: cacheKey, value: JSON.stringify(payload) });
    }

    return new Response(JSON.stringify({ ...payload, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('community-momentum error', e);
    return new Response(JSON.stringify({ error: e?.message || 'Failed to load momentum' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
