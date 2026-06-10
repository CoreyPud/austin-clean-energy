
-- 1. knowledge_files: remove public read
DROP POLICY IF EXISTS "Anyone can read knowledge files" ON public.knowledge_files;
REVOKE SELECT ON public.knowledge_files FROM anon, authenticated;

-- 2. tcad_properties: remove public read
DROP POLICY IF EXISTS "Anyone can read tcad properties" ON public.tcad_properties;
REVOKE SELECT ON public.tcad_properties FROM anon, authenticated;

-- 3. Remove guide_pages from realtime publication if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'guide_pages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.guide_pages';
  END IF;
END $$;

-- 4. Revoke EXECUTE on SECURITY DEFINER trigger helpers from API roles
REVOKE EXECUTE ON FUNCTION public.update_cached_stats_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
