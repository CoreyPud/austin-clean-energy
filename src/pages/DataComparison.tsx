import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, RefreshCw, Database, GitCompare, AlertTriangle, CheckCircle2, Upload, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface DataStats {
  cityRecords: number;
  pirRecords: number;
  matchedRecords: number;
  unmatchedCity: number;
  unmatchedPir: number;
  kwDiscrepancies: number;
}

interface MatchResult {
  id: string;
  solar_installation_id: string;
  pir_installation_id: string;
  match_confidence: number;
  match_type: string;
  status: string;
  city_address?: string;
  city_kw?: number;
  pir_address?: string;
  pir_kw?: number;
}

interface ComparisonYearData {
  year: number;
  label: string;
  cityCount: number;
  pirCount: number;
  cityKW: number;
  pirKW: number;
}

const chartConfig = {
  cityCount: {
    label: "City Permits",
    color: "hsl(var(--primary))",
  },
  pirCount: {
    label: "PIR Records",
    color: "hsl(var(--chart-2))",
  },
  cityKW: {
    label: "City kW",
    color: "hsl(var(--primary))",
  },
  pirKW: {
    label: "PIR kW",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const DataComparison = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DataStats | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isRunningMatch, setIsRunningMatch] = useState(false);
  
  // Year comparison state
  const [yearMode, setYearMode] = useState<'calendar' | 'fiscal'>('fiscal');
  const [comparisonData, setComparisonData] = useState<ComparisonYearData[]>([]);
  const [loadingComparison, setLoadingComparison] = useState(false);

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
      navigate('/admin');
      return;
    }

    setIsAuthenticated(true);
    fetchStats();
    fetchComparisonData(yearMode);
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchComparisonData(yearMode);
    }
  }, [yearMode, isAuthenticated]);

  const getYearFromDate = (dateStr: string | null, mode: 'calendar' | 'fiscal'): number | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed (0 = January)
    
    if (mode === 'fiscal') {
      // Fiscal year: October (month 9) through September
      // If month >= 9 (October+), assign to next year's FY
      return month >= 9 ? year + 1 : year;
    }
    return year;
  };

  const fetchComparisonData = async (mode: 'calendar' | 'fiscal') => {
    setLoadingComparison(true);
    try {
      // Use the fiscal-year-stats edge function for City data to ensure consistency
      // with the public dashboards (handles pagination, deduplication, etc.)
      const { data: fyData, error: fyError } = await supabase.functions.invoke('fiscal-year-stats');
      
      if (fyError) throw fyError;
      
      // Fetch PIR records - need to handle potential pagination
      // First get total count
      const { count: pirTotalCount } = await supabase
        .from('pir_installations')
        .select('*', { count: 'exact', head: true });
      
      // Fetch all PIR records (paginate if > 1000)
      let allPirData: { interconnection_date: string | null; system_kw: number | null }[] = [];
      const pageSize = 1000;
      const totalPages = Math.ceil((pirTotalCount || 0) / pageSize);
      
      for (let page = 0; page < totalPages; page++) {
        const { data: pirPage, error: pirPageError } = await supabase
          .from('pir_installations')
          .select('interconnection_date, system_kw')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (pirPageError) throw pirPageError;
        if (pirPage) allPirData = [...allPirData, ...pirPage];
      }

      // Process City data from fiscal-year-stats response
      const cityByYear: Record<number, { count: number; kw: number }> = {};
      
      if (mode === 'fiscal') {
        // Use fiscal year data directly from the edge function
        (fyData?.data || []).forEach((item: { fiscalYear: number; count: number; totalKW: number }) => {
          cityByYear[item.fiscalYear] = {
            count: item.count,
            kw: item.totalKW
          };
        });
      } else {
        // For calendar year, we need to fetch differently
        // Use the edge function but interpret the data as calendar year approximation
        // Note: This is an approximation - for true calendar year we'd need a different query
        // For now, show a note that fiscal year is recommended for accuracy
        (fyData?.data || []).forEach((item: { fiscalYear: number; count: number; totalKW: number }) => {
          // Approximate calendar year (FY 2024 = mostly CY 2024 with some CY 2023)
          cityByYear[item.fiscalYear] = {
            count: item.count,
            kw: item.totalKW
          };
        });
      }

      // Aggregate PIR data by year
      const pirByYear: Record<number, { count: number; kw: number }> = {};
      allPirData.forEach(record => {
        const year = getYearFromDate(record.interconnection_date, mode);
        if (year && year >= 2015 && year <= 2030) {
          if (!pirByYear[year]) pirByYear[year] = { count: 0, kw: 0 };
          pirByYear[year].count += 1;
          pirByYear[year].kw += record.system_kw || 0;
        }
      });

      // Merge into comparison data
      const allYears = new Set([...Object.keys(cityByYear), ...Object.keys(pirByYear)].map(Number));
      const sortedYears = Array.from(allYears).sort((a, b) => a - b);

      const comparison: ComparisonYearData[] = sortedYears.map(year => ({
        year,
        label: mode === 'fiscal' ? `FY ${year}` : `${year}`,
        cityCount: cityByYear[year]?.count || 0,
        pirCount: pirByYear[year]?.count || 0,
        cityKW: Math.round(cityByYear[year]?.kw || 0),
        pirKW: Math.round(pirByYear[year]?.kw || 0),
      }));

      setComparisonData(comparison);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast.error('Failed to load comparison chart data');
    } finally {
      setLoadingComparison(false);
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Get city records count
      const { count: cityCount } = await supabase
        .from('solar_installations')
        .select('*', { count: 'exact', head: true });

      // Get PIR records count
      const { count: pirCount } = await supabase
        .from('pir_installations')
        .select('*', { count: 'exact', head: true });

      // Get match results
      const { count: matchedCount } = await supabase
        .from('data_match_results')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed');

      const { count: pendingCount } = await supabase
        .from('data_match_results')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review');

      // Get recent matches for display
      const { data: recentMatches } = await supabase
        .from('data_match_results')
        .select('*')
        .order('match_confidence', { ascending: false })
        .limit(50);

      setStats({
        cityRecords: cityCount || 0,
        pirRecords: pirCount || 0,
        matchedRecords: (matchedCount || 0) + (pendingCount || 0),
        unmatchedCity: (cityCount || 0) - ((matchedCount || 0) + (pendingCount || 0)),
        unmatchedPir: (pirCount || 0) - ((matchedCount || 0) + (pendingCount || 0)),
        kwDiscrepancies: 0 // Will calculate when we have match data
      });

      setMatches(recentMatches || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load comparison statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunMatching = async () => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      toast.error('Authentication required');
      navigate('/admin');
      return;
    }

    setIsRunningMatch(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-data-sources', {
        headers: { 'x-admin-token': token }
      });

      if (error) {
        toast.error(`Matching failed: ${error.message}`);
        return;
      }

      if (data.success) {
        toast.success(`Matching complete: ${data.stats.newMatches} new matches found`);
        fetchStats();
      } else {
        toast.error(data.error || 'Matching failed');
      }
    } catch (error) {
      console.error('Matching error:', error);
      toast.error('An error occurred during matching');
    } finally {
      setIsRunningMatch(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token_expires');
    navigate('/admin');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Admin Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Data Comparison Dashboard</h1>
              <p className="text-muted-foreground">
                Compare City permit data with Austin Energy PIR records
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/pir-import')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import PIR Data
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {isLoading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {stats?.cityRecords.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Database className="h-3 w-3" />
                    City Records
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {stats?.pirRecords.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Database className="h-3 w-3" />
                    PIR Records
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {stats?.matchedRecords.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Matched
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {stats?.unmatchedCity.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    City Only
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {stats?.unmatchedPir.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    PIR Only
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {stats?.kwDiscrepancies.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <GitCompare className="h-3 w-3" />
                    kW Mismatch
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={handleRunMatching}
            disabled={isRunningMatch || (stats?.pirRecords === 0)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningMatch ? 'animate-spin' : ''}`} />
            {isRunningMatch ? 'Running Matching...' : 'Run Auto-Match'}
          </Button>
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Stats
          </Button>
        </div>

        {/* Year-over-Year Comparison Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Year-over-Year Comparison</CardTitle>
                <CardDescription>
                  Compare installation counts and capacity between City permits and PIR records
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="year-mode" className="text-sm text-muted-foreground">
                  Calendar Year
                </Label>
                <Switch
                  id="year-mode"
                  checked={yearMode === 'fiscal'}
                  onCheckedChange={(checked) => setYearMode(checked ? 'fiscal' : 'calendar')}
                />
                <Label htmlFor="year-mode" className="text-sm font-medium">
                  Fiscal Year
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingComparison ? (
              <div className="space-y-4">
                <Skeleton className="h-[250px] w-full" />
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : comparisonData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No data available</p>
                <p className="text-sm">Import data to see year-over-year comparisons</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Installation Count Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-4">Installations by Year</h4>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar 
                        dataKey="cityCount" 
                        name="cityCount"
                        fill="var(--color-cityCount)" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="pirCount" 
                        name="pirCount"
                        fill="var(--color-pirCount)" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* kW Capacity Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-4">Total Capacity (kW) by Year</h4>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value: number) => `${value.toLocaleString()} kW`}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar 
                        dataKey="cityKW" 
                        name="cityKW"
                        fill="var(--color-cityKW)" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="pirKW" 
                        name="pirKW"
                        fill="var(--color-pirKW)" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="matches" className="space-y-4">
          <TabsList>
            <TabsTrigger value="matches">Match Results</TabsTrigger>
            <TabsTrigger value="unmatched-city">Unmatched City</TabsTrigger>
            <TabsTrigger value="unmatched-pir">Unmatched PIR</TabsTrigger>
            <TabsTrigger value="discrepancies">Data Discrepancies</TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Match Results</CardTitle>
                <CardDescription>
                  Records matched between City permits and Austin Energy PIR data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No matches found yet</p>
                    <p className="text-sm">
                      {stats?.pirRecords === 0 
                        ? 'Import PIR data first, then run auto-matching'
                        : 'Click "Run Auto-Match" to find matching records'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Match Type</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match) => (
                        <TableRow key={match.id}>
                          <TableCell>
                            <Badge variant="outline">{match.match_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={
                              match.match_confidence >= 90 ? 'text-green-600' :
                              match.match_confidence >= 70 ? 'text-yellow-600' :
                              'text-red-600'
                            }>
                              {match.match_confidence}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={match.status === 'confirmed' ? 'default' : 'secondary'}
                            >
                              {match.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unmatched-city">
            <Card>
              <CardHeader>
                <CardTitle>Unmatched City Records</CardTitle>
                <CardDescription>
                  City permit records without a matching PIR entry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Coming Soon</p>
                  <p className="text-sm">
                    This tab will show City records that don't have a matching PIR record
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unmatched-pir">
            <Card>
              <CardHeader>
                <CardTitle>Unmatched PIR Records</CardTitle>
                <CardDescription>
                  PIR entries without a matching City permit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Coming Soon</p>
                  <p className="text-sm">
                    This tab will show PIR records that don't have a matching City permit
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discrepancies">
            <Card>
              <CardHeader>
                <CardTitle>Data Discrepancies</CardTitle>
                <CardDescription>
                  Matched records with conflicting data values (especially kW)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Coming Soon</p>
                  <p className="text-sm">
                    This tab will show matched records where City and PIR data disagree
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DataComparison;
