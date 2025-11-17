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
    const { countryCode, countryName, limit = 20 } = await req.json();
    
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

    // Use Places API v1 Text Search
    const textQuery = `city in ${country}`;
    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress,places.types'
      },
      body: JSON.stringify({
        textQuery,
        languageCode: 'en',
        maxResultCount: limit
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch cities', detail: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Places API returned', data.places?.length || 0, 'results');

    // Map all places - be lenient with types to get actual results
    const allPlaces = (data.places || [])
      .map((place: any) => ({
        name: place.displayName?.text || '',
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
        formattedAddress: place.formattedAddress || '',
        types: place.types || []
      }))
      .filter((place: any) => place.name); // Only filter out empty names

    // Deduplicate by name (case-insensitive)
    const uniqueCities = Array.from(
      new Map(allPlaces.map((city: any) => [city.name.toLowerCase(), city])).values()
    ).slice(0, limit);

    console.log('Returning', uniqueCities.length, 'unique cities');

    return new Response(
      JSON.stringify({ cities: uniqueCities }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cities-for-country function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
