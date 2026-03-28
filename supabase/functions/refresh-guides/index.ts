import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin session
    const adminToken = req.headers.get('x-admin-token');
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

    const { slugs } = await req.json();

    // Determine which guides to refresh
    let guidesToRefresh: { slug: string; title: string; category: string; icon: string; sort_order: number; current_content: string }[];

    if (slugs && Array.isArray(slugs) && slugs.length > 0) {
      const { data, error } = await supabase
        .from('guide_pages')
        .select('slug, title, category, icon, sort_order, content')
        .in('slug', slugs);
      if (error) throw error;
      guidesToRefresh = (data || []).map(d => ({ ...d, current_content: d.content }));
    } else {
      // Refresh all
      const { data, error } = await supabase
        .from('guide_pages')
        .select('slug, title, category, icon, sort_order, content')
        .order('sort_order');
      if (error) throw error;
      guidesToRefresh = (data || []).map(d => ({ ...d, current_content: d.content }));
    }

    if (guidesToRefresh.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No guides found to refresh', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Process in batches of 3
    for (let i = 0; i < guidesToRefresh.length; i += 3) {
      const batch = guidesToRefresh.slice(i, i + 3);

      const batchPromises = batch.map(async (guide) => {
        try {
          const prompt = `You are reviewing and updating an existing Austin clean energy guide page. Your job is to:
1. Check if the content is accurate and up-to-date based on the latest knowledge base
2. Improve clarity, readability, and SEO where possible
3. Ensure all program details (amounts, URLs, eligibility) match the knowledge base
4. Keep the same warm, practical tone

CURRENT KNOWLEDGE BASE:
${resources}

${priorities}

${expertContext}

CURRENT GUIDE CONTENT (slug: ${guide.slug}, category: ${guide.category}):
${guide.current_content}

Return a JSON object with:
- "title": Updated SEO title (under 60 chars, include "Austin" if relevant)
- "meta_description": Updated SEO meta description (under 160 chars)
- "summary": Updated 1-2 sentence card description
- "content": Updated full markdown content
- "changes_made": Brief list of what was changed/updated (or "No changes needed" if content is already accurate)

IMPORTANT:
- The federal residential solar tax credit is NO LONGER available — remove any references to it as active
- Federal EV tax credits ARE still available
- Keep content 600-1000 words
- Preserve the existing structure (H2/H3 headers, How to Get Started, Pro Tips sections)

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
                { role: 'system', content: 'You are an expert Austin clean energy guide editor. Return only valid JSON.' },
                { role: 'user', content: prompt }
              ],
            }),
          });

          if (!aiResponse.ok) throw new Error(`AI error: ${aiResponse.status}`);

          const aiData = await aiResponse.json();
          let content = aiData.choices[0].message.content;
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

          const guideData = JSON.parse(content);

          const { error: upsertError } = await supabase
            .from('guide_pages')
            .update({
              title: guideData.title,
              meta_description: guideData.meta_description,
              summary: guideData.summary,
              content: guideData.content,
              updated_at: new Date().toISOString(),
            })
            .eq('slug', guide.slug);

          if (upsertError) throw upsertError;

          results.push({ slug: guide.slug, success: true, error: guideData.changes_made });
        } catch (err) {
          console.error(`Failed to refresh ${guide.slug}:`, err);
          results.push({ slug: guide.slug, success: false, error: err instanceof Error ? err.message : 'Unknown error' });
        }
      });

      await Promise.all(batchPromises);
      if (i + 3 < guidesToRefresh.length) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Refreshed ${successCount} guides, ${failCount} failures`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error refreshing guides:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
