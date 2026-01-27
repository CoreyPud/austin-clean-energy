import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BookOpen, FileText, Target, Link2, Database, RefreshCw, Info, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

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
  const [fileMetadata, setFileMetadata] = useState<Record<string, { updated_at: string }>>({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
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
      const { data, error } = await supabase.functions.invoke('get-knowledge-files');
      
      if (error) throw error;
      
      setFileContents(data.files || {});
      setFileMetadata(data.metadata || {});
    } catch (err) {
      console.error("Error loading knowledge files:", err);
      toast.error("Failed to load knowledge files");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fileName: string) => {
    setEditMode(fileName);
    setEditContent(fileContents[fileName] || "");
  };

  const handleCancelEdit = () => {
    setEditMode(null);
    setEditContent("");
  };

  const handleSave = async () => {
    if (!editMode) return;
    
    setSaving(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      
      const { data, error } = await supabase.functions.invoke('save-knowledge-file', {
        body: { name: editMode, content: editContent },
        headers: { 'x-admin-token': token || '' }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to save');
      
      // Update local state
      setFileContents(prev => ({ ...prev, [editMode]: editContent }));
      setFileMetadata(prev => ({ 
        ...prev, 
        [editMode]: { updated_at: new Date().toISOString() } 
      }));
      
      setEditMode(null);
      setEditContent("");
      toast.success(`${editMode}.md saved successfully`);
    } catch (err) {
      console.error("Error saving knowledge file:", err);
      toast.error("Failed to save knowledge file");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return null;
  }

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
                Click "Edit" to modify content directly.
              </p>
            </div>
            <Button variant="outline" onClick={loadKnowledgeFiles} disabled={loading || editMode !== null}>
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
                <p className="font-medium text-foreground mb-1">How to Edit</p>
                <p className="text-muted-foreground">
                  Click the <strong>Edit</strong> button on any tab to modify the markdown content. 
                  Changes are saved to the database and take effect immediately for new recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different knowledge files */}
        <Tabs value={activeTab} onValueChange={(val) => {
          if (editMode) {
            toast.error("Please save or cancel your current edit first");
            return;
          }
          setActiveTab(val);
        }}>
          <TabsList className="grid grid-cols-4 mb-6">
            {KNOWLEDGE_FILES.map((file) => (
              <TabsTrigger key={file.name} value={file.name} className="flex items-center gap-2">
                <file.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{file.label}</span>
                {editMode === file.name && (
                  <Badge variant="secondary" className="ml-1 text-xs">Editing</Badge>
                )}
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
                    <div className="flex items-center gap-2">
                      {fileMetadata[file.name] && (
                        <span className="text-xs text-muted-foreground">
                          Updated: {formatDate(fileMetadata[file.name].updated_at)}
                        </span>
                      )}
                      {editMode === file.name ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancelEdit}
                            disabled={saving}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSave}
                            disabled={saving}
                          >
                            <Save className={`h-4 w-4 mr-1 ${saving ? 'animate-pulse' : ''}`} />
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(file.name)}
                          disabled={loading}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
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
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  ) : editMode === file.name ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[500px] font-mono text-sm"
                      placeholder="Enter markdown content..."
                    />
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
            <CardTitle className="text-base">Knowledge Base Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {KNOWLEDGE_FILES.map((file) => (
                <div key={file.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <file.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{file.label}</p>
                    <p className="text-xs text-muted-foreground">{file.description}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {file.updateFrequency}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
