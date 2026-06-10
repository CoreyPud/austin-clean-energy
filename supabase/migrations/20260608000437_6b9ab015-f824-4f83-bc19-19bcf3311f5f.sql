
CREATE TABLE public.pid_staging (
  id uuid PRIMARY KEY,
  tcad_pid bigint,
  wcad_pid bigint
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pid_staging TO authenticated, anon;
GRANT ALL ON public.pid_staging TO service_role;
ALTER TABLE public.pid_staging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open staging" ON public.pid_staging FOR ALL USING (true) WITH CHECK (true);
