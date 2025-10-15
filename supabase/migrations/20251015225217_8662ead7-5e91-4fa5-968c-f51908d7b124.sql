-- Create table to cache statistics
CREATE TABLE IF NOT EXISTS public.cached_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_type TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (public read-only data)
ALTER TABLE public.cached_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached stats
CREATE POLICY "Anyone can read cached stats"
  ON public.cached_stats
  FOR SELECT
  USING (true);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_cached_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cached_stats_timestamp
  BEFORE UPDATE ON public.cached_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cached_stats_timestamp();