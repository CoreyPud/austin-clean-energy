import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, LogOut, Mail, RefreshCw } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface HelpRequest {
  id: string;
  created_at: string;
  name: string;
  email: string;
  message: string;
  source_page: string | null;
  notified_at: string | null;
}

export default function AdminSolarHelpRequests() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    const expires = sessionStorage.getItem("admin_token_expires");
    if (!token || !expires || new Date(expires) < new Date()) {
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_token_expires");
      navigate("/admin");
    }
  }, [navigate]);

  const fetchRequests = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "manage-solar-help-requests?action=list",
        { method: "GET", headers: { "x-admin-token": token } },
      );
      if (error) throw error;
      setRequests(data?.requests ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleDownload = async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/manage-solar-help-requests?action=export`,
        {
          method: "GET",
          headers: {
            "x-admin-token": token,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `solar-help-requests-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to download CSV");
    } finally {
      setDownloading(false);
    }
  };

  const handleLogout = async () => {
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      await supabase.functions.invoke("admin-auth", {
        body: { action: "logout", token },
      });
    }
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_token_expires");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Mail className="h-6 w-6" /> Solar Help Requests
              </h1>
              <p className="text-muted-foreground">
                Submissions from the "Want help navigating your solar options?" form
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Submissions
                  <Badge variant="secondary">{requests.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Most recent first. Use Download CSV to export the full list.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={downloading || requests.length === 0}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading ? "Preparing…" : "Download CSV"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No submissions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Emailed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-sm">
                          <a href={`mailto:${r.email}`} className="text-primary underline">
                            {r.email}
                          </a>
                        </TableCell>
                        <TableCell className="text-sm max-w-md whitespace-pre-wrap">
                          {r.message}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.source_page ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.notified_at ? (
                            <Badge variant="secondary">Sent</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
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
}
