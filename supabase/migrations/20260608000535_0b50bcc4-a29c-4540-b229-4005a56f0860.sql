
ALTER TABLE public.solar_installations ADD COLUMN IF NOT EXISTS parcel_id bigint;

UPDATE public.solar_installations
SET parcel_id = COALESCE(tcad_pid, wcad_pid)
WHERE tcad_pid IS NOT NULL OR wcad_pid IS NOT NULL;
