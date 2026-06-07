
-- Materialize the two aggregation views to avoid statement timeout on paginated reads
DROP VIEW IF EXISTS public.tcad_built_by_year_type_zip CASCADE;
DROP VIEW IF EXISTS public.solar_permits_by_year_class_zip CASCADE;

CREATE MATERIALIZED VIEW public.tcad_built_by_year_type_zip AS
SELECT year_built AS year,
       COALESCE(property_type, 'unknown') AS property_type,
       COALESCE(NULLIF(situs_zip, ''), 'unknown') AS zip,
       count(*) AS built_count
  FROM tcad_properties
 WHERE year_built IS NOT NULL
 GROUP BY year_built, COALESCE(property_type, 'unknown'),
          COALESCE(NULLIF(situs_zip, ''), 'unknown');

CREATE INDEX ON public.tcad_built_by_year_type_zip (zip);
CREATE INDEX ON public.tcad_built_by_year_type_zip (year);

CREATE MATERIALIZED VIEW public.solar_permits_by_year_class_zip AS
SELECT COALESCE(EXTRACT(year FROM completed_date)::int,
                EXTRACT(year FROM issued_date)::int,
                calendar_year_issued) AS year,
       lower(COALESCE(permit_class, 'unknown')) AS permit_class,
       COALESCE(NULLIF(original_zip, ''), 'unknown') AS zip,
       count(*) AS solar_count
  FROM solar_installations
 WHERE tcad_pid IS NOT NULL
   AND COALESCE(EXTRACT(year FROM completed_date)::int,
                EXTRACT(year FROM issued_date)::int,
                calendar_year_issued) IS NOT NULL
 GROUP BY 1, 2, 3;

CREATE INDEX ON public.solar_permits_by_year_class_zip (zip);
CREATE INDEX ON public.solar_permits_by_year_class_zip (year);

GRANT SELECT ON public.tcad_built_by_year_type_zip TO anon, authenticated;
GRANT SELECT ON public.solar_permits_by_year_class_zip TO anon, authenticated;
GRANT ALL ON public.tcad_built_by_year_type_zip TO service_role;
GRANT ALL ON public.solar_permits_by_year_class_zip TO service_role;
