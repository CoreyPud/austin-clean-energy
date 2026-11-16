ALTER FUNCTION public.move_to_dlq(text,text,bigint,jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text,integer,integer) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text,jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text,bigint) SET search_path = public, pgmq;

ALTER TABLE public.council_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read council districts" ON public.council_districts FOR SELECT TO anon, authenticated USING (true);
ALTER TABLE public.ae_service_area ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read service area" ON public.ae_service_area FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Signed-in users edit schedules" ON public.gantt_schedules;
CREATE POLICY "Signed-in users edit schedules" ON public.gantt_schedules FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Signed-in users update comments" ON public.gantt_task_comments;
CREATE POLICY "Signed-in users update comments" ON public.gantt_task_comments FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "no2-maps: deny public select" ON storage.objects;
DROP POLICY IF EXISTS "no2-maps: deny public insert" ON storage.objects;
DROP POLICY IF EXISTS "no2-maps: deny public update" ON storage.objects;
DROP POLICY IF EXISTS "no2-maps: deny public delete" ON storage.objects;