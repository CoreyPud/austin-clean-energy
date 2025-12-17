import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, LogOut, Edit, AlertTriangle, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CorrectionEditModal } from "@/components/CorrectionEditModal";

interface Installation {
  id: string;
  project_id: string;
  address: string;
  installed_kw: number | null;
  completed_date: string | null;
  description: string | null;
  has_correction: boolean;
  is_duplicate: boolean | null;
  correction_notes: string | null;
}

export default function AdminCorrections() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [total, setTotal] = useState(0);
  const [selectedInstallation, setSelectedInstallation] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    const expires = sessionStorage.getItem('admin_token_expires');
    
    if (!token || !expires || new Date(expires) < new Date()) {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_token_expires');
      navigate('/admin');
      return;
    }
    
    // Validate token with server
    validateToken(token);
  }, [navigate]);

  const validateToken = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'validate', token }
      });
      
      if (error || !data?.valid) {
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token_expires');
        navigate('/admin');
      }
    } catch {
      navigate('/admin');
    }
  };

  const fetchInstallations = useCallback(async () => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-corrections', {
        body: { 
          action: 'list', 
          search: search || undefined,
          filter: filter !== 'all' ? filter : undefined,
          limit: 100
        },
        headers: { 'x-admin-token': token }
      });
      
      if (error) throw error;
      
      setInstallations(data?.installations || []);
      setTotal(data?.total || 0);
    } catch (error) {
      console.error('Error fetching installations:', error);
      toast.error("Failed to fetch installations");
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchInstallations();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchInstallations]);

  const handleLogout = async () => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      await supabase.functions.invoke('admin-auth', {
        body: { action: 'logout', token }
      });
    }
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token_expires');
    navigate('/admin');
  };

  const handleEditComplete = () => {
    setSelectedInstallation(null);
    fetchInstallations();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Data Corrections Console</h1>
              <p className="text-muted-foreground">
                Review and correct solar installation data
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address, project ID, or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="missing_kw">Missing kW</SelectItem>
                  <SelectItem value="has_corrections">Has Corrections</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Installations</span>
              <Badge variant="secondary">{total} records</Badge>
            </CardTitle>
            <CardDescription>
              Click Edit to modify individual records. Corrections overlay the original data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : installations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No installations found matching your criteria
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project ID</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>kW</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installations.map((install) => (
                      <TableRow key={install.id} className={install.is_duplicate ? "opacity-50" : ""}>
                        <TableCell className="font-mono text-sm">
                          {install.project_id?.substring(0, 12) || 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {install.address || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {install.installed_kw ? (
                            <span>{Number(install.installed_kw).toFixed(2)}</span>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Missing
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {install.completed_date 
                            ? new Date(install.completed_date).toLocaleDateString()
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {install.has_correction && (
                              <Badge variant="outline" className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Corrected
                              </Badge>
                            )}
                            {install.is_duplicate && (
                              <Badge variant="secondary" className="text-xs">
                                <X className="h-3 w-3 mr-1" />
                                Duplicate
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInstallation(install.project_id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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

      {/* Edit Modal */}
      {selectedInstallation && (
        <CorrectionEditModal
          projectId={selectedInstallation}
          onClose={() => setSelectedInstallation(null)}
          onSave={handleEditComplete}
        />
      )}
    </div>
  );
}
