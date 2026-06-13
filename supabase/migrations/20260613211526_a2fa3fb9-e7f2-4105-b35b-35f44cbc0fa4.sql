CREATE OR REPLACE FUNCTION public.enrich_solar_tcad_pids(_radius_deg double precision DEFAULT 0.0005, _limit integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_count integer;
BEGIN
  WITH candidates AS (
    SELECT id, latitude, longitude
    FROM public.solar_installations
    WHERE tcad_pid IS NULL
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    LIMIT COALESCE(_limit, 2147483647)
  ),
  matched AS (
    SELECT c.id,
           (SELECT NULLIF(regexp_replace(t.pid, '\D', '', 'g'), '')::bigint
              FROM public.tcad_properties t
             WHERE t.centroid_lat BETWEEN c.latitude  - _radius_deg AND c.latitude  + _radius_deg
               AND t.centroid_lon BETWEEN c.longitude - _radius_deg AND c.longitude + _radius_deg
               AND t.pid ~ '^\d+$'
             ORDER BY ((t.centroid_lat - c.latitude)  * (t.centroid_lat - c.latitude)
                     + (t.centroid_lon - c.longitude) * (t.centroid_lon - c.longitude)) ASC
             LIMIT 1) AS pid
      FROM candidates c
  )
  UPDATE public.solar_installations s
     SET tcad_pid = m.pid
    FROM matched m
   WHERE s.id = m.id
     AND m.pid IS NOT NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$function$;