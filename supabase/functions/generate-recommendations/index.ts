import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { loadKnowledge, getExternalContext } from "../_shared/loadKnowledge.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 20 requests per hour per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

// Input validation
function validateLifestyleData(lifestyleData: any): { valid: boolean; error?: string } {
  if (!lifestyleData || typeof lifestyleData !== 'object') {
    return { valid: false, error: 'Lifestyle data is required' };
  }
  
  // Sanitize string values to prevent prompt injection
  const sanitizeString = (str: any): string => {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, 500); // Limit length
  };
  
  // Basic validation of expected fields
  const requiredFields = ['propertyType', 'homeSize', 'occupants'];
  for (const field of requiredFields) {
    if (!lifestyleData[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rateCheck = checkRateLimit(ip);
    
    if (!rateCheck.allowed) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }
    
    console.log(`Rate limit check passed. Remaining: ${rateCheck.remaining}`);

    const { lifestyleData } = await req.json();
    
    // Input validation
    if (lifestyleData) {
      const lifestyleValidation = validateLifestyleData(lifestyleData);
      if (!lifestyleValidation.valid) {
        return new Response(
          JSON.stringify({ error: lifestyleValidation.error }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    console.log('Generating personalized recommendations');

    // Load knowledge base configuration
    const knowledge = await loadKnowledge();
    console.log('Knowledge base loaded for recommendations');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all installations from database
    const { data: dbInstallations, error: dbError } = await supabase
      .from('solar_installations')
      .select('*');

    if (dbError) {
      console.error('Database query error:', dbError);
    }

    console.log(`Found ${dbInstallations?.length || 0} installations in database`);

    // Fetch recent API data (last 90 days) and other sources in parallel
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentDate = ninetyDaysAgo.toISOString().split('T')[0];

    const [solarPermitsData, auditData, weatherizationData, greenBuildingData] = await Promise.all([
      fetch(`https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&$where=issued_date>='${recentDate}'&$limit=2000`).then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=500').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/fnns-rqqh.json?$limit=500').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/dpvb-c5fy.json?$limit=1000').then(r => r.json())
    ]);

    const solarPermitsArr = Array.isArray(solarPermitsData) ? solarPermitsData : [];
    const auditArr = Array.isArray(auditData) ? auditData : [];
    const weatherizationArr = Array.isArray(weatherizationData) ? weatherizationData : [];
    const greenBuildingArr = Array.isArray(greenBuildingData) ? greenBuildingData : [];

    console.log('Fetched comprehensive data:', {
      dbInstallations: dbInstallations?.length || 0,
      recentPermits: solarPermitsArr.length,
      audits: auditArr.length,
      weatherization: weatherizationArr.length,
      greenBuildings: greenBuildingArr.length
    });

    // Aggregate data for heatmap from database installations
    const permitsByZip: { [key: string]: number } = {};
    const coordinatesByZip: { [key: string]: [number, number] } = {};

    // Process database installations
    (dbInstallations || []).forEach((installation: any) => {
      const zip = installation.original_zip?.substring(0, 5);
      if (zip && installation.latitude && installation.longitude) {
        permitsByZip[zip] = (permitsByZip[zip] || 0) + 1;
        if (!coordinatesByZip[zip]) {
          coordinatesByZip[zip] = [parseFloat(installation.longitude), parseFloat(installation.latitude)];
        }
      }
    });

    // Add recent API permits (avoiding duplicates)
    const dbProjectIds = new Set((dbInstallations || []).map((i: any) => i.project_id).filter(Boolean));
    
    solarPermitsArr.forEach((item: any) => {
      // Skip if already in database
      if (dbProjectIds.has(item.permit_number)) return;
      
      const zip = item.original_zip || item.zip || item.zip_code || item.zipcode || item.customer_zip || item.customer_zip_code;
      if (!zip) return;

      permitsByZip[zip] = (permitsByZip[zip] || 0) + 1;

      if (!coordinatesByZip[zip]) {
        let lng: number | undefined;
        let lat: number | undefined;

        if (item.location?.coordinates && Array.isArray(item.location.coordinates) && item.location.coordinates.length === 2) {
          lng = Number(item.location.coordinates[0]);
          lat = Number(item.location.coordinates[1]);
        } else if (item.location?.longitude && item.location?.latitude) {
          lng = Number(item.location.longitude);
          lat = Number(item.location.latitude);
        } else if (item.longitude && item.latitude) {
          lng = Number(item.longitude);
          lat = Number(item.latitude);
        }

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          coordinatesByZip[zip] = [lng as number, lat as number];
        }
      }
    });

    // Create heatmap-friendly data
    const heatmapData = Object.entries(permitsByZip)
      .filter(([zip]) => coordinatesByZip[zip])
      .map(([zip, count]) => ({
        zip,
        count,
        coordinates: coordinatesByZip[zip],
        intensity: Math.min((count as number) / 10, 1) // Normalize intensity (0-1 scale)
      }))
      .sort((a, b) => b.count - a.count);

    console.log('Heatmap aggregation:', {
      zipsWithPermits: Object.keys(permitsByZip).length,
      zipsWithCoordinates: Object.keys(coordinatesByZip).length,
      heatmapPoints: heatmapData.length,
      sample: heatmapData.slice(0, 3)
    });

    // Use Lovable AI to generate strategic recommendations
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Aggregate statistics for AI prompt (database + API, avoiding duplicates)
    const uniqueRecentPermits = solarPermitsArr.filter((p: any) => !dbProjectIds.has(p.permit_number)).length;
    const totalSolarPermits = (dbInstallations?.length || 0) + uniqueRecentPermits;
    const totalAudits = auditArr.reduce((sum: number, a: any) => sum + (parseInt(a.all_homes_audited) || 0), 0);
    const totalWeatherization = weatherizationArr.length;
    const avgGreenBuildingRating = greenBuildingArr.length > 0
      ? (greenBuildingArr.reduce((sum: number, b: any) => sum + (parseFloat(b.star_rating) || 0), 0) / greenBuildingArr.length).toFixed(1)
      : 'N/A';

    // Build personalized context from lifestyle data
    let personalContext = '';
    if (lifestyleData) {
      personalContext = `

👤 USER PROFILE:
- Housing: ${lifestyleData.housingStatus === 'own' ? 'Homeowner' : 'Renter'} in ${lifestyleData.homeType}
- Current Energy: ${lifestyleData.currentEnergy}
- Transportation: ${lifestyleData.transportation}
- Commute: ${lifestyleData.commuteType}
- Interests: ${lifestyleData.interests.join(', ')}

PERSONALIZATION REQUIREMENTS:
- Tailor recommendations to their housing situation (renters have different options than owners)
- Acknowledge their current setup and suggest next logical steps
- Prioritize their stated interests while still following the impact framework
- Provide specific, actionable advice they can take based on their circumstances`;
    }

    const aiPrompt = `You are a clean energy strategist for Austin, Texas. Write a CONCISE ${lifestyleData ? 'PERSONALIZED' : ''} strategic overview based on this data:

📊 AUSTIN CLEAN ENERGY SNAPSHOT:
- Total Solar Permits: ${totalSolarPermits}
- Total Energy Audits: ${totalAudits}
- Weatherization Projects: ${totalWeatherization}
- Green Building Avg Rating: ${avgGreenBuildingRating} stars
- Top Solar ZIP Codes: ${heatmapData.slice(0, 5).map(d => `${d.zip} (${d.count} permits)`).join(', ')}
${personalContext}

📋 PRIORITY FRAMEWORK & EXPERT CONTEXT:
${knowledge.priorities}

💡 EXPERT KNOWLEDGE & BEST PRACTICES:
${knowledge.expertContext}

🔗 AVAILABLE RESOURCES (use specific links in recommendations):
${knowledge.resources}
${getExternalContext(knowledge)}

Write a punchy, scannable ${lifestyleData ? 'personalized ' : ''}strategic plan using this EXACT structure:

**${lifestyleData ? 'Your Personalized Overview' : 'Executive Summary'}** (3-4 sentences)
${lifestyleData ? 'Address their specific situation and acknowledge what they\'re already doing right. Then highlight their top opportunity aligned with impact priorities.' : 'Brief snapshot of Austin\'s clean energy momentum and top opportunity aligned with impact priorities.'}

**Priority Actions${lifestyleData ? ' For You' : ''}** (3 items max, 2-3 sentences each)
${lifestyleData ? 'Customized to their housing, transportation, and interests. Focus on highest-impact areas they can actually act on.' : 'Focus on the highest-impact areas from the framework above. Include specific actions.'}
1. **[Title]**: [What + Expected Impact${lifestyleData ? ' + Why it fits their situation' : ' + Connection to top priorities'}]
2. **[Title]**: [What + Expected Impact${lifestyleData ? ' + Why it fits their situation' : ' + Connection to top priorities'}]  
3. **[Title]**: [What + Expected Impact${lifestyleData ? ' + Why it fits their situation' : ' + Connection to top priorities'}]

**Quick Wins** (3-4 bullet points)
${lifestyleData ? 'Immediate actions THEY can take in the next 30-90 days based on their situation.' : 'Immediate actions the city can take in the next 90 days that align with impact priorities.'}

**Next Steps** (3-4 bullet points)
${lifestyleData ? 'Specific resources, programs, and actions for their situation (e.g., "Check Austin Energy rebates for...", "Join a local climate action group...", "Schedule a free energy audit...").' : 'Specific actions with responsible parties (e.g., "Austin Energy should expand EV charging...", "City Council could fast-track heat pump rebates...").'}

Keep it SHORT, ACTIONABLE, and SPECIFIC. ${lifestyleData ? 'Make it feel personally relevant without being preachy.' : 'Emphasize high-impact actions over lower-impact ones.'} Use markdown **bold** for emphasis.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a strategic climate policy advisor with expertise in urban clean energy transitions, community organizing, and data-driven decision making.' },
          { role: 'user', content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate recommendations');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        overview: content,
        heatmapData,
        dataPoints: {
          solarPermits: solarPermitsArr.length,
          energyAudits: totalAudits,
          weatherizationProjects: weatherizationArr.length,
          greenBuildings: greenBuildingArr.length,
          avgGreenBuildingRating
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-recommendations function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
