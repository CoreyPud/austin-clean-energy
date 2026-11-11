import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import "./grid-flow-map.css";
import {
  SOURCE_KEYS,
  computeBuildings,
  computeDay,
  computeHour,
  dayIndexOf,
  parseFlowCsv,
  sourceOf,
  type BuildingState,
  type FlowModel,
  type HourState,
  type HourlyFlow,
  type SourceKey,
} from "./grid-flow-engine";
import {
  AUSTIN,
  CLOSE_BOX,
  HOURLY_URL,
  MODEL_URL,
  REFERENCE_END,
  REFERENCE_LABEL,
  REFERENCE_START,
  TEXAS_BOX,
  TEXAS_RING,
  assumptions,
  clusterLabels,
  landmarks,
  limitations,
  presets,
  provenance,
  sourceMeta,
  typeLabels,
} from "./grid-flow-data";

const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

function fmtStamp(stamp: string): string {
  const d = new Date(Date.UTC(+stamp.slice(0, 4), +stamp.slice(5, 7) - 1, +stamp.slice(8, 10)));
  const hr = +stamp.slice(11, 13);
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return (
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) +
    ", " + h12 + ":00 " + (hr < 12 ? "am" : "pm")
  );
}

// ---------------------------------------------------------------------------
// projections
// ---------------------------------------------------------------------------
function makeProjection(box: { west: number; east: number; south: number; north: number }, w: number, h: number, pad: number) {
  const mid = (box.south + box.north) / 2;
  const kx = Math.cos((mid * Math.PI) / 180);
  const spanX = (box.east - box.west) * kx;
  const spanY = box.north - box.south;
  const s = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY);
  const ox = (w - spanX * s) / 2;
  const oy = (h - spanY * s) / 2;
  return (lon: number, lat: number): [number, number] => [ox + (lon - box.west) * kx * s, oy + (box.north - lat) * s];
}

// ---------------------------------------------------------------------------
// edges for the close-up: entry hub -> substation, by source category
// ---------------------------------------------------------------------------
interface Edge {
  from: number;
  to: number;
  src: SourceKey;
  mw: number;
}
function buildEdges(model: FlowModel, st: HourState): Edge[] {
  const P = model.plants.length;
  const ns = model.subs.length;
  const acc = new Map<string, Edge>();
  for (let p = 0; p <= P; p++) {
    const src: SourceKey = p === P ? "ercot" : sourceOf(model.plants[p].group);
    for (let j = 0; j < ns; j++) {
      const v = st.flow[p * ns + j];
      if (v < 0.05) continue;
      let from: number;
      if (p === P) {
        // rest of ERCOT: from the nearest 345 kV hub
        let best = model.hubs[0];
        let bd = Infinity;
        for (const hb of model.hubs) {
          const dx = model.subs[hb].lon - model.subs[j].lon;
          const dy = model.subs[hb].lat - model.subs[j].lat;
          const d = dx * dx + dy * dy;
          if (d < bd) {
            bd = d;
            best = hb;
          }
        }
        from = best;
      } else from = model.plants[p].entry;
      if (from === j) continue;
      const key = from + "|" + j + "|" + src;
      const e = acc.get(key);
      if (e) e.mw += v;
      else acc.set(key, { from, to: j, src, mw: v });
    }
  }
  const all = Array.from(acc.values()).sort((a, b) => b.mw - a.mw);
  return all.slice(0, 90).reverse();
}

type Hover = { kind: "sub" | "bld"; i: number; x: number; y: number } | null;

function readColors(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const g = (n: string) => cs.getPropertyValue(n).trim() || "#888";
  const out: Record<string, string> = {};
  SOURCE_KEYS.forEach((k) => (out[k] = g(sourceMeta[k].cssVar)));
  out.ink = g("--gf-ink");
  out.ink2 = g("--gf-ink-2");
  out.ink3 = g("--gf-ink-3");
  out.surface = g("--gf-surface");
  out.line = g("--gf-line");
  out.bld = g("--gf-bld");
  out.sub = g("--gf-sub");
  return out;
}

