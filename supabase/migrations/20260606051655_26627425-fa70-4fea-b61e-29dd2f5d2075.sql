CREATE OR REPLACE VIEW public.solar_permits_by_year_class_zip AS
SELECT COALESCE(EXTRACT(year FROM completed_date)::integer, EXTRACT(year FROM issued_date)::integer, calendar_year_issued) AS year,
    lower(COALESCE(permit_class, 'unknown'::text)) AS permit_class,
    COALESCE(NULLIF(original_zip, ''::text), 'unknown'::text) AS zip,
    count(*) AS solar_count
FROM public.solar_installations
WHERE tcad_pid IS NOT NULL
  AND COALESCE(EXTRACT(year FROM completed_date)::integer, EXTRACT(year FROM issued_date)::integer, calendar_year_issued) IS NOT NULL
GROUP BY 1, 2, 3;