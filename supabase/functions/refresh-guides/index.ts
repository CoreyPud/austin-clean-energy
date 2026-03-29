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
          const SLUG_SEO_TERMS: Record<string, string> = {
            'how-to-get-solar-panels-austin': 'Weave in naturally: "how much do solar panels cost in Austin", "Austin solar panel installation". FAQ ideas: How much does a solar system cost in Austin? How long does installation take?',
            'austin-energy-solar-rebate': 'Weave in naturally: "Austin Energy solar rebate", "how to apply for Austin solar rebate". FAQ ideas: How much is the rebate? Who qualifies for the Austin Energy solar rebate?',
            'community-solar-austin-renters': 'Weave in naturally: "community solar Austin TX", "solar for renters Austin". FAQ ideas: Can renters get solar in Austin? How does community solar billing work?',
            'free-home-energy-audit-austin': 'Weave in naturally: "free energy audit Austin", "Austin Energy home assessment". FAQ ideas: Is the Austin Energy audit really free? What does the auditor check?',
            'austin-weatherization-assistance': 'Weave in naturally: "Austin weatherization program", "free insulation Austin TX". FAQ ideas: Who qualifies for free weatherization? What improvements are covered?',
            'heat-pump-rebates-austin': 'Weave in naturally: "heat pump rebate Austin TX", "heat pump vs AC Austin". FAQ ideas: How much is the Austin heat pump rebate? Do heat pumps work well in Austin?',
            'ev-tax-credits-texas': 'Weave in naturally: "EV tax credit Texas", "Austin EV rebate". FAQ ideas: Is there a state EV tax credit in Texas? Does Austin Energy offer EV rebates?',
            'ev-charging-austin': 'Weave in naturally: "EV charging stations Austin TX", "home EV charger installation Austin". FAQ ideas: Where can I charge my EV in Austin? Does Austin Energy offer a charger rebate?',
            'austin-bike-commuting-guide': 'Weave in naturally: "bike commuting Austin TX", "best bike routes Austin". FAQ ideas: Is Austin a good city for bike commuting? What are the safest bike routes?',
            'capmetro-transit-savings': 'Weave in naturally: "CapMetro fares", "Austin bus pass cost". FAQ ideas: How much is a CapMetro bus pass? Does Austin have a train?',
            'green-building-austin': 'Weave in naturally: "green building Austin TX", "Austin Green Building program". FAQ ideas: What is the Austin Green Building program? Is green building more expensive?',
            'pace-financing-texas': 'Weave in naturally: "PACE financing Texas", "PACE loan Austin TX". FAQ ideas: How does PACE financing work in Texas? Who qualifies for PACE?',
            'austin-energy-power-saver-rebates': 'Weave in naturally: "Austin Energy Power Saver rebate", "AC rebate Austin Energy". FAQ ideas: What appliances qualify for Power Saver rebates? How do I apply?',
          };

          const seoGuidance = SLUG_SEO_TERMS[guide.slug] || 'Weave in 2-3 common Google search phrases for this topic naturally into the intro paragraph.';

          const prompt = `You are reviewing and updating an existing Austin guide page. Your job is to:
1. Check if the content is accurate and up-to-date based on the latest knowledge base
2. Improve clarity, readability, and SEO where possible
3. Ensure all program details (amounts, URLs, eligibility) match the knowledge base
4. Fix the tone to be informational and neutral (see tone guidelines below)
5. Improve SEO per the guide-specific instructions below

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

GUIDE-SPECIFIC SEO INSTRUCTIONS:
${seoGuidance}

SEO REQUIREMENTS (critical):
- The opening paragraph (first 2-3 sentences) MUST naturally incorporate the search phrases listed above. They should read as smooth, conversational sentences — NOT stuffed or awkward. A reader should not notice they are search terms.
- Pick 2-3 of the suggested phrases and weave them into the intro so it flows naturally.
- H2 headers should match common search queries (e.g. "How Much Does Solar Cost in Austin?" not "Cost Information")
- Include a FAQ section at the end titled "## Frequently Asked Questions" with 2-3 questions using ### headers and concise 2-3 sentence answers

IMPORTANT:
- The federal residential solar tax credit is NO LONGER available — remove any references to it as active
- Federal EV tax credits ARE still available
- Keep content 600-1000 words
- You may reorganize the structure to improve flow — use H2/H3 headers but convert bullet-heavy sections into prose paragraphs

TONE GUIDELINES (critical):
- Write like a helpful local newspaper article or city information page — factual, neutral, informative
- DO NOT use promotional or salesy language (no "amazing", "fantastic", "game-changer", "exciting", "incredible")
- DO NOT use climate activist framing (no "save the planet", "fight climate change", "go green", "eco-warrior", "Live Greener")
- DO NOT use exclamation marks excessively
- Focus on practical information: what the program is, who qualifies, what it costs, how to apply
- Present environmental benefits as factual data points, not emotional appeals
- Let the facts speak for themselves — if a program saves $800/year, state that plainly
- Write as if you're a knowledgeable neighbor explaining how a city program works

WRITING STYLE (critical):
- Write in flowing prose paragraphs, not long bulleted lists. Bullets are OK only for short reference items (eligibility criteria, step-by-step instructions) but the main body should read like a well-written article.
- Limit bullet lists to no more than 2 per article, each with no more than 5 items.

HONEST TAKE — DRAWBACKS & LIMITATIONS:
- Every guide MUST include at least 2-3 honest drawbacks, limitations, or tradeoffs relevant to the topic.
- Present them matter-of-factly within the article flow (e.g. in a "What to Consider" or "Good to Know" section, or woven into the relevant paragraph).
- Examples of drawbacks to consider: upfront costs, eligibility restrictions, waitlists or caps, long payback periods, maintenance requirements, limited availability, technology limitations, or situations where the program may not be the best fit.
- Do NOT dismiss the drawbacks or immediately counter them with positives — let the reader weigh the tradeoffs themselves.

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
