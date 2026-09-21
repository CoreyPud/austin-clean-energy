import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DAILY, EFF, CONTRACTS, ILLUSTRATIVE_DAY_SHAPE, ERCOT_2025 } from "./arbitrage-window-data";
import "./arbitrage-window.css";

/* ------------------------------------------------------------------ */
/*  Contract configuration — kept identical to The Battery Ledger's    */
/*  numbers so the implied spread here matches that page exactly.      */
/* ------------------------------------------------------------------ */

const dischargeMWh = { bp: CONTRACTS.bp.mw * CONTRACTS.bp.hours, jp: CONTRACTS.jp.mw * CONTRACTS.jp.hours };
const chargeMWh = { bp: dischargeMWh.bp / EFF, jp: dischargeMWh.jp / EFF };
const combinedDischargeMWh = dischargeMWh.bp + dischargeMWh.jp;

type SpreadKey = "combined" | "bp" | "jp";
const SPREAD_LABEL: Record<SpreadKey, string> = { combined: "Combined", bp: "Base Power", jp: "Jupiter Power" };

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function fmtDate(dateStr: string) {
  const [y = 1970, m = 1, d = 1] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function fmtMonth(m: string) {
  const [y = 1970, mo = 1] = m.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, 1));
  return dt.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}
const usdMWh = (v: number) =>
  (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: Math.abs(v) < 100 ? 1 : 0 });
const usdMWhAxis = (v: number) => (v < 0 ? "-$" : "$") + Math.round(Math.abs(v)).toLocaleString("en-US");

