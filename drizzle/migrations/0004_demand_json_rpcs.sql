CREATE OR REPLACE FUNCTION public.demand_grid_json(_source text, _types text[], _min_year int, _cell double precision)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_array(round(g.lat::numeric,5), round(g.lon::numeric,5), round(g.mw::numeric,3), g.n, g.top_type)), '[]'::jsonb)
  FROM public.demand_grid(_source, _types, _min_year, _cell) g
$$;
CREATE OR REPLACE FUNCTION public.demand_points_json(_source text, _types text[], _min_year int, _min_kw real,
  _w double precision, _s double precision, _e double precision, _n double precision, _limit int)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_array(round(p.lat::numeric,6), round(p.lon::numeric,6), p.ptype, round(p.peak_kw::numeric,2), p.yr)), '[]'::jsonb)
  FROM public.demand_points_bbox(_source, _types, _min_year, _min_kw, _w, _s, _e, _n, _limit) p
$$;
GRANT EXECUTE ON FUNCTION public.demand_grid_json(text, text[], int, double precision) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.demand_points_json(text, text[], int, real, double precision, double precision, double precision, double precision, int) TO anon, authenticated;