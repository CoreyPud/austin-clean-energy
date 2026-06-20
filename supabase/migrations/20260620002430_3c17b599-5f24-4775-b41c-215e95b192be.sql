
CREATE TABLE IF NOT EXISTS public.property_plant_distances_staging (
  pid text PRIMARY KEY,
  dist_nearest_gas_plant_mi double precision,
  dist_proposed_peaker_mi double precision
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_plant_distances_staging TO sandbox_exec;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_plant_distances_staging TO authenticated, service_role;
ALTER TABLE public.property_plant_distances_staging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service only" ON public.property_plant_distances_staging FOR SELECT USING (false);
