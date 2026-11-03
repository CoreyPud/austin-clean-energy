import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Project {
  title: string; address: string; property_type: string; system_kw_dc: number | null; installed_cost: number | null;
  annual_production_kwh: number | null; production_basis: string | null; program: string | null; note: string;
  forms: { label: string; url: string }[]; updated_at: string;
}

const fmt = (v: number | null, unit = "", money = false) => v == null ? "Not yet entered" : money ? `$${v.toLocaleString()}` : `${v.toLocaleString()}${unit}`;

export default function ProjectPortal() {
  const { token } = useParams();
  const [data, setData] = useState<{ recipient_name: string; project: Project } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Project details | Austin Clean Energy";
    const meta = document.createElement("meta"); meta.name = "robots"; meta.content = "noindex"; document.head.appendChild(meta);
    supabase.functions.invoke("project-shares", { body: { action: "view", token } }).then(({ data, error }) => {
      if (error || !data?.project) setError("This link is not active. Ask the sender for a new one."); else setData(data);
    });
    return () => meta.remove();
  }, [token]);

  const download = async () => {
    const { data: r, error } = await supabase.functions.invoke("project-shares", { body: { action: "download", token } });
    if (error || !r?.csv) return toast.error("Download failed");
    const url = URL.createObjectURL(new Blob([r.csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = r.filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  if (error) return <main className="container max-w-2xl py-16"><Card><CardContent className="p-8 text-center text-muted-foreground">{error}</CardContent></Card></main>;
  if (!data) return <main className="container max-w-2xl py-16"><Skeleton className="h-64 w-full" /></main>;
  const p = data.project;
  const rows: [string, string][] = [
    ["Service address", p.address], ["Property type", p.property_type],
    ["System size", fmt(p.system_kw_dc, " kW DC")], ["Estimated installed cost", fmt(p.installed_cost, "", true)],
    ["Estimated annual production", fmt(p.annual_production_kwh, " kWh")],
    ["Suggested Austin Energy program", p.program ?? "Needs individual review"],
  ];
  return (
    <main className="container max-w-2xl py-12 space-y-6">
      <p className="text-sm text-muted-foreground">Shared with {data.recipient_name}</p>
      <Card>
        <CardHeader><CardTitle>{p.title}</CardTitle><CardDescription>Last updated {new Date(p.updated_at).toLocaleDateString()}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <dl className="divide-y">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>)}</dl>
          <p className="text-xs text-muted-foreground">{p.note}{p.production_basis ? ` Production basis: ${p.production_basis}.` : ""} Estimates only; confirm with the installer and Austin Energy.</p>
          <Button onClick={download}><Download className="h-4 w-4 mr-2" />Download project summary</Button>
        </CardContent>
      </Card>
      {p.forms.length > 0 && <Card><CardHeader><CardTitle className="text-lg">Austin Energy forms</CardTitle></CardHeader><CardContent className="space-y-2">
        {p.forms.map((f) => <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline"><ExternalLink className="h-4 w-4" />{f.label}</a>)}
      </CardContent></Card>}
    </main>
  );
}
