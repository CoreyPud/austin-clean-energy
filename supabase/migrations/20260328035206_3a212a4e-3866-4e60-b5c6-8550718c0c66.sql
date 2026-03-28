CREATE TABLE public.guide_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  meta_description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'lightbulb',
  summary text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published guide pages"
  ON public.guide_pages
  FOR SELECT
  TO public
  USING (published = true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.guide_pages;