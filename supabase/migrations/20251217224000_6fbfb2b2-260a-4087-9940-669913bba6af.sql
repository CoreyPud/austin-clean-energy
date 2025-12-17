-- Fix the view security by setting security_invoker
ALTER VIEW public.solar_installations_view SET (security_invoker = true);