import PageHeader from "@/components/PageHeader";
import TimelineRail from "@/components/energy-timeline/TimelineRail";
import { useSeo } from "@/hooks/use-seo";
import {
  TIMELINE_SOURCES,
  groupedByYear,
} from "@/lib/energy-timeline";

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

        <details className="mt-12 border-y border-border">
          <summary className="cursor-pointer py-4 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            View the full timeline
          </summary>
          <div className="pb-8">
            {groups.map((group) => (
              <section key={group.year} className="grid gap-4 border-t border-border py-8 sm:grid-cols-[120px_1fr]">
                <h2 className="text-xl font-semibold text-foreground">{group.year}</h2>
                <div className="space-y-7">
                  {group.events.map((event) => (
                    <article key={event.date + event.title} className="max-w-3xl">
                      <p className="mb-1 text-xs font-semibold text-primary">{event.date}</p>
                      <h3 className="text-base font-semibold text-foreground">{event.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{event.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {event.sourceUrl ? (
                          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                            {event.source}
                          </a>
                        ) : event.source}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </details>

        <details className="mt-6 border-y border-border">
          <summary className="cursor-pointer py-4 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Sources</summary>
          <ul className="space-y-1 pb-5 text-xs text-muted-foreground">
            {TIMELINE_SOURCES.map((source) => <li key={source}>{source}</li>)}
          </ul>
        </details>
      </div>
    </div>
  );
};

export default EnergyTimeline;
