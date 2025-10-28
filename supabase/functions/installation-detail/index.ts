import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { loadKnowledge, getExternalContext } from "../_shared/loadKnowledge.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 30 requests per hour per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30;
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
function validateInstallationId(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Installation ID is required' };
  }
  
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Installation ID cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Installation ID is invalid' };
  }
  
  return { valid: true };
}

// Helper to ensure response is an array
const toArray = (data: any): any[] => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

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

    const { id } = await req.json();
    
    // Input validation
    const idValidation = validateInstallationId(id);
    if (!idValidation.valid) {
      return new Response(
        JSON.stringify({ error: idValidation.error }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Fetching installation details for ID:', id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, try to find in database
    const { data: dbInstallation, error: dbError } = await supabase
      .from('solar_installations')
      .select('*')
      .or(`project_id.eq.${id},id.eq.${id}`)
      .single();

    if (dbInstallation && !dbError) {
      console.log('Found installation in database:', dbInstallation);
      // Transform database format to match expected output
      const installation = {
        permit_number: dbInstallation.project_id,
        original_address_1: dbInstallation.address,
        solar_panel_capacity_output_dc_watts: dbInstallation.installed_kw ? dbInstallation.installed_kw * 1000 : null,
        issued_date: dbInstallation.issued_date,
        completed_date: dbInstallation.completed_date,
        work_class: dbInstallation.permit_class,
        status_current: dbInstallation.status_current,
        application_id: dbInstallation.project_id,
        location: dbInstallation.latitude && dbInstallation.longitude ? {
          latitude: dbInstallation.latitude.toString(),
          longitude: dbInstallation.longitude.toString()
        } : null,
        source: 'database'
      };
      
      return new Response(
        JSON.stringify({ installation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback to API if not in database
    console.log('Installation not in database, checking API...');

    let installation: any = null;

    // If the provided id looks like a numeric permit number or application id,
    // query the Austin API directly to avoid pagination/limit mismatches
    const isNumericId = typeof id === 'string' && /^[0-9]+$/.test(id);
    if (isNumericId) {
      try {
        console.log('Querying Austin API by permit_number:', id);
        const res1 = await fetch(`https://data.austintexas.gov/resource/3syk-w9eu.json?permit_number=${id}`);
        const data1 = toArray(await res1.json());
        if (data1.length > 0) {
          installation = data1[0];
        }

        if (!installation) {
          console.log('Not found by permit_number, trying application_id:', id);
          const res2 = await fetch(`https://data.austintexas.gov/resource/3syk-w9eu.json?application_id=${id}`);
          const data2 = toArray(await res2.json());
          if (data2.length > 0) {
            installation = data2[0];
          }
        }
      } catch (e) {
        console.warn('Error querying Austin API by ID:', e);
      }
    }

    // Fallback: fetch a batch and try to match by id or synthetic key
    if (!installation) {
      const response = await fetch('https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&$limit=2000');
      const rawData = await response.json();
      const permits = toArray(rawData);
      
      console.log('Fetched permits from API:', permits.length);

      installation = permits.find((item: any, idx: number) => 
        item.permit_number === id || item.application_id === id || `solar-${idx}` === id
      );
    }

    if (!installation) {
      console.log('Installation not found with ID:', id);
      return new Response(
        JSON.stringify({ error: 'Installation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found installation in API:', installation);
    installation.source = 'api';

    return new Response(
      JSON.stringify({ installation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in installation-detail function:', error);
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
