import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
};

// Normalize address for matching (same logic as import function)
function normalizeAddress(address: string): string {
  if (!address) return '';
  
  return address
    .toUpperCase()
    .trim()
    .replace(/\s+(APT|UNIT|STE|SUITE|#)\s*[\w-]+$/i, '')
    .replace(/\bSTREET\b/g, 'ST')
    .replace(/\bDRIVE\b/g, 'DR')
    .replace(/\bAVENUE\b/g, 'AVE')
    .replace(/\bBOULEVARD\b/g, 'BLVD')
    .replace(/\bLANE\b/g, 'LN')
    .replace(/\bROAD\b/g, 'RD')
    .replace(/\bCOURT\b/g, 'CT')
    .replace(/\bCIRCLE\b/g, 'CIR')
    .replace(/\bPLACE\b/g, 'PL')
    .replace(/\bTERRACE\b/g, 'TER')
    .replace(/\bPARKWAY\b/g, 'PKWY')
    .replace(/\bHIGHWAY\b/g, 'HWY')
    .replace(/\bNORTH\b/g, 'N')
    .replace(/\bSOUTH\b/g, 'S')
    .replace(/\bEAST\b/g, 'E')
    .replace(/\bWEST\b/g, 'W')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

// Calculate similarity percentage
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return ((maxLength - distance) / maxLength) * 100;
}

// Check if dates are within specified days of each other
function datesWithinDays(date1: string | null, date2: string | null, days: number): boolean {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays <= days;
}

async function validateAdminToken(supabaseClient: any, token: string): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('admin_sessions')
    .select('id, expires_at')
    .eq('token', token)
    .single();

  if (error || !data) return false;
  
  const expiresAt = new Date((data as { expires_at: string }).expires_at);
  return expiresAt > new Date();
}

interface SolarInstallation {
  id: string;
  address: string;
  installed_kw: number | null;
  completed_date: string | null;
}

interface PIRInstallation {
  id: string;
  address: string;
  address_normalized: string | null;
  system_kw: number | null;
  interconnection_date: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminToken = req.headers.get('x-admin-token');
    if (!adminToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const isValidToken = await validateAdminToken(supabaseClient, adminToken);
    if (!isValidToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired admin token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting data source matching...');

    const stats = {
      newMatches: 0,
      exactMatches: 0,
      fuzzyMatches: 0,
      dateCorrelatedMatches: 0,
      processed: 0,
      errors: [] as string[]
    };

    // Get all city records that haven't been matched yet
    const { data: unmatchedCity, error: cityError } = await supabaseClient
      .from('solar_installations')
      .select('id, address, installed_kw, completed_date')
      .not('id', 'in', 
        supabaseClient.from('data_match_results').select('solar_installation_id')
      )
      .limit(1000);

    if (cityError) {
      console.error('Error fetching city records:', cityError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch city records' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all PIR records
    const { data: pirRecords, error: pirError } = await supabaseClient
      .from('pir_installations')
      .select('id, address, address_normalized, system_kw, interconnection_date');

    if (pirError) {
      console.error('Error fetching PIR records:', pirError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch PIR records' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pirRecords || pirRecords.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          stats: { ...stats, message: 'No PIR records available for matching' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${unmatchedCity?.length || 0} unmatched city records against ${pirRecords.length} PIR records`);

    // Build a map of normalized PIR addresses for quick lookup
    const pirByNormalizedAddress = new Map<string, PIRInstallation[]>();
    for (const pir of pirRecords) {
      const normalized = pir.address_normalized || normalizeAddress(pir.address);
      if (!pirByNormalizedAddress.has(normalized)) {
        pirByNormalizedAddress.set(normalized, []);
      }
      pirByNormalizedAddress.get(normalized)!.push(pir);
    }

    const matchesToInsert: Array<{
      solar_installation_id: string;
      pir_installation_id: string;
      match_confidence: number;
      match_type: string;
      status: string;
    }> = [];

    // Process each unmatched city record
    for (const city of (unmatchedCity || []) as SolarInstallation[]) {
      stats.processed++;
      
      const normalizedCityAddress = normalizeAddress(city.address);
      
      // Pass 1: Exact normalized address match
      const exactMatches = pirByNormalizedAddress.get(normalizedCityAddress);
      if (exactMatches && exactMatches.length > 0) {
        // Find best match if multiple (prefer matching dates/kW)
        let bestMatch = exactMatches[0];
        let bestConfidence = 90;
        
        for (const pir of exactMatches) {
          let confidence = 90;
          
          // Boost for date correlation
          if (datesWithinDays(city.completed_date, pir.interconnection_date, 30)) {
            confidence += 5;
          }
          
          // Boost for kW match
          if (city.installed_kw && pir.system_kw) {
            const kwDiff = Math.abs(city.installed_kw - pir.system_kw) / Math.max(city.installed_kw, pir.system_kw);
            if (kwDiff < 0.05) confidence += 5;
          }
          
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = pir;
          }
        }
        
        matchesToInsert.push({
          solar_installation_id: city.id,
          pir_installation_id: bestMatch.id,
          match_confidence: bestConfidence,
          match_type: 'exact_address',
          status: bestConfidence >= 95 ? 'confirmed' : 'pending_review'
        });
        
        stats.exactMatches++;
        stats.newMatches++;
        continue;
      }
      
      // Pass 2: Fuzzy address match
      let bestFuzzyMatch: PIRInstallation | null = null;
      let bestFuzzyConfidence = 0;
      
      for (const pir of pirRecords) {
        const pirNormalized = pir.address_normalized || normalizeAddress(pir.address);
        const similarity = calculateSimilarity(normalizedCityAddress, pirNormalized);
        
        if (similarity >= 85) {
          let confidence = similarity * 0.85; // Scale down to leave room for boosts
          
          // Boost for date correlation
          if (datesWithinDays(city.completed_date, pir.interconnection_date, 60)) {
            confidence += 10;
          }
          
          // Boost for kW match
          if (city.installed_kw && pir.system_kw) {
            const kwDiff = Math.abs(city.installed_kw - pir.system_kw) / Math.max(city.installed_kw, pir.system_kw);
            if (kwDiff < 0.1) confidence += 5;
          }
          
          if (confidence > bestFuzzyConfidence) {
            bestFuzzyConfidence = confidence;
            bestFuzzyMatch = pir;
          }
        }
      }
      
      if (bestFuzzyMatch && bestFuzzyConfidence >= 70) {
        matchesToInsert.push({
          solar_installation_id: city.id,
          pir_installation_id: bestFuzzyMatch.id,
          match_confidence: Math.round(bestFuzzyConfidence),
          match_type: 'fuzzy_address',
          status: 'pending_review'
        });
        
        stats.fuzzyMatches++;
        stats.newMatches++;
      }
    }

    // Batch insert matches
    if (matchesToInsert.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < matchesToInsert.length; i += batchSize) {
        const batch = matchesToInsert.slice(i, i + batchSize);
        
        const { error: insertError } = await supabaseClient
          .from('data_match_results')
          .upsert(batch, {
            onConflict: 'solar_installation_id,pir_installation_id',
            ignoreDuplicates: true
          });
        
        if (insertError) {
          console.error('Error inserting matches:', insertError);
          stats.errors.push(`Batch insert error: ${insertError.message}`);
        }
      }
    }

    console.log('Matching complete:', stats);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Matching error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
