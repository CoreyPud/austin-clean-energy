-- Create table for Austin Energy PIR (Program Interconnection Request) data
CREATE TABLE public.pir_installations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pir_number TEXT UNIQUE,
  address TEXT NOT NULL,
  address_normalized TEXT,
  system_kw NUMERIC,
  interconnection_date DATE,
  customer_type TEXT,
  fuel_type TEXT,
  technology TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for address matching
CREATE INDEX idx_pir_address_normalized ON public.pir_installations(address_normalized);
CREATE INDEX idx_pir_interconnection_date ON public.pir_installations(interconnection_date);
CREATE INDEX idx_pir_system_kw ON public.pir_installations(system_kw);

-- Enable RLS
ALTER TABLE public.pir_installations ENABLE ROW LEVEL SECURITY;

-- Public read access (same pattern as solar_installations)
CREATE POLICY "Anyone can read PIR installations"
ON public.pir_installations
FOR SELECT
USING (true);

-- Create table for tracking matches between data sources
CREATE TABLE public.data_match_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solar_installation_id UUID REFERENCES public.solar_installations(id),
  pir_installation_id UUID REFERENCES public.pir_installations(id),
  match_confidence NUMERIC CHECK (match_confidence >= 0 AND match_confidence <= 100),
  match_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  reviewed_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(solar_installation_id, pir_installation_id)
);

-- Create indexes for match lookups
CREATE INDEX idx_match_solar_id ON public.data_match_results(solar_installation_id);
CREATE INDEX idx_match_pir_id ON public.data_match_results(pir_installation_id);
CREATE INDEX idx_match_status ON public.data_match_results(status);
CREATE INDEX idx_match_confidence ON public.data_match_results(match_confidence);

-- Enable RLS
ALTER TABLE public.data_match_results ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read match results"
ON public.data_match_results
FOR SELECT
USING (true);

-- Create trigger for updated_at on pir_installations
CREATE TRIGGER update_pir_installations_updated_at
BEFORE UPDATE ON public.pir_installations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on data_match_results
CREATE TRIGGER update_data_match_results_updated_at
BEFORE UPDATE ON public.data_match_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();