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

function stripKeys<T extends Record<string, unknown>>(obj: T, ...keys: string[]): Record<string, unknown> {
  const out = { ...obj };
  for (const k of keys) delete out[k];
  return out;
}

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

    const body = await req.json();

    if (!body.fields || typeof body.fields !== 'object' || Array.isArray(body.fields)) {
      return new Response(
        JSON.stringify({ error: 'fields object is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // --- Update a solar_installations permit row ---
    if (body.permit_id != null) {
      const updateFields = stripKeys(body.fields as Record<string, unknown>, 'id', 'tcad_pid');

      if (Object.keys(updateFields).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No fields to update' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('solar_installations')
        .update(updateFields)
        .eq('id', body.permit_id)
        .select()
        .single();

      if (error) throw error;

      console.log('Updated solar_installations id:', body.permit_id, 'fields:', Object.keys(updateFields));

      return new Response(
        JSON.stringify({ success: true, updated: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Update a tcad_properties row ---
    if (body.pid != null) {
      const updateFields = stripKeys(body.fields as Record<string, unknown>, 'pid');

      if (Object.keys(updateFields).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No fields to update' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('tcad_properties')
        .update(updateFields)
        .eq('pid', body.pid)
        .select()
        .single();

      if (error) throw error;

      console.log('Updated tcad_properties pid:', body.pid, 'fields:', Object.keys(updateFields));

      return new Response(
        JSON.stringify({ success: true, updated: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'pid or permit_id is required' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Error in update-tcad-property:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
