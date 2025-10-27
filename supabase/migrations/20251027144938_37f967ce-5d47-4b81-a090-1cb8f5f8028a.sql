-- Create solar_installations table for comprehensive solar data
CREATE TABLE IF NOT EXISTS public.solar_installations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text UNIQUE,
  permit_class text,
  address text NOT NULL,
  description text,
  installed_kw numeric,
  applied_date date,
  issued_date date,
  completed_date date,
  calendar_year_issued integer,
  status_current text,
  latitude numeric,
  longitude numeric,
  original_zip text,
  council_district text,
  jurisdiction text,
  contractor_company text,
  contractor_city text,
  link text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_solar_installations_zip ON public.solar_installations(original_zip);
CREATE INDEX idx_solar_installations_year ON public.solar_installations(calendar_year_issued);
CREATE INDEX idx_solar_installations_project_id ON public.solar_installations(project_id);
CREATE INDEX idx_solar_installations_location ON public.solar_installations(latitude, longitude);

-- Enable RLS (public read access for this data)
ALTER TABLE public.solar_installations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to solar installation data
CREATE POLICY "Anyone can read solar installations"
  ON public.solar_installations
  FOR SELECT
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_solar_installations_updated_at
  BEFORE UPDATE ON public.solar_installations
  FOR EACH ROW
  EXECUTE FUNCTION update_cached_stats_timestamp();