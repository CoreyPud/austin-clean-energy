ALTER TABLE public.tcad_properties
  ADD COLUMN IF NOT EXISTS pid_int bigint
  GENERATED ALWAYS AS (
    CASE WHEN pid ~ '^\d+$' THEN pid::bigint ELSE NULL END
  ) STORED;

ALTER TABLE public.tcad_properties
  ADD CONSTRAINT tcad_properties_pid_int_key UNIQUE (pid_int);

ALTER TABLE public.solar_installations
  ADD CONSTRAINT fk_solar_tcad_pid
  FOREIGN KEY (tcad_pid) REFERENCES public.tcad_properties (pid_int)
  NOT VALID;