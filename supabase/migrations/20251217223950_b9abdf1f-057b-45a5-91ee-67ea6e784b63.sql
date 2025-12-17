-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create installation_corrections table for storing manual overrides
CREATE TABLE public.installation_corrections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text NOT NULL UNIQUE,
  
  -- Corrected values (NULL means use original)
  corrected_kw numeric,
  corrected_address text,
  corrected_latitude numeric,
  corrected_longitude numeric,
  corrected_completed_date date,
  corrected_applied_date date,
  corrected_issued_date date,
  corrected_description text,
  
  -- Original values preserved for audit
  original_kw numeric,
  original_address text,
  original_latitude numeric,
  original_longitude numeric,
  original_completed_date date,
  original_applied_date date,
  original_issued_date date,
  original_description text,
  
  -- Metadata
  is_duplicate boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.installation_corrections ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read corrections"
ON public.installation_corrections
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_installation_corrections_updated_at
BEFORE UPDATE ON public.installation_corrections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unified view that merges corrections with original data
CREATE VIEW public.solar_installations_view AS
SELECT 
  s.id,
  s.project_id,
  COALESCE(c.corrected_kw, s.installed_kw) as installed_kw,
  COALESCE(c.corrected_address, s.address) as address,
  COALESCE(c.corrected_latitude, s.latitude) as latitude,
  COALESCE(c.corrected_longitude, s.longitude) as longitude,
  COALESCE(c.corrected_completed_date, s.completed_date) as completed_date,
  COALESCE(c.corrected_applied_date, s.applied_date) as applied_date,
  COALESCE(c.corrected_issued_date, s.issued_date) as issued_date,
  COALESCE(c.corrected_description, s.description) as description,
  s.calendar_year_issued,
  s.original_zip,
  s.council_district,
  s.permit_class,
  s.jurisdiction,
  s.contractor_company,
  s.contractor_city,
  s.link,
  s.status_current,
  s.created_at,
  s.updated_at,
  (c.id IS NOT NULL) as has_correction,
  c.is_duplicate,
  c.notes as correction_notes
FROM public.solar_installations s
LEFT JOIN public.installation_corrections c ON s.project_id = c.project_id
WHERE c.is_duplicate IS NOT TRUE OR c.is_duplicate IS NULL;