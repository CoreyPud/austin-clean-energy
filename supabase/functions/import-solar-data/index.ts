import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CSV size limit: 10MB
const MAX_CSV_SIZE = 10 * 1024 * 1024;
const MAX_ROWS = 10000;

// Input validation
function validateCsvData(csvData: string): { valid: boolean; error?: string } {
  if (!csvData || typeof csvData !== 'string') {
    return { valid: false, error: 'CSV data is required' };
  }
  
  // Check size
  const sizeInBytes = new TextEncoder().encode(csvData).length;
  if (sizeInBytes > MAX_CSV_SIZE) {
    return { valid: false, error: `CSV file too large. Maximum size is ${MAX_CSV_SIZE / 1024 / 1024}MB` };
  }
  
  // Count rows
  const rows = csvData.trim().split('\n');
  if (rows.length > MAX_ROWS) {
    return { valid: false, error: `Too many rows. Maximum is ${MAX_ROWS} rows` };
  }
  
  // Basic format check - should have a header row
  if (rows.length < 2) {
    return { valid: false, error: 'CSV must contain at least a header row and one data row' };
  }
  
  return { valid: true };
}

// Validate admin token by checking the admin_sessions table
async function validateAdminToken(token: string): Promise<{ valid: boolean; error?: string }> {
  if (!token) {
    return { valid: false, error: 'Admin token is required' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check if token exists and is not expired
  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !session) {
    console.warn('Invalid or expired admin token for import attempt');
    return { valid: false, error: 'Invalid or expired admin token' };
  }

  return { valid: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin token from header
    const adminToken = req.headers.get('x-admin-token');
    if (!adminToken) {
      console.warn('Unauthorized import attempt - no admin token');
      return new Response(
        JSON.stringify({ error: 'Admin authentication required for this operation' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate the token against the database
    const tokenValidation = await validateAdminToken(adminToken);
    if (!tokenValidation.valid) {
      return new Response(
        JSON.stringify({ error: tokenValidation.error }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { csvData } = await req.json();
    
    // Input validation
    const csvValidation = validateCsvData(csvData);
    if (!csvValidation.valid) {
      return new Response(
        JSON.stringify({ error: csvValidation.error }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('Importing solar installation data (authorized admin)...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse CSV data with proper handling of quoted fields
    const lines = csvData.trim().split('\n');
    
    // Simple CSV parser that handles quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseCSVLine(lines[0]);
    console.log(`Processing ${lines.length - 1} rows...`);
    
    const installations = [];
    let processed = 0;
    let errors = 0;
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        if (values.length < 20) {
          errors++;
          continue;
        }
        
        const installation = {
          project_id: values[17]?.trim() || null,
          permit_class: values[0]?.trim() || null,
          address: values[1]?.trim() || 'Unknown',
          description: values[2]?.trim() || null,
          installed_kw: values[3] ? parseFloat(values[3]) : null,
          applied_date: values[4] ? new Date(values[4]).toISOString().split('T')[0] : null,
          issued_date: values[5] ? new Date(values[5]).toISOString().split('T')[0] : null,
          calendar_year_issued: values[6] ? parseInt(values[6]) : null,
          status_current: values[7]?.trim() || null,
          completed_date: values[8] ? new Date(values[8]).toISOString().split('T')[0] : null,
          original_zip: values[13]?.trim() || null,
          council_district: values[14]?.trim() || null,
          jurisdiction: values[15]?.trim() || null,
          latitude: values[19] ? parseFloat(values[19]) : null,
          longitude: values[20] ? parseFloat(values[20]) : null,
          contractor_company: values[23]?.trim() || null,
          contractor_city: values[26]?.trim() || null,
          link: values[16]?.trim() || null,
        };

        installations.push(installation);
        processed++;

        // Batch insert every 100 records
        if (installations.length >= 100) {
          const { error } = await supabase
            .from('solar_installations')
            .upsert(installations, { onConflict: 'project_id' });
          
          if (error) {
            console.error('Batch insert error:', error);
          } else {
            console.log(`Imported ${installations.length} records (${processed} total processed)`);
          }
          installations.length = 0;
        }
      } catch (rowError) {
        errors++;
        console.error(`Error processing row ${i}:`, rowError);
      }
    }

    // Insert remaining records
    if (installations.length > 0) {
      const { error } = await supabase
        .from('solar_installations')
        .upsert(installations, { onConflict: 'project_id' });
      
      if (error) {
        console.error('Final batch insert error:', error);
      } else {
        console.log(`Imported final ${installations.length} records`);
      }
    }

    console.log(`Solar installation data import completed. Processed: ${processed}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Data imported successfully. Processed: ${processed} records, Errors: ${errors}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in import-solar-data function:', error);
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
