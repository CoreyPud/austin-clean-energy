import { useState } from "react";
import "./peaker-vs-battery.css";
import {
  MONTHS,
  DAYS_IN_MONTH,
  YEARS,
  DURATION_CURVE,
  PEAKER_MW,
  BATTERY_MW,
  BATTERY_HOURS,
  SOURCES,
  type YearKey,
} from "./peaker-vs-battery-data";

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function money(v: number) {
  return (v < 0 ? "-" : "") + "$" + Math.abs(v).toFixed(1) + "M";
}
function moneyK(v: number) {
  return "$" + Math.round(v / 1000) + "K";
}

/** Sqrt-scale interpolation fraction (0-100), matching the original's
 * color ramp math. Endpoint colors stay as CSS custom properties so the
 * ramp is theme-adaptive automatically via color-mix() — no need to read
 * computed styles or duplicate light/dark hex tables here. */
function rampT(v: number, lo: number, hi: number) {
  const t = (Math.sqrt(Math.max(v, 0)) - Math.sqrt(lo)) / (Math.sqrt(hi) - Math.sqrt(lo));
  return Math.max(0, Math.min(1, t)) * 100;
}
function rampBg(v: number, lo: number, hi: number, cLo: string, cHi: string) {
  const t = rampT(v, lo, hi);
  return `color-mix(in srgb, ${cLo} ${100 - t}%, ${cHi} ${t}%)`;
}

/* ------------------------------------------------------------------ */
/*  Shared fixed tooltip                                               */
/* ------------------------------------------------------------------ */

interface TipState {
  show: boolean;
  x: number;
  y: number;
  lines: string[];
}
type ShowTipFn = (e: React.MouseEvent, lines: string[]) => void;

function useTooltip() {
  const [tip, setTip] = useState<TipState>({ show: false, x: 0, y: 0, lines: [] });
  const showTip: ShowTipFn = (e, lines) => {
    setTip({ show: true, x: e.clientX + 14, y: e.clientY + 14, lines });
  };
  const hideTip = () => setTip((t) => ({ ...t, show: false }));
  return { tip, showTip, hideTip };
}

