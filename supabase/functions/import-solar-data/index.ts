import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_CSV_SIZE = 10 * 1024 * 1024;
const MAX_ROWS = 10000;

function validateCsvData(csvData: string): { valid: boolean; error?: string } {
  if (!csvData || typeof csvData !== 'string') {
    return { valid: false, error: 'CSV data is required' };
  }
  const sizeInBytes = new TextEncoder().encode(csvData).length;
  if (sizeInBytes > MAX_CSV_SIZE) {
    return { valid: false, error: `CSV file too large. Maximum size is ${MAX_CSV_SIZE / 1024 / 1024}MB` };
  }
  const rows = csvData.trim().split('\n');
  if (rows.length > MAX_ROWS) {
    return { valid: false, error: `Too many rows. Maximum is ${MAX_ROWS} rows` };
  }
  if (rows.length < 2) {
    return { valid: false, error: 'CSV must contain at least a header row and one data row' };
  }
  return { valid: true };
}

async function validateAdminToken(token: string): Promise<{ valid: boolean; error?: string }> {
  if (!token) return { valid: false, error: 'Admin token is required' };

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !session) {
    return { valid: false, error: 'Invalid or expired admin token' };
  }
  return { valid: true };
}

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

function safeParseDate(value: string | undefined): string | null {
  if (!value || !value.trim()) return null;
  try {
    const d = new Date(value.trim());
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function safeParseFloat(value: string | undefined): number | null {
  if (!value || !value.trim()) return null;
  const num = parseFloat(value.trim());
  return isNaN(num) ? null : num;
}

function safeParseInt(value: string | undefined): number | null {
  if (!value || !value.trim()) return null;
  const num = parseInt(value.trim(), 10);
  return isNaN(num) ? null : num;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminToken = req.headers.get('x-admin-token');
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Admin authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenValidation = await validateAdminToken(adminToken);
    if (!tokenValidation.valid) {
      return new Response(
        JSON.stringify({ error: tokenValidation.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { csvData, columnMapping, headerRowIndex = 0 } = await req.json();

    const csvValidation = validateCsvData(csvData);
    if (!csvValidation.valid) {
      return new Response(
        JSON.stringify({ error: csvValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that columnMapping is provided and has project_id
    if (!columnMapping || typeof columnMapping !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Column mapping is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (columnMapping.project_id === undefined) {
      return new Response(
        JSON.stringify({ error: 'Project ID column mapping is required for upsert' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Importing solar data with dynamic column mapping (authorized admin)...');
    console.log('Column mapping:', JSON.stringify(columnMapping));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const lines = csvData.trim().split('\n');
    const dataStartIndex = headerRowIndex + 1;

    console.log(`Processing ${lines.length - dataStartIndex} data rows...`);

    const batch: any[] = [];
    let total = 0;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = dataStartIndex; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      total++;

      try {
        const values = parseCSVLine(lines[i]);

        const getVal = (field: string): string | undefined => {
          const idx = columnMapping[field];
          if (idx === undefined || idx === null) return undefined;
          return values[idx];
        };

        const projectId = getVal('project_id')?.trim();
        if (!projectId) {
          skipped++;
          continue;
        }

        const installation: Record<string, any> = {
          project_id: projectId,
          address: getVal('address')?.trim() || 'Unknown',
          description: getVal('description')?.trim() || null,
          permit_class: getVal('permit_class')?.trim() || null,
          installed_kw: safeParseFloat(getVal('installed_kw')),
          applied_date: safeParseDate(getVal('applied_date')),
          issued_date: safeParseDate(getVal('issued_date')),
          calendar_year_issued: safeParseInt(getVal('calendar_year_issued')),
          status_current: getVal('status_current')?.trim() || null,
          completed_date: safeParseDate(getVal('completed_date')),
          original_zip: getVal('original_zip')?.trim() || null,
          council_district: getVal('council_district')?.trim() || null,
          jurisdiction: getVal('jurisdiction')?.trim() || null,
          latitude: safeParseFloat(getVal('latitude')),
          longitude: safeParseFloat(getVal('longitude')),
          contractor_company: getVal('contractor_company')?.trim() || null,
          contractor_city: getVal('contractor_city')?.trim() || null,
          link: getVal('link')?.trim() || null,
        };

        batch.push(installation);

        // Batch upsert every 100 records
        if (batch.length >= 100) {
          const { data: upsertData, error: upsertError } = await supabase
            .from('solar_installations')
            .upsert(batch, { onConflict: 'project_id' })
            .select('id');

          if (upsertError) {
            console.error('Batch upsert error:', upsertError);
            errors.push(`Batch error at row ~${i}: ${upsertError.message}`);
          } else {
            const count = upsertData?.length || 0;
            inserted += count;
            console.log(`Upserted ${count} records (${total} total processed)`);
          }
          batch.length = 0;
        }
      } catch (rowError: any) {
        skipped++;
        errors.push(`Row ${i + 1}: ${rowError.message}`);
      }
    }

    // Insert remaining
    if (batch.length > 0) {
      const { data: upsertData, error: upsertError } = await supabase
        .from('solar_installations')
        .upsert(batch, { onConflict: 'project_id' })
        .select('id');

      if (upsertError) {
        console.error('Final batch upsert error:', upsertError);
        errors.push(`Final batch error: ${upsertError.message}`);
      } else {
        const count = upsertData?.length || 0;
        inserted += count;
      }
    }

    // Note: upsert doesn't distinguish inserted vs updated, so we report all as "inserted/updated"
    updated = 0; // Can't distinguish with upsert

    console.log(`Import complete. Total: ${total}, Processed: ${inserted}, Skipped: ${skipped}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: { total, inserted, updated, skipped, errors: errors.slice(0, 50) },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in import-solar-data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
