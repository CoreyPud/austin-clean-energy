import React from "react";
import "./innovation-gap.css";
import {
  intro,
  threads,
  trends,
  footnote,
  GapThread,
  Milestone,
  TrendPoint,
  CommitmentStat,
} from "./innovation-gap-data";

function yearToPct(year: number, start: number, end: number) {
  return ((year - start) / (end - start)) * 100;
}

function Axis({ thread }: { thread: GapThread }) {
  const { axisStart, axisEnd, axisTicks, peer, peerOthers, ae } = thread;
  const peerPct = yearToPct(peer.year, axisStart, axisEnd);
  const aePct = ae ? yearToPct(ae.year, axisStart, axisEnd) : null;
  const todayPct = yearToPct(2026.7, axisStart, axisEnd);

  const gapLeft = aePct !== null ? Math.min(peerPct, aePct) : peerPct;
  const gapRight = aePct !== null ? Math.max(peerPct, aePct) : todayPct;

  return (
    <div className="igp-axis" tabIndex={0} role="region" aria-label={`${thread.kicker} timeline`}>
    <div className="igp-axis-track">
      <div className="igp-axis-line" />
      {axisTicks.map((t) => (
        <div key={t} className="igp-axis-tick" style={{ left: `${yearToPct(t, axisStart, axisEnd)}%` }}>
          <span className="igp-axis-tick-mark" />
          <span className="igp-axis-tick-label">{t}</span>
        </div>
      ))}

      <div className="igp-axis-gap" style={{ left: `${gapLeft}%`, width: `${gapRight - gapLeft}%` }}>
        <span className="igp-axis-gap-label">{thread.gapLabel}</span>
      </div>

      <div className="igp-axis-marker igp-axis-marker-peer" style={{ left: `${peerPct}%` }}>
        <span className="igp-axis-dot" />
        <span className="igp-axis-marker-tag">{peer.who}</span>
      </div>

      {peerOthers?.map((m) => (
        <div
          key={m.who}
          className="igp-axis-marker igp-axis-marker-peer igp-axis-marker-peer-secondary"
          style={{ left: `${yearToPct(m.year, axisStart, axisEnd)}%` }}
        >
          <span className="igp-axis-dot igp-axis-dot-secondary" />
        </div>
      ))}

      {ae && aePct !== null ? (
        <div className="igp-axis-marker igp-axis-marker-ae" style={{ left: `${aePct}%` }}>
          <span className="igp-axis-dot" />
          <span className="igp-axis-marker-tag">Austin Energy</span>
        </div>
      ) : (
        <div className="igp-axis-marker igp-axis-marker-none" style={{ left: `${todayPct}%` }}>
          <span className="igp-axis-dot igp-axis-dot-none" />
          <span className="igp-axis-marker-tag">Austin Energy — no program</span>
        </div>
      )}
    </div>
    </div>
  );
}

function MilestoneCard({ m, tone }: { m: Milestone; tone: "peer" | "ae" }) {
  return (
    <div className={`igp-card igp-card-${tone}`}>
      <div className="igp-card-meta">
        <span className="igp-card-who">{m.who}</span>
        <span className="igp-card-date">{m.date}</span>
      </div>
      <h4>{m.label}</h4>
      <p>{m.detail}</p>
      {m.sourceUrl ? (
        <a className="igp-source" href={m.sourceUrl} target="_blank" rel="noopener noreferrer">
          Source: {m.sourceLabel} &rarr;
        </a>
      ) : (
        <span className="igp-source igp-source-plain">Source: {m.sourceLabel}</span>
      )}
    </div>
  );
}

