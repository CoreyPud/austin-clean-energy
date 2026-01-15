import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
};

// Normalize address for matching
function normalizeAddress(address: string): string {
  if (!address) return '';
  
  return address
    .toUpperCase()
    .trim()
    // Remove apartment/unit numbers for base matching
    .replace(/\s+(APT|UNIT|STE|SUITE|#)\s*[\w-]+$/i, '')
    // Standardize street suffixes
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
    // Remove punctuation
    .replace(/[.,]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse date in various formats
function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const cleaned = dateStr.trim();
  
  // Try various date formats
  const formats = [
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // MM-DD-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];
  
  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      let year, month, day;
      if (format === formats[1]) {
        // YYYY-MM-DD
        [, year, month, day] = match;
      } else {
        // MM/DD/YYYY or MM-DD-YYYY
        [, month, day, year] = match;
      }
      
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  
  // Try native Date parsing as fallback
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  return null;
}

// Parse a CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Parse numeric kW value
function parseKW(value: string): number | null {
  if (!value || value.trim() === '') return null;
  
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

async function validateAdminToken(supabaseClient: any, token: string): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('admin_sessions')
    .select('id, expires_at')
    .eq('token', token)
    .single();

  if (error || !data) return false;
  
  const expiresAt = new Date(data.expires_at);
  return expiresAt > new Date();
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

    const { csvData } = await req.json();
    
    if (!csvData || typeof csvData !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'CSV data required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lines = csvData.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'CSV must have header and at least one data row' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse header row
    const headers = parseCSVLine(lines[0]).map(h => h.toUpperCase().replace(/\s+/g, '_'));
    console.log('CSV Headers:', headers);

    // Map column indices - flexible matching for various column names
    const columnMap: Record<string, number> = {};
    
    const columnMappings: Record<string, string[]> = {
      'pir_number': ['PIR_NUMBER', 'PIR', 'PIR_NO', 'PIRNUMBER'],
      'address': ['ADDRESS', 'STREET_ADDRESS', 'PROPERTY_ADDRESS', 'SERVICE_ADDRESS'],
      'city': ['CITY', 'MUNICIPALITY'],
      'state': ['STATE', 'ST'],
      'zip': ['ZIP', 'ZIP_CODE', 'ZIPCODE', 'POSTAL_CODE'],
      'system_kw': ['SYSTEM_KW', 'KW', 'CAPACITY', 'CAPACITY_KW', 'SIZE_KW', 'SYSTEMKW'],
      'interconnection_date': ['INTERCONNECTION_DATE', 'INTERCONNECT_DATE', 'DATE', 'INSTALL_DATE', 'COMPLETION_DATE'],
      'customer_type': ['CUSTOMER_TYPE', 'CUSTOMERTYPE', 'TYPE', 'CUST_TYPE'],
      'fuel_type': ['FUEL_TYPE', 'FUELTYPE', 'FUEL'],
      'technology': ['TECHNOLOGY', 'TECH', 'SYSTEM_TYPE']
    };

    for (const [key, possibleNames] of Object.entries(columnMappings)) {
      for (const name of possibleNames) {
        const idx = headers.indexOf(name);
        if (idx !== -1) {
          columnMap[key] = idx;
          break;
        }
      }
    }

    console.log('Column mapping:', columnMap);

    // Validate we have minimum required columns
    if (columnMap['address'] === undefined) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Required column ADDRESS not found in CSV. Found columns: ' + headers.join(', ')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stats = {
      total: lines.length - 1,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };

    const batchSize = 100;
    const records: any[] = [];

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        stats.skipped++;
        continue;
      }

      try {
        const values = parseCSVLine(line);
        
        const getValue = (key: string): string => {
          const idx = columnMap[key];
          return idx !== undefined && idx < values.length ? values[idx] : '';
        };

        const address = getValue('address');
        if (!address) {
          stats.skipped++;
          continue;
        }

        // Build full address with city, state, zip if available
        const city = getValue('city');
        const state = getValue('state');
        const zip = getValue('zip');
        
        let fullAddress = address;
        if (city || state || zip) {
          const parts = [address];
          if (city) parts.push(city);
          if (state || zip) parts.push([state, zip].filter(Boolean).join(' '));
          fullAddress = parts.join(', ');
        }

        const record = {
          pir_number: getValue('pir_number') || null,
          address: fullAddress,
          address_normalized: normalizeAddress(fullAddress),
          system_kw: parseKW(getValue('system_kw')),
          interconnection_date: parseDate(getValue('interconnection_date')),
          customer_type: getValue('customer_type') || null,
          fuel_type: getValue('fuel_type') || null,
          technology: getValue('technology') || null,
          raw_data: Object.fromEntries(
            headers.map((h, idx) => [h, values[idx] || null])
          )
        };

        records.push(record);

        // Process in batches
        if (records.length >= batchSize) {
          const result = await processBatch(supabaseClient, records, stats);
          records.length = 0;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        stats.errors.push(`Row ${i + 1}: ${message}`);
      }
    }

    // Process remaining records
    if (records.length > 0) {
      await processBatch(supabaseClient, records, stats);
    }

    console.log('Import complete:', stats);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Import error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processBatch(
  supabaseClient: any, 
  records: any[], 
  stats: { inserted: number; updated: number; skipped: number; errors: string[] }
) {
  // Separate records with and without PIR numbers
  const withPir = records.filter(r => r.pir_number);
  const withoutPir = records.filter(r => !r.pir_number);

  // Upsert records with PIR numbers
  if (withPir.length > 0) {
    const { data, error } = await supabaseClient
      .from('pir_installations')
      .upsert(withPir, { 
        onConflict: 'pir_number',
        ignoreDuplicates: false
      })
      .select('id');

    if (error) {
      console.error('Upsert error:', error);
      stats.errors.push(`Batch upsert error: ${error.message}`);
    } else {
      // Count as inserted (we can't easily distinguish updates from inserts with upsert)
      stats.inserted += data?.length || 0;
    }
  }

  // Insert records without PIR numbers (can't upsert without unique key)
  if (withoutPir.length > 0) {
    const { data, error } = await supabaseClient
      .from('pir_installations')
      .insert(withoutPir)
      .select('id');

    if (error) {
      console.error('Insert error:', error);
      stats.errors.push(`Batch insert error: ${error.message}`);
    } else {
      stats.inserted += data?.length || 0;
    }
  }
}