// ---------------------------------------------------------------------------
// close-up canvas
// ---------------------------------------------------------------------------
function CloseUp(props: {
  model: FlowModel;
  state: HourState;
  bld: BuildingState;
  animate: boolean;
  themeTick: number;
}) {
  const { model, state, bld, animate, themeTick } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 740 });
  const [hover, setHover] = useState<Hover>(null);
  const edges = useMemo(() => buildEdges(model, state), [model, state]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.max(300, Math.floor(el.clientWidth));
      setSize({ w, h: Math.round(w * 0.93) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const proj = useMemo(() => makeProjection(CLOSE_BOX, size.w, size.h, 14), [size]);
  const subPx = useMemo(() => model.subs.map((s) => proj(s.lon, s.lat)), [model, proj]);
  const bldPx = useMemo(() => model.buildings.map((b) => proj(b[0], b[1])), [model, proj]);
  const dpr = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;

  // static-per-hour layer: buildings, landmarks
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const c = readColors(el);
    const off = document.createElement("canvas");
    off.width = size.w * dpr;
    off.height = size.h * dpr;
    const g = off.getContext("2d");
    if (!g) return;
    g.scale(dpr, dpr);
    // buildings: size by annual kWh, shade by how hard they run right now vs their own average
    for (let i = 0; i < model.buildings.length; i++) {
      const b = model.buildings[i];
      const r = Math.min(3.0, 0.7 + Math.sqrt(b[3]) / 90);
      const rel = bld.rel[i];
      const a = Math.max(0.22, Math.min(0.8, 0.25 + (rel - 0.4) * 0.3));
      g.globalAlpha = a;
      g.fillStyle = c.bld;
      g.beginPath();
      g.arc(bldPx[i][0], bldPx[i][1], r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    g.font = "11px 'IBM Plex Sans', system-ui, sans-serif";
    g.fillStyle = c.ink3;
    g.textAlign = "center";
    for (const lm of landmarks) {
      const [x, y] = proj(lm.lon, lm.lat);
      g.fillText(lm.name.toUpperCase(), x, y);
    }
    baseRef.current = off;
  }, [model, bld, bldPx, proj, size, dpr, themeTick]);

  const draw = useCallback(
    (t: number) => {
      const cv = canvasRef.current;
      const el = wrapRef.current;
      if (!cv || !el) return;
      const g = cv.getContext("2d");
      if (!g) return;
      const c = readColors(el);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, size.w, size.h);
      if (baseRef.current) g.drawImage(baseRef.current, 0, 0, size.w, size.h);
      // flow lines
      const maxMw = edges.reduce((m, e) => Math.max(m, e.mw), 1);
      g.lineCap = "round";
      for (const e of edges) {
        const [x0, y0] = subPx[e.from];
        const [x1, y1] = subPx[e.to];
        g.strokeStyle = c[e.src];
        g.globalAlpha = 0.14 + 0.42 * Math.sqrt(e.mw / maxMw);
        g.lineWidth = 0.6 + 3.6 * Math.sqrt(e.mw / maxMw);
        g.setLineDash([7, 9]);
        g.lineDashOffset = animate ? -(t / 55) : 0;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x1, y1);
        g.stroke();
      }
      g.setLineDash([]);
      g.globalAlpha = 1;
      // substations: area ~ MW served
      const maxLoad = Math.max(...state.subLoad, 1);
      model.subs.forEach((s, j) => {
        const [x, y] = subPx[j];
        const r = 2.5 + 9 * Math.sqrt(state.subLoad[j] / maxLoad);
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fillStyle = c.surface;
        g.fill();
        g.lineWidth = s.kv >= 345 ? 2.4 : 1.4;
        g.strokeStyle = c.sub;
        g.stroke();
        // inner dot colored by dominant source into this substation
        let best: SourceKey = "ercot";
        let bv = -1;
        SOURCE_KEYS.forEach((k) => {
          const v = state.subBySource[k][j];
          if (v > bv) {
            bv = v;
            best = k;
          }
        });
        g.beginPath();
        g.arc(x, y, Math.max(1.3, r - 3), 0, Math.PI * 2);
        g.fillStyle = c[best];
        g.fill();
      });
      // labels for the biggest few
      const order = model.subs.map((_, j) => j).sort((a, b) => state.subLoad[b] - state.subLoad[a]).slice(0, 7);
      g.font = "600 11px 'IBM Plex Sans', system-ui, sans-serif";
      g.textAlign = "left";
      g.fillStyle = c.ink;
      order.forEach((j) => {
        const [x, y] = subPx[j];
        const nm = model.subs[j].name.replace(/^Substation /, "Sub ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
        g.lineWidth = 3;
        g.strokeStyle = c.surface;
        g.strokeText(nm, x + 9, y - 7);
        g.fillText(nm, x + 9, y - 7);
      });
      if (hover) {
        const [hx, hy] = hover.kind === "sub" ? subPx[hover.i] : bldPx[hover.i];
        g.beginPath();
        g.arc(hx, hy, hover.kind === "sub" ? 15 : 8, 0, Math.PI * 2);
        g.lineWidth = 2;
        g.strokeStyle = c.ink;
        g.stroke();
      }
    },
    [edges, subPx, bldPx, state, model, hover, animate, size, dpr],
  );

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = size.w * dpr;
    cv.height = size.h * dpr;
  }, [size, dpr]);

  useEffect(() => {
    let raf = 0;
    let live = true;
    const loop = (t: number) => {
      if (!live) return;
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    if (animate) raf = requestAnimationFrame(loop);
    else draw(0);
    return () => {
      live = false;
      cancelAnimationFrame(raf);
    };
  }, [draw, animate, themeTick]);

  const onMove = (ev: ReactMouseEvent<HTMLCanvasElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * size.w;
    const y = ((ev.clientY - r.top) / r.height) * size.h;
    let bi = -1;
    let bd = 14 * 14;
    subPx.forEach((p, j) => {
      const d = (p[0] - x) ** 2 + (p[1] - y) ** 2;
      if (d < bd) {
        bd = d;
        bi = j;
      }
    });
    if (bi >= 0) return setHover({ kind: "sub", i: bi, x: ev.clientX - r.left, y: ev.clientY - r.top });
    let bb = -1;
    let bbd = 7 * 7;
    bldPx.forEach((p, i) => {
      const d = (p[0] - x) ** 2 + (p[1] - y) ** 2;
      if (d < bbd) {
        bbd = d;
        bb = i;
      }
    });
    if (bb >= 0) return setHover({ kind: "bld", i: bb, x: ev.clientX - r.left, y: ev.clientY - r.top });
    setHover(null);
  };

  let tip: ReactNode = null;
  if (hover) {
    if (hover.kind === "sub") {
      const s = model.subs[hover.i];
      const parts = SOURCE_KEYS.map((k) => ({ k, v: state.subBySource[k][hover.i] }))
        .filter((x) => x.v >= 0.5)
        .sort((a, b) => b.v - a.v)
        .slice(0, 4);
      tip = (
        <>
          <b>{s.name.replace(/^Substation /, "Substation ")}</b>
          <div className="gf-tip-sub">
            {s.kv} kV{s.city ? " · " + s.city.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase()) : ""} · location approximate
          </div>
          <div>
            Serving about <b>{nf1.format(state.subLoad[hover.i])} MW</b> this hour
          </div>
          {parts.map((p) => (
            <div key={p.k} className="gf-tip-row">
              <span className="gf-dot" style={{ background: `var(${sourceMeta[p.k].cssVar})` }} />
              {sourceMeta[p.k].label} {nf1.format(p.v)} MW
            </div>
          ))}
        </>
      );
    } else {
      const b = model.buildings[hover.i];
      tip = (
        <>
          <b>{typeLabels[model.types[b[2]]] ?? model.types[b[2]]}</b>
          <div className="gf-tip-sub">Travis CAD improvement · parcel centre</div>
          <div>{nf0.format(b[3] / 1)} MWh a year (from your TCAD file)</div>
          <div>
            Running at <b>{nf0.format(bld.rel[hover.i] * 100)}%</b> of its own average right now
          </div>
          <div className="gf-tip-sub">Nearest substation: {model.subs[b[4]].name}</div>
        </>
      );
    }
  }

  return (
    <div ref={wrapRef} className="gf-closewrap">
      <canvas
        ref={canvasRef}
        className="gf-canvas"
        style={{ width: size.w, height: size.h }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Austin close-up: located commercial buildings, substations and the allocated flow from the plants into each substation for the chosen hour."
      />
      {tip && (
        <div
          className="gf-tip"
          style={{ left: Math.min(hover!.x + 14, size.w - 230), top: Math.max(6, Math.min(hover!.y + 14, size.h - 120)) }}
        >
          {tip}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Texas overview
// ---------------------------------------------------------------------------
function Overview({ model, state }: { model: FlowModel; state: HourState }) {
  const W = 640;
  const H = 600;
  const proj = useMemo(() => makeProjection(TEXAS_BOX, W, H, 10), []);
  const outline = useMemo(
    () => "M" + TEXAS_RING.map(([lo, la]) => proj(lo, la).map((v) => v.toFixed(1)).join(",")).join("L") + "Z",
    [proj],
  );
  const [ax, ay] = proj(AUSTIN.lon, AUSTIN.lat);
  const P = model.plants.length;
  const maxDel = Math.max(...state.plantMw, 1);
  const localMw = state.plantMw.reduce((a, v, i) => a + (model.plants[i].local ? v : 0), 0);

  const clusters = clusterLabels.map((c) => {
    const ps = model.plants.filter((p) => c.groups.includes(p.group));
    const lon = ps.reduce((a, p) => a + p.lon, 0) / ps.length;
    const lat = ps.reduce((a, p) => a + p.lat, 0) / ps.length;
    const mw = model.plants.reduce((a, p, i) => a + (c.groups.includes(p.group) ? state.plantMw[i] : 0), 0);
    return { ...c, pos: proj(lon, lat), mw };
  });
  const single = [
    { idx: 0, label: "South Texas Project" },
    { idx: 1, label: "Fayette" },
    { idx: 5, label: "Nacogdoches" },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="gf-overview" role="img" aria-label="Texas map: each Austin Energy plant and contract site, with a line to Austin whose width is the megawatts allocated to Austin load this hour.">
      <path d={outline} className="gf-texas" />
      {model.plants.map((p, i) => {
        if (p.local) return null;
        const [x, y] = proj(p.lon, p.lat);
        const mw = state.plantMw[i];
        if (mw < 1) return null;
        const mx = (x + ax) / 2;
        const my = (y + ay) / 2;
        const dx = ax - x;
        const dy = ay - y;
        const len = Math.hypot(dx, dy) || 1;
        const cx = mx - (dy / len) * len * 0.14;
        const cy = my + (dx / len) * len * 0.14;
        const k = sourceOf(p.group);
        return (
          <path
            key={p.name}
            d={`M${x.toFixed(1)},${y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ax.toFixed(1)},${ay.toFixed(1)}`}
            className="gf-oline"
            style={{ stroke: `var(${sourceMeta[k].cssVar})`, strokeWidth: 0.8 + 6.5 * Math.sqrt(mw / maxDel), opacity: 0.55 }}
          >
            <title>{`${p.name}: ${nf0.format(mw)} MW to Austin load`}</title>
          </path>
        );
      })}
      {model.plants.map((p, i) => {
        if (p.local) return null;
        const [x, y] = proj(p.lon, p.lat);
        const k = sourceOf(p.group);
        return (
          <circle
            key={"d" + i}
            cx={x}
            cy={y}
            r={3 + Math.sqrt(p.maxMw) / 3.5}
            className="gf-oplant"
            style={{ fill: `var(${sourceMeta[k].cssVar})` }}
          >
            <title>{`${p.name} (${p.county} County): ${nf0.format(state.plantMw[i])} MW allocated to Austin load, ${nf0.format(model.plants[i].maxMw)} MW peak`}</title>
          </circle>
        );
      })}
      {single.map((s) => {
        const [x, y] = proj(model.plants[s.idx].lon, model.plants[s.idx].lat);
        const right = x > W * 0.6;
        return (
          <text key={s.label} x={right ? x - 9 : x + 9} y={y + (s.idx === 1 ? 18 : 4)} textAnchor={right ? "end" : "start"} className="gf-olabel">
            {s.label} · {nf0.format(state.plantMw[s.idx])} MW
          </text>
        );
      })}
      {clusters.map((c) => (
        <text key={c.label} x={c.pos[0]} y={c.pos[1] - 24} textAnchor="middle" className="gf-olabel">
          {c.label} · {nf0.format(c.mw)} MW
        </text>
      ))}
      <circle cx={ax} cy={ay} r={9} className="gf-austin" />
      <text x={ax + 14} y={ay + 20} className="gf-olabel gf-olabel-strong">
        Austin
      </text>
      <text x={ax} y={ay - 30} textAnchor="middle" className="gf-olabel">
        Local gas and solar · {nf0.format(localMw)} MW
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// day strip
// ---------------------------------------------------------------------------
function DayStrip({ model, data, day, hour }: { model: FlowModel; data: HourlyFlow; day: number; hour: number }) {
  const rows = useMemo(() => computeDay(model, data, day), [model, data, day]);
  const W = 640;
  const H = 170;
  const m = { l: 40, r: 10, t: 12, b: 24 };
  const yMax = Math.max(...rows.map((r) => Math.max(r.load, r.gen))) * 1.08;
  const x = (i: number) => m.l + (i / 23) * (W - m.l - m.r);
  const y = (v: number) => H - m.b - (v / yMax) * (H - m.t - m.b);
  const order: SourceKey[] = ["nuclear", "coal", "gas", "peaker", "biomass", "wind", "solar", "ercot"];
  const cum = rows.map(() => 0);
  const areas = order.map((k) => {
    const top = rows.map((r, i) => (cum[i] += r.bySource[k]));
    const base = top.map((t, i) => t - rows[i].bySource[k]);
    const d =
      "M" + top.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("L") +
      "L" + base.map((v, i) => `${x(23 - i).toFixed(1)},${y(base[23 - i]).toFixed(1)}`).join("L") + "Z";
    return { k, d };
  });
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round((yMax * f) / 100) * 100);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="gf-day" role="img" aria-label="Sources serving Austin load across the chosen day, with a marker on the chosen hour.">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} className="gf-grid" />
          <text x={m.l - 6} y={y(t) + 3} textAnchor="end" className="gf-axis">
            {nf0.format(t)}
          </text>
        </g>
      ))}
      {areas.map((a) => (
        <path key={a.k} d={a.d} style={{ fill: `var(${sourceMeta[a.k].cssVar})` }} className="gf-area" />
      ))}
      <path d={"M" + rows.map((r, i) => `${x(i).toFixed(1)},${y(r.load).toFixed(1)}`).join("L")} className="gf-loadline" />
      <line x1={x(hour)} x2={x(hour)} y1={m.t} y2={H - m.b} className="gf-cursor" />
      {[0, 6, 12, 18, 23].map((i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="gf-axis">
          {i === 0 ? "12 am" : i === 12 ? "noon" : i > 12 ? i - 12 + " pm" : i + " am"}
        </text>
      ))}
      <text x={m.l} y={9} className="gf-axis">
        MW into Austin load · line is load
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// page
// ---------------------------------------------------------------------------
export default function GridFlowMap() {
  const [model, setModel] = useState<FlowModel | null>(null);
  const [data, setData] = useState<HourlyFlow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateIso, setDateIso] = useState(presets[0].date);
  const [hour, setHour] = useState(presets[0].hour);
  const [playing, setPlaying] = useState(false);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [animate, setAnimate] = useState(!reduced);
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    let live = true;
    fetch(MODEL_URL)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status + " for " + MODEL_URL);
        return r.json() as Promise<FlowModel>;
      })
      .then((m) => {
        if (!live) return;
        setModel(m);
        return fetch(HOURLY_URL)
          .then((r) => {
            if (!r.ok) throw new Error("HTTP " + r.status + " for " + HOURLY_URL);
            return r.text();
          })
          .then((t) => {
            if (live) setData(parseFlowCsv(t, m.plants.length));
          });
      })
      .catch((e: unknown) => {
        if (live) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const mo = new MutationObserver(() => setThemeTick((t) => t + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => mo.disconnect();
  }, []);

  const day = useMemo(() => (data ? Math.max(0, dayIndexOf(data.stamp, dateIso)) : 0), [data, dateIso]);
  const h = day * 24 + hour;

  useEffect(() => {
    if (!playing || !data) return;
    const id = window.setInterval(() => {
      setHour((hr) => {
        if (hr < 23) return hr + 1;
        // roll to the next day
        const d = new Date(Date.parse(dateIso + "T00:00:00Z") + 86400000);
        const iso = d.toISOString().slice(0, 10);
        if (iso > REFERENCE_END) {
          setPlaying(false);
          return hr;
        }
        setDateIso(iso);
        return 0;
      });
    }, 650);
    return () => window.clearInterval(id);
  }, [playing, data, dateIso]);

  const state = useMemo(() => (model && data ? computeHour(model, data, h) : null), [model, data, h]);
  const bld = useMemo(() => (model && data ? computeBuildings(model, data, h) : null), [model, data, h]);

  if (error) {
    return (
      <div className="gf-root">
        <h1 className="gf-h1">Austin Energy Power Flow Map</h1>
        <div className="gf-callout gf-callout-warn">
          <b>The map data did not load ({error}).</b> This page reads <code>{MODEL_URL}</code> and <code>{HOURLY_URL}</code>. Put{" "}
          <code>grid-flow-model.json</code> and <code>grid-flow-hourly-fy2024.csv</code> in the site's <code>public/data/</code> folder.
        </div>
      </div>
    );
  }
  if (!model || !data || !state || !bld) {
    return (
      <div className="gf-root">
        <h1 className="gf-h1">Austin Energy Power Flow Map</h1>
        <p className="gf-subhead">Loading {REFERENCE_LABEL}…</p>
      </div>
    );
  }

  const pre = presets.find((p) => p.date === dateIso && p.hour === hour);
  const topSubs = model.subs
    .map((s, j) => ({ s, j, mw: state.subLoad[j] }))
    .sort((a, b) => b.mw - a.mw)
    .slice(0, 8);
  const locatedMWh = model.buildings.reduce((a, b) => a + b[3], 0);

  return (
    <div className="gf-root">
      <div className="gf-eyebrow">Digital Twin · Phase 2</div>
      <h1 className="gf-h1">Austin Energy Power Flow Map</h1>
      <p className="gf-subhead">
        Pick any hour of {REFERENCE_LABEL} and see where Austin Energy's power comes from, how it is allocated across the substations in town, and which
        commercial buildings sit at the end of it.
      </p>
      <div className="gf-callout">
        <b>A schematic, not a power-flow study.</b> Real electricity cannot be traced from one plant to one building, and Austin Energy's network is not public.
        The map uses real hourly output for each plant, the Digital Twin's load, approximate substation points and your located buildings, then allocates the
        first to the second so every hour balances. Read it for scale and timing.
      </div>

      <div className="gf-controls" role="group" aria-label="Choose an hour">
        <div className="gf-presets">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              className={"gf-btn" + (pre?.key === p.key ? " gf-btn-on" : "")}
              onClick={() => {
                setPlaying(false);
                setDateIso(p.date);
                setHour(p.hour);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="gf-scrub">
          <label>
            <span className="gf-lab">Day</span>
            <input
              type="date"
              value={dateIso}
              min={REFERENCE_START}
              max={REFERENCE_END}
              onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.value && setDateIso(e.target.value)}
            />
          </label>
          <label className="gf-hourrange">
            <span className="gf-lab">Hour · {fmtStamp(state.stamp)}</span>
            <input type="range" min={0} max={23} value={hour} onChange={(e: ChangeEvent<HTMLInputElement>) => setHour(+e.target.value)} />
          </label>
          <button type="button" className="gf-btn" onClick={() => setPlaying((v) => !v)} aria-pressed={playing}>
            {playing ? "Pause" : "Play day"}
          </button>
          <label className="gf-check">
            <input type="checkbox" checked={animate} onChange={(e: ChangeEvent<HTMLInputElement>) => setAnimate(e.target.checked)} /> Animate flow
          </label>
        </div>
        {pre && <p className="gf-blurb">{pre.blurb}</p>}
      </div>

      <div className="gf-kpis">
        <div className="gf-kpi">
          <span className="gf-kpi-n">{nf0.format(state.load)}</span>
          <span className="gf-kpi-l">MW Austin load</span>
        </div>
        <div className="gf-kpi">
          <span className="gf-kpi-n">{nf0.format(state.gen)}</span>
          <span className="gf-kpi-l">MW fleet output</span>
        </div>
        <div className="gf-kpi">
          <span className="gf-kpi-n">{nf0.format(state.imported)}</span>
          <span className="gf-kpi-l">MW bought from ERCOT</span>
        </div>
        <div className="gf-kpi">
          <span className="gf-kpi-n">{nf0.format(state.exported)}</span>
          <span className="gf-kpi-l">MW sold into ERCOT</span>
        </div>
      </div>

      <div className="gf-maps">
        <section className="gf-panel">
          <h2 className="gf-h2">Where it comes from</h2>
          <p className="gf-cap">Line width is the megawatts each site contributes to Austin load this hour.</p>
          <Overview model={model} state={state} />
        </section>
        <section className="gf-panel gf-panel-wide">
          <h2 className="gf-h2">Where it goes in Austin</h2>
          <p className="gf-cap">
            Rings are substations, sized by the load allocated to them and centred on their dominant source. Heavy-ringed dots are 345 kV entry points. Dots are {nf0.format(model.buildings.length)} located
            commercial buildings, darker when they are running above their own average. Dashed lines show allocated flow from each entry point.
          </p>
          <CloseUp model={model} state={state} bld={bld} animate={animate} themeTick={themeTick} />
        </section>
      </div>

      <div className="gf-legend" aria-label="Source colours">
        {SOURCE_KEYS.map((k) => (
          <span key={k} className="gf-legend-i" title={sourceMeta[k].note}>
            <span className="gf-dot" style={{ background: `var(${sourceMeta[k].cssVar})` }} />
            {sourceMeta[k].label}
          </span>
        ))}
      </div>

      <div className="gf-two">
        <section className="gf-panel">
          <h2 className="gf-h2">The day around this hour</h2>
          <DayStrip model={model} data={data} day={day} hour={hour} />
        </section>
        <section className="gf-panel">
          <h2 className="gf-h2">What serves Austin this hour</h2>
          <table className="gf-table">
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col" className="gf-num">MW</th>
                <th scope="col" className="gf-num">Share</th>
              </tr>
            </thead>
            <tbody>
              {SOURCE_KEYS.map((k) => (
                <tr key={k}>
                  <th scope="row">
                    <span className="gf-dot" style={{ background: `var(${sourceMeta[k].cssVar})` }} />
                    {sourceMeta[k].label}
                  </th>
                  <td className="gf-num">{nf0.format(state.bySource[k])}</td>
                  <td className="gf-num">{nf0.format((state.bySource[k] / state.load) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="gf-panel">
        <h2 className="gf-h2">Biggest substations this hour</h2>
        <p className="gf-cap">Approximate locations; load is the allocated figure, with the mix of sources feeding it.</p>
        <table className="gf-table">
          <thead>
            <tr>
              <th scope="col">Substation</th>
              <th scope="col" className="gf-num">kV</th>
              <th scope="col" className="gf-num">MW</th>
              <th scope="col">Supply mix</th>
            </tr>
          </thead>
          <tbody>
            {topSubs.map(({ s, j, mw }) => (
              <tr key={s.id}>
                <th scope="row">{s.name.replace(/^Substation /, "Substation ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())}</th>
                <td className="gf-num">{s.kv}</td>
                <td className="gf-num">{nf1.format(mw)}</td>
                <td>
                  <div className="gf-mix" aria-hidden="true">
                    {SOURCE_KEYS.map((k) => (
                      <span key={k} style={{ width: (state.subBySource[k][j] / (mw || 1)) * 100 + "%", background: `var(${sourceMeta[k].cssVar})` }} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="gf-panel">
        <h2 className="gf-h2">What is real and what is assumed</h2>
        <ul className="gf-prov">
          {provenance.map((p) => (
            <li key={p.what}>
              <span className={"gf-tag gf-tag-" + p.tag}>{p.tag}</span>
              <div>
                <b>{p.what}.</b> {p.detail}
              </div>
            </li>
          ))}
        </ul>
        <h3 className="gf-h3">Assumptions you can change</h3>
        <ul className="gf-ass">
          {assumptions.map((a) => (
            <li key={a.label}>
              <b>{a.label}:</b> {a.value}. {a.why}
            </li>
          ))}
        </ul>
        <h3 className="gf-h3">Limits to keep in mind</h3>
        <ul className="gf-ass">
          {limitations.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        <p className="gf-foot">
          {nf0.format(model.buildings.length)} buildings placed ({nf1.format(locatedMWh / 1000)} GWh a year) across {model.subs.length} substations and{" "}
          {model.plants.length} plants and contracts.
        </p>
      </section>
    </div>
  );
}
