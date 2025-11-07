-- Create enum for share permissions
CREATE TYPE public.trip_share_role AS ENUM ('viewer', 'editor');

-- Create trip_shares table for user-based sharing
CREATE TABLE public.trip_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  role trip_share_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(trip_id, shared_with_email)
);

-- Create public_trip_links table for shareable public links
CREATE TABLE public.public_trip_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(trip_id)
);

-- Enable RLS
ALTER TABLE public.trip_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_trip_links ENABLE ROW LEVEL SECURITY;

-- Policies for trip_shares
CREATE POLICY "Users can view shares for their trips"
  ON public.trip_shares FOR SELECT
  USING (true);

CREATE POLICY "Trip owners can manage shares"
  ON public.trip_shares FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies for public_trip_links
CREATE POLICY "Anyone can view active public links"
  ON public.public_trip_links FOR SELECT
  USING (is_active = true);

CREATE POLICY "Trip owners can manage public links"
  ON public.public_trip_links FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create attractions table for popular spots
CREATE TABLE public.attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  place_id TEXT UNIQUE,
  lat NUMERIC,
  lng NUMERIC,
  rating NUMERIC,
  photo_reference TEXT,
  types TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attractions"
  ON public.attractions FOR SELECT
  USING (true);

CREATE POLICY "Allow all on attractions for now"
  ON public.attractions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add owner_id to trips table for proper ownership tracking
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX idx_trip_shares_trip_id ON public.trip_shares(trip_id);
CREATE INDEX idx_public_trip_links_token ON public.public_trip_links(share_token);
CREATE INDEX idx_attractions_country ON public.attractions(country);