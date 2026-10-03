CREATE TABLE public.saved_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  address text NOT NULL,
  property_type text NOT NULL,
  label text,
  calculator_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_assessments TO authenticated;
GRANT ALL ON public.saved_assessments TO service_role;
ALTER TABLE public.saved_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read" ON public.saved_assessments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert" ON public.saved_assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update" ON public.saved_assessments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete" ON public.saved_assessments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX saved_assessments_user_idx ON public.saved_assessments(user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.get_shared_assessment(_token text)
RETURNS TABLE(address text, property_type text, label text, calculator_state jsonb, results jsonb, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT address, property_type, label, calculator_state, results, updated_at
  FROM public.saved_assessments WHERE share_token = _token AND is_public = true LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_shared_assessment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_assessment(text) TO anon, authenticated;