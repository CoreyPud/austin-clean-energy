CREATE OR REPLACE FUNCTION public.get_shared_assessment_by_code(_code text)
RETURNS TABLE(address text, property_type text, label text, calculator_state jsonb, results jsonb, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.address, s.property_type, s.label, s.calculator_state, s.results, s.updated_at
  FROM public.saved_assessments s
  WHERE length(_code) >= 8 AND _code ~ '^[0-9a-f]+$'
    AND left(s.share_token, length(_code)) = lower(_code) AND s.is_public = true
    AND (SELECT count(*) FROM public.saved_assessments t WHERE left(t.share_token, length(_code)) = lower(_code)) = 1
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_shared_assessment_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_assessment_by_code(text) TO anon, authenticated;