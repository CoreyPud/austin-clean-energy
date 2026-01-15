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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const DataComparison = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DataStats | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isRunningMatch, setIsRunningMatch] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    setIsAuthenticated(true);
    fetchStats();
  }, [navigate]);

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
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      toast.error('Authentication required');
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
    sessionStorage.removeItem('adminToken');
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
              size="icon"
              onClick={() => navigate('/admin/corrections')}
            >
              <ArrowLeft className="h-5 w-5" />
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
