import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Lightbulb, ExternalLink } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

  useSeo({
    title: guide?.title ?? "Guide",
    description: guide?.meta_description ?? "Austin clean energy guide",
  });

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

  // Strip the first H1 from content since we show it in the header
  const getContentWithoutH1 = (content: string) => {
    return content.replace(/^#\s+.+\n+/, '');
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

  const cleanContent = getContentWithoutH1(guide.content);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Content */}
      <article className="container mx-auto px-4 py-10 max-w-3xl">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold text-foreground mt-10 mb-4 pb-2 border-b border-border">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-muted-foreground leading-relaxed mb-4">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                {children}
                <ExternalLink className="h-3 w-3 inline" />
              </a>
            ),
            ul: ({ children }) => (
              <ul className="my-4 ml-6 space-y-2 list-disc marker:text-primary">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="my-4 ml-6 space-y-2 list-decimal marker:text-primary">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-muted-foreground leading-relaxed pl-1">
                {children}
              </li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="my-6 border-l-4 border-primary bg-primary/5 rounded-r-lg py-3 px-5 not-italic">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="my-8 border-border" />,
          }}
        >
          {cleanContent}
        </ReactMarkdown>

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
