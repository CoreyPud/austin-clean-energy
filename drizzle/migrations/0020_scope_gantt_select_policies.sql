REVOKE SELECT ON public.gantt_schedules FROM anon;
DROP POLICY IF EXISTS "Anyone can view schedules" ON public.gantt_schedules;
CREATE POLICY "Creators view their schedules" ON public.gantt_schedules
FOR SELECT TO authenticated
USING (auth.uid() = created_by);

REVOKE SELECT ON public.gantt_task_comments FROM anon;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.gantt_task_comments;
CREATE POLICY "Authors or schedule owners view comments" ON public.gantt_task_comments
FOR SELECT TO authenticated
USING (
  auth.uid() = author_id
  OR EXISTS (
    SELECT 1 FROM public.gantt_schedules s
    WHERE s.id = schedule_id AND s.created_by = auth.uid()
  )
);