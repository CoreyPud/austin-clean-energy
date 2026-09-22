import PageHeader from "@/components/PageHeader";
import TimelineRail from "@/components/energy-timeline/TimelineRail";
import { Card, CardContent } from "@/components/ui/card";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";
import {
  TIMELINE_SOURCES,
  groupedByYear,
  type TimelineKind,
} from "@/lib/energy-timeline";

const DOT_CLASS: Record<TimelineKind, string> = {
  policy: "bg-background border-2 border-muted-foreground",
  contract: "bg-primary border-2 border-primary",
  vote: "bg-destructive border-2 border-destructive",
};

const EnergyTimeline = () => {
  useSeo({
    title: "Austin Energy Timeline",
    description:
      "Four decades of Austin Energy programs, resource plans, contracts, retirements, and public decisions.",
  });

  const groups = groupedByYear();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Energy Timeline"
        subtitle="Four decades of programs, resource plans, contracts, retirements, and public decisions."
      />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <TimelineRail />

        <div className="relative mt-12">
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
                  <div className="pt-1 text-[11px] sm:text-xs text-muted-foreground text-left sm:text-right">
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
                  <Card className="overflow-hidden">
                    <CardContent className="p-4 sm:p-5">
                      <h3 className="mb-1.5 text-base font-semibold text-foreground">
                        {event.title}
                      </h3>
                      <p className="mb-2 text-sm leading-relaxed text-muted-foreground">
                        {event.body}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {event.sourceUrl ? (
                          <a
                            href={event.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:text-foreground"
                          >
                            {event.source}
                          </a>
                        ) : (
                          event.source
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </article>
              ))}
            </section>
          ))}
        </div>

        <details className="mt-10 border-y border-border">
          <summary className="cursor-pointer py-4 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Sources
          </summary>
          <ul className="space-y-1 pb-5 text-xs text-muted-foreground">
            {TIMELINE_SOURCES.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
};

export default EnergyTimeline;
