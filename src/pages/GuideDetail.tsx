import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

interface GuidePage {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  category: string;
  content: string;
  updated_at: string;
}

export default function GuideDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [guide, setGuide] = useState<GuidePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) loadGuide(slug);
  }, [slug]);

  useEffect(() => {
    if (guide) {
      document.title = `${guide.title} | Austin Clean Energy`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', guide.meta_description);
      } else {
        const newMeta = document.createElement('meta');
        newMeta.name = 'description';
        newMeta.content = guide.meta_description;
        document.head.appendChild(newMeta);
      }
    }
  }, [guide]);

  const loadGuide = async (guideSlug: string) => {
    try {
      const { data, error } = await supabase
        .from('guide_pages')
        .select('*')
        .eq('slug', guideSlug)
        .eq('published', true)
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }
      setGuide(data);
    } catch (err) {
      console.error("Error loading guide:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Skeleton className="h-4 w-32 mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center py-12 px-8 max-w-md">
          <CardContent>
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-bold text-foreground mb-2">Guide Not Found</h2>
            <p className="text-muted-foreground mb-4">This guide doesn't exist or has been unpublished.</p>
            <Button asChild variant="outline">
              <Link to="/guides">Browse All Guides</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!guide) return null;

  const formattedDate = new Date(guide.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Link
            to="/guides"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1 mb-6"
          >
            <ArrowLeft className="h-3 w-3" />
            All Guides
          </Link>

          <Badge variant="outline" className="mb-3">{guide.category}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
            {guide.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Updated {formattedDate}
          </div>
        </div>
      </div>

      <article className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="
          prose prose-lg max-w-none dark:prose-invert
          prose-headings:text-foreground prose-headings:font-bold
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
          prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-strong:text-foreground
          prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
          prose-li:text-muted-foreground prose-li:leading-relaxed
          prose-ul:my-4 prose-ol:my-4
          prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic
          prose-hr:border-border prose-hr:my-8
        ">
          <ReactMarkdown>{guide.content}</ReactMarkdown>
        </div>

        {/* CTA */}
        <Card className="mt-12 border-primary/20">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Ready to Take Action?
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Get a personalized clean energy plan based on your home, commute, and interests.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button asChild>
                <Link to="/recommendations">Get Your Personalized Plan</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/city-overview">View City Progress</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </article>
    </div>
  );
}
