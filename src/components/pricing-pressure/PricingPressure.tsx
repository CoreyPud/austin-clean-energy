import { useMemo, useRef, useState } from "react";
import "./pricing-pressure.css";
import {
  HIST,
  BASELINE_YEAR,
  BASELINE_VAL,
  FLEET_MWH,
  PROJECTION_END_YEAR,
  type HistYear,
} from "./pricing-pressure-data";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

type SeriesPoint = {
  year: number;
  central: number;
  low: number;
  high: number;
  projected: boolean;
};

type Preset = "low" | "mid" | "high" | null;

function money(v: number): string {
  return "$" + v.toFixed(2);
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  for (let i = 0; i < steps.length; i++) {
    const c = steps[i] * mag;
    if (c >= v) return c;
  }
  return 10 * mag;
}

function computeSeries(rate: number, reliefYear: number): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let y = BASELINE_YEAR; y <= PROJECTION_END_YEAR; y++) {
    const yearsElapsed = Math.max(0, Math.min(y - BASELINE_YEAR, reliefYear - BASELINE_YEAR));
    const central = BASELINE_VAL * Math.pow(1 + rate, yearsElapsed);
    out.push({ year: y, central, low: central * 0.8, high: central * 1.2, projected: y > BASELINE_YEAR });
  }
  return out;
}

// ---------------------------------------------------------------------------
// tooltip (shared shape used by both charts)
// ---------------------------------------------------------------------------

type TipState = { x: number; y: number; text: string } | null;

function Tooltip({ tip }: { tip: TipState }) {
  if (!tip) return null;
  return (
    <div
      className="pp-tooltip"
      style={{ left: tip.x, top: tip.y, opacity: 1 }}
    >
      {tip.text}
    </div>
  );
}

// ---------------------------------------------------------------------------
// history chart
// ---------------------------------------------------------------------------

function HistoryChart({ hist }: { hist: HistYear[] }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [tip, setTip] = useState<TipState>(null);

  const W = 900, H = 320, padL = 54, padR = 16, padT = 18, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxV = niceMax(Math.max(...hist.map((d) => d.value)) * 1.15);
  const n = hist.length;
  const bw = (plotW / n) * 0.58;
  const step = plotW / n;
  const ticks = 4;

  function showTip(evt: React.MouseEvent, text: string) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ x: evt.clientX - rect.left, y: evt.clientY - rect.top, text });
  }
  function moveTip(evt: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip((prev) => (prev ? { ...prev, x: evt.clientX - rect.left, y: evt.clientY - rect.top } : prev));
  }

  const uriIdx = hist.findIndex((d) => d.year === 2021);
  const uriAx = padL + uriIdx * step + step / 2;

  return (
    <div className="pp-chart-wrap">
      <div style={{ position: "relative" }} ref={wrapRef}>
        <svg className="pp-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          {Array.from({ length: ticks + 1 }, (_, t) => {
            const v = (maxV * t) / ticks;
            const y = padT + plotH - (v / maxV) * plotH;
            return (
              <g key={t}>
                <line x1={padL} x2={W - padR} y1={y} y2={y} className="pp-gridline" />
                <text x={padL - 8} y={y + 4} textAnchor="end" className="pp-bar-label">
                  ${v.toFixed(0)}
                </text>
              </g>
            );
          })}

          <text
            x={14}
            y={padT + plotH / 2}
            textAnchor="middle"
            className="pp-bar-label"
            transform={`rotate(-90 14 ${padT + plotH / 2})`}
          >
            Adverse basis cost ($/MWh)
          </text>

          {hist.map((d, i) => {
            const x = padL + i * step + (step - bw) / 2;
            const h = (d.value / maxV) * plotH;
            const y = padT + plotH - h;
            const color = d.year === 2021 ? "var(--pp-high)" : "var(--pp-accent)";
            const label = `${d.year}${d.partial ? " (partial)" : ""}: ${money(d.value)}/MWh`;
            return (
              <g key={d.year}>
                <rect
                  x={x}
                  y={y}
                  width={bw}
                  height={h}
                  fill={color}
                  rx={3}
                  opacity={d.partial ? 0.55 : 1}
                  onMouseEnter={(e: React.MouseEvent) => showTip(e, label)}
                  onMouseMove={moveTip}
                  onMouseLeave={() => setTip(null)}
                />
                <text x={x + bw / 2} y={H - padB + 16} textAnchor="middle" className="pp-bar-label">
                  {d.year}
                </text>
                <text x={x + bw / 2} y={y - 6} textAnchor="middle" className="pp-val-label" fill="var(--pp-ink)">
                  ${d.value.toFixed(2)}
                </text>
              </g>
            );
          })}

          {uriIdx >= 0 && (
            <text x={uriAx} y={padT + 10} textAnchor="middle" className="pp-annot" fill="var(--pp-high)">
              Winter Storm Uri
            </text>
          )}
        </svg>
        <Tooltip tip={tip} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// projection chart
