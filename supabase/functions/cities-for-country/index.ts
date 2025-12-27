import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded major cities by country as fallback
const MAJOR_CITIES: Record<string, string[]> = {
  "Malaysia": ["Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Malacca City", "Kota Kinabalu", "Kuching", "Langkawi", "Cameron Highlands", "Penang"],
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo", "Fukuoka", "Hiroshima", "Nara", "Kobe"],
  "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Krabi", "Koh Samui", "Ayutthaya", "Hua Hin", "Chiang Rai", "Sukhothai"],
  "Singapore": ["Singapore"],
  "Indonesia": ["Jakarta", "Bali", "Yogyakarta", "Surabaya", "Bandung", "Medan", "Lombok", "Makassar", "Semarang", "Malang"],
  "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang", "Hoi An", "Nha Trang", "Hue", "Halong Bay", "Sapa", "Phu Quoc", "Dalat"],
  "Philippines": ["Manila", "Cebu City", "Boracay", "Palawan", "Baguio", "Davao", "Tagaytay", "Siargao", "Bohol", "Iloilo"],
  "South Korea": ["Seoul", "Busan", "Jeju", "Incheon", "Daegu", "Gyeongju", "Jeonju", "Gangneung", "Suwon", "Daejeon"],
  "Taiwan": ["Taipei", "Kaohsiung", "Taichung", "Tainan", "Hualien", "Jiufen", "Taitung", "Kenting", "Sun Moon Lake", "Alishan"],
  "China": ["Beijing", "Shanghai", "Hong Kong", "Guangzhou", "Shenzhen", "Xi'an", "Chengdu", "Hangzhou", "Guilin", "Suzhou"],
  "India": ["Mumbai", "Delhi", "Jaipur", "Agra", "Goa", "Bangalore", "Chennai", "Kolkata", "Udaipur", "Varanasi"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Gold Coast", "Cairns", "Adelaide", "Darwin", "Hobart", "Canberra"],
  "New Zealand": ["Auckland", "Queenstown", "Wellington", "Christchurch", "Rotorua", "Taupo", "Dunedin", "Nelson", "Napier", "Wanaka"],
  "United States": ["New York", "Los Angeles", "San Francisco", "Las Vegas", "Miami", "Chicago", "Seattle", "Washington D.C.", "Boston", "Orlando"],
  "United Kingdom": ["London", "Edinburgh", "Manchester", "Liverpool", "Birmingham", "Oxford", "Cambridge", "Bath", "York", "Bristol"],
  "France": ["Paris", "Nice", "Lyon", "Marseille", "Bordeaux", "Strasbourg", "Toulouse", "Cannes", "Monaco", "Avignon"],
  "Italy": ["Rome", "Venice", "Florence", "Milan", "Naples", "Amalfi", "Cinque Terre", "Pisa", "Verona", "Bologna"],
  "Spain": ["Barcelona", "Madrid", "Seville", "Valencia", "Granada", "Malaga", "Bilbao", "San Sebastian", "Toledo", "Ibiza"],
  "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne", "Dresden", "Heidelberg", "Nuremberg", "Dusseldorf", "Stuttgart"],
  "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Leiden", "Delft", "Haarlem", "Maastricht", "Eindhoven", "Groningen"],
  "Portugal": ["Lisbon", "Porto", "Sintra", "Faro", "Lagos", "Funchal", "Evora", "Coimbra", "Braga", "Cascais"],
  "Greece": ["Athens", "Santorini", "Mykonos", "Crete", "Rhodes", "Corfu", "Thessaloniki", "Delphi", "Meteora", "Zakynthos"],
  "Turkey": ["Istanbul", "Cappadocia", "Antalya", "Bodrum", "Izmir", "Ephesus", "Pamukkale", "Fethiye", "Ankara", "Trabzon"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ras Al Khaimah", "Ajman", "Fujairah", "Al Ain"],
  "Egypt": ["Cairo", "Luxor", "Alexandria", "Aswan", "Sharm El Sheikh", "Hurghada", "Giza", "Dahab"],
  "Morocco": ["Marrakech", "Fez", "Casablanca", "Chefchaouen", "Essaouira", "Tangier", "Rabat", "Agadir"],
  "South Africa": ["Cape Town", "Johannesburg", "Durban", "Pretoria", "Kruger National Park", "Garden Route", "Stellenbosch", "Port Elizabeth"],
  "Mexico": ["Mexico City", "Cancun", "Playa del Carmen", "Tulum", "Oaxaca", "Guadalajara", "Puerto Vallarta", "San Miguel de Allende"],
  "Brazil": ["Rio de Janeiro", "Sao Paulo", "Salvador", "Florianopolis", "Foz do Iguacu", "Brasilia", "Manaus", "Recife"],
  "Argentina": ["Buenos Aires", "Mendoza", "Bariloche", "Ushuaia", "Salta", "Cordoba", "Puerto Iguazu", "El Calafate"],
  "Canada": ["Vancouver", "Toronto", "Montreal", "Quebec City", "Banff", "Calgary", "Ottawa", "Victoria", "Whistler", "Niagara Falls"],
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

    const country = countryName || countryCode;
    console.log('Fetching cities for country:', country);

    // First, check if we have hardcoded cities for this country
    const hardcodedCities = MAJOR_CITIES[country];
    if (hardcodedCities) {
      console.log('Using hardcoded cities for:', country);
      return new Response(
        JSON.stringify({ cities: hardcodedCities.slice(0, limit) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('MAPS');
    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "MAPS API key not configured", cities: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Places API v1 Text Search with better query for cities
    const textQuery = `popular cities and tourist destinations in ${country}`;
    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.types'
      },
      body: JSON.stringify({
        textQuery,
        languageCode: 'en',
        maxResultCount: Math.min(limit, 20)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      
      // Return empty array on error
      return new Response(
        JSON.stringify({ error: 'Failed to fetch cities', cities: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Places API returned', data.places?.length || 0, 'results');

    // Extract just the city names as strings, filter for locality types
    const cityNames = (data.places || [])
      .filter((place: any) => {
        const types = place.types || [];
        return types.includes('locality') || types.includes('administrative_area_level_1') || types.includes('political');
      })
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
