// SeeThePeak.tsx: shows a building's daily electric demand with and without a battery.
// Needs: src/lib/loadCurves.ts, src/styles/seeThePeak.css, public/data/load_curves.json
// No extra packages: charts are plain SVG.
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as RMouseEvent, ReactElement, TouchEvent as RTouchEvent } from "react";
import "./seeThePeak.css";
import {
  BuildingData, Controller, DataFile, DEFAULT_LOSS_PCT, DEFAULT_RATE, DEFAULT_TRANS_RATE, Design, MONTHS, POINTS, SizePct, View,
  compute, computeDesign2, download, kw, loadData, money, prettyDay, series, seriesDesign2, timeLabel, toCsv,
} from "./loadCurves";

const GREY = "#7D8F97";
const GREEN = "#2E7D6B";
const AMBER = "#F2A541";
const BLUE = "#8CC3E6";
const TEAL = "#123A4A";

const W = 900, H = 420, ML = 58, MR = 92, MT = 18, MB = 42;
const PW = W - ML - MR, PH = H - MT - MB;
const xAt = (i: number) => ML + (i / (POINTS - 1)) * PW;

function niceMax(v: number) {
  const steps = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];
  const target = v * 1.08;
  const step = steps.find((s) => target / s <= 5) ?? 5000;
  return Math.ceil(target / step) * step;
}

type Tab = "peak_day" | "summer_weekday" | "monthly";

