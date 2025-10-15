-- Fix search_path for the function to resolve security warning
CREATE OR REPLACE FUNCTION public.update_cached_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;