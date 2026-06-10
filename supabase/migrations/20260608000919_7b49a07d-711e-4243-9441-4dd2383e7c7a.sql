
UPDATE public.solar_installations
SET parcel_id = 'R' || LPAD(wcad_pid::text, 6, '0')
WHERE wcad_pid IS NOT NULL;
