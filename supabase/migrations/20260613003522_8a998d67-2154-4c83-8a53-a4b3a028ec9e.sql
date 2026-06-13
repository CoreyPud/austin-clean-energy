CREATE OR REPLACE FUNCTION public.get_sync_solar_cron_secret()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_solar_cron_secret' LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_sync_solar_cron_secret() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_sync_solar_cron_secret() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sync_solar_cron_secret() TO service_role;