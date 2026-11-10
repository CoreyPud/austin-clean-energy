ALTER TABLE public.clean_canvas_ideas ADD COLUMN topics text[];
ALTER TABLE public.clean_canvas_ideas ADD COLUMN examples_elsewhere text NOT NULL DEFAULT '';
UPDATE public.clean_canvas_ideas SET topics = ARRAY[topic];
COMMENT ON COLUMN public.clean_canvas_ideas.topic IS 'Legacy primary topic retained for older clients; new clients use topics.';
CREATE OR REPLACE FUNCTION public.clean_canvas_validate_idea()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  resource jsonb;
  resource_label text;
  resource_url text;
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.description := btrim(NEW.description);
  NEW.author_name := btrim(NEW.author_name);
  NEW.examples_elsewhere := btrim(COALESCE(NEW.examples_elsewhere, ''));
  IF char_length(NEW.title) NOT BETWEEN 5 AND 160 THEN
    RAISE EXCEPTION 'Idea title must be between 5 and 160 characters' USING ERRCODE = '22023';
  END IF;
  IF char_length(NEW.description) NOT BETWEEN 20 AND 4000 THEN
    RAISE EXCEPTION 'Idea description must be between 20 and 4000 characters' USING ERRCODE = '22023';
  END IF;
  IF char_length(NEW.author_name) NOT BETWEEN 2 AND 80 THEN
    RAISE EXCEPTION 'Display name must be between 2 and 80 characters' USING ERRCODE = '22023';
  END IF;
  IF NEW.topics IS NULL THEN NEW.topics := ARRAY[NEW.topic]; END IF;
  IF cardinality(NEW.topics) NOT BETWEEN 1 AND 8 OR array_ndims(NEW.topics) IS DISTINCT FROM 1
    OR array_position(NEW.topics, NULL) IS NOT NULL
    OR NOT (NEW.topics <@ ARRAY['Energy supply', 'Grid & storage', 'Energy efficiency', 'Transportation', 'Housing & buildings', 'Community & equity', 'Policy, strategy, personnel', 'Other']::text[])
    OR cardinality(NEW.topics) <> (SELECT count(DISTINCT value) FROM unnest(NEW.topics) AS value) THEN
    RAISE EXCEPTION 'Choose one or more valid, distinct idea topics' USING ERRCODE = '22023';
  END IF;
  NEW.topic := NEW.topics[array_lower(NEW.topics, 1)];
  IF char_length(NEW.examples_elsewhere) > 4000 THEN
    RAISE EXCEPTION 'Examples elsewhere must be at most 4000 characters' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(NEW.resources) IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.resources) > 5 THEN
    RAISE EXCEPTION 'An idea can have up to five supporting links' USING ERRCODE = '22023';
  END IF;
  FOR resource IN SELECT value FROM jsonb_array_elements(NEW.resources) LOOP
    resource_label := btrim(COALESCE(resource->>'label', ''));
    resource_url := btrim(COALESCE(resource->>'url', ''));
    IF char_length(resource_label) NOT BETWEEN 1 AND 120 THEN
      RAISE EXCEPTION 'Each supporting link needs a label of up to 120 characters' USING ERRCODE = '22023';
    END IF;
    IF char_length(resource_url) > 1000 OR resource_url !~* '^https?://[^[:space:]]+$' THEN
      RAISE EXCEPTION 'Supporting links must be valid HTTP or HTTPS web addresses' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;