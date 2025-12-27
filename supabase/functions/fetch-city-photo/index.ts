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
    const { city, country } = await req.json();

    if (!city || !country) {
      return new Response(
        JSON.stringify({ error: "City and country are required" }),
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

    console.log('Fetching photo for:', city, country);

    // Step 1: Search for the city to get a place with photos
    const textQuery = `${city} ${country} city`;
    const searchUrl = 'https://places.googleapis.com/v1/places:searchText';

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.photos,places.formattedAddress'
      },
      body: JSON.stringify({
        textQuery,
        languageCode: 'en',
        maxResultCount: 5
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Places API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to search for city', photoUrl: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    const places = searchData.places || [];

    // Find a place with photos
    let photoReference: string | null = null;
    let placeName: string | null = null;

    for (const place of places) {
      if (place.photos && place.photos.length > 0) {
        photoReference = place.photos[0].name;
        placeName = place.displayName?.text || city;
        break;
      }
    }

    if (!photoReference) {
      console.log('No photos found for city, trying tourist attractions');
      
      // Fallback: search for tourist attractions in the city
      const attractionResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.photos'
        },
        body: JSON.stringify({
          textQuery: `famous landmarks in ${city} ${country}`,
          languageCode: 'en',
          maxResultCount: 5
        })
      });

      if (attractionResponse.ok) {
        const attractionData = await attractionResponse.json();
        for (const place of attractionData.places || []) {
          if (place.photos && place.photos.length > 0) {
            photoReference = place.photos[0].name;
            placeName = place.displayName?.text || city;
            break;
          }
        }
      }
    }

    if (!photoReference) {
      return new Response(
        JSON.stringify({ 
          photoUrl: null, 
          attribution: city,
          error: 'No photos found for this location'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Get the actual photo URL using Places Photo API
    // The photo reference from Places API v1 is a resource name like "places/xxx/photos/yyy"
    const photoUrl = `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=800&maxHeightPx=400&key=${GOOGLE_MAPS_API_KEY}`;

    // Fetch the photo to get the final URL (Google redirects to the actual image)
    const photoResponse = await fetch(photoUrl, { redirect: 'follow' });
    
    if (!photoResponse.ok) {
      console.error('Failed to fetch photo:', photoResponse.status);
      return new Response(
        JSON.stringify({ 
          photoUrl: null, 
          attribution: city,
          error: 'Failed to fetch photo'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert the photo to base64 to return it directly
    const photoArrayBuffer = await photoResponse.arrayBuffer();
    const photoBase64 = btoa(String.fromCharCode(...new Uint8Array(photoArrayBuffer)));
    const photoDataUrl = `data:image/jpeg;base64,${photoBase64}`;

    console.log('Successfully fetched photo for:', city, '- Attribution:', placeName);

    return new Response(
      JSON.stringify({ 
        photoUrl: photoDataUrl,
        attribution: placeName || city
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-city-photo:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        photoUrl: null 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
