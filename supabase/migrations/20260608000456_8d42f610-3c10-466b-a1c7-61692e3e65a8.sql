
UPDATE public.solar_installations s
SET tcad_pid = p.tcad_pid
FROM public.pid_staging p
WHERE s.id = p.id AND p.tcad_pid IS NOT NULL;

UPDATE public.solar_installations s
SET wcad_pid = p.wcad_pid
FROM public.pid_staging p
WHERE s.id = p.id AND p.wcad_pid IS NOT NULL;

DROP TABLE public.pid_staging;
