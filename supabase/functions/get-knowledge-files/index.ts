import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch knowledge files from database
    const { data: knowledgeFiles, error } = await supabase
      .from('knowledge_files')
      .select('name, content, updated_at');

    if (error) throw error;

    // Transform to expected format
    const files: Record<string, string> = {};
    const metadata: Record<string, { updated_at: string }> = {};
    
    (knowledgeFiles || []).forEach((file: { name: string; content: string; updated_at: string }) => {
      files[file.name] = file.content;
      metadata[file.name] = { updated_at: file.updated_at };
    });

    return new Response(
      JSON.stringify({ 
        files,
        metadata,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    console.error("Error fetching knowledge files:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
