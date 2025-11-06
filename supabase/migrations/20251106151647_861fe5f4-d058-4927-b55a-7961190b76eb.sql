-- Create trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  budget DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create itinerary_items table
CREATE TABLE public.itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  time TIME,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create accommodations table
CREATE TABLE public.accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  confirmation_number TEXT,
  cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transports table
CREATE TABLE public.transports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ,
  confirmation_number TEXT,
  cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create packing_items table
CREATE TABLE public.packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  category TEXT,
  packed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create attachments table
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create wishlist table
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place TEXT NOT NULL,
  country TEXT NOT NULL,
  priority INTEGER CHECK (priority BETWEEN 1 AND 5),
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (with permissive policies for personal use)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all operations for personal use)
CREATE POLICY "Allow all on trips" ON public.trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on itinerary_items" ON public.itinerary_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on accommodations" ON public.accommodations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transports" ON public.transports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on packing_items" ON public.packing_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on attachments" ON public.attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wishlist" ON public.wishlist FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Allow all uploads" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Allow all downloads" ON storage.objects 
FOR SELECT USING (bucket_id = 'attachments');

CREATE POLICY "Allow all deletes" ON storage.objects 
FOR DELETE USING (bucket_id = 'attachments');

-- Create indexes for performance
CREATE INDEX idx_itinerary_trip_id ON public.itinerary_items(trip_id);
CREATE INDEX idx_accommodations_trip_id ON public.accommodations(trip_id);
CREATE INDEX idx_transports_trip_id ON public.transports(trip_id);
CREATE INDEX idx_expenses_trip_id ON public.expenses(trip_id);
CREATE INDEX idx_packing_items_trip_id ON public.packing_items(trip_id);
CREATE INDEX idx_attachments_trip_id ON public.attachments(trip_id);
CREATE INDEX idx_trips_dates ON public.trips(start_date, end_date);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();