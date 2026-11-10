CREATE TABLE public.clean_canvas_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  topic text NOT NULL,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  support_count integer NOT NULL DEFAULT 0,
  oppose_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.clean_canvas_ideas TO anon;
GRANT SELECT, INSERT, DELETE ON public.clean_canvas_ideas TO authenticated;
GRANT ALL ON public.clean_canvas_ideas TO service_role;
ALTER TABLE public.clean_canvas_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public ideas and own ideas are readable" ON public.clean_canvas_ideas
  FOR SELECT TO anon, authenticated
  USING (visible OR author_id = auth.uid());
CREATE POLICY "Signed-in users submit ideas as themselves" ON public.clean_canvas_ideas
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors delete their own ideas" ON public.clean_canvas_ideas
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

CREATE TABLE public.clean_canvas_votes (
  idea_id uuid NOT NULL REFERENCES public.clean_canvas_ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  choice text NOT NULL CHECK (choice IN ('support', 'oppose')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (idea_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clean_canvas_votes TO authenticated;
GRANT ALL ON public.clean_canvas_votes TO service_role;
ALTER TABLE public.clean_canvas_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own idea votes" ON public.clean_canvas_votes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users vote as themselves" ON public.clean_canvas_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.clean_canvas_ideas i WHERE i.id = idea_id AND i.visible)
  );
CREATE POLICY "Users change their own idea votes" ON public.clean_canvas_votes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove their own idea votes" ON public.clean_canvas_votes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.clean_canvas_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.clean_canvas_ideas(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.clean_canvas_comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  body text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.clean_canvas_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clean_canvas_comments TO authenticated;
GRANT ALL ON public.clean_canvas_comments TO service_role;
ALTER TABLE public.clean_canvas_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public discussions and own comments are readable" ON public.clean_canvas_comments
  FOR SELECT TO anon, authenticated
  USING (
    author_id = auth.uid()
    OR (visible AND EXISTS (SELECT 1 FROM public.clean_canvas_ideas i WHERE i.id = idea_id AND i.visible))
  );
CREATE POLICY "Signed-in users comment as themselves" ON public.clean_canvas_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.clean_canvas_ideas i WHERE i.id = idea_id AND i.visible)
  );
CREATE POLICY "Authors edit their own comments" ON public.clean_canvas_comments
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors delete their own comments" ON public.clean_canvas_comments
  FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE INDEX clean_canvas_ideas_created_idx ON public.clean_canvas_ideas(created_at DESC);
CREATE INDEX clean_canvas_ideas_topic_idx ON public.clean_canvas_ideas(topic) WHERE visible;
CREATE INDEX clean_canvas_votes_choice_idx ON public.clean_canvas_votes(idea_id, choice);
CREATE INDEX clean_canvas_comments_idea_idx ON public.clean_canvas_comments(idea_id, created_at);

CREATE OR REPLACE FUNCTION public.clean_canvas_validate_idea()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  resource jsonb;
  resource_label text;
  resource_url text;
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.description := btrim(NEW.description);
  NEW.author_name := btrim(NEW.author_name);
  IF char_length(NEW.title) NOT BETWEEN 5 AND 160 THEN
    RAISE EXCEPTION 'Idea title must be between 5 and 160 characters' USING ERRCODE = '22023';
  END IF;
  IF char_length(NEW.description) NOT BETWEEN 20 AND 4000 THEN
    RAISE EXCEPTION 'Idea description must be between 20 and 4000 characters' USING ERRCODE = '22023';
  END IF;
  IF char_length(NEW.author_name) NOT BETWEEN 2 AND 80 THEN
    RAISE EXCEPTION 'Display name must be between 2 and 80 characters' USING ERRCODE = '22023';
  END IF;
  IF NEW.topic NOT IN ('Energy supply', 'Grid & storage', 'Energy efficiency', 'Transportation', 'Housing & buildings', 'Community & equity', 'Other') THEN
    RAISE EXCEPTION 'Choose a valid idea topic' USING ERRCODE = '22023';
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

