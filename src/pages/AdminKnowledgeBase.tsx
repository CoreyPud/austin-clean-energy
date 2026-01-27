import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, FileText, Target, Link2, Database, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface KnowledgeFile {
  name: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  updateFrequency: string;
}

const KNOWLEDGE_FILES: KnowledgeFile[] = [
  {
    name: "priorities",
    label: "Priorities",
    description: "Climate impact framework that ranks actions by effectiveness",
    icon: Target,
    updateFrequency: "Quarterly"
  },
  {
    name: "resources",
    label: "Resources",
    description: "Austin-specific programs, incentives, and resources",
    icon: Link2,
    updateFrequency: "Monthly"
  },
  {
    name: "expert-context",
    label: "Expert Context",
    description: "Current research, policy context, and best practices",
    icon: BookOpen,
    updateFrequency: "Quarterly"
  },
  {
    name: "data-sources",
    label: "Data Sources",
    description: "External APIs and data interpretation rules",
    icon: Database,
    updateFrequency: "As needed"
  }
];

export default function AdminKnowledgeBase() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("priorities");
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    const expires = sessionStorage.getItem('admin_token_expires');
    
    if (!token || !expires) {
      navigate('/admin');
      return;
    }
    
    if (new Date(expires) < new Date()) {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_token_expires');
      toast.error("Session expired. Please login again.");
      navigate('/admin');
      return;
    }
    
    setIsAuthenticated(true);
    loadKnowledgeFiles();
  }, [navigate]);

  const loadKnowledgeFiles = async () => {
    setLoading(true);
    try {
      // Fetch knowledge files from the edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-knowledge-files`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge files');
      }
      
      const data = await response.json();
      setFileContents(data.files || {});
    } catch (err) {
      console.error("Error loading knowledge files:", err);
      toast.error("Failed to load knowledge files");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const activeFile = KNOWLEDGE_FILES.find(f => f.name === activeTab);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                Recommendation Knowledge Base
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                These markdown files drive the AI-generated recommendations shown to users. 
                Changes to these files take effect immediately after edge function redeployment.
              </p>
            </div>
            <Button variant="outline" onClick={loadKnowledgeFiles} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">How to Update</p>
                <p className="text-muted-foreground">
                  To modify recommendations, edit these files in <code className="bg-muted px-1 rounded text-xs">supabase/functions/_shared/knowledge/</code>. 
                  Edge functions redeploy automatically when you save changes (~30 seconds).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different knowledge files */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            {KNOWLEDGE_FILES.map((file) => (
              <TabsTrigger key={file.name} value={file.name} className="flex items-center gap-2">
                <file.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{file.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {KNOWLEDGE_FILES.map((file) => (
            <TabsContent key={file.name} value={file.name}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <file.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {file.label}
                          <Badge variant="outline" className="font-normal">
                            {file.name}.md
                          </Badge>
                        </CardTitle>
                        <CardDescription>{file.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {file.updateFrequency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  ) : fileContents[file.name] ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border">
                      <ReactMarkdown>{fileContents[file.name]}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Unable to load file content</p>
                      <p className="text-sm">Check that the edge function is deployed correctly</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* File Structure Reference */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">File Structure Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm bg-muted p-4 rounded-lg">
              <div className="text-muted-foreground">supabase/functions/_shared/knowledge/</div>
              <div className="ml-4 space-y-1 mt-2">
                {KNOWLEDGE_FILES.map((file) => (
                  <div key={file.name} className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className={activeTab === file.name ? 'text-primary font-medium' : ''}>
                      {file.name}.md
                    </span>
                    <span className="text-muted-foreground text-xs">— {file.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
