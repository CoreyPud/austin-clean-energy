import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
};

// Token validation (mirrors admin-auth logic)
const validTokens = new Map<string, { createdAt: number; expiresAt: number }>();

async function validateToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  
  // Call admin-auth to validate
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase configuration');
    return false;
  }
  
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
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
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

    const { action, ...params } = await req.json();
    console.log('Managing corrections:', action, params);

    // LIST - Get installations with optional search/filters
    if (action === 'list') {
      const { search, filter, limit = 50, offset = 0 } = params;
      
      let query = supabase
        .from('solar_installations_view')
        .select('*', { count: 'exact' })
        .order('completed_date', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (search) {
        query = query.or(`address.ilike.%${search}%,project_id.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      if (filter === 'missing_kw') {
        query = query.is('installed_kw', null);
      } else if (filter === 'has_corrections') {
        query = query.eq('has_correction', true);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ installations: data, total: count }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET - Get single installation with correction data
    if (action === 'get') {
      const { project_id } = params;
      
      if (!project_id) {
        return new Response(
          JSON.stringify({ error: 'project_id is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Get original data
      const { data: original, error: origError } = await supabase
        .from('solar_installations')
        .select('*')
        .eq('project_id', project_id)
        .single();
      
      if (origError) throw origError;
      
      // Get correction data if exists
      const { data: correction } = await supabase
        .from('installation_corrections')
        .select('*')
        .eq('project_id', project_id)
        .maybeSingle();
      
      return new Response(
        JSON.stringify({ original, correction }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SAVE - Create or update a correction
    if (action === 'save') {
      const { project_id, corrections, notes } = params;
      
      if (!project_id) {
        return new Response(
          JSON.stringify({ error: 'project_id is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Get original values first
      const { data: original, error: origError } = await supabase
        .from('solar_installations')
        .select('installed_kw, address, latitude, longitude, completed_date, applied_date, issued_date, description')
        .eq('project_id', project_id)
        .single();
      
      if (origError) throw origError;
      
      // Check if correction already exists
      const { data: existing } = await supabase
        .from('installation_corrections')
        .select('id')
        .eq('project_id', project_id)
        .maybeSingle();
      
      const correctionData = {
        project_id,
        corrected_kw: corrections.installed_kw ?? null,
        corrected_address: corrections.address ?? null,
        corrected_latitude: corrections.latitude ?? null,
        corrected_longitude: corrections.longitude ?? null,
        corrected_completed_date: corrections.completed_date ?? null,
        corrected_applied_date: corrections.applied_date ?? null,
        corrected_issued_date: corrections.issued_date ?? null,
        corrected_description: corrections.description ?? null,
        is_duplicate: corrections.is_duplicate ?? false,
        notes: notes ?? null,
        // Store original values
        original_kw: original.installed_kw,
        original_address: original.address,
        original_latitude: original.latitude,
        original_longitude: original.longitude,
        original_completed_date: original.completed_date,
        original_applied_date: original.applied_date,
        original_issued_date: original.issued_date,
        original_description: original.description,
      };
      
      let result;
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('installation_corrections')
          .update(correctionData)
          .eq('project_id', project_id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('installation_corrections')
          .insert(correctionData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      console.log('Saved correction for project:', project_id);
      
      return new Response(
        JSON.stringify({ success: true, correction: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Remove a correction (restore to original)
    if (action === 'delete') {
      const { project_id } = params;
      
      if (!project_id) {
        return new Response(
          JSON.stringify({ error: 'project_id is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      const { error } = await supabase
        .from('installation_corrections')
        .delete()
        .eq('project_id', project_id);
      
      if (error) throw error;
      
      console.log('Deleted correction for project:', project_id);
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Error in manage-corrections:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
