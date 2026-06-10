DROP VIEW IF EXISTS public.tcad_solar_adoption_by_year;

CREATE VIEW public.tcad_solar_adoption_by_year
WITH (security_invoker = true) AS
WITH per_year AS (
  SELECT
    year_built::int AS year,
    count(*)::int AS built_count,
    count(*) FILTER (WHERE has_solar)::int AS solar_count,
    COALESCE(SUM(estimated_roof_sqft), 0)::bigint AS built_sqft,
    COALESCE(SUM(estimated_roof_sqft) FILTER (WHERE has_solar), 0)::bigint AS solar_sqft,
    count(*) FILTER (WHERE property_type IN ('single_family','condo','multifamily'))::int AS built_residential_count,
    count(*) FILTER (WHERE property_type = 'commercial')::int AS built_commercial_count
  FROM public.tcad_properties
  WHERE year_built IS NOT NULL
    AND year_built BETWEEN 1900 AND extract(year FROM now())::int
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
  SUM(built_count) OVER (ORDER BY year)::int AS cumulative_built,
  SUM(solar_count) OVER (ORDER BY year)::int AS cumulative_solar,
  SUM(built_sqft) OVER (ORDER BY year)::bigint AS cumulative_built_sqft,
  SUM(solar_sqft) OVER (ORDER BY year)::bigint AS cumulative_solar_sqft,
  SUM(built_residential_count) OVER (ORDER BY year)::int AS cumulative_built_residential,
  SUM(built_commercial_count) OVER (ORDER BY year)::int AS cumulative_built_commercial,
  ROUND(
    100.0 * SUM(solar_count) OVER (ORDER BY year)
         / NULLIF(SUM(built_count) OVER (ORDER BY year), 0),
    3
  )::numeric AS cumulative_adoption_pct
FROM per_year
ORDER BY year;

GRANT SELECT ON public.tcad_solar_adoption_by_year TO anon;
GRANT SELECT ON public.tcad_solar_adoption_by_year TO authenticated;
GRANT SELECT ON public.tcad_solar_adoption_by_year TO service_role;