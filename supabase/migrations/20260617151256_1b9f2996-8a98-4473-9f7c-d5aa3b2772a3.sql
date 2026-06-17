ALTER TABLE public.ev_charging_stations
  ADD COLUMN IF NOT EXISTS ev_connector_types text,
  ADD COLUMN IF NOT EXISTS access_days_time text,
  ADD COLUMN IF NOT EXISTS facility_type text,
  ADD COLUMN IF NOT EXISTS ev_pricing text;