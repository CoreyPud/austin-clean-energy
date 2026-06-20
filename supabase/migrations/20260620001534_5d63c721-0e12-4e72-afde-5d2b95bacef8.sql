
CREATE TABLE IF NOT EXISTS public.proposed_peaker_sites (
  id        integer PRIMARY KEY,
  name      text NOT NULL,
  latitude  double precision NOT NULL,
  longitude double precision NOT NULL
);

GRANT SELECT ON public.proposed_peaker_sites TO anon, authenticated;
GRANT ALL ON public.proposed_peaker_sites TO service_role;

ALTER TABLE public.proposed_peaker_sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read" ON public.proposed_peaker_sites;
CREATE POLICY "Public read" ON public.proposed_peaker_sites FOR SELECT USING (true);

INSERT INTO public.proposed_peaker_sites (id, name, latitude, longitude) VALUES
  ( 1, 'Site 1',  30.46406, -97.73575),
  ( 2, 'Site 2',  30.44333, -97.71652),
  ( 3, 'Site 3',  30.41495, -97.84012),
  ( 4, 'Site 4',  30.40429, -97.81540),
  ( 5, 'Site 5',  30.23422, -97.87514),
  ( 6, 'Site 6',  30.29878, -97.59499),
  ( 7, 'Site 7',  30.19913, -97.61009),
  ( 8, 'Site 8',  30.17486, -97.76596),
  ( 9, 'Site 9',  30.16059, -97.66914),
  (10, 'Site 10', 30.14870, -97.61765),
  (11, 'Site 11', 30.36161, -97.63618),
  (12, 'Site 12', 30.24957, -97.66296),
  (13, 'Site 13', 30.24895, -97.51808),
  (14, 'Site 14', 30.13090, -97.65129)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.tcad_properties
  ADD COLUMN IF NOT EXISTS dist_nearest_gas_plant_mi double precision,
  ADD COLUMN IF NOT EXISTS dist_proposed_peaker_mi   double precision;

CREATE OR REPLACE FUNCTION public.haversine_mi(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
)
RETURNS double precision LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path = public
AS $$
  SELECT 2.0 * 3958.8 * asin(sqrt(
    power(sin(radians((lat2 - lat1) / 2.0)), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians((lon2 - lon1) / 2.0)), 2)
  ))
$$;

CREATE OR REPLACE FUNCTION public.compute_plant_distances()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.centroid_lat IS NOT NULL AND NEW.centroid_lon IS NOT NULL THEN
    SELECT MIN(public.haversine_mi(NEW.centroid_lat, NEW.centroid_lon, p.latitude, p.longitude))
    INTO NEW.dist_nearest_gas_plant_mi
    FROM public.power_plants p
    WHERE p.fuel = 'gas' AND p.latitude IS NOT NULL;

    SELECT MIN(public.haversine_mi(NEW.centroid_lat, NEW.centroid_lon, p.latitude, p.longitude))
    INTO NEW.dist_proposed_peaker_mi
    FROM public.proposed_peaker_sites p;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plant_distances ON public.tcad_properties;
CREATE TRIGGER trg_plant_distances
  BEFORE INSERT OR UPDATE OF centroid_lat, centroid_lon
  ON public.tcad_properties
  FOR EACH ROW EXECUTE FUNCTION public.compute_plant_distances();
