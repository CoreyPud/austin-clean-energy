import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
};

// Normalize installer/company name for matching
function normalizeCompanyName(name: string): string {
  if (!name) return '';
  
  return name
    .toUpperCase()
    .trim()
    // Remove common suffixes
    .replace(/\b(LLC|INC|CORP|CORPORATION|CO|COMPANY|LTD|LIMITED|LP|LLP)\b\.?/g, '')
    // Remove "DBA" and everything after
    .replace(/\bDBA\b.*/i, '')
    // Remove "THE" prefix
    .replace(/^THE\s+/i, '')
    // Normalize common solar terms
    .replace(/\bSOLAR\s*(PANEL|POWER|ENERGY|SYSTEM|INSTALL)S?\b/g, 'SOLAR')
    // Remove punctuation
    .replace(/[.,'"()-]/g, '')
    // Normalize whitespace
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

// Get the day difference between two dates
function getDaysDifference(date1: string | null, date2: string | null): number | null {
  if (!date1 || !date2) return null;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  return diffMs / (1000 * 60 * 60 * 24);
}

// Calculate kW match score (0-100)
function getKwMatchScore(kw1: number | null, kw2: number | null): number {
  if (kw1 === null || kw2 === null || kw1 === 0 || kw2 === 0) return 0;
  
  const percentDiff = Math.abs(kw1 - kw2) / Math.max(kw1, kw2);
  
  if (percentDiff === 0) return 100;
  if (percentDiff <= 0.02) return 95;  // Within 2%
  if (percentDiff <= 0.05) return 85;  // Within 5%
  if (percentDiff <= 0.10) return 70;  // Within 10%
  if (percentDiff <= 0.15) return 50;  // Within 15%
  if (percentDiff <= 0.25) return 30;  // Within 25%
  return 0;
}

// Extract fiscal year from date (Oct 1 - Sep 30)
function getFiscalYear(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();
  
  // Fiscal year starts Oct 1, so Oct-Dec belong to next FY
  return month >= 9 ? year + 1 : year;
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
  issued_date: string | null;
  applied_date: string | null;
  contractor_company: string | null;
  calendar_year_issued: number | null;
}

interface PIRInstallation {
  id: string;
  address: string;  // This is actually a synthetic address (installer + date + kW)
  address_normalized: string | null;
  system_kw: number | null;
  interconnection_date: string | null;
  raw_data: {
    installer?: string;
    fiscal_year?: string;
    battery_kwh?: number | null;
    cost?: number | null;
    ae_rebate?: number | null;
  } | null;
}

interface MatchCandidate {
  pir: PIRInstallation;
  confidence: number;
  matchType: string;
  matchDetails: string[];
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

    console.log('Starting enhanced data source matching...');

    const stats = {
      newMatches: 0,
      exactKwDateMatches: 0,
      installerMatches: 0,
      dateRangeMatches: 0,
      fuzzyMatches: 0,
      processed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Get all city records that haven't been matched yet
    // Fetch more fields for better matching
    const { data: unmatchedCity, error: cityError } = await supabaseClient
      .from('solar_installations')
      .select('id, address, installed_kw, completed_date, issued_date, applied_date, contractor_company, calendar_year_issued')
      .not('id', 'in', 
        supabaseClient.from('data_match_results').select('solar_installation_id')
      )
      .limit(2000);

    if (cityError) {
      console.error('Error fetching city records:', cityError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch city records' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all PIR records that haven't been matched yet
    const { data: pirRecords, error: pirError } = await supabaseClient
      .from('pir_installations')
      .select('id, address, address_normalized, system_kw, interconnection_date, raw_data')
      .not('id', 'in',
        supabaseClient.from('data_match_results').select('pir_installation_id')
      );

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

    console.log(`Processing ${unmatchedCity?.length || 0} unmatched city records against ${pirRecords.length} unmatched PIR records`);

    // Build indexes for quick lookup
    const pirByKwRange = new Map<string, PIRInstallation[]>();  // kW rounded to nearest 0.5
    const pirByFiscalYear = new Map<number, PIRInstallation[]>();
    const pirByInstaller = new Map<string, PIRInstallation[]>();
    
    for (const pir of pirRecords) {
      // Index by kW (rounded to 0.5 kW)
      if (pir.system_kw) {
        const kwKey = (Math.round(pir.system_kw * 2) / 2).toString();
        if (!pirByKwRange.has(kwKey)) pirByKwRange.set(kwKey, []);
        pirByKwRange.get(kwKey)!.push(pir);
      }
      
      // Index by fiscal year
      const fy = pir.raw_data?.fiscal_year ? parseInt(pir.raw_data.fiscal_year) : getFiscalYear(pir.interconnection_date);
      if (fy) {
        if (!pirByFiscalYear.has(fy)) pirByFiscalYear.set(fy, []);
        pirByFiscalYear.get(fy)!.push(pir);
      }
      
      // Index by installer name (normalized)
      const installer = pir.raw_data?.installer;
      if (installer) {
        const normalizedInstaller = normalizeCompanyName(installer);
        if (normalizedInstaller) {
          if (!pirByInstaller.has(normalizedInstaller)) pirByInstaller.set(normalizedInstaller, []);
          pirByInstaller.get(normalizedInstaller)!.push(pir);
        }
      }
    }

    const matchesToInsert: Array<{
      solar_installation_id: string;
      pir_installation_id: string;
      match_confidence: number;
      match_type: string;
      status: string;
      reviewed_notes: string;
    }> = [];

    const usedPirIds = new Set<string>();

    // Process each unmatched city record
    for (const city of (unmatchedCity || []) as SolarInstallation[]) {
      stats.processed++;
      
      const candidates: MatchCandidate[] = [];
      
      // Use completed_date as primary, fall back to issued_date
      const cityDate = city.completed_date || city.issued_date;
      const cityFiscalYear = getFiscalYear(cityDate);
      const normalizedContractor = city.contractor_company ? normalizeCompanyName(city.contractor_company) : null;
      
      // Skip if we don't have enough data to match
      if (!city.installed_kw && !cityDate && !normalizedContractor) {
        stats.skipped++;
        continue;
      }

      // PASS 1: Exact kW + Date match (highest confidence)
      // Look for PIR records with same kW and date within 30 days
      if (city.installed_kw && cityDate) {
        const kwKey = (Math.round(city.installed_kw * 2) / 2).toString();
        const nearbyKwRecords = pirByKwRange.get(kwKey) || [];
        
        for (const pir of nearbyKwRecords) {
          if (usedPirIds.has(pir.id)) continue;
          
          const kwScore = getKwMatchScore(city.installed_kw, pir.system_kw);
          const daysDiff = getDaysDifference(cityDate, pir.interconnection_date);
          
          if (kwScore >= 85 && daysDiff !== null && daysDiff <= 30) {
            let confidence = 70;
            const matchDetails: string[] = [];
            
            // kW contributes up to 15 points
            confidence += (kwScore / 100) * 15;
            matchDetails.push(`kW: ${city.installed_kw} vs ${pir.system_kw} (${kwScore}% match)`);
            
            // Date proximity contributes up to 15 points
            const dateScore = daysDiff <= 7 ? 15 : daysDiff <= 14 ? 12 : daysDiff <= 21 ? 8 : 5;
            confidence += dateScore;
            matchDetails.push(`Date: ${daysDiff.toFixed(0)} days apart`);
            
            // Check installer match for bonus
            const pirInstaller = pir.raw_data?.installer;
            if (normalizedContractor && pirInstaller) {
              const installerSimilarity = calculateSimilarity(normalizedContractor, normalizeCompanyName(pirInstaller));
              if (installerSimilarity >= 80) {
                confidence += 10;
                matchDetails.push(`Installer: ${installerSimilarity.toFixed(0)}% similar`);
              }
            }
            
            candidates.push({
              pir,
              confidence: Math.min(confidence, 98),
              matchType: 'exact_kw_date',
              matchDetails
            });
          }
        }
      }

      // PASS 2: Installer + Fiscal Year match
      if (normalizedContractor && cityFiscalYear) {
        // Find PIR records by same installer in same fiscal year
        const installerRecords = pirByInstaller.get(normalizedContractor) || [];
        
        for (const pir of installerRecords) {
          if (usedPirIds.has(pir.id)) continue;
          
          const pirFy = pir.raw_data?.fiscal_year ? parseInt(pir.raw_data.fiscal_year) : getFiscalYear(pir.interconnection_date);
          if (pirFy !== cityFiscalYear) continue;
          
          let confidence = 50;
          const matchDetails: string[] = [];
          matchDetails.push(`Installer match: ${city.contractor_company}`);
          matchDetails.push(`Same fiscal year: FY${cityFiscalYear}`);
          
          // kW similarity boost
          const kwScore = getKwMatchScore(city.installed_kw, pir.system_kw);
          if (kwScore >= 50) {
            confidence += (kwScore / 100) * 20;
            matchDetails.push(`kW: ${city.installed_kw} vs ${pir.system_kw} (${kwScore}% match)`);
          }
          
          // Date proximity boost
          const daysDiff = getDaysDifference(cityDate, pir.interconnection_date);
          if (daysDiff !== null && daysDiff <= 90) {
            const dateBoost = daysDiff <= 30 ? 15 : daysDiff <= 60 ? 10 : 5;
            confidence += dateBoost;
            matchDetails.push(`Date: ${daysDiff.toFixed(0)} days apart`);
          }
          
          candidates.push({
            pir,
            confidence: Math.min(confidence, 90),
            matchType: 'installer_fiscal_year',
            matchDetails
          });
        }
      }

      // PASS 3: Fuzzy installer + kW + broader date range
      if (normalizedContractor && city.installed_kw) {
        for (const [installerKey, records] of pirByInstaller.entries()) {
          const installerSimilarity = calculateSimilarity(normalizedContractor, installerKey);
          if (installerSimilarity < 70) continue;
          
          for (const pir of records) {
            if (usedPirIds.has(pir.id)) continue;
            
            const kwScore = getKwMatchScore(city.installed_kw, pir.system_kw);
            if (kwScore < 50) continue;
            
            let confidence = 35;
            const matchDetails: string[] = [];
            
            matchDetails.push(`Installer: ${installerSimilarity.toFixed(0)}% similar`);
            confidence += (installerSimilarity / 100) * 15;
            
            matchDetails.push(`kW: ${city.installed_kw} vs ${pir.system_kw} (${kwScore}% match)`);
            confidence += (kwScore / 100) * 15;
            
            // Date within same calendar year
            const daysDiff = getDaysDifference(cityDate, pir.interconnection_date);
            if (daysDiff !== null && daysDiff <= 180) {
              const dateBoost = daysDiff <= 60 ? 15 : daysDiff <= 120 ? 10 : 5;
              confidence += dateBoost;
              matchDetails.push(`Date: ${daysDiff.toFixed(0)} days apart`);
            }
            
            if (confidence >= 55) {
              candidates.push({
                pir,
                confidence: Math.min(confidence, 85),
                matchType: 'fuzzy_installer_kw',
                matchDetails
              });
            }
          }
        }
      }

      // PASS 4: Date + kW only (when no installer info)
      if (!normalizedContractor && city.installed_kw && cityDate) {
        for (const pir of pirRecords) {
          if (usedPirIds.has(pir.id)) continue;
          
          const kwScore = getKwMatchScore(city.installed_kw, pir.system_kw);
          const daysDiff = getDaysDifference(cityDate, pir.interconnection_date);
          
          if (kwScore >= 90 && daysDiff !== null && daysDiff <= 14) {
            let confidence = 60;
            const matchDetails: string[] = [];
            
            confidence += (kwScore / 100) * 15;
            matchDetails.push(`kW: ${city.installed_kw} vs ${pir.system_kw} (${kwScore}% match)`);
            
            const dateBoost = daysDiff <= 3 ? 15 : daysDiff <= 7 ? 12 : 8;
            confidence += dateBoost;
            matchDetails.push(`Date: ${daysDiff.toFixed(0)} days apart`);
            
            candidates.push({
              pir,
              confidence: Math.min(confidence, 80),
              matchType: 'date_kw_only',
              matchDetails
            });
          }
        }
      }

      // Select best match
      if (candidates.length > 0) {
        // Sort by confidence descending
        candidates.sort((a, b) => b.confidence - a.confidence);
        const best = candidates[0];
        
        // Only accept if confidence is above threshold
        if (best.confidence >= 55) {
          usedPirIds.add(best.pir.id);
          
          matchesToInsert.push({
            solar_installation_id: city.id,
            pir_installation_id: best.pir.id,
            match_confidence: Math.round(best.confidence),
            match_type: best.matchType,
            status: best.confidence >= 85 ? 'confirmed' : 'pending_review',
            reviewed_notes: best.matchDetails.join('; ')
          });
          
          stats.newMatches++;
          if (best.matchType === 'exact_kw_date') stats.exactKwDateMatches++;
          else if (best.matchType === 'installer_fiscal_year') stats.installerMatches++;
          else if (best.matchType === 'fuzzy_installer_kw') stats.fuzzyMatches++;
          else if (best.matchType === 'date_kw_only') stats.dateRangeMatches++;
        }
      }
    }

    // Batch insert matches
    if (matchesToInsert.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < matchesToInsert.length; i += batchSize) {
        const batch = matchesToInsert.slice(i, i + batchSize);
        
        const { error: insertError } = await supabaseClient
          .from('data_match_results')
          .insert(batch);
        
        if (insertError) {
          console.error('Error inserting matches:', insertError);
          stats.errors.push(`Batch insert error: ${insertError.message}`);
        }
      }
    }

    console.log('Enhanced matching complete:', stats);

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
