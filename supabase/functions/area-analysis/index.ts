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

function generateAreaInsights(opts: {
  zipCode: string;
  existingCount: number;
  pendingCount: number;
  auditCount: number;
  weatherCount: number;
}): string {
  const { zipCode, existingCount, pendingCount, auditCount } = opts;

  const activityLevel =
    existingCount > 200 ? "high" :
    existingCount > 75  ? "moderate" :
    existingCount > 20  ? "growing" : "early-stage";

  const activityDesc: Record<string, string> = {
    high: `ZIP ${zipCode} is one of Austin's most active solar neighborhoods`,
    moderate: `ZIP ${zipCode} has solid solar momentum`,
    growing: `ZIP ${zipCode} has a growing solar community`,
    "early-stage": `ZIP ${zipCode} is in the early stages of solar adoption`,
  };

  const pipelineDesc =
    pendingCount > 10 ? `with ${pendingCount} additional permits filed in the last 180 days` :
    pendingCount > 0  ? `with ${pendingCount} new permit${pendingCount > 1 ? "s" : ""} recently filed` :
    "with no new permits filed recently";

  const sections: string[] = [];

  sections.push(
    `**Quick Take**\n${activityDesc[activityLevel]} — ${existingCount.toLocaleString()} installations on record, ${pipelineDesc}.`
  );

  let solarBody = `There are ${existingCount.toLocaleString()} completed solar installations in ZIP ${zipCode}`;
  if (pendingCount > 0) solarBody += `, with ${pendingCount} more permitted in the last six months`;
  solarBody += ".";
  if (existingCount > 100) {
    solarBody += ` That level of adoption means local installers and inspectors are experienced here, which typically translates to faster permitting and more competitive pricing.`;
  } else if (existingCount < 30) {
    solarBody += ` Lower adoption can mean fewer nearby installer references — worth asking for local project examples when getting quotes.`;
  }
  sections.push(`**Solar Adoption**\n${solarBody}`);

  const efficiencyBody = auditCount > 0
    ? `Austin Energy has completed ${auditCount} energy audits in this area recently. In Austin's climate, attic insulation and AC efficiency improvements typically yield the highest ROI — a free audit identifies exactly where your home is losing energy.`
    : `Home energy audits are available at no cost to Austin Energy customers and are one of the fastest ways to reduce your bill. In Austin's heat, attic insulation and AC efficiency are usually the highest-ROI fixes.`;
  sections.push(`**Efficiency Gap**\n${efficiencyBody}`);

  sections.push(
    `**Battery Storage**\nBattery storage pairs well with solar in Austin, where summer grid stress can cause outages. A 10–13 kWh battery keeps critical loads running and lets you shift usage off-peak. Austin Energy offers a storage rebate, and costs are lowest when installed alongside a new solar system.`
  );

  const resources = [
    `- [Get a solar savings estimate](https://austincleanenergy.org/property-assessment) — see your roof's potential in minutes`,
    `- [Austin Energy Solar Rebate](https://austinenergy.com/green-power/solar-solutions/for-your-home) — up to $2,500 for residential installs`,
    `- [Free Home Energy Audit](https://austinenergy.com/energy-efficiency/rebates-incentives/residential/home-improvements/home-energy-savings) — required before some rebates`,
    `- [Battery Storage Incentive](https://austinenergy.com/green-power/solar-solutions/for-your-home/battery-storage-incentive) — Austin Energy rebate for paired systems`,
  ];
  sections.push(`**Take Action**\n${resources.join("\n")}`);

  return sections.join("\n\n");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
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

    // Query database for existing installations in this ZIP (using view for corrections)
    const { data: dbInstallations, error: dbError } = await supabase
      .from('solar_installations_view')
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

    const insights = generateAreaInsights({
      zipCode,
      existingCount: dbInstallations?.length || 0,
      pendingCount: apiLocations.length,
      auditCount: audits.length,
      weatherCount: weather.length,
    });

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
    return new Response(
      JSON.stringify({ error: 'An internal error occurred. Please try again.' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
