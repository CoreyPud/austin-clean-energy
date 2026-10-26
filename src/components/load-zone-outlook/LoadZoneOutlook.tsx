import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import "./load-zone-outlook.css";
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
  vosAnnualHistory,
  vosHistoricalTrendFinding,
  vosMethodologyChangeFinding,
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
  supplyDemandGapTable,
  supplyDemandGapMethodology,
  contractStackCapacityFactors,
  ganttItems,
  ganttNote,
  ganttScopeCounts,
  GANTT_YEAR_MIN,
  GANTT_YEAR_MAX,
  tollRoadDiagram,
  tollMoneyFlowFinding,
  proximityPoints,
  proximityRadarNote,
  transmissionInvestments,
  transmissionInvestmentFinding,
  transmissionLinesForMap,
  transmissionLinesNote,
  transmissionPointsForMap,
  namedAeTransmissionProjectsNote,
  vosTransmissionMechanismFinding,
  transmissionRateImpactFinding,
  pricingNodes,
  pricingNodesFinding,
  MapPoint,
  GanttItem,
  ProximityPoint,
  TransmissionLine,
  TransmissionPoint,
  PricingNode,
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

// A tight bounding box around the Austin metro, used by the "Zoom to Austin
// area" toggle below. At the full statewide map scale, AE's own two local
// transmission-line projects (a few miles each) are literally invisible next
// to 177- and 400-mile statewide 765kV lines — zooming in is the only way to
// actually see them. Sized to contain Austin, Dunlap, Decker Creek, McNeil,
// and Justin Lane (all within ~0.2° of downtown) with some surrounding
// context (Sand Hill, Tesla, Dog's Head).
const AUSTIN_ZOOM_BOUNDS = { latMin: 29.98, latMax: 30.58, lonMin: -97.97, lonMax: -97.43 };

