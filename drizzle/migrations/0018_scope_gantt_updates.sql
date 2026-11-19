DROP POLICY IF EXISTS "Signed-in users edit schedules" ON public.gantt_schedules;
CREATE POLICY "Creators edit their schedules" ON public.gantt_schedules FOR UPDATE TO authenticated
USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Signed-in users update comments" ON public.gantt_task_comments;
CREATE POLICY "Authors or schedule owners update comments" ON public.gantt_task_comments FOR UPDATE TO authenticated
USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.gantt_schedules s WHERE s.id = schedule_id AND s.created_by = auth.uid()))
WITH CHECK (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.gantt_schedules s WHERE s.id = schedule_id AND s.created_by = auth.uid()));