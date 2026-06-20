
ALTER TABLE public.tcad_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read" ON public.tcad_properties;
CREATE POLICY "Public read" ON public.tcad_properties FOR SELECT USING (true);

GRANT SELECT ON public.tcad_properties TO anon, authenticated;
