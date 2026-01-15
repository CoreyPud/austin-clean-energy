import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface ImportStats {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

const PIRImport = () => {
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    setIsAuthenticated(!!token);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      setFileName(file.name);
      setImportStats(null);
      toast.success(`File "${file.name}" loaded successfully`);
    };
    reader.onerror = () => {
      toast.error("Error reading file");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvData) {
      toast.error("Please select a CSV file first");
      return;
    }

    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      toast.error("Admin authentication required");
      navigate('/admin');
      return;
    }

    setIsLoading(true);
    setProgress(10);

    try {
      const { data, error } = await supabase.functions.invoke('import-pir-data', {
        body: { csvData },
        headers: {
          'x-admin-token': token
        }
      });

      setProgress(100);

      if (error) {
        console.error('Import error:', error);
        toast.error(`Import failed: ${error.message}`);
        return;
      }

      if (data.success) {
        setImportStats(data.stats);
        toast.success(`Successfully imported ${data.stats.inserted} new records, updated ${data.stats.updated} existing records`);
      } else {
        toast.error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error("An error occurred during import");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/corrections')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Import PIR Data</h1>
            <p className="text-muted-foreground">
              Import Austin Energy Program Interconnection Request data
            </p>
          </div>
        </div>

        {!isAuthenticated && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You must be logged in as an admin to import data.{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/admin')}>
                Login here
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Upload PIR CSV
              </CardTitle>
              <CardDescription>
                Upload the "PIR no Prem 2004 to 2025 good" sheet exported as CSV from the Austin Energy spreadsheet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Select CSV File</Label>
                <div className="flex gap-2">
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                </div>
                {fileName && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Loaded: {fileName}
                  </p>
                )}
              </div>

              {isLoading && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    Importing data...
                  </p>
                </div>
              )}

              <Button 
                onClick={handleImport} 
                disabled={!csvData || isLoading || !isAuthenticated}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isLoading ? "Importing..." : "Import PIR Data"}
              </Button>
            </CardContent>
          </Card>

          {importStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Import Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{importStats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Rows</div>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{importStats.inserted}</div>
                    <div className="text-sm text-muted-foreground">New Records</div>
                  </div>
                  <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{importStats.updated}</div>
                    <div className="text-sm text-muted-foreground">Updated</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{importStats.skipped}</div>
                    <div className="text-sm text-muted-foreground">Skipped</div>
                  </div>
                </div>

                {importStats.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-destructive mb-2">Errors ({importStats.errors.length})</h4>
                    <div className="max-h-40 overflow-y-auto bg-destructive/10 p-3 rounded-lg text-sm">
                      {importStats.errors.slice(0, 10).map((error, i) => (
                        <div key={i} className="text-destructive">{error}</div>
                      ))}
                      {importStats.errors.length > 10 && (
                        <div className="text-muted-foreground mt-2">
                          ...and {importStats.errors.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin/data-comparison')}
                  >
                    View Data Comparison
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCsvData(null);
                      setFileName(null);
                      setImportStats(null);
                    }}
                  >
                    Import Another File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Expected CSV Format</CardTitle>
              <CardDescription>
                The CSV should contain the following columns from the PIR spreadsheet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <div className="text-muted-foreground mb-2"># Expected columns:</div>
                <div>PIR_NUMBER, ADDRESS, CITY, STATE, ZIP, SYSTEM_KW,</div>
                <div>INTERCONNECTION_DATE, CUSTOMER_TYPE, FUEL_TYPE, TECHNOLOGY</div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                The importer will normalize addresses for matching and handle various date formats.
                Duplicate PIR numbers will update existing records rather than create new ones.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PIRImport;
