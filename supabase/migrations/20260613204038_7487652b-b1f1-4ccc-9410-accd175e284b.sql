
ALTER TABLE public.tcad_properties
  ADD COLUMN IF NOT EXISTS centroid_lat double precision,
  ADD COLUMN IF NOT EXISTS centroid_lon double precision;

CREATE INDEX IF NOT EXISTS idx_tcad_properties_centroid_lat ON public.tcad_properties(centroid_lat);
CREATE INDEX IF NOT EXISTS idx_tcad_properties_centroid_lon ON public.tcad_properties(centroid_lon);

-- Nearest-parcel lookup by lat/lon. Uses a bounding-box prefilter (cheap, index-backed)
-- then ranks by squared planar distance. Radius is in degrees (~0.0005 deg ≈ 55m).
CREATE OR REPLACE FUNCTION public.find_parcel_pid_by_point(
  _lat double precision,
  _lon double precision,
  _radius_deg double precision DEFAULT 0.0005
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pid
  FROM public.tcad_properties
  WHERE centroid_lat BETWEEN _lat - _radius_deg AND _lat + _radius_deg
    AND centroid_lon BETWEEN _lon - _radius_deg AND _lon + _radius_deg
  ORDER BY ((centroid_lat - _lat) * (centroid_lat - _lat)
          + (centroid_lon - _lon) * (centroid_lon - _lon)) ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_parcel_pid_by_point(double precision, double precision, double precision) TO anon, authenticated, service_role;
