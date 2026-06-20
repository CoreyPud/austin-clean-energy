-- Proposed AE peaker sites (Phase III shortlist, coords verified 2026-06-19)
CREATE TABLE IF NOT EXISTS proposed_peaker_sites (
  id        integer PRIMARY KEY,
  name      text NOT NULL,
  latitude  numeric NOT NULL,
  longitude numeric NOT NULL
);

ALTER TABLE proposed_peaker_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON proposed_peaker_sites FOR SELECT USING (true);

INSERT INTO proposed_peaker_sites (id, name, latitude, longitude) VALUES
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
  (14, 'Site 14', 30.13090, -97.65129);

-- Distance columns on properties
ALTER TABLE tcad_properties
  ADD COLUMN IF NOT EXISTS dist_nearest_gas_plant_mi numeric,
  ADD COLUMN IF NOT EXISTS dist_proposed_peaker_mi   numeric;

-- Haversine distance in miles (no PostGIS required)
CREATE OR REPLACE FUNCTION haversine_mi(
  lat1 numeric, lon1 numeric,
  lat2 numeric, lon2 numeric
)
RETURNS numeric LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT 2.0 * 3958.8 * asin(sqrt(
    power(sin(radians((lat2 - lat1) / 2.0)), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians((lon2 - lon1) / 2.0)), 2)
  ))
$$;

-- Auto-compute distances whenever centroid is set/updated
CREATE OR REPLACE FUNCTION compute_plant_distances()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.centroid_lat IS NOT NULL AND NEW.centroid_lon IS NOT NULL THEN
    SELECT MIN(haversine_mi(NEW.centroid_lat, NEW.centroid_lon, p.latitude, p.longitude))
    INTO NEW.dist_nearest_gas_plant_mi
    FROM power_plants p
    WHERE p.fuel = 'gas' AND p.latitude IS NOT NULL;

    SELECT MIN(haversine_mi(NEW.centroid_lat, NEW.centroid_lon, p.latitude, p.longitude))
    INTO NEW.dist_proposed_peaker_mi
    FROM proposed_peaker_sites p;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plant_distances ON tcad_properties;
CREATE TRIGGER trg_plant_distances
  BEFORE INSERT OR UPDATE OF centroid_lat, centroid_lon
  ON tcad_properties
  FOR EACH ROW EXECUTE FUNCTION compute_plant_distances();

-- Backfill all rows that already have a centroid
UPDATE tcad_properties t
SET
  dist_nearest_gas_plant_mi = (
    SELECT MIN(haversine_mi(t.centroid_lat, t.centroid_lon, p.latitude, p.longitude))
    FROM power_plants p
    WHERE p.fuel = 'gas' AND p.latitude IS NOT NULL
  ),
  dist_proposed_peaker_mi = (
    SELECT MIN(haversine_mi(t.centroid_lat, t.centroid_lon, p.latitude, p.longitude))
    FROM proposed_peaker_sites p
  )
WHERE t.centroid_lat IS NOT NULL
  AND t.centroid_lon IS NOT NULL;
