// AUSTIN ENERGY GRID FLOW MAP — engine.
// Pure functions: parse the hourly file, then for any hour allocate each plant's delivered MW
// to substations and each substation's load to buildings. Nothing here is a power-flow solution;
// it is a gravity-style allocation (iterative proportional fitting) that always balances:
//   every source gives exactly the MW it delivered, every substation receives exactly its load.

export interface PlantInfo {
  name: string;
  group: GroupKey;
  county: string;
  maxMw: number;
  lat: number;
  lon: number;
  entry: number; // index into subs: where this plant's power enters the Austin area
  local: boolean;
}
export interface SubInfo {
  id: string;
  name: string;
  city: string;
  kv: number;
  lat: number;
  lon: number;
}
export interface FlowModel {
  plants: PlantInfo[];
  subs: SubInfo[];
  types: string[];
  shape: number[][]; // [type][slot], slot = fiscalMonth*48 + (weekend?24:0) + hour
  share: number[][]; // [sub][slot], sums to 1 over subs
  K: number[][]; // [plant][sub] gravity kernel
  ercotK: number[]; // [sub] kernel for the "rest of ERCOT" source
  buildings: number[][]; // [lon, lat, typeIndex, annual thousand kWh, subIndex]
  fcSlot: number[]; // commercial share of system load by slot
  hubs: number[];
  FC: number;
  lam: number;
}
export type GroupKey =
  | "nuclear"
  | "coal"
  | "gasCC"
  | "gasGT"
  | "biomass"
  | "solarLocal"
  | "solarWest"
  | "windSouth"
  | "windWest";
export type SourceKey = "nuclear" | "coal" | "gas" | "peaker" | "biomass" | "solar" | "wind" | "ercot";
export const SOURCE_KEYS: SourceKey[] = ["nuclear", "coal", "gas", "peaker", "biomass", "solar", "wind", "ercot"];

export function sourceOf(g: GroupKey): SourceKey {
  switch (g) {
    case "gasCC":
      return "gas";
    case "gasGT":
      return "peaker";
    case "solarLocal":
    case "solarWest":
      return "solar";
    case "windSouth":
    case "windWest":
      return "wind";
    default:
      return g;
  }
}

export interface HourlyFlow {
  hours: number;
  stamp: string[];
  load: Float64Array;
  mw: Float64Array[]; // [plant][hour]
  slot: Uint16Array;
}

export function parseFlowCsv(text: string, plantCount: number): HourlyFlow {
  const lines = text.trim().split(/\r?\n/);
  const n = lines.length - 1;
  const stamp: string[] = new Array(n);
  const load = new Float64Array(n);
  const mw: Float64Array[] = [];
  for (let p = 0; p < plantCount; p++) mw.push(new Float64Array(n));
  const slot = new Uint16Array(n);
  for (let i = 0; i < n; i++) {
    const c = lines[i + 1].split(",");
    stamp[i] = c[0];
    load[i] = parseFloat(c[1]);
    for (let p = 0; p < plantCount; p++) mw[p][i] = parseFloat(c[2 + p]);
    const y = +c[0].slice(0, 4);
    const mo = +c[0].slice(5, 7);
    const d = +c[0].slice(8, 10);
    const hr = +c[0].slice(11, 13);
    const dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
    const fm = (mo - 10 + 12) % 12; // fiscal month: Oct = 0
    slot[i] = fm * 48 + (dow === 0 || dow === 6 ? 24 : 0) + hr;
  }
  return { hours: n, stamp, load, mw, slot };
}

export interface HourState {
  h: number;
  stamp: string;
  load: number;
  gen: number;
  delivered: number;
  exported: number;
  imported: number;
  plantMw: number[]; // delivered MW per plant (after any export curtailment of the share)
  subLoad: number[]; // MW per substation
  flow: Float64Array; // [(P+1) * ns] — source-major, last source = rest of ERCOT
  bySource: Record<SourceKey, number>; // MW delivered to load by source category
  subBySource: Record<SourceKey, Float64Array>; // MW into each substation by category
}

export function ipf(g: number[], s: number[], K: number[][], iterations = 40): Float64Array {
  const P = g.length;
  const ns = s.length;
  const out = new Float64Array(P * ns);
  const sumG = g.reduce((a, b) => a + b, 0);
  const sumS = s.reduce((a, b) => a + b, 0);
  if (sumG <= 1e-9 || sumS <= 1e-9) return out;
  const gg = g.map((x) => Math.max(x, 1e-9) * (sumS / sumG));
  const a = new Float64Array(P).fill(1);
  const b = new Float64Array(ns).fill(1);
  for (let it = 0; it < iterations; it++) {
    for (let p = 0; p < P; p++) {
      let d = 0;
      for (let j = 0; j < ns; j++) d += K[p][j] * b[j];
      a[p] = gg[p] / (d || 1e-12);
    }
    for (let j = 0; j < ns; j++) {
      let d = 0;
      for (let p = 0; p < P; p++) d += K[p][j] * a[p];
      b[j] = s[j] / (d || 1e-12);
    }
  }
  for (let p = 0; p < P; p++) for (let j = 0; j < ns; j++) out[p * ns + j] = a[p] * K[p][j] * b[j];
  return out;
}

