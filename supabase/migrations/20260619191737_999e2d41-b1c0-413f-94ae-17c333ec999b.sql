CREATE TABLE IF NOT EXISTS public.vehicle_models (
  id           SERIAL PRIMARY KEY,
  type         TEXT     NOT NULL CHECK (type IN ('ev', 'gas')),
  make         TEXT     NOT NULL,
  model        TEXT     NOT NULL,
  year         SMALLINT NOT NULL,
  msrp         INTEGER,
  mi_per_kwh   NUMERIC(4,2),
  mpg          SMALLINT,
  range_mi     SMALLINT,
  used_price   INTEGER,
  discontinued BOOLEAN  NOT NULL DEFAULT false,
  UNIQUE (make, model, year)
);

GRANT SELECT ON public.vehicle_models TO anon, authenticated;
GRANT ALL ON public.vehicle_models TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.vehicle_models_id_seq TO service_role;

ALTER TABLE public.vehicle_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read vehicle_models"
  ON public.vehicle_models FOR SELECT
  USING (true);