function inBounds(lat: number, lon: number, b: { latMin: number; latMax: number; lonMin: number; lonMax: number }) {
  return lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax;
}

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
function MapMarker({ p, x, y, onEnter, onClick }: { p: MapPoint; x: number; y: number; onEnter: () => void; onClick: () => void }) {
  const r = radiusFor(p.mw);
  const color = CATEGORY_COLOR[p.category] ?? "hsl(var(--muted-foreground))";
  const common = {
    className: "lzo-map-point",
    onMouseEnter: onEnter,
    onClick,
  };
  if (p.category === "generator-retiring") {
    // hollow ring = existing capacity that is scheduled to go away
    return <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2.25} {...common}><title>{p.name}</title></circle>;
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
  const [showLines, setShowLines] = useState(true);
  const [showPricing, setShowPricing] = useState(true);
  const [zoomAustin, setZoomAustin] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<MapPoint | null>(null);
  const [pinnedPoint, setPinnedPoint] = useState<MapPoint | null>(null);
  const [hoverLine, setHoverLine] = useState<TransmissionLine | null>(null);
  const [pinnedLine, setPinnedLine] = useState<TransmissionLine | null>(null);
  const [hoverNode, setHoverNode] = useState<PricingNode | null>(null);
  const [pinnedNode, setPinnedNode] = useState<PricingNode | null>(null);
  const [hoverSubstation, setHoverSubstation] = useState<TransmissionPoint | null>(null);
  const [pinnedSubstation, setPinnedSubstation] = useState<TransmissionPoint | null>(null);

  const bounds = useMemo(() => {
    const all = [
      ...combinedLoadsForMap,
      ...combinedGenerationForMap,
      ...combinedGeneratorsForMap,
      ...REFERENCE_CITIES,
      ...transmissionLinesForMap.flatMap((l) => l.points),
      ...transmissionPointsForMap,
      ...pricingNodes,
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

  const effectiveBounds = zoomAustin ? AUSTIN_ZOOM_BOUNDS : bounds;

  const mapHeight = useMemo(() => {
    const midLatRad = ((effectiveBounds.latMin + effectiveBounds.latMax) / 2) * (Math.PI / 180);
    const lonSpan = (effectiveBounds.lonMax - effectiveBounds.lonMin) * Math.cos(midLatRad);
    const latSpan = effectiveBounds.latMax - effectiveBounds.latMin;
    return Math.round(MAP_WIDTH * (latSpan / lonSpan));
  }, [effectiveBounds]);

  function project(lat: number, lon: number) {
    const x = ((lon - effectiveBounds.lonMin) / (effectiveBounds.lonMax - effectiveBounds.lonMin)) * MAP_WIDTH;
    const y = ((effectiveBounds.latMax - lat) / (effectiveBounds.latMax - effectiveBounds.latMin)) * mapHeight;
    return { x, y };
  }

  const active = hoverPoint ?? pinnedPoint;
  const activeLine = hoverLine ?? pinnedLine;
  const activeNode = hoverNode ?? pinnedNode;
  const activeSubstation = hoverSubstation ?? pinnedSubstation;

  const visiblePointsAll: MapPoint[] = [
    ...(showLoads ? combinedLoadsForMap : []),
    ...(showSolar ? cleanviewPlannedSolar : []),
    ...(showBattery ? cleanviewPlannedBatteries : []),
    ...(showGenCurrent ? aeEiaFleetOperable : []),
    ...(showGenRetiring ? ercotRetiringSoon : []),
    ...(showGenProposed ? ercotProposedLargeGasNuclear : []),
  ];
  const visiblePoints = zoomAustin ? visiblePointsAll.filter((p) => inBounds(p.lat, p.lon, AUSTIN_ZOOM_BOUNDS)) : visiblePointsAll;
  const visibleCities = zoomAustin ? REFERENCE_CITIES.filter((c) => inBounds(c.lat, c.lon, AUSTIN_ZOOM_BOUNDS)) : REFERENCE_CITIES;
  const visibleLines = zoomAustin
    ? transmissionLinesForMap.filter((l) => l.points.every((pt) => inBounds(pt.lat, pt.lon, AUSTIN_ZOOM_BOUNDS)))
    : transmissionLinesForMap;
  const visibleNodes = zoomAustin ? pricingNodes.filter((n) => inBounds(n.lat, n.lon, AUSTIN_ZOOM_BOUNDS)) : pricingNodes;
  const visibleSubstations = zoomAustin
    ? transmissionPointsForMap.filter((s) => inBounds(s.lat, s.lon, AUSTIN_ZOOM_BOUNDS))
    : transmissionPointsForMap;

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
        <label className="lzo-map-toggle">
          <input type="checkbox" checked={showLines} onChange={(e) => setShowLines(e.target.checked)} />
          <span className="lzo-legend-swatch lzo-legend-swatch-line" />
          Transmission lines & substations ({transmissionLinesForMap.length + transmissionPointsForMap.length})
        </label>
        <label className="lzo-map-toggle">
          <input type="checkbox" checked={showPricing} onChange={(e) => setShowPricing(e.target.checked)} />
          <span className="lzo-legend-swatch lzo-legend-swatch-diamond" />
          Zonal + AE pricing ({pricingNodes.length})
        </label>
        <button type="button" className={`lzo-map-zoom-btn ${zoomAustin ? "lzo-map-zoom-btn-active" : ""}`} onClick={() => setZoomAustin(!zoomAustin)}>
          {zoomAustin ? "← Back to statewide view" : "Zoom to Austin area →"}
        </button>
      </div>
      {zoomAustin && (
        <p className="lzo-map-zoom-note">
          Zoomed to the Austin metro. At the statewide scale, AE's own local transmission projects (lines of a few
          miles each, plus one substation) are invisible next to 177- and 400-mile statewide 765kV lines — that gap
          is itself the point (see transmissionLinesNote below).
        </p>
      )}

      <div className="lzo-map-wrap">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${mapHeight}`}
          width="100%"
          height="auto"
          role="img"
          aria-label="Map of Texas loads, new planned solar and battery generation, EIA-reported current/retiring/proposed generators, five transmission-line projects and one substation drawn at their real sourced endpoints, and five pricing points (four real ERCOT zonal averages plus this project's own Austin Energy model)"
          onMouseLeave={() => {
            setHoverPoint(null);
            setHoverLine(null);
            setHoverNode(null);
            setHoverSubstation(null);
          }}
        >
          <rect x={0} y={0} width={MAP_WIDTH} height={mapHeight} className="lzo-map-bg" />
          {visibleCities.map((c) => {
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
          {showLines &&
            visibleLines.map((line) => {
              const p0 = project(line.points[0].lat, line.points[0].lon);
              const p1 = project(line.points[1].lat, line.points[1].lon);
              const isHigh = line.voltageKv >= 345;
              const notYetApproved = /not yet approved|under regulatory review/i.test(line.status);
              return (
                <g
                  key={line.name}
                  className="lzo-map-line-group"
                  onMouseEnter={() => setHoverLine(line)}
                  onClick={() => setPinnedLine(pinnedLine?.name === line.name ? null : line)}
                >
                  <line
                    x1={p0.x}
                    y1={p0.y}
                    x2={p1.x}
                    y2={p1.y}
                    className={`lzo-map-line ${isHigh ? "lzo-map-line-765" : "lzo-map-line-138"} ${notYetApproved ? "lzo-map-line-proposed" : ""}`}
                  >
                    <title>{`${line.name} — ${line.voltageKv}kV`}</title>
                  </line>
                  {line.points.map((pt, i) => {
                    const { x, y } = project(pt.lat, pt.lon);
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r={2.75} className="lzo-map-line-endpoint">
                          <title>{pt.label}</title>
                        </circle>
                        {zoomAustin && (
                          <text x={x + 6} y={y - 5} className="lzo-map-line-endpoint-label">
                            {pt.label.split(" (")[0]}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          {showLines &&
            visibleSubstations.map((s) => {
              const { x, y } = project(s.lat, s.lon);
              const r = 5;
              const pts = `${x - r},${y - r} ${x + r},${y - r} ${x + r},${y + r} ${x - r},${y + r}`;
              return (
                <g
                  key={s.name}
                  className="lzo-map-substation-group"
                  onMouseEnter={() => setHoverSubstation(s)}
                  onClick={() => setPinnedSubstation(pinnedSubstation?.name === s.name ? null : s)}
                >
                  <polygon points={pts} className="lzo-map-substation">
                    <title>{s.name}</title>
                  </polygon>
                  {zoomAustin && (
                    <text x={x + 8} y={y - 6} className="lzo-map-line-endpoint-label">
                      {s.name.split(" (")[0]}
                    </text>
                  )}
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
                onClick={() => setPinnedPoint(pinnedPoint?.name === p.name ? null : p)}
              />
            );
          })}
          {showPricing &&
            visibleNodes.map((node) => {
              const { x, y } = project(node.lat, node.lon);
              const d = 7;
              const pts = `${x},${y - d} ${x + d},${y} ${x},${y + d} ${x - d},${y}`;
              const priceText = node.daPrice != null ? `$${node.daPrice.toFixed(2)}` : "model";
              return (
                <g
                  key={node.name}
                  className="lzo-map-price-group"
                  onMouseEnter={() => setHoverNode(node)}
                  onClick={() => setPinnedNode(pinnedNode?.name === node.name ? null : node)}
                >
                  <polygon
                    points={pts}
                    className={`lzo-map-price-node ${node.kind === "ae-own-model" ? "lzo-map-price-node-model" : "lzo-map-price-node-actual"}`}
                  >
                    <title>{node.name}</title>
                  </polygon>
                  <text x={x} y={y - d - 4} textAnchor="middle" className="lzo-map-price-label">
                    {priceText}/MWh{node.kind === "ae-own-model" ? "*" : ""}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      <div className="lzo-map-detail">
        {active ? (
          <>
            <div className="lzo-map-detail-name">
              {active.name} <TagBadge tag={active.tag} />
            </div>
            <div className="lzo-map-detail-row">
              {active.mw ? `${active.mw} MW · ` : ""}
              {active.year !== "n/a" ? `${active.year} · ` : ""}
              {active.detail}
            </div>
            <div className="lzo-map-detail-precision">
              Location: {active.precision === "exact-site" ? "exact project site" : active.precision === "county-centroid" ? "county centroid (close address, not exact site)" : "city-level approximation"}
            </div>
          </>
        ) : activeLine ? (
          <>
            <div className="lzo-map-detail-name">
              {activeLine.name} <TagBadge tag={activeLine.tag} />
            </div>
            <div className="lzo-map-detail-row">
              {activeLine.voltageKv}kV · {activeLine.scope === "AE" ? "Austin Energy's own" : "Statewide"} · {activeLine.status}
            </div>
            <div className="lzo-map-detail-row">{activeLine.detail}</div>
            <div className="lzo-map-detail-precision">
              Endpoints: {activeLine.points.map((p) => p.label).join("  ↔  ")}
            </div>
          </>
        ) : activeNode ? (
          <>
            <div className="lzo-map-detail-name">
              {activeNode.name} <TagBadge tag={activeNode.tag} />
            </div>
            <div className="lzo-map-detail-row">
              {activeNode.kind === "ae-own-model"
                ? `Modeled, not published: $${activeNode.daPrice?.toFixed(2)}/MWh`
                : `Day-ahead avg $${activeNode.daPrice?.toFixed(2)}/MWh · Real-time avg $${activeNode.rtPrice?.toFixed(2)}/MWh`}
              {" · "}
              {activeNode.vintage}
            </div>
            <div className="lzo-map-detail-row">{activeNode.detail}</div>
          </>
        ) : activeSubstation ? (
          <>
            <div className="lzo-map-detail-name">
              {activeSubstation.name} <TagBadge tag={activeSubstation.tag} />
            </div>
            <div className="lzo-map-detail-row">
              {activeSubstation.scope === "AE" ? "Austin Energy's own" : "Statewide"} · {activeSubstation.status}
            </div>
            <div className="lzo-map-detail-row">{activeSubstation.detail}</div>
            <div className="lzo-map-detail-precision">
              Location: {activeSubstation.precision === "exact-site" ? "exact project site" : activeSubstation.precision === "county-centroid" ? "county centroid (close address, not exact site)" : "city-level approximation"}
            </div>
          </>
        ) : (
          <div className="lzo-map-detail-hint">
            Hover or tap a point, line, substation, or price marker for details. Squares = Austin Energy's own plants · hollow rings = scheduled to retire · triangles = proposed/not yet built · thick lines = 765kV · thin lines = 138kV · dashed lines = not yet approved · small squares on a line = named endpoints · larger square = a standalone substation project (Kramer) · diamonds = pricing (hollow = real ERCOT zonal average, filled = this project's own AE model).
          </div>
        )}
      </div>
      {(showLines || showPricing) && (
        <div className="lzo-map-footnotes">
          {showLines && <p className="lzo-map-footnote">{transmissionLinesNote.note}</p>}
          {showLines && <p className="lzo-map-footnote">{namedAeTransmissionProjectsNote.note}</p>}
          {showPricing && <p className="lzo-map-footnote">{pricingNodesFinding.finding}</p>}
        </div>
      )}
    </div>
  );
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

const GANTT_LANE_COLOR: Record<string, string> = {
  "New loads": "hsl(var(--destructive))",
  "New generation": "hsl(var(--primary))",
  "Retiring assets": "hsl(var(--accent))",
};

const GANTT_LANES: string[] = ["New loads", "New generation", "Retiring assets"];

// Bar THICKNESS encodes MW on a sqrt scale (so an 11,679 MW plant doesn't
// draw literally 100x taller than a 5 MW data center — it draws about 10x,
// matching how a map marker's radius is scaled elsewhere on this page).
// Items with no disclosed MW (Tesla, Samsung, Blue Origin) get the thin
// floor thickness rather than being hidden.
function barThickness(mw: number | null): number {
  if (mw == null) return 5;
  return Math.min(26, Math.max(5, Math.sqrt(mw) * 0.52));
}

function GanttChart() {
  const [hoverItem, setHoverItem] = useState<GanttItem | null>(null);
  const totalYears = GANTT_YEAR_MAX - GANTT_YEAR_MIN;

  const ticks: number[] = [];
  for (let y = GANTT_YEAR_MIN; y <= GANTT_YEAR_MAX; y += 2) ticks.push(y);
  if (ticks[ticks.length - 1] !== GANTT_YEAR_MAX) ticks.push(GANTT_YEAR_MAX);

  function pct(year: number) {
    return ((year - GANTT_YEAR_MIN) / totalYears) * 100;
  }

  return (
    <div className="lzo-gantt">
      <div className="lzo-gantt-legend">
        {GANTT_LANES.map((lane) => (
          <span key={lane} className="lzo-gantt-legend-item">
            <span className="lzo-legend-swatch" style={{ background: GANTT_LANE_COLOR[lane] }} />
            {lane} ({ganttItems.filter((i) => i.lane === lane).length})
          </span>
        ))}
        <span className="lzo-gantt-legend-item lzo-gantt-legend-scope">
          <span className="lzo-gantt-scope-badge lzo-gantt-scope-ae">AE</span>
          Austin Energy's own ({ganttScopeCounts.AE})
          <span className="lzo-gantt-scope-badge lzo-gantt-scope-statewide">Statewide</span>
          ERCOT-wide context ({ganttScopeCounts.Statewide})
        </span>
      </div>
      <p className="lzo-gantt-scope-lede">
        Bar thickness is each item's MW (sqrt scale). Every row is tagged <strong>AE</strong> (Austin
        Energy's own contracted/owned assets — the same universe as the supply/demand/gap table above)
        or <strong>Statewide</strong> (ERCOT-wide or other-utility context, shown for scale — not AE's own
        supply or load). Most of this chart is Statewide by design: AE's own 6 items sit inside a much
        bigger surrounding picture.
      </p>

      <div className="lzo-gantt-axis">
        <div className="lzo-gantt-axis-label-col" />
        <div className="lzo-gantt-axis-track">
          {ticks.map((t) => (
            <span key={t} className="lzo-gantt-axis-tick" style={{ left: `${pct(t)}%` }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {GANTT_LANES.map((lane) => (
        <div key={lane} className="lzo-gantt-lane">
          <div className="lzo-gantt-lane-title" style={{ color: GANTT_LANE_COLOR[lane] }}>
            {lane}
          </div>
          {ganttItems
            .filter((item) => item.lane === lane)
            .sort((a, b) => a.endYear - b.endYear)
            .map((item) => {
              const left = pct(item.startYear);
              const width = Math.max(pct(item.endYear) - left, 1.2);
              const isHover = hoverItem === item;
              const thickness = barThickness(item.mw);
              return (
                <div className="lzo-gantt-row" key={item.name}>
                  <div className="lzo-gantt-row-label" title={item.name}>
                    <span
                      className={`lzo-gantt-scope-badge ${
                        item.scope === "AE" ? "lzo-gantt-scope-ae" : "lzo-gantt-scope-statewide"
                      }`}
                    >
                      {item.scope === "AE" ? "AE" : "SW"}
                    </span>
                    {item.name}
                  </div>
                  <div className="lzo-gantt-row-track">
                    <div
                      className={`lzo-gantt-bar ${item.scope === "Statewide" ? "lzo-gantt-bar-statewide" : ""}`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${thickness}px`,
                        background: GANTT_LANE_COLOR[lane],
                        opacity: isHover ? 1 : 0.82,
                      }}
                      onMouseEnter={() => setHoverItem(item)}
                      onMouseLeave={() => setHoverItem(null)}
                    >
                      <span className="lzo-gantt-bar-end">
                        {item.mw != null ? `${fmt(item.mw)} MW · ` : ""}
                        {item.endYear}
                        {item.yearIsEstimate ? "*" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ))}

      <div className="lzo-gantt-detail">
        {hoverItem ? (
          <>
            <span
              className={`lzo-gantt-scope-badge ${
                hoverItem.scope === "AE" ? "lzo-gantt-scope-ae" : "lzo-gantt-scope-statewide"
              }`}
            >
              {hoverItem.scope === "AE" ? "AE" : "Statewide"}
            </span>
            <span className="lzo-gantt-detail-name">{hoverItem.name}</span>
            {hoverItem.mw != null ? <span className="lzo-gantt-detail-mw">{fmt(hoverItem.mw)} MW</span> : null}
            <span className="lzo-gantt-detail-text">{hoverItem.detail}</span>
          </>
        ) : (
          <span className="lzo-map-detail-hint">Hover a bar for project detail.</span>
        )}
      </div>
    </div>
  );
}

