
ALTER TABLE public.solar_installations
  ALTER COLUMN parcel_id TYPE text USING parcel_id::text;

UPDATE public.solar_installations
SET parcel_id = 'R' || wcad_pid::text
WHERE wcad_pid IS NOT NULL;
