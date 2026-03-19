
-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS public.solar_installations_view;

-- Step 2: Add new columns
ALTER TABLE public.solar_installations ADD COLUMN IF NOT EXISTS permit_number text;
ALTER TABLE public.solar_installations ADD COLUMN IF NOT EXISTS total_job_valuation numeric;
ALTER TABLE public.solar_installations ADD COLUMN IF NOT EXISTS electrical_valuation numeric;

-- Step 3: Recreate the view with new columns
CREATE VIEW public.solar_installations_view AS
SELECT 
    s.id,
    s.project_id,
    s.permit_number,
    s.total_job_valuation,
    s.electrical_valuation,
    COALESCE(c.corrected_kw, s.installed_kw) AS installed_kw,
    COALESCE(c.corrected_address, s.address) AS address,
    COALESCE(c.corrected_latitude, s.latitude) AS latitude,
    COALESCE(c.corrected_longitude, s.longitude) AS longitude,
    COALESCE(c.corrected_completed_date, s.completed_date) AS completed_date,
    COALESCE(c.corrected_applied_date, s.applied_date) AS applied_date,
    COALESCE(c.corrected_issued_date, s.issued_date) AS issued_date,
    COALESCE(c.corrected_description, s.description) AS description,
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
    c.id IS NOT NULL AS has_correction,
    c.is_duplicate,
    c.notes AS correction_notes
FROM solar_installations s
LEFT JOIN installation_corrections c ON s.project_id = c.project_id
WHERE c.is_duplicate IS NOT TRUE OR c.is_duplicate IS NULL;
