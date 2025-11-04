const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching yearly installation statistics from Austin Open Data API');

    // Fetch yearly data from Austin Open Data API with proper URL encoding
    const baseUrl = "https://data.austintexas.gov/resource/3syk-w9eu.json";
    const params = new URLSearchParams({
      '$select': 'date_extract_y(issued_date) as year, count(*)',
      '$where': "work_class='Auxiliary Power' AND upper(description) like '%KW%' AND issued_date is not null",
      '$group': 'year',
      '$order': 'year'
    });
    
    const apiUrl = `${baseUrl}?${params.toString()}`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Fetched yearly data:', data);

    // Transform data to ensure year is a number and count is formatted
    const transformedData = data.map((item: any) => ({
      year: parseInt(item.year),
      count: parseInt(item.count)
    })).filter((item: any) => item.year >= 2000); // Filter out invalid years

    return new Response(
      JSON.stringify({ data: transformedData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error fetching yearly stats:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
