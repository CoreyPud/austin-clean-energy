import { useState } from "react";
import {
  TECHNOLOGIES,
  ONCOR_138KV_COMPARISON,
  DLR_AVAILABILITY_LOW_PCT,
  DLR_AVAILABILITY_HIGH_PCT,
  PEAKER_BENCHMARK,
  CASE_STUDIES,
  type TechKey,
  LEDE_HTML,
  CALCULATOR_INTRO_HTML,
  AVAILABILITY_NOTE_HTML,
  EVIDENCE_GAP_HTML,
  UNQUANTIFIED_NOTE_HTML,
  METHODOLOGY_INTRO_HTML,
  METHODOLOGY_ITEMS_HTML,
  METHODOLOGY_OUTRO_HTML,
} from "./gets-vs-peaker-data";
import "./gets-vs-peaker.css";

interface RichProps {
  html: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  key?: React.Key;
}
function Rich({ html, as = "span", className }: RichProps) {
  const Tag = as as any;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function money(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

type ConfidenceMode = "conservative" | "optimistic";

interface SolutionResult {
  id: string;
  label: string;
  unlockedMw: number;
  totalCost: number;
  costPerMwUnlocked: number;
}

export default function GetsVsPeaker({ className = "" }: { className?: string }) {
  const [milesOfLine, setMilesOfLine] = useState(20);
  const [baselineRatingMw, setBaselineRatingMw] = useState(200);
  const [mode, setMode] = useState<ConfidenceMode>("conservative");
  const [applyAvailability, setApplyAvailability] = useState(true);
  const [availabilityPct, setAvailabilityPct] = useState(87);

  const results: SolutionResult[] = ONCOR_138KV_COMPARISON.map((sol) => {
    const pct = mode === "conservative" ? sol.newRatingPctOfStaticLow : sol.newRatingPctOfStaticHigh;
    const costPerMile = mode === "conservative" ? sol.costPerMileHighUsd : sol.costPerMileLowUsd;
    let unlockedMw = baselineRatingMw * (pct / 100 - 1);
    if (sol.id === "dlr" && applyAvailability) {
      unlockedMw *= availabilityPct / 100;
    }
    const totalCost = costPerMile * milesOfLine;
    const costPerMwUnlocked = unlockedMw > 0 ? totalCost / unlockedMw : NaN;
    return { id: sol.id, label: sol.label, unlockedMw, totalCost, costPerMwUnlocked };
  });

  const dlrResult = results.find((r) => r.id === "dlr")!;
  const peakerCostPerMw = PEAKER_BENCHMARK.capexPerMwUsd;
  const ratio = isFinite(dlrResult.costPerMwUnlocked) ? peakerCostPerMw / dlrResult.costPerMwUnlocked : NaN;

  const barValues = [
    ...results.map((r) => ({ label: r.label, value: r.costPerMwUnlocked, isPeaker: false })),
    { label: "New-build peaker (benchmark)", value: peakerCostPerMw, isPeaker: true },
  ];
  const maxBarValue = Math.max(...barValues.map((b) => (isFinite(b.value) ? b.value : 0)), 1);

  return (
    <div className={`gets-vs-peaker ${className}`}>
      <div className="gvp-wrap">
        <div className="gvp-kicker">
          <span className="gvp-kicker-rule" />
          Secret Vote — Documentary
        </div>
        <h1 className="gvp-h1">Grid-Enhancing Technologies vs. the Peaker</h1>
        <Rich as="p" className="gvp-lede" html={LEDE_HTML} />

        <div className="gvp-section">
          <div className="gvp-section-label">The four technologies</div>
          <div className="gvp-tech-grid">
            {TECHNOLOGIES.map((t) => (
              <div key={t.id} className={`gvp-tech-card${t.quantifiedHere ? " gvp-quantified" : ""}`}>
                <div className="gvp-tech-name">{t.name}</div>
                <div className="gvp-tech-badges">
                  <span className="gvp-badge">{t.category}</span>
                  {t.quantifiedHere ? (
                    <span className="gvp-badge gvp-badge-quantified">Modeled below</span>
                  ) : (
                    <span className="gvp-badge">Reference case studies only</span>
                  )}
                </div>
                <div className="gvp-tech-mechanism">{t.mechanism}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="gvp-section">
          <div className="gvp-section-label">Modeling it: DLR vs. reconductor vs. rebuild</div>
          <div className="gvp-panel">
            <Rich as="p" className="gvp-panel-intro" html={CALCULATOR_INTRO_HTML} />

            <div className="gvp-layout">
              <div className="gvp-controls">
                <div className="gvp-field">
                  <label>
                    Line length modeled <span className="gvp-fval">{milesOfLine} mi</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    step={1}
                    value={milesOfLine}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilesOfLine(Number(e.target.value))}
                  />
                </div>

                <div className="gvp-field">
                  <label>
                    Baseline static rating <span className="gvp-fval">{baselineRatingMw} MW</span>
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={800}
                    step={10}
                    value={baselineRatingMw}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaselineRatingMw(Number(e.target.value))}
                  />
                </div>

                <div className="gvp-field">
                  <label>Range assumption</label>
                  <div className="gvp-seg">
                    <button
                      className={mode === "conservative" ? "gvp-active" : ""}
                      onClick={() => setMode("conservative")}
                    >
                      Conservative
                    </button>
                    <button
                      className={mode === "optimistic" ? "gvp-active" : ""}
                      onClick={() => setMode("optimistic")}
                    >
                      Optimistic
                    </button>
                  </div>
                </div>

                <div className="gvp-checkbox-row">
                  <input
                    type="checkbox"
                    checked={applyAvailability}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApplyAvailability(e.target.checked)}
                    id="gvp-avail-toggle"
                  />
                  <label htmlFor="gvp-avail-toggle">
                    Discount DLR's gain for availability (Oncor's pilot found the higher rating available{" "}
                    {DLR_AVAILABILITY_LOW_PCT}&ndash;{DLR_AVAILABILITY_HIGH_PCT}% of the time, not continuously)
                  </label>
                </div>

                {applyAvailability && (
                  <div className="gvp-field">
                    <label>
                      Assumed availability <span className="gvp-fval">{availabilityPct}%</span>
                    </label>
                    <input
                      type="range"
                      min={DLR_AVAILABILITY_LOW_PCT}
                      max={DLR_AVAILABILITY_HIGH_PCT}
                      step={1}
                      value={availabilityPct}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvailabilityPct(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <div className="gvp-results">
                {results.map((r) => (
                  <div className="gvp-stat-row" key={r.id}>
                    <div className="gvp-stat-label">
                      {r.label} — MW unlocked / total cost / $ per MW unlocked
                    </div>
                    <div className="gvp-stat-value">
                      {r.unlockedMw.toFixed(0)} MW · {money(r.totalCost)} · {money(r.costPerMwUnlocked)}/MW
                    </div>
                  </div>
                ))}
                <div className="gvp-stat-row">
                  <div className="gvp-stat-label">New-build peaker benchmark (fixed, from this project's own figures)</div>
                  <div className="gvp-stat-value">{money(peakerCostPerMw)}/MW</div>
                </div>
                <div className="gvp-stat-row">
                  <div className="gvp-stat-label">DLR is roughly this many times cheaper per MW than the peaker benchmark</div>
                  <div className="gvp-stat-value gvp-good">{isFinite(ratio) ? `${ratio.toFixed(0)}×` : "—"}</div>
                </div>
              </div>
            </div>

            <div className="gvp-chart-box">
              {barValues.map((b) => (
                <div className="gvp-bar-row" key={b.label}>
                  <div className="gvp-bar-label">{b.label}</div>
                  <div className="gvp-bar-track">
                    <div
                      className={`gvp-bar-fill${b.isPeaker ? " gvp-bar-peaker" : ""}`}
                      style={{ width: `${isFinite(b.value) ? Math.min(100, (b.value / maxBarValue) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="gvp-bar-value">{money(b.value)}/MW</div>
                </div>
              ))}
            </div>

            <div className="gvp-note">
              <Rich html={AVAILABILITY_NOTE_HTML} />
            </div>
            <div className="gvp-note gvp-note-critical">
              <Rich html={EVIDENCE_GAP_HTML} />
            </div>
          </div>
        </div>

        <div className="gvp-section">
          <div className="gvp-section-label">What doesn't get modeled here</div>
          <Rich as="p" className="gvp-panel-intro" html={UNQUANTIFIED_NOTE_HTML} />
          <div className="gvp-case-grid">
            {CASE_STUDIES.map((c) => {
              const tech = TECHNOLOGIES.find((t) => t.id === (c.tech as TechKey));
              return (
                <div className="gvp-case-card" key={c.id}>
                  <div className="gvp-case-place">
                    {c.place} — {tech?.name ?? c.tech}
                  </div>
                  <div className="gvp-case-headline">{c.headline}</div>
                  <div className="gvp-case-detail">{c.detail}</div>
                  <div className="gvp-case-source">
                    <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                      {c.sourceLabel}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gvp-section gvp-methodology">
          <div className="gvp-section-label">Methodology &amp; sources</div>
          <Rich as="p" html={METHODOLOGY_INTRO_HTML} />
          <ul>
            {METHODOLOGY_ITEMS_HTML.map((item, i) => (
              <Rich as="li" key={i} html={item} />
            ))}
          </ul>
          <Rich as="p" html={METHODOLOGY_OUTRO_HTML} />
        </div>
      </div>
    </div>
  );
}
