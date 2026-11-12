// Utility Innovation Registry: small visual pieces (pills, status bar, bars, completeness meter).
import type { CSSProperties } from "react";
import type { Confidence, Status } from "./utility-registry-data";
import { STATUS_ORDER } from "./utility-registry-data";
import { STATUS_VAR } from "./utility-registry-engine";

export function StatusPill({ status }: { status: Status }) {
  return <span className="pill" style={{ "--c": `var(${STATUS_VAR[status]})` } as CSSProperties}>{status}</span>;
}

export function ColorPill({ label, cssVar }: { label: string; cssVar: string }) {
  return <span className="pill" style={{ "--c": `var(${cssVar})` } as CSSProperties}>{label}</span>;
}

export function ConfidenceDot({ level }: { level: Confidence }) {
  return <span className={`conf ${level}`}><i />{level}</span>;
}

export function SourceList({ sources }: { sources: { title: string; url: string }[] }) {
  return (
    <ul className="src">
      {sources.map((s) => (
        <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>
      ))}
    </ul>
  );
}

/** Stacked bar of records by status, with a legend. */
export function StatusBar({ statuses }: { statuses: Status[] }) {
  const counts = STATUS_ORDER.map((s) => [s, statuses.filter((x) => x === s).length] as const).filter(([, n]) => n > 0);
  return (
    <div className="statusbar">
      <div className="bar" role="img" aria-label="Records by status">
        {counts.map(([s, n]) => <i key={s} style={{ width: `${(n / statuses.length) * 100}%`, background: `var(${STATUS_VAR[s]})` }} />)}
      </div>
      <div className="legend">
        {counts.map(([s, n]) => <span key={s}><i style={{ background: `var(${STATUS_VAR[s]})` }} />{s} {n}</span>)}
      </div>
    </div>
  );
}

/** Colored legend for a set of labeled counts. */
export function KeyLegend({ items }: { items: { label: string; cssVar: string; n: number }[] }) {
  return (
    <div className="legend" style={{ marginTop: 14 }}>
      {items.map((i) => <span key={i.label}><i style={{ background: `var(${i.cssVar})` }} />{i.label} {i.n}</span>)}
    </div>
  );
}

/** Horizontal bar used in table cells. value and max are in the same unit. */
export function BarCell({ value, max }: { value: number | null; max: number }) {
  return <td className="bar2">{value ? <i style={{ width: `${Math.max(1, (value / max) * 100)}%` }} /> : null}</td>;
}

/** Completeness meter for the pilot form: one segment per required field. */
export function Meter({ flags, missing }: { flags: boolean[]; missing: string[] }) {
  const filled = flags.filter(Boolean).length;
  return (
    <div className="meter">
      <div className="mbar" aria-hidden="true">
        {flags.map((on, i) => <i key={i} className={on ? "on" : ""} />)}
      </div>
      <div className="txt" role="status" aria-live="polite">
        {filled} of {flags.length} pre-registration fields filled.
        {missing.length > 0 && <span className="miss"> Missing: {missing.join(", ")}.</span>}
      </div>
    </div>
  );
}
