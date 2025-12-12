import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowLeft, Calendar, Zap, Battery, ChevronDown, ChevronUp, Info, Code, FileText, AlertTriangle, ArrowUpDown, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface FiscalYearData {
  fiscalYear: number;
  label: string;
  count: number;
  batteryCount: number;
  totalKW: number;
  duplicatesRemoved?: number;
}

interface InstallationDetail {
  id: string;
  project_id: string | null;
  address: string;
  description: string | null;
  installed_kw: number | null;
  applied_date: string | null;
  issued_date: string | null;
  completed_date: string | null;
  status_current: string | null;
  contractor_company: string | null;
}

interface DrillDownData {
  installations: InstallationDetail[];
  duplicatesRemoved: number;
  fiscalYear: number;
  dateRange: { startDate: string; endDate: string };
}

type SortField = 'address' | 'installed_kw' | 'applied_date' | 'completed_date' | 'days_to_complete' | 'status_current';
type SortDirection = 'asc' | 'desc';

const FiscalYearStats = () => {
  const [data, setData] = useState<FiscalYearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFY, setExpandedFY] = useState<number | null>(null);
  const [expandedCapacityFY, setExpandedCapacityFY] = useState<number | null>(null);
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const [capacityDrillDownData, setCapacityDrillDownData] = useState<DrillDownData | null>(null);
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  const [capacityDrillDownLoading, setCapacityDrillDownLoading] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [sqlOpen, setSqlOpen] = useState(false);
  const [installSortField, setInstallSortField] = useState<SortField>('completed_date');
  const [installSortDir, setInstallSortDir] = useState<SortDirection>('desc');
  const [capacitySortField, setCapacitySortField] = useState<SortField>('installed_kw');
  const [capacitySortDir, setCapacitySortDir] = useState<SortDirection>('desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: responseData, error } = await supabase.functions.invoke("fiscal-year-stats");
        if (error) throw error;
        setData(responseData?.data || []);
      } catch (err) {
        console.error("Error fetching fiscal year stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchDrillDownData = useCallback(async (fiscalYear: number) => {
    if (expandedFY === fiscalYear) {
      setExpandedFY(null);
      setDrillDownData(null);
      return;
    }

    setDrillDownLoading(true);
    setExpandedFY(fiscalYear);

    try {
      const { data: responseData, error } = await supabase.functions.invoke("fiscal-year-stats", {
        body: { fiscalYear, includeDetails: true }
      });
      if (error) throw error;
      setDrillDownData(responseData);
    } catch (err) {
      console.error("Error fetching drill-down data:", err);
    } finally {
      setDrillDownLoading(false);
    }
  }, [expandedFY]);

  const chartData = data.map((item) => ({
    name: item.label,
    fiscalYear: item.fiscalYear,
    solarOnly: item.count - item.batteryCount,
    withBattery: item.batteryCount,
    totalKW: Math.round(item.totalKW),
  }));

  const chartConfig = {
    solarOnly: {
      label: "Solar Only",
      color: "hsl(var(--primary))",
    },
    withBattery: {
      label: "With Battery",
      color: "hsl(var(--chart-2))",
    },
    totalKW: {
      label: "Total kW",
      color: "hsl(var(--chart-3))",
    },
  };

  // Calculate summary stats
  const totalInstallations = data.reduce((sum, item) => sum + item.count, 0);
  const totalKW = data.reduce((sum, item) => sum + item.totalKW, 0);
  const totalWithBattery = data.reduce((sum, item) => sum + item.batteryCount, 0);
  const totalDuplicatesRemoved = data.reduce((sum, item) => sum + (item.duplicatesRemoved || 0), 0);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  const calculateDaysToComplete = (applied: string | null, completed: string | null) => {
    if (!applied || !completed) return null;
    const start = new Date(applied);
    const end = new Date(completed);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const sortInstallations = useCallback((installations: InstallationDetail[], field: SortField, direction: SortDirection) => {
    return [...installations].sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (field) {
        case 'address':
          aVal = a.address.toLowerCase();
          bVal = b.address.toLowerCase();
          break;
        case 'installed_kw':
          aVal = a.installed_kw ?? -1;
          bVal = b.installed_kw ?? -1;
          break;
        case 'applied_date':
          aVal = a.applied_date ?? '';
          bVal = b.applied_date ?? '';
          break;
        case 'completed_date':
          aVal = a.completed_date ?? '';
          bVal = b.completed_date ?? '';
          break;
        case 'days_to_complete':
          aVal = calculateDaysToComplete(a.applied_date, a.completed_date) ?? -1;
          bVal = calculateDaysToComplete(b.applied_date, b.completed_date) ?? -1;
          break;
        case 'status_current':
          aVal = (a.status_current ?? '').toLowerCase();
          bVal = (b.status_current ?? '').toLowerCase();
          break;
      }

      if (aVal === null || bVal === null) return 0;
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  const sortedInstallDrillDown = useMemo(() => {
    if (!drillDownData?.installations) return [];
    return sortInstallations(drillDownData.installations, installSortField, installSortDir);
  }, [drillDownData, installSortField, installSortDir, sortInstallations]);

  const sortedCapacityDrillDown = useMemo(() => {
    if (!capacityDrillDownData?.installations) return [];
    return sortInstallations(capacityDrillDownData.installations, capacitySortField, capacitySortDir);
  }, [capacityDrillDownData, capacitySortField, capacitySortDir, sortInstallations]);

  const handleInstallSort = (field: SortField) => {
    if (installSortField === field) {
      setInstallSortDir(installSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setInstallSortField(field);
      setInstallSortDir('desc');
    }
  };

  const handleCapacitySort = (field: SortField) => {
    if (capacitySortField === field) {
      setCapacitySortDir(capacitySortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setCapacitySortField(field);
      setCapacitySortDir('desc');
    }
  };

  const exportToCSV = (installations: InstallationDetail[], fiscalYear: number, type: 'installations' | 'capacity') => {
    const headers = ['Address', 'Project ID', 'Capacity (kW)', 'Applied Date', 'Issued Date', 'Completed Date', 'Days to Complete', 'Status'];
    const rows = installations.map(install => {
      const days = calculateDaysToComplete(install.applied_date, install.completed_date);
      return [
        `"${install.address.replace(/"/g, '""')}"`,
        install.project_id || '',
        install.installed_kw ?? '',
        install.applied_date || '',
        install.issued_date || '',
        install.completed_date || '',
        days ?? '',
        install.status_current || ''
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FY${fiscalYear}_${type}_drilldown.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBarClick = (data: { fiscalYear: number }) => {
    if (data?.fiscalYear) {
      fetchDrillDownData(data.fiscalYear);
    }
  };

  const fetchCapacityDrillDownData = useCallback(async (fiscalYear: number) => {
    if (expandedCapacityFY === fiscalYear) {
      setExpandedCapacityFY(null);
      setCapacityDrillDownData(null);
      return;
    }

    setCapacityDrillDownLoading(true);
    setExpandedCapacityFY(fiscalYear);

    try {
      const { data: responseData, error } = await supabase.functions.invoke("fiscal-year-stats", {
        body: { fiscalYear, includeDetails: true, sortByKW: true }
      });
      if (error) throw error;
      setCapacityDrillDownData(responseData);
    } catch (err) {
      console.error("Error fetching capacity drill-down data:", err);
    } finally {
      setCapacityDrillDownLoading(false);
    }
  }, [expandedCapacityFY]);

  const handleCapacityBarClick = (data: { fiscalYear: number }) => {
    if (data?.fiscalYear) {
      fetchCapacityDrillDownData(data.fiscalYear);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/city-overview">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to City Overview
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Solar Installations by Fiscal Year
          </h1>
          <p className="text-muted-foreground">
            Austin's fiscal year runs October 1 – September 30. This view groups solar permit data by City of Austin fiscal years.
          </p>
          {totalDuplicatesRemoved > 0 && (
            <Badge variant="secondary" className="mt-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {totalDuplicatesRemoved} duplicate permits removed via project_id deduplication
            </Badge>
          )}
        </div>

        {/* Query Methodology Explanation */}
        <Card className="mb-8">
          <Collapsible open={methodologyOpen} onOpenChange={setMethodologyOpen}>
            <CardHeader className="cursor-pointer" onClick={() => setMethodologyOpen(!methodologyOpen)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Query Methodology</CardTitle>
                  </div>
                  {methodologyOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fiscal Year Boundaries
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Each fiscal year spans October 1 through September 30. For example, FY 2024 covers October 1, 2023 through September 30, 2024.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Date Field Priority
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Records are grouped by <code className="bg-muted px-1 rounded">completed_date</code>. If no completion date exists, the system falls back to <code className="bg-muted px-1 rounded">issued_date</code>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Deduplication
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Duplicate permits are removed using <code className="bg-muted px-1 rounded">project_id</code> as the unique identifier. The most recent record (by completion date) is kept.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Battery className="h-4 w-4" />
                      Battery Detection
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Installations are flagged as "with battery" if the description contains terms like: bess, battery, batteries, energy storage, powerwall, or backup.
                    </p>
                  </div>
                </div>

                {/* SQL Details (Collapsible) */}
                <Collapsible open={sqlOpen} onOpenChange={setSqlOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-4">
                      <Code className="h-4 w-4 mr-2" />
                      {sqlOpen ? "Hide SQL Details" : "Show SQL Details"}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap">
{`-- Primary query (by completed_date)
SELECT id, project_id, description, installed_kw
FROM solar_installations
WHERE completed_date >= '{fy-1}-10-01'
  AND completed_date <= '{fy}-09-30'
ORDER BY completed_date DESC;

-- Fallback query (if no completed_date results)
SELECT id, project_id, description, installed_kw
FROM solar_installations  
WHERE issued_date >= '{fy-1}-10-01'
  AND issued_date <= '{fy}-09-30';

-- Deduplication logic (applied in-memory):
-- Group by project_id, keep first occurrence
-- Records without project_id are always retained`}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Installations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{totalInstallations.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Total Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{Math.round(totalKW).toLocaleString()} kW</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Battery className="h-4 w-4" />
                With Battery Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{totalWithBattery.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Installations Chart */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Installations by Fiscal Year</CardTitle>
            <CardDescription>
              Click on a bar to view detailed records for that fiscal year
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    onClick={(e) => e?.activePayload?.[0]?.payload && handleBarClick(e.activePayload[0].payload)}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      className="text-muted-foreground"
                    />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="solarOnly"
                      stackId="installations"
                      fill="hsl(var(--primary))"
                      name="Solar Only"
                      radius={[0, 0, 0, 0]}
                      cursor="pointer"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-solar-${index}`}
                          fillOpacity={expandedFY === entry.fiscalYear ? 1 : 0.8}
                          stroke={expandedFY === entry.fiscalYear ? "hsl(var(--foreground))" : "none"}
                          strokeWidth={expandedFY === entry.fiscalYear ? 2 : 0}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="withBattery"
                      stackId="installations"
                      fill="hsl(var(--chart-2))"
                      name="With Battery"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-battery-${index}`}
                          fillOpacity={expandedFY === entry.fiscalYear ? 1 : 0.8}
                          stroke={expandedFY === entry.fiscalYear ? "hsl(var(--foreground))" : "none"}
                          strokeWidth={expandedFY === entry.fiscalYear ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Drill-Down Section */}
        {expandedFY && (
          <Card className="mb-8 border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    FY {expandedFY} Installation Details
                    {drillDownData && (
                      <Badge variant="outline">{drillDownData.installations.length} records</Badge>
                    )}
                  </CardTitle>
                  {drillDownData && (
                    <CardDescription>
                      Date range: {formatDate(drillDownData.dateRange.startDate)} – {formatDate(drillDownData.dateRange.endDate)}
                      {drillDownData.duplicatesRemoved > 0 && (
                        <span className="ml-2 text-yellow-600">
                          ({drillDownData.duplicatesRemoved} duplicates removed)
                        </span>
                      )}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {drillDownData?.installations && drillDownData.installations.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(sortedInstallDrillDown, expandedFY!, 'installations')}>
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setExpandedFY(null); setDrillDownData(null); }}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {drillDownLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : sortedInstallDrillDown.length > 0 ? (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="min-w-[200px] cursor-pointer hover:bg-muted/50" onClick={() => handleInstallSort('address')}>
                          <div className="flex items-center gap-1">
                            Address
                            <ArrowUpDown className="h-3 w-3" />
                            {installSortField === 'address' && <span className="text-xs">({installSortDir})</span>}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[100px] cursor-pointer hover:bg-muted/50" onClick={() => handleInstallSort('installed_kw')}>
                          <div className="flex items-center gap-1">
                            Capacity
                            <ArrowUpDown className="h-3 w-3" />
                            {installSortField === 'installed_kw' && <span className="text-xs">({installSortDir})</span>}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[280px] cursor-pointer hover:bg-muted/50" onClick={() => handleInstallSort('completed_date')}>
                          <div className="flex items-center gap-1">
                            Permit Timeline
                            <ArrowUpDown className="h-3 w-3" />
                            {installSortField === 'completed_date' && <span className="text-xs">({installSortDir})</span>}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[100px] cursor-pointer hover:bg-muted/50" onClick={() => handleInstallSort('days_to_complete')}>
                          <div className="flex items-center gap-1">
                            Days to Complete
                            <ArrowUpDown className="h-3 w-3" />
                            {installSortField === 'days_to_complete' && <span className="text-xs">({installSortDir})</span>}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[120px] cursor-pointer hover:bg-muted/50" onClick={() => handleInstallSort('status_current')}>
                          <div className="flex items-center gap-1">
                            Status
                            <ArrowUpDown className="h-3 w-3" />
                            {installSortField === 'status_current' && <span className="text-xs">({installSortDir})</span>}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedInstallDrillDown.map((install) => {
                        const daysToComplete = calculateDaysToComplete(install.applied_date, install.completed_date);
                        return (
                          <TableRow key={install.id}>
                            <TableCell className="font-medium">
                              <div className="max-w-[200px]">
                                <div className="truncate" title={install.address}>
                                  {install.address}
                                </div>
                                {install.project_id && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    ID: {install.project_id}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {install.installed_kw ? `${install.installed_kw} kW` : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-16 text-muted-foreground">Applied:</span>
                                  <span>{formatDate(install.applied_date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16 text-muted-foreground">Issued:</span>
                                  <span>{formatDate(install.issued_date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16 text-muted-foreground">Completed:</span>
                                  <span className="font-medium">{formatDate(install.completed_date)}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {daysToComplete !== null ? (
                                <Badge variant={daysToComplete <= 30 ? "default" : daysToComplete <= 90 ? "secondary" : "outline"}>
                                  {daysToComplete} days
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {install.status_current || "Unknown"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No detailed records available for this fiscal year.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Capacity Chart */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Installed Capacity by Fiscal Year</CardTitle>
            <CardDescription>
              Click on a bar to view detailed records sorted by capacity (kW)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    onClick={(e) => e?.activePayload?.[0]?.payload && handleCapacityBarClick(e.activePayload[0].payload)}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      className="text-muted-foreground"
                    />
                    <YAxis className="text-muted-foreground" tickFormatter={(value) => `${value.toLocaleString()}`} />
                    <Tooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`${value.toLocaleString()} kW`, "Capacity"]}
                    />
                    <Bar
                      dataKey="totalKW"
                      fill="hsl(var(--chart-3))"
                      name="Total kW"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-capacity-${index}`}
                          fillOpacity={expandedCapacityFY === entry.fiscalYear ? 1 : 0.8}
                          stroke={expandedCapacityFY === entry.fiscalYear ? "hsl(var(--foreground))" : "none"}
                          strokeWidth={expandedCapacityFY === entry.fiscalYear ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Note: kW capacity values are based on permit records and may not represent total installed capacity in all cases.
            </p>
          </CardContent>
        </Card>

        {/* Capacity Drill-Down Section */}
        {expandedCapacityFY && (
          <Card className="mb-8 border-2 border-chart-3/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    FY {expandedCapacityFY} Installations by Capacity
                    {capacityDrillDownData && (
                      <Badge variant="outline">{capacityDrillDownData.installations.length} records</Badge>
                    )}
                  </CardTitle>
                  {capacityDrillDownData && (
                    <CardDescription>
                      Date range: {formatDate(capacityDrillDownData.dateRange.startDate)} – {formatDate(capacityDrillDownData.dateRange.endDate)}
                      {capacityDrillDownData.duplicatesRemoved > 0 && (
                        <span className="ml-2 text-yellow-600">
                          ({capacityDrillDownData.duplicatesRemoved} duplicates removed)
                        </span>
                      )}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {capacityDrillDownData?.installations && capacityDrillDownData.installations.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(sortedCapacityDrillDown, expandedCapacityFY!, 'capacity')}>
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setExpandedCapacityFY(null); setCapacityDrillDownData(null); }}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {capacityDrillDownLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : sortedCapacityDrillDown.length > 0 ? (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="min-w-[100px] cursor-pointer hover:bg-muted/50" onClick={() => handleCapacitySort('installed_kw')}>
                          <div className="flex items-center gap-1">
                            Capacity
                            <ArrowUpDown className="h-3 w-3" />
                            {capacitySortField === 'installed_kw' && <span className="text-xs">({capacitySortDir})</span>}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[200px] cursor-pointer hover:bg-muted/50" onClick={() => handleCapacitySort('address')}>
                          <div className="flex items-center gap-1">
                            Address
                            <ArrowUpDown className="h-3 w-3" />
                            {capacitySortField === 'address' && <span className="text-xs">({capacitySortDir})</span>}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[280px] cursor-pointer hover:bg-muted/50" onClick={() => handleCapacitySort('completed_date')}>
                          <div className="flex items-center gap-1">
                            Permit Timeline
                            <ArrowUpDown className="h-3 w-3" />
                            {capacitySortField === 'completed_date' && <span className="text-xs">({capacitySortDir})</span>}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[100px] cursor-pointer hover:bg-muted/50" onClick={() => handleCapacitySort('days_to_complete')}>
                          <div className="flex items-center gap-1">
                            Days to Complete
                            <ArrowUpDown className="h-3 w-3" />
                            {capacitySortField === 'days_to_complete' && <span className="text-xs">({capacitySortDir})</span>}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[120px] cursor-pointer hover:bg-muted/50" onClick={() => handleCapacitySort('status_current')}>
                          <div className="flex items-center gap-1">
                            Status
                            <ArrowUpDown className="h-3 w-3" />
                            {capacitySortField === 'status_current' && <span className="text-xs">({capacitySortDir})</span>}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedCapacityDrillDown.map((install) => {
                        const daysToComplete = calculateDaysToComplete(install.applied_date, install.completed_date);
                        return (
                          <TableRow key={install.id}>
                            <TableCell className="font-bold text-lg">
                              {install.installed_kw ? `${install.installed_kw} kW` : "—"}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="max-w-[200px]">
                                <div className="truncate" title={install.address}>
                                  {install.address}
                                </div>
                                {install.project_id && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    ID: {install.project_id}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-16 text-muted-foreground">Applied:</span>
                                  <span>{formatDate(install.applied_date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16 text-muted-foreground">Issued:</span>
                                  <span>{formatDate(install.issued_date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16 text-muted-foreground">Completed:</span>
                                  <span className="font-medium">{formatDate(install.completed_date)}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {daysToComplete !== null ? (
                                <Badge variant={daysToComplete <= 30 ? "default" : daysToComplete <= 90 ? "secondary" : "outline"}>
                                  {daysToComplete} days
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {install.status_current || "Unknown"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No detailed records available for this fiscal year.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fiscal Year Summary Table</CardTitle>
            <CardDescription>Click a row to view detailed records</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fiscal Year</TableHead>
                      <TableHead className="text-right">Installations</TableHead>
                      <TableHead className="text-right">With Battery</TableHead>
                      <TableHead className="text-right">Total kW</TableHead>
                      <TableHead className="text-right">Duplicates Removed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow 
                        key={item.fiscalYear} 
                        className={`cursor-pointer hover:bg-muted/50 ${expandedFY === item.fiscalYear ? 'bg-primary/10' : ''}`}
                        onClick={() => fetchDrillDownData(item.fiscalYear)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {item.label}
                            {expandedFY === item.fiscalYear && <ChevronUp className="h-4 w-4" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.count.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{item.batteryCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{Math.round(item.totalKW).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {item.duplicatesRemoved ? (
                            <Badge variant="secondary" className="text-xs">
                              {item.duplicatesRemoved}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FiscalYearStats;