/* ---------------------------- Day chart ---------------------------- */
function DayChart({ without, withBattery, showUtility, label }: { without: number[]; withBattery: number[]; showUtility: boolean; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const yMax = niceMax(Math.max(...without));
  const yAt = (v: number) => MT + PH - (v / yMax) * PH;
  const tickStep = yMax / 5;
  const ticks = Array.from({ length: 6 }, (_, i) => i * tickStep);
  const pathLine = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");
  const area = `${pathLine(without)} L${xAt(POINTS - 1)},${yAt(0)} L${xAt(0)},${yAt(0)} Z`;
  const peakWithout = Math.max(...without);
  const peakWith = Math.max(...withBattery);

  const bands: ReactElement[] = [];
  for (let i = 0; i < POINTS - 1; i++) {
    const d0 = without[i] - withBattery[i];
    const d1 = without[i + 1] - withBattery[i + 1];
    if (Math.abs(d0) < 0.05 && Math.abs(d1) < 0.05) continue;
    const dis = d0 + d1 > 0;
    const pts = `${xAt(i)},${yAt(without[i])} ${xAt(i + 1)},${yAt(without[i + 1])} ${xAt(i + 1)},${yAt(withBattery[i + 1])} ${xAt(i)},${yAt(withBattery[i])}`;
    bands.push(<polygon key={i} points={pts} fill={dis ? AMBER : BLUE} fillOpacity={0.75} stroke={dis ? AMBER : BLUE} strokeWidth={0.6} strokeOpacity={0.75} />);
  }

  const onMove = (e: RMouseEvent<SVGRectElement> | RTouchEvent<SVGRectElement>) => {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : (e as RMouseEvent).clientX;
    const frac = (cx - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(POINTS - 1, Math.round(frac * (POINTS - 1)))));
  };

  return (
    <div className="stp-chartwrap">
      <svg id="stp-daychart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}. Highest demand without a battery ${Math.round(peakWithout)} kilowatts, with a battery ${Math.round(peakWith)} kilowatts.`} xmlns="http://www.w3.org/2000/svg" fontFamily="system-ui, sans-serif">
        <rect x={0} y={0} width={W} height={H} fill="#ffffff" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={ML} x2={ML + PW} y1={yAt(t)} y2={yAt(t)} stroke="#E3E9EC" />
            <text x={ML - 8} y={yAt(t) + 4} textAnchor="end" fontSize={12} fill="#51666F">{Math.round(t).toLocaleString("en-US")}</text>
          </g>
        ))}
        <text x={14} y={MT + PH / 2} transform={`rotate(-90 14 ${MT + PH / 2})`} textAnchor="middle" fontSize={12} fill="#51666F">kW drawn from the grid</text>
        {[0, 12, 24, 36, 48, 60, 72, 84].map((i) => (
          <text key={i} x={xAt(i)} y={MT + PH + 20} textAnchor="middle" fontSize={12} fill="#51666F">{timeLabel(i)}</text>
        ))}
        {showUtility && (
          <g>
            <rect x={xAt(64)} y={MT} width={xAt(76) - xAt(64)} height={PH} fill="#123A4A" fillOpacity={0.07} />
            <text x={(xAt(64) + xAt(76)) / 2} y={MT + 14} textAnchor="middle" fontSize={11} fill={TEAL}>Utility peak</text>
            <text x={(xAt(64) + xAt(76)) / 2} y={MT + 27} textAnchor="middle" fontSize={11} fill={TEAL}>(about 4 to 7 pm)</text>
          </g>
        )}
        <path d={area} fill={GREY} fillOpacity={0.28} />
        <path d={pathLine(without)} fill="none" stroke={GREY} strokeWidth={1.5} />
        {bands}
        <path d={pathLine(withBattery)} fill="none" stroke={GREEN} strokeWidth={2.75} strokeLinejoin="round" />
        <line x1={ML} x2={ML + PW} y1={yAt(peakWithout)} y2={yAt(peakWithout)} stroke={GREY} strokeDasharray="6 4" />
        <line x1={ML} x2={ML + PW} y1={yAt(peakWith)} y2={yAt(peakWith)} stroke={GREEN} strokeDasharray="6 4" />
        <text x={ML + PW + 6} y={yAt(peakWithout) + (Math.abs(yAt(peakWithout) - yAt(peakWith)) < 14 ? -4 : 4)} fontSize={12} fontWeight={600} fill={GREY}>{Math.round(peakWithout).toLocaleString("en-US")} kW</text>
        <text x={ML + PW + 6} y={yAt(peakWith) + (Math.abs(yAt(peakWithout) - yAt(peakWith)) < 14 ? 14 : 4)} fontSize={12} fontWeight={600} fill={GREEN}>{Math.round(peakWith).toLocaleString("en-US")} kW</text>
        {hover !== null && (
          <g>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={MT} y2={MT + PH} stroke={TEAL} strokeOpacity={0.5} />
            <circle cx={xAt(hover)} cy={yAt(without[hover])} r={4} fill={GREY} />
            <circle cx={xAt(hover)} cy={yAt(withBattery[hover])} r={4} fill={GREEN} />
          </g>
        )}
        <rect x={ML} y={MT} width={PW} height={PH} fill="transparent" onMouseMove={onMove} onTouchMove={onMove} onTouchStart={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hover !== null && (
        <div className="stp-tooltip" style={{ left: `${(xAt(hover) / W) * 100}%`, transform: hover > 60 ? "translateX(-105%)" : "translateX(8px)" }}>
          <strong>{timeLabel(hover)}</strong>
          <div><span className="stp-dot" style={{ background: GREY }} /> Without battery: {Math.round(without[hover]).toLocaleString("en-US")} kW</div>
          <div><span className="stp-dot" style={{ background: GREEN }} /> With battery: {Math.round(withBattery[hover]).toLocaleString("en-US")} kW</div>
          <div>Difference: {(without[hover] - withBattery[hover] >= 0 ? "-" : "+")}{Math.abs(Math.round(without[hover] - withBattery[hover]))} kW</div>
        </div>
      )}
      <div className="stp-legend">
        <span><i style={{ background: GREY, opacity: 0.5 }} /> Without battery</span>
        <span><i style={{ background: GREEN }} /> With battery</span>
        <span><i style={{ background: AMBER }} /> Battery discharging</span>
        <span><i style={{ background: BLUE }} /> Battery recharging</span>
      </div>
    </div>
  );
}

