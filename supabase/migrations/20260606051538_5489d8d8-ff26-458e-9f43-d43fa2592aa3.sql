UPDATE public.solar_installations s
SET tcad_pid = st.pid
FROM public._tcad_pid_staging st
WHERE s.id = st.id AND st.pid IS NOT NULL;

DROP TABLE public._tcad_pid_staging;