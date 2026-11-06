import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIORITY_INFO, batteryEstimate, hasDistinctSiteName, siteDisplayName, type Site, type siteStats } from "./data";

const fmt = (v: number, d = 0) => v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });

interface Props {
  site: Site | null;
  ratio: number;
  hours: number;
  stats: ReturnType<typeof siteStats>;
  onClear: () => void;
}

/** Explains how battery screening estimates are derived — for one clicked site, or for all sites shown. */
export function BatteryLogicPanel({ site, ratio, hours, stats, onClear }: Props) {
  const caveat = (
    <p className="text-xs text-muted-foreground">
      These are rule-of-thumb screening estimates, not engineered designs or quotes. They don't use the building's interval load data, electrical service size, or feeder hosting capacity, and every site still needs an Austin Energy interconnection review.
    </p>
  );

  if (site) {
    const e = batteryEstimate(site.solarKw, ratio, hours);
    const needsSolar = site.priority >= 3;
    return (
      <section className="bg-card border rounded-md p-4 space-y-3 text-sm" aria-live="polite">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">How this site's battery estimate works</p>
            <h2 className="font-semibold text-base">{siteDisplayName(site)}</h2>
            <p className="text-xs text-muted-foreground">{hasDistinctSiteName(site) ? `${site.address} · ` : ""}{site.zip}{site.approx ? " · position estimated from ZIP center" : ""}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClear} aria-label="Show logic for all sites"><X className="h-4 w-4 mr-1" />All sites</Button>
        </div>
        <ol className="space-y-2 list-decimal pl-5">
          <li>
            <span className="font-medium">Solar size:</span> <span className="rfp-num">{fmt(site.solarKw, 1)} kW DC</span>{" "}
            {needsSolar ? "is the estimated rooftop solar potential (no solar installed yet)." : "is the solar already installed, from the permit or AISD record."}
          </li>
          <li>
            <span className="font-medium">Battery power:</span> <span className="rfp-num">{fmt(site.solarKw, 1)} kW × {ratio.toFixed(2)} = {fmt(e.kw, 1)} kW</span>. This is how fast the battery can charge or discharge.
          </li>
          <li>
            <span className="font-medium">Battery energy:</span> <span className="rfp-num">{fmt(e.kw, 1)} kW × {hours} hr = {fmt(e.kwh)} kWh</span>. This is how much it stores — enough to discharge at full power for {hours} hour{hours > 1 ? "s" : ""}, such as across the 4–8 PM summer peak.
          </li>
          <li>
            <span className="font-medium">Why it ranks here:</span> {PRIORITY_INFO[site.priority].label} — {PRIORITY_INFO[site.priority].desc} Its ZIP added an estimated <span className="rfp-num">{fmt(site.zipGwh, 1)} GWh</span> of new annual load in permits since 2020{site.zipRank ? ` (rank ${site.zipRank} of Austin ZIPs)` : ""}.
          </li>
        </ol>
        {caveat}
      </section>
    );
  }

  return (
    <section className="bg-card border rounded-md p-4 space-y-3 text-sm">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">How the battery estimates work</p>
        <h2 className="font-semibold text-base">All {fmt(stats.count)} sites shown</h2>
        <p className="text-xs text-muted-foreground">Click any dot or table row to see the math for one property.</p>
      </div>
      <ol className="space-y-2 list-decimal pl-5">
        <li><span className="font-medium">Start with solar:</span> each site's installed solar, or estimated rooftop potential for schools and commercial roofs. Total: <span className="rfp-num">{fmt(stats.solarMw, 1)} MW DC</span>.</li>
        <li><span className="font-medium">Battery power = solar kW × {ratio.toFixed(2)}</span>. Total: <span className="rfp-num">{fmt(stats.batteryMw, 1)} MW</span>. Sizing near half the solar lets a battery soak up surplus midday output.</li>
        <li><span className="font-medium">Battery energy = power × {hours} hr</span>. Total: <span className="rfp-num">{fmt(stats.batteryMwh, 1)} MWh</span>. Longer durations cover more of the 4–8 PM summer peak but cost more per site.</li>
        <li><span className="font-medium">Ranking:</span> priority 1–4 first (existing solar in top-growth ZIPs leads), then the ZIP's new permitted load since 2020, then solar size.</li>
      </ol>
      <p className="text-xs text-muted-foreground">Change the ratio and duration under "Battery sizing" in the filters to test other scenarios.</p>
      {caveat}
    </section>
  );
}
