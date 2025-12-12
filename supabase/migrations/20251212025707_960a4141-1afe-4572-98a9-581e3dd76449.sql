-- Add time_of_day column to itinerary_items for morning/afternoon/evening blocks
ALTER TABLE public.itinerary_items 
ADD COLUMN IF NOT EXISTS time_of_day text;

-- Add is_ai_suggested column to track AI-generated items
ALTER TABLE public.itinerary_items 
ADD COLUMN IF NOT EXISTS is_ai_suggested boolean DEFAULT false;

ALTER TABLE public.accommodations 
ADD COLUMN IF NOT EXISTS is_ai_suggested boolean DEFAULT false;

-- Create trip_budget_categories table for budget allocation (planned, not actual expenses)
CREATE TABLE IF NOT EXISTS public.trip_budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  category text NOT NULL,
  allocated_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  is_ai_suggested boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_budget_categories ENABLE ROW LEVEL SECURITY;

-- Create permissive policy (matching existing pattern)
CREATE POLICY "Allow all on trip_budget_categories" 
ON public.trip_budget_categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_trip_budget_categories_updated_at
BEFORE UPDATE ON public.trip_budget_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trip_budget_categories_trip_id ON public.trip_budget_categories(trip_id);