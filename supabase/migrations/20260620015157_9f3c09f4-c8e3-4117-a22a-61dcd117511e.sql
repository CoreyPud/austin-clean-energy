CREATE INDEX IF NOT EXISTS idx_solar_installations_tcad_pid
  ON public.solar_installations (tcad_pid)
  WHERE tcad_pid IS NOT NULL;