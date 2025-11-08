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

    const GOOGLE_MAPS_API_KEY = Deno.env.get('MAPS') || "AIzaSyBfwXJV_xW9l8fhSZ2rUOutB2xsfPqQTGI";
    
    console.log('Fetching attractions for country:', country);
    
    // Step 1: Get top attractions from Wikipedia
    const wikipediaUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=tourist+attractions+in+${encodeURIComponent(country)}&srlimit=30&origin=*`;
    const wikiResponse = await fetch(wikipediaUrl);
    const wikiData = await wikiResponse.json();
    
    console.log('Wikipedia returned', wikiData.query?.search?.length || 0, 'results');

    // Extract attraction names from Wikipedia results
    const attractionNames = wikiData.query?.search?.slice(0, 30).map((item: any) => 
      item.title.replace(/\s*\(.*?\)\s*/g, '').trim()
    ) || [];

    if (attractionNames.length === 0) {
      return new Response(
        JSON.stringify({ message: "No attractions found in Wikipedia", attractions: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 2: Enrich each attraction with Google Places API data
    const enrichedAttractions = [];
    
    for (const attractionName of attractionNames) {
      try {
        // Use Text Search to find the place
        const searchQuery = `${attractionName} ${country}`;
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const searchResponse = await fetch(textSearchUrl);
        const searchData = await searchResponse.json();

        if (searchData.status === 'REQUEST_DENIED') {
          console.error('Google Places API error:', searchData.error_message);
          continue;
        }

        if (searchData.results && searchData.results.length > 0) {
          const place = searchData.results[0];
          
          // Calculate score: rating * log(user_ratings_total + 1)
          const userRatingsTotal = place.user_ratings_total || 0;
          const rating = place.rating || 0;
          const score = rating * Math.log(userRatingsTotal + 1);

          enrichedAttractions.push({
            place_id: place.place_id,
            name: place.name,
            description: place.formatted_address || '',
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            rating: rating,
            user_ratings_total: userRatingsTotal,
            formatted_address: place.formatted_address || '',
            types: place.types || [],
            photo_reference: place.photos?.[0]?.photo_reference || null,
            country: country,
            score: score
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Error enriching ${attractionName}:`, err);
      }
    }

    // Step 3: Sort by score and take top 20
    enrichedAttractions.sort((a, b) => b.score - a.score);
    
    // Deduplicate by place_id (keep highest scored ones)
    const uniqueAttractions = new Map();
    for (const attraction of enrichedAttractions) {
      if (!uniqueAttractions.has(attraction.place_id)) {
        uniqueAttractions.set(attraction.place_id, attraction);
      }
    }
    
    const topAttractions = Array.from(uniqueAttractions.values()).slice(0, 20);

    console.log(`Enriched ${topAttractions.length} unique attractions, top score: ${topAttractions[0]?.score || 0}`);

    // Remove score before storing in database
    const attractionsToStore = topAttractions.map(({ score, ...attraction }) => attraction);

    // Upsert attractions into database (avoid duplicates)
    const { data, error } = await supabase
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
        message: `Fetched and ranked ${topAttractions.length} attractions`, 
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
