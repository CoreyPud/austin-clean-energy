CREATE TABLE public.rebate_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 program text NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review_requested','ready','exported')),
 encrypted_payload text NOT NULL,
 key_version integer NOT NULL DEFAULT 1,
 consent_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.rebate_applications TO service_role;
ALTER TABLE public.rebate_applications ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.rebate_applications IS 'Private encrypted rebate drafts. Access only through authenticated owner or validated admin edge function; never public shares.';
CREATE INDEX rebate_applications_owner ON public.rebate_applications(user_id, created_at DESC);
CREATE TABLE public.rebate_application_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 application_id uuid,
 actor_user_id uuid,
 actor_type text NOT NULL CHECK (actor_type IN ('owner','admin')),
 action text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rebate_application_audit TO service_role;
ALTER TABLE public.rebate_application_audit ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.rebate_application_audit IS 'Access/export metadata only; no names, addresses, account numbers, bill content or admin session tokens.';