CREATE TRIGGER clean_canvas_validate_idea
BEFORE INSERT OR UPDATE ON public.clean_canvas_ideas
FOR EACH ROW EXECUTE FUNCTION public.clean_canvas_validate_idea();

CREATE OR REPLACE FUNCTION public.clean_canvas_validate_comment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.body := btrim(NEW.body);
  NEW.author_name := btrim(NEW.author_name);
  IF char_length(NEW.body) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'Comments must be between 1 and 2000 characters' USING ERRCODE = '22023';
  END IF;
  IF char_length(NEW.author_name) NOT BETWEEN 2 AND 80 THEN
    RAISE EXCEPTION 'Display name must be between 2 and 80 characters' USING ERRCODE = '22023';
  END IF;
  IF NEW.parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.clean_canvas_comments parent
    WHERE parent.id = NEW.parent_id AND parent.idea_id = NEW.idea_id AND parent.parent_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Replies must belong to a top-level comment on the same idea' USING ERRCODE = '22023';
  END IF;
  IF TG_OP = 'UPDATE' AND (
    NEW.idea_id IS DISTINCT FROM OLD.idea_id
    OR NEW.parent_id IS DISTINCT FROM OLD.parent_id
    OR NEW.author_id IS DISTINCT FROM OLD.author_id
    OR NEW.visible IS DISTINCT FROM OLD.visible
  ) THEN
    RAISE EXCEPTION 'Only the comment text can be changed' USING ERRCODE = '23514';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER clean_canvas_validate_comment
BEFORE INSERT OR UPDATE ON public.clean_canvas_comments
FOR EACH ROW EXECUTE FUNCTION public.clean_canvas_validate_comment();

CREATE OR REPLACE FUNCTION public.clean_canvas_validate_vote()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.idea_id IS DISTINCT FROM OLD.idea_id OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    RAISE EXCEPTION 'Only the vote choice can be changed' USING ERRCODE = '23514';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER clean_canvas_validate_vote
BEFORE INSERT OR UPDATE ON public.clean_canvas_votes
FOR EACH ROW EXECUTE FUNCTION public.clean_canvas_validate_vote();

CREATE OR REPLACE FUNCTION public.clean_canvas_refresh_vote_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_idea uuid;
BEGIN
  target_idea := CASE WHEN TG_OP = 'DELETE' THEN OLD.idea_id ELSE NEW.idea_id END;
  UPDATE public.clean_canvas_ideas
  SET support_count = (SELECT count(*) FROM public.clean_canvas_votes WHERE idea_id = target_idea AND choice = 'support'),
      oppose_count = (SELECT count(*) FROM public.clean_canvas_votes WHERE idea_id = target_idea AND choice = 'oppose'),
      updated_at = now()
  WHERE id = target_idea;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER clean_canvas_refresh_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON public.clean_canvas_votes
FOR EACH ROW EXECUTE FUNCTION public.clean_canvas_refresh_vote_counts();

CREATE OR REPLACE FUNCTION public.clean_canvas_refresh_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_idea uuid;
BEGIN
  target_idea := CASE WHEN TG_OP = 'DELETE' THEN OLD.idea_id ELSE NEW.idea_id END;
  UPDATE public.clean_canvas_ideas
  SET comment_count = (SELECT count(*) FROM public.clean_canvas_comments WHERE idea_id = target_idea AND visible),
      updated_at = now()
  WHERE id = target_idea;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER clean_canvas_refresh_comment_count
AFTER INSERT OR DELETE ON public.clean_canvas_comments
FOR EACH ROW EXECUTE FUNCTION public.clean_canvas_refresh_comment_count();

REVOKE ALL ON FUNCTION public.clean_canvas_refresh_vote_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clean_canvas_refresh_comment_count() FROM PUBLIC;