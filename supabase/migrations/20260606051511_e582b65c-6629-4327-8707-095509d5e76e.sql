ALTER TABLE public.solar_installations ADD COLUMN IF NOT EXISTS tcad_pid bigint;
CREATE TABLE IF NOT EXISTS public._tcad_pid_staging (id uuid PRIMARY KEY, pid bigint);
GRANT SELECT, INSERT, UPDATE, DELETE ON public._tcad_pid_staging TO authenticated;
GRANT ALL ON public._tcad_pid_staging TO service_role;
ALTER TABLE public._tcad_pid_staging ENABLE ROW LEVEL SECURITY;