function Tooltip({ tip }: { tip: TipState }) {
  if (!tip.show) return null;
  return (
    <div className="pvb-tooltip pvb-show" style={{ left: tip.x, top: tip.y }}>
      {tip.lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero stat tiles                                                     */
/* ------------------------------------------------------------------ */

function HeroTiles({ year }: { year: YearKey }) {
  const s = YEARS[year].summary;
  return (
    <div className="pvb-hero">
      <div className="pvb-htile">
        <div className="pvb-hl">Real avg. price</div>
        <div className="pvb-hv">${s.avg_price.toFixed(2)}</div>
        <div className="pvb-hs">per MWh, all hours, {year}</div>
      </div>
      <div className="pvb-htile pvb-peaker">
        <div className="pvb-hl">Peaker avg. cost</div>
        <div className="pvb-hv">${s.avg_mc.toFixed(1)}</div>
        <div className="pvb-hs">real monthly fuel+O&amp;M, avg for {year}</div>
      </div>
      <div className="pvb-htile pvb-battery">
        <div className="pvb-hl">Battery ceiling</div>
        <div className="pvb-hv">
          {moneyK(s.battery_mw_yr)}
          <span style={{ fontSize: 13 }}>/MW-yr</span>
        </div>
        <div className="pvb-hs">perfect-foresight, 2-hr &mdash; real fleets run $29&ndash;36K</div>
      </div>
      <div className="pvb-htile pvb-peaker">
        <div className="pvb-hl">Peaker margin</div>
        <div className="pvb-hv">
          {moneyK(s.peaker_mw_yr)}
          <span style={{ fontSize: 13 }}>/MW-yr</span>
        </div>
        <div className="pvb-hs">above real fuel+O&amp;M, only when it clears</div>
      </div>
      <div className="pvb-htile pvb-battery">
        <div className="pvb-hl">Battery, $1B scale</div>
        <div className="pvb-hv">{money(s.battery_total_m)}</div>
        <div className="pvb-hs">&asymp;485 MW / 2-hr</div>
      </div>
      <div className="pvb-htile pvb-peaker">
        <div className="pvb-hl">Peaker, $1B scale</div>
        <div className="pvb-hv">{money(s.peaker_total_m)}</div>
        <div className="pvb-hs">
          &asymp;400 MW, runs {s.peaker_pct.toFixed(1)}% of hours ({Math.round(s.peaker_hours)} hrs)
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Twin heatmaps — "when would each one actually run?"                */
/* ------------------------------------------------------------------ */

const HOUR_TICKS = [1, 4, 7, 10, 13, 16, 19, 22];

function HeatTable({
  kind,
  year,
  showTip,
  hideTip,
}: {
  kind: "peaker" | "battery";
  year: YearKey;
  showTip: ShowTipFn;
  hideTip: () => void;
}) {
  const d = YEARS[year];
  const days = DAYS_IN_MONTH[year];

  return (
    <table className="pvb-heat">
      <thead>
        <tr>
          <th />
          {HOUR_TICKS.map((h) => (
            <th key={h} colSpan={3}>
              HE{h}
            </th>
          ))}
          <th className="pvb-totalhdr">
            Total
            <br />
            hrs
          </th>
        </tr>
      </thead>
      <tbody>
        {MONTHS.map((mon, m) => {
          const total = kind === "peaker" ? Math.round(d.econ_peaker_hrs[String(m + 1)]) : days[m] * 2;
          return (
            <tr key={mon}>
              <th className="pvb-mrow">{mon}</th>
              {Array.from({ length: 24 }, (_, h) => {
                if (kind === "peaker") {
                  const v = d.heat_avg[m][h];
                  const p = d.heat_pct[m][h];
                  const bg = rampBg(v, 10, 140, "var(--pvb-heat-lo)", "var(--pvb-heat-hi)");
                  return (
                    <td
                      key={h}
                      style={{ background: bg }}
                      onMouseMove={(e) => showTip(e, [`${mon} HE${h + 1}`, `avg $${v.toFixed(2)}/MWh · peaker clears ${p}%`])}
                      onMouseLeave={hideTip}
                    >
                      {p >= 50 && <span className="pvb-flag" />}
                    </td>
                  );
                }
                const p = d.batt_heat[m][h];
                const bg = rampBg(p, 0, 70, "var(--pvb-heat2-lo)", "var(--pvb-heat2-hi)");
                return (
                  <td
                    key={h}
                    style={{ background: bg }}
                    onMouseMove={(e) => showTip(e, [`${mon} HE${h + 1}`, `battery discharging ${p}% of days`])}
                    onMouseLeave={hideTip}
                  >
                    {p >= 50 && <span className="pvb-flag" />}
                  </td>
                );
              })}
              <td className="pvb-totcell" title={`Total hours ${mon}`}>
                {total}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function HoursChart({ year, showTip, hideTip }: { year: YearKey; showTip: ShowTipFn; hideTip: () => void }) {
  const d = YEARS[year];
  const days = DAYS_IN_MONTH[year];
  const battHrs = days.map((dd) => dd * 2);
  const peakHrs = MONTHS.map((_, i) => d.econ_peaker_hrs[String(i + 1)]);
  const maxV = Math.max(...battHrs, ...peakHrs);
  const scale = 160 / maxV;

  return (
    <>
      <div className="pvb-monthchart">
        {MONTHS.map((mon, i) => {
          const b = battHrs[i];
          const p = peakHrs[i];
          return (
            <div className="pvb-mcol" key={mon}>
              <div
                className="pvb-mbar pvb-battery"
                style={{ height: b * scale }}
                onMouseMove={(e) => showTip(e, [`${mon} battery: ${b} hrs discharging (fixed)`])}
                onMouseLeave={hideTip}
              />
              <div
                className="pvb-mbar pvb-peaker"
                style={{ height: p * scale }}
                onMouseMove={(e) => showTip(e, [`${mon} peaker: ${p.toFixed(0)} hrs running`])}
                onMouseLeave={hideTip}
              />
            </div>
          );
        })}
      </div>
      <div className="pvb-monthlabels">
        {MONTHS.map((mon) => (
          <span key={mon}>{mon}</span>
        ))}
      </div>
    </>
  );
}

function HeatSection({ year, showTip, hideTip }: { year: YearKey; showTip: ShowTipFn; hideTip: () => void }) {
  const d = YEARS[year];
  const totalCells = 288;
  const clearing = d.heat_pct.flat().filter((p) => p >= 50).length;
  const battClearing = d.batt_heat.flat().filter((p) => p >= 50).length;
  const busiestHE20 = Math.max(...d.batt_heat.map((r) => r[19]));

  return (
    <>
      <p className="pvb-axisnote">
        Columns are hour of day (HE1&ndash;HE24, &ldquo;hour ending&rdquo; &mdash; HE20 is the hour ending 8pm); rows
        are calendar month; the shaded last column sums that month's real hours.
      </p>
      <div className="pvb-twin">
        <div>
          <div className="pvb-twinhead pvb-peaker">Peaker &mdash; clears its real monthly fuel cost</div>
          <div className="pvb-legend">
            <span>
              <span className="pvb-sw" style={{ background: "var(--pvb-heat-lo)", border: "1px solid var(--pvb-line-strong)" }} />
              Low price
            </span>
            <span>
              <span className="pvb-sw" style={{ background: "var(--pvb-heat-hi)" }} />
              High price
            </span>
            <span>
              <span className="pvb-marker-dot" />
              Clears &ge;50% of intervals
            </span>
          </div>
          <div className="pvb-heatwrap">
            <HeatTable kind="peaker" year={year} showTip={showTip} hideTip={hideTip} />
          </div>
        </div>
        <div>
          <div className="pvb-twinhead pvb-battery">Battery &mdash; discharging (2-hr)</div>
          <div className="pvb-legend">
            <span>
              <span className="pvb-sw" style={{ background: "var(--pvb-heat2-lo)", border: "1px solid var(--pvb-line-strong)" }} />
              Rarely
            </span>
            <span>
              <span className="pvb-sw" style={{ background: "var(--pvb-heat2-hi)" }} />
              Often
            </span>
            <span>
              <span className="pvb-marker-dot" />
              Discharges &ge;50% of days
            </span>
          </div>
          <div className="pvb-heatwrap">
            <HeatTable kind="battery" year={year} showTip={showTip} hideTip={hideTip} />
          </div>
        </div>
      </div>
      <p className="pvb-heatfoot">
        {clearing} of 288 peaker month-hour slots ({Math.round((100 * clearing) / totalCells)}%) clear its real
        monthly cost in most real intervals — concentrated in the evening ramp. {battClearing} of 288 battery
        month-hour slots ({Math.round((100 * battClearing) / totalCells)}%) are a top-2 discharge hour on most days
        that month — even more concentrated, almost entirely HE18–21. The battery's busiest hour (HE20) discharges
        on {busiestHE20}% of its priciest days that month.
      </p>
      <p className="pvb-heatnote">
        The battery isn't held back by any cycle limit in this model &mdash; it cycles <b>every single day</b>, 365
        days a year (that's the flat green line in the &ldquo;hours actually running&rdquo; chart below),
        comfortably inside what utility-scale battery warranties typically allow (~400+ full cycles/year). What the
        heatmap shows isn't <i>whether</i> it ran &mdash; it's <i>which hour</i> it ran in. The exact discharge hour
        drifts around the evening ramp from day to day, so only the tightest hours (mostly HE19&ndash;21) are
        consistent enough to cross the &ldquo;most days&rdquo; marker threshold. Charging is spread even wider,
        across both overnight and midday hours &mdash; Austin solar depresses prices enough at midday that it's
        often cheaper to charge at 10am than at 2am.
      </p>

      <div className="pvb-hourswrap">
        <div className="pvb-twinhead pvb-muted">Hours actually running, per month</div>
        <p className="pvb-sub" style={{ marginBottom: 12 }}>
          The peaker's runtime swings hard with the price spikes that clear its cost each month; the battery's
          doesn't &mdash; it's built to run its priciest two hours every single day, so its monthly total is just
          &asymp;2&times; that month's day count, no matter how extreme prices get.
        </p>
        <div className="pvb-legend">
          <span>
            <span className="pvb-sw" style={{ background: "var(--pvb-peaker)" }} />
            Peaker hrs/mo
          </span>
          <span>
            <span className="pvb-sw" style={{ background: "var(--pvb-battery)" }} />
            Battery hrs/mo
          </span>
        </div>
        <HoursChart year={year} showTip={showTip} hideTip={hideTip} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Duration chart — "how much battery duration do you actually need?" */
/* ------------------------------------------------------------------ */

function DurationChart({ year, showTip, hideTip }: { year: YearKey; showTip: ShowTipFn; hideTip: () => void }) {
  const curve = DURATION_CURVE[year];
  const peakerTotal = YEARS[year].summary.peaker_total_m;
  const maxV = Math.max(peakerTotal, ...curve.map((c) => c.total_m)) * 1.15;
  const chartH = 210;
  const refY = chartH - (peakerTotal / maxV) * chartH;
  const peakerPayback = Math.round(1000 / peakerTotal);

  return (
    <>
      <div className="pvb-durchart" style={{ height: chartH }}>
        <div className="pvb-durbars">
          {curve.map((c) => {
            const h = (c.total_m / maxV) * chartH;
            const payback = Math.round(1000 / c.total_m);
            return (
              <div className="pvb-durcol" key={c.d}>
                <div
                  className="pvb-durbar"
                  style={{ height: h }}
                  onMouseMove={(e) =>
                    showTip(e, [
                      `${c.d}-hr battery: $${c.total_m}M/yr operating margin (${c.mw} MW × $${Math.round(c.rev_per_mw / 1000)}K/MW-yr)`,
                      `~${payback}-yr simple payback on the $1B build`,
                    ])
                  }
                  onMouseLeave={hideTip}
                />
              </div>
            );
          })}
        </div>
        <div className="pvb-durrefline" style={{ bottom: chartH - refY }}>
          <span className="pvb-durreflabel">peaker at $1B: ${peakerTotal.toFixed(1)}M/yr</span>
        </div>
      </div>
      <div className="pvb-durlabels">
        {curve.map((c) => (
          <div className="pvb-durlab" key={c.d}>
            <b>{c.d}hr</b>
            {c.mw} MW
            <br />
            <small>${c.total_m}M/yr</small>
          </div>
        ))}
      </div>
      <div className="pvb-durnote">
        <b>Capex vs. opex, spelled out:</b> none of the dollar figures above subtract the $1B it took to build any of
        these &mdash; every bar (and the dashed line) is pure operating margin, revenue minus running cost, in one
        real year. Rough, undiscounted payback &mdash; $1B &divide; that year's margin, ignoring financing, taxes,
        capacity payments and everything else &mdash; runs <b>~{Math.round(1000 / curve[0].total_m)} years</b> for
        the 1-hr battery up to <b>~{Math.round(1000 / curve[curve.length - 1].total_m)} years</b> for the 4-hr, and{" "}
        <b>~{peakerPayback} years</b> for the 400&nbsp;MW peaker in {year}. That's the honest point of this chart: at
        real {year} prices, arbitrage-only or margin-only economics don't come close to repaying a $1B build on
        their own &mdash; either technology needs more than what's plotted here (capacity payments, ancillary
        services, decades of runtime) to actually pencil out.
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  How the savings actually work — market rate vs. cost vs. margin     */
/* ------------------------------------------------------------------ */

function SavingsEquation({ year, showTip, hideTip }: { year: YearKey; showTip: ShowTipFn; hideTip: () => void }) {
  const s = YEARS[year].summary;
  const days = DAYS_IN_MONTH[year].reduce((a, b) => a + b, 0);
  const RTE = 0.85;

  // Margin/MWh is derived from totals already shown elsewhere on the page, so it
  // can never contradict the hero tiles above — cost/charge price are the one new,
  // independently-real inputs (see peaker-vs-battery-data.ts).
  const pMargin = s.peaker_mw_yr / s.peaker_hours;
  const pCost = s.avg_mc_running;
  const pPrice = pCost + pMargin;
  const pMWh = PEAKER_MW * s.peaker_hours;
  const pTotal = s.peaker_total_m;

  const bMargin = s.battery_mw_yr / (BATTERY_HOURS * days);
  const bChargeRaw = s.avg_charge_price;
  const bChargeAdj = bChargeRaw / RTE;
  const bPrice = bChargeAdj + bMargin;
  const bMWh = BATTERY_MW * BATTERY_HOURS * days;
  const bTotal = s.battery_total_m;

  const maxV = Math.max(pPrice, bPrice) * 1.15;
  const chartH = 190;
  const pBarPx = (pPrice / maxV) * chartH;
  const bBarPx = (bPrice / maxV) * chartH;

  return (
    <>
      <div className="pvb-eqchart" style={{ height: chartH }}>
        {[0, maxV / 2, maxV].map((v, i) => (
          <div className="pvb-eqgridline" style={{ top: chartH - (v / maxV) * chartH }} key={i}>
            <span className="pvb-eqgridlabel">${Math.round(v)}</span>
          </div>
        ))}
        <div className="pvb-eqcols">
          <div className="pvb-eqcol">
            <div className="pvb-eqbartop" style={{ bottom: pBarPx + 6 }}>
              ${pPrice.toFixed(0)}/MWh market rate
            </div>
            <div className="pvb-eqbar" style={{ height: chartH }}>
              <div
                className="pvb-eqseg pvb-eqseg-cost"
                style={{ height: (pCost / maxV) * chartH }}
                onMouseMove={(e) => showTip(e, [`Peaker fuel + O&M: $${pCost.toFixed(2)}/MWh`])}
                onMouseLeave={hideTip}
              />
              <div
                className="pvb-eqseg pvb-eqseg-margin pvb-peaker"
                style={{ height: (pMargin / maxV) * chartH }}
                onMouseMove={(e) => showTip(e, [`Peaker margin: $${pMargin.toFixed(2)}/MWh — kept, not sold to anyone`])}
                onMouseLeave={hideTip}
              />
            </div>
            <div className="pvb-eqbarlabel">Peaker</div>
          </div>
          <div className="pvb-eqcol">
            <div className="pvb-eqbartop" style={{ bottom: bBarPx + 6 }}>
              ${bPrice.toFixed(0)}/MWh avoided
            </div>
            <div className="pvb-eqbar" style={{ height: chartH }}>
              <div
                className="pvb-eqseg pvb-eqseg-cost"
                style={{ height: (bChargeAdj / maxV) * chartH }}
                onMouseMove={(e) =>
                  showTip(e, [
                    `Battery recharge cost: $${bChargeAdj.toFixed(2)}/MWh ($${bChargeRaw.toFixed(2)} paid ÷ 85% round-trip efficiency)`,
                  ])
                }
                onMouseLeave={hideTip}
              />
              <div
                className="pvb-eqseg pvb-eqseg-margin pvb-battery"
                style={{ height: (bMargin / maxV) * chartH }}
                onMouseMove={(e) =>
                  showTip(e, [`Battery margin: $${bMargin.toFixed(2)}/MWh discharged — kept, not sold to anyone`])
                }
                onMouseLeave={hideTip}
              />
            </div>
            <div className="pvb-eqbarlabel">Battery</div>
          </div>
        </div>
      </div>
      <div className="pvb-eqlegend">
        <span>
          <span className="pvb-sw" style={{ background: "var(--pvb-ink-faint)", opacity: 0.5 }} />
          Cost to run / recharge
        </span>
        <span>
          <span className="pvb-sw" style={{ background: "var(--pvb-peaker)" }} />
          Peaker margin (kept)
        </span>
        <span>
          <span className="pvb-sw" style={{ background: "var(--pvb-battery)" }} />
          Battery margin (kept)
        </span>
      </div>

      <div className="pvb-eqstrips">
        <div className="pvb-eq">
          <div className="pvb-eqhead pvb-peaker">Peaker</div>
          <div className="pvb-eqterm">
            <div className="pvb-eqlabel">Market rate when running</div>
            <div className="pvb-eqval">${pPrice.toFixed(2)}/MWh</div>
          </div>
          <div className="pvb-eqop">&minus;</div>
          <div className="pvb-eqterm">
            <div className="pvb-eqlabel">Fuel + O&amp;M cost</div>
            <div className="pvb-eqval">${pCost.toFixed(2)}/MWh</div>
          </div>
          <div className="pvb-eqop">=</div>
          <div className="pvb-eqterm pvb-eqfinal pvb-peaker">
            <div className="pvb-eqlabel">Margin kept</div>
            <div className="pvb-eqval">${pMargin.toFixed(2)}/MWh</div>
          </div>
          <div className="pvb-eqop">&times;</div>
          <div className="pvb-eqterm">
            <div className="pvb-eqlabel">MWh run, {year}</div>
            <div className="pvb-eqval">{Math.round(pMWh).toLocaleString()}</div>
          </div>
          <div className="pvb-eqop">=</div>
          <div className="pvb-eqterm pvb-eqfinal pvb-peaker pvb-eqtotal">
            <div className="pvb-eqlabel">Annual savings</div>
            <div className="pvb-eqval">${pTotal.toFixed(1)}M</div>
          </div>
        </div>
        <div className="pvb-eq">
          <div className="pvb-eqhead pvb-battery">Battery</div>
          <div className="pvb-eqterm">
            <div className="pvb-eqlabel">Price avoided, discharging</div>
            <div className="pvb-eqval">${bPrice.toFixed(2)}/MWh</div>
          </div>
          <div className="pvb-eqop">&minus;</div>
          <div className="pvb-eqterm">
            <div className="pvb-eqlabel">Recharge cost, loss-adj.</div>
            <div className="pvb-eqval">${bChargeAdj.toFixed(2)}/MWh</div>
          </div>
          <div className="pvb-eqop">=</div>
          <div className="pvb-eqterm pvb-eqfinal pvb-battery">
            <div className="pvb-eqlabel">Margin kept</div>
            <div className="pvb-eqval">${bMargin.toFixed(2)}/MWh</div>
          </div>
          <div className="pvb-eqop">&times;</div>
          <div className="pvb-eqterm">
            <div className="pvb-eqlabel">MWh discharged, {year}</div>
            <div className="pvb-eqval">{Math.round(bMWh).toLocaleString()}</div>
          </div>
          <div className="pvb-eqop">=</div>
          <div className="pvb-eqterm pvb-eqfinal pvb-battery pvb-eqtotal">
            <div className="pvb-eqlabel">Annual savings</div>
            <div className="pvb-eqval">${bTotal.toFixed(1)}M</div>
          </div>
        </div>
      </div>

      <div className="pvb-notrevenue">
        <div className="pvb-notrevenue-label">Savings, not revenue</div>
        <p>
          Nobody buys this margin. Austin Energy serves its own customers, so when the peaker clears its cost or the
          battery discharges, AE simply doesn't have to go <b>buy</b> that megawatt-hour from ERCOT at the real-time
          price shown above &mdash; it pays its own lower cost instead and the gap never leaves AE's budget. Every
          dollar figure on this page is money AE <b>doesn't spend</b>, not money AE collects from selling into the
          market. (AE could instead choose to sell surplus output for real merchant revenue &mdash; that's a
          different, separate business decision than the one modeled here.)
        </p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Does this pay for itself? — peaker vs. every battery duration       */
/* ------------------------------------------------------------------ */

interface PaybackRow {
  label: string;
  cls: "pvb-py-peaker" | "pvb-py-battery";
  mw: number;
  savings: number;
  payback: number;
}

function PaybackTable({ year }: { year: YearKey }) {
  const curve = DURATION_CURVE[year];
  const peakerTotal = YEARS[year].summary.peaker_total_m;

  const rows: PaybackRow[] = [
    { label: "Peaker (baseline)", cls: "pvb-py-peaker", mw: PEAKER_MW, savings: peakerTotal, payback: 1000 / peakerTotal },
    ...curve.map((c) => ({
      label: `Battery, ${c.d}-hr`,
      cls: "pvb-py-battery" as const,
      mw: c.mw,
      savings: c.total_m,
      payback: 1000 / c.total_m,
    })),
  ];
  let bestIdx = 0;
  rows.forEach((r, i) => {
    if (r.payback < rows[bestIdx].payback) bestIdx = i;
  });
  const fastest = rows[bestIdx].payback;
  const slowest = Math.max(...rows.map((r) => r.payback));

  return (
    <>
      <div className="pvb-paytablewrap">
        <table className="pvb-paytable">
          <thead>
            <tr>
              <th>Technology</th>
              <th>MW at $1B</th>
              <th>Annual savings</th>
              <th>Simple payback</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} className={`${r.cls}${i === bestIdx ? " pvb-py-best" : ""}`}>
                <td>
                  {r.label}
                  {i === bestIdx && <span className="pvb-py-badge">fastest</span>}
                </td>
                <td>{Math.round(r.mw)} MW</td>
                <td>${r.savings.toFixed(1)}M/yr</td>
                <td>~{Math.round(r.payback)} yrs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="pvb-paynote">
        Every option here takes {Math.round(fastest)}–{Math.round(slowest)} years to earn back its $1B from energy
        savings alone in {year} — longer than a battery's typical 15&ndash;20 year service life, and on the same
        order as (or longer than) a gas plant's 30&ndash;40 year life. None of these "pay for themselves" as a pure
        buy-vs.-avoid-buying play; the real case for either one depends on revenue this table doesn't count &mdash;
        capacity payments, ancillary services, or reliability value.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Battery daily rhythm                                                */
/* ------------------------------------------------------------------ */

function BatteryRhythmChart({ year, showTip, hideTip }: { year: YearKey; showTip: ShowTipFn; hideTip: () => void }) {
  const d = YEARS[year];
  const scale = 3.6;
  return (
    <div className="pvb-barchart">
      {Array.from({ length: 24 }, (_, i) => {
        const h = i + 1;
        const dis = d.batt_discharge[String(h)] ?? 0;
        const chg = d.batt_charge[String(h)] ?? 0;
        return (
          <div className="pvb-col" key={h}>
            <div className="pvb-stack">
              <div
                className="pvb-seg pvb-dis"
                style={{ height: dis * scale }}
                onMouseMove={(e) => showTip(e, [`HE${h} · discharging ${dis}% of days`])}
                onMouseLeave={hideTip}
              />
              <div
                className="pvb-seg pvb-chg"
                style={{ height: chg * scale }}
                onMouseMove={(e) => showTip(e, [`HE${h} · charging ${chg}% of days`])}
                onMouseLeave={hideTip}
              />
            </div>
            <div className="pvb-hlabel">{h}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Monthly economics                                                   */
/* ------------------------------------------------------------------ */

function MonthlyEconChart({ year, showTip, hideTip }: { year: YearKey; showTip: ShowTipFn; hideTip: () => void }) {
  const d = YEARS[year];
  const maxV = Math.max(...Object.values(d.econ_battery), ...Object.values(d.econ_peaker));
  const scale = 160 / maxV;
  return (
    <>
      <div className="pvb-monthchart">
        {MONTHS.map((mon, i) => {
          const m = i + 1;
          const b = d.econ_battery[String(m)];
          const p = d.econ_peaker[String(m)];
          return (
            <div className="pvb-mcol" key={mon}>
              <div
                className="pvb-mbar pvb-battery"
                style={{ height: b * scale }}
                onMouseMove={(e) => showTip(e, [`${mon} battery: $${b.toFixed(2)}M`])}
                onMouseLeave={hideTip}
              />
              <div
                className="pvb-mbar pvb-peaker"
                style={{ height: p * scale }}
                onMouseMove={(e) =>
                  showTip(e, [`${mon} peaker: $${p.toFixed(2)}M (${d.econ_peaker_hrs[String(m)]} hrs, gas $${d.gas_price_month[String(m)]}/MMBtu)`])
                }
                onMouseLeave={hideTip}
              />
            </div>
          );
        })}
      </div>
      <div className="pvb-monthlabels">
        {MONTHS.map((mon) => (
          <span key={mon}>{mon}</span>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Method & honest caveats                                             */
/* ------------------------------------------------------------------ */

function Caveats() {
  return (
    <div className="pvb-caveats">
      <p>
        <b>Source:</b> real 15-minute LZ_AEN (Austin Energy's home load zone) settlement prices, pulled directly
        from Chris Gillett's public dataset (chrisgillett.org/ae-congestion). 105,216 real intervals across
        2023&ndash;2025; this page shows 2024 and 2025, the two most recent full years without an extreme outlier
        event skewing the picture.
      </p>
      <p>
        <b>Savings, not merchant revenue:</b> every dollar figure on this page is framed as Austin Energy's own cost
        avoidance, not sales revenue. AE serves its own native load, so when the peaker runs (or the battery
        discharges), the value is AE <i>not having to buy</i> that megawatt-hour from the ERCOT market at the
        real-time LZ price &mdash; it pays its own marginal cost instead and keeps the spread. That's the same size
        number a merchant owner would earn selling the identical MWh into the market at that price &mdash; it's a
        different accounting frame, not a different dollar amount: savings against a counterfactual purchase, rather
        than revenue from a sale. AE could instead choose to sell surplus output directly into ERCOT for real market
        revenue, but that's a different business decision than the one modeled here.
      </p>
      <p>
        <b>Independent of the day-ahead market and AE's PPA contracts?</b> Yes. Every number on this page is
        benchmarked only against the real-time LZ_AEN settlement price &mdash; the model never touches Austin
        Energy's day-ahead market trades or its separately-contracted wind, solar, and nuclear PPAs, which are
        untouched, parallel parts of AE's portfolio. That's the economically correct comparison for a physical
        dispatch decision: whether to burn fuel or discharge a battery in a given 15-minute interval is a real-time
        call, so real-time price is the right yardstick for it regardless of what AE did in the day-ahead market the
        day before. One simplification worth naming: to the extent AE had already locked in some of that hour's
        supply via a day-ahead purchase, its true avoided cost for that specific interval could differ slightly from
        the real-time print used here. AE's actual day-ahead trading book isn't in this dataset, so real-time price
        stands in as the standard, defensible proxy &mdash; not a claim that this is exactly how AE's books settle.
      </p>
      <p>
        <b>Gas price volatility &mdash; now modeled, not assumed:</b> the peaker's cost line uses real EIA Henry Hub
        monthly average prices, not one fixed number. Those actually ranged from <b>$1.49/MMBtu (March 2024)</b> to{" "}
        <b>$4.19/MMBtu (February 2025)</b> &mdash; a nearly 3&times; swing &mdash; which moves the peaker's marginal
        cost from roughly <b>$20/MWh to $49/MWh</b> month to month. 2024 was a historically cheap gas year; 2025 was
        not. This is still only the past: nothing here forecasts where gas prices go from here, and that uncertainty
        cuts both ways for the peaker's future economics. (Sep&ndash;Dec 2025 gas prices are estimated from EIA's
        reported full-year average and its note that prices "gradually rose" into a late-year cold-snap spike, not
        exact reported monthly figures like the rest of the series.)
      </p>
      <p>
        <b>Decommissioning:</b> excluded from the peaker's marginal cost here &mdash; correctly. The turn-on/turn-off
        decision depends on short-run fuel + variable O&amp;M cost, not sunk or period charges like a decommissioning
        reserve, which get paid whether or not the plant runs that day. Separately, for what it's worth: Lazard's own
        cost modeling assumes a gas plant's decommissioning and site-restoration cost is offset by its salvage value
        &mdash; net cost of essentially zero &mdash; unlike nuclear, where Lazard's figures do carry real
        decommissioning cost. So even in a full lifecycle-cost view, gas decommissioning isn't the number to worry
        about here.
      </p>
      <p>
        <b>Battery model:</b> perfect-foresight daily dispatch &mdash; discharge the actual priciest hours of each
        real day, charge the actual cheapest, 85% round-trip efficiency, now at 2-hour duration. This is a
        theoretical ceiling, not an achieved result: real ERCOT-wide merchant batteries earned roughly{" "}
        <b>$29&ndash;36K/MW-year</b> (arbitrage plus ancillary combined) as of mid-2026 &mdash; below the
        $60&ndash;70K/MW-year this model shows even at 2 hours, because no real operator dispatches on tomorrow's
        prices today.
      </p>
      <p>
        <b>Peaker model:</b> runs only in intervals where real price clears that month's real marginal cost, earning
        the margin above it. This assumes it's allowed to run every time it's economic &mdash; it doesn't model AE's
        own emissions guardrails on the plant, which are undisclosed and could cap it well below these hours
        regardless of price.
      </p>
      <p>
        <b>Duration finding, one more caveat:</b> "shorter wins" here is about energy arbitrage specifically. It
        doesn't capture capacity/reliability credit, ancillary services, or multi-day resilience &mdash; and
        interestingly, even on capacity credit, CAISO has been cutting the accreditation value of 4-hour batteries as
        more of them come online, for unrelated reasons. None of that changes the "not needed for the seven-day
        problem" framing you started from &mdash; that's still the existing thermal fleet's job.
      </p>
      <p>
        <b>Not modeled:</b> capital cost recovery for either technology (operating margin only, not full IRR); future
        load growth (Austin's own Load Growth Estimator tool models new data centers, EVs, and development
        separately, but nothing yet links projected demand growth to future price levels).
      </p>
      <p>
        Treat every number on this page as <i>&ldquo;what 2024 and 2025 actually looked like,&rdquo;</i> not a
        forecast of what a newly built plant would earn in 2030.
      </p>
    </div>
  );
}

function SourcesFooter() {
  return (
    <footer className="pvb-src">
      Sources:{" "}
      {SOURCES.map((s, i) => (
        <span key={s.title}>
          {i > 0 && " · "}
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
              {s.title}
            </a>
          ) : (
            s.title
          )}
        </span>
      ))}
      .
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function PeakerVsBattery() {
  const [year, setYear] = useState<YearKey>("2024");
  const { tip, showTip, hideTip } = useTooltip();

  return (
    <div className="peaker-vs-battery">
      <div className="pvb-page">
        <div className="pvb-kicker">Secret Vote &middot; Real dispatch data</div>
        <h1>Peaker vs. Battery</h1>
        <p className="pvb-dek">
          Real 15-minute Austin load-zone prices for 2024 and 2025 &mdash; the two most recent full, non-extreme
          years &mdash; run through the dispatch logic each technology actually uses: <b>a battery discharges its
          priciest hours and charges its cheapest</b>, <b>a peaker only turns on once price clears its real,
          month-by-month fuel cost</b>. At $1B, that's &asymp;485&nbsp;MW of 2-hour battery or &asymp;400&nbsp;MW of
          peaker &mdash; a 2-hour battery, not 4, because a shorter battery turns out to earn more per dollar once
          you let the existing gas and coal fleet keep covering the long events (see &ldquo;How much duration&rdquo;
          below).
        </p>

        <div className="pvb-yeartabs">
          <button className={year === "2024" ? "pvb-active" : ""} onClick={() => setYear("2024")}>
            2024
          </button>
          <button className={year === "2025" ? "pvb-active" : ""} onClick={() => setYear("2025")}>
            2025
          </button>
          <span className="pvb-yearnote">{year === "2024" ? "cheap-gas year" : "elevated-gas year"}</span>
        </div>

        <HeroTiles year={year} />

        <section className="pvb-panel">
          <h2>When would each one actually run?</h2>
          <p className="pvb-sub">
            Average real price by month and hour of day. The peaker's cost line moves with the real Henry Hub gas
            price each month (&#8776;$20&ndash;49/MWh across these two years, not one fixed number &mdash; see
            caveats). The marker shows hours where it clears in <b>most</b> of that month-hour's real intervals. The
            battery panel shows the mirror question: how often that hour was among its top-2 priciest hours of the
            day, i.e. when it would be discharging.
          </p>
          <HeatSection year={year} showTip={showTip} hideTip={hideTip} />
        </section>

        <section className="pvb-panel">
          <h2>How much battery duration do you actually need?</h2>
          <p className="pvb-sub">
            Both axes come from the same $1B, but they're not the same <i>kind</i> of number. The bar's x-position
            (MW) is what that $1B <b>buys</b> &mdash; Lazard's real installed-cost data says longer duration costs
            more per MW, so $1B buys fewer of them. The bar's height ($) is what that capacity would have{" "}
            <b>earned in one real year</b> of 2024/2025 prices &mdash; revenue minus running cost only, the same
            operating-margin math as everywhere else on this page. It is <b>not</b> profit net of the $1B build, and
            it doesn't amortize or pay down that capex at all &mdash; see the note below the chart.
          </p>
          <DurationChart year={year} showTip={showTip} hideTip={hideTip} />
        </section>

        <section className="pvb-panel">
          <h2>How the savings actually work</h2>
          <p className="pvb-sub">
            One real number drives every dollar figure on this page: the gap between what Austin Energy would have
            paid ERCOT for a megawatt-hour and what it actually costs the asset to supply that megawatt-hour itself.
            Stack them and the relationship is literal &mdash; the bar is the real-time price avoided; the grey base
            is what it costs to earn that; what's left on top is the margin.
          </p>
          <SavingsEquation year={year} showTip={showTip} hideTip={hideTip} />
        </section>

        <section className="pvb-panel">
          <h2>Does this pay for itself?</h2>
          <p className="pvb-sub">
            Same $1B, same real prices for the selected year &mdash; annual savings against Austin Energy simply
            buying that power from ERCOT, and a rough, undiscounted years-to-break-even. This ignores financing,
            taxes, capacity payments, ancillary services, and everything else that would actually make or break a
            real investment case &mdash; it's the floor, not the full case.
          </p>
          <PaybackTable year={year} />
        </section>

        <section className="pvb-panel">
          <h2>The battery's daily rhythm</h2>
          <p className="pvb-sub">
            How often each hour of the day falls among the battery's cheapest 2 hours (charge) or priciest 2 hours
            (discharge), across every real day in the year. A peaker has no equivalent &mdash; it either clears its
            cost or it doesn't; it can't buy cheap power to sell later.
          </p>
          <div className="pvb-legend">
            <span>
              <span className="pvb-sw" style={{ background: "var(--pvb-battery)" }} />
              Charging window
            </span>
            <span>
              <span className="pvb-sw" style={{ background: "var(--pvb-peaker)" }} />
              Discharging window
            </span>
          </div>
          <BatteryRhythmChart year={year} showTip={showTip} hideTip={hideTip} />
        </section>

        <section className="pvb-panel">
          <h2>Monthly economics</h2>
          <p className="pvb-sub">
            What each technology would have captured per month, at the $1B-equivalent scale (485&nbsp;MW/2-hr
            battery vs. 400&nbsp;MW peaker) &mdash; battery: perfect-foresight arbitrage spread; peaker: operating
            margin above its real monthly fuel + O&amp;M cost, only in hours it clears.
          </p>
          <div className="pvb-legend">
            <span>
              <span className="pvb-sw" style={{ background: "var(--pvb-battery)" }} />
              Battery ($M)
            </span>
            <span>
              <span className="pvb-sw" style={{ background: "var(--pvb-peaker)" }} />
              Peaker ($M)
            </span>
          </div>
          <MonthlyEconChart year={year} showTip={showTip} hideTip={hideTip} />
        </section>

        <section className="pvb-panel">
          <h2>Method &amp; honest caveats</h2>
          <Caveats />
          <SourcesFooter />
        </section>
      </div>

      <Tooltip tip={tip} />
    </div>
  );
}
