// This module has no imports on purpose: the same source is loaded by
// scripts/populate_solar_db.mjs so the database-side derate and the UI can never drift.

export interface SolarPanel {
  lat: number;
  lon: number;
  orientation: "LANDSCAPE" | "PORTRAIT";
  yearlyEnergyDcKwh: number;
  segmentIndex: number;
}

export interface CommercialFilterResult {
  panels: SolarPanel[];
  walkwayPanels: SolarPanel[];
  debugHoles: { lat: number; lon: number }[];
  /** Closed ring(s) tracing the outer wall of the panel array. */
  edgeSegments: { lat: number; lon: number }[][];
  setbackCount: number;
  tsrfCount: number;
  walkwayCount: number;
}

/**
 * Bump when the algorithm changes in a way that invalidates stored results, so rows
 * written by an older version can be found and recomputed.
 */
export const SOLAR_FILTER_VERSION = 1;

/** Default closing radius used when tracing the roof border, in metres. */
export const BORDER_SMOOTH_M = 4;

const AUSTIN_REF_HRS = 1950;
const RAD = Math.PI / 180;
const M_PER_DEG_LAT = 111320;
const SETBACK_M = 1.22; // 4 ft
const TSRF_MIN = 0.75;
const MIN_HOLE_CELLS = 2;
const MAX_GRID_CELLS = 4_000_000;

function toXY(lat: number, lon: number, refLat: number, refLon: number, mPerDegLon: number) {
  return { x: (lon - refLon) * mPerDegLon, y: (lat - refLat) * M_PER_DEG_LAT };
}

/**
 * Orientation of the panel lattice, measured from the panels themselves.
 *
 * Google's roofSegmentStats azimuth describes the slope direction of a roof plane. On
 * a flat commercial roof that is arbitrary (commonly 0/180) and says nothing about how
 * the array is laid out, so rotating the grid by it leaves a diagonal lattice sitting
 * on a cardinal grid — which fabricates gaps between every panel. The lattice angle is
 * instead the modal direction of nearest-neighbour vectors, taken mod 90 degrees since
 * the two lattice axes are perpendicular.
 *
 * Returns radians in [0, PI/2).
 */
function latticeAngle(pts: { x: number; y: number }[]): number {
  const n = pts.length;
  if (n < 8) return 0;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const approx = Math.max(0.5, Math.sqrt(((maxX - minX) * (maxY - minY)) / n) || 1);
  const cell = approx * 1.5;

  const buckets = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const k = `${Math.floor(pts[i].x / cell)},${Math.floor(pts[i].y / cell)}`;
    const b = buckets.get(k);
    if (b) b.push(i); else buckets.set(k, [i]);
  }

  const HALF_PI = Math.PI / 2;
  const BINS = 90; // one degree
  const hist = new Float64Array(BINS);
  const sums = new Float64Array(BINS);
  const angles: number[] = [];

  const step = n > 4000 ? Math.ceil(n / 4000) : 1;
  for (let i = 0; i < n; i += step) {
    const p = pts[i];
    const bx = Math.floor(p.x / cell), by = Math.floor(p.y / cell);
    let bestD = Infinity, bestJ = -1;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const b = buckets.get(`${bx + dx},${by + dy}`);
        if (!b) continue;
        for (const j of b) {
          if (j === i) continue;
          const d = (pts[j].x - p.x) ** 2 + (pts[j].y - p.y) ** 2;
          if (d < bestD) { bestD = d; bestJ = j; }
        }
      }
    }
    if (bestJ < 0 || bestD > span * span) continue;
    let a = Math.atan2(pts[bestJ].y - p.y, pts[bestJ].x - p.x);
    a = ((a % HALF_PI) + HALF_PI) % HALF_PI;
    const bin = Math.min(BINS - 1, Math.floor((a / HALF_PI) * BINS));
    hist[bin] += 1;
    sums[bin] += a;
    angles.push(a);
  }

  let bestBin = -1, bestCount = 0;
  for (let b = 0; b < BINS; b++) if (hist[b] > bestCount) { bestCount = hist[b]; bestBin = b; }
  if (bestBin < 0 || bestCount === 0) return 0;
  const coarse = sums[bestBin] / hist[bestBin];

  // Refine by circular mean. Binning alone leaves up to half a degree of error, and the
  // grid indices are derived by dividing coordinates by the pitch, so that error
  // accumulates as position drift across the array and starts fabricating gaps. Angles
  // have 90-degree symmetry here, so averaging exp(4i*a) and dividing the argument by 4
  // gives a least-squares mean with no quantisation error and no wraparound seam.
  // Restricting to vectors near the coarse mode keeps a second array at a different
  // orientation from dragging the estimate off.
  const TOL = 10 * RAD;
  let sx = 0, sy = 0;
  for (const a of angles) {
    let d = a - coarse;
    if (d > HALF_PI / 2) d -= HALF_PI;
    if (d < -HALF_PI / 2) d += HALF_PI;
    if (Math.abs(d) > TOL) continue;
    sx += Math.cos(4 * a);
    sy += Math.sin(4 * a);
  }
  if (sx === 0 && sy === 0) return ((coarse % HALF_PI) + HALF_PI) % HALF_PI;
  const angle = Math.atan2(sy, sx) / 4;
  return ((angle % HALF_PI) + HALF_PI) % HALF_PI;
}

