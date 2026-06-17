
CREATE TABLE public.ev_charging_stations (
  id bigint PRIMARY KEY,
  station_name text NOT NULL,
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  ev_network text,
  ev_level1_evse_num integer NOT NULL DEFAULT 0,
  ev_level2_evse_num integer NOT NULL DEFAULT 0,
  ev_dc_fast_num integer NOT NULL DEFAULT 0,
  open_date date,
  open_year integer GENERATED ALWAYS AS (EXTRACT(YEAR FROM open_date)::integer) STORED,
  access_code text,
  street_address text,
  city text,
  state text,
  zip text,
  status_code text DEFAULT 'E',
  synced_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.ev_charging_stations TO anon, authenticated;
GRANT ALL ON public.ev_charging_stations TO service_role;

ALTER TABLE public.ev_charging_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ev_charging_stations"
  ON public.ev_charging_stations FOR SELECT
  USING (true);

CREATE INDEX idx_ev_charging_stations_open_year ON public.ev_charging_stations(open_year);
CREATE INDEX idx_ev_charging_stations_ev_network ON public.ev_charging_stations(ev_network);
