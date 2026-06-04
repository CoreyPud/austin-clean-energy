DROP VIEW IF EXISTS public.tcad_built_by_year_type_zip;
CREATE VIEW public.tcad_built_by_year_type_zip
WITH (security_invoker = true) AS
SELECT
  year_built AS year,
  COALESCE(property_type, 'unknown') AS property_type,
  COALESCE(NULLIF(situs_zip, ''), 'unknown') AS zip,
  COUNT(*) AS built_count
FROM public.tcad_properties
WHERE year_built IS NOT NULL
GROUP BY year_built, COALESCE(property_type, 'unknown'), COALESCE(NULLIF(situs_zip, ''), 'unknown');

GRANT SELECT ON public.tcad_built_by_year_type_zip TO anon, authenticated, service_role;

DROP VIEW IF EXISTS public.solar_permits_by_year_class_zip;
CREATE VIEW public.solar_permits_by_year_class_zip
WITH (security_invoker = true) AS
SELECT
  COALESCE(
    EXTRACT(YEAR FROM completed_date)::int,
    EXTRACT(YEAR FROM issued_date)::int,
    calendar_year_issued
  ) AS year,
  LOWER(COALESCE(permit_class, 'unknown')) AS permit_class,
  COALESCE(NULLIF(original_zip, ''), 'unknown') AS zip,
  COUNT(*) AS solar_count
FROM public.solar_installations
WHERE COALESCE(
        EXTRACT(YEAR FROM completed_date)::int,
        EXTRACT(YEAR FROM issued_date)::int,
        calendar_year_issued
      ) IS NOT NULL
GROUP BY 1, 2, 3;

GRANT SELECT ON public.solar_permits_by_year_class_zip TO anon, authenticated, service_role;