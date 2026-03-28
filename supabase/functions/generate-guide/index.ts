import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load knowledge base files
    const { data: knowledgeFiles, error } = await supabase
      .from('knowledge_files')
      .select('name, content')
      .in('name', ['resources', 'priorities']);

    if (error) throw error;

    const resources = knowledgeFiles?.find(f => f.name === 'resources')?.content || '';
    const priorities = knowledgeFiles?.find(f => f.name === 'priorities')?.content || '';

    // Use Lovable AI to transform into human-friendly guide content
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Transform the following Austin clean energy knowledge base content into a structured JSON guide for residents. The output should be human-friendly, encouraging, and actionable.

RESOURCES DATA:
${resources}

PRIORITY FRAMEWORK:
${priorities}

Return a JSON object with this exact structure:
{
  "categories": [
    {
      "id": "solar",
      "title": "Solar Energy",
      "icon": "sun",
      "description": "Brief 1-2 sentence category intro",
      "programs": [
        {
          "title": "Program Name",
          "provider": "Austin Energy",
          "description": "2-3 sentence human-friendly description of what this is and why it matters",
          "incentive": "$X,XXX rebate" or null,
          "eligibility": "Who qualifies" or null,
          "url": "https://...",
          "tip": "A helpful insider tip for residents" or null
        }
      ]
    }
  ],
  "quickTips": [
    "Short actionable tip residents can do today"
  ]
}

Categories should be: Solar Energy, Energy Efficiency, Electric Vehicles, Transportation, Green Building, Financial Assistance. Only include programs with real URLs. Make descriptions warm and practical, not technical. Include 5-8 quick tips. IMPORTANT: The federal residential solar tax credit is NO LONGER AVAILABLE - do not include it as an active program. Federal EV tax credits ARE still available.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful community resource guide writer. Return only valid JSON, no markdown code fences.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate guide content');
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0].message.content;

    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const guideData = JSON.parse(content);

    return new Response(
      JSON.stringify({ guide: guideData, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating guide:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