/* --------------------------- Month chart --------------------------- */
function MonthChart({ before, after, costBefore, costAfter }: { before: number[]; after: number[]; costBefore: number[]; costAfter: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const yMax = niceMax(Math.max(...before));
  const yAt = (v: number) => MT + PH - (v / yMax) * PH;
  const ticks = Array.from({ length: 6 }, (_, i) => (i * yMax) / 5);
  const gw = PW / 12;
  const bw = gw * 0.34;
  return (
    <div className="stp-chartwrap">
      <svg id="stp-daychart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Highest demand in each month, with and without a battery" xmlns="http://www.w3.org/2000/svg" fontFamily="system-ui, sans-serif">
        <rect x={0} y={0} width={W} height={H} fill="#ffffff" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={ML} x2={ML + PW} y1={yAt(t)} y2={yAt(t)} stroke="#E3E9EC" />
            <text x={ML - 8} y={yAt(t) + 4} textAnchor="end" fontSize={12} fill="#51666F">{Math.round(t).toLocaleString("en-US")}</text>
          </g>
        ))}
        <text x={14} y={MT + PH / 2} transform={`rotate(-90 14 ${MT + PH / 2})`} textAnchor="middle" fontSize={12} fill="#51666F">Highest 15-minute kW in the month</text>
        {MONTHS.map((m, i) => {
          const cx = ML + gw * i + gw / 2;
          return (
            <g key={m} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={cx - gw / 2} y={MT} width={gw} height={PH} fill={hover === i ? "#123A4A" : "transparent"} fillOpacity={0.05} />
              <rect x={cx - bw - 1} y={yAt(before[i])} width={bw} height={yAt(0) - yAt(before[i])} fill={GREY} />
              <rect x={cx + 1} y={yAt(after[i])} width={bw} height={yAt(0) - yAt(after[i])} fill={GREEN} />
              <text x={cx} y={MT + PH + 20} textAnchor="middle" fontSize={12} fill="#51666F">{m}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="stp-tooltip" style={{ left: `${((ML + gw * hover + gw / 2) / W) * 100}%`, transform: hover > 7 ? "translateX(-105%)" : "translateX(8px)" }}>
          <strong>{MONTHS[hover]}</strong>
          <div>Without: {Math.round(before[hover]).toLocaleString("en-US")} kW, {money(costBefore[hover])}</div>
          <div>With: {Math.round(after[hover]).toLocaleString("en-US")} kW, {money(costAfter[hover])}</div>
          <div>Saved: {money(costBefore[hover] - costAfter[hover])}</div>
        </div>
      )}
      <div className="stp-legend">
        <span><i style={{ background: GREY }} /> Without battery</span>
        <span><i style={{ background: GREEN }} /> With battery</span>
      </div>
    </div>
  );
}

/* ---------------------------- Sparkline ---------------------------- */
function Spark({ a, b }: { a: number[]; b: number[] }) {
  const w = 120, h = 30;
  const m = Math.max(...a);
  const p = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${((i / (POINTS - 1)) * w).toFixed(1)},${(h - (v / m) * (h - 2) - 1).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={p(a)} fill="none" stroke={GREY} strokeWidth={1.2} />
      <path d={p(b)} fill="none" stroke={GREEN} strokeWidth={1.8} />
    </svg>
  );
}

/* ------------------------------ Page ------------------------------- */
type SortKey = "name" | "peak" | "red" | "redPct" | "sav" | "perKw";

