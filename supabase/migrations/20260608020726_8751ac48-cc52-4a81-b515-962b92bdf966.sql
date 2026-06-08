CREATE TABLE public.wcad_year_built_staging (pid text PRIMARY KEY, year_built integer);
GRANT ALL ON public.wcad_year_built_staging TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wcad_year_built_staging TO authenticated;
ALTER TABLE public.wcad_year_built_staging ENABLE ROW LEVEL SECURITY;