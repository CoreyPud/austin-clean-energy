ALTER VIEW public.tcad_built_by_year_type_zip SET (security_invoker = false);
GRANT SELECT ON public.tcad_built_by_year_type_zip TO anon, authenticated;