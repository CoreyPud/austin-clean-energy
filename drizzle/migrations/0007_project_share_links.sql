CREATE TABLE public.project_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  recipient_name text NOT NULL,
  recipient_email text,
  saved_assessment_id uuid NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
CREATE TABLE public.project_share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES public.project_shares(id) ON DELETE CASCADE,
  event text NOT NULL,
  detail text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX project_share_events_share_idx ON public.project_share_events(share_id, created_at DESC);
GRANT ALL ON public.project_shares TO service_role;
GRANT ALL ON public.project_share_events TO service_role;
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_share_events ENABLE ROW LEVEL SECURITY;