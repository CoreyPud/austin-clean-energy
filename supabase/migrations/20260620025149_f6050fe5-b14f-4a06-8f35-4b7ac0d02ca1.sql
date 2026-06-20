-- Migration 1: Google Solar scalar fields on tcad_properties
ALTER TABLE public.tcad_properties
  ADD COLUMN IF NOT EXISTS solar_fetched_at            timestamptz,
  ADD COLUMN IF NOT EXISTS solar_imagery_quality       text,
  ADD COLUMN IF NOT EXISTS solar_imagery_date          date,
  ADD COLUMN IF NOT EXISTS solar_max_panels            smallint,
  ADD COLUMN IF NOT EXISTS solar_max_area_m2           real,
  ADD COLUMN IF NOT EXISTS solar_sunshine_hrs          real,
  ADD COLUMN IF NOT EXISTS solar_sunshine_median       real,
  ADD COLUMN IF NOT EXISTS solar_panel_capacity_w      smallint;

-- Migration 2: Per-face roof segment data from Google Solar buildingInsights
CREATE TABLE IF NOT EXISTS public.tcad_roof_segments (
  pid             text      NOT NULL REFERENCES public.tcad_properties(pid),
  segment_index   smallint  NOT NULL,
  pitch_deg       real,
  azimuth_deg     real,
  area_m2         real,
  ground_area_m2  real,
  sunshine_median real,
  sunshine_max    real,
  center_lat      double precision,
  center_lon      double precision,
  PRIMARY KEY (pid, segment_index)
);

CREATE INDEX IF NOT EXISTS idx_roof_segments_pid ON public.tcad_roof_segments (pid);

GRANT SELECT ON public.tcad_roof_segments TO anon, authenticated;
GRANT ALL ON public.tcad_roof_segments TO service_role;

ALTER TABLE public.tcad_roof_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roof segments are publicly readable"
  ON public.tcad_roof_segments
  FOR SELECT
  USING (true);
