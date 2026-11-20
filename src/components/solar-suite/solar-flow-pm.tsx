import { useState } from "react";
import { BarChart3, ClipboardList, GanttChart, LayoutDashboard, Ruler, SunMedium } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import AccountAuthButton from "@/components/AccountAuthButton";
import { Progress } from "@/components/ui/progress";
import { useSharedProject } from "@/lib/shared-project";
import { GanttWorkspace, type ScheduleSummary, type SolarFlowView } from "@/features/gantt/GanttWorkspace";

export function SolarFlowPm() {
  const { project, updateProject } = useSharedProject();
  const [view, setView] = useState<SolarFlowView>("gantt");
  const [summary, setSummary] = useState<ScheduleSummary>({ overall: 0, finishIso: null, startIso: null, hasSchedule: false });

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <header className="border-b border-primary-foreground/15 bg-primary text-primary-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3"><SunMedium className="size-7 text-accent" /><div><h1 className="font-display text-xl font-bold">SolarFlow PM</h1><p className="font-mono text-[9px] uppercase opacity-70">Austin Clean Energy · Project controls</p></div></div>
          <div className="flex gap-2"><Button asChild size="sm" variant="outline" className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/solar-bom"><ClipboardList /> BOM</Link></Button><Button asChild size="sm" variant="outline" className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/solar-draft"><Ruler /> Plans</Link></Button><AccountAuthButton /></div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-61px)] lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-background p-4 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] uppercase text-primary">Project workspace</p>
          <div className="mt-3 space-y-2">
            <SharedField label="Project name" value={project.projectName} onChange={(value) => updateProject({ projectName: value })} />
            <SharedField label="Address" value={project.address} onChange={(value) => updateProject({ address: value })} />
            <SharedField label="System size (kW DC)" value={String(project.systemSizeKw)} type="number" onChange={(value) => updateProject({ systemSizeKw: Math.max(0, Number(value)) })} />
            <p className="text-[10px] text-muted-foreground">
              {summary.finishIso ? `Forecast completion: ${summary.finishIso}` : "Schedules are tied to this property."}
            </p>
          </div>
          <nav className="mt-6 space-y-1">{([{ id: "gantt", label: "Gantt Chart", icon: GanttChart }, { id: "board", label: "Task Board", icon: LayoutDashboard }, { id: "milestones", label: "Milestones & KPIs", icon: BarChart3 }] as const).map((item) => <Button key={item.id} variant={view === item.id ? "default" : "ghost"} className="w-full justify-start" onClick={() => setView(item.id)}><item.icon /> {item.label}</Button>)}</nav>
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Overall completion</p>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={summary.overall} />
              <strong className="font-mono text-sm">{summary.overall}%</strong>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="border-b border-border bg-background px-4 py-4 sm:px-6">
            <p className="font-mono text-[10px] uppercase text-primary">{project.systemSizeKw} kW DC · {project.address}</p>
            <h2 className="font-display text-2xl font-bold">{view === "gantt" ? "Delivery schedule" : view === "board" ? "Task board" : "Project milestones"}</h2>
          </div>
          <div className="p-3 sm:p-6">
            <div className="-mx-3 sm:-mx-6">
              <GanttWorkspace view={view} onSummaryChange={setSummary} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SharedField({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) { return <label className="block"><span className="font-mono text-[9px] uppercase text-muted-foreground">{label}</span><input type={type} min={type === "number" ? 0 : undefined} className="mt-1 w-full rounded-md border border-input bg-card px-2.5 py-2 text-sm outline-none focus:ring-1 focus:ring-ring" value={value} onChange={(event) => onChange(event.target.value)} /></label>; }