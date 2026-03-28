import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
};

const GUIDE_TOPICS = [
  { slug: "how-to-get-solar-panels-austin", category: "Solar Energy", icon: "sun", sort_order: 1 },
  { slug: "austin-energy-solar-rebate", category: "Solar Energy", icon: "sun", sort_order: 2 },
  { slug: "community-solar-austin-renters", category: "Solar Energy", icon: "sun", sort_order: 3 },
  { slug: "free-home-energy-audit-austin", category: "Energy Efficiency", icon: "zap", sort_order: 4 },
  { slug: "austin-weatherization-assistance", category: "Energy Efficiency", icon: "zap", sort_order: 5 },
  { slug: "heat-pump-rebates-austin", category: "Energy Efficiency", icon: "zap", sort_order: 6 },
  { slug: "ev-tax-credits-texas", category: "Electric Vehicles", icon: "car", sort_order: 7 },
  { slug: "ev-charging-austin", category: "Electric Vehicles", icon: "car", sort_order: 8 },
  { slug: "austin-bike-commuting-guide", category: "Transportation", icon: "bike", sort_order: 9 },
  { slug: "capmetro-transit-savings", category: "Transportation", icon: "bike", sort_order: 10 },
  { slug: "green-building-austin", category: "Green Building", icon: "building", sort_order: 11 },
  { slug: "pace-financing-texas", category: "Financial Assistance", icon: "dollar", sort_order: 12 },
  { slug: "austin-energy-power-saver-rebates", category: "Energy Efficiency", icon: "zap", sort_order: 13 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin session
    const adminToken = req.headers.get('x-admin-token');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (adminToken) {
      const { data: session } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('token', adminToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Load knowledge base
    const { data: knowledgeFiles } = await supabase
      .from('knowledge_files')
      .select('name, content');

    const resources = knowledgeFiles?.find(f => f.name === 'resources')?.content || '';
    const priorities = knowledgeFiles?.find(f => f.name === 'priorities')?.content || '';
    const expertContext = knowledgeFiles?.find(f => f.name === 'expert-context')?.content || '';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const results: { slug: string; success: boolean; error?: string }[] = [];

    // Generate guides in batches of 3 to avoid rate limits
    for (let i = 0; i < GUIDE_TOPICS.length; i += 3) {
      const batch = GUIDE_TOPICS.slice(i, i + 3);
      
      const batchPromises = batch.map(async (topic) => {
        try {
          const prompt = `Write a comprehensive, SEO-optimized guide page for Austin, Texas residents about: "${topic.slug.replace(/-/g, ' ')}".

KNOWLEDGE BASE CONTEXT:
${resources}

${priorities}

${expertContext}

REQUIREMENTS:
1. Return a JSON object with these fields:
   - "title": SEO-friendly page title (under 60 chars, include "Austin" if relevant)
   - "meta_description": SEO meta description (under 160 chars)
   - "summary": 1-2 sentence card description for the hub page
   - "content": Full markdown guide content

2. Content guidelines:
   - Write for residents searching Google for this topic
   - Use H2 (##) and H3 (###) headers for structure
   - Include specific dollar amounts, program names, and URLs from the knowledge base
   - Add a "How to Get Started" section with numbered steps
   - Include an "Eligibility" section if relevant
   - Add a "Good to Know" section with practical tips
   - 600-1000 words
   - IMPORTANT: The federal residential solar tax credit is NO LONGER available — do not mention it as active
   - Federal EV tax credits ARE still available

3. TONE GUIDELINES (critical):
   - Write like a helpful local newspaper article or city information page — factual, neutral, informative
   - DO NOT use promotional or salesy language (no "amazing", "fantastic", "game-changer", "exciting")
   - DO NOT use climate activist framing (no "save the planet", "fight climate change", "go green", "eco-warrior")
   - DO NOT use exclamation marks excessively
   - Focus on practical information: what the program is, who qualifies, what it costs, how to apply
   - Present environmental benefits as factual data points, not emotional appeals
   - Let the facts speak for themselves — if a program saves $800/year, state that plainly
   - Write as if you're a knowledgeable neighbor explaining how a city program works, not a salesperson

Return ONLY valid JSON, no markdown code fences.`;

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'You are a factual, informative writer covering Austin city programs and energy topics. Write like a local newspaper or city information page — neutral, clear, and practical. Avoid promotional language and climate activism framing. Return only valid JSON.' },
                { role: 'user', content: prompt }
              ],
            }),
          });

          if (!aiResponse.ok) {
            throw new Error(`AI error: ${aiResponse.status}`);
          }

          const aiData = await aiResponse.json();
          let content = aiData.choices[0].message.content;
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

          const guideData = JSON.parse(content);

          const { error: upsertError } = await supabase
            .from('guide_pages')
            .upsert({
              slug: topic.slug,
              title: guideData.title,
              meta_description: guideData.meta_description,
              category: topic.category,
              icon: topic.icon,
              summary: guideData.summary,
              content: guideData.content,
              sort_order: topic.sort_order,
              published: true,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'slug' });

          if (upsertError) throw upsertError;

          results.push({ slug: topic.slug, success: true });
        } catch (err) {
          console.error(`Failed to generate ${topic.slug}:`, err);
          results.push({ slug: topic.slug, success: false, error: err instanceof Error ? err.message : 'Unknown error' });
        }
      });

      await Promise.all(batchPromises);

      // Delay between batches to avoid rate limits
      if (i + 3 < GUIDE_TOPICS.length) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${successCount} guides, ${failCount} failures`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error seeding guides:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
