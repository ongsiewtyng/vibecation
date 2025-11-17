-- Add city column to attractions table
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS city text;

-- Create index for country and city filtering
CREATE INDEX IF NOT EXISTS attractions_country_city_idx ON attractions(country, city);