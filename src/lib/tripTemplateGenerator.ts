import { supabase } from "@/integrations/supabase/client";

interface FlightInfo {
  flightNumber: string;
  fromCode: string;
  toCode: string;
  arrivalTime?: string;
}

interface GenerateTemplateParams {
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  currency: string;
  totalBudget: number;
  flightInfo?: FlightInfo;
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

export interface TripTemplateResult {
  itinerary: ItineraryItem[];
  stays: StaySuggestion[];
  budget: BudgetCategory[];
}

export async function generateTripTemplate(params: GenerateTemplateParams): Promise<TripTemplateResult> {
  const { data, error } = await supabase.functions.invoke('generate-trip-template', {
    body: params
  });

  if (error) {
    console.error('Error calling generate-trip-template:', error);
    throw new Error(error.message || 'Failed to generate trip template');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as TripTemplateResult;
}

export async function createTripWithTemplate(
  tripData: {
    title: string;
    destination: string;
    country: string;
    startDate: string;
    endDate: string;
    budget: number;
    notes?: string;
  },
  template: TripTemplateResult
): Promise<string> {
  // Create the trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      title: tripData.title,
      destination: tripData.destination,
      country: tripData.country,
      start_date: tripData.startDate,
      end_date: tripData.endDate,
      budget: tripData.budget,
      notes: tripData.notes || 'Generated with Smart Trip Template'
    })
    .select('id')
    .single();

  if (tripError || !trip) {
    console.error('Error creating trip:', tripError);
    throw new Error('Failed to create trip');
  }

  const tripId = trip.id;

  // Insert itinerary items
  if (template.itinerary.length > 0) {
    const itineraryItems = template.itinerary.map(item => ({
      trip_id: tripId,
      day_number: item.dayNumber,
      date: item.date,
      time_of_day: item.timeOfDay,
      title: item.title,
      description: item.description,
      location: item.location,
      is_ai_suggested: true
    }));

    const { error: itineraryError } = await supabase
      .from('itinerary_items')
      .insert(itineraryItems);

    if (itineraryError) {
      console.error('Error inserting itinerary:', itineraryError);
      // Don't fail the whole operation, just log
    }
  }

  // Insert accommodations
  if (template.stays.length > 0) {
    const accommodations = template.stays.map(stay => ({
      trip_id: tripId,
      name: stay.name,
      address: stay.area,
      check_in: stay.checkIn,
      check_out: stay.checkOut,
      cost: stay.totalPrice,
      notes: stay.notes,
      is_ai_suggested: true
    }));

    const { error: staysError } = await supabase
      .from('accommodations')
      .insert(accommodations);

    if (staysError) {
      console.error('Error inserting stays:', staysError);
    }
  }

  // Insert budget categories
  if (template.budget.length > 0) {
    const budgetCategories = template.budget.map(cat => ({
      trip_id: tripId,
      category: cat.category,
      allocated_amount: cat.amount,
      currency: 'MYR', // Default, should be passed
      is_ai_suggested: true
    }));

    const { error: budgetError } = await supabase
      .from('trip_budget_categories')
      .insert(budgetCategories);

    if (budgetError) {
      console.error('Error inserting budget:', budgetError);
    }
  }

  return tripId;
}

// Convert time of day to actual time string
export function timeOfDayToTime(timeOfDay: string): string {
  switch (timeOfDay) {
    case 'morning': return '09:00';
    case 'afternoon': return '14:00';
    case 'evening': return '19:00';
    default: return '12:00';
  }
}
