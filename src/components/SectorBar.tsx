import { SECTOR_ORDER, SECTOR_COLOR, SECTOR_LABEL, fmtUSD } from "@/lib/council-members";

// Horizontal 100%-stacked bar showing what share of a member's donations came
// from each sector. `showLegend` adds a labeled key with dollar amounts.
export default function SectorBar({
  breakdown,
  height = 10,
  showLegend = false,
}: {
  breakdown: Record<string, number>;
  height?: number;
  showLegend?: boolean;
}) {
  const total = Object.values(breakdown).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total <= 0) return null;

  const segments = SECTOR_ORDER
    .filter(s => (breakdown[s] ?? 0) > 0)
    .map(s => ({ sector: s, amount: breakdown[s], pct: (breakdown[s] / total) * 100 }));

  return (
    <div className="space-y-2">
      <div className="flex w-full overflow-hidden rounded-full" style={{ height }}>
        {segments.map(seg => (
          <div
            key={seg.sector}
            style={{ width: `${seg.pct}%`, backgroundColor: SECTOR_COLOR[seg.sector] ?? "#e5e7eb" }}
            title={`${SECTOR_LABEL[seg.sector] ?? seg.sector}: ${fmtUSD(seg.amount)} (${Math.round(seg.pct)}%)`}
          />
        ))}
      </div>
      {showLegend && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {segments.map(seg => (
            <li key={seg.sector} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: SECTOR_COLOR[seg.sector] ?? "#e5e7eb" }} />
              <span className="text-muted-foreground truncate">{SECTOR_LABEL[seg.sector] ?? seg.sector}</span>
              <span className="ml-auto tabular-nums text-foreground/80">{Math.round(seg.pct)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
