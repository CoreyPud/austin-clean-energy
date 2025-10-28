import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
// Removed external knowledge import to prevent boot errors

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting: 15 requests per hour per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 15;
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
function validateZipCode(zipCode: string): { valid: boolean; error?: string } {
  if (!zipCode || typeof zipCode !== 'string') {
    return { valid: false, error: 'ZIP code is required' };
  }
  
  const trimmed = zipCode.trim();
  
  // Must be exactly 5 digits
  if (!/^\d{5}$/.test(trimmed)) {
    return { valid: false, error: 'ZIP code must be exactly 5 digits' };
  }
  
  return { valid: true };
}

const getExternalContext = (_: any) => '';

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

    const { zipCode } = await req.json();
    
    // Input validation
    const zipValidation = validateZipCode(zipCode);
    if (!zipValidation.valid) {
      return new Response(
        JSON.stringify({ error: zipValidation.error }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Analyzing area for ZIP code:', zipCode);

    // Use inlined knowledge (fallback to avoid cross-file imports in Edge Function)
    const knowledge = { priorities: '', resources: '', expertContext: '' } as const;
    console.log('Using inlined knowledge context for area analysis');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query database for existing installations in this ZIP
    const { data: dbInstallations, error: dbError } = await supabase
      .from('solar_installations')
      .select('*')
      .eq('original_zip', zipCode)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (dbError) {
      console.error('Database query error:', dbError);
    }

    console.log(`Found ${dbInstallations?.length || 0} installations in database for ZIP ${zipCode}`);

    // Fetch recent permits from Austin API (last 180 days for better coverage)
    const oneEightyDaysAgo = new Date();
    oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);
    const recentDate = oneEightyDaysAgo.toISOString().split('T')[0];
    
    const [solarPermitsData, auditData, weatherizationData] = await Promise.all([
      fetch(`https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&$where=issue_date>='${recentDate}T00:00:00.000'&$limit=2000`).then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/tk9p-m8c7.json?$limit=100').then(r => r.json()),
      fetch('https://data.austintexas.gov/resource/fnns-rqqh.json?$limit=50').then(r => r.json())
    ]);

    // Normalize to arrays to avoid runtime errors when the API returns an object
    const toArray = (v: any) => Array.isArray(v) ? v : (Array.isArray(v?.data) ? v.data : (Array.isArray(v?.results) ? v.results : []));
    const permits = toArray(solarPermitsData);
    const audits = toArray(auditData);
    const weather = toArray(weatherizationData);

    console.log('Fetched recent permits:', permits.length, 'Audits:', audits.length, 'Weatherization:', weather.length);
    
    // Helper function to normalize addresses for comparison
    const normalizeAddress = (addr: string) => {
      return addr.toLowerCase()
        .replace(/\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane)\b/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };
    
    // Helper function to calculate distance between coordinates (in meters)
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Process database installations (existing installations)
    const dbLocations = (dbInstallations || [])
      .filter((item: any) => item.latitude && item.longitude)
      .slice(0, 80)
      .map((item: any) => ({
        coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)] as [number, number],
        title: item.address.split(',')[0] || 'Solar Installation',
        address: item.address || 'Address not available',
        capacity: item.installed_kw ? `${item.installed_kw.toFixed(2)} kW` : 'Capacity not specified',
        programType: item.permit_class || 'Solar Installation',
        installDate: item.completed_date || item.issued_date,
        id: item.project_id || item.id,
        source: 'existing',
        color: '#22c55e'
      }));

    // Process recent API permits (filter for ZIP and avoid duplicates)
    const dbProjectIds = new Set((dbInstallations || []).map((i: any) => i.project_id).filter(Boolean));
    
    // Build index of existing installations for duplicate detection
    const dbAddressMap = new Map();
    (dbInstallations || []).forEach((item: any) => {
      if (item.address) {
        const normalized = normalizeAddress(item.address);
        dbAddressMap.set(normalized, { lat: item.latitude, lng: item.longitude });
      }
    });
    
    let totalPermitsFetched = 0;
    let permitsInZip = 0;
    let duplicatesByProjectId = 0;
    let duplicatesByAddress = 0;
    let duplicatesByCoordinates = 0;
    let missingCoordinates = 0;
    let validPendingPermits = 0;
    
    const apiLocations = permits
      .filter((item: any) => {
        totalPermitsFetched++;
        const itemZip = item.original_zip?.toString().substring(0, 5);
        
        // First filter: must be in target ZIP
        if (itemZip !== zipCode) return false;
        permitsInZip++;
        
        // Check duplicate by project ID
        if (dbProjectIds.has(item.permit_number)) {
          duplicatesByProjectId++;
          return false;
        }
        
        // Check duplicate by address
        const itemAddress = item.original_address1 || item.permit_location || '';
        if (itemAddress) {
          const normalizedItemAddr = normalizeAddress(itemAddress);
          if (dbAddressMap.has(normalizedItemAddr)) {
            duplicatesByAddress++;
            return false;
          }
        }
        
        // Check duplicate by coordinate proximity (within 50 meters)
        let itemLat: number | undefined;
        let itemLng: number | undefined;
        
        if (item.latitude && item.longitude) {
          itemLat = parseFloat(item.latitude);
          itemLng = parseFloat(item.longitude);
        } else if (item.location?.latitude && item.location?.longitude) {
          itemLat = parseFloat(item.location.latitude);
          itemLng = parseFloat(item.location.longitude);
        } else if (Array.isArray(item.location?.coordinates) && item.location.coordinates.length === 2) {
          const [lngC, latC] = item.location.coordinates;
          itemLat = Number(latC);
          itemLng = Number(lngC);
        }
        
        if (!Number.isFinite(itemLat as number) || !Number.isFinite(itemLng as number)) {
          missingCoordinates++;
          return false;
        }
        
        // Check if coordinates are close to any existing installation
        for (const [_, coords] of dbAddressMap) {
          if (coords.lat && coords.lng) {
            const distance = getDistance(itemLat!, itemLng!, parseFloat(coords.lat), parseFloat(coords.lng));
            if (distance < 50) { // Within 50 meters
              duplicatesByCoordinates++;
              return false;
            }
          }
        }
        
        validPendingPermits++;
        return true;
      })
      .map((item: any, idx: number) => {
        let lat: number | undefined;
        let lng: number | undefined;

        // Try multiple coordinate extraction methods
        if (item.latitude && item.longitude) {
          lat = parseFloat(item.latitude);
          lng = parseFloat(item.longitude);
        } else if (item.location?.latitude && item.location?.longitude) {
          lat = parseFloat(item.location.latitude);
          lng = parseFloat(item.location.longitude);
        } else if (Array.isArray(item.location?.coordinates) && item.location.coordinates.length === 2) {
          const [lngC, latC] = item.location.coordinates;
          lat = Number(latC);
          lng = Number(lngC);
        } else if (item.geocoded_location?.coordinates) {
          const coords = item.geocoded_location.coordinates;
          if (Array.isArray(coords) && coords.length === 2) {
            lng = Number(coords[0]);
            lat = Number(coords[1]);
          }
        }

        const fullAddress = item.original_address1 || item.permit_location || item.street_name || 'Address not available';
        const title = item.original_address1 ? (item.original_address1.split(',')[0]) : `Pending Permit ${idx + 1}`;

        return {
          coordinates: [lng as number, lat as number] as [number, number],
          title,
          address: fullAddress,
          capacity: item.description || item.project_name || 'Solar Installation',
          programType: 'Pending Permit',
          installDate: item.issue_date ? new Date(item.issue_date).toLocaleDateString() : undefined,
          id: item.permit_number || `solar-pending-${idx}`,
          source: 'api',
          color: '#f59e0b'
        };
      })
      .slice(0, 20);
    
    // Log filtering statistics
    console.log('Permit filtering stats:', {
      totalFetched: totalPermitsFetched,
      inTargetZip: permitsInZip,
      filteredOut: {
        byProjectId: duplicatesByProjectId,
        byAddress: duplicatesByAddress,
        byCoordinates: duplicatesByCoordinates,
        missingCoords: missingCoordinates
      },
      validPending: validPendingPermits,
      finalShown: apiLocations.length
    });

    // Combine both sources
    const locations = [...dbLocations, ...apiLocations];
    console.log(`Created ${locations.length} markers: ${dbLocations.length} existing, ${apiLocations.length} recent`);

    // Use Lovable AI to analyze the data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `Analyze this Austin energy data for ZIP code ${zipCode}.

