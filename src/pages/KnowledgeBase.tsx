import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, Target, Link2, Database, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

const KNOWLEDGE_FILES = [
  {
    name: "priorities",
    label: "Climate Impact Priorities",
    description: "How we rank clean energy actions by effectiveness and CO₂ reduction potential",
    icon: Target,
  },
  {
    name: "resources",
    label: "Austin Resources & Programs",
    description: "Local programs, rebates, tax credits, and actionable resources",
    icon: Link2,
  },
  {
    name: "expert-context",
    label: "Expert Context & Research",
    description: "Current research findings, policy context, and best practices",
    icon: BookOpen,
  },
  {
    name: "data-sources",
    label: "Data Sources & Interpretation",
    description: "How external data APIs are used and what thresholds define activity levels",
    icon: Database,
  },
];

export default function KnowledgeBase() {
  const [activeFile, setActiveFile] = useState("priorities");
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [fileMetadata, setFileMetadata] = useState<Record<string, { updated_at: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKnowledgeFiles();
  }, []);

  const loadKnowledgeFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-knowledge-files');
      if (error) throw error;
      setFileContents(data.files || {});
      setFileMetadata(data.metadata || {});
    } catch (err) {
      console.error("Error loading knowledge files:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const currentFile = KNOWLEDGE_FILES.find(f => f.name === activeFile);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-4">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Clean Energy Knowledge Base
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Explore the research, data sources, and frameworks that power our AI-generated 
            clean energy recommendations for Austin, Texas.
          </p>
        </div>

        {/* File selector cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {KNOWLEDGE_FILES.map((file) => {
            const isActive = activeFile === file.name;
            return (
              <button
                key={file.name}
                onClick={() => setActiveFile(file.name)}
                className={`flex items-start gap-3 p-4 rounded-lg text-left transition-all border ${
                  isActive
                    ? 'bg-primary/10 border-primary ring-1 ring-primary'
                    : 'bg-card border-border hover:bg-accent/50'
                }`}
              >
                <file.icon className={`h-5 w-5 mt-0.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="min-w-0">
                  <p className={`font-medium text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {file.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{file.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content display */}
        {currentFile && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <currentFile.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{currentFile.label}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-0.5">
                    {currentFile.description}
                    {fileMetadata[currentFile.name] && (
                      <>
                        <span>·</span>
                        <span className="text-xs">
                          Updated {formatDate(fileMetadata[currentFile.name].updated_at)}
                        </span>
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : fileContents[currentFile.name] ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border">
                  <ReactMarkdown>{fileContents[currentFile.name]}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Content not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
