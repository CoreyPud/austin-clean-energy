import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
};

async function validateToken(token: string | null): Promise<boolean> {
  if (!token) return false;

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: 'validate', token }),
    });
    const result = await response.json();
    return result.valid === true;
  } catch {
    return false;
  }
}

const ALLOWED_FIELDS = new Set([
  'situs_address',
  'situs_zip',
  'county',
  'property_type',
  'has_solar',
  'py_owner_name',
  'year_built',
  'market_value',
  'estimated_roof_sqft',
  'land_type_desc',
  'dist_nearest_gas_plant_mi',
  'dist_proposed_peaker_mi',
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = req.headers.get('x-admin-token');
    const isValid = await validateToken(token);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { pid, fields } = await req.json();

    if (!pid) {
      return new Response(
        JSON.stringify({ error: 'pid is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!fields || typeof fields !== 'object') {
      return new Response(
        JSON.stringify({ error: 'fields object is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Strip any fields not in the allowlist to prevent unintended column writes
    const safeFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (ALLOWED_FIELDS.has(key)) {
        safeFields[key] = value;
      }
    }

    if (Object.keys(safeFields).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tcad_properties')
      .update(safeFields)
      .eq('pid', pid)
      .select()
      .single();

    if (error) throw error;

    console.log('Updated tcad_properties for pid:', pid, 'fields:', Object.keys(safeFields));

    return new Response(
      JSON.stringify({ success: true, updated: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-tcad-property:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
