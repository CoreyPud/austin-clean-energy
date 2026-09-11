import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { KIND_LABEL, TIMELINE_EVENTS, type TimelineKind } from "@/lib/energy-timeline";

const DOT: Record<TimelineKind, string> = {
  policy: "bg-muted-foreground",
  contract: "bg-primary",
  vote: "bg-destructive",
};

const PRIORITY: TimelineKind[] = ["vote", "contract", "policy"];

const extractYear = (date: string) => {
  const m = date.match(/(\d{4})/);
  return m ? Number(m[1]) : null;
};

const TimelineRail = () => {
  const years = useMemo(() => {
    const map = new Map<number, typeof TIMELINE_EVENTS>();
    for (const e of TIMELINE_EVENTS) {
      const y = extractYear(e.date);
      if (!y) continue;
      const list = map.get(y) ?? [];
      list.push(e);
      map.set(y, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, events]) => ({
        year,
        events,
        kind: PRIORITY.find((k) => events.some((e) => e.kind === k)) ?? "policy",
      }));
  }, []);

  const [activeYear, setActiveYear] = useState<number | null>(
    years.length ? years[years.length - 1].year : null,
  );
  const active = years.find((y) => y.year === activeYear) ?? null;

  return (
    <section className="mt-14 border-t pt-10">
      <h2 className="text-xl font-semibold text-foreground">Timeline at a glance</h2>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Hover or tap a year to see what happened. Bigger marks mean more decisions that year.
      </p>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[640px]">
          <div className="relative flex items-end gap-1">
            {years.map((y) => {
              const isActive = y.year === activeYear;
              const size = Math.min(y.events.length, 5);
              return (
                <button
                  key={y.year}
                  type="button"
                  onMouseEnter={() => setActiveYear(y.year)}
                  onFocus={() => setActiveYear(y.year)}
                  onClick={() => setActiveYear(y.year)}
                  aria-label={`${y.year}: ${y.events.length} event${y.events.length > 1 ? "s" : ""}`}
                  className={cn(
                    "group flex flex-1 flex-col items-center justify-end gap-1 rounded-md px-0.5 py-2 transition-colors",
                    isActive ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  {Array.from({ length: size }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-2 w-2 rounded-full transition-transform",
                        DOT[y.events[Math.min(i, y.events.length - 1)].kind],
                        isActive ? "scale-125" : "opacity-70",
                      )}
                      aria-hidden
                    />
                  ))}
                </button>
              );
            })}
          </div>

          <div className="mt-1 h-px w-full bg-border" aria-hidden />

          <div className="flex gap-1">
            {years.map((y) => (
              <span
                key={y.year}
                className={cn(
                  "flex-1 pt-1 text-center text-[10px] font-mono",
                  y.year === activeYear
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground/70",
                )}
              >
                {String(y.year).slice(2)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {active && (
        <Card className="mt-5">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-2xl font-semibold text-foreground">{active.year}</span>
              <span className="text-xs text-muted-foreground">
                {active.events.length} {active.events.length === 1 ? "event" : "events"}
              </span>
            </div>
            <ul className="space-y-3">
              {active.events.map((e) => (
                <li key={e.date + e.title} className="flex gap-3">
                  <span
                    className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", DOT[e.kind])}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {e.title}
                      {e.tag && (
                        <Badge variant="destructive" className="ml-2 text-[10px] uppercase">
                          {e.tag}
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.date} · {KIND_LABEL[e.kind]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  );
};

export default TimelineRail;