function niceNum(range: number, round: boolean) {
  const exp = Math.floor(Math.log10(range || 1));
  const frac = range / Math.pow(10, exp);
  let nf: number;
  if (round) nf = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10;
  else nf = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return nf * Math.pow(10, exp);
}
function niceTicks(min: number, max: number, count: number) {
  if (min === max) { min -= 1; max += 1; }
  const step = niceNum((max - min) / Math.max(1, count - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

// Symmetric log transform — compresses the huge spike days (a $5,000+/MWh
// day sits next to hundreds of $20-$80 days) onto one readable axis, while
// still handling the rare near-zero/negative day gracefully. sign(v) *
// log10(1 + |v|).
function symlog(v: number) {
  return Math.sign(v) * Math.log10(1 + Math.abs(v));
}
function symTicks(maxV: number): number[] {
  const abs = Math.max(1, maxV);
  if (abs <= 100) return [0, 10, 25, 50, 100].filter((v) => v <= abs * 1.35);
  if (abs <= 500) return [0, 25, 50, 100, 250, 500].filter((v) => v <= abs * 1.3);
  if (abs <= 2000) return [0, 50, 100, 250, 500, 1000, 2000].filter((v) => v <= abs * 1.25);
  return [0, 100, 500, 1000, 2500, 5000, 10000].filter((v) => v <= abs * 1.2);
}

function median(sortedAsc: number[]) {
  const n = sortedAsc.length;
  const mid = Math.floor(n / 2);
  if (n === 0) return 0;
  const upper = sortedAsc[mid] ?? 0;
  const lower = sortedAsc[mid - 1] ?? upper;
  return n % 2 ? upper : (lower + upper) / 2;
}

/* ------------------------------------------------------------------ */
/*  Derived rows                                                       */
/* ------------------------------------------------------------------ */

type Row = { date: string; bp: number; jp: number; combined: number };

function buildRows(): Row[] {
  return DAILY.map(([date, bpRev, jpRev]) => ({
    date,
    bp: bpRev / dischargeMWh.bp,
    jp: jpRev / dischargeMWh.jp,
    combined: (bpRev + jpRev) / combinedDischargeMWh,
  }));
}

function monthlyAgg(rows: Row[], key: SpreadKey) {
  const map = new Map<string, { sum: number; n: number }>();
  rows.forEach((r) => {
    const m = r.date.slice(0, 7);
    const cur = map.get(m) || { sum: 0, n: 0 };
    cur.sum += r[key];
    cur.n += 1;
    map.set(m, cur);
  });
  return Array.from(map, ([m, { sum, n }]) => ({ m, value: sum / n }));
}
function yearlyAgg(rows: Row[], key: SpreadKey) {
  const map = new Map<string, { sum: number; n: number }>();
  rows.forEach((r) => {
    const y = r.date.slice(0, 4);
    const cur = map.get(y) || { sum: 0, n: 0 };
    cur.sum += r[key];
    cur.n += 1;
    map.set(y, cur);
  });
  return Array.from(map, ([y, { sum, n }]) => ({ y, value: sum / n, n }));
}

/* ------------------------------------------------------------------ */
/*  Chart: illustrative hour-of-day shape                              */
/* ------------------------------------------------------------------ */

function IntradayShapeChart({ shape }: { shape: { hour: number; index: number }[] }) {
  const W = 900, H = 260, padL = 40, padR = 16, padT = 16, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = shape.length;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const y = (v: number) => padT + plotH - (v / 100) * plotH;
  const y0 = y(0);

  const linePath = "M " + shape.map((d, i) => `${x(i)} ${y(d.index)}`).join(" L ");
  const areaPath = `${linePath} L ${x(n - 1)} ${y0} L ${x(0)} ${y0} Z`;

  const troughI = shape.reduce((best, d, i) => (d.index < (shape[best]?.index ?? Infinity) ? i : best), 0);
  const peakI = shape.reduce((best, d, i) => (d.index > (shape[best]?.index ?? -Infinity) ? i : best), 0);
  const trough = shape[troughI];
  const peak = shape[peakI];

  const [hover, setHover] = useState<number | null>(null);
  const hovered = hover === null ? undefined : shape[hover];
  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    let i = Math.round(((mx - padL) / plotW) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    setHover(i);
  }
  const fmtHour = (h: number) => (h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`);

  return (
    <div className="aw-chart-box">
      <span className="aw-illustrative-tag">Illustrative shape — not measured $/MWh</span>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Illustrative hour-of-day price pattern, 0 to 100 index">
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line className="aw-gridline" x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} />
            <text className="aw-axis-label" x={padL - 8} y={y(v) + 3} textAnchor="end">{v}</text>
          </g>
        ))}
        {[0, 6, 12, 18, 23].map((h) => (
          <text key={h} className="aw-axis-label" x={x(h)} y={H - 8} textAnchor="middle">{fmtHour(h)}</text>
        ))}
        <rect className="aw-solar-band" x={x(9)} y={padT} width={x(15) - x(9)} height={plotH} />
        <rect className="aw-peak-band" x={x(18)} y={padT} width={x(21) - x(18)} height={plotH} />

        <path d={areaPath} className="aw-illustrative-area" />
        <path d={linePath} className="aw-illustrative-line" />

        {trough && <circle className="aw-end-dot" r={3.5} cx={x(troughI)} cy={y(trough.index)} />}
        {trough && <text className="aw-direct-label" x={x(troughI)} y={y(trough.index) - 12} textAnchor="middle">cheapest, midday solar</text>}
        {peak && <circle className="aw-end-dot" r={3.5} cx={x(peakI)} cy={y(peak.index)} />}
        {peak && <text className="aw-direct-label" x={x(peakI)} y={y(peak.index) - 12} textAnchor="middle">priciest, evening ramp</text>}

        {hover !== null && <line className="aw-hover-line" x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} />}
        <rect x={padL} y={padT} width={plotW} height={plotH} fill="transparent" style={{ cursor: "crosshair" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hover !== null && hovered && (
        <div className="aw-tooltip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(hovered.index) / H) * 100}%` }}>
          <div className="aw-t1">index {hovered.index}</div>
          <div>{fmtHour(hovered.hour)}</div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chart: spread over time — day / month / year                       */
/* ------------------------------------------------------------------ */

function DaySpreadChart({ rows, spreadKey }: { rows: Row[]; spreadKey: SpreadKey }) {
  const W = 900, H = 340, padL = 58, padR = 16, padT = 20, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = rows.length;
  const vals = rows.map((r) => r[spreadKey]);
  const sym = vals.map(symlog);
  const maxS = Math.max(...sym), minS = Math.min(...sym, 0);
  const pad = (maxS - minS) * 0.08 || 0.3;
  const top = maxS + pad, bot = minS - pad;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const y = (s: number) => padT + plotH - ((s - bot) / (top - bot)) * plotH;
  const y0 = y(0);

  const linePath = "M " + sym.map((s, i) => `${x(i)} ${y(s)}`).join(" L ");

  const yearStarts: { i: number; yr: string }[] = [];
  {
    let last = "";
    rows.forEach((r, i) => {
      const yr = r.date.slice(0, 4);
      if (yr !== last) { yearStarts.push({ i, yr }); last = yr; }
    });
  }
  const maxV = Math.max(...vals);
  const ticks = symTicks(maxV).filter((v) => symlog(v) >= bot && symlog(v) <= top);

  const [hover, setHover] = useState<number | null>(null);
  const hoveredRow = hover === null ? undefined : rows[hover];
  const hoveredValue = hover === null ? undefined : vals[hover];
  const hoveredSym = hover === null ? undefined : sym[hover];
  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    let i = Math.round(((mx - padL) / plotW) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    setHover(i);
  }

  return (
    <div className="aw-chart-box">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Daily implied arbitrage spread, ${SPREAD_LABEL[spreadKey]}, 2023 to 2026`}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="aw-gridline" x1={padL} x2={W - padR} y1={y(symlog(v))} y2={y(symlog(v))} />
            <text className="aw-axis-label" x={padL - 8} y={y(symlog(v)) + 3} textAnchor="end">{usdMWhAxis(v)}</text>
          </g>
        ))}
        {yearStarts.map(({ i, yr }) => (
          <text key={yr} className="aw-axis-label" x={x(i)} y={H - 10} textAnchor="start">{yr}</text>
        ))}
        <line className="aw-baseline" x1={padL} x2={W - padR} y1={y0} y2={y0} />
        <path className="aw-data-line" d={linePath} />

        {hover !== null && <line className="aw-hover-line" x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} />}
        <rect x={padL} y={padT} width={plotW} height={plotH} fill="transparent" style={{ cursor: "crosshair" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hover !== null && hoveredRow && hoveredValue !== undefined && hoveredSym !== undefined && (
        <div className="aw-tooltip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(hoveredSym) / H) * 100}%` }}>
          <div className="aw-t1">{usdMWh(hoveredValue)}/MWh</div>
          <div>{fmtDate(hoveredRow.date)}</div>
        </div>
      )}
    </div>
  );
}