// ---------------------------------------------------------------------------

function ProjectionChart({ series, reliefYear }: { series: SeriesPoint[]; reliefYear: number }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [tip, setTip] = useState<TipState>(null);

  const W = 900, H = 340, padL = 54, padR = 16, padT = 18, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxV = niceMax(Math.max(...series.map((d) => d.high)) * 1.1);
  const n = series.length;
  const step = plotW / (n - 1);
  const ticks = 4;

  function xy(i: number, val: number): [number, number] {
    const x = padL + i * step;
    const y = padT + plotH - (val / maxV) * plotH;
    return [x, y];
  }

  function showTip(evt: React.MouseEvent, text: string) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ x: evt.clientX - rect.left, y: evt.clientY - rect.top, text });
  }
  function moveTip(evt: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip((prev) => (prev ? { ...prev, x: evt.clientX - rect.left, y: evt.clientY - rect.top } : prev));
  }

  const bandHigh = series.filter((d) => d.projected).map((d) => xy(series.findIndex((s) => s === d), d.high));
  const bandLow = series
    .filter((d) => d.projected)
    .map((d) => xy(series.findIndex((s) => s === d), d.low))
    .reverse();
  const bandPath =
    bandHigh.length > 0
      ? "M " + bandHigh.map((p) => `${p[0]},${p[1]}`).join(" L ") + " L " + bandLow.map((p) => `${p[0]},${p[1]}`).join(" L ") + " Z"
      : "";

  const histPts = series.map((d, i) => ({ d, i })).filter(({ d }) => !d.projected).map(({ d, i }) => xy(i, d.central));
  const histPath = histPts.length ? "M " + histPts.map((p) => `${p[0]},${p[1]}`).join(" L ") : "";

  const baseIdx = series.findIndex((d) => d.year === BASELINE_YEAR);
  const projPts = series
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.projected && d.year !== BASELINE_YEAR)
    .map(({ d, i }) => xy(i, d.central));
  const fullProjPts = baseIdx >= 0 ? [xy(baseIdx, BASELINE_VAL), ...projPts] : projPts;
  const projPath = fullProjPts.length > 1 ? "M " + fullProjPts.map((p) => `${p[0]},${p[1]}`).join(" L ") : "";

  const reliefIdx = series.findIndex((d) => d.year === reliefYear);

  return (
    <div className="pp-chart-wrap">
      <div style={{ position: "relative" }} ref={wrapRef}>
        <svg className="pp-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          {Array.from({ length: ticks + 1 }, (_, t) => {
            const v = (maxV * t) / ticks;
            const y = padT + plotH - (v / maxV) * plotH;
            return (
              <g key={t}>
                <line x1={padL} x2={W - padR} y1={y} y2={y} className="pp-gridline" />
                <text x={padL - 8} y={y + 4} textAnchor="end" className="pp-bar-label">
                  ${v.toFixed(0)}
                </text>
              </g>
            );
          })}

          <text
            x={14}
            y={padT + plotH / 2}
            textAnchor="middle"
            className="pp-bar-label"
            transform={`rotate(-90 14 ${padT + plotH / 2})`}
          >
            Adverse basis cost ($/MWh)
          </text>

          {bandPath && <path d={bandPath} fill="var(--pp-mid-bg)" stroke="none" />}
          {histPath && <path d={histPath} fill="none" stroke="var(--pp-accent)" strokeWidth={2.5} />}
          {projPath && <path d={projPath} fill="none" stroke="var(--pp-mid)" strokeWidth={2.5} strokeDasharray="6,4" />}

          {series.map((d, i) => {
            const [x, y] = xy(i, d.central);
            const color = d.projected ? "var(--pp-mid)" : "var(--pp-accent)";
            const label = `${d.year}: ${money(d.central)}/MWh ${d.projected ? "(scenario)" : "(actual)"}`;
            return (
              <g key={d.year}>
                <circle cx={x} cy={y} r={3.5} fill={color} />
                <circle
                  cx={x}
                  cy={y}
                  r={10}
                  fill="transparent"
                  onMouseEnter={(e: React.MouseEvent) => showTip(e, label)}
                  onMouseMove={moveTip}
                  onMouseLeave={() => setTip(null)}
                />
                <text x={x} y={H - padB + 16} textAnchor="middle" className="pp-bar-label">
                  {d.year}
                </text>
              </g>
            );
          })}

          {reliefIdx >= 0 && (
            <>
              <line
                x1={xy(reliefIdx, 0)[0]}
                x2={xy(reliefIdx, 0)[0]}
                y1={xy(reliefIdx, maxV)[1]}
                y2={xy(reliefIdx, 0)[1]}
                stroke="var(--pp-line-strong)"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <text x={xy(reliefIdx, 0)[0]} y={padT + 10} textAnchor="middle" className="pp-annot">
                relief lands
              </text>
            </>
          )}
        </svg>
        <Tooltip tip={tip} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// main component
