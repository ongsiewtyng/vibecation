-- Add missing columns to attractions table for enriched data
ALTER TABLE attractions 
ADD COLUMN IF NOT EXISTS user_ratings_total integer,
ADD COLUMN IF NOT EXISTS formatted_address text;

-- Drop the existing types array column and recreate as jsonb
ALTER TABLE attractions 
DROP COLUMN IF EXISTS types CASCADE;

ALTER TABLE attractions 
ADD COLUMN types jsonb;

-- Add unique constraint on place_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_attractions_place_id ON attractions(place_id);

-- Add index on country for faster queries
CREATE INDEX IF NOT EXISTS idx_attractions_country ON attractions(country);