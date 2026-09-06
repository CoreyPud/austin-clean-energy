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
    console.log('Managing agenda items:', action, params);

    // LIST - Get all agenda items
    if (action === 'list') {
      const { data, error } = await supabase
        .from('council_decisions')
        .select('id, meeting_date, item_number, title, status, visible')
        .order('meeting_date', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ items: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // UPDATE - Update title and/or visible flag for a single item
    if (action === 'update') {
      const { id, title, visible } = params;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'id is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const updateData: { title?: string; visible?: boolean } = {};
      if (title !== undefined) updateData.title = title;
      if (visible !== undefined) updateData.visible = visible;

      const { error } = await supabase
        .from('council_decisions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      console.log('Updated agenda item:', id);

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
    console.error('Error in manage-agenda-items:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
