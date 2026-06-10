CREATE TABLE public.tcad_properties (
  pid bigint PRIMARY KEY,
  situs_address text,
  situs_zip text,
  property_type text,
  land_type_desc text,
  estimated_roof_sqft integer,
  market_value numeric,
  in_ae boolean,
  has_solar boolean,
  year_built integer,
  py_owner_name text,
  stat_cd text
);

GRANT SELECT ON public.tcad_properties TO anon;
GRANT SELECT ON public.tcad_properties TO authenticated;
GRANT ALL ON public.tcad_properties TO service_role;

ALTER TABLE public.tcad_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tcad properties"
ON public.tcad_properties
FOR SELECT
USING (true);

CREATE INDEX idx_tcad_properties_zip ON public.tcad_properties(situs_zip);
CREATE INDEX idx_tcad_properties_property_type ON public.tcad_properties(property_type);