export default function SeeThePeak() {
  const [data, setData] = useState<DataFile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [key, setKey] = useState("largeoffice");
  const [peakKw, setPeakKw] = useState(668);
  const [size, setSize] = useState<SizePct>(10);
  const [controller, setController] = useState<Controller>("perfect");
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [tab, setTab] = useState<Tab>("peak_day");
  const [design, setDesign] = useState<Design>("owner");
  const [hitPct, setHitPct] = useState(100);
  const [transRate, setTransRate] = useState(DEFAULT_TRANS_RATE);
  const [lossPct, setLossPct] = useState(DEFAULT_LOSS_PCT);
  const [sortKey, setSortKey] = useState<SortKey>("sav");
  const [sortDesc, setSortDesc] = useState(true);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      const k = d.buildings["largeoffice"] ? "largeoffice" : Object.keys(d.buildings)[0];
      setKey(k);
      setPeakKw(d.buildings[k].median_peak_kw);
    }).catch((e) => setErr(String(e.message || e)));
  }, []);

  const b: BuildingData | null = data ? data.buildings[key] : null;
  const res = useMemo(() => (b ? compute(b, peakKw, size, controller, rate) : null), [b, peakKw, size, controller, rate]);

  const rte = data ? data.meta.rte : 0.86;
  const d2 = useMemo(() => (b ? computeDesign2(b, peakKw, size, controller, rate, rte, hitPct, transRate, lossPct) : null), [b, peakKw, size, controller, rate, rte, hitPct, transRate, lossPct]);
  const isAe = design === "ae";

  const rows = useMemo(() => {
    if (!data) return [];
    const out = Object.entries(data.buildings).map(([k, bb]) => {
      const r = compute(bb, bb.median_peak_kw, size, controller, rate);
      const x = computeDesign2(bb, bb.median_peak_kw, size, controller, rate, rte, hitPct, transRate, lossPct);
      const s = isAe ? seriesDesign2(bb, "summer_weekday", size, bb.median_peak_kw, rte) : series(bb, "summer_weekday", size, controller, bb.median_peak_kw);
      const bkw = (size / 100) * bb.median_peak_kw;
      return isAe
        ? { k, name: bb.name, peak: bb.median_peak_kw, red: x.expectedKwCut, redPct: bb.median_peak_kw > 0 ? (x.expectedKwCut / bb.median_peak_kw) * 100 : 0, sav: x.aeValue, perKw: x.ownerSavings, a: s.without, c: s.withBattery, own: x.ownerGivesUp, bkw }
        : { k, name: bb.name, peak: bb.median_peak_kw, red: r.peakReductionKw, redPct: r.peakReductionPct, sav: r.annualSavings, perKw: r.savingsPerBatteryKw, a: s.without, c: s.withBattery, own: 0, bkw };
    });
    out.sort((x, y) => {
      const v = sortKey === "name" ? x.name.localeCompare(y.name) : (x as any)[sortKey] - (y as any)[sortKey];
      return sortDesc ? -v : v;
    });
    return out;
  }, [data, size, controller, rate, sortKey, sortDesc, isAe, hitPct, transRate, lossPct, rte]);

  if (err) return <div className="stp-root"><p className="stp-error">Could not load the building data: {err}. Make sure public/data/load_curves.json exists.</p></div>;
  if (!data || !b || !res || !d2) return <div className="stp-root"><p>Loading building data...</p></div>;

  const view: View = tab === "monthly" ? "peak_day" : tab;
  const s = isAe ? seriesDesign2(b, view, size, peakKw, rte) : series(b, view, size, controller, peakKw);
  const sc = b.scen[`${size}_${controller}`];
  const monthAfter = isAe ? d2.monthlyAfter : sc.monthly_peak.map((v) => v * res.scale);
  const monthCostAfter = isAe ? d2.monthlyCostAfter : res.monthlyCostAfter;
  const toggleSort = (k: SortKey) => { if (k === sortKey) setSortDesc(!sortDesc); else { setSortKey(k); setSortDesc(k !== "name"); } };

  const exportCsv = () => {
    if (tab === "monthly") {
      download("see-the-peak-months.csv", toCsv([["Month", "kW without battery", "kW with battery", "Demand cost without", "Demand cost with"], ...MONTHS.map((m, i) => [m, b.base.monthly_peak[i] * res.scale, monthAfter[i], res.monthlyCostBefore[i], monthCostAfter[i]])]));
    } else {
      download("see-the-peak-day.csv", toCsv([["Time", "kW without battery", "kW with battery"], ...s.without.map((v, i) => [timeLabel(i), v, s.withBattery[i]])]));
    }
  };
  const exportPng = () => {
    const svg = document.getElementById("stp-daychart");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W * 2; c.height = H * 2;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((blob) => { if (!blob) return; const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = "see-the-peak.png"; a.click(); URL.revokeObjectURL(u); });
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  };

  const sentence = isAe
    ? `Held for the system peak, a ${Math.round(res.batteryKw).toLocaleString("en-US")} kW battery cuts about ${Math.round(d2.expectedKwCut).toLocaleString("en-US")} kW at Austin Energy's peak, worth about ${money(d2.aeValue)} a year to the utility system. The ${b.name.toLowerCase()} still saves about ${money(d2.ownerSavings)} a year on its own bill, ${d2.ownerGivesUp > 0 ? `${money(d2.ownerGivesUp)} less than in Design 1` : "the same as in Design 1"}.`
    : res.peakReductionKw < 1
    ? `A ${Math.round(res.batteryKw).toLocaleString("en-US")} kW battery does not lower this ${b.name.toLowerCase()}'s highest peak of the year, but it trims the peak in other months and saves about ${money(res.annualSavings)} a year in demand charges.`
    : `A ${Math.round(res.batteryKw).toLocaleString("en-US")} kW battery cuts this ${b.name.toLowerCase()}'s peak by ${Math.round(res.peakReductionKw).toLocaleString("en-US")} kW (${res.peakReductionPct.toFixed(1)}%) and saves about ${money(res.annualSavings)} a year in demand charges.`;

  return (
    <div className="stp-root" ref={topRef}>
      <header className="stp-header">
        <h1>See the Peak</h1>
        <p>How a battery changes when a building draws power from the grid, and what that does to the demand charge.</p>
      </header>

      <section className="stp-controls" aria-label="Controls">
        <div className="stp-field stp-wide">
          <span>What is the battery for?</span>
          <div className="stp-toggle" role="group" aria-label="Design">
            <button type="button" className={design === "owner" ? "on" : ""} onClick={() => setDesign("owner")}>Design 1: cut my own monthly peak</button>
            <button type="button" className={design === "ae" ? "on" : ""} onClick={() => setDesign("ae")}>Design 2: hold for Austin Energy's system peak</button>
          </div>
          <small>{isAe
            ? "On forecast system-peak days the battery saves its full two hours for about 4:30 to 6:30 pm (daylight time) and recharges overnight. It cannot also cut a noon peak the same day. Austin Energy would have to pay the owner for what that costs."
            : "The battery cuts the building's highest 15-minute reading in each month, which is what the demand charge is based on. For most offices that reading comes around noon to 3 pm, before the utility's peak."}</small>
        </div>
        <label className="stp-field">
          <span>Building type</span>
          <select value={key} onChange={(e) => { setKey(e.target.value); setPeakKw(data.buildings[e.target.value].median_peak_kw); }}>
            {Object.entries(data.buildings).sort((a, c) => a[1].name.localeCompare(c[1].name)).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
          <small>About {b.buildings_100kw_plus.toLocaleString("en-US")} buildings of this type in Travis County have a peak of 100 kW or more. Typical peak: {b.median_peak_kw.toLocaleString("en-US")} kW.</small>
        </label>
        <label className="stp-field">
          <span>Building peak, kW</span>
          <div className="stp-row">
            <input type="number" min={20} max={3000} value={peakKw} onChange={(e) => setPeakKw(Math.max(20, Math.min(3000, Number(e.target.value) || 20)))} />
            <input type="range" min={20} max={3000} step={10} value={peakKw} onChange={(e) => setPeakKw(Number(e.target.value))} aria-label="Building peak slider" />
          </div>
          <small>Your building's highest 15-minute demand.</small>
        </label>
        <div className="stp-field">
          <span>Battery size</span>
          <div className="stp-toggle" role="group" aria-label="Battery size">
            {([10, 20] as SizePct[]).map((p) => <button key={p} type="button" className={size === p ? "on" : ""} onClick={() => setSize(p)}>{p}% of peak</button>)}
          </div>
          <small>{Math.round(res.batteryKw).toLocaleString("en-US")} kW / {Math.round(res.batteryKwh).toLocaleString("en-US")} kWh (2 hours)</small>
        </div>
        <div className="stp-field">
          <span>Battery control</span>
          <div className="stp-toggle" role="group" aria-label="Battery control">
            <button type="button" className={controller === "perfect" ? "on" : ""} onClick={() => { setController("perfect"); setHitPct(100); }}>Perfect forecast (best case)</button>
            <button type="button" className={controller === "forecast" ? "on" : ""} onClick={() => { setController("forecast"); setHitPct(60); }}>Simple forecast (typical)</button>
          </div>
          <small>Real savings depend on the control software. A simple rule that guesses tomorrow's peak from last week saves far less than a battery that knows the day ahead.</small>
        </div>
        <label className="stp-field">
          <span>Demand charge, $/kW-month</span>
          <input type="number" min={0} step={0.01} value={rate} onChange={(e) => setRate(Math.max(0, Number(e.target.value) || 0))} />
          <small>Austin Energy Secondary Voltage 2: $10.32 demand charge plus $5.03 regulatory charge. Check your bill.</small>
        </label>
      </section>

      {isAe && (
        <section className="stp-controls stp-static" aria-label="System-peak assumptions">
          <label className="stp-field">
            <span>Chance the battery is full and dispatched at the system peak, %</span>
            <input type="number" min={0} max={100} value={hitPct} onChange={(e) => setHitPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
            <small>Assumption. Best case 100. A simple rule that has to guess which days will be the four peaks will miss some; 60 is a placeholder, not a measured figure.</small>
          </label>
          <label className="stp-field">
            <span>Transmission rate, $/kW-year</span>
            <input type="number" min={0} value={transRate} onChange={(e) => setTransRate(Math.max(0, Number(e.target.value) || 0))} />
            <small>Rough estimate: about $5.1 billion of transmission cost over about 80 GW of peak load. Replace with the current rate.</small>
          </label>
          <label className="stp-field">
            <span>Line-loss gross-up, %</span>
            <input type="number" min={0} max={30} step={0.5} value={lossPct} onChange={(e) => setLossPct(Math.max(0, Math.min(30, Number(e.target.value) || 0)))} />
            <small>Each kW cut at the building avoids a little more at the power plant and on the lines.</small>
          </label>
        </section>
      )}

      <p className="stp-sentence">{sentence}</p>

      <section className="stp-chartcard">
        <div className="stp-tabs" role="tablist">
          {([["peak_day", "Worst summer day"], ["summer_weekday", "Typical summer weekday"], ["monthly", "Every month"]] as [Tab, string][]).map(([t, l]) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{l}</button>
          ))}
        </div>
        {tab === "monthly" ? (
          <MonthChart before={b.base.monthly_peak.map((v) => v * res.scale)} after={monthAfter} costBefore={res.monthlyCostBefore} costAfter={monthCostAfter} />
        ) : (
          <DayChart without={s.without} withBattery={s.withBattery} showUtility label={tab === "peak_day" ? "Worst summer day" : "Typical summer weekday"} />
        )}
        <p className="stp-caption">
          {tab === "peak_day" && `Worst summer day in the weather data: ${prettyDay(b.peak_day)}. Times are standard time (add an hour for daylight time).`}
          {tab === "summer_weekday" && "Average of all summer weekdays (June to September). Times are standard time (add an hour for daylight time)."}
          {tab === "monthly" && (isAe ? "Design 2: June to September the battery is held for the system peak, so the owner's own monthly peaks fall only as much as the 4 to 7 pm discharge happens to help. Other months run as in Design 1." : "Your bill is set by the highest 15-minute reading in each month. Hover a month for the dollars.")}
        </p>
        <div className="stp-actions">
          <button type="button" onClick={exportPng}>Download this chart as PNG</button>
          <button type="button" onClick={exportCsv}>Download the numbers as CSV</button>
        </div>
      </section>

      <section className="stp-cards" aria-label="Results">
        {isAe ? (
          <>
            <div className="stp-card"><h3>Cut at the system peak</h3><p className="big">{Math.round(d2.kwCutAtSystemPeak).toLocaleString("en-US")} kW</p><p>If the battery is ready. Expected: {Math.round(d2.expectedKwCut).toLocaleString("en-US")} kW at {hitPct}% readiness.</p></div>
            <div className="stp-card"><h3>Value to the utility system</h3><p className="big">{money(d2.aeValue)} a year</p><p>kW cut x (1 + losses) x ${transRate}/kW-year. Lower transmission costs are shared by every customer. Under a 12CP rule the same battery would be counted in every month, not just summer.</p></div>
            <div className="stp-card"><h3>Owner's own bill savings</h3><p className="big">{money(d2.ownerSavings)} a year</p><p>Design 1 gives {money(d2.ownerSavingsDesign1)}. The owner gives up {money(d2.ownerGivesUp)} by saving the battery for the system peak.</p></div>
            <div className="stp-card"><h3>Room for a payment</h3><p className="big">{money(d2.surplus)} a year</p><p>System value minus what the owner gives up. If positive, Austin Energy can pay the owner at least {money(d2.ownerGivesUp)} to make them whole and still come out ahead.</p></div>
            <div className="stp-card"><h3>Annual electricity use</h3><p className="big">{Math.round(res.annualKwh).toLocaleString("en-US")} kWh</p><p>The battery shifts when you draw power; it does not reduce how much you use.</p></div>
          </>
        ) : (
          <>
            <div className="stp-card"><h3>Highest demand</h3><p className="big">{kw(res.peakBefore)} to {kw(res.peakAfter)}</p><p>{res.peakReductionPct.toFixed(1)}% lower</p></div>
            <div className="stp-card"><h3>Demand charges per year</h3><p className="big">{money(res.annualCostBefore)} to {money(res.annualCostAfter)}</p><p>You save {money(res.annualSavings)} a year</p></div>
            <div className="stp-card"><h3>Savings per battery kW</h3><p className="big">{money(res.savingsPerBatteryKw)}</p><p>per kW of battery, per year</p></div>
            <div className="stp-card"><h3>Demand at 5 pm (summer weekday)</h3><p className="big">{kw(res.kw5pmBefore)} to {kw(res.kw5pmAfter)}</p><p>This is closer to when Austin Energy's own system peaks. If the number barely changes, the battery is helping your bill more than the utility's peak. Switch to Design 2 to see the battery held for that peak.</p></div>
            <div className="stp-card"><h3>Annual electricity use</h3><p className="big">{Math.round(res.annualKwh).toLocaleString("en-US")} kWh</p><p>The battery shifts when you draw power; it does not reduce how much you use.</p></div>
          </>
        )}
      </section>

      <section className="stp-warnings">
        <div className="stp-warn">The dollars on this page are demand charges only. They do not include the cost of the battery, tax credits, energy-price savings, charging losses, or solar. For payback and IRR use the Peak Savings Calculator.</div>
        {isAe && <div className="stp-warn">Design 2 assumes the call days are also the days the owner's summer monthly peak would have been cut, so it counts the owner's June to September savings as reduced. Real results depend on the dispatch software. System value is the utility's avoided transmission cost; it is only money to the owner if Austin Energy pays it.</div>}
        {controller === "perfect" && <div className="stp-warn">Best case. This assumes the battery knows the day ahead.</div>}
        {!isAe && res.annualSavings < 500 && <div className="stp-warn">At these settings the battery saves very little. The control software matters more than the battery size.</div>}
        <div className="stp-warn">Based on Texas-wide average building profiles. Your building will differ. Demand charges are Austin Energy rates published in 2026 and may change.</div>
      </section>

      <section className="stp-compare">
        <h2>Compare all building types</h2>
        <p>Each building at its own typical peak, with the battery size, control and design selected above. Click a row to load it.</p>
        <div className="stp-tablewrap">
          <table>
            <thead>
              <tr>
                {((isAe
                  ? [["name", "Building type"], ["peak", "Typical peak kW"], ["red", "Cut at system peak, kW"], ["redPct", "Cut, % of building peak"], ["sav", "Value to utility, per year"], ["perKw", "Owner's own bill savings"]]
                  : [["name", "Building type"], ["peak", "Typical peak kW"], ["red", "Peak cut, kW"], ["redPct", "Peak cut, %"], ["sav", "Annual savings"], ["perKw", "Per battery kW"]]) as [SortKey, string][]).map(([k, l]) => (
                  <th key={k} onClick={() => toggleSort(k)} aria-sort={sortKey === k ? (sortDesc ? "descending" : "ascending") : "none"}>{l}{sortKey === k ? (sortDesc ? " ▼" : " ▲") : ""}</th>
                ))}
                <th>Summer weekday</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.k} className={r.k === key ? "sel" : ""} onClick={() => { setKey(r.k); setPeakKw(r.peak); topRef.current?.scrollIntoView({ behavior: "smooth" }); }}>
                  <td>{r.name}</td>
                  <td>{r.peak.toLocaleString("en-US")}</td>
                  <td>{Math.round(r.red).toLocaleString("en-US")}</td>
                  <td>{r.redPct.toFixed(1)}%</td>
                  <td>{money(r.sav)}</td>
                  <td>{money(r.perKw)}</td>
                  <td><Spark a={r.a} b={r.c} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>{isAe ? "In Design 2 every building cuts about the same share of its size at the system peak. What differs is what the owner keeps on their own bill. With the best-case control, most building types keep about two thirds of their Design 1 savings, because June to September are given to the system peak; hotels and buildings whose own peak is late in the day do differently." : "Best candidates: buildings where a good controller cuts the peak by the most dollars per kW of battery."}</p>
      </section>

      <footer className="stp-footer">
        Load shapes: ComStock Texas commercial building profiles (NLR, formerly NREL), state average, weather year 2012. Building counts and typical peaks: Travis Central Appraisal District 2026 improvement data matched to building types. Estimates only; not engineering or financial advice. No data is stored or sent.
      </footer>
    </div>
  );
}
