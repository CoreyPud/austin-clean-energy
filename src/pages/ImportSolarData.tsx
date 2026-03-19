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
import SolarColumnMapper, {
  parseSolarCSVPreview,
  autoDetectSolarMappings,
  type SolarTargetFieldKey,
} from "@/components/SolarColumnMapper";

interface ImportStats {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

type ImportStep = 'upload' | 'mapping' | 'importing' | 'complete';

const ImportSolarData = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<ImportStep>('upload');
  const [isValidating, setIsValidating] = useState(true);

  // Upload state
  const [csvData, setCsvData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Column mapping state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<SolarTargetFieldKey, string | null>>({} as Record<SolarTargetFieldKey, string | null>);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);

  // Import state
  const [isLoading, setIsLoading] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [progress, setProgress] = useState(0);

  // Auth validation
  useEffect(() => {
    const validateToken = async () => {
      const token = sessionStorage.getItem('admin_token');
      const expires = sessionStorage.getItem('admin_token_expires');

      if (!token || !expires) {
        navigate('/admin');
        return;
      }

      if (new Date(expires) < new Date()) {
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token_expires');
        navigate('/admin');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('admin-auth', {
          body: { action: 'validate', token },
        });

        if (error || !data?.valid) {
          sessionStorage.removeItem('admin_token');
          sessionStorage.removeItem('admin_token_expires');
          navigate('/admin');
        } else {
          setIsValidating(false);
        }
      } catch {
        navigate('/admin');
      }
    };

    validateToken();
  }, [navigate]);

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

      const { headers, preview, headerRowIndex: hri } = parseSolarCSVPreview(text);
      setCsvHeaders(headers);
      setCsvPreview(preview);
      setHeaderRowIndex(hri);

      const detectedMappings = autoDetectSolarMappings(headers);
      setColumnMappings(detectedMappings);

      toast.success(`File "${file.name}" loaded successfully`);
      setStep('mapping');
    };
    reader.onerror = () => toast.error("Error reading file");
    reader.readAsText(file);
  };

  const handleMappingChange = (field: SolarTargetFieldKey, value: string | null) => {
    setColumnMappings(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmAndImport = async () => {
    if (!csvData) {
      toast.error("Please select a CSV file first");
      return;
    }

    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      toast.error("Admin authentication required");
      navigate('/admin');
      return;
    }

    // Build column index mapping for backend
    const columnIndexMapping: Record<string, number> = {};
    Object.entries(columnMappings).forEach(([field, header]) => {
      if (header) {
        const idx = csvHeaders.indexOf(header);
        if (idx !== -1) {
          columnIndexMapping[field] = idx;
        }
      }
    });

    setIsLoading(true);
    setStep('importing');
    setProgress(10);

    try {
      const { data, error } = await supabase.functions.invoke('import-solar-data', {
        body: {
          csvData,
          columnMapping: columnIndexMapping,
          headerRowIndex,
        },
        headers: {
          'x-admin-token': token,
        },
      });

      setProgress(100);

      if (error) {
        toast.error(`Import failed: ${error.message}`);
        setStep('mapping');
        setIsLoading(false);
        return;
      }

      if (data?.success) {
        setImportStats(data.stats);
        setStep('complete');
        toast.success(`Imported ${data.stats.inserted} new records, updated ${data.stats.updated} existing`);
      } else {
        toast.error(data?.error || 'Import failed');
        setStep('mapping');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error("An error occurred during import");
      setStep('mapping');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCsvData(null);
    setFileName(null);
    setCsvHeaders([]);
    setCsvPreview([]);
    setColumnMappings({} as Record<SolarTargetFieldKey, string | null>);
    setImportStats(null);
    setStep('upload');
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Verifying authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Import Solar Permit Data</h1>
            <p className="text-muted-foreground">
              Upload and map CSV columns to import solar installation permit data
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Step 1: Upload Solar Permit CSV
                </CardTitle>
                <CardDescription>
                  Upload a CSV file exported from the Austin Open Data portal or a Google Sheet. You'll map columns next.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                  />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Flexible Column Mapping</AlertTitle>
                  <AlertDescription>
                    After uploading, you can map any CSV columns to database fields.
                    The system auto-detects common column names like "Project ID", "Address", "Latitude", etc.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && csvData && (
            <SolarColumnMapper
              csvHeaders={csvHeaders}
              csvPreview={csvPreview}
              columnMappings={columnMappings}
              onMappingChange={handleMappingChange}
              onBack={() => setStep('upload')}
              onConfirm={handleConfirmAndImport}
              isImporting={isLoading}
            />
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 animate-pulse" />
                  Importing Data...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Processing {fileName}...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && importStats && (
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
                  <Button variant="outline" onClick={() => navigate('/admin/data-comparison')}>
                    View Data Comparison
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Import Another File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportSolarData;
