DROP MATERIALIZED VIEW IF EXISTS public.solar_permits_by_year_class_zip;

CREATE MATERIALIZED VIEW public.solar_permits_by_year_class_zip AS
SELECT
  COALESCE(
    EXTRACT(year FROM completed_date)::integer,
    EXTRACT(year FROM issued_date)::integer,
    calendar_year_issued
  ) AS year,
  lower(COALESCE(permit_class, 'unknown')) AS permit_class,
  COALESCE(NULLIF(original_zip, ''), 'unknown') AS zip,
  COUNT(*) AS solar_count
FROM public.solar_installations
WHERE parcel_id IS NOT NULL
  AND COALESCE(
    EXTRACT(year FROM completed_date)::integer,
    EXTRACT(year FROM issued_date)::integer,
    calendar_year_issued
  ) IS NOT NULL
GROUP BY 1, 2, 3;

CREATE INDEX idx_solar_permits_by_year_class_zip_zip
  ON public.solar_permits_by_year_class_zip (zip);

GRANT SELECT ON public.solar_permits_by_year_class_zip TO anon, authenticated, service_role;