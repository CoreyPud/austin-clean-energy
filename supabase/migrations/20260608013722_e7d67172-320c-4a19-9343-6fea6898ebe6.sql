DROP MATERIALIZED VIEW IF EXISTS public.tcad_built_by_year_type_zip;

CREATE MATERIALIZED VIEW public.tcad_built_by_year_type_zip AS
SELECT
  COALESCE(year_built, 1900) AS year,
  property_type,
  situs_zip AS zip,
  COUNT(*) AS built_count
FROM public.tcad_properties
WHERE situs_zip IS NOT NULL
GROUP BY COALESCE(year_built, 1900), property_type, situs_zip;

CREATE INDEX idx_tcad_built_by_year_type_zip_zip
  ON public.tcad_built_by_year_type_zip (zip);

GRANT SELECT ON public.tcad_built_by_year_type_zip TO anon, authenticated, service_role;