function MonthSpreadChart({ monthly }: { monthly: { m: string; value: number }[] }) {
  const W = 900, H = 300, padL = 58, padR = 16, padT = 16, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = monthly.length;
  const vals = monthly.map((d) => d.value);
  const sym = vals.map(symlog);
  const maxS = Math.max(...sym), minS = Math.min(...sym, 0);
  const pad = (maxS - minS) * 0.08 || 0.3;
  const top = maxS + pad, bot = minS - pad;
  const slot = plotW / n;
  const barW = Math.max(4, Math.min(16, slot - 3));
  const x = (i: number) => padL + i * slot + (slot - barW) / 2;
  const y = (s: number) => padT + plotH - ((s - bot) / (top - bot)) * plotH;
  const y0 = y(0);
  const maxV = Math.max(...vals);
  const ticks = symTicks(maxV).filter((v) => symlog(v) >= bot && symlog(v) <= top);
  const [hover, setHover] = useState<number | null>(null);
  const hoveredMonth = hover === null ? undefined : monthly[hover];

  return (
    <div className="aw-chart-box">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Monthly average implied arbitrage spread, 2023 to 2026">
        {ticks.map((v) => (
          <g key={v}>
            <line className="aw-gridline" x1={padL} x2={W - padR} y1={y(symlog(v))} y2={y(symlog(v))} />
            <text className="aw-axis-label" x={padL - 8} y={y(symlog(v)) + 3} textAnchor="end">{usdMWhAxis(v)}</text>
          </g>
        ))}
        {monthly.map((d, i) => d.m.endsWith("-01") && (
          <text key={"yl" + i} className="aw-axis-label" x={x(i) + barW / 2} y={H - 8} textAnchor="middle">{d.m.slice(0, 4)}</text>
        ))}
        {monthly.map((d, i) => {
          const top2 = Math.min(y(symlog(d.value)), y0), h = Math.abs(y(symlog(d.value)) - y0);
          return (
            <rect
              key={d.m} className="aw-bar-fill" x={x(i)} y={top2} width={barW} height={Math.max(1, h)} rx={1.5} ry={1.5}
              onMouseMove={() => setHover(i)} onMouseLeave={() => setHover(null)}
            />
          );
        })}
        <line className="aw-baseline" x1={padL} x2={W - padR} y1={y0} y2={y0} />
      </svg>
      {hover !== null && hoveredMonth && (
        <div className="aw-tooltip" style={{ left: `${((x(hover) + barW / 2) / W) * 100}%`, top: `${(Math.min(y(symlog(hoveredMonth.value)), y0) / H) * 100}%` }}>
          <div className="aw-t1">{usdMWh(hoveredMonth.value)}/MWh avg</div>
          <div>{fmtMonth(hoveredMonth.m)}</div>
        </div>
      )}
    </div>
  );
}

