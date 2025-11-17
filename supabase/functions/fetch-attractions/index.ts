import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { country, city, radius = 3000, type = 'tourist_attraction' } = await req.json();
    
    if (!country) {
      return new Response(
        JSON.stringify({ error: "Country is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('MAPS') || "AIzaSyBfwXJV_xW9l8fhSZ2rUOutB2xsfPqQTGI";
    
    console.log('Fetching attractions for country:', country, 'city:', city || 'N/A');
    
    
    // Step 1: Get center coordinates if city is provided
    let centerLat: number | null = null;
    let centerLng: number | null = null;
    
    if (city) {
      // Use Places API v1 Text Search to geocode the city
      const textQuery = `${city}, ${country}`;
      const geocodeUrl = 'https://places.googleapis.com/v1/places:searchText';
      
      const geocodeResponse = await fetch(geocodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.location,places.displayName'
        },
        body: JSON.stringify({
          textQuery,
          languageCode: 'en',
          maxResultCount: 1
        })
      });
      
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.places && geocodeData.places.length > 0) {
          centerLat = geocodeData.places[0].location.latitude;
          centerLng = geocodeData.places[0].location.longitude;
          console.log('Geocoded city to:', centerLat, centerLng);
        }
      } else {
        const errorText = await geocodeResponse.text();
        console.error('Failed to geocode city:', errorText);
      }
    }
    
    if (!centerLat || !centerLng) {
      return new Response(
        JSON.stringify({ error: "Could not geocode city. Please provide lat/lng or a valid city name." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    

    // Step 3: Use Places API v1 Nearby Search
    const nearbyUrl = 'https://places.googleapis.com/v1/places:searchNearby';
    
    const nearbyResponse = await fetch(nearbyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.location,places.formattedAddress,places.types,places.photos'
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: {
              latitude: centerLat,
              longitude: centerLng
            },
            radius: radius
          }
        },
        includedTypes: [type],
        maxResultCount: 20,
        languageCode: 'en',
        rankPreference: 'POPULARITY'
      })
    });

    if (!nearbyResponse.ok) {
      const errorText = await nearbyResponse.text();
      console.error('Google Places Nearby API error:', nearbyResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch attractions', detail: errorText }),
        { status: nearbyResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nearbyData = await nearbyResponse.json();
    console.log('Places Nearby API returned', nearbyData.places?.length || 0, 'results');

    // Normalize Places API v1 response
    const enrichedAttractions = (nearbyData.places || []).map((place: any) => {
      const userRatingsTotal = place.userRatingCount || 0;
      const rating = place.rating || 0;
      const score = rating * Math.log(userRatingsTotal + 1);

      return {
        place_id: place.id,
        name: place.displayName?.text || '',
        description: place.formattedAddress || '',
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
        rating: rating,
        user_ratings_total: userRatingsTotal,
        formatted_address: place.formattedAddress || '',
        types: place.types || [],
        photo_reference: place.photos?.[0]?.name || null,
        country: country,
        city: city || null,
        score: score
      };
    });

    // Sort by score and deduplicate
    enrichedAttractions.sort((a: any, b: any) => b.score - a.score);
    
    const uniqueAttractions = new Map();
    for (const attraction of enrichedAttractions) {
      if (!uniqueAttractions.has(attraction.place_id)) {
        uniqueAttractions.set(attraction.place_id, attraction);
      }
    }
    
    const topAttractions = Array.from(uniqueAttractions.values()).slice(0, 20);
    console.log(`Returning ${topAttractions.length} unique attractions`);

    // Remove score before storing in database
    const attractionsToStore = topAttractions.map(({ score, ...attraction }) => attraction);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert attractions into database
    const { error } = await supabase
      .from('attractions')
      .upsert(attractionsToStore, { onConflict: 'place_id', ignoreDuplicates: false });

    if (error) {
      console.error('Error inserting attractions:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: `Fetched ${topAttractions.length} attractions`, 
        center: { lat: centerLat, lng: centerLng },
        attractions: attractionsToStore 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-attractions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
