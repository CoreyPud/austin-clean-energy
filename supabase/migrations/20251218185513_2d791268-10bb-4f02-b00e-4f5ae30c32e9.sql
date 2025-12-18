-- Add RLS policy to admin_sessions table to deny all access via anon key
-- This table should only be accessed via service role key in edge functions

-- Create a policy that denies all access (no one can read via normal API)
CREATE POLICY "Deny all access to admin_sessions"
ON public.admin_sessions
FOR ALL
USING (false);