// "Why geography matters" — a schematic (not GIS-accurate) toll-road diagram.
// See tollRoadDiagram.scopeNote for what this simplifies and doesn't claim.
const TOLLROAD_ONRAMPS: { x: number; name: string }[] = [
  { x: 255, name: "Tesla" },
  { x: 345, name: "Samsung" },
  { x: 425, name: "Blue Origin" },
  { x: 590, name: "CloudBurst" },
];

function TollRoadDiagram() {
  return (
    <figure className="lzo-tr-figure">
      <svg
        viewBox="0 0 1000 400"
        role="img"
        aria-label="Schematic: cheap wind, solar, gas and nuclear generation sits far away in West and Panhandle Texas. A transmission corridor with limited capacity carries that power toward Austin. Several large loads that are not Austin Energy customers — Tesla, Samsung, Blue Origin, CloudBurst — merge onto that same constrained corridor. Austin Energy's own local generation bypasses the constraint entirely. At the Austin end, the price paid is the far-away hub price plus a local congestion toll that grows with how crowded the corridor is."
        className="lzo-tr-svg"
      >
        <defs>
          <marker id="lzo-tr-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="hsl(var(--destructive))" />
          </marker>
        </defs>

        {/* generation zone */}
        <text x="130" y="26" textAnchor="middle" className="lzo-tr-zone-label">Generation-rich West &amp; Panhandle Texas</text>
        <text x="130" y="41" textAnchor="middle" className="lzo-tr-zone-sub">cheap power, far from Austin</text>

        <g transform="translate(60,100)">
          <line x1="0" y1="0" x2="0" y2="46" stroke="hsl(var(--primary))" strokeWidth="3" />
          <polygon points="0,0 -16,10 -2,14" fill="hsl(var(--primary))" />
          <polygon points="0,0 16,6 4,16" fill="hsl(var(--primary))" />
          <polygon points="0,0 -2,-18 10,-4" fill="hsl(var(--primary))" />
        </g>
        <text x="60" y="165" textAnchor="middle" className="lzo-tr-icon-label">Wind + solar buildout</text>
        <text x="60" y="179" textAnchor="middle" className="lzo-tr-icon-sub">34,546 MW solar</text>
        <text x="60" y="191" textAnchor="middle" className="lzo-tr-icon-sub">5,286 MW wind</text>

        <g transform="translate(205,112)">
          <rect x="-18" y="0" width="36" height="28" fill="hsl(var(--primary))" opacity="0.85" />
          <rect x="-6" y="-20" width="8" height="20" fill="hsl(var(--primary))" opacity="0.85" />
        </g>
        <text x="205" y="165" textAnchor="middle" className="lzo-tr-icon-label">Project Matador</text>
        <text x="205" y="179" textAnchor="middle" className="lzo-tr-icon-sub">11,679 MW gas</text>
        <text x="205" y="191" textAnchor="middle" className="lzo-tr-icon-sub">4,468 MW nuclear</text>

        {/* corridor */}
        <rect x="230" y="245" width="450" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
        <line x1="230" y1="260" x2="680" y2="260" stroke="currentColor" strokeWidth="1" strokeDasharray="10 8" opacity="0.3" />

        {/* toll gate */}
        <g transform="translate(460,260)">
          <line x1="-40" y1="-42" x2="-40" y2="42" stroke="hsl(var(--accent))" strokeWidth="4" />
          <line x1="40" y1="-42" x2="40" y2="42" stroke="hsl(var(--accent))" strokeWidth="4" />
          <rect x="-40" y="-42" width="80" height="8" fill="hsl(var(--accent))" />
        </g>
        <text x="460" y="325" textAnchor="middle" className="lzo-tr-zone-label" style={{ fill: "hsl(var(--accent))" }}>
          Central Texas import constraint
        </text>
        <text x="460" y="339" textAnchor="middle" className="lzo-tr-zone-sub">a fixed number of transmission "lanes" into Austin</text>

        {/* on-ramps: nearby non-AE loads merging onto the same corridor */}
        {TOLLROAD_ONRAMPS.map((l) => (
          <g key={l.name}>
            <line
              x1={l.x - 10}
              y1={160}
              x2={Math.min(l.x + 25, 670)}
              y2={244}
              stroke="hsl(var(--destructive))"
              strokeWidth="2.5"
              markerEnd="url(#lzo-tr-arrow)"
            />
            <rect x={l.x - 22} y="140" width="24" height="18" fill="hsl(var(--destructive))" opacity="0.85" />
            <text x={l.x - 10} y="132" textAnchor="middle" className="lzo-tr-onramp-label">
              {l.name}
            </text>
          </g>
        ))}
        <text x="430" y="104" textAnchor="middle" className="lzo-tr-zone-sub" style={{ fill: "hsl(var(--destructive))" }}>
          not AE customers — but in the same Central Texas transmission region
        </text>

        {/* AE's own local generation bypasses the constraint */}
        <path d="M 400 272 Q 500 345 675 272" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="6 5" />
        <text x="540" y="368" textAnchor="middle" className="lzo-tr-zone-sub" style={{ fill: "hsl(var(--primary))" }}>
          AE's own 2026 peaker + wind + battery — bypasses the toll
        </text>

        {/* Austin / load zone */}
        <g transform="translate(830,255)">
          <rect x="-20" y="-20" width="12" height="40" fill="currentColor" opacity="0.5" />
          <rect x="-2" y="-32" width="12" height="52" fill="currentColor" opacity="0.5" />
          <rect x="16" y="-12" width="12" height="32" fill="currentColor" opacity="0.5" />
        </g>
        <text x="830" y="195" textAnchor="middle" className="lzo-tr-zone-label">Austin / LZ_AEN</text>
        <text x="830" y="209" textAnchor="middle" className="lzo-tr-zone-sub">end of the constrained corridor</text>
      </svg>

      <div className="lzo-tr-price-row">
        <div className="lzo-tr-price-box">
          <span className="lzo-tr-price-label">Hub price (statewide)</span>
          <span className="lzo-tr-price-value">$31.04 → $57.68</span>
        </div>
        <span className="lzo-tr-price-op">+</span>
        <div className="lzo-tr-price-box" style={{ borderColor: "hsl(var(--accent))" }}>
          <span className="lzo-tr-price-label">Austin's local toll</span>
          <span className="lzo-tr-price-value" style={{ color: "hsl(var(--accent))" }}>
            $5.99 → $12.38
          </span>
        </div>
        <span className="lzo-tr-price-op">=</span>
        <div className="lzo-tr-price-box" style={{ borderColor: "hsl(var(--destructive))" }}>
          <span className="lzo-tr-price-label">LZ_AEN price, Base case</span>
          <span className="lzo-tr-price-value" style={{ color: "hsl(var(--destructive))" }}>
            $37.03 → $70.07
          </span>
        </div>
      </div>
      <p className="lzo-tr-price-caption">$/MWh, 2026 → 2045, Base scenario (projection20yr)</p>

      <figcaption className="lzo-tr-caption">{tollRoadDiagram.scopeNote}</figcaption>
    </figure>
  );
}

