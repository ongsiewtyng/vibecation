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
    const { destination, country, startDate, endDate } = await req.json();

    if (!destination || !startDate) {
      return new Response(
        JSON.stringify({ error: "destination and startDate are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const WEATHER_API_KEY = Deno.env.get("WEATHER_API_KEY");
    
    if (!WEATHER_API_KEY) {
      console.log("Weather API key not configured - returning mock data");
      // Return mock weather data when API key is not configured
      const mockForecast = generateMockForecast(startDate, endDate);
      return new Response(
        JSON.stringify({ forecast: mockForecast }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Using OpenWeatherMap API
    const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)},${encodeURIComponent(country)}&limit=1&appid=${WEATHER_API_KEY}`;
    
    const geoResponse = await fetch(geocodeUrl);
    if (!geoResponse.ok) {
      throw new Error(`Geocoding failed: ${geoResponse.statusText}`);
    }
    
    const geoData = await geoResponse.json();
    if (!geoData || geoData.length === 0) {
      throw new Error("Location not found");
    }

    const { lat, lon } = geoData[0];

    // Get forecast data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
    
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error(`Weather API failed: ${weatherResponse.statusText}`);
    }
    
    const weatherData = await weatherResponse.json();

    // Process forecast data - group by day and get one entry per day
    const dailyForecasts = processForecastData(weatherData.list, startDate, endDate);

    return new Response(
      JSON.stringify({ forecast: dailyForecasts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error fetching weather:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function processForecastData(forecastList: any[], startDate: string, endDate: string): any[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dailyData: Record<string, any> = {};

  forecastList.forEach((item: any) => {
    const itemDate = new Date(item.dt * 1000);
    if (itemDate >= start && itemDate <= end) {
      const dateKey = itemDate.toISOString().split('T')[0];
      
      // Keep midday forecast for each day
      if (!dailyData[dateKey] || Math.abs(itemDate.getHours() - 12) < Math.abs(new Date(dailyData[dateKey].dt * 1000).getHours() - 12)) {
        dailyData[dateKey] = item;
      }
    }
  });

  return Object.entries(dailyData).map(([date, data]: [string, any]) => ({
    date,
    temp: Math.round(data.main.temp),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    wind: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
    humidity: data.main.humidity,
    precipitation: data.rain ? Math.round(data.rain['3h'] || 0) : 0,
  })).sort((a, b) => a.date.localeCompare(b.date));
}

function generateMockForecast(startDate: string, endDate: string): any[] {
  const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear"];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  return Array.from({ length: Math.min(days, 7) }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    
    return {
      date: date.toISOString().split('T')[0],
      temp: Math.round(18 + Math.random() * 12),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      wind: Math.round(10 + Math.random() * 20),
      humidity: Math.round(50 + Math.random() * 30),
      precipitation: Math.random() > 0.7 ? Math.round(Math.random() * 10) : 0,
    };
  });
}
