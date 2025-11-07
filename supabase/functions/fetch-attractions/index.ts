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
    const { country } = await req.json();
    
    if (!country) {
      return new Response(
        JSON.stringify({ error: "Country is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_MAPS_API_KEY = "AIzaSyBfwXJV_xW9l8fhSZ2rUOutB2xsfPqQTGI";
    
    // First, geocode the country to get its location
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(country)}&key=${GOOGLE_MAPS_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.results || geocodeData.results.length === 0) {
      return new Response(
        JSON.stringify({ error: "Could not geocode country" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = geocodeData.results[0].geometry.location;
    
    // Search for tourist attractions near this location
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=50000&type=tourist_attraction&key=${GOOGLE_MAPS_API_KEY}`;
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (!placesData.results || placesData.results.length === 0) {
      return new Response(
        JSON.stringify({ message: "No attractions found", attractions: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare attractions data
    const attractions = placesData.results.slice(0, 20).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      description: place.vicinity || '',
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      rating: place.rating || null,
      types: place.types || [],
      photo_reference: place.photos?.[0]?.photo_reference || null,
      country: country,
    }));

    // Upsert attractions into database (avoid duplicates)
    const { data, error } = await supabase
      .from('attractions')
      .upsert(attractions, { onConflict: 'place_id', ignoreDuplicates: false });

    if (error) {
      console.error('Error inserting attractions:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: `Fetched ${attractions.length} attractions`, attractions }),
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
