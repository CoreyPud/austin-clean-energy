import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";
import {
  KIND_LABEL,
  TIMELINE_SOURCES,
  groupedByYear,
  type TimelineKind,
} from "@/lib/energy-timeline";

const DOT_CLASS: Record<TimelineKind, string> = {
  policy: "bg-background border-2 border-muted-foreground",
  contract: "bg-primary border-2 border-primary",
  vote: "bg-destructive border-2 border-destructive ring-4 ring-destructive/15",
};

const CARD_CLASS: Record<TimelineKind, string> = {
  policy: "",
  contract: "border-primary/40 bg-primary/5",
  vote: "border-destructive/50 bg-destructive/5 shadow-md",
};

const LEGEND_DOT: Record<TimelineKind, string> = {
  policy: "bg-muted-foreground",
  contract: "bg-primary",
  vote: "bg-destructive",
};

const EnergyTimeline = () => {
  useSeo({
    title: "Energy Timeline: The Road to Austin's Gas Vote",
    description:
      "Eight years of Austin Energy decisions — from retiring Decker's steam units to the May 2026 closed-session approval of a 400 MW gas peaker package.",
  });

  const groups = groupedByYear();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Energy Timeline"
        subtitle="From Austin's first move away from its old gas plants to the closed-session approval of a new one — eight years of decisions that set up May 21, 2026."
        contentClassName="max-w-4xl mx-auto px-4"
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          {(Object.keys(KIND_LABEL) as TimelineKind[]).map((kind) => (
            <span key={kind} className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", LEGEND_DOT[kind])} aria-hidden />
              {KIND_LABEL[kind]}
            </span>
          ))}
        </div>

        <div className="relative">
          <div
            className="absolute top-2 bottom-2 w-px bg-border left-[70px] sm:left-[104px]"
            aria-hidden
          />

          {groups.map((group) => (
            <section key={group.year} className="mb-2">
              <div className="mb-4 mt-8 flex items-center gap-4 first:mt-0">
                <span className="w-[54px] sm:w-[88px] shrink-0 text-right text-lg sm:text-2xl font-semibold text-muted-foreground">
                  {group.year}
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden />
              </div>

              {group.events.map((event) => (
                <article
                  key={event.date + event.title}
                  className="grid grid-cols-[54px_32px_1fr] sm:grid-cols-[88px_32px_1fr] gap-x-4 pb-6"
                >
                  <div className="pt-1 text-[11px] sm:text-xs font-mono text-muted-foreground text-left sm:text-right">
                    {event.date}
                  </div>
                  <div className="relative flex justify-center">
                    <span
                      className={cn(
                        "relative z-10 mt-1.5 h-3.5 w-3.5 rounded-full",
                        DOT_CLASS[event.kind],
                      )}
                      aria-hidden
                    />
                  </div>
                  <Card className={cn("overflow-hidden", CARD_CLASS[event.kind])}>
                    <CardContent className="p-4 sm:p-5">
                      {event.tag && (
                        <Badge variant="destructive" className="mb-2 text-[10px] uppercase tracking-wide">
                          {event.tag}
                        </Badge>
                      )}
                      <h3
                        className={cn(
                          "mb-1.5 font-semibold text-foreground",
                          event.kind === "vote" ? "text-lg" : "text-base",
                        )}
                      >
                        {event.title}
                      </h3>
                      <p className="mb-2 text-sm text-muted-foreground">{event.body}</p>
                      <p className="text-[11px] font-mono text-muted-foreground/80">{event.source}</p>
                    </CardContent>
                  </Card>
                </article>
              ))}
            </section>
          ))}
        </div>

        <footer className="mt-8 border-t pt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sources
          </h2>
          <ul className="space-y-1 text-xs text-muted-foreground/90">
            {TIMELINE_SOURCES.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground/80">
            Full detail, primary-source citations, and direct quotes for every event above: this
            project's Evidence Index.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default EnergyTimeline;
