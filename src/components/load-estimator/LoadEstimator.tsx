import { useMemo, useState } from "react";
import "./load-estimator.css";
import {
  SFH_KWH,
  SFH_LF,
  MF_KWH,
  MF_LF,
  DC1_MW,
  DC2_MW,
  DC3_MW,
  CURRENT_PEAK,
  COMMITTED,
  EV_KW_PER_VEHICLE,
  DOGSHEAD_SFH_N,
  DOGSHEAD_MF_N,
  DOGSHEAD_COMM_SQFT,
  DOGSHEAD_COMM_EUI,
  DOGSHEAD_COMM_LF,
  CATS,
  type CatKey,
} from "./load-estimator-data";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function fmtMW(v: number): string {
  if (v >= 1000) return (v / 1000).toFixed(2) + " GW";
  return v.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + " MW";
}

function fmtInt(v: number): string {
  return Math.round(v).toLocaleString("en-US");
}

function niceMax(v: number): number {
  if (v <= 0) return 1000;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  for (let i = 0; i < steps.length; i++) {
    const cand = steps[i] * mag;
    if (cand >= v) return cand;
  }
  return 10 * mag;
}

// ---------------------------------------------------------------------------
// reusable slider+number field
// ---------------------------------------------------------------------------

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  function clamp(v: number): number {
    if (Number.isNaN(v) || v < min) return min;
    if (v > max) return max;
    return v;
  }
  return (
    <div className="le-field-row">
      <label htmlFor={id}>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(clamp(Number(e.target.value)))}
      />
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(clamp(Number(e.target.value)))}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// main component
// ---------------------------------------------------------------------------

