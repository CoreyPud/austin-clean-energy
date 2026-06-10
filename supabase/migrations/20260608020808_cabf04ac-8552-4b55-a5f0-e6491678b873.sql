UPDATE public.tcad_properties t
SET year_built = s.year_built
FROM (SELECT pid, MAX(year_built) AS year_built FROM public.wcad_year_built_staging GROUP BY pid) s
WHERE t.pid = s.pid AND t.county = 'williamson';

DROP TABLE public.wcad_year_built_staging;

REFRESH MATERIALIZED VIEW public.tcad_built_by_year_type_zip;