function YearSpreadChart({ yearly }: { yearly: { y: string; value: number; n: number }[] }) {
  const W = 900, H = 280, padL = 58, padR = 16, padT = 28, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = yearly.length;
  const maxV = Math.max(...yearly.map((d) => d.value));
  const ticks = niceTicks(0, maxV, 4).filter((v) => v >= 0 && v <= maxV * 1.05);
  const slot = plotW / n;
  const barW = Math.min(120, slot * 0.5);
  const x = (i: number) => padL + i * slot + (slot - barW) / 2;
  const y = (v: number) => padT + plotH - (v / (ticks[ticks.length - 1] || maxV)) * plotH;
  const y0 = y(0);
  const yMax = ticks[ticks.length - 1] || maxV;

  return (
    <div className="aw-chart-box">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Yearly average implied arbitrage spread, 2023 to 2026">
        {ticks.map((v) => (
          <g key={v}>
            <line className="aw-gridline" x1={padL} x2={W - padR} y1={padT + plotH - (v / yMax) * plotH} y2={padT + plotH - (v / yMax) * plotH} />
            <text className="aw-axis-label" x={padL - 8} y={padT + plotH - (v / yMax) * plotH + 3} textAnchor="end">{usdMWhAxis(v)}</text>
          </g>
        ))}
        {yearly.map((d, i) => (
          <text key={"yl" + d.y} className="aw-axis-label" x={x(i) + barW / 2} y={H - 8} textAnchor="middle">{d.y}{i === n - 1 ? " (YTD)" : ""}</text>
        ))}
        {yearly.map((d, i) => (
          <rect key={d.y} className="aw-bar-fill" x={x(i)} y={y(d.value)} width={barW} height={Math.max(1, y0 - y(d.value))} rx={2} ry={2} />
        ))}
        {yearly.map((d, i) => (
          <text key={"vl" + d.y} className="aw-direct-label" x={x(i) + barW / 2} y={y(d.value) - 10} textAnchor="middle">{usdMWh(d.value)}</text>
        ))}
        <line className="aw-baseline" x1={padL} x2={W - padR} y1={y0} y2={y0} />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chart: duration curve — how often is it worth it                   */
/* ------------------------------------------------------------------ */

function DurationCurveChart({ vals }: { vals: number[] }) {
  const sorted = [...vals].sort((a, b) => b - a);
  const n = sorted.length;
  const W = 900, H = 320, padL = 58, padR = 16, padT = 20, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const sym = sorted.map(symlog);
  const maxS = Math.max(...sym), minS = Math.min(...sym, 0);
  const pad = (maxS - minS) * 0.08 || 0.3;
  const top = maxS + pad, bot = minS - pad;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const y = (s: number) => padT + plotH - ((s - bot) / (top - bot)) * plotH;
  const y0 = y(0);

  const linePath = "M " + sym.map((s, i) => `${x(i)} ${y(s)}`).join(" L ");
  const areaPath = `${linePath} L ${x(n - 1)} ${y0} L ${x(0)} ${y0} Z`;

  const thresholds = [20, 50, 100, 200];
  const refLines = thresholds
    .map((t) => {
      const count = sorted.filter((v) => v >= t).length;
      return { t, pct: (count / n) * 100, ypx: y(symlog(t)) };
    })
    .filter((d) => symlog(d.t) >= bot && symlog(d.t) <= top);

  const maxV = sorted[0] ?? 0;
  const ticks = symTicks(maxV).filter((v) => symlog(v) >= bot && symlog(v) <= top);

  const [hover, setHover] = useState<number | null>(null);
  const hoveredValue = hover === null ? undefined : sorted[hover];
  const hoveredSym = hover === null ? undefined : sym[hover];
  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    let i = Math.round(((mx - padL) / plotW) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    setHover(i);
  }

  return (
    <div className="aw-chart-box">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily implied spread, sorted highest to lowest">
        {ticks.map((v) => (
          <g key={v}>
            <line className="aw-gridline" x1={padL} x2={W - padR} y1={y(symlog(v))} y2={y(symlog(v))} />
            <text className="aw-axis-label" x={padL - 8} y={y(symlog(v)) + 3} textAnchor="end">{usdMWhAxis(v)}</text>
          </g>
        ))}
        <text className="aw-axis-label" x={padL} y={H - 8} textAnchor="start">best day</text>
        <text className="aw-axis-label" x={W - padR} y={H - 8} textAnchor="end">worst day</text>

        <path d={areaPath} className="aw-curve-area" />
        {refLines.map((d) => (
          <g key={d.t}>
            <line className="aw-ref-line" x1={padL} x2={W - padR} y1={d.ypx} y2={d.ypx} />
            <text className="aw-ref-label" x={W - padR} y={d.ypx - 4} textAnchor="end">{Math.round(d.pct)}% of days ≥ {usdMWhAxis(d.t)}</text>
          </g>
        ))}
        <path className="aw-data-line" d={linePath} />

        {hover !== null && <line className="aw-hover-line" x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} />}
        <rect x={padL} y={padT} width={plotW} height={plotH} fill="transparent" style={{ cursor: "crosshair" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hover !== null && hoveredValue !== undefined && hoveredSym !== undefined && (
        <div className="aw-tooltip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(hoveredSym) / H) * 100}%` }}>
          <div className="aw-t1">{usdMWh(hoveredValue)}/MWh</div>
          <div>rank {hover + 1} of {n} ({(((hover + 1) / n) * 100).toFixed(0)}th percentile)</div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

type SpreadView = "day" | "month" | "year";

export default function ArbitrageWindow({ className = "" }: { className?: string }) {
  const rows = useMemo(buildRows, []);

  const [spreadKey, setSpreadKey] = useState<SpreadKey>("combined");
  const [view, setView] = useState<SpreadView>("day");

  const monthly = useMemo(() => monthlyAgg(rows, spreadKey), [rows, spreadKey]);
  const yearly = useMemo(() => yearlyAgg(rows, spreadKey), [rows, spreadKey]);
  const curveVals = useMemo(() => rows.map((r) => r[spreadKey]), [rows, spreadKey]);

  const tileStats = useMemo(() => {
    const jpVals = rows.map((r) => r.jp);
    const jpSorted = [...jpVals].sort((a, b) => a - b);
    const med = median(jpSorted);
    const pctAbove20 = (jpVals.filter((v) => v >= 20).length / jpVals.length) * 100;
    let maxI = 0;
    jpVals.forEach((v, i) => { if (v > (jpVals[maxI] ?? -Infinity)) maxI = i; });
    const yearlyJp = yearlyAgg(rows, "jp");
    const firstYear = yearlyJp[0] ?? { y: "—", value: 0, n: 0 };
    const lastYear = yearlyJp[yearlyJp.length - 1] ?? firstYear;
    return {
      median: med,
      pctAbove20,
      maxVal: jpVals[maxI] ?? 0,
      maxDate: rows[maxI]?.date ?? "1970-01-01",
      firstYear,
      lastYear,
    };
  }, [rows]);

  const tiles = [
    { label: "Median daily spread", value: `${usdMWh(tileStats.median)}/MWh`, sub: `Jupiter Power, all ${rows.length.toLocaleString("en-US")} modeled days` },
    { label: "Days worth arbitraging", value: `${Math.round(tileStats.pctAbove20)}%`, sub: "days with spread ≥ $20/MWh" },
    { label: `${tileStats.firstYear.y} → ${tileStats.lastYear.y} yearly avg`, value: `${usdMWh(tileStats.firstYear.value)} → ${usdMWh(tileStats.lastYear.value)}`, sub: "spread has compressed as more storage came online statewide" },
    { label: "Peak single day", value: `${usdMWh(tileStats.maxVal)}/MWh`, sub: fmtDate(tileStats.maxDate) },
    { label: "Days modeled", value: rows.length.toLocaleString("en-US"), sub: "Jan 2023 – May 2026, same dataset as The Battery Ledger" },
  ];

  const zoneMax = Math.max(...ERCOT_2025.zoneAvgPrice.map((z) => z.usdPerMWh));

  return (
    <div className={`arbitrage-window ${className}`}>
      <div className="aw-page">
        <header className="aw-masthead">
          <div className="aw-kicker">Secret Vote &middot; The Arbitrage Window</div>
          <h1>kWh Cost</h1>
          <p className="aw-dek">
            Batteries don&rsquo;t make electricity &mdash; they move it in time. Charge when Austin&rsquo;s grid price is cheap,
            discharge when it&rsquo;s expensive, and pocket the difference. This page asks a simple question: on a typical day,
            how big is that difference, and how often is it worth catching?
          </p>
        </header>

        <div className="aw-status-bar">
          <span className="aw-status-dot" />
          <div className="aw-status-text">
            <strong>NO RAW HOURLY PRICE FEED</strong> &mdash; the underlying LZ_AEN dataset behind this project has real daily
            revenue figures, not a literal hour-by-hour price series. The charts below use two kinds of data: a real,
            LZ_AEN-derived <b style={{ color: "var(--aw-ink)" }}>implied daily spread</b> (revenue &divide; MWh discharged, the
            same numbers behind The Battery Ledger) for the &ldquo;how big&rdquo; and &ldquo;how often&rdquo; questions, and an
            explicitly-labeled <b style={{ color: "var(--aw-ink)" }}>illustrative</b> shape for the &ldquo;what does a day look
            like&rdquo; question. See Methodology below before reading too much into any single number.
          </div>
        </div>

        <section className="aw-tiles-section">
          <div className="aw-tiles">
            {tiles.map((t) => (
              <div className="aw-tile" key={t.label}>
                <div className="aw-t-label">{t.label}</div>
                <div className="aw-t-value">{t.value}</div>
                <div className="aw-t-sub">{t.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="aw-chart-section">
          <div className="aw-section-head"><span className="aw-section-num">01</span><h2>What a day looks like</h2></div>
          <p className="aw-section-intro">
            Solar pushes midday prices down; demand stays high after sunset. The gap between the cheap trough and the evening
            peak is the window a battery arbitrages. This shape is illustrative &mdash; a relative index, not measured
            dollars &mdash; tracing the pattern ERCOT&rsquo;s own market monitor describes for the real-time market.
          </p>
          <IntradayShapeChart shape={ILLUSTRATIVE_DAY_SHAPE} />
        </section>

        <section className="aw-chart-section">
          <div className="aw-section-head"><span className="aw-section-num">02</span><h2>The spread over time</h2></div>
          <p className="aw-section-intro">
            Real numbers: each day&rsquo;s simulated arbitrage revenue divided by the MWh discharged &mdash; an honest
            approximation of the average $/MWh price spread a perfectly-timed battery captured that day. Y-axis is
            log-scaled; a handful of extreme spike days (Winter Storm Uri&rsquo;s successors, summer 2023&rsquo;s heat) would
            otherwise flatten every ordinary day to a hairline.
          </p>
          <div className="aw-controls">
            <div className="aw-seg">
              {(["combined", "bp", "jp"] as SpreadKey[]).map((k) => (
                <Button key={k} type="button" variant="ghost" aria-pressed={spreadKey === k} className={spreadKey === k ? "aw-active" : ""} onClick={() => setSpreadKey(k)}>{SPREAD_LABEL[k]}</Button>
              ))}
            </div>
            <div className="aw-seg">
              {(["day", "month", "year"] as SpreadView[]).map((v) => (
                <Button key={v} type="button" variant="ghost" aria-pressed={view === v} className={view === v ? "aw-active" : ""} onClick={() => setView(v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</Button>
              ))}
            </div>
          </div>
          {view === "day" && <DaySpreadChart rows={rows} spreadKey={spreadKey} />}
          {view === "month" && <MonthSpreadChart monthly={monthly} />}
          {view === "year" && <YearSpreadChart yearly={yearly} />}
        </section>

        <section className="aw-chart-section">
          <div className="aw-section-head"><span className="aw-section-num">03</span><h2>How often is it worth it</h2></div>
          <p className="aw-section-intro">
            Every modeled day, sorted from the biggest spread to the smallest &mdash; a duration curve. The dashed lines mark
            what share of days cleared a few reference spreads. It doesn&rsquo;t take a Winter Storm Uri for arbitrage to pay;
            it takes an ordinary handful of hours where solar drops out and demand hasn&rsquo;t.
          </p>
          <DurationCurveChart vals={curveVals} />
        </section>

        <section className="aw-chart-section">
          <div className="aw-section-head"><span className="aw-section-num">04</span><h2>ERCOT-wide context, 2025</h2></div>
          <p className="aw-section-intro">
            Real, published market-wide figures &mdash; but <b>not</b> AE/LZ_AEN-specific. Austin Energy&rsquo;s own zone tracks
            close to these system numbers most hours, diverging mainly during local congestion.
          </p>
          <div className="aw-context-grid">
            <div className="aw-context-card">
              <div className="aw-context-card-title">Average price by ERCOT zone, 2025</div>
              <div className="aw-zonebars">
                {ERCOT_2025.zoneAvgPrice.map((z) => (
                  <div className="aw-zonebar-row" key={z.zone}>
                    <span className="aw-zonebar-label">{z.zone}</span>
                    <div className="aw-zonebar-track">
                      <div className="aw-zonebar-fill" style={{ width: `${(z.usdPerMWh / zoneMax) * 100}%` }} />
                    </div>
                    <span className="aw-zonebar-value">{usdMWh(z.usdPerMWh)}</span>
                  </div>
                ))}
              </div>
              <div className="aw-context-note">System average: {usdMWh(ERCOT_2025.systemAvgPrice)}/MWh</div>
            </div>
            <div className="aw-context-card">
              <div className="aw-context-card-title">When price spikes happen</div>
              <div className="aw-stat-rows">
                {ERCOT_2025.spikeShareByPeriod.map((p) => (
                  <div className="aw-stat-row" key={p.period}>
                    <span>{p.period}</span>
                    <span className="aw-stat-row-value">{p.pct}%</span>
                  </div>
                ))}
              </div>
              <div className="aw-context-note">Share of 2025 price-spike hours falling in each window.</div>
            </div>
            <div className="aw-context-card aw-context-card-mini">
              <div className="aw-context-card-title">Capacity offered at $0/MWh or below</div>
              <div className="aw-mini-stat">{ERCOT_2025.pctCapacityOfferedAtOrBelowZero}%</div>
              <div className="aw-context-note">vs. {ERCOT_2025.pctCapacityOfferedAtOrBelowZeroPrior}% in 2024 &mdash; more negative-price hours to charge into.</div>
            </div>
            <div className="aw-context-card aw-context-card-mini">
              <div className="aw-context-card-title">Price-spike count, year over year</div>
              <div className="aw-mini-stat">{ERCOT_2025.spikeCountChangeYoY}%</div>
              <div className="aw-context-note">2025 vs. 2024 &mdash; fewer, not more, extreme-price events statewide.</div>
            </div>
          </div>
        </section>

        <section className="aw-method-section">
          <div className="aw-section-head"><span className="aw-section-num">05</span><h2>Methodology &amp; caveats</h2></div>
          <div className="aw-method-list">
            <div className="aw-method-item">
              <span className="aw-method-mark">01</span>
              <div className="aw-method-body"><b>&ldquo;Spread over time&rdquo; and the duration curve are real, derived numbers.</b> Each is a day&rsquo;s simulated arbitrage revenue (from the same perfect-hindsight model as The Battery Ledger: charge in that day&rsquo;s actual cheapest hours, discharge in its priciest) divided by MWh discharged. That&rsquo;s an honest approximation of the average spread captured, not a literal hourly price series &mdash; a day with two enormous spike hours and one with many moderate ones can land on the same implied spread.</div>
            </div>
            <div className="aw-method-item">
              <span className="aw-method-mark">02</span>
              <div className="aw-method-body"><b>The hour-of-day shape is illustrative, not measured.</b> No raw hourly LZ_AEN price series is available in this project or downloadable from its source (chrisgillett.org/ae-congestion, which exposes interactive charts but no data export). The shape shown traces the qualitative pattern ERCOT&rsquo;s independent market monitor describes for real-time prices &mdash; a 0&ndash;100 relative index, deliberately not styled as dollars.</div>
            </div>
            <div className="aw-method-item">
              <span className="aw-method-mark">03</span>
              <div className="aw-method-body"><b>The ERCOT-wide context (section 04) is real but differently scoped.</b> It covers the whole ERCOT market in 2025, not Austin Energy&rsquo;s LZ_AEN zone specifically. Treat it as background on why the arbitrage window exists market-wide, not as AE&rsquo;s own numbers.</div>
            </div>
            <div className="aw-method-item">
              <span className="aw-method-mark">04</span>
              <div className="aw-method-body"><b>Log-scaled axes.</b> Daily and monthly spread charts use a symmetric-log scale so ordinary days stay readable next to rare four- and five-figure spike days. Read the gridline dollar labels, not the visual gap between points, when comparing magnitudes.</div>
            </div>
            <div className="aw-method-item">
              <span className="aw-method-mark">05</span>
              <div className="aw-method-body"><b>Same dataset, same caveats as The Battery Ledger.</b> Perfect-hindsight dispatch, 85% round-trip efficiency, energy arbitrage only (no ancillary services, capacity payments, or resilience value), and Jupiter Power&rsquo;s 2-hour duration is an estimate, not a disclosed figure. See that page for the full methodology on the underlying revenue model.</div>
            </div>
          </div>
        </section>

        <footer className="aw-sources">
          <div className="aw-src-title">Sources</div>
          <ul>
            <li>LZ_AEN settlement prices via chrisgillett.org/ae-congestion, ERCOT-disclosed, pulled Sept 2026 (implied spread, sections 02&ndash;03)</li>
            <li>Potomac Economics, &ldquo;2025 State of the Market Report for the ERCOT Wholesale Electricity Markets&rdquo; (June 2026), Figure 3 (hour-of-day shape, section 01) and market-wide statistics (section 04)</li>
            <li>Battery specs and daily-cycle assumptions: The Battery Ledger, this project</li>
          </ul>
        </footer>
      </div>
    </div>
  );
}
