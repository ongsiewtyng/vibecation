-- Create trip templates table
CREATE TABLE IF NOT EXISTS public.trip_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  season TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template itinerary items
CREATE TABLE IF NOT EXISTS public.template_itinerary_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.trip_templates(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time TIME,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template packing items
CREATE TABLE IF NOT EXISTS public.template_packing_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.trip_templates(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template attractions
CREATE TABLE IF NOT EXISTS public.template_attractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.trip_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  place_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_attractions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - templates are public read, admin write
CREATE POLICY "Anyone can view templates"
  ON public.trip_templates FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view template itinerary items"
  ON public.template_itinerary_items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view template packing items"
  ON public.template_packing_items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view template attractions"
  ON public.template_attractions FOR SELECT
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_trip_templates_updated_at
  BEFORE UPDATE ON public.trip_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample templates
INSERT INTO public.trip_templates (name, destination, country, description, duration_days, season, tags, is_featured) VALUES
  ('Tokyo Adventure', 'Tokyo', 'Japan', 'Experience the vibrant culture, amazing food, and modern technology of Tokyo', 7, 'Spring', ARRAY['Culture', 'Food', 'City'], true),
  ('Paris Romance', 'Paris', 'France', 'Explore the city of love with iconic landmarks, art museums, and French cuisine', 5, 'Summer', ARRAY['Culture', 'Romance', 'Art'], true),
  ('Bali Relaxation', 'Bali', 'Indonesia', 'Unwind in tropical paradise with beaches, temples, and wellness retreats', 10, 'Summer', ARRAY['Beach', 'Wellness', 'Nature'], true);

-- Sample itinerary for Tokyo
INSERT INTO public.template_itinerary_items (template_id, day_number, title, description, time, location)
SELECT id, 1, 'Arrive in Tokyo', 'Check into hotel and explore Shibuya area', '14:00:00', 'Shibuya'
FROM public.trip_templates WHERE name = 'Tokyo Adventure';

INSERT INTO public.template_itinerary_items (template_id, day_number, title, description, time, location)
SELECT id, 2, 'Visit Senso-ji Temple', 'Explore Tokyo''s oldest temple in Asakusa', '09:00:00', 'Asakusa'
FROM public.trip_templates WHERE name = 'Tokyo Adventure';

INSERT INTO public.template_itinerary_items (template_id, day_number, title, description, time, location)
SELECT id, 3, 'Tsukiji Outer Market', 'Fresh sushi breakfast and market exploration', '07:00:00', 'Tsukiji'
FROM public.trip_templates WHERE name = 'Tokyo Adventure';

-- Sample packing items for Tokyo
INSERT INTO public.template_packing_items (template_id, item, category)
SELECT id, 'Comfortable walking shoes', 'Clothing'
FROM public.trip_templates WHERE name = 'Tokyo Adventure';

INSERT INTO public.template_packing_items (template_id, item, category)
SELECT id, 'JR Pass', 'Documents'
FROM public.trip_templates WHERE name = 'Tokyo Adventure';

INSERT INTO public.template_packing_items (template_id, item, category)
SELECT id, 'Portable WiFi device', 'Electronics'
FROM public.trip_templates WHERE name = 'Tokyo Adventure';

-- Sample attractions for Tokyo
INSERT INTO public.template_attractions (template_id, name, description)
SELECT id, 'Tokyo Skytree', 'Tallest structure in Japan with observation decks'
FROM public.trip_templates WHERE name = 'Tokyo Adventure';

INSERT INTO public.template_attractions (template_id, name, description)
SELECT id, 'Meiji Shrine', 'Peaceful Shinto shrine in a forested area'
FROM public.trip_templates WHERE name = 'Tokyo Adventure';