function BasisOverTimeChart() {
  const data = useMemo(
    () =>
      projection20yr.map((row) => ({
        year: row.year,
        Low: row.low.basis,
        Base: row.base.basis,
        High: row.high.basis,
      })),
    []
  );
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          width={42}
          label={{ value: "$/MWh", angle: -90, position: "insideLeft", fontSize: 10 }}
        />
        <Tooltip formatter={(v: number) => `$${v.toFixed(2)}/MWh`} labelFormatter={(l) => `Year ${l}`} />
        <Line type="monotone" dataKey="Low" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Base" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="High" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Added 2026-10-25 alongside vosHistoricalTrendFinding, to show the annual
// Value of Solar total actually falling FY21-FY25 — the opposite direction
// from BasisOverTimeChart above, and the direct answer to "is avoided cost
// going up, and why."
function VosAnnualChart() {
  const peak = Math.max(...vosAnnualHistory.map((r) => r.totalCentsPerKwhUnder1MW));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={vosAnnualHistory} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="fiscalYear" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          width={42}
          label={{ value: "¢/kWh", angle: -90, position: "insideLeft", fontSize: 10 }}
        />
        <Tooltip formatter={(v: number) => `${v.toFixed(2)}¢/kWh`} labelFormatter={(l) => `${l}`} />
        <Bar dataKey="totalCentsPerKwhUnder1MW" radius={[3, 3, 0, 0]}>
          {vosAnnualHistory.map((row) => (
            <Cell
              key={row.fiscalYear}
              fill={
                row.totalCentsPerKwhUnder1MW === peak
                  ? "hsl(var(--primary))"
                  : "hsl(var(--destructive))"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// PROXIMITY RADAR — real distance/bearing from downtown Austin, sqrt-scaled.
// A second, literal-geography view of the toll-road question, added after a
// direct request for "circles around Austin where the loads and generators
// are and where the cost points are."
// ---------------------------------------------------------------------------
const RADAR_CENTER = 600;
const RADAR_K = 23.65; // px per sqrt(mile) — 450mi ring lands near the SVG edge
const RADAR_RINGS = [10, 30, 75, 200, 450];

function radarPolar(distanceMi: number, bearingDeg: number) {
  const r = RADAR_K * Math.sqrt(distanceMi);
  const rad = (bearingDeg * Math.PI) / 180;
  return { x: RADAR_CENTER + r * Math.sin(rad), y: RADAR_CENTER - r * Math.cos(rad), r };
}

// Hand-placed label anchors (dots are computed from real data above; labels
// are fanned out by hand so the close-in cluster around Travis County stays
// legible instead of overlapping at this scale). `lines` are generated at
// render time from the point's own data (distance, category, MW), not
// hand-typed, so a label can never drift out of sync with the dataset.
const RADAR_LABELS: Record<string, { lx: number; ly: number; anchor: "start" | "end"; shortName: string; mwSuffix?: string }> = {
  "Dog's Head (Endeavor) — East Austin": { lx: 860, ly: 520, anchor: "start", shortName: "Dog's Head" },
  "Tesla Gigafactory Texas expansion": { lx: 860, ly: 580, anchor: "start", shortName: "Tesla Gigafactory" },
  "Sand Hill Energy Center": { lx: 860, ly: 640, anchor: "start", shortName: "AE's Sand Hill plant" },
  "Blue Origin — Constellation Park": { lx: 860, ly: 460, anchor: "start", shortName: "Blue Origin, Hutto" },
  "Samsung Taylor semiconductor fab(s)": { lx: 900, ly: 380, anchor: "start", shortName: "Samsung, Taylor" },
  "CloudBurst San Marcos data center": { lx: 560, ly: 900, anchor: "end", shortName: "CloudBurst, San Marcos" },
  "Aligned Project Caprock - LBB-01 (Lubbock-area, representative)": {
    lx: 160,
    ly: 300,
    anchor: "end",
    shortName: "Aligned Caprock, Lubbock area",
    mwSuffix: " (1 of 6 Caprock buildings)",
  },
  "Project Matador (gas + nuclear)": {
    lx: 170,
    ly: 150,
    anchor: "end",
    shortName: "Project Matador",
    mwSuffix: " (gas + nuclear)",
  },
};

const RADAR_CATEGORY_COLOR: Record<string, string> = {
  load: "hsl(var(--destructive))",
  "load-unconfirmed": "hsl(var(--accent))",
  "generation-ae": "hsl(var(--primary))",
  "generation-far": "hsl(var(--secondary))",
};

const RADAR_CATEGORY_LABEL: Record<string, string> = {
  load: "Load",
  "load-unconfirmed": "Load (AE unconfirmed)",
  "generation-ae": "Generation (AE-owned)",
  "generation-far": "Generation (statewide)",
};

// Dot radius encodes MW on a sqrt scale, same convention as the Gantt chart's
// barThickness() and the map's own markers — a fixed small size stands in for
// "no MW disclosed" rather than implying zero.
function radarDotRadius(mw: number | null): number {
  if (mw == null) return 6;
  return Math.min(18, Math.max(6, Math.sqrt(mw) * 0.45));
}

function ProximityRadar() {
  const austin = { x: RADAR_CENTER, y: RADAR_CENTER };
  return (
    <figure className="lzo-radar-figure">
      <svg
        viewBox="-220 60 1440 1100"
        className="lzo-radar-svg"
        role="img"
        aria-label="A radial diagram centered on downtown Austin, with concentric rings at 10, 30, 75, 200, and 450 miles (square-root scale). Each point is labeled with its category — load, load with AE territory unconfirmed, AE-owned generation, or statewide generation — and its MW, or 'MW not disclosed' where none is published. Tesla, Dog's Head, and Austin Energy's own Sand Hill plant (595 MW) sit within 9 miles of center. Samsung, Blue Origin, and CloudBurst sit 22 to 29 miles out, all with MW not disclosed. Project Matador's 16,147 MW of combined gas and nuclear generation sits over 400 miles away in the opposite direction, near a representative 108 MW Lubbock-area data center at 346 miles."
      >
        {RADAR_RINGS.map((mi) => {
          const { r } = radarPolar(mi, 0);
          return (
            <g key={mi}>
              <circle cx={austin.x} cy={austin.y} r={r} fill="none" stroke="currentColor" strokeWidth={1} strokeDasharray="4 6" opacity={0.28} />
              <text x={austin.x - r - 6} y={austin.y - 4} textAnchor="end" className="lzo-radar-ring-label">
                {mi} mi
              </text>
            </g>
          );
        })}
        {/* AE's own likely-affected zone, shaded */}
        <circle cx={austin.x} cy={austin.y} r={radarPolar(30, 0).r} fill="hsl(var(--primary))" opacity={0.07} />

        {proximityPoints.map((p) => {
          const { x, y } = radarPolar(p.distanceMi, p.bearingDeg);
          const label = RADAR_LABELS[p.name];
          const color = RADAR_CATEGORY_COLOR[p.category];
          const dotR = radarDotRadius(p.mw);
          const mwText = p.mw == null ? "MW not disclosed" : `${fmt(p.mw)} MW`;
          const lines = label
            ? [
                `${label.shortName} — ${p.distanceMi} mi`,
                `${RADAR_CATEGORY_LABEL[p.category]} · ${mwText}${label.mwSuffix ?? ""}`,
              ]
            : [];
          return (
            <g key={p.name}>
              {label && (
                <line x1={x} y1={y} x2={label.lx} y2={label.ly} stroke={color} strokeWidth={1} opacity={0.5} />
              )}
              <circle
                cx={x}
                cy={y}
                r={dotR}
                fill={p.category === "load-unconfirmed" ? "none" : color}
                stroke={color}
                strokeWidth={p.category === "load-unconfirmed" ? 2.5 : 1}
                strokeDasharray={p.category === "load-unconfirmed" ? "3 2" : undefined}
              />
              {label &&
                lines.map((line, i) => (
                  <text
                    key={i}
                    x={label.lx}
                    y={label.ly + i * 22}
                    textAnchor={label.anchor}
                    className={i === 0 ? "lzo-radar-point-label" : "lzo-radar-point-sublabel"}
                    style={{ fill: i === 0 ? color : "hsl(var(--muted-foreground))" }}
                  >
                    {line}
                  </text>
                ))}
            </g>
          );
        })}

        <circle cx={austin.x} cy={austin.y} r={13} fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth={2.5} />
        <text x={austin.x} y={austin.y + 48} textAnchor="middle" className="lzo-radar-center-label">
          Austin / LZ_AEN
        </text>

        {/* cost-point annotations, tied to ring distance — offset well clear of the ring-label row */}
        <text x={austin.x - radarPolar(30, 0).r - 6} y={austin.y + 60} textAnchor="end" className="lzo-radar-cost-label" style={{ fill: "hsl(var(--accent))" }}>
          Austin's toll zone: local congestion premium
        </text>
        <text x={austin.x - radarPolar(30, 0).r - 6} y={austin.y + 78} textAnchor="end" className="lzo-radar-cost-label" style={{ fill: "hsl(var(--accent))" }}>
          $5.99 → $12.38/MWh, 2026→2045 Base
        </text>
        <text x={austin.x - radarPolar(450, 0).r - 6} y={austin.y - 70} textAnchor="end" className="lzo-radar-cost-label" style={{ fill: "hsl(var(--muted-foreground))" }}>
          Where cheap bulk generation sits:
        </text>
        <text x={austin.x - radarPolar(450, 0).r - 6} y={austin.y - 52} textAnchor="end" className="lzo-radar-cost-label" style={{ fill: "hsl(var(--muted-foreground))" }}>
          hub price $31.04 → $57.68/MWh
        </text>
      </svg>
      <div className="lzo-chart-legend lzo-radar-legend">
        <span>
          <span className="lzo-legend-dot" style={{ background: RADAR_CATEGORY_COLOR.load }} />
          Load
        </span>
        <span>
          <span className="lzo-legend-swatch lzo-legend-swatch-ring" style={{ color: RADAR_CATEGORY_COLOR["load-unconfirmed"] }} />
          Load (AE territory unconfirmed)
        </span>
        <span>
          <span className="lzo-legend-dot" style={{ background: RADAR_CATEGORY_COLOR["generation-ae"] }} />
          Generation (AE-owned)
        </span>
        <span>
          <span className="lzo-legend-dot" style={{ background: RADAR_CATEGORY_COLOR["generation-far"] }} />
          Generation (statewide)
        </span>
        <span className="lzo-radar-legend-note">Dot size ∝ √MW where disclosed; small fixed dots = MW not disclosed.</span>
      </div>
      <figcaption className="lzo-radar-caption">{proximityRadarNote.note}</figcaption>
    </figure>
  );
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
  const row2035 = projection20yr.find((r) => r.year === 2035)!;
  const row2045 = projection20yr.find((r) => r.year === 2045)!;

  return (
    <div className="lzo-root">
      <h1 className="lzo-h1">Load Zone Price &amp; Investment Outlook</h1>
      <p className="lzo-subhead">
        Austin Energy's own ERCOT load-zone (LZ_AEN) wholesale price, projected 2026–2045
        under Low / Base / High scenarios — plus what's driving it on both the supply side
        (new generation, replacement capital) and the demand side (large-load growth), and
        two open questions this tool went looking for answers to and didn't find.
      </p>

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

      {/* ---------------- 1.5 WHY GEOGRAPHY MATTERS: THE TOLL-ROAD MECHANISM ---------------- */}
      <section className="lzo-section">
        <h2 className="lzo-section-title">
          Why geography matters: Austin's price is a toll road <TagBadge tag="derived" />
        </h2>
        <p className="lzo-section-lede">
          The price chart above and the load/generation detail further down this page (the map, the
          supply/demand table, the timeline) describe the same thing from two different angles but don't
          visually connect — this section is that connection. There are two separate channels by which
          loads and generation move Austin Energy's price, and they work differently.
        </p>

        <TollRoadDiagram />

        <div className="lzo-grid-2" style={{ marginTop: "1rem" }}>
          <div className="lzo-panel">
            <div className="lzo-panel-title">{tollRoadDiagram.channelHub.label}</div>
            <p style={{ margin: 0, fontSize: "0.88rem" }}>{tollRoadDiagram.channelHub.text}</p>
          </div>
          <div className="lzo-panel">
            <div className="lzo-panel-title">{tollRoadDiagram.channelBasis.label}</div>
            <p style={{ margin: 0, fontSize: "0.88rem" }}>{tollRoadDiagram.channelBasis.text}</p>
          </div>
        </div>

        <div className="lzo-callout lzo-callout-blocked" style={{ marginTop: "0.9rem" }}>
          <div className="lzo-callout-title">
            What this diagram does NOT claim <TagBadge tag="blocked" />
          </div>
          <p style={{ margin: 0 }}>{tollRoadDiagram.samsungCaveat}</p>
        </div>

        <div className="lzo-callout lzo-callout-blocked" style={{ marginTop: "0.9rem" }}>
          <div className="lzo-callout-title">
            Who actually gets paid the "toll"? <TagBadge tag={tollMoneyFlowFinding.tag} />
          </div>
          <p style={{ margin: "0 0 0.6rem" }}>{tollMoneyFlowFinding.claim}</p>
          <p style={{ margin: "0 0 0.6rem" }}>{tollMoneyFlowFinding.separateChannel}</p>
          <p style={{ margin: 0, fontWeight: 600 }}>{tollMoneyFlowFinding.throughputTest}</p>
        </div>

        <div className="lzo-chart-card" style={{ marginTop: "0.9rem" }}>
          <div className="lzo-panel-title">{tollRoadDiagram.tollGrowth.label}</div>
          <BasisOverTimeChart />
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>{tollRoadDiagram.tollGrowth.text}</p>
        </div>

        <div className="lzo-chart-card" style={{ marginTop: "1.1rem" }}>
          <div className="lzo-panel-title">A second view: real distance from downtown Austin <TagBadge tag="derived" /></div>
          <p style={{ margin: "0 0 0.6rem", fontSize: "0.88rem" }}>
            The diagram above is a schematic. This one isn't — every point sits at its real great-circle
            distance and compass bearing from downtown Austin, on a square-root scale so the close-in
            cluster and the 400-mile outlier are both legible on one page.
          </p>
          <ProximityRadar />
        </div>
      </section>

      {/* ---------------- 1.6 NEW TRANSMISSION INVESTMENT ---------------- */}
      <section className="lzo-section">
        <h2 className="lzo-section-title">
          Does new transmission change this? <TagBadge tag="blocked" />
        </h2>
        <p className="lzo-section-lede">
          Before this pass, neither the state's new 765kV backbone nor Austin Energy's own internal
          transmission upgrades were accounted for anywhere above — the toll-road mechanism and the price
          projection both implicitly treat Austin's import constraint and the statewide grid as fixed.
          Here's what's actually planned, and what it does and doesn't tell us.
        </p>

        {transmissionInvestments.map((t) => (
          <div className="lzo-panel" style={{ marginBottom: "0.75rem" }} key={t.name}>
            <div className="lzo-panel-title">
              {t.name}{" "}
              <span className={`lzo-gantt-scope-badge ${t.scope === "AE" ? "lzo-gantt-scope-ae" : "lzo-gantt-scope-statewide"}`}>
                {t.scope === "AE" ? "AE" : "SW"}
              </span>{" "}
              <TagBadge tag={t.tag} />
            </div>
            <p style={{ margin: "0 0 0.4rem", fontSize: "0.85rem" }}>
              <strong>Status: </strong>
              {t.status}
            </p>
            <p style={{ margin: "0 0 0.4rem", fontSize: "0.85rem" }}>
              <strong>Purpose, as stated: </strong>
              {t.purpose}
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
              <strong>Relevance to this page: </strong>
              {t.relevanceToThisPage}
            </p>
          </div>
        ))}

        <div className="lzo-callout lzo-callout-blocked" style={{ marginTop: "0.9rem" }}>
          <div className="lzo-callout-title">
            The finding <TagBadge tag={transmissionInvestmentFinding.tag} />
          </div>
          <p style={{ margin: 0 }}>{transmissionInvestmentFinding.finding}</p>
        </div>

        <div className="lzo-callout lzo-callout-blocked" style={{ marginTop: "0.6rem" }}>
          <div className="lzo-callout-title">
            Are these four projects actually inside the $500M? <TagBadge tag={namedAeTransmissionProjectsNote.tag} />
          </div>
          <p style={{ margin: 0 }}>{namedAeTransmissionProjectsNote.note}</p>
        </div>

        <div className="lzo-callout lzo-callout-blocked" style={{ marginTop: "0.6rem" }}>
          <div className="lzo-callout-title">
            Does this spending show up in customer rates yet? <TagBadge tag={transmissionRateImpactFinding.tag} />
          </div>
          <p style={{ margin: 0 }}>{transmissionRateImpactFinding.finding}</p>
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
                      <td>{p.inAeTerritory === "unconfirmed" ? "Unconfirmed" : p.inAeTerritory ? "Yes" : "No"}</td>
                      <td style={{ fontSize: "0.78rem" }}>{p.scale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lzo-callout lzo-callout-blocked" style={{ marginTop: "0.75rem" }}>
              <div className="lzo-callout-title">
                Possible exception: Dog's Head (Endeavor) <TagBadge tag="blocked" />
              </div>
              <p style={{ margin: 0 }}>
                A 2,614-acre mixed-use development annexed into Austin in May 2026, between US-183 and SH-130 along
                the Colorado River, just north of the airport. Its first announced use — Amazon's robotics
                division on 305 acres — is described as advanced manufacturing, not a data center, and no MW or
                power-demand figure has been published for it. Unlike Tesla, Samsung, and Blue Origin above, no
                source found names which electric utility serves this site: annexation into the city doesn't by
                itself move electric-service (CCN) rights, which Texas utilities hold on fixed territories
                independent of city limits. Marked "Unconfirmed" rather than folded into the map, Gantt chart, or
                toll-road diagram elsewhere on this page, which all rely on confirmed AE / not-AE categorization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 2.5 MAP: WHERE IT'S HAPPENING ---------------- */}
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

      {/* ---------------- 2.6 SUPPLY / DEMAND / GAP TABLE ---------------- */}
      <section className="lzo-section">
        <h2 className="lzo-section-title">
          Austin Energy's own supply vs. demand, 2027–2045 <TagBadge tag="scenario" />
        </h2>
        <div className="lzo-callout" style={{ marginBottom: "0.9rem" }}>
          <div className="lzo-callout-title">Scope: this is AE's own ledger, not an ERCOT-wide balance</div>
          <p style={{ margin: 0 }}>{supplyDemandGapMethodology.scopeNote}</p>
        </div>
        <p className="lzo-section-lede">{supplyDemandGapMethodology.supplyNote}</p>
        <p className="lzo-section-lede">{supplyDemandGapMethodology.demandNote}</p>

        <div className="lzo-table-wrap">
          <table className="lzo-table">
            <thead>
              <tr>
                <th rowSpan={2} style={{ verticalAlign: "bottom" }}>Year</th>
                <th colSpan={2} style={{ textAlign: "center" }}>Nameplate MW</th>
                <th colSpan={2} style={{ textAlign: "center" }}>Capacity-factor-adjusted (effective/dependable) MW</th>
              </tr>
              <tr>
                <th>Supply</th>
                <th>Gap</th>
                <th>Supply</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
              {supplyDemandGapTable.map((r) => (
                <tr key={r.year}>
                  <td>{r.year}</td>
                  <td>{fmt(r.supplyMw)}</td>
                  <td
                    style={{
                      fontWeight: 600,
                      color: r.gapMw < 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))",
                    }}
                  >
                    {r.gapMw > 0 ? "+" : ""}
                    {fmt(r.gapMw)}
                  </td>
                  <td>{fmt(r.effectiveSupplyMw)}</td>
                  <td
                    style={{
                      fontWeight: 600,
                      color: r.effectiveGapMw < 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))",
                    }}
                  >
                    {r.effectiveGapMw > 0 ? "+" : ""}
                    {fmt(r.effectiveGapMw)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: "0.4rem" }}>
          Demand (both columns) is the same scenario-proxy figure each year — only the supply side changes
          between the two bases.
        </p>

        <div className="lzo-callout" style={{ marginTop: "0.75rem" }}>
          <div className="lzo-callout-title">
            Why the effective/dependable column is already negative <TagBadge tag="benchmarked" />
          </div>
          <p style={{ margin: "0 0 0.6rem" }}>{supplyDemandGapMethodology.effectiveSupplyNote}</p>
          <p style={{ margin: 0, fontSize: "0.8rem" }}>
            Capacity-factor assumptions used: Gas/Coal/Nuclear 95%, Biomass 90%, Wind ~19.9%, Solar ~23.7%,
            Battery ~43.0% of nameplate — {contractStackCapacityFactors.source}.{" "}
            {contractStackCapacityFactors.note}
          </p>
        </div>

        <div className="lzo-callout" style={{ marginTop: "0.75rem" }}>
          <div className="lzo-callout-title">Data-quality note on the Supply figure <TagBadge tag="derived" /></div>
          <p style={{ margin: 0 }}>{supplyDemandGapMethodology.dataQualityNote}</p>
        </div>
      </section>

      {/* ---------------- 2.7 GANTT: NEW LOADS, NEW GENERATION, RETIRING ASSETS ---------------- */}
      <section className="lzo-section">
        <h2 className="lzo-section-title">
          New loads, new generation, retiring assets — timeline <TagBadge tag="reported" />
        </h2>
        <div className="lzo-callout" style={{ marginBottom: "0.9rem" }}>
          <div className="lzo-callout-title">Scope: mostly Statewide context, a few AE items mixed in</div>
          <p style={{ margin: 0 }}>
            This timeline deliberately combines Austin Energy's own assets with much larger statewide ERCOT
            context, to show scale. Each row is tagged <strong>AE</strong> or <strong>Statewide</strong> —
            see the legend and the note below before reading it as "AE's own plan."
          </p>
        </div>
        <p className="lzo-section-lede">{ganttNote.note}</p>

        <GanttChart />
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

        <div className="lzo-callout lzo-callout-blocked" style={{ marginTop: "0.6rem" }}>
          <div className="lzo-callout-title">
            So does the new $500M transmission CIP change this component? <TagBadge tag={vosTransmissionMechanismFinding.tag} />
          </div>
          <p style={{ margin: "0 0 0.6rem" }}>{vosTransmissionMechanismFinding.mechanism}</p>
          <p style={{ margin: 0, fontWeight: 600 }}>{vosTransmissionMechanismFinding.doesNewCapexFlowIn}</p>
        </div>

        <div className="lzo-chart-card" style={{ marginTop: "0.9rem" }}>
          <div className="lzo-panel-title">
            Is avoided cost going up or down? The annual total, FY21&ndash;FY25 <TagBadge tag={vosHistoricalTrendFinding.tag} />
          </div>
          <VosAnnualChart />
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>{vosHistoricalTrendFinding.claim}</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", fontWeight: 600 }}>{vosHistoricalTrendFinding.why}</p>
        </div>

        <div className="lzo-callout lzo-callout-blocked" style={{ marginTop: "0.6rem" }}>
          <div className="lzo-callout-title">
            Is the Value of Solar rate about to be calculated differently? <TagBadge tag={vosMethodologyChangeFinding.tag} />
          </div>
          <p style={{ margin: "0 0 0.6rem" }}>{vosMethodologyChangeFinding.claim}</p>
          <p style={{ margin: "0 0 0.6rem" }}>{vosMethodologyChangeFinding.secondChange}</p>
          <p style={{ margin: 0, fontWeight: 600 }}>{vosMethodologyChangeFinding.implication}</p>
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
    </div>
  );
}
