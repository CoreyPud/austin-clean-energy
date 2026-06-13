
CREATE OR REPLACE FUNCTION public.find_parcel_pid_by_point(
  _lat double precision,
  _lon double precision,
  _radius_deg double precision DEFAULT 0.0005
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
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

REVOKE EXECUTE ON FUNCTION public.find_parcel_pid_by_point(double precision, double precision, double precision) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_parcel_pid_by_point(double precision, double precision, double precision) TO service_role;
