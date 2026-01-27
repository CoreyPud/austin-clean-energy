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

    const { csvData, columnMapping, headerRowIndex: providedHeaderRowIndex } = await req.json();
    
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

    // Use provided header row index or find it
    let headerRowIndex = providedHeaderRowIndex ?? 0;
    if (providedHeaderRowIndex === undefined) {
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        if (lines[i].toLowerCase().includes('install date')) {
          headerRowIndex = i;
          break;
        }
      }
    }

    // Parse header row
    const headers = parseCSVLine(lines[headerRowIndex]).map(h => h.toUpperCase().replace(/\s+/g, '_'));
    console.log('CSV Headers:', headers);

    // If columnMapping is provided from frontend, use it directly
    // Otherwise, fall back to auto-detection
    let columnMap: Record<string, number> = {};
    
    if (columnMapping && Object.keys(columnMapping).length > 0) {
      // Use frontend-provided mapping (already has indices)
      columnMap = columnMapping;
      console.log('Using frontend-provided column mapping:', columnMap);
    } else {
      // Auto-detect column mappings (legacy behavior)
      const columnMappings: Record<string, string[]> = {
        'install_date': ['INSTALL_DATE', 'INSTALL', 'DATE'],
        'kw_capacity': ['KW_CAPACITY', 'KW', 'CAPACITY', 'SYSTEM_KW'],
        'battery_kwh': ['BATTERY__KWH', 'BATTERY_KWH', 'BATTERY'],
        'cost': ['COST', '_COST_'],
        'ae_rebate': ['AE_REBATE', '_AE_REBATE_', 'REBATE'],
        'dollar_per_kw_rebate': ['$/KW_REBATE', '$_KW_REBATE', 'DOLLAR_KW_REBATE'],
        'percent_rebate': ['%_REBATE', 'PERCENT_REBATE', '%REBATE'],
        'date': ['DATE'],
        'years_old': ['YEARS_OLD', 'YEARSOLD'],
        'installer': ['INSTALLER', 'CONTRACTOR', 'COMPANY'],
        'look_into': ['LOOK_INTO', 'LOOKINTO'],
        'question': ['QUESITON', 'QUESTION'],
        'fiscal_year': ['FISCAL_YEAR', 'FISCALYEAR', 'FY']
      };

      for (const [key, possibleNames] of Object.entries(columnMappings)) {
        for (const name of possibleNames) {
          const idx = headers.findIndex(h => h.includes(name) || name.includes(h));
          if (idx !== -1) {
            columnMap[key] = idx;
            break;
          }
        }
      }

      // Fallback: map by position if headers match expected pattern
      if (Object.keys(columnMap).length < 3) {
        columnMap['install_date'] = 0;
        columnMap['kw_capacity'] = 1;
        columnMap['battery_kwh'] = 2;
        columnMap['cost'] = 3;
        columnMap['ae_rebate'] = 4;
        columnMap['dollar_per_kw_rebate'] = 5;
        columnMap['percent_rebate'] = 6;
        columnMap['date'] = 7;
        columnMap['years_old'] = 8;
        columnMap['installer'] = 9;
        columnMap['look_into'] = 10;
        columnMap['question'] = 11;
        columnMap['fiscal_year'] = 12;
      }
      console.log('Auto-detected column mapping:', columnMap);
    }

    // Validate required mappings exist
    const requiredFields = ['install_date', 'kw_capacity', 'installer'];
    const missingRequired = requiredFields.filter(f => columnMap[f] === undefined);
    
    if (missingRequired.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Missing required column mappings: ${missingRequired.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Final column mapping:', columnMap);

    const stats = {
      total: lines.length - 1,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };

    const batchSize = 100;
    const records: any[] = [];
    let rowNumber = 0;

    // Process data rows (skip header and any preceding summary rows)
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        stats.skipped++;
        continue;
      }

      rowNumber++;

      try {
        const values = parseCSVLine(line);
        
        const getValue = (key: string): string => {
          const idx = columnMap[key];
          return idx !== undefined && idx < values.length ? values[idx] : '';
        };

        const installDate = getValue('install_date');
        const kwCapacity = getValue('kw_capacity');
        const batteryKwh = getValue('battery_kwh');
        const installer = getValue('installer');

        // Parse values
        const parsedDate = parseDate(installDate);
        const parsedKW = parseKW(kwCapacity);
        const parsedBattery = parseKW(batteryKwh);

        // Skip rows without valid date and kW (likely summary or empty rows)
        if (!parsedDate && !parsedKW) {
          stats.skipped++;
          continue;
        }

        // Generate synthetic address since this data lacks real addresses
        // Use installer + date + kW as unique identifier
        const installerClean = installer.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) || 'Unknown';
        const syntheticAddress = `PIR-${installerClean}-${parsedDate || 'NODATE'}-${parsedKW || 0}kW-R${rowNumber}`;

        const record = {
          pir_number: `PIR-${rowNumber}`, // Generate unique identifier
          address: syntheticAddress,
          address_normalized: syntheticAddress.toUpperCase(),
          system_kw: parsedKW,
          interconnection_date: parsedDate,
          customer_type: 'Residential', // Default for this dataset
          fuel_type: 'Solar',
          technology: parsedBattery && parsedBattery > 0 ? 'Solar + Battery' : 'Solar',
          raw_data: {
            install_date: installDate,
            kw_capacity: kwCapacity,
            battery_kwh: batteryKwh,
            cost: getValue('cost'),
            ae_rebate: getValue('ae_rebate'),
            dollar_per_kw_rebate: getValue('dollar_per_kw_rebate'),
            percent_rebate: getValue('percent_rebate'),
            date: getValue('date'),
            years_old: getValue('years_old'),
            installer: installer,
            look_into: getValue('look_into'),
            question: getValue('question'),
            fiscal_year: getValue('fiscal_year'),
            parsed_kw: parsedKW,
            parsed_battery_kwh: parsedBattery,
            row_number: rowNumber
          }
        };

        records.push(record);

        // Process in batches
        if (records.length >= batchSize) {
          await processBatch(supabaseClient, records, stats);
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
