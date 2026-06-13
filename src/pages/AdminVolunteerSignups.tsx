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
import { ArrowLeft, Download, LogOut, Users, RefreshCw } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const AREA_LABELS: Record<string, string> = {
  outreach_community: "Outreach & community",
  data_validation: "Data validation",
  technical_work: "Technical work",
  engineering_events: "Engineering / events",
};

interface Signup {
  id: string;
  created_at: string;
  name: string;
  email: string;
  involvement_area: string;
  notes: string | null;
}

export default function AdminVolunteerSignups() {
  const [signups, setSignups] = useState<Signup[]>([]);
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

  const fetchSignups = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "manage-volunteer-signups?action=list",
        {
          method: "GET",
          headers: { "x-admin-token": token },
        },
      );
      if (error) throw error;
      setSignups(data?.signups ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load signups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignups();
  }, [fetchSignups]);

  const handleDownload = async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/manage-volunteer-signups?action=export`,
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
      a.download = `volunteer-signups-${new Date().toISOString().slice(0, 10)}.csv`;
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
                <Users className="h-6 w-6" /> Volunteer Signups
              </h1>
              <p className="text-muted-foreground">
                Submissions from the /join-the-community form
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
                  Signups
                  <Badge variant="secondary">{signups.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Most recent first. Use Download CSV to export the full list.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSignups}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={downloading || signups.length === 0}
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
            ) : signups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No signups yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signups.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(s.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-sm">
                          <a
                            href={`mailto:${s.email}`}
                            className="text-primary hover:underline"
                          >
                            {s.email}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {AREA_LABELS[s.involvement_area] ??
                              s.involvement_area}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[360px] text-sm text-muted-foreground whitespace-pre-wrap">
                          {s.notes || "—"}
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
