
DROP MATERIALIZED VIEW IF EXISTS public.tcad_built_by_year_type_zip;
DROP VIEW IF EXISTS public.tcad_solar_adoption_by_year;

ALTER TABLE public.tcad_properties
  ALTER COLUMN pid TYPE text USING pid::text;

ALTER TABLE public.tcad_properties
  ADD COLUMN IF NOT EXISTS county text DEFAULT 'travis';

UPDATE public.tcad_properties SET county = 'travis' WHERE county IS NULL;

-- Recreate materialized view
CREATE MATERIALIZED VIEW public.tcad_built_by_year_type_zip AS
SELECT
  year_built AS year,
  property_type,
  situs_zip AS zip,
  COUNT(*)::bigint AS built_count
FROM public.tcad_properties
WHERE year_built IS NOT NULL AND situs_zip IS NOT NULL
GROUP BY year_built, property_type, situs_zip;

CREATE INDEX idx_tcad_built_zip ON public.tcad_built_by_year_type_zip (zip);
CREATE INDEX idx_tcad_built_year ON public.tcad_built_by_year_type_zip (year);
GRANT SELECT ON public.tcad_built_by_year_type_zip TO anon, authenticated;
GRANT ALL ON public.tcad_built_by_year_type_zip TO service_role;

-- Recreate solar adoption view (matching original definition)
CREATE VIEW public.tcad_solar_adoption_by_year
WITH (security_invoker = true) AS
WITH per_year AS (
  SELECT year_built AS year,
    count(*) FILTER (WHERE year_built IS NOT NULL) AS built_count,
    count(*) FILTER (WHERE year_built IS NOT NULL AND has_solar IS TRUE) AS solar_count,
    COALESCE(sum(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL), 0::bigint) AS built_sqft,
    COALESCE(sum(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL AND has_solar IS TRUE), 0::bigint) AS solar_sqft,
    count(*) FILTER (WHERE year_built IS NOT NULL AND property_type = 'single_family') AS built_residential_count,
    count(*) FILTER (WHERE year_built IS NOT NULL AND property_type = 'commercial') AS built_commercial_count,
    COALESCE(sum(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL AND property_type = 'single_family'), 0::bigint) AS built_residential_sqft,
    COALESCE(sum(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL AND property_type = 'commercial'), 0::bigint) AS built_commercial_sqft,
    COALESCE(sum(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL AND property_type = 'single_family' AND has_solar IS TRUE), 0::bigint) AS solar_residential_sqft,
    COALESCE(sum(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL AND property_type = 'commercial' AND has_solar IS TRUE), 0::bigint) AS solar_commercial_sqft
  FROM tcad_properties
  WHERE year_built IS NOT NULL
  GROUP BY year_built
)
SELECT year, built_count, solar_count, built_sqft, solar_sqft,
  built_residential_count, built_commercial_count,
  built_residential_sqft, built_commercial_sqft,
  solar_residential_sqft, solar_commercial_sqft,
  sum(built_count) OVER (ORDER BY year) AS cumulative_built,
  sum(solar_count) OVER (ORDER BY year) AS cumulative_solar,
  sum(built_sqft) OVER (ORDER BY year) AS cumulative_built_sqft,
  sum(solar_sqft) OVER (ORDER BY year) AS cumulative_solar_sqft,
  sum(built_residential_count) OVER (ORDER BY year) AS cumulative_built_residential,
  sum(built_commercial_count) OVER (ORDER BY year) AS cumulative_built_commercial,
  sum(built_residential_sqft) OVER (ORDER BY year) AS cumulative_built_residential_sqft,
  sum(built_commercial_sqft) OVER (ORDER BY year) AS cumulative_built_commercial_sqft,
  sum(solar_residential_sqft) OVER (ORDER BY year) AS cumulative_solar_residential_sqft,
  sum(solar_commercial_sqft) OVER (ORDER BY year) AS cumulative_solar_commercial_sqft,
  CASE WHEN sum(built_count) OVER (ORDER BY year) > 0
       THEN (sum(solar_count) OVER (ORDER BY year)::numeric / sum(built_count) OVER (ORDER BY year)::numeric) * 100
       ELSE 0 END AS cumulative_adoption_pct
FROM per_year;

GRANT SELECT ON public.tcad_solar_adoption_by_year TO anon, authenticated;
GRANT ALL ON public.tcad_solar_adoption_by_year TO service_role;
