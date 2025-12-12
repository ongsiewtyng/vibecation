import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TripTemplateRequest {
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  currency: string;
  totalBudget: number;
  flightInfo?: {
    flightNumber: string;
    fromCode: string;
    toCode: string;
    arrivalTime?: string;
  };
}

interface ItineraryItem {
  dayNumber: number;
  date: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  title: string;
  description: string;
  location: string;
}

interface StaySuggestion {
  name: string;
  area: string;
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  totalPrice: number;
  notes: string;
}

interface BudgetCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface TripTemplateResponse {
  itinerary: ItineraryItem[];
  stays: StaySuggestion[];
  budget: BudgetCategory[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: TripTemplateRequest = await req.json();
    const { destination, country, startDate, endDate, currency, totalBudget, flightInfo } = request;

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    console.log(`Generating trip template for ${destination}, ${country} - ${numDays} days, budget: ${totalBudget} ${currency}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context-rich prompt
    const flightContext = flightInfo 
      ? `The traveler is arriving via flight ${flightInfo.flightNumber} from ${flightInfo.fromCode} to ${flightInfo.toCode}${flightInfo.arrivalTime ? ` arriving at ${flightInfo.arrivalTime}` : ''}.`
      : '';

    const prompt = `You are a travel planning expert. Generate a detailed trip template for a trip to ${destination}, ${country}.

Trip Details:
- Duration: ${numDays} days (${startDate} to ${endDate})
- Total Budget: ${totalBudget} ${currency}
- Currency: ${currency}
${flightContext}

Generate a complete trip plan with:

1. ITINERARY: For each day (1 to ${numDays}), provide 3 activities (morning, afternoon, evening). Each activity should have:
   - A descriptive title (e.g., "Visit the Eiffel Tower", "Explore Shibuya District")
   - A brief description (1-2 sentences)
   - A specific location/area name

2. ACCOMMODATION: Suggest 1-2 hotels/stays appropriate for the budget level. Consider:
   - If budget is low (< ${totalBudget * 0.3} for stays): budget hostels/guesthouses
   - If budget is medium: mid-range hotels
   - If budget is high: boutique or upscale hotels
   Each stay should have: name, area/neighborhood, suggested check-in/out dates, estimated nightly price in ${currency}

3. BUDGET ALLOCATION: Distribute the ${totalBudget} ${currency} across these categories:
   - Flights/Transport (typically 20-30%)
   - Accommodation (typically 25-35%)
   - Food & Dining (typically 15-25%)
   - Activities & Attractions (typically 10-20%)
   - Local Transport (typically 5-10%)
   - Shopping & Misc (typically 5-10%)

Make suggestions specific to ${destination}'s culture, famous attractions, local cuisine, and neighborhoods. Vary recommendations based on the destination - don't use generic suggestions.

Return ONLY valid JSON in this exact format:
{
  "itinerary": [
    {
      "dayNumber": 1,
      "date": "${startDate}",
      "timeOfDay": "morning",
      "title": "Activity title",
      "description": "Brief description",
      "location": "Specific location"
    }
  ],
  "stays": [
    {
      "name": "Hotel Name",
      "area": "Neighborhood/Area",
      "checkIn": "${startDate}",
      "checkOut": "${endDate}",
      "pricePerNight": 100,
      "totalPrice": ${numDays * 100},
      "notes": "Brief description of the stay"
    }
  ],
  "budget": [
    {
      "category": "Flights/Transport",
      "amount": 500,
      "percentage": 25
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a travel planning AI. You MUST respond with valid JSON only, no markdown, no code blocks, no explanations. Just the raw JSON object.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('Raw AI response:', content.substring(0, 500));

    // Clean up the response - remove markdown code blocks if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.slice(7);
    } else if (content.startsWith('```')) {
      content = content.slice(3);
    }
    if (content.endsWith('```')) {
      content = content.slice(0, -3);
    }
    content = content.trim();

    // Parse the JSON
    let templateData: TripTemplateResponse;
    try {
      templateData = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate and fix dates in itinerary
    templateData.itinerary = templateData.itinerary.map((item, index) => {
      const dayIndex = Math.floor(index / 3);
      const itemDate = new Date(start);
      itemDate.setDate(itemDate.getDate() + dayIndex);
      
      return {
        ...item,
        dayNumber: dayIndex + 1,
        date: itemDate.toISOString().split('T')[0],
        timeOfDay: item.timeOfDay || ['morning', 'afternoon', 'evening'][index % 3] as 'morning' | 'afternoon' | 'evening'
      };
    });

    // Ensure budget amounts sum correctly
    const budgetTotal = templateData.budget.reduce((sum, b) => sum + b.amount, 0);
    if (Math.abs(budgetTotal - totalBudget) > 1) {
      // Adjust proportionally
      const ratio = totalBudget / budgetTotal;
      templateData.budget = templateData.budget.map(b => ({
        ...b,
        amount: Math.round(b.amount * ratio),
        percentage: Math.round((b.amount * ratio / totalBudget) * 100)
      }));
    }

    console.log('Generated template successfully:', {
      itineraryCount: templateData.itinerary.length,
      staysCount: templateData.stays.length,
      budgetCategories: templateData.budget.length
    });

    return new Response(JSON.stringify(templateData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating trip template:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate trip template' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
