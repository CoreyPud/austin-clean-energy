CREATE INDEX IF NOT EXISTS idx_tcad_properties_solar_fetched
  ON public.tcad_properties (solar_fetched_at)
  WHERE solar_fetched_at IS NOT NULL;

ALTER ROLE authenticator SET statement_timeout = '30s';