CREATE TABLE public.solar_bom_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  project_address TEXT NOT NULL,
  system_kw NUMERIC NOT NULL,
  panel_watts INTEGER NOT NULL,
  grid_voltage TEXT NOT NULL,
  wind_zone TEXT NOT NULL,
  membrane TEXT NOT NULL,
  pricing JSONB NOT NULL,
  line_items JSONB NOT NULL,
  total_cost NUMERIC NOT NULL,
  total_weight NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solar_bom_snapshots TO authenticated;
GRANT ALL ON public.solar_bom_snapshots TO service_role;
ALTER TABLE public.solar_bom_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own BOMs" ON public.solar_bom_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own BOMs" ON public.solar_bom_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own BOMs" ON public.solar_bom_snapshots FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own BOMs" ON public.solar_bom_snapshots FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX solar_bom_snapshots_user_created_idx ON public.solar_bom_snapshots (user_id, created_at DESC);