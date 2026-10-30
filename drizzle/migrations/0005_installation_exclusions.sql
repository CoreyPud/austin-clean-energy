ALTER TABLE public.installation_corrections
  ADD COLUMN IF NOT EXISTS is_excluded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exclusion_reason text;

CREATE OR REPLACE VIEW public.solar_installations_admin_view WITH (security_invoker = true) AS
 SELECT s.id, s.project_id, s.permit_number, s.total_job_valuation, s.electrical_valuation,
    COALESCE(c.corrected_kw, s.installed_kw) AS installed_kw,
    COALESCE(c.corrected_address, s.address) AS address,
    COALESCE(c.corrected_latitude, s.latitude) AS latitude,
    COALESCE(c.corrected_longitude, s.longitude) AS longitude,
    COALESCE(c.corrected_completed_date, s.completed_date) AS completed_date,
    COALESCE(c.corrected_applied_date, s.applied_date) AS applied_date,
    COALESCE(c.corrected_issued_date, s.issued_date) AS issued_date,
    COALESCE(c.corrected_description, s.description) AS description,
    s.calendar_year_issued, s.original_zip, s.council_district, s.permit_class, s.jurisdiction,
    s.contractor_company, s.contractor_city, s.link, s.status_current, s.created_at, s.updated_at,
    (c.id IS NOT NULL) AS has_correction,
    c.is_duplicate,
    c.notes AS correction_notes,
    COALESCE(c.is_excluded, false) AS is_excluded,
    c.exclusion_reason
   FROM public.solar_installations s
   LEFT JOIN public.installation_corrections c ON s.project_id = c.project_id;

REVOKE ALL ON public.solar_installations_admin_view FROM anon, authenticated;
GRANT SELECT ON public.solar_installations_admin_view TO service_role;

CREATE OR REPLACE VIEW public.solar_installations_view WITH (security_invoker = true) AS
 SELECT s.id, s.project_id, s.permit_number, s.total_job_valuation, s.electrical_valuation,
    COALESCE(c.corrected_kw, s.installed_kw) AS installed_kw,
    COALESCE(c.corrected_address, s.address) AS address,
    COALESCE(c.corrected_latitude, s.latitude) AS latitude,
    COALESCE(c.corrected_longitude, s.longitude) AS longitude,
    COALESCE(c.corrected_completed_date, s.completed_date) AS completed_date,
    COALESCE(c.corrected_applied_date, s.applied_date) AS applied_date,
    COALESCE(c.corrected_issued_date, s.issued_date) AS issued_date,
    COALESCE(c.corrected_description, s.description) AS description,
    s.calendar_year_issued, s.original_zip, s.council_district, s.permit_class, s.jurisdiction,
    s.contractor_company, s.contractor_city, s.link, s.status_current, s.created_at, s.updated_at,
    (c.id IS NOT NULL) AS has_correction,
    c.is_duplicate,
    c.notes AS correction_notes
   FROM public.solar_installations s
   LEFT JOIN public.installation_corrections c ON s.project_id = c.project_id
  WHERE (c.is_duplicate IS NOT TRUE) AND (c.is_excluded IS NOT TRUE);