// Lattice-aligned coords: rotate by -theta so the array's rows/columns run along u/v.
function toUV(x: number, y: number, sinT: number, cosT: number) {
  return { u: x * cosT + y * sinT, v: -x * sinT + y * cosT };
}

/**
 * Panel pitch along axis `a`, measured *within* rows grouped on axis `b`.
 *
 * Measuring gaps across the whole sorted axis mixes rows from different roof
 * sections (and different buildings), whose arbitrary offsets inject gaps that are
 * not multiples of the pitch. Inside one row, consecutive panels are exactly one
 * pitch apart, so the mode of intra-row gaps is unambiguous.
 */
function pitchAlong(pts: { a: number; b: number }[]): number {
  const ROW_TOL = 0.35;
  const sorted = [...pts].sort((x, y) => x.b - y.b || x.a - y.a);

  const diffs: number[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && sorted[j].b - sorted[j - 1].b <= ROW_TOL) j++;
    const row = sorted.slice(i, j).map(p => p.a).sort((x, y) => x - y);
    for (let k = 1; k < row.length; k++) {
      const d = row[k] - row[k - 1];
      if (d > 0.2 && d < 6) diffs.push(d);
    }
    i = j;
  }
  if (!diffs.length) return 1.5;

  // Mode over 0.05 m bins, refined to the mean of the winning bin.
  const BIN = 0.05;
  const hist = new Map<number, { n: number; sum: number }>();
  for (const d of diffs) {
    const b = Math.round(d / BIN);
    const e = hist.get(b) ?? { n: 0, sum: 0 };
    e.n++; e.sum += d;
    hist.set(b, e);
  }
  let best = { n: 0, sum: 0, count: 1 };
  for (const e of hist.values()) if (e.n > best.n) best = { n: e.n, sum: e.sum, count: e.n };
  const pitch = best.sum / best.count;
  return Math.min(6, Math.max(0.4, pitch));
}

/**
 * Phase of the panel lattice along one axis, in [0, cell).
 *
 * Coordinates are measured from the array centroid, which has no reason to sit on a
 * lattice point. Without correcting for that, round(coord/cell) snaps every panel to a
 * grid displaced by up to half a cell, and while each panel still lands in its own cell
 * (the error is common to all of them), reconstructed cell centres — and therefore the
 * traced border — come out shifted. Averaged as an angle so the wrap at 0/cell is not a
 * discontinuity.
 */
function latticePhase(values: number[], cell: number): number {
  let sx = 0, sy = 0;
  for (const v of values) {
    const a = (2 * Math.PI * (((v % cell) + cell) % cell)) / cell;
    sx += Math.cos(a);
    sy += Math.sin(a);
  }
  if (sx === 0 && sy === 0) return 0;
  let a = Math.atan2(sy, sx);
  if (a < 0) a += 2 * Math.PI;
  return (a / (2 * Math.PI)) * cell;
}

