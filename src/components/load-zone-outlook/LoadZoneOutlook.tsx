import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./load-zone-outlook.css";
import { texasBoundary } from "./texas-boundary";
import SupplyDemandTable from "./SupplyDemandTable";
import {
  projection20yr,
  projectionReadout,
  methodologyNote,
  crossChecks,
  contractStack,
  contractStackTotals,
  replacementAssumption,
  namedLoadProjects,
  aggregateLoadPipeline,
  supplyDemandFraming,
  valueOfSolarRate,
  vosComponents,
  vosDataGap,
  gasEnablesRenewablesClaim,
  liveTrackerPlan,
  combinedLoadsForMap,
  combinedGenerationForMap,
  cleanviewPlannedSolar,
  cleanviewPlannedBatteries,
  cleanviewDataCenters,
  namedLoadMapPoints,
  eia860GeneratorFleet,
  aeEiaFleetOperable,
  aeEiaFleetRetired,
  aeEiaNote,
  ercotRetiringSoon,
  ercotProposedLargeGasNuclear,
  ercotProposedFuelMix,
  combinedGeneratorsForMap,
  mapDataNote,
  MapPoint,
  Tag,
} from "./load-zone-outlook-data";

// Six well-known Texas cities, included only as geographic reference points
// on the map below — not part of the loads/generation dataset.
const REFERENCE_CITIES: { name: string; lat: number; lon: number }[] = [
  { name: "Austin", lat: 30.2672, lon: -97.7431 },
  { name: "Dallas–Fort Worth", lat: 32.7767, lon: -96.797 },
  { name: "San Antonio", lat: 29.4241, lon: -98.4936 },
  { name: "Houston", lat: 29.7601, lon: -95.3701 },
  { name: "Lubbock", lat: 33.5779, lon: -101.8552 },
  { name: "Corpus Christi", lat: 27.8006, lon: -97.3964 },
];

const MAP_WIDTH = 720;

const CATEGORY_COLOR: Record<string, string> = {
  load: "hsl(var(--destructive))",
  solar: "hsl(var(--accent))",
  battery: "hsl(var(--secondary))",
  "generator-current": "hsl(var(--primary))",
  "generator-retiring": "hsl(var(--destructive))",
  "generator-proposed": "hsl(var(--primary))",
};

function radiusFor(mw: number | null): number {
  if (!mw) return 4.5;
  return Math.min(14, Math.max(3.5, Math.sqrt(mw) * 0.55));
}

// Shape encodes the category GROUP (demand / existing supply / retiring
// supply / proposed supply) on top of color, so the two generator layers
// that share a color (current vs. proposed) stay visually distinct, and a
// retiring plant reads as "hollowing out" rather than just "another load".
function MapMarker({ p, x, y, onEnter, onLeave, onClick }: { p: MapPoint; x: number; y: number; onEnter: () => void; onLeave: () => void; onClick: () => void }) {
  const r = radiusFor(p.mw);
  const color = CATEGORY_COLOR[p.category] ?? "hsl(var(--muted-foreground))";
  const common = {
    className: "lzo-map-point",
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    onClick,
    role: "button",
    tabIndex: 0,
    "aria-label": p.name,
    onFocus: onEnter,
    onBlur: onLeave,
    onKeyDown: (event: React.KeyboardEvent<SVGElement>) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onClick(); }
    },
  };
  if (p.category === "generator-retiring") {
    // hollow ring = existing capacity that is scheduled to go away
    return <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2.25} {...common} style={{ stroke: color, strokeWidth: 2.25 }}><title>{p.name}</title></circle>;
  }
  if (p.category === "generator-current") {
    // filled square = Austin Energy's own currently-operating plants
    return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} fill={color} {...common}><title>{p.name}</title></rect>;
  }
  if (p.category === "generator-proposed") {
    // upward triangle = future / not-yet-built capacity
    const pts = `${x},${y - r * 1.15} ${x - r},${y + r * 0.85} ${x + r},${y + r * 0.85}`;
    return <polygon points={pts} fill={color} {...common}><title>{p.name}</title></polygon>;
  }
  return <circle cx={x} cy={y} r={r} fill={color} {...common}><title>{p.name}</title></circle>;
}

