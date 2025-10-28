import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Batch size for database operations
const BATCH_SIZE = 500;

// Austin Open Data API endpoint for solar permits
const AUSTIN_SOLAR_API = 'https://data.austintexas.gov/resource/3syk-w9eu.json?work_class=Auxiliary%20Power&$limit=50000';

interface AustinSolarRecord {
  permit_class_mapped?: string;
  original_address1?: string;
  description?: string;
  installed_kw?: string;
  applicationdate?: string;
  statusdate?: string;
  calendar_year_issued?: string;
  statuscurrent?: string;
  completed_date?: string;
  original_zip?: string;
  council_district?: string;
  jurisdiction?: string;
  latitude?: string;
  longitude?: string;
  contractor_companyname?: string;
  contractor_city?: string;
  link?: string;
  project_id?: string;
}

// Transform Austin API record to database schema
function transformRecord(record: AustinSolarRecord) {
  return {
    project_id: record.project_id || null,
    permit_class: record.permit_class_mapped || null,
    address: record.original_address1 || 'Unknown',
    description: record.description || null,
    installed_kw: record.installed_kw ? parseFloat(record.installed_kw) : null,
    applied_date: record.applicationdate ? new Date(record.applicationdate).toISOString().split('T')[0] : null,
    issued_date: record.statusdate ? new Date(record.statusdate).toISOString().split('T')[0] : null,
    calendar_year_issued: record.calendar_year_issued ? parseInt(record.calendar_year_issued) : null,
    status_current: record.statuscurrent || null,
    completed_date: record.completed_date ? new Date(record.completed_date).toISOString().split('T')[0] : null,
    original_zip: record.original_zip || null,
    council_district: record.council_district || null,
    jurisdiction: record.jurisdiction || null,
    latitude: record.latitude ? parseFloat(record.latitude) : null,
    longitude: record.longitude ? parseFloat(record.longitude) : null,
    contractor_company: record.contractor_companyname || null,
    contractor_city: record.contractor_city || null,
    link: record.link || null,
  };
}

// Background task to sync data
async function syncDataInBackground() {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching solar data from Austin Open Data Portal...');
    
    const response = await fetch(AUSTIN_SOLAR_API);
    if (!response.ok) {
      throw new Error(`Austin API returned ${response.status}: ${response.statusText}`);
    }
    
    const apiData: AustinSolarRecord[] = await response.json();
    console.log(`Fetched ${apiData.length} records from Austin API`);

    // Transform all records
    const installations = apiData
      .filter(record => record.project_id) // Only include records with project_id
      .map(transformRecord);
    
    console.log(`Transformed ${installations.length} valid records`);

    // Process in batches to avoid memory issues
    let totalProcessed = 0;
    let totalErrors = 0;

    for (let i = 0; i < installations.length; i += BATCH_SIZE) {
      const batch = installations.slice(i, i + BATCH_SIZE);
      
      try {
        const { error } = await supabase
          .from('solar_installations')
          .upsert(batch, { onConflict: 'project_id' });
        
        if (error) {
          console.error(`Error upserting batch ${i / BATCH_SIZE + 1}:`, error);
          totalErrors += batch.length;
        } else {
          totalProcessed += batch.length;
          console.log(`Processed batch ${i / BATCH_SIZE + 1}: ${totalProcessed}/${installations.length} records`);
        }
      } catch (batchError) {
        console.error(`Exception in batch ${i / BATCH_SIZE + 1}:`, batchError);
        totalErrors += batch.length;
      }
    }

    console.log(`Sync completed. Processed: ${totalProcessed}, Errors: ${totalErrors}`);
    
    return { success: true, processed: totalProcessed, errors: totalErrors, total: installations.length };
  } catch (error) {
    console.error('Error in background sync:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Solar data sync initiated');

    // Run the sync - it processes in batches so it should complete within timeout limits
    const result = await syncDataInBackground();

    return new Response(
      JSON.stringify({ 
        success: result.success,
        message: result.success 
          ? `Sync completed. Processed: ${result.processed}, Errors: ${result.errors}, Total: ${result.total}`
          : `Sync failed: ${result.error}`,
        processed: result.processed,
        errors: result.errors,
        total: result.total,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
