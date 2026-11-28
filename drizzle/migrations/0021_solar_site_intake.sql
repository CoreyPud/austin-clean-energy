CREATE TABLE public.solar_site_intake (
  saved_assessment_id uuid PRIMARY KEY REFERENCES public.saved_assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT solar_site_notes_object CHECK (jsonb_typeof(notes) = 'object')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solar_site_intake TO authenticated;
GRANT ALL ON public.solar_site_intake TO service_role;
ALTER TABLE public.solar_site_intake ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Property owners manage site notes" ON public.solar_site_intake
FOR ALL TO authenticated
USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.saved_assessments s WHERE s.id = saved_assessment_id AND s.user_id = auth.uid()))
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.saved_assessments s WHERE s.id = saved_assessment_id AND s.user_id = auth.uid()));
CREATE POLICY "Property owners read site files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'solar-site-files' AND (storage.foldername(name))[1] = auth.uid()::text AND EXISTS (SELECT 1 FROM public.saved_assessments s WHERE s.id::text = (storage.foldername(name))[2] AND s.user_id = auth.uid()));
CREATE POLICY "Property owners upload site files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'solar-site-files' AND (storage.foldername(name))[1] = auth.uid()::text AND (storage.foldername(name))[3] IN ('meter', 'roof', 'transformer', 'bill', 'other') AND EXISTS (SELECT 1 FROM public.saved_assessments s WHERE s.id::text = (storage.foldername(name))[2] AND s.user_id = auth.uid()));
CREATE POLICY "Property owners delete site files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'solar-site-files' AND (storage.foldername(name))[1] = auth.uid()::text AND EXISTS (SELECT 1 FROM public.saved_assessments s WHERE s.id::text = (storage.foldername(name))[2] AND s.user_id = auth.uid()));