function TrendChart({ series }: { series: TrendPoint[] }) {
  const W = 640;
  const H = 220;
  const M = { top: 16, right: 16, bottom: 28, left: 42 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;

  const years = series.map((p) => p.year);
  const xMin = Math.min(...years);
  const xMax = Math.max(...years);
  const maxDays = Math.max(...series.map((p) => p.days));
  const yMax = Math.ceil((maxDays * 1.15) / 50) * 50;
  const yTicks = [0, yMax / 2, yMax];

  const x = (yr: number) => M.left + ((yr - xMin) / (xMax - xMin)) * plotW;
  const y = (d: number) => M.top + plotH - (d / yMax) * plotH;

  const solid = series.filter((p) => !p.provisional);
  const provIdx = series.findIndex((p) => p.provisional);
  const solidPath = solid.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year)},${y(p.days)}`).join(" ");

  return (
    <svg
      className="igp-trend-svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Trend chart, ${xMin} to ${xMax}`}
    >
      {yTicks.map((t) => (
        <g key={t}>
          <line className="igp-trend-gridline" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text className="igp-trend-axis-label" x={M.left - 8} y={y(t) + 4} textAnchor="end">
            {Math.round(t)}
          </text>
        </g>
      ))}
      <line className="igp-trend-baseline" x1={M.left} y1={M.top + plotH} x2={W - M.right} y2={M.top + plotH} />
      {series.map((p) => (
        <text key={p.year} className="igp-trend-axis-label" x={x(p.year)} y={M.top + plotH + 18} textAnchor="middle">
          {p.year}
        </text>
      ))}
      <path className="igp-trend-line" d={solidPath} />
      {provIdx > 0 && (
        <path
          className="igp-trend-line igp-trend-line-provisional"
          d={`M${x(series[provIdx - 1].year)},${y(series[provIdx - 1].days)} L${x(series[provIdx].year)},${y(
            series[provIdx].days
          )}`}
        />
      )}
      {series.map((p) => (
        <circle
          key={p.year}
          className={p.provisional ? "igp-trend-dot igp-trend-dot-provisional" : "igp-trend-dot"}
          cx={x(p.year)}
          cy={y(p.days)}
          r="4"
        />
      ))}
      {solid.length > 0 && (
        <text
          className="igp-trend-direct-label"
          x={x(solid[solid.length - 1].year) - 8}
          y={y(solid[solid.length - 1].days) - 10}
          textAnchor="end"
        >
          {Math.round(solid[solid.length - 1].days)} days
        </text>
      )}
    </svg>
  );
}

function CommitmentCard({ c }: { c: CommitmentStat }) {
  return (
    <div className={`igp-card igp-card-${c.tone}`}>
      <div className="igp-card-meta">
        <span className="igp-card-who">{c.who}</span>
      </div>
      <h4>{c.value}</h4>
      <p>{c.detail}</p>
      {c.sourceUrl ? (
        <a className="igp-source" href={c.sourceUrl} target="_blank" rel="noopener noreferrer">
          Source: {c.sourceLabel} &rarr;
        </a>
      ) : (
        <span className="igp-source igp-source-plain">Source: {c.sourceLabel}</span>
      )}
    </div>
  );
}

export default function InnovationGap() {
  return (
    <main className="igp-page">
      <header className="igp-header">
        <div className="igp-kicker">
          <span className="igp-kicker-rule" />
          {intro.kicker}
        </div>
      </header>

      <div className="igp-threads">
        {threads.map((t) => (
          <section className="igp-thread" key={t.id}>
            <div className="igp-thread-kicker">{t.kicker}</div>
            <h2>{t.title}</h2>
            <p className="igp-thread-dek">{t.dek}</p>

            <Axis thread={t} />

            <div className="igp-cards">
              <MilestoneCard m={t.peer} tone="peer" />
              {t.peerOthers?.map((m) => (
                <MilestoneCard key={m.who} m={m} tone="peer" />
              ))}
              {t.ae && <MilestoneCard m={t.ae} tone="ae" />}
            </div>

            <p className="igp-note">{t.note}</p>
          </section>
        ))}
      </div>

      <div className="igp-threads igp-trends">
        {trends.map((t) => (
          <section className="igp-thread" key={t.id}>
            <div className="igp-thread-kicker">{t.kicker}</div>
            <h2>{t.title}</h2>
            <p className="igp-thread-dek">{t.dek}</p>

            <div className="igp-trend-label">{t.seriesLabel}</div>
            <TrendChart series={t.series} />

            <div className="igp-cards">
              {t.commitments.map((c) => (
                <CommitmentCard key={c.who} c={c} />
              ))}
            </div>

            <p className="igp-note">{t.note}</p>
          </section>
        ))}
      </div>

      <footer className="igp-footnote">{footnote}</footer>
    </main>
  );
}
