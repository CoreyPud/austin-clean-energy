import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TIMELINE_EVENTS } from "@/lib/energy-timeline";

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
      }));
  }, []);

  const [activeYear, setActiveYear] = useState<number | null>(null);
  const active = years.find((y) => y.year === activeYear) ?? null;

  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground">Explore by year</h2>
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
                  className={`group flex flex-1 flex-col items-center justify-end gap-1 rounded-md px-0.5 py-2 transition-colors ${isActive ? "bg-muted" : "hover:bg-muted/60"}`}
                >
                  {Array.from({ length: size }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-2 rounded-full bg-primary transition-transform ${isActive ? "scale-125" : "opacity-60"}`}
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
                className={`flex-1 pt-1 text-center text-[10px] ${y.year === activeYear ? "font-semibold text-foreground" : "text-muted-foreground/70"}`}
              >
                {String(y.year).slice(2)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {active && (
        <Card className="mt-5 rounded-md shadow-none">
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
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {e.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.date}
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