export default function LoadEstimator({ className = "" }: { className?: string }) {
  const [sfh, setSfh] = useState(5000);
  const [mf, setMf] = useState(8000);
  const [dc1, setDc1] = useState(3);
  const [dc2, setDc2] = useState(2);
  const [dc3, setDc3] = useState(0);
  const [mfg, setMfg] = useState(0);
  const [other, setOther] = useState(0);
  const [ev, setEv] = useState(2000);
  const [dogsheadPct, setDogsheadPct] = useState(0);

  const calc = useMemo(() => {
    const sfhMW = (sfh * (SFH_KWH / 8760 / SFH_LF)) / 1000;
    const mfMW = (mf * (MF_KWH / 8760 / MF_LF)) / 1000;
    const dcMW = dc1 * DC1_MW + dc2 * DC2_MW + dc3 * DC3_MW;
    const evMW = (ev * EV_KW_PER_VEHICLE) / 1000;

    const dogsheadSfhMW = (DOGSHEAD_SFH_N * (SFH_KWH / 8760 / SFH_LF)) / 1000;
    const dogsheadMfMW = (DOGSHEAD_MF_N * (MF_KWH / 8760 / MF_LF)) / 1000;
    const dogsheadCommMW = (DOGSHEAD_COMM_SQFT * DOGSHEAD_COMM_EUI) / 8760 / DOGSHEAD_COMM_LF / 1000;
    const dogsheadFullMW = dogsheadSfhMW + dogsheadMfMW + dogsheadCommMW;
    const dogsheadMW = dogsheadFullMW * (dogsheadPct / 100);

    const values: Record<CatKey, number> = {
      sfh: sfhMW,
      mf: mfMW,
      dc: dcMW,
      mfg,
      other,
      ev: evMW,
      dogshead: dogsheadMW,
    };

    const scenarioTotal = sfhMW + mfMW + dcMW + mfg + other + evMW + dogsheadMW;
    const totalPeak = CURRENT_PEAK + COMMITTED + scenarioTotal;
    const growth = ((COMMITTED + scenarioTotal) / CURRENT_PEAK) * 100;

    let largestKey: CatKey | null = null;
    let largestVal = -1;
    CATS.forEach((c) => {
      if (values[c.key] > largestVal) {
        largestVal = values[c.key];
        largestKey = c.key;
      }
    });
    const largestCat = largestVal > 0 ? CATS.find((c) => c.key === largestKey) ?? null : null;

    const axisMax = niceMax(totalPeak * 1.08);

    const segs = [
      { w: CURRENT_PEAK, color: "var(--le-baseline)", title: "Current peak: " + fmtMW(CURRENT_PEAK) },
      { w: COMMITTED, color: "var(--le-accent)", title: "Committed pipeline: +" + fmtMW(COMMITTED) },
      ...CATS.filter((c) => values[c.key] > 0).map((c) => ({
        w: values[c.key],
        color: c.colorVar,
        title: c.label + ": +" + fmtMW(values[c.key]),
      })),
    ];

    const legendItems = [
      { label: "Current peak", color: "var(--le-baseline)", val: CURRENT_PEAK, always: true },
      { label: "Committed pipeline", color: "var(--le-accent)", val: COMMITTED, always: true },
      ...CATS.map((c) => ({ label: c.label, color: c.colorVar, val: values[c.key], always: false })),
    ].filter((li) => li.always || li.val > 0);

    return { values, scenarioTotal, totalPeak, growth, largestCat, largestVal, axisMax, segs, legendItems };
  }, [sfh, mf, dc1, dc2, dc3, mfg, other, ev, dogsheadPct]);

  return (
    <div className={`load-estimator ${className}`}>
      <div className="le-page">
        <div className="le-masthead">
          <div className="le-kicker">Austin at a Glance · Forward-Looking Scenario Tool</div>
          <h1 className="le-title">Load Growth Estimator</h1>
          <p className="le-subtitle">
            Austin Energy's own permit pipeline only counts what's already been filed. This tool lets you layer{" "}
            <em>hypothetical</em> future growth on top of it — houses, apartments, data centers, EV fleets,
            industry — so you can see, in peak megawatts, what different growth stories would mean for the
            system Austin Energy has to serve.
          </p>
        </div>

        {/* 01 — baseline */}
        <section className="le-section">
          <h2 className="le-section-title"><span className="le-num">01</span> Where Austin Energy stands today</h2>
          <h3 className="le-section-sub">The real, sourced baseline</h3>
          <p className="le-section-lede">
            These four figures are not estimates — they're Austin Energy's own record peak and sales, plus the
            committed-growth output of the{" "}
            <a href="https://austincleanenergy.net/building-energy-usage" target="_blank" rel="noopener" style={{ color: "var(--le-accent-ink)" }}>
              Austin Clean Energy building-permit tool
            </a>{" "}
            this estimator extends. Everything below this point is hypothetical.
          </p>
          <div className="le-stat-row">
            <div className="le-stat-tile">
              <div className="le-label">Record system peak</div>
              <div className="le-value">3,067 MW</div>
              <div className="le-sub">Austin Energy, August 2023</div>
            </div>
            <div className="le-stat-tile">
              <div className="le-label">FY2024 annual sales</div>
              <div className="le-value">14 TWh</div>
              <div className="le-sub">Austin Energy</div>
            </div>
            <div className="le-stat-tile le-accent">
              <div className="le-label">Committed permit pipeline</div>
              <div className="le-value">+533.1 MW</div>
              <div className="le-sub">17.38% of current peak · 22,177 permits</div>
            </div>
            <div className="le-stat-tile le-accent">
              <div className="le-label">Committed annual load</div>
              <div className="le-value">2.33 TWh</div>
              <div className="le-sub">16.68% of FY2024 sales</div>
            </div>
          </div>
          <details className="le-disclosure le-caveat-note">
            <summary>Important caveat about the permit pipeline</summary>
            <p>
              The underlying tool's 22,177 figure counts building permits that were <b>issued</b> (approved for
              construction), not permits still awaiting approval — but issuance isn't completion. The site doesn't
              publish a date cutoff for its permit dataset, and a permit issued in, say, 2021 has likely already
              finished construction and is occupied today. That means some slice of this 533.1 MW is probably already
              reflected in Austin Energy's current 3,067 MW peak, not still "on the way." Treat the committed-pipeline
              figure as an upper bound on what's genuinely still coming, not a precise one.
            </p>
          </details>
        </section>

        {/* 02 — builder */}
        <section className="le-section">
          <h2 className="le-section-title"><span className="le-num">02</span> Build a scenario</h2>
          <h3 className="le-section-sub">What else might show up that isn't in a permit yet?</h3>
          <p className="le-section-lede">
            Each category converts to peak MW the same way the base tool does — annual energy use ÷ 8,760 hours
            ÷ a load factor (or, where noted, entered directly as peak MW). Every default is editable. Figures
            marked <span className="le-badge le-sourced">sourced</span> come from a cited benchmark; figures
            marked <span className="le-badge le-assumption">assumption</span> are this tool's own placeholder —
            adjust them if you have a better basis.
          </p>

          <div className="le-card-grid">
            <div className="le-card" style={{ ["--le-cat-color" as any]: "var(--le-sfh)" }}>
              <div className="le-card-head">
                <h4>Single-family homes</h4>
                <div className="le-card-out">{fmtMW(calc.values.sfh)}</div>
              </div>
              <div className="le-card-note">
                <span className="le-badge le-sourced">sourced</span> 13,152 kWh/yr per home · EIA RECS, avg. Texas home · 0.5 load factor
              </div>
              <SliderField id="in-sfh" label="New homes" value={sfh} min={0} max={30000} step={100} onChange={setSfh} />
            </div>

            <div className="le-card" style={{ ["--le-cat-color" as any]: "var(--le-mf)" }}>
              <div className="le-card-head">
                <h4>Multifamily units</h4>
                <div className="le-card-out">{fmtMW(calc.values.mf)}</div>
              </div>
              <div className="le-card-note">
                <span className="le-badge le-assumption">assumption</span> ~8,550 kWh/yr per unit · set at 65% of the single-family figure for smaller, shared-wall units · 0.5 load factor
              </div>
              <SliderField id="in-mf" label="New units" value={mf} min={0} max={40000} step={100} onChange={setMf} />
            </div>

            <div className="le-card" style={{ ["--le-cat-color" as any]: "var(--le-dc)" }}>
              <div className="le-card-head">
                <h4>Data centers</h4>
                <div className="le-card-out">{fmtMW(calc.values.dc)}</div>
              </div>
              <div className="le-card-note">
                <span className="le-badge le-sourced">sourced</span> tier sizes reflect real AE-territory patterns and the City's own Aug. 2026 memo · entered directly as peak MW (data centers run near-continuously)
              </div>
              <SliderField id="in-dc1" label="Existing-pattern (~10 MW each)" value={dc1} min={0} max={20} step={1} onChange={setDc1} />
              <SliderField id="in-dc2" label="Mid-size inquiry (~45 MW each)" value={dc2} min={0} max={15} step={1} onChange={setDc2} />
              <div className="le-card-dc-tiers">
                <SliderField id="in-dc3" label="Hyperscale — hypothetical (~200 MW each)" value={dc3} min={0} max={6} step={1} onChange={setDc3} />
              </div>
            </div>

            <div className="le-card" style={{ ["--le-cat-color" as any]: "var(--le-mfg)" }}>
              <div className="le-card-head">
                <h4>Manufacturing / industrial</h4>
                <div className="le-card-out">{fmtMW(calc.values.mfg)}</div>
              </div>
              <div className="le-card-note">
                <span className="le-badge le-assumption">assumption</span> entered directly as peak MW — industrial loads vary too widely for a single per-sqft benchmark
              </div>
              <SliderField id="in-mfg" label="Peak MW added" value={mfg} min={0} max={300} step={5} onChange={setMfg} />
            </div>

            <div className="le-card" style={{ ["--le-cat-color" as any]: "var(--le-other)" }}>
              <div className="le-card-head">
                <h4>Other / custom</h4>
                <div className="le-card-out">{fmtMW(calc.values.other)}</div>
              </div>
              <div className="le-card-note">
                <span className="le-badge le-assumption">assumption</span> catch-all for anything not covered above — schools, municipal buildout, retail not yet permitted — entered directly as peak MW
              </div>
              <SliderField id="in-other" label="Peak MW added" value={other} min={0} max={300} step={5} onChange={setOther} />
            </div>

            <div className="le-card" style={{ ["--le-cat-color" as any]: "var(--le-ev)" }}>
              <div className="le-card-head">
                <h4>EV fleet charging</h4>
                <div className="le-card-out">{fmtMW(calc.values.ev)}</div>
              </div>
              <div className="le-card-note">
                <span className="le-badge le-assumption">assumption</span> ~7 kW/vehicle average depot draw · blends Level 2 AC for light-duty vans with some DC fast charging for heavier trucks/buses, assuming smart/staggered (not simultaneous full-power) charging — adjust for your fleet mix
              </div>
              <SliderField id="in-ev" label="New fleet vehicles (vans, trucks, buses)" value={ev} min={0} max={20000} step={100} onChange={setEv} />
            </div>

            <div className="le-card" style={{ ["--le-cat-color" as any]: "var(--le-dogshead)" }}>
              <div className="le-card-head">
                <h4>Dog's Head development</h4>
                <div className="le-card-out">{fmtMW(calc.values.dogshead)}</div>
              </div>
              <div className="le-card-note">
                <span className="le-badge le-sourced">sourced program</span> <span className="le-badge le-assumption">assumption load factors</span>{" "}
                real 2,600-acre mixed-use development (Hwy 183/130, Colorado River) City Council annexed in 2026 — 6,195 single-family homes, 6,200 multifamily units, 9M sqft industrial/retail/office/hospitality (Amazon's robotics division is the anchor tenant); not yet in the base tool's permit data. Construction runs 2030–2057; developer says it's "not a data center" but hasn't ruled one out later. Housing uses this tool's own home/unit benchmarks; the 9M sqft of commercial space uses an assumed 12 kWh/sqft/yr blended EUI (not an Austin ECAD figure).
              </div>
              <SliderField id="in-dogshead" label="% of approved program built & energized" value={dogsheadPct} min={0} max={100} step={5} onChange={setDogsheadPct} />
            </div>
          </div>
        </section>

        {/* 03 — summary */}
        <section className="le-section">
          <h2 className="le-section-title"><span className="le-num">03</span> What it would mean for the system</h2>
          <h3 className="le-section-sub">Today, plus what's committed, plus your scenario</h3>
          <div className="le-stat-row" style={{ marginBottom: 18 }}>
            <div className="le-stat-tile">
              <div className="le-label">Your scenario adds</div>
              <div className="le-value">+{fmtMW(calc.scenarioTotal)}</div>
              <div className="le-sub">on top of the committed pipeline</div>
            </div>
            <div className="le-stat-tile le-accent">
              <div className="le-label">Projected total peak</div>
              <div className="le-value">{fmtInt(calc.totalPeak)} MW</div>
              <div className="le-sub">current peak + committed + scenario</div>
            </div>
            <div className="le-stat-tile le-accent">
              <div className="le-label">Growth over today's peak</div>
              <div className="le-value">{calc.growth.toFixed(1)}%</div>
              <div className="le-sub">committed + scenario combined</div>
            </div>
            <div className="le-stat-tile">
              <div className="le-label">Largest scenario category</div>
              <div className="le-value" style={{ fontSize: 19, color: calc.largestCat ? calc.largestCat.colorVar : undefined }}>
                {calc.largestCat ? calc.largestCat.label : "—"}
              </div>
              <div className="le-sub">{calc.largestCat ? `${fmtMW(calc.largestVal)} of the scenario total` : "no scenario load entered yet"}</div>
            </div>
          </div>

          <div className="le-comp-wrap">
            <div className="le-comp-bar">
              {calc.segs.map((s, i) => (
                <div
                  key={i}
                  className="le-comp-seg"
                  style={{ width: (s.w / calc.axisMax) * 100 + "%", background: s.color }}
                  title={s.title}
                />
              ))}
            </div>
            <div className="le-comp-axis">
              <span>0 MW</span>
              <span>{fmtInt(calc.axisMax)} MW</span>
            </div>
            <div className="le-comp-legend">
              {calc.legendItems.map((li, i) => (
                <div className="le-comp-legend-item" key={i}>
                  <span className="le-comp-legend-swatch" style={{ background: li.color }} />
                  <span>
                    {li.label}
                    <span className="le-lval">{fmtMW(li.val)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04 — methodology */}
        <section className="le-section">
          <h2 className="le-section-title"><span className="le-num">04</span> Methodology &amp; caveats</h2>
          <details className="le-disclosure">
            <summary>Open methodology and caveats</summary>
            <div className="le-method-grid">
              <div className="le-method-col">
              <h4>How the math works</h4>
              <ul>
                <li>Homes and units: <code>peak_mw = (kwh_per_yr ÷ 8760 ÷ load_factor) ÷ 1000</code>, per unit × count — identical formula to the underlying permit tool.</li>
                <li>Data centers, manufacturing, other/custom, and EV fleet charging: entered directly as peak MW (or MW per vehicle) and summed, since these loads don't fit a single per-sqft or per-unit benchmark the way housing does.</li>
                <li>Dog's Head uses the same home/unit formula as single-family and multifamily above, plus an assumed 12 kWh/sqft/yr blended EUI for its 9M sqft of commercial space — all scaled by the "% built &amp; energized" slider.</li>
                <li>Projected total peak = today's record peak (3,067 MW) + the committed permit pipeline (533.1 MW, fixed) + your scenario (adjustable).</li>
              </ul>
              </div>
              <div className="le-method-col">
              <h4>What to distrust</h4>
              <ul>
                <li>This is a scenario calculator, not a forecast or a load-flow study — it has no view of feeder capacity, substation headroom, or timing, only aggregate peak MW.</li>
                <li>The 533.1 MW committed-pipeline figure likely overstates what's genuinely still coming: it's built from issued permits with no disclosed date cutoff, and issuance doesn't mean the building isn't already finished and drawing power today. See the note in Section 01.</li>
                <li>The multifamily, manufacturing, other/custom, EV fleet, and Dog's Head commercial figures are this tool's own placeholder assumptions, not measured Austin data — treat them as starting points to argue with, not benchmarks.</li>
                <li>Data center tier sizes are illustrative, not a prediction of specific projects. The hyperscale tier in particular is a what-if: no 75+ MW facility has been requested in AE's territory as of August 2026, and Austin City Council is actively moving to restrict them.</li>
                <li>A load factor near 1.0 for data centers assumes near-continuous draw at rated capacity; a real facility ramps in over months to years, not instantly.</li>
                <li>Dog's Head is a 28-year build-out (2030–2057) with no public phasing schedule yet — the "% built" slider has no timeline attached to it, so it can't tell you which year a given percentage would land in.</li>
              </ul>
              </div>
            </div>
          </details>
        </section>

        <details className="le-disclosure le-footer">
          <summary>Sources and project context</summary>
          <div>
            <span>
              Part of the Secret Vote toolkit · extends the{" "}
              <a href="https://austincleanenergy.net/building-energy-usage" target="_blank" rel="noopener">
                Austin Clean Energy building-permit tool
              </a>
            </span>
            <span>
              Sources: Austin Clean Energy (ECAD + permit data) · EIA RECS · City of Austin memorandum, Aug. 25 2026 ·
              Austin Energy FY2024 sales &amp; Aug. 2023 peak · Dog's Head reporting (KUT News, Austin Current, 2026) ·
              EV depot-charging benchmarks (NREL, Joint Office of Energy and Transportation)
            </span>
          </div>
        </details>
      </div>
    </div>
  );
}