// ---- Grid helpers ----
const gkey = (gu: number, gv: number) => `${gu},${gv}`;
const gparse = (k: string): [number, number] => {
  const c = k.indexOf(",");
  return [+k.slice(0, c), +k.slice(c + 1)];
};
const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Grow a cell set by `r` steps (4-connectivity), staying inside the bbox. */
function dilate(src: Set<string>, r: number, inB: (u: number, v: number) => boolean): Set<string> {
  if (r <= 0) return new Set(src);
  const out = new Set(src);
  let frontier = [...src];
  for (let step = 0; step < r; step++) {
    const next: string[] = [];
    for (const k of frontier) {
      const [u, v] = gparse(k);
      for (const [du, dv] of DIRS) {
        const nu = u + du, nv = v + dv;
        if (!inB(nu, nv)) continue;
        const nk = gkey(nu, nv);
        if (!out.has(nk)) { out.add(nk); next.push(nk); }
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return out;
}

/**
 * Rectilinear outline of a filled cell set.
 *
 * Emits one boundary edge per filled/empty cell face, wound counter-clockwise so the
 * filled region is always on the left, then chains the edges into closed rings. The
 * longest ring is the outer wall; shorter rings are interior voids. Because it walks
 * actual cell faces, any union of axis-aligned rectangles comes out exact — every
 * concave corner of an L or T shape is preserved.
 */
function traceRings(filled: Set<string>): [number, number][][] {
  // Cell (gu,gv) spans corners (gu,gv)..(gu+1,gv+1) in lattice space.
  const out = new Map<string, string[]>();
  const vkey = (a: number, b: number) => `${a},${b}`;
  const push = (from: [number, number], to: [number, number]) => {
    const k = vkey(from[0], from[1]);
    const arr = out.get(k);
    if (arr) arr.push(vkey(to[0], to[1]));
    else out.set(k, [vkey(to[0], to[1])]);
  };

  for (const k of filled) {
    const [gu, gv] = gparse(k);
    if (!filled.has(gkey(gu, gv - 1))) push([gu, gv], [gu + 1, gv]);         // bottom
    if (!filled.has(gkey(gu + 1, gv))) push([gu + 1, gv], [gu + 1, gv + 1]); // right
    if (!filled.has(gkey(gu, gv + 1))) push([gu + 1, gv + 1], [gu, gv + 1]); // top
    if (!filled.has(gkey(gu - 1, gv))) push([gu, gv + 1], [gu, gv]);         // left
  }

  const rings: [number, number][][] = [];
  for (const [start] of out) {
    while ((out.get(start)?.length ?? 0) > 0) {
      const ring: [number, number][] = [];
      let cur = start;
      while (true) {
        const nexts = out.get(cur);
        if (!nexts?.length) break;
        const nxt = nexts.pop()!;
        const [a, b] = nxt.split(",");
        ring.push([+a, +b]);
        cur = nxt;
        if (cur === start) break;
      }
      if (ring.length >= 4) rings.push(ring);
    }
  }

  // Drop the redundant mid-points of straight runs.
  return rings.map(ring => {
    const s: [number, number][] = [];
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const p = ring[(i - 1 + n) % n], c = ring[i], q = ring[(i + 1) % n];
      const cross = (c[0] - p[0]) * (q[1] - c[1]) - (c[1] - p[1]) * (q[0] - c[0]);
      if (cross !== 0) s.push(c);
    }
    return s.length >= 4 ? s : ring;
  }).sort((a, b) => b.length - a.length);
}

/** Perpendicular distance from p to the infinite line through a and b. */
function perpDist(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Douglas-Peucker on an open polyline (iterative, so long rings can't blow the stack). */
function rdp(pts: [number, number][], tol: number): [number, number][] {
  const n = pts.length;
  if (n < 3) return pts.slice();
  const keep = new Uint8Array(n);
  keep[0] = 1; keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [i, j] = stack.pop()!;
    let maxD = -1, maxI = -1;
    for (let k = i + 1; k < j; k++) {
      const d = perpDist(pts[k], pts[i], pts[j]);
      if (d > maxD) { maxD = d; maxI = k; }
    }
    if (maxI > 0 && maxD > tol) {
      keep[maxI] = 1;
      stack.push([i, maxI], [maxI, j]);
    }
  }
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[i]);
  return out;
}

/**
 * Simplify a closed ring, free of any right-angle assumption.
 *
 * The traced outline is a staircase because it follows grid cell faces, but a real roof
 * wall may run at any angle. Douglas-Peucker keeps only vertices that deviate from the
 * chord by more than `tol`, so a staircase along a diagonal wall collapses to a single
 * slanted edge while genuine corners — the points of maximum deviation — are retained
 * exactly. Angles in the output are unconstrained.
 *
 * The ring is split at its two most widely separated vertices so that both anchors are
 * certain to be real corners; simplifying a closed loop from an arbitrary start point
 * would otherwise pin a meaningless vertex in place.
 */
function simplifyClosed(ring: [number, number][], tol: number): [number, number][] {
  const n = ring.length;
  if (n < 5 || tol <= 0) return ring.slice();

  let cx = 0, cy = 0;
  for (const p of ring) { cx += p[0]; cy += p[1]; }
  cx /= n; cy /= n;

  let ai = 0, ad = -1;
  for (let i = 0; i < n; i++) {
    const d = (ring[i][0] - cx) ** 2 + (ring[i][1] - cy) ** 2;
    if (d > ad) { ad = d; ai = i; }
  }
  let bi = ai, bd = -1;
  for (let i = 0; i < n; i++) {
    const d = (ring[i][0] - ring[ai][0]) ** 2 + (ring[i][1] - ring[ai][1]) ** 2;
    if (d > bd) { bd = d; bi = i; }
  }
  if (bi === ai) return ring.slice();

  const chain = (from: number, to: number) => {
    const out: [number, number][] = [];
    for (let i = from; ; i = (i + 1) % n) {
      out.push(ring[i]);
      if (i === to) break;
    }
    return out;
  };

  const s1 = rdp(chain(ai, bi), tol);
  const s2 = rdp(chain(bi, ai), tol);
  const merged = [...s1.slice(0, -1), ...s2.slice(0, -1)];
  return merged.length >= 3 ? merged : ring.slice();
}

/** Even-odd ray cast: is p strictly inside the closed polygon? */
function pointInPolygon(p: [number, number], poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) &&
        p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Shortest distance from p to the polygon's boundary (not its interior). */
function distToPolygon(p: [number, number], poly: [number, number][]): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const d = perpDistSegment(p, poly[j], poly[i]);
    if (d < best) best = d;
  }
  return best;
}

