import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import the knowledge content directly
import { 
  prioritiesContent, 
  resourcesContent, 
  expertContextContent, 
  dataSourcesContent 
} from "../_shared/knowledgeContent.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return all knowledge file contents
    const files = {
      priorities: prioritiesContent,
      resources: resourcesContent,
      "expert-context": expertContextContent,
      "data-sources": dataSourcesContent
    };

    return new Response(
      JSON.stringify({ 
        files,
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
