import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCourseAuth } from "@/hooks/use-course-auth";
import { useSeo } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ResultRow = { user_id: string; quiz_number: number; score: number; total: number; created_at: string };
type ProfileRow = { id: string; display_name: string | null; email: string | null; created_at: string };

export default function AdminCourseResults() {
  useSeo({ title: "Course Results | Admin", description: "Course check-in scores by participant." });

  const { loading, adminLoading, session, isAdmin, signOut } = useCourseAuth();
  const [results, setResults] = useState<ResultRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setFetching(true);
    (async () => {
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase.from("course_quiz_results").select("user_id,quiz_number,score,total,created_at"),
        supabase.from("profiles").select("id,display_name,email,created_at"),
      ]);
      setResults(r ?? []);
      setProfiles(p ?? []);
      setFetching(false);
    })();
  }, [isAdmin]);

  const rows = useMemo(() => {
    return profiles
      .map((p) => {
        const mine = results.filter((r) => r.user_id === p.id).sort((a, b) => a.quiz_number - b.quiz_number);
        const score = mine.reduce((s, r) => s + r.score, 0);
        const total = mine.reduce((s, r) => s + r.total, 0);
        const last = mine.reduce<string | null>((acc, r) => (!acc || r.created_at > acc ? r.created_at : acc), null);
        return { ...p, mine, score, total, last };
      })
      .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""));
  }, [profiles, results]);

  function exportCsv() {
    const header = ["Name", "Email", "Check-ins completed", "Score", "Out of", "Last activity"];
    const lines = rows.map((r) => [
      r.display_name ?? "",
      r.email ?? "",
      String(r.mine.length),
      String(r.score),
      String(r.total),
      r.last ?? "",
    ]);
    const csv = [header, ...lines].map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "course-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || adminLoading) {
    return <div className="container mx-auto px-4 py-12 text-muted-foreground">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <p className="mb-4">Please sign in with an admin account to view course results.</p>
        <Button asChild>
          <Link to="/course/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12 space-y-4">
        <p>This account does not have access to course results.</p>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Course results</h1>
          <p className="text-sm text-muted-foreground">Check-in scores from The Grid Primer.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/dashboard">Back to dashboard</Link>
          </Button>
          <Button onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {rows.length} account{rows.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fetching ? (
            <p className="text-muted-foreground">Loading results…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">No one has signed up yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Check-ins</th>
                    <th className="py-2 pr-4">Score</th>
                    <th className="py-2 pr-4">Per check-in</th>
                    <th className="py-2">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.display_name ?? "—"}</td>
                      <td className="py-2 pr-4">{r.email ?? "—"}</td>
                      <td className="py-2 pr-4">{r.mine.length}</td>
                      <td className="py-2 pr-4">{r.total > 0 ? `${r.score}/${r.total}` : "—"}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {r.mine.map((m) => `#${m.quiz_number}: ${m.score}/${m.total}`).join("  ·  ") || "—"}
                      </td>
                      <td className="py-2">{r.last ? new Date(r.last).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
