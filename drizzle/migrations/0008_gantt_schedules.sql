CREATE TABLE public.gantt_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL DEFAULT current_date,
  saved_assessment_id uuid,
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gantt_schedules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gantt_schedules TO authenticated;
GRANT ALL ON public.gantt_schedules TO service_role;
ALTER TABLE public.gantt_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view schedules" ON public.gantt_schedules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Signed-in users create schedules" ON public.gantt_schedules FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Signed-in users edit schedules" ON public.gantt_schedules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Creators delete schedules" ON public.gantt_schedules FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE TABLE public.gantt_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.gantt_schedules(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  parent_id uuid REFERENCES public.gantt_task_comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid(),
  author_name text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);
CREATE INDEX gantt_task_comments_schedule_idx ON public.gantt_task_comments(schedule_id, task_id);
GRANT SELECT ON public.gantt_task_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gantt_task_comments TO authenticated;
GRANT ALL ON public.gantt_task_comments TO service_role;
ALTER TABLE public.gantt_task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.gantt_task_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Signed-in users comment as themselves" ON public.gantt_task_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Signed-in users update comments" ON public.gantt_task_comments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authors delete comments" ON public.gantt_task_comments FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE OR REPLACE FUNCTION public.gantt_comment_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.author_id <> OLD.author_id OR NEW.author_name <> OLD.author_name OR NEW.created_at <> OLD.created_at OR NEW.task_id <> OLD.task_id OR NEW.schedule_id <> OLD.schedule_id THEN
    RAISE EXCEPTION 'Comment authorship cannot change';
  END IF;
  IF NEW.body <> OLD.body THEN
    IF OLD.author_id <> auth.uid() THEN RAISE EXCEPTION 'Only the author can edit a comment'; END IF;
    NEW.edited_at := now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER gantt_comment_guard BEFORE UPDATE ON public.gantt_task_comments FOR EACH ROW EXECUTE FUNCTION public.gantt_comment_guard();

CREATE OR REPLACE FUNCTION public.gantt_schedule_touch() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); NEW.updated_by := auth.uid(); NEW.created_by := OLD.created_by; RETURN NEW; END $$;
CREATE TRIGGER gantt_schedule_touch BEFORE UPDATE ON public.gantt_schedules FOR EACH ROW EXECUTE FUNCTION public.gantt_schedule_touch();