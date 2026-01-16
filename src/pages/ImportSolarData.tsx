import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, CheckCircle, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ImportSolarData = () => {
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has admin token
    const adminToken = sessionStorage.getItem('admin_token');
    setIsAuthenticated(!!adminToken);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const adminToken = sessionStorage.getItem('admin_token');
    
    if (!adminToken) {
      toast({
        title: "Authentication required",
        description: "Please log in as admin first",
        variant: "destructive",
      });
      navigate('/admin');
      return;
    }

    if (!csvData) {
      toast({
        title: "No file selected",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-solar-data', {
        body: { csvData },
        headers: {
          'x-admin-token': adminToken
        }
      });

      if (error) throw error;

      toast({
        title: "Import successful",
        description: "Solar installation data has been imported to the database",
      });

      // Navigate back to home
      setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-6">
      <div className="container max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          ← Back to Home
        </Button>

        <Card className="p-8">
          <div className="text-center mb-8">
            <FileText className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">Import Solar Data</h1>
            <p className="text-muted-foreground">
              Upload your comprehensive solar installation CSV file
            </p>
          </div>

          {!isAuthenticated && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Admin authentication required</p>
                <p className="text-sm opacity-80">
                   <Button variant="link" className="p-0 h-auto text-destructive" onClick={() => navigate('/admin')}>
                     Log in as admin
                   </Button>
                  {" "}to import data
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
                disabled={!isAuthenticated}
              />
              <label htmlFor="csv-upload" className={`${isAuthenticated ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload CSV file
                </p>
                {fileName && (
                  <div className="flex items-center justify-center gap-2 text-primary mt-4">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{fileName}</span>
                  </div>
                )}
              </label>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <h3 className="font-semibold mb-2">Expected CSV Format:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Permit Class, Address, Description</li>
                <li>Installed kW, Dates (Applied/Issued/Completed)</li>
                <li>Latitude, Longitude, ZIP Code</li>
                <li>Status, Contractor, Project ID</li>
              </ul>
            </div>

            <Button 
              onClick={handleImport}
              disabled={!csvData || loading || !isAuthenticated}
              className="w-full"
              size="lg"
            >
              {loading ? "Importing..." : "Import Data"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ImportSolarData;