function LoadZoneMap() {
  const [showLoads, setShowLoads] = useState(true);
  const [showSolar, setShowSolar] = useState(true);
  const [showBattery, setShowBattery] = useState(true);
  const [showGenCurrent, setShowGenCurrent] = useState(true);
  const [showGenRetiring, setShowGenRetiring] = useState(true);
  const [showGenProposed, setShowGenProposed] = useState(true);
  const [hoverPoint, setHoverPoint] = useState<MapPoint | null>(null);
  const [pinnedPoint, setPinnedPoint] = useState<MapPoint | null>(null);

  const bounds = useMemo(() => {
    const all = [
      ...combinedLoadsForMap,
      ...combinedGenerationForMap,
      ...combinedGeneratorsForMap,
      ...REFERENCE_CITIES,
      ...texasBoundary.map(([lon, lat]) => ({ lon, lat })),
    ];
    const lats = all.map((p) => p.lat);
    const lons = all.map((p) => p.lon);
    const pad = 0.4;
    return {
      latMin: Math.min(...lats) - pad,
      latMax: Math.max(...lats) + pad,
      lonMin: Math.min(...lons) - pad,
      lonMax: Math.max(...lons) + pad,
    };
  }, []);

  const mapHeight = useMemo(() => {
    const midLatRad = ((bounds.latMin + bounds.latMax) / 2) * (Math.PI / 180);
    const lonSpan = (bounds.lonMax - bounds.lonMin) * Math.cos(midLatRad);
    const latSpan = bounds.latMax - bounds.latMin;
    return Math.round(MAP_WIDTH * (latSpan / lonSpan));
  }, [bounds]);

  function project(lat: number, lon: number) {
    const x = ((lon - bounds.lonMin) / (bounds.lonMax - bounds.lonMin)) * MAP_WIDTH;
    const y = ((bounds.latMax - lat) / (bounds.latMax - bounds.latMin)) * mapHeight;
    return { x, y };
  }

  const active = hoverPoint ?? pinnedPoint;
  const hoverPosition = hoverPoint ? project(hoverPoint.lat, hoverPoint.lon) : null;
  const texasPath = texasBoundary.map(([lon, lat], index) => {
    const { x, y } = project(lat, lon);
    return `${index === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ") + " Z";

  const visiblePoints: MapPoint[] = [
    ...(showLoads ? combinedLoadsForMap : []),
    ...(showSolar ? cleanviewPlannedSolar : []),
    ...(showBattery ? cleanviewPlannedBatteries : []),
    ...(showGenCurrent ? aeEiaFleetOperable : []),
    ...(showGenRetiring ? ercotRetiringSoon : []),
    ...(showGenProposed ? ercotProposedLargeGasNuclear : []),
  ];

  return (
    <div>
      <div className="lzo-map-controls">
        <label className="lzo-map-toggle">
          <input type="checkbox" checked={showLoads} onChange={(e) => setShowLoads(e.target.checked)} />
          <span className="lzo-legend-dot" style={{ background: CATEGORY_COLOR.load }} />
          Loads ({combinedLoadsForMap.length})
        </label>
        <label className="lzo-map-toggle">
          <input type="checkbox" checked={showSolar} onChange={(e) => setShowSolar(e.target.checked)} />
          <span className="lzo-legend-dot" style={{ background: CATEGORY_COLOR.solar }} />
          New solar ({cleanviewPlannedSolar.length})
        </label>
        <label className="lzo-map-toggle">
          <input type="checkbox" checked={showBattery} onChange={(e) => setShowBattery(e.target.checked)} />
          <span className="lzo-legend-dot" style={{ background: CATEGORY_COLOR.battery }} />
          New battery storage ({cleanviewPlannedBatteries.length})
        </label>
        <label className="lzo-map-toggle">
          <input type="checkbox" checked={showGenCurrent} onChange={(e) => setShowGenCurrent(e.target.checked)} />
          <span className="lzo-legend-swatch lzo-legend-swatch-square" style={{ background: CATEGORY_COLOR["generator-current"] }} />
          AE's own plants ({aeEiaFleetOperable.length})
        </label>
        <label className="lzo-map-toggle">
          <input type="checkbox" checked={showGenRetiring} onChange={(e) => setShowGenRetiring(e.target.checked)} />
          <span className="lzo-legend-swatch lzo-legend-swatch-ring" style={{ borderColor: CATEGORY_COLOR["generator-retiring"] }} />
          Retiring (announced) ({ercotRetiringSoon.length})
        </label>
        <label className="lzo-map-toggle">
          <input type="checkbox" checked={showGenProposed} onChange={(e) => setShowGenProposed(e.target.checked)} />
          <span className="lzo-legend-swatch lzo-legend-swatch-triangle" style={{ borderBottomColor: CATEGORY_COLOR["generator-proposed"] }} />
          Proposed gas/nuclear ({ercotProposedLargeGasNuclear.length})
        </label>
      </div>

      <div className="lzo-map-wrap">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${mapHeight}`}
          width="100%"
          height="auto"
          role="img"
          aria-label="Map of Texas loads, new planned solar and battery generation, and EIA-reported current/retiring/proposed generators"
          onMouseLeave={() => setHoverPoint(null)}
        >
          <rect x={0} y={0} width={MAP_WIDTH} height={mapHeight} className="lzo-map-bg" />
          <path d={texasPath} className="lzo-map-texas" />
          <text x={project(31.4, -101).x} y={project(31.4, -101).y} className="lzo-map-state-label">TEXAS</text>
          {REFERENCE_CITIES.map((c) => {
            const { x, y } = project(c.lat, c.lon);
            return (
              <g key={c.name}>
                <circle cx={x} cy={y} r={2} className="lzo-map-city-dot" />
                <text x={x + 5} y={y + 3} className="lzo-map-city-label">
                  {c.name}
                </text>
              </g>
            );
          })}
          {visiblePoints.map((p, i) => {
            const { x, y } = project(p.lat, p.lon);
            return (
              <MapMarker
                key={`${p.category}-${p.name}-${i}`}
                p={p}
                x={x}
                y={y}
                onEnter={() => setHoverPoint(p)}
                onLeave={() => setHoverPoint(null)}
                onClick={() => setPinnedPoint(pinnedPoint?.name === p.name ? null : p)}
              />
            );
          })}
        </svg>
        {hoverPoint && hoverPosition && (
          <div
            role="tooltip"
            className={`lzo-map-tooltip ${hoverPosition.x > MAP_WIDTH / 2 ? "lzo-map-tooltip-left" : ""} ${hoverPosition.y > mapHeight / 2 ? "lzo-map-tooltip-above" : ""}`}
            style={{ left: `${hoverPosition.x / MAP_WIDTH * 100}%`, top: `${hoverPosition.y / mapHeight * 100}%` }}
          >
            <MapPointDetails point={hoverPoint} />
          </div>
        )}
      </div>

      <div className="lzo-map-detail">
        {active ? (
          <MapPointDetails point={active} />
        ) : (
          <div className="lzo-map-detail-hint">Hover or tap a point for details. Squares = Austin Energy's own plants · hollow rings = scheduled to retire · triangles = proposed/not yet built.</div>
        )}
      </div>
    </div>
  );
}