/** Distance from p to the finite segment ab (perpDist uses the infinite line). */
function perpDistSegment(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function ringArea(ring: [number, number][]): number {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/**
 * Commercial rooftop filters.
 *
 * smoothM sets how much outline detail is treated as noise: notches and protrusions
 * narrower than roughly 2*smoothM are straightened away so the border follows the
 * building's real walls instead of every one-panel jog. Set it to 0 for a raw
 * staircase outline.
 */
export function applyCommercialFilters(
  allPanels: SolarPanel[],
  segmentAzimuths: Record<number, number> = {},
  smoothM = BORDER_SMOOTH_M,
): CommercialFilterResult {
  const empty: CommercialFilterResult = {
    panels: [], walkwayPanels: [], debugHoles: [], edgeSegments: [],
    setbackCount: 0, tsrfCount: 0, walkwayCount: 0,
  };
  if (!allPanels.length) return empty;

  const refLat = allPanels.reduce((s, p) => s + p.lat, 0) / allPanels.length;
  const refLon = allPanels.reduce((s, p) => s + p.lon, 0) / allPanels.length;
  const mPerDegLon = M_PER_DEG_LAT * Math.cos(refLat * RAD);

  const xys = allPanels.map(p => toXY(p.lat, p.lon, refLat, refLon, mPerDegLon));

  // === Lattice-aligned grid ===
  // Measured from the panel positions; Google's segment azimuth only serves as a
  // fallback when there are too few panels to infer an orientation.
  let theta = latticeAngle(xys);
  if (theta === 0 && allPanels.length < 8) {
    const segCount: Record<number, number> = {};
    for (const p of allPanels) segCount[p.segmentIndex] = (segCount[p.segmentIndex] ?? 0) + 1;
    const primarySeg = +Object.entries(segCount).sort(([, a], [, b]) => b - a)[0][0];
    theta = ((segmentAzimuths[primarySeg] ?? 0) * RAD) % (Math.PI / 2);
  }
  const sinT = Math.sin(theta), cosT = Math.cos(theta);

  const uvs = xys.map(p => toUV(p.x, p.y, sinT, cosT));
  const uvToLatLon = (u: number, v: number) => {
    const x = u * cosT - v * sinT;
    const y = u * sinT + v * cosT;
    return { lat: refLat + y / M_PER_DEG_LAT, lon: refLon + x / mPerDegLon };
  };

  const pitchU = pitchAlong(uvs.map(p => ({ a: p.u, b: p.v })));
  const pitchV = pitchAlong(uvs.map(p => ({ a: p.v, b: p.u })));
  // The cell must equal the pitch exactly. Inflating it compresses round(coord/cell)
  // until adjacent panels collide into one cell, which both loses panels and fabricates
  // gaps; the rounding itself already tolerates jitter of up to half a pitch.
  const cellU = pitchU;
  const cellV = pitchV;
  const phaseU = latticePhase(uvs.map(p => p.u), cellU);
  const phaseV = latticePhase(uvs.map(p => p.v), cellV);
  // Grid index <-> metres, both anchored on the measured lattice phase.
  const toGu = (u: number) => Math.round((u - phaseU) / cellU);
  const toGv = (v: number) => Math.round((v - phaseV) / cellV);
  const guToU = (gu: number) => gu * cellU + phaseU;
  const gvToV = (gv: number) => gv * cellV + phaseV;
  const minCell = Math.min(pitchU, pitchV);

  const panelCellMap = new Map<string, number>();
  for (let i = 0; i < allPanels.length; i++) {
    const k = gkey(toGu(uvs[i].u), toGv(uvs[i].v));
    if (!panelCellMap.has(k)) panelCellMap.set(k, i);
  }
  const filled = new Set(panelCellMap.keys());

  const gus = [...filled].map(k => gparse(k)[0]);
  const gvs = [...filled].map(k => gparse(k)[1]);
  const pad = Math.max(4, Math.ceil(smoothM / minCell) + 2);
  const minGu = Math.min(...gus) - pad, maxGu = Math.max(...gus) + pad;
  const minGv = Math.min(...gvs) - pad, maxGv = Math.max(...gvs) + pad;
  if ((maxGu - minGu + 1) * (maxGv - minGv + 1) > MAX_GRID_CELLS) return empty;
  const inB = (u: number, v: number) => u >= minGu && u <= maxGu && v >= minGv && v <= maxGv;

  // === Border: closing, trace, then straighten ===
  // The closing has to be wide enough to bridge the walkway channels between wings,
  // otherwise the outline dives into them instead of wrapping the building. Corner
  // rounding introduced here is cleaned up afterwards by simplifyClosed.
  const detailCells = Math.max(0, Math.round(smoothM / minCell));
  const r = Math.min(8, detailCells);
  let closed = filled;
  if (r > 0) {
    const grown = dilate(filled, r, inB);
    const complement = new Set<string>();
    for (let gu = minGu; gu <= maxGu; gu++) {
      for (let gv = minGv; gv <= maxGv; gv++) {
        const k = gkey(gu, gv);
        if (!grown.has(k)) complement.add(k);
      }
    }
    const compGrown = dilate(complement, r, inB);
    closed = new Set<string>();
    for (const k of grown) if (!compGrown.has(k)) closed.add(k);
    for (const k of filled) closed.add(k); // never shrink below the real panels
  }

  // traceRings winds filled regions counter-clockwise (positive shoelace area) and
  // interior voids clockwise, so discarding negative rings drops the channels and
  // courtyards inside the array. Of the outer walls that remain we keep only the
  // largest: the result is a single polygon wrapping the building.
  const outerRings = traceRings(closed)
    .filter(ring => ringArea(ring) > 0)
    .sort((a, b) => ringArea(b) - ringArea(a));

  // Simplify in metres, not grid cells, so the tolerance means a real distance and the
  // resulting edges are free to sit at any angle. This polygon is kept in (u,v) metres
  // because the setback below is measured against it directly.
  const simplifyTolM = Math.max(0.75, smoothM * 0.4);
  const borderUV: [number, number][] = outerRings.length
    ? simplifyClosed(
        outerRings[0].map(([cu, cv]) => [guToU(cu - 0.5), gvToV(cv - 0.5)] as [number, number]),
        simplifyTolM,
      )
    : [];

  const edgeSegments = borderUV.length
    ? [(() => {
        const pts = borderUV.map(([u, v]) => uvToLatLon(u, v));
        return [...pts, pts[0]]; // close the ring
      })()]
    : [];

  // === Setback: remove panels within SETBACK_M of the border polygon ===
  // Measured as a true perpendicular distance to the polygon that gets drawn, rather
  // than by counting grid cells: the border is simplified by up to simplifyTolM, which
  // is larger than the setback itself, so a cell-quantised erosion of the raw staircase
  // would cut against a boundary that is not the one on screen. Panels that the
  // simplification left outside the polygon are dropped as well.
  const setbackRemoved = new Set<number>();
  if (borderUV.length >= 3) {
    for (let i = 0; i < allPanels.length; i++) {
      const p: [number, number] = [uvs[i].u, uvs[i].v];
      if (!pointInPolygon(p, borderUV) || distToPolygon(p, borderUV) < SETBACK_M) {
        setbackRemoved.add(i);
      }
    }
  }

  // Grid view of the same result, for the walkway router below.
  const setbackCells = new Set<string>();
  for (const idx of setbackRemoved) {
    setbackCells.add(gkey(toGu(uvs[idx].u), toGv(uvs[idx].v)));
  }

  // === TSRF filter ===
  const tsrfRemoved = new Set<number>();
  for (let i = 0; i < allPanels.length; i++) {
    if (setbackRemoved.has(i)) continue;
    if (allPanels[i].yearlyEnergyDcKwh / (0.4 * AUSTIN_REF_HRS) < TSRF_MIN) tsrfRemoved.add(i);
  }

  // === Interior holes ===
  // Flood the raw (unclosed) empty space from outside; whatever it cannot reach is
  // enclosed by panels on all sides, i.e. a real void inside the array. Ragged notches
  // along the border stay connected to the outside and are correctly excluded.
  const rawOutside = new Set<string>();
  {
    const q: [number, number][] = [[minGu, minGv]];
    rawOutside.add(gkey(minGu, minGv));
    let i = 0;
    while (i < q.length) {
      const [u, v] = q[i++];
      for (const [du, dv] of DIRS) {
        const nu = u + du, nv = v + dv;
        if (!inB(nu, nv)) continue;
        const k = gkey(nu, nv);
        if (rawOutside.has(k) || filled.has(k)) continue;
        rawOutside.add(k);
        q.push([nu, nv]);
      }
    }
  }

  const interiorHoles = new Set<string>();
  for (let gu = minGu + 1; gu < maxGu; gu++) {
    for (let gv = minGv + 1; gv < maxGv; gv++) {
      const k = gkey(gu, gv);
      if (!filled.has(k) && !rawOutside.has(k)) interiorHoles.add(k);
    }
  }

  const debugHoles: { lat: number; lon: number }[] = [];
  for (const k of interiorHoles) {
    const [gu, gv] = gparse(k);
    debugHoles.push(uvToLatLon(guToU(gu), gvToV(gv)));
  }

  // Connected components of holes
  const seen = new Set<string>();
  const holeComponents: Set<string>[] = [];
  for (const seed of interiorHoles) {
    if (seen.has(seed)) continue;
    const comp = new Set<string>([seed]);
    seen.add(seed);
    const q: string[] = [seed];
    let i = 0;
    while (i < q.length) {
      const [u, v] = gparse(q[i++]);
      for (const [du, dv] of DIRS) {
        const nk = gkey(u + du, v + dv);
        if (!seen.has(nk) && interiorHoles.has(nk)) { seen.add(nk); comp.add(nk); q.push(nk); }
      }
    }
    holeComponents.push(comp);
  }

  // === Walkways: 0-1 BFS from each hole out to the setback band ===
  const walkwayCells = new Set<string>();
  for (const comp of holeComponents) {
    if (comp.size < MIN_HOLE_CELLS) continue;

    const dist = new Map<string, number>();
    const prev = new Map<string, string>();
    const deque: string[] = [];
    for (const k of comp) { dist.set(k, 0); deque.push(k); }

    let exitFrom: string | null = null;

    bfs: while (deque.length) {
      const k = deque.shift()!;
      const d = dist.get(k)!;
      const [u, v] = gparse(k);
      for (const [du, dv] of DIRS) {
        const nu = u + du, nv = v + dv;
        if (!inB(nu, nv)) continue;
        const nk = gkey(nu, nv);

        if (setbackCells.has(nk) || rawOutside.has(nk)) { exitFrom = k; break bfs; }

        const isPanel = filled.has(nk) && !setbackCells.has(nk);
        const isFree = interiorHoles.has(nk);
        if (!isPanel && !isFree) continue;

        const nd = d + (isPanel ? 1 : 0);
        if (dist.has(nk) && dist.get(nk)! <= nd) continue;
        dist.set(nk, nd);
        prev.set(nk, k);
        if (isPanel) deque.push(nk); else deque.unshift(nk);
      }
    }

    if (exitFrom) {
      let cur: string | undefined = exitFrom;
      while (cur !== undefined && !comp.has(cur)) {
        if (filled.has(cur) && !setbackCells.has(cur)) walkwayCells.add(cur);
        cur = prev.get(cur);
      }
    }
  }

  const walkwayRemoved = new Set<number>();
  for (const k of walkwayCells) {
    const idx = panelCellMap.get(k);
    if (idx !== undefined && !setbackRemoved.has(idx) && !tsrfRemoved.has(idx)) walkwayRemoved.add(idx);
  }

  const panels: SolarPanel[] = [];
  const walkwayPanels: SolarPanel[] = [];
  for (let i = 0; i < allPanels.length; i++) {
    if (setbackRemoved.has(i) || tsrfRemoved.has(i)) continue;
    if (walkwayRemoved.has(i)) walkwayPanels.push(allPanels[i]);
    else panels.push(allPanels[i]);
  }

  return {
    panels, walkwayPanels, debugHoles, edgeSegments,
    setbackCount: setbackRemoved.size,
    tsrfCount: tsrfRemoved.size,
    walkwayCount: walkwayRemoved.size,
  };
}

/**
 * The derate policy, in one place: every property type gets the 75% TSRF cut, and
 * commercial roofs additionally get roof-edge detection (perimeter setback measured off
 * the traced border, plus walkways routed out from interior HVAC voids).
 *
 * Both the UI and scripts/populate_solar_db.mjs call this, so the capacity stored in the
 * database is by construction the same number the site displays.
 */
export function applySolarFilters(
  panels: SolarPanel[],
  opts: {
    propertyType?: string | null;
    azimuths?: Record<number, number>;
    smoothM?: number;
  } = {},
): CommercialFilterResult {
  const { propertyType, azimuths = {}, smoothM = BORDER_SMOOTH_M } = opts;

  if (!panels.length) {
    return {
      panels: [], walkwayPanels: [], debugHoles: [], edgeSegments: [],
      setbackCount: 0, tsrfCount: 0, walkwayCount: 0,
    };
  }

  if (propertyType === "commercial") {
    return applyCommercialFilters(panels, azimuths, smoothM);
  }

  const kept = panels.filter(p => p.yearlyEnergyDcKwh / (0.4 * AUSTIN_REF_HRS) >= TSRF_MIN);
  return {
    panels: kept,
    walkwayPanels: [],
    debugHoles: [],
    edgeSegments: [],
    setbackCount: 0,
    tsrfCount: panels.length - kept.length,
    walkwayCount: 0,
  };
}
