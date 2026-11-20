CREATE VIEW public.permit_date_coverage_view
WITH (security_invoker = true) AS
SELECT
  min(filter_date)::text AS earliest,
  max(filter_date)::text AS latest,
  count(filter_date)::integer AS dated
FROM (
  SELECT CASE
    WHEN lower(trim(status_current)) = 'final' THEN completed_date
    ELSE COALESCE(issued_date, applied_date)
  END AS filter_date
  FROM public.solar_installations_view
) AS permit_dates;

GRANT SELECT ON public.permit_date_coverage_view TO anon, authenticated;
GRANT SELECT ON public.permit_date_coverage_view TO service_role;