📊 DATA SUMMARY:
Total Solar Installations: ${(dbInstallations?.length || 0) + apiLocations.length}
- Existing Installations: ${dbInstallations?.length || 0}
- Pending Permits (180 days): ${apiLocations.length}
Energy Audits: ${audits.length} completed
Weatherization Projects: ${weather.length} in progress

📋 PRIORITY FRAMEWORK & CONTEXT:
${knowledge.priorities}

💡 EXPERT KNOWLEDGE & BEST PRACTICES:
${knowledge.expertContext}

🔗 AVAILABLE RESOURCES (use specific links in your Take Action section):
${knowledge.resources}
${getExternalContext(knowledge)}

Provide a punchy, scannable analysis using this structure:

**Quick Take**
One sentence summarizing the area's clean energy status.

**Solar Adoption**
2-3 short sentences on solar trends and growth potential.

**Efficiency Gap**
2-3 short sentences on energy audit and weatherization opportunities.

**Battery Storage**
2-3 short sentences on storage recommendations and grid resilience.

**Take Action**
Include 3-4 specific Austin resources with actual links from the AVAILABLE RESOURCES section above.

Format with markdown: Use **bold** for section headers, keep sentences short and punchy. Use bullet points for resources.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a clean energy expert. Write in a punchy, scannable style with short sentences. Use markdown formatting for readability.' },
          { role: 'user', content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate AI analysis');
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        zipCode,
        insights,
        locations,
        dataPoints: {
          solarPrograms: (dbInstallations?.length || 0) + apiLocations.length,
          solarPermits: (dbInstallations?.length || 0) + apiLocations.length,
          energyAudits: audits.length,
          weatherizationProjects: weather.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in area-analysis function:', error);
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
