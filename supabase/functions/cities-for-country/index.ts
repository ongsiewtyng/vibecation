import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { countryCode, countryName, limit = 30 } = await req.json();
    
    if (!countryName && !countryCode) {
      return new Response(
        JSON.stringify({ error: "Country name or code is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('MAPS');
    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "MAPS API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const country = countryName || countryCode;
    console.log('Fetching cities for country:', country);

    // Use Places API v1 Text Search with better query for cities
    const textQuery = `popular cities and tourist destinations in ${country}`;
    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress,places.types,places.photos'
      },
      body: JSON.stringify({
        textQuery,
        languageCode: 'en',
        maxResultCount: limit,
        includedType: 'locality'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      
      // Fallback: try simpler query without includedType
      console.log('Trying fallback query...');
      const fallbackResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress,places.types,places.photos'
        },
        body: JSON.stringify({
          textQuery: `major cities in ${country}`,
          languageCode: 'en',
          maxResultCount: limit
        })
      });

      if (!fallbackResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch cities', cities: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const fallbackData = await fallbackResponse.json();
      const cityNames = (fallbackData.places || [])
        .map((place: any) => place.displayName?.text)
        .filter((name: string | undefined): name is string => !!name && name.length > 0);
      
      const uniqueCities = [...new Set(cityNames)].slice(0, limit);
      console.log('Fallback returning', uniqueCities.length, 'cities');
      
      return new Response(
        JSON.stringify({ cities: uniqueCities }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Places API returned', data.places?.length || 0, 'results');

    // Extract just the city names as strings
    const cityNames = (data.places || [])
      .map((place: any) => place.displayName?.text)
      .filter((name: string | undefined): name is string => !!name && name.length > 0);

    // Deduplicate
    const uniqueCities = [...new Set(cityNames)].slice(0, limit);

    console.log('Returning', uniqueCities.length, 'unique cities');

    return new Response(
      JSON.stringify({ cities: uniqueCities }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cities-for-country function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', cities: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
