import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvData } = await req.json();
    console.log('Importing solar installation data...');

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
