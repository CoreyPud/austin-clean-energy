DROP VIEW IF EXISTS public.tcad_solar_adoption_by_year;

CREATE VIEW public.tcad_solar_adoption_by_year
WITH (security_invoker = true) AS
WITH per_year AS (
  SELECT
    year_built AS year,
    COUNT(*) FILTER (WHERE year_built IS NOT NULL) AS built_count,
    COUNT(*) FILTER (WHERE year_built IS NOT NULL AND has_solar IS TRUE) AS solar_count,
    COALESCE(SUM(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL), 0) AS built_sqft,
    COALESCE(SUM(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL AND has_solar IS TRUE), 0) AS solar_sqft,
    COUNT(*) FILTER (WHERE year_built IS NOT NULL AND property_type = 'single_family') AS built_residential_count,
    COUNT(*) FILTER (WHERE year_built IS NOT NULL AND property_type = 'commercial') AS built_commercial_count,
    COALESCE(SUM(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL AND property_type = 'single_family'), 0) AS built_residential_sqft,
    COALESCE(SUM(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL AND property_type = 'commercial'), 0) AS built_commercial_sqft,
    COALESCE(SUM(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL AND property_type = 'single_family' AND has_solar IS TRUE), 0) AS solar_residential_sqft,
    COALESCE(SUM(estimated_roof_sqft) FILTER (WHERE year_built IS NOT NULL AND property_type = 'commercial' AND has_solar IS TRUE), 0) AS solar_commercial_sqft
  FROM public.tcad_properties
  WHERE year_built IS NOT NULL
  GROUP BY year_built
)
SELECT
  year,
  built_count,
  solar_count,
  built_sqft,
  solar_sqft,
  built_residential_count,
  built_commercial_count,
  built_residential_sqft,
  built_commercial_sqft,
  solar_residential_sqft,
  solar_commercial_sqft,
  SUM(built_count) OVER (ORDER BY year) AS cumulative_built,
  SUM(solar_count) OVER (ORDER BY year) AS cumulative_solar,
  SUM(built_sqft) OVER (ORDER BY year) AS cumulative_built_sqft,
  SUM(solar_sqft) OVER (ORDER BY year) AS cumulative_solar_sqft,
  SUM(built_residential_count) OVER (ORDER BY year) AS cumulative_built_residential,
  SUM(built_commercial_count) OVER (ORDER BY year) AS cumulative_built_commercial,
  SUM(built_residential_sqft) OVER (ORDER BY year) AS cumulative_built_residential_sqft,
  SUM(built_commercial_sqft) OVER (ORDER BY year) AS cumulative_built_commercial_sqft,
  SUM(solar_residential_sqft) OVER (ORDER BY year) AS cumulative_solar_residential_sqft,
  SUM(solar_commercial_sqft) OVER (ORDER BY year) AS cumulative_solar_commercial_sqft,
  CASE WHEN SUM(built_count) OVER (ORDER BY year) > 0
       THEN 100.0 * SUM(solar_count) OVER (ORDER BY year) / SUM(built_count) OVER (ORDER BY year)
       ELSE 0 END AS cumulative_adoption_pct
FROM per_year
ORDER BY year;

GRANT SELECT ON public.tcad_solar_adoption_by_year TO anon, authenticated, service_role;