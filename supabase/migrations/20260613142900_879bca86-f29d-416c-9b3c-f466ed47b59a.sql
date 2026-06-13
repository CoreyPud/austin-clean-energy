CREATE TABLE public.volunteer_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  involvement_area text NOT NULL,
  notes text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT volunteer_signups_area_check CHECK (involvement_area IN (
    'outreach_community',
    'data_validation',
    'technical_work',
    'engineering_events'
  )),
  CONSTRAINT volunteer_signups_name_len CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT volunteer_signups_email_len CHECK (char_length(email) BETWEEN 3 AND 255),
  CONSTRAINT volunteer_signups_notes_len CHECK (notes IS NULL OR char_length(notes) <= 2000)
);

GRANT INSERT ON public.volunteer_signups TO anon, authenticated;
GRANT ALL ON public.volunteer_signups TO service_role;

ALTER TABLE public.volunteer_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a volunteer signup"
  ON public.volunteer_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX volunteer_signups_created_at_idx ON public.volunteer_signups (created_at DESC);