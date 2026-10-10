CREATE TABLE public.demand_points (
  id text PRIMARY KEY,
  source text NOT NULL,
  ptype text NOT NULL,
  yr integer,
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  kwh numeric NOT NULL,
  peak_kw real NOT NULL
);
GRANT SELECT ON public.demand_points TO anon, authenticated;
GRANT ALL ON public.demand_points TO service_role;
ALTER TABLE public.demand_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read demand points" ON public.demand_points FOR SELECT USING (true);
CREATE INDEX demand_points_src_lat_lon ON public.demand_points (source, lat, lon);

INSERT INTO public.demand_points (id, source, ptype, yr, lat, lon, kwh, peak_kw)
SELECT 'tcad:' || pid, 'tcad', property_type, year_built, centroid_lat, centroid_lon, k, (k / 8760.0 / 0.5)::real
FROM (
  SELECT pid, property_type, year_built, centroid_lat, centroid_lon,
    CASE property_type
      WHEN 'single_family' THEN 13152
      WHEN 'condo' THEN 13152 * 0.65
      WHEN 'multifamily' THEN coalesce(estimated_roof_sqft,0) * 16.9
      WHEN 'commercial' THEN coalesce(estimated_roof_sqft,0) * 14.82
      ELSE coalesce(estimated_roof_sqft,0) * 6.48
    END AS k
  FROM public.tcad_properties
  WHERE property_type IS NOT NULL AND centroid_lat IS NOT NULL AND centroid_lon IS NOT NULL
) s
WHERE k > 0;

CREATE OR REPLACE FUNCTION public.demand_grid(_source text, _types text[], _min_year int, _cell double precision)
RETURNS TABLE(lat double precision, lon double precision, mw double precision, n bigint, top_type text)
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH f AS (
    SELECT floor(d.lat/_cell) gy, floor(d.lon/_cell) gx, d.ptype, d.peak_kw
    FROM demand_points d
    WHERE d.source = _source AND d.ptype = ANY(_types) AND (_min_year IS NULL OR d.yr >= _min_year)
  ), t AS (
    SELECT gy, gx, ptype, sum(peak_kw) kw, count(*) c FROM f GROUP BY 1,2,3
  )
  SELECT (gy+0.5)*_cell, (gx+0.5)*_cell, sum(kw)/1000.0, sum(c)::bigint,
         (array_agg(ptype ORDER BY kw DESC))[1]
  FROM t GROUP BY gy, gx
$$;

CREATE OR REPLACE FUNCTION public.demand_points_bbox(_source text, _types text[], _min_year int, _min_kw real,
  _w double precision, _s double precision, _e double precision, _n double precision, _limit int)
RETURNS TABLE(lat double precision, lon double precision, ptype text, peak_kw real, yr int)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT d.lat, d.lon, d.ptype, d.peak_kw, d.yr FROM demand_points d
  WHERE d.source = _source AND d.ptype = ANY(_types) AND (_min_year IS NULL OR d.yr >= _min_year)
    AND d.peak_kw >= coalesce(_min_kw,0)
    AND d.lat BETWEEN _s AND _n AND d.lon BETWEEN _w AND _e
  ORDER BY d.peak_kw DESC LIMIT least(coalesce(_limit,15000), 25000)
$$;

CREATE OR REPLACE FUNCTION public.demand_summary(_source text, _types text[], _min_year int)
RETURNS TABLE(ptype text, mw double precision, n bigint)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT d.ptype, sum(d.peak_kw)/1000.0, count(*) FROM demand_points d
  WHERE d.source = _source AND d.ptype = ANY(_types) AND (_min_year IS NULL OR d.yr >= _min_year)
  GROUP BY 1
$$;

GRANT EXECUTE ON FUNCTION public.demand_grid(text, text[], int, double precision) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.demand_points_bbox(text, text[], int, real, double precision, double precision, double precision, double precision, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.demand_summary(text, text[], int) TO anon, authenticated;