// ---------------------------------------------------------------------------

export default function PricingPressure({ className = "" }: { className?: string }) {
  const [rate, setRate] = useState(12); // percent, 0-25
  const [reliefYear, setReliefYear] = useState(2031);
  const [preset, setPreset] = useState<Preset>("mid");

  const series = useMemo(() => computeSeries(rate / 100, reliefYear), [rate, reliefYear]);

  const summary = useMemo(() => {
    const atRelief = series.find((d) => d.year === reliefYear) ?? series[series.length - 1];
    const cumEnd = Math.max(reliefYear, 2031);
    let cum = 0;
    series.forEach((d) => {
      if (d.year >= 2026 && d.year <= cumEnd) cum += (d.central - BASELINE_VAL) * FLEET_MWH;
    });
    const cumM = cum / 1e6;
    const cumLabel = cumM >= 1000 ? `$${(cumM / 1000).toFixed(2)}B` : `$${Math.round(cumM)}M`;
    return {
      byRelief: money(atRelief.central) + "/MWh",
      multiple: (atRelief.central / BASELINE_VAL).toFixed(1) + "×",
      cum: cumLabel,
    };
  }, [series, reliefYear]);

  function applyPreset(which: "low" | "mid" | "high") {
    const rates = { low: 5, mid: 12, high: 22 };
    setRate(rates[which]);
    setPreset(which);
  }

  function onRateSlider(v: number) {
    setRate(v);
    setPreset(null);
  }

  return (
    <div className={`pricing-pressure ${className}`}>
      <div className="pp-page">
        <div className="pp-masthead">
          <div className="pp-kicker">Austin at a Glance · Assumption-Heavy Scenario Tool</div>
          <h1 className="pp-title">Load Zone Pricing Pressure</h1>
          <p className="pp-subtitle">
            Austin Energy's generation fleet already pays a real, measurable "adverse basis" cost — the gap
            between what its own resources settle for and the ERCOT hub price. This tool shows that history,
            then lets you sketch out — openly, with a couple of adjustable knobs — whether ERCOT's
            data-center-driven load surge could push that gap wider before new transmission catches up.
          </p>
          <p className="pp-subtitle pp-warn">This is a scenario sketch, not a forecast. Section 04 spells out everything it can't see.</p>
        </div>

        {/* 01 — history */}
        <section className="pp-section">
          <h2 className="pp-section-title"><span className="pp-num">01</span> The real, measured history</h2>
          <h3 className="pp-section-sub">Austin Energy's fleet-wide adverse basis cost, 2018–2026</h3>
          <p className="pp-section-lede">
            Computed from ERCOT day-ahead and real-time settlement data across roughly 30 Austin-Energy-related
            generation resources by researcher Chris Gillett — the same dataset already underpinning the Peaker
            Ledger's Winter Storm Uri analysis. Bars show dollars of adverse basis per MWh of fleet generation, by year.
          </p>
          <div className="pp-stat-row">
            <div className="pp-stat-tile">
              <div className="pp-label">2025 (last full year)</div>
              <div className="pp-value">$7.17<span style={{ fontSize: 15 }}>/MWh</span></div>
              <div className="pp-sub">down from the 2022–23 peak</div>
            </div>
            <div className="pp-stat-tile">
              <div className="pp-label">Winter Storm Uri year</div>
              <div className="pp-value">$11.60<span style={{ fontSize: 15 }}>/MWh</span></div>
              <div className="pp-sub">2021 · more than 3× 2020</div>
            </div>
            <div className="pp-stat-tile">
              <div className="pp-label">2022–23 sustained peak</div>
              <div className="pp-value">$13.25–13.54</div>
              <div className="pp-sub">tight reserve margins, high gas prices</div>
            </div>
            <div className="pp-stat-tile pp-accent">
              <div className="pp-label">8-year range</div>
              <div className="pp-value">$1.87–13.54</div>
              <div className="pp-sub">2018 (partial) through 2025</div>
            </div>
          </div>

          <HistoryChart hist={HIST} />
        </section>

        {/* 02 — drivers */}
        <section className="pp-section">
          <h2 className="pp-section-title"><span className="pp-num">02</span> What could push it higher</h2>
          <h3 className="pp-section-sub">Two real, sourced numbers — no assumptions yet</h3>
          <p className="pp-section-lede">
            Before any scenario knob gets touched, here's what ERCOT itself has published about the gap between
            how fast load is arriving and how fast transmission relief is being built.
          </p>
          <div className="pp-driver-grid">
            <div className="pp-driver-card">
              <div className="pp-tag">ERCOT's own forecast, revised in one year</div>
              <h4>150 GW → 218 GW by 2031</h4>
              <p>
                ERCOT's transmission-service-provider load forecast for year 2031 jumped from{" "}
                <span className="pp-fig">150 GW</span> in the prior planning cycle to{" "}
                <span className="pp-fig">218 GW</span> in the 2025 Regional Transmission Plan — a revision ERCOT
                attributes directly to future data-center load growth. After ERCOT's own adjustment factors, the
                2031 planning peak used for transmission studies is <span className="pp-fig">159 GW</span>.
                Separately, ERCOT was tracking <span className="pp-fig">238.6 GW</span> of large-load
                interconnection requests as of December 2025 — a figure that had grown to roughly{" "}
                <span className="pp-fig">474 GW</span> statewide by mid-2026.
              </p>
            </div>
            <div className="pp-driver-card">
              <div className="pp-tag">Relief is real, but it's years out</div>
              <h4>2,500 MW into Central Texas — by 2031</h4>
              <p>
                ERCOT's 2025 plan cites "strained import capability" into Central Texas in multiple study years.
                The fix in progress is a new Euclid 765-kV substation and a roughly 130-mile Euclid–Hillje line
                (LCRA and CenterPoint), expected to add about <span className="pp-fig">2,500 MW</span> of import
                capability — with a recommended completion date of <span className="pp-fig">June 2031</span>.
                It's part of a $9B first phase of a $33B, 2,468-mile statewide 765-kV build-out ERCOT's board
                approved in December 2025, expected to take five to six years to construct.
              </p>
            </div>
          </div>
        </section>

        {/* 03 — scenario */}
        <section className="pp-section">
          <h2 className="pp-section-title"><span className="pp-num">03</span> Sketch a scenario</h2>
          <h3 className="pp-section-sub">If load keeps outrunning relief, how far could basis cost drift?</h3>
          <p className="pp-section-lede">
            One knob for how fast pressure builds, one for when relief arrives. Both apply a simple compounding
            rate to the 2025 baseline — not a power-flow model, just a transparent "what if this pattern from
            2021–23 repeats" sketch. The shaded band is ±20% either side of the central estimate, to keep the
            false precision honest.
          </p>

          <div className="pp-control-panel">
            <div className="pp-preset-row">
              <button
                className={`pp-preset-btn${preset === "low" ? " pp-active" : ""}`}
                data-p="low"
                onClick={() => applyPreset("low")}
              >
                Low pressure · 5%/yr
              </button>
              <button
                className={`pp-preset-btn${preset === "mid" ? " pp-active" : ""}`}
                data-p="mid"
                onClick={() => applyPreset("mid")}
              >
                Central · 12%/yr
              </button>
              <button
                className={`pp-preset-btn${preset === "high" ? " pp-active" : ""}`}
                data-p="high"
                onClick={() => applyPreset("high")}
              >
                High pressure · 22%/yr
              </button>
            </div>

            <div className="pp-slider-block">
              <div className="pp-slider-head">
                <label htmlFor="pp-rate-slider">Annual basis-cost growth rate</label>
                <span className="pp-sv">{rate}%/yr</span>
              </div>
              <input
                id="pp-rate-slider"
                type="range"
                min={0}
                max={25}
                step={1}
                value={rate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onRateSlider(Number(e.target.value))}
              />
              <div className="pp-slider-note">
                Illustrative, not derived from a load-flow model. For scale: basis cost roughly tripled from 2020
                to 2021 during Uri and stayed 2×+ elevated through 2023.
              </div>
            </div>

            <div className="pp-slider-block">
              <div className="pp-slider-head">
                <label htmlFor="pp-relief-slider">Year Central Texas transmission relief lands</label>
                <span className="pp-sv">{reliefYear}</span>
              </div>
              <input
                id="pp-relief-slider"
                type="range"
                min={2026}
                max={2035}
                step={1}
                value={reliefYear}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReliefYear(Number(e.target.value))}
              />
              <div className="pp-slider-note">
                2031 matches the Euclid–Hillje line's own recommended completion date. Growth is assumed to
                plateau (not decline) once relief arrives — this tool has no basis for modeling a decline.
              </div>
            </div>
          </div>

          <ProjectionChart series={series} reliefYear={reliefYear} />

          <div className="pp-stat-row" style={{ marginTop: 18 }}>
            <div className="pp-stat-tile pp-accent">
              <div className="pp-label">By relief year</div>
              <div className="pp-value">{summary.byRelief}</div>
              <div className="pp-sub">vs. ${BASELINE_VAL.toFixed(2)} in 2025</div>
            </div>
            <div className="pp-stat-tile pp-accent">
              <div className="pp-label">Illustrative cumulative extra cost</div>
              <div className="pp-value">{summary.cum}</div>
              <div className="pp-sub">2026–2031, vs. flat at 2025 level</div>
            </div>
            <div className="pp-stat-tile">
              <div className="pp-label">Assumed fleet exposure</div>
              <div className="pp-value">~12M MWh/yr</div>
              <div className="pp-sub">2024–25 average generation volume</div>
            </div>
            <div className="pp-stat-tile">
              <div className="pp-label">Multiple of 2025 level</div>
              <div className="pp-value">{summary.multiple}</div>
              <div className="pp-sub">at the relief year, this scenario</div>
            </div>
          </div>

          <details className="pp-disclosure pp-callout">
            <summary>How to interpret this scenario</summary>
            <p>
              <b>Read this as a range, not a prediction.</b> Move the sliders to zero growth and the chart just
              holds flat at $7.17 — that's a legitimate scenario too. The point isn't the specific dollar figure;
              it's that ERCOT's own numbers describe a load surge arriving years before its own relief project
              does, and Austin Energy's basis-cost history shows that kind of gap has produced multi-year price
              pressure before.
            </p>
          </details>
        </section>

        {/* 04 — methodology */}
        <section className="pp-section">
          <h2 className="pp-section-title"><span className="pp-num">04</span> What this tool can't see</h2>
          <details className="pp-disclosure">
            <summary>Open methodology and limitations</summary>
            <div className="pp-method-grid">
              <div className="pp-method-col">
              <h4>How the math works</h4>
              <ul>
                <li>Baseline is 2025's actual adverse-basis cost, <code>$7.17/MWh</code>.</li>
                <li>Each year from 2026 to the chosen relief year: <code>cost = baseline × (1 + rate)^years_elapsed</code>, then flat afterward.</li>
                <li>The shaded band is a flat ±20% around that central path — a visual reminder of uncertainty, not a modeled confidence interval.</li>
                <li>Cumulative cost multiplies the gap between projected and flat-baseline cost by an assumed ~12 million MWh/yr of fleet generation, the 2024–25 average.</li>
              </ul>
              </div>
              <div className="pp-method-col">
              <h4>What it is <em>not</em></h4>
              <ul>
                <li>Not a power-flow or locational-marginal-price simulation — it has no model of the grid's actual topology, congestion patterns, or ERCOT's dispatch stack.</li>
                <li>It ignores weather (the single biggest historical driver of basis-cost spikes), natural gas prices, and individual plant or line outages.</li>
                <li>It ignores changes to Austin Energy's own generation mix — new contracts, retirements, or additions all shift which resources are exposed to basis risk.</li>
                <li>It treats one Central Texas project (Euclid–Hillje) as a stand-in for "relief," when the real picture includes dozens of concurrent ERCOT transmission and market-design changes, any of which could move faster or slower.</li>
                <li>The growth-rate presets are calibrated loosely against 2021–23 history and the scale of ERCOT's 2031 forecast revision — they are not statistically fit or independently modeled.</li>
              </ul>
              </div>
            </div>
          </details>
        </section>

        <details className="pp-disclosure pp-footer">
          <summary>Sources and project context</summary>
          <div>
            <span>Part of the Secret Vote toolkit · historical basis-cost data via Chris Gillett's ERCOT settlement-data tool</span>
            <span>
              Sources: ERCOT 2025 Report on Existing and Potential Electric System Constraints and Needs · ERCOT
              board STEP approval, Dec. 2025 · 26RPG001 Euclid 765-kV filing · Gov. Abbott data-center audit, Aug. 2026
            </span>
          </div>
        </details>
      </div>
    </div>
  );
}
