import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Calendar, Zap, Users, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface ImportStats {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface FiscalYearSummary {
  fiscalYear: number;
  label: string;
  count: number;
  totalKW: number;
}

interface PIRDashboardStats {
  totalRecords: number;
  totalKW: number;
  uniqueInstallers: number;
  fiscalYearBreakdown: FiscalYearSummary[];
  dateRange: { earliest: string | null; latest: string | null };
}

const PIRImport = () => {
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [progress, setProgress] = useState(0);
  const [dashboardStats, setDashboardStats] = useState<PIRDashboardStats | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Fetch PIR dashboard stats from database
  const fetchDashboardStats = async () => {
    setLoadingDashboard(true);
    try {
      // Get all PIR records
      const { data: pirRecords, error } = await supabase
        .from('pir_installations')
        .select('id, system_kw, interconnection_date, raw_data');

      if (error) throw error;

      if (!pirRecords || pirRecords.length === 0) {
        setDashboardStats(null);
        return;
      }

      // Calculate stats
      const totalRecords = pirRecords.length;
      const totalKW = pirRecords.reduce((sum, r) => sum + (r.system_kw || 0), 0);
      
      // Get unique installers from raw_data
      const installers = new Set<string>();
      pirRecords.forEach(r => {
        const installer = (r.raw_data as any)?.installer;
        if (installer && typeof installer === 'string' && installer.trim()) {
          installers.add(installer.trim().toLowerCase());
        }
      });

      // Calculate fiscal year breakdown
      const fyMap = new Map<number, { count: number; totalKW: number }>();
      let earliest: string | null = null;
      let latest: string | null = null;

      pirRecords.forEach(r => {
        const date = r.interconnection_date;
        if (date) {
          if (!earliest || date < earliest) earliest = date;
          if (!latest || date > latest) latest = date;

          // Calculate fiscal year (Oct 1 - Sep 30)
          const d = new Date(date);
          const month = d.getMonth(); // 0-11
          const year = d.getFullYear();
          const fiscalYear = month >= 9 ? year + 1 : year; // Oct-Dec = next FY

          const existing = fyMap.get(fiscalYear) || { count: 0, totalKW: 0 };
          fyMap.set(fiscalYear, {
            count: existing.count + 1,
            totalKW: existing.totalKW + (r.system_kw || 0)
          });
        }
      });

      // Convert to sorted array
      const fiscalYearBreakdown: FiscalYearSummary[] = Array.from(fyMap.entries())
        .map(([fy, data]) => ({
          fiscalYear: fy,
          label: `FY ${fy}`,
          count: data.count,
          totalKW: Math.round(data.totalKW)
        }))
        .sort((a, b) => a.fiscalYear - b.fiscalYear);

      setDashboardStats({
        totalRecords,
        totalKW: Math.round(totalKW),
        uniqueInstallers: installers.size,
        fiscalYearBreakdown,
        dateRange: { earliest, latest }
      });
    } catch (err) {
      console.error('Error fetching PIR dashboard stats:', err);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Load dashboard stats on component mount and after successful import
  useEffect(() => {
    if (!isValidating) {
      fetchDashboardStats();
    }
  }, [isValidating]);

  const chartData = useMemo(() => {
    if (!dashboardStats?.fiscalYearBreakdown) return [];
    return dashboardStats.fiscalYearBreakdown.map(fy => ({
      name: fy.label,
      fiscalYear: fy.fiscalYear,
      count: fy.count,
      totalKW: fy.totalKW
    }));
  }, [dashboardStats]);

  const chartConfig = {
    count: {
      label: "Installations",
      color: "hsl(var(--primary))",
    },
    totalKW: {
      label: "Total kW",
      color: "hsl(var(--chart-2))",
    },
  };

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
      } catch (err) {
        console.error('Token validation error:', err);
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

    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      toast.error("Admin authentication required");
      navigate('/admin');
      return;
    }

    setIsLoading(true);
    setProgress(10);

    try {
      console.log('Starting PIR import with', csvData.length, 'bytes of data');
      
      const { data, error } = await supabase.functions.invoke('import-pir-data', {
        body: { csvData },
        headers: {
          'x-admin-token': token
        }
      });

      console.log('Import response received:', { data, error });
      setProgress(100);

      if (error) {
        console.error('Import error:', error);
        toast.error(`Import failed: ${error.message}`);
        setIsLoading(false);
        return;
      }

      if (data?.success) {
        console.log('Setting import stats:', data.stats);
        setImportStats(data.stats);
        toast.success(`Successfully imported ${data.stats.inserted} new records, updated ${data.stats.updated} existing records`);
        // Refresh dashboard stats after successful import
        fetchDashboardStats();
      } else {
        console.error('Import failed with data:', data);
        toast.error(data?.error || 'Import failed - no success response');
      }
    } catch (error) {
      console.error('Import catch error:', error);
      toast.error("An error occurred during import. The import may still have completed - check the database.");
      // Still try to refresh stats in case import succeeded on server
      fetchDashboardStats();
    } finally {
      console.log('Import finally block - setting isLoading to false');
      setIsLoading(false);
    }
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/dashboard')}
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
                type="button"
                onClick={handleImport} 
                disabled={!csvData || isLoading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isLoading ? "Importing..." : "Import PIR Data"}
              </Button>
              
              {/* Debug info */}
              {!csvData && fileName && (
                <p className="text-sm text-destructive">Warning: File name set but data not loaded. Try re-selecting the file.</p>
              )}
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

          {/* PIR Database Dashboard */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    PIR Database Overview
                  </CardTitle>
                  <CardDescription>
                    Current statistics from the PIR installations database
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDashboardStats}
                  disabled={loadingDashboard}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingDashboard ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDashboard ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                  <Skeleton className="h-64" />
                </div>
              ) : dashboardStats ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold">{dashboardStats.totalRecords.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Records</div>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-2xl font-bold text-primary">{dashboardStats.totalKW.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total kW</div>
                    </div>
                    <div className="text-center p-4 bg-chart-2/10 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-chart-2" />
                      </div>
                      <div className="text-2xl font-bold">{dashboardStats.uniqueInstallers.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Unique Installers</div>
                    </div>
                    <div className="text-center p-4 bg-chart-3/10 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-chart-3" />
                      </div>
                      <div className="text-2xl font-bold">{dashboardStats.fiscalYearBreakdown.length}</div>
                      <div className="text-sm text-muted-foreground">Fiscal Years</div>
                    </div>
                  </div>

                  {/* Date Range */}
                  {dashboardStats.dateRange.earliest && dashboardStats.dateRange.latest && (
                    <div className="text-sm text-muted-foreground text-center">
                      Data spans from{' '}
                      <span className="font-medium text-foreground">
                        {new Date(dashboardStats.dateRange.earliest).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      {' '}to{' '}
                      <span className="font-medium text-foreground">
                        {new Date(dashboardStats.dateRange.latest).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}

                  {/* Fiscal Year Chart */}
                  {chartData.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-4">Installations by Fiscal Year</h4>
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end" 
                              height={60}
                              tick={{ fontSize: 11 }}
                              className="fill-muted-foreground"
                            />
                            <YAxis 
                              yAxisId="left"
                              tick={{ fontSize: 11 }}
                              className="fill-muted-foreground"
                            />
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              tick={{ fontSize: 11 }}
                              className="fill-muted-foreground"
                            />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar 
                              yAxisId="left"
                              dataKey="count" 
                              name="Installations" 
                              fill="hsl(var(--primary))" 
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar 
                              yAxisId="right"
                              dataKey="totalKW" 
                              name="Total kW" 
                              fill="hsl(var(--chart-2))" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  )}

                  {/* Top Fiscal Years Table */}
                  {dashboardStats.fiscalYearBreakdown.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Fiscal Year Breakdown</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 font-medium">Fiscal Year</th>
                              <th className="text-right py-2 px-3 font-medium">Installations</th>
                              <th className="text-right py-2 px-3 font-medium">Total kW</th>
                              <th className="text-right py-2 px-3 font-medium">Avg kW/Install</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardStats.fiscalYearBreakdown.slice().reverse().slice(0, 10).map((fy) => (
                              <tr key={fy.fiscalYear} className="border-b border-muted">
                                <td className="py-2 px-3">{fy.label}</td>
                                <td className="py-2 px-3 text-right">{fy.count.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right">{fy.totalKW.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right">
                                  {fy.count > 0 ? (fy.totalKW / fy.count).toFixed(1) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {dashboardStats.fiscalYearBreakdown.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          Showing most recent 10 of {dashboardStats.fiscalYearBreakdown.length} fiscal years
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No PIR data in database yet</p>
                  <p className="text-sm mt-1">Upload a CSV file above to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expected CSV Format</CardTitle>
              <CardDescription>
                The CSV should match the "PIR no Prem 2004 to 2025 good" tab structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <div className="text-muted-foreground mb-2"># Expected columns:</div>
                <div>Install Date, kW Capacity, Battery kWh, Cost, AE Rebate,</div>
                <div>$/kW rebate, % rebate, Date, Years old, Installer,</div>
                <div>Look into, Question, Fiscal year</div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Address Data</AlertTitle>
                <AlertDescription>
                  This PIR data doesn't include street addresses. Matching with City permit data 
                  will rely on <strong>interconnection date</strong>, <strong>kW capacity</strong>, and 
                  <strong> installer name</strong> correlations instead of address matching.
                </AlertDescription>
              </Alert>

              <p className="text-sm text-muted-foreground">
                The importer will parse dates in M/D/YYYY format and handle currency-formatted numbers.
                Each row will be assigned a unique PIR identifier based on row number.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PIRImport;
