ALTER TABLE public.clean_canvas_ideas ADD COLUMN edit_count integer NOT NULL DEFAULT 0, ADD COLUMN edited_at timestamptz;

GRANT UPDATE (author_name, title, description, topic, topics, examples_elsewhere, resources) ON public.clean_canvas_ideas TO authenticated;
CREATE POLICY "Authors update their own ideas" ON public.clean_canvas_ideas FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE OR REPLACE FUNCTION public.clean_canvas_track_edits()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.edit_count := 0;
    NEW.edited_at := NULL;
  ELSE
    NEW.edit_count := OLD.edit_count;
    NEW.edited_at := OLD.edited_at;
    IF ROW(NEW.author_name, NEW.title, NEW.description, NEW.topic, NEW.topics, NEW.examples_elsewhere, NEW.resources)
       IS DISTINCT FROM ROW(OLD.author_name, OLD.title, OLD.description, OLD.topic, OLD.topics, OLD.examples_elsewhere, OLD.resources) THEN
      NEW.edit_count := OLD.edit_count + 1;
      NEW.edited_at := clock_timestamp();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER clean_canvas_z_track_edits BEFORE INSERT OR UPDATE ON public.clean_canvas_ideas FOR EACH ROW EXECUTE FUNCTION public.clean_canvas_track_edits();