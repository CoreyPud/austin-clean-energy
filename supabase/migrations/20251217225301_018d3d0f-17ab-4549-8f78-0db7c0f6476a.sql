-- Create table for admin session tokens
CREATE TABLE public.admin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS (only edge functions with service role can access)
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access this table

-- Create index for token lookup
CREATE INDEX idx_admin_sessions_token ON public.admin_sessions(token);

-- Create index for cleanup of expired tokens
CREATE INDEX idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);