export function computeHour(model: FlowModel, data: HourlyFlow, h: number): HourState {
  const P = model.plants.length;
  const ns = model.subs.length;
  const load = data.load[h];
  let gen = 0;
  for (let p = 0; p < P; p++) gen += data.mw[p][h];
  const delivered = Math.min(gen, load);
  const scale = gen > 0 ? delivered / gen : 0;
  const imported = Math.max(0, load - gen);
  const exported = Math.max(0, gen - load);
  const plantMw: number[] = [];
  for (let p = 0; p < P; p++) plantMw.push(data.mw[p][h] * scale);
  const sl = data.slot[h];
  // The supplied shares are rounded, so normalize them to keep delivered MW
  // exactly equal to system load rather than gaining or losing a small remainder.
  const shares = model.share.map((row) => row[sl]);
  const shareTotal = shares.reduce((sum, value) => sum + value, 0);
  const subLoad: number[] = shares.map((share) => share * (shareTotal > 0 ? load / shareTotal : 0));
  const g = plantMw.concat([imported]);
  const K = model.K.concat([model.ercotK]);
  const flow = ipf(g, subLoad, K);
  const bySource = {} as Record<SourceKey, number>;
  const subBySource = {} as Record<SourceKey, Float64Array>;
  SOURCE_KEYS.forEach((k) => {
    bySource[k] = 0;
    subBySource[k] = new Float64Array(ns);
  });
  for (let p = 0; p <= P; p++) {
    const key: SourceKey = p === P ? "ercot" : sourceOf(model.plants[p].group);
    for (let j = 0; j < ns; j++) {
      const v = flow[p * ns + j];
      bySource[key] += v;
      subBySource[key][j] += v;
    }
  }
  return { h, stamp: data.stamp[h], load, gen, delivered, exported, imported, plantMw, subLoad, flow, bySource, subBySource };
}

export interface BuildingState {
  rel: Float32Array; // running at x times its own annual average
}

/** Relative load of every located building at hour h: its type's shape for this slot, scaled so the
 *  commercial share of system load is spread across buildings pro rata to annual kWh x shape. */
export function computeBuildings(model: FlowModel, data: HourlyFlow, h: number): BuildingState {
  const sl = data.slot[h];
  const nb = model.buildings.length;
  let W = 0;
  const w = new Float64Array(nb);
  for (let i = 0; i < nb; i++) {
    const b = model.buildings[i];
    w[i] = b[3] * model.shape[b[2]][sl];
    W += w[i];
  }
  const fc = model.fcSlot[sl];
  const rel = new Float32Array(nb);
  const hoursPerYear = 8784;
  for (let i = 0; i < nb; i++) {
    const b = model.buildings[i];
    // kW_b = load*fc*1000 * w_b / W ; average kW_b = kWh/8784
    rel[i] = (data.load[h] * fc * 1000 * (w[i] / W)) / ((b[3] * 1000) / hoursPerYear);
  }
  return { rel };
}

export interface DayRow {
  load: number;
  bySource: Record<SourceKey, number>;
  gen: number;
}

export function computeDay(model: FlowModel, data: HourlyFlow, day: number): DayRow[] {
  const rows: DayRow[] = [];
  for (let i = 0; i < 24; i++) {
    const h = day * 24 + i;
    const bySource = {} as Record<SourceKey, number>;
    SOURCE_KEYS.forEach((k) => (bySource[k] = 0));
    let gen = 0;
    const load = data.load[h];
    for (let p = 0; p < model.plants.length; p++) gen += data.mw[p][h];
    const scale = gen > 0 ? Math.min(1, load / gen) : 0;
    for (let p = 0; p < model.plants.length; p++) bySource[sourceOf(model.plants[p].group)] += data.mw[p][h] * scale;
    bySource.ercot = Math.max(0, load - gen);
    rows.push({ load, bySource, gen });
  }
  return rows;
}

export function dayIndexOf(stamps: string[], iso: string): number {
  const i = stamps.indexOf(iso + "T00");
  return i >= 0 ? i / 24 : -1;
}