function MapPointDetails({ point }: { point: MapPoint }) {
  const categoryLabels: Record<string, string> = {
    load: "Electricity demand", solar: "Planned solar", battery: "Planned battery storage",
    "generator-current": "Operating generator", "generator-retiring": "Generator scheduled to retire",
    "generator-proposed": "Proposed generator",
  };
  return <>
    <div className="lzo-map-detail-name">{point.name} <TagBadge tag={point.tag} /></div>
    <div className="lzo-map-detail-row">{categoryLabels[point.category] ?? point.category}</div>
    <div className="lzo-map-detail-row"><strong>Size:</strong> {point.mw == null ? "Not reported" : `${point.mw.toLocaleString()} MW`}</div>
    <div className="lzo-map-detail-row"><strong>Timing:</strong> {point.year === "n/a" ? "Not reported" : point.year}</div>
    <div className="lzo-map-detail-row">{point.detail}</div>
    <div className="lzo-map-detail-precision">Location: {point.precision === "exact-site" ? "reported site coordinates" : point.precision === "county-centroid" ? "county centroid, not the exact site" : "city-level approximation"}</div>
  </>;
}

function TagBadge({ tag }: { tag: Tag }) {
  const labels: Record<Tag, string> = {
    reported: "Reported",
    derived: "Derived",
    benchmarked: "Benchmarked",
    scenario: "Scenario",
    blocked: "Not available",
  };
  return <span className={`lzo-tag lzo-tag-${tag}`}>{labels[tag]}</span>;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function LoadZoneOutlook() {
  const chartData = useMemo(
    () =>
      projection20yr.map((row) => ({
        year: row.year,
        Low: Math.round(row.low.total * 100) / 100,
        Base: Math.round(row.base.total * 100) / 100,
        High: Math.round(row.high.total * 100) / 100,
      })),
    []
  );

  const row2026 = projection20yr[0];
  const row2035 = projection20yr.find((r) => r.year === 2035);
  const row2045 = projection20yr.find((r) => r.year === 2045);

  if (!row2026 || !row2035 || !row2045) return null;

  return (
    <main className="lzo-root">
      {/* ---------------- 1. THE PROJECTION ---------------- */}
      <section className="lzo-section">
        <h2 className="lzo-section-title">
          Projected wholesale price, 2026–2045 <TagBadge tag="derived" />
        </h2>
        <p className="lzo-section-lede">{methodologyNote.summary}</p>

        <div className="lzo-chart-card">
          <div className="lzo-chart-legend">
            <span><span className="lzo-legend-dot" style={{ background: "hsl(var(--muted-foreground))" }} />Low</span>
            <span><span className="lzo-legend-dot" style={{ background: "hsl(var(--primary))" }} />Base</span>
            <span><span className="lzo-legend-dot" style={{ background: "hsl(var(--destructive))" }} />High</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                width={48}
                label={{ value: "$/MWh", angle: -90, position: "insideLeft", fontSize: 11 }}
              />
              <Tooltip
                formatter={(v: number) => `$${v.toFixed(2)}/MWh`}
                labelFormatter={(l) => `Year ${l}`}
              />
              <Line type="monotone" dataKey="Low" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Base" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="High" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>

          <div className="lzo-readout-row">
            <div className="lzo-readout-tile">
              <div className="label">2026 (Base)</div>
              <div className="value">${row2026.base.total.toFixed(2)}</div>
            </div>
            <div className="lzo-readout-tile">
              <div className="label">2035 (Base)</div>
              <div className="value">${row2035.base.total.toFixed(2)}</div>
            </div>
            <div className="lzo-readout-tile">
              <div className="label">2045 (Base)</div>
              <div className="value">${row2045.base.total.toFixed(2)}</div>
            </div>
          </div>
          <p style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))", marginTop: "0.6rem" }}>
            2026–2045 CAGR: Low {(projectionReadout.cagr.low * 100).toFixed(1)}% · Base{" "}
            {(projectionReadout.cagr.base * 100).toFixed(1)}% · High{" "}
            {(projectionReadout.cagr.high * 100).toFixed(1)}% per year <TagBadge tag="derived" />
          </p>
        </div>

        <div className="lzo-callout">
          <div className="lzo-callout-title">Why this rises even before load growth <TagBadge tag="scenario" /></div>
          <p style={{ margin: 0 }}>{replacementAssumption.note}</p>
        </div>

        <div className="lzo-callout">
          <div className="lzo-callout-title">Most speculative input <TagBadge tag="scenario" /></div>
          <p style={{ margin: 0 }}>{methodologyNote.speculativeFlag}</p>
        </div>

        <h3 style={{ fontSize: "1rem", marginTop: "1.5rem" }}>Cross-checks against independent forecasts</h3>
        <div className="lzo-table-wrap">
          <table className="lzo-table">
            <thead>
              <tr><th>Check</th><th>External benchmark</th><th>This model</th><th>Read</th></tr>
            </thead>
            <tbody>
              {crossChecks.map((c) => (
                <tr key={c.check}>
                  <td>{c.check} <TagBadge tag={c.tag} /></td>
                  <td>{c.benchmark}</td>
                  <td>{c.modelFigure}</td>
                  <td>{c.read}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------- 2 & 3. SUPPLY + DEMAND ---------------- */}
      <section className="lzo-section">
        <h2 className="lzo-section-title">Both sides of the ledger are expanding</h2>
        <p className="lzo-section-lede">{supplyDemandFraming.note} <TagBadge tag={supplyDemandFraming.tag} /></p>

        <div className="lzo-grid-2">
          <div className="lzo-panel">
            <div className="lzo-panel-title">Supply: the contracted/owned fleet <TagBadge tag="reported" /></div>
            <ul className="lzo-stat-list">
              <li><span className="metric">Total active capacity, 2026</span><span className="figure">{fmt(contractStackTotals.totalActiveMw)} MW</span></li>
              <li><span className="metric">Expiring within 2026–2045</span><span className="figure">{fmt(contractStackTotals.expiringInWindowMw)} MW (77%)</span></li>
            </ul>
            <div className="lzo-table-wrap" style={{ marginTop: "0.75rem", maxHeight: 260, overflowY: "auto" }}>
              <table className="lzo-table">
                <thead><tr><th>Resource</th><th>Fuel</th><th>MW</th><th>End</th></tr></thead>
                <tbody>
                  {contractStack.map((r) => (
                    <tr key={r.name}>
                      <td>{r.name}</td>
                      <td>{r.fuel}</td>
                      <td>{fmt(r.mw)}</td>
                      <td>{r.contractEnd === "open" ? "open" : r.contractEnd}{r.expiresInWindow ? "" : " *"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: "0.4rem" }}>
              * extends past the 2045 window.
            </p>
          </div>

          <div className="lzo-panel">
            <div className="lzo-panel-title">Demand: the large-load pipeline <TagBadge tag="reported" /></div>
            <ul className="lzo-stat-list">
              {aggregateLoadPipeline.map((m) => (
                <li key={m.metric}>
                  <span className="metric">{m.metric}</span>
                  <span className="figure">{m.figure}</span>
                </li>
              ))}
            </ul>
            <div className="lzo-table-wrap" style={{ marginTop: "0.75rem", maxHeight: 260, overflowY: "auto" }}>
              <table className="lzo-table">
                <thead><tr><th>Named project</th><th>In AE territory?</th><th>Scale</th></tr></thead>
                <tbody>
                  {namedLoadProjects.map((p) => (
                    <tr key={p.project}>
                      <td>{p.project}<br /><span style={{ color: "hsl(var(--muted-foreground))" }}>{p.location}</span></td>
                      <td>{p.inAeTerritory ? "Yes" : "No"}</td>
                      <td style={{ fontSize: "0.78rem" }}>{p.scale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 2.5 MAP: WHERE IT'S HAPPENING ---------------- */}
      <SupplyDemandTable />

      <section className="lzo-section">
        <h2 className="lzo-section-title">
          Where it's happening: loads and new generation on the map <TagBadge tag="reported" />
        </h2>
        <p className="lzo-section-lede">{mapDataNote.note}</p>

        <LoadZoneMap />

        <p style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))", marginTop: "0.6rem" }}>
          Loads: {namedLoadMapPoints.length} named projects (this project's own research) +{" "}
          {cleanviewDataCenters.length} from Cleanview's free Data Center tracker ={" "}
          {combinedLoadsForMap.length} total. New solar/battery: {cleanviewPlannedSolar.length} planned
          solar + {cleanviewPlannedBatteries.length} planned battery projects from Cleanview's free
          trackers. Generators: {aeEiaFleetOperable.length} of Austin Energy's own EIA-reported plants +{" "}
          {ercotRetiringSoon.length} ERCOT-wide plants with an announced retirement year +{" "}
          {ercotProposedLargeGasNuclear.length} of ERCOT's largest proposed gas/nuclear plants, all from
          EIA-860 (2026-10-23). Cleanview figures are Texas rows only, capped at whatever fits in its
          free 100-row-per-table limit; the EIA-860 generator layers are a curated subset of 2,185
          operable + 627 proposed + 326 retired ERCOT records — not the complete fleet.
        </p>

        <div className="lzo-callout" style={{ marginTop: "0.75rem" }}>
          <div className="lzo-callout-title">
            EIA-860 found — cross-checking Austin Energy's own fleet <TagBadge tag="reported" />
          </div>
          <p style={{ margin: "0 0 0.6rem" }}>{eia860GeneratorFleet.finding}</p>
          <p style={{ margin: 0 }}>{aeEiaNote.note}</p>
        </div>

        <div className="lzo-grid-2" style={{ marginTop: "0.75rem" }}>
          <div className="lzo-panel">
            <div className="lzo-panel-title">AE's EIA-reported fleet, already retired <TagBadge tag="reported" /></div>
            <div className="lzo-table-wrap">
              <table className="lzo-table">
                <thead><tr><th>Plant</th><th>MW</th><th>County</th></tr></thead>
                <tbody>
                  {aeEiaFleetRetired.map((r) => (
                    <tr key={r.name}>
                      <td>{r.name}<br /><span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.75rem" }}>{r.detail}</span></td>
                      <td>{fmt(r.mw)}</td>
                      <td>{r.county}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="lzo-panel">
            <div className="lzo-panel-title">ERCOT-wide proposed generation, by fuel (all 627 proposed units) <TagBadge tag="reported" /></div>
            <ul className="lzo-stat-list">
              {ercotProposedFuelMix.map((f) => (
                <li key={f.fuel}>
                  <span className="metric">{f.fuel}</span>
                  <span className="figure">{fmt(f.mw)} MW</span>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: "0.4rem" }}>
              For scale: AE's own 2026 gas peaker is 400 MW against an 18,580 MW statewide proposed-gas total.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- 4. AVOIDED COST / VALUE OF SOLAR ---------------- */}
      <section className="lzo-section">
        <h2 className="lzo-section-title">
          Does AE's own capex show up in the Value of Solar rate? <TagBadge tag="blocked" />
        </h2>
        <p className="lzo-section-lede">
          Austin Energy's current Value of Solar rate is{" "}
          <strong>{valueOfSolarRate.residentialRate}{valueOfSolarRate.unit}</strong> (residential and
          commercial systems under 1,000 kW-ac; {valueOfSolarRate.commercialRateOver1MW}
          {valueOfSolarRate.unit} above that), covering {valueOfSolarRate.periodLabel}.{" "}
          <TagBadge tag={valueOfSolarRate.tag} />
        </p>

        <div className="lzo-vos-grid">
          {vosComponents.map((c) => (
            <div className="lzo-vos-card" key={c.component}>
              <div className="name">{c.component}</div>
              <div>{c.howCalculated}</div>
            </div>
          ))}
        </div>

        <div className="lzo-callout lzo-callout-blocked">
          <div className="lzo-callout-title">The gap <TagBadge tag="blocked" /></div>
          <p style={{ margin: "0 0 0.6rem" }}>{vosDataGap.finding}</p>
          <p style={{ margin: 0, fontWeight: 600 }}>{vosDataGap.implication}</p>
        </div>
      </section>

      {/* ---------------- 5. GAS ENABLES RENEWABLES ---------------- */}
      <section className="lzo-section">
        <h2 className="lzo-section-title">
          "The gas plant will enable more renewables" — where's the math? <TagBadge tag="blocked" />
        </h2>
        <div className="lzo-callout lzo-callout-blocked">
          <div className="lzo-callout-title">The claim, as made</div>
          <p style={{ margin: 0 }}>{gasEnablesRenewablesClaim.claimAsStated}</p>
        </div>
        <div className="lzo-callout">
          <div className="lzo-callout-title">What AE has published</div>
          <p style={{ margin: 0 }}>{gasEnablesRenewablesClaim.whatIsPublished}</p>
        </div>
        <div className="lzo-callout lzo-callout-blocked">
          <div className="lzo-callout-title">Why the math isn't public</div>
          <p style={{ margin: 0 }}>{gasEnablesRenewablesClaim.whyNotPublished}</p>
        </div>
        <ul className="lzo-sources" style={{ marginTop: "0.5rem" }}>
          {gasEnablesRenewablesClaim.sources.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </section>

      {/* ---------------- 6. NEXT PHASE: LIVE TRACKER ---------------- */}
      <section className="lzo-section">
        <h2 className="lzo-section-title">Coming next: a live demand tracker</h2>
        <div className="lzo-phase-note">
          <strong>Demand side — feasible live:</strong> {liveTrackerPlan.demandSide}
        </div>
        <div className="lzo-phase-note" style={{ marginTop: "0.75rem" }}>
          <strong>Supply side — not live, periodic:</strong> {liveTrackerPlan.supplySide}
        </div>
      </section>

      {/* ---------------- SOURCES ---------------- */}
      <section className="lzo-section">
        <h2 className="lzo-section-title">Sources &amp; methodology</h2>
        <p className="lzo-sources">
          Full methodology, scenario assumptions, and citation list live in the project workbook
          "ae-load-zone-20yr-price-projection.xlsx" (built 2026-10-12) and its precursor
          "Austin_Energy_Wholesale_Cost_Report.docx" (2026-08-29), both in the Secret Vote project
          folder. Key sources: Austin Energy's Dec 2025 staff memo on large-load growth
          (services.austintexas.gov/edims/document.cfm?id=464919), NREL ATB 2024 (v3), Lazard
          LCOE+/LCOS (June 2025), EIA Short-Term Energy Outlook (Feb 2026), Austin Energy's Value
          of Solar FAQ (austinenergy.com), and Public Citizen's comments on the 2026 peaker
          decision. This page does not reproduce AE's full contract-level citations — see the
          workbook's own Sources tab for a source URL on every figure.
        </p>
      </section